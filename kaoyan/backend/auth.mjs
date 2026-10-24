// Standard Web APIs only. Sessions work on the site's own HTTPS origin.
// Login limits are per process / Cloudflare isolate, not a distributed quota.
export const SESSION_COOKIE = '__Host-kaoyan-session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const LOGIN_BODY_LIMIT = 2048;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const authKeys = new WeakMap();
const loginLimits = new WeakMap();
const authEncoder = new TextEncoder();

function authNow(value = Date.now) {
  const time = Number(typeof value === 'function' ? value() : value);
  if (!Number.isFinite(time)) throw new Error('Invalid clock.');
  return time;
}
function authConfigValid(config) {
  return config && typeof config.accessToken === 'string' && config.accessToken.length >= 32 &&
    config.accessToken.length <= 512 && Array.isArray(config.allowedOrigins);
}
function authKey(config) {
  if (!authKeys.has(config)) authKeys.set(config, crypto.subtle.importKey(
    'raw', authEncoder.encode(config.accessToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));
  return authKeys.get(config);
}
function authEncode(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function authDecode(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error('Invalid token.');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
  if (authEncode(bytes) !== value) throw new Error('Noncanonical token.');
  return bytes;
}
function authSameOrigin(request, config, requireOrigin) {
  const url = new URL(request.url), origin = request.headers.get('Origin');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return false;
  if (!config.allowedOrigins.includes(url.origin)) return false;
  if (origin !== null && origin !== url.origin) return false;
  if (requireOrigin && origin !== url.origin) return false;
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  return !fetchSite || fetchSite === 'same-origin' || fetchSite === 'none';
}
function authJSON(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin, Cookie', ...extraHeaders
  } });
}
function authError(status, code, message, headers) {
  return authJSON({ error: { code, message } }, status, headers);
}
function authCookie(value, age) {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
}
function authReadCookie(request) {
  const header = request.headers.get('Cookie') || '';
  if (header.length > 8192) return null;
  const matches = header.split(';').map(value => value.trim()).filter(value => value.startsWith(SESSION_COOKIE + '='));
  return matches.length === 1 ? matches[0].slice(SESSION_COOKIE.length + 1) : null;
}
async function authIssueSession(config, clock) {
  const iat = Math.floor(clock / 1000), exp = iat + SESSION_SECONDS;
  const nonce = authEncode(crypto.getRandomValues(new Uint8Array(16)));
  const payload = authEncode(authEncoder.encode(JSON.stringify({ v: 1, iat, exp, nonce })));
  const signature = await crypto.subtle.sign('HMAC', await authKey(config), authEncoder.encode('kaoyan-session-v1.' + payload));
  return { token: payload + '.' + authEncode(signature), expiresAt: new Date(exp * 1000).toISOString() };
}

/** True only for a valid same-origin cookie session; old Bearer auth stays in core. */
export async function authenticateSession(request, config, now = Date.now) {
  try {
    if (!authConfigValid(config) || !authSameOrigin(request, config, !['GET', 'HEAD'].includes(request.method))) return false;
    const token = authReadCookie(request);
    if (!token || token.length > 512) return false;
    const parts = token.split('.');
    if (parts.length !== 2 || parts[1].length !== 43) return false;
    const signature = authDecode(parts[1]);
    if (!(await crypto.subtle.verify('HMAC', await authKey(config), signature, authEncoder.encode('kaoyan-session-v1.' + parts[0])))) return false;
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(authDecode(parts[0])));
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'exp,iat,nonce,v') return false;
    const seconds = Math.floor(authNow(now) / 1000);
    return data.v === 1 && Number.isSafeInteger(data.iat) && Number.isSafeInteger(data.exp) &&
      data.exp - data.iat === SESSION_SECONDS && data.iat <= seconds + 60 && data.exp > seconds &&
      typeof data.nonce === 'string' && /^[A-Za-z0-9_-]{22}$/.test(data.nonce);
  } catch { return false; }
}

function authLimit(config, request, clock) {
  let state = loginLimits.get(config);
  if (!state || clock < state.start || clock - state.start >= LOGIN_WINDOW_MS) {
    state = { start: clock, total: 0, clients: new Map() }; loginLimits.set(config, state);
  }
  // Cloudflare sets this header at its edge. A direct Node deployment still has
  // the global limit; do not rely on this header as trusted client identity there.
  const rawClient = request.headers.get('CF-Connecting-IP') || 'anonymous';
  const client = rawClient.length <= 64 ? rawClient : 'anonymous';
  const attempts = state.clients.get(client) || 0;
  if (state.total >= 60 || attempts >= 10) return Math.max(1, Math.ceil((state.start + LOGIN_WINDOW_MS - clock) / 1000));
  state.total++; state.clients.set(client, attempts + 1);
  return 0;
}
async function authReadJSON(request) {
  const size = request.headers.get('Content-Length');
  if (size && (!/^\d+$/.test(size) || Number(size) > LOGIN_BODY_LIMIT)) return { status: 413 };
  if (!request.body) return { status: 400 };
  const reader = request.body.getReader();
  let timer;
  const reading = (async () => {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0, value = '';
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > LOGIN_BODY_LIMIT) { reader.cancel().catch(() => {}); return { status: 413 }; }
      value += decoder.decode(chunk.value, { stream: true });
    }
    value += decoder.decode();
    return { value: JSON.parse(value) };
  })().catch(() => ({ status: 400 }));
  const timeout = new Promise(resolve => { timer = setTimeout(() => { reader.cancel().catch(() => {}); resolve({ status: 408 }); }, 5000); });
  try { return await Promise.race([reading, timeout]); } finally { clearTimeout(timer); }
}

/** Handle /auth/* before the core API router. Returns null for unrelated paths. */
export async function handleAuth(request, config, { now = Date.now } = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/auth/')) return null;
  try {
    if (!authConfigValid(config)) return authError(503, 'SERVICE_NOT_CONFIGURED', '服务端尚未完成访问配置。');
    const expectedMethod = { '/auth/login': 'POST', '/auth/session': 'GET', '/auth/logout': 'POST' }[url.pathname];
    if (!expectedMethod || url.search) return authError(404, 'NOT_FOUND', '接口不存在。');
    if (!authSameOrigin(request, config, expectedMethod === 'POST')) return authError(403, 'ORIGIN_NOT_ALLOWED', '请在网站内完成登录。');
    if (request.method !== expectedMethod) return authError(405, 'METHOD_NOT_ALLOWED', '请求方法不正确。', { Allow: expectedMethod });
    if (url.pathname === '/auth/session') return authJSON({ authenticated: await authenticateSession(request, config, now) });
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') || '')) return authError(415, 'UNSUPPORTED_MEDIA_TYPE', '请求必须使用application/json。');
    if (url.pathname === '/auth/logout') return authJSON({ authenticated: false }, 200, { 'Set-Cookie': authCookie('', 0) });
    const clock = authNow(now), retry = authLimit(config, request, clock);
    if (retry) return authError(429, 'LOGIN_RATE_LIMITED', '登录尝试较多，请稍后再试。', { 'Retry-After': String(retry) });
    const body = await authReadJSON(request);
    if (body.status) return authError(body.status, body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON', '登录请求无效或超出大小限制。');
    const value = body.value;
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 1 || typeof value.password !== 'string' || !value.password.length || value.password.length > 512) return authError(400, 'INVALID_REQUEST', '请输入有效的私人登录密码。');
    // WebCrypto verifies the HMAC in constant time, avoiding JS string comparison.
    const key = await authKey(config);
    const expected = await crypto.subtle.sign('HMAC', key, authEncoder.encode('kaoyan-login-v1.' + config.accessToken));
    if (!(await crypto.subtle.verify('HMAC', key, expected, authEncoder.encode('kaoyan-login-v1.' + value.password)))) return authError(401, 'UNAUTHORIZED', '私人登录密码不正确。');
    const session = await authIssueSession(config, clock);
    return authJSON({ authenticated: true, expiresAt: session.expiresAt }, 200, { 'Set-Cookie': authCookie(session.token, SESSION_SECONDS) });
  } catch { return authError(500, 'INTERNAL_ERROR', '暂时无法完成登录，请稍后重试。'); }
}
