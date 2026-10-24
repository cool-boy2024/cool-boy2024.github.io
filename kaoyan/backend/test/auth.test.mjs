import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAuth, authenticateSession, SESSION_COOKIE } from '../auth.mjs';

const origin = 'https://cokeblog.cc.cd';
const password = 'test-password-only-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const clock = Date.parse('2026-10-24T12:00:00+08:00');
const config = () => ({ accessToken: password, allowedOrigins: [origin, 'https://cool-boy2024.github.io'] });
function request(path, { method = path === '/auth/session' ? 'GET' : 'POST', body, headers = {}, urlOrigin = origin } = {}) {
  return new Request(urlOrigin + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    ...(method === 'GET' ? {} : { body: body ?? JSON.stringify({ password }) }) });
}
async function login(cfg, overrides) { return handleAuth(request('/auth/login', overrides), cfg, { now: () => clock }); }
function cookie(response) { return response.headers.get('Set-Cookie').split(';')[0]; }

test('login returns a secure seven-day HttpOnly cookie without echoing the secret', async () => {
  const cfg = config(), response = await login(cfg), header = response.headers.get('Set-Cookie');
  assert.equal(response.status, 200);
  assert.ok(header.startsWith(SESSION_COOKIE + '='));
  for (const flag of ['Path=/', 'Max-Age=604800', 'HttpOnly', 'Secure', 'SameSite=Strict']) assert.ok(header.includes(flag));
  assert.ok(!header.includes('Domain='));
  assert.ok(!header.includes(password));
  assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const payload = await response.json();
  assert.deepEqual(payload, { authenticated: true, expiresAt: new Date(clock + 604800000).toISOString() });
  assert.equal(await authenticateSession(request('/chat', { headers: { Cookie: cookie(response) } }), cfg, clock), true);
});

test('valid cookie is rejected after expiry, before issue time, after secret rotation, or tampering', async () => {
  const cfg = config(), response = await login(cfg), saved = cookie(response);
  const req = request('/chat', { headers: { Cookie: saved } });
  assert.equal(await authenticateSession(req, cfg, clock + 604800000 - 1), true);
  assert.equal(await authenticateSession(req, cfg, clock + 604800000), false);
  assert.equal(await authenticateSession(req, cfg, clock - 61000), false);
  assert.equal(await authenticateSession(req, { ...cfg, accessToken: password + 'new' }, clock), false);
  const token = saved.slice(saved.indexOf('=') + 1), parts = token.split('.');
  const parsed = JSON.parse(Buffer.from(parts[0], 'base64url'));
  parsed.exp += 604800;
  const changedPayload = Buffer.from(JSON.stringify(parsed)).toString('base64url') + '.' + parts[1];
  for (const tampered of [changedPayload, parts[0] + '.' + (parts[1][0] === 'A' ? 'B' : 'A') + parts[1].slice(1), 'garbage']) {
    assert.equal(await authenticateSession(request('/chat', { headers: { Cookie: SESSION_COOKIE + '=' + tampered } }), cfg, clock), false);
  }
  assert.equal(await authenticateSession(request('/chat', { headers: { Cookie: saved + '; ' + saved } }), cfg, clock), false);
});

test('cookie login and mutations reject cross-origin requests including allowed legacy origins', async () => {
  const cfg = config(), response = await login(cfg), saved = cookie(response);
  for (const crossOrigin of ['https://evil.example', 'https://cool-boy2024.github.io', 'null']) {
    const attempt = await login(cfg, { headers: { Origin: crossOrigin } });
    assert.equal(attempt.status, 403);
    assert.equal(attempt.headers.get('Set-Cookie'), null);
    assert.equal(attempt.headers.get('Access-Control-Allow-Origin'), null);
    assert.equal(await authenticateSession(request('/chat', { headers: { Origin: crossOrigin, Cookie: saved } }), cfg, clock), false);
    assert.equal((await handleAuth(request('/auth/logout', { headers: { Origin: crossOrigin, Cookie: saved } }), cfg)).status, 403);
  }
  const missingOrigin = request('/auth/login'); missingOrigin.headers.delete('Origin');
  assert.equal((await handleAuth(missingOrigin, cfg)).status, 403);
  const missingChatOrigin = request('/chat', { headers: { Cookie: saved } }); missingChatOrigin.headers.delete('Origin');
  assert.equal(await authenticateSession(missingChatOrigin, cfg, clock), false);
  assert.equal((await login(cfg, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
});

test('same-origin GET session and health may omit Origin, but cross-site Fetch Metadata is rejected', async () => {
  const cfg = config(), response = await login(cfg), saved = cookie(response);
  const session = request('/auth/session', { headers: { Cookie: saved } }); session.headers.delete('Origin');
  const checked = await handleAuth(session, cfg, { now: clock });
  assert.deepEqual(await checked.json(), { authenticated: true });
  const health = request('/health', { method: 'GET', headers: { Cookie: saved } }); health.headers.delete('Origin');
  assert.equal(await authenticateSession(health, cfg, clock), true);
  health.headers.set('Sec-Fetch-Site', 'same-site');
  assert.equal(await authenticateSession(health, cfg, clock), false);
  const empty = await handleAuth(request('/auth/session'), cfg, { now: clock });
  assert.deepEqual(await empty.json(), { authenticated: false });
});

test('failed logins, invalid JSON, media types, and oversized bodies set no cookie', async () => {
  for (const [options, status] of [
    [{ body: JSON.stringify({ password: 'wrong' }) }, 401],
    [{ body: '{' }, 400],
    [{ body: JSON.stringify({ password, extra: true }) }, 400],
    [{ body: JSON.stringify({ password: '' }) }, 400],
    [{ headers: { 'Content-Type': 'text/plain' } }, 415],
    [{ body: 'x'.repeat(2049) }, 413],
    [{ headers: { 'Content-Length': '9999' } }, 413]
  ]) {
    const response = await login(config(), options);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Set-Cookie'), null);
    assert.ok(!(await response.text()).includes(password));
  }
});

test('login attempt limits expire and global limit covers forged client identifiers', async () => {
  const cfg = config();
  for (let i = 0; i < 10; i++) assert.equal((await login(cfg, { body: JSON.stringify({ password: 'bad' }) })).status, 401);
  const limited = await login(cfg);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '600');
  assert.equal((await handleAuth(request('/auth/login'), cfg, { now: clock + 600000 })).status, 200);
  const globalCfg = config();
  for (let i = 0; i < 60; i++) assert.equal((await login(globalCfg, { body: JSON.stringify({ password: 'bad' }), headers: { 'CF-Connecting-IP': String(i) } })).status, 401);
  assert.equal((await login(globalCfg, { headers: { 'CF-Connecting-IP': 'new-client' } })).status, 429);
});

test('logout clears cookie; unknown route, unsupported method, and insecure production origin are rejected', async () => {
  const cfg = config();
  const response = await handleAuth(request('/auth/logout', { body: '{}' }), cfg);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Set-Cookie'), `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.equal(await handleAuth(request('/chat'), cfg), null);
  assert.equal((await handleAuth(request('/auth/unknown'), cfg)).status, 404);
  assert.equal((await handleAuth(request('/auth/login', { method: 'GET' }), cfg)).status, 405);
  assert.equal((await handleAuth(request('/auth/login?query=1'), cfg)).status, 404);
  assert.equal((await login(cfg, { urlOrigin: 'http://cokeblog.cc.cd', headers: { Origin: 'http://cokeblog.cc.cd' } })).status, 403);
});
