import { createHandler, readConfig } from './core.mjs';
let handler;
export default {
  async fetch(request, env) {
    try { handler ||= createHandler(readConfig(env)); return await handler(request); }
    catch { return Response.json({ error: { code: 'SERVICE_NOT_CONFIGURED', message: '服务端尚未完成密钥配置。' } }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
  }
};
