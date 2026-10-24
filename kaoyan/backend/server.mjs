import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createHandler, readConfig } from './core.mjs';

export function createNodeServer(handler) {
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      const controller = new AbortController();
      incoming.on('aborted', () => controller.abort());
      const body = ['GET', 'HEAD'].includes(incoming.method) ? undefined : new ReadableStream({
        start(stream) {
          incoming.on('data', chunk => stream.enqueue(new Uint8Array(chunk)));
          incoming.on('end', () => stream.close());
          incoming.on('error', error => stream.error(error));
        },
        cancel() { incoming.removeAllListeners('data'); incoming.removeAllListeners('end'); incoming.removeAllListeners('error'); incoming.resume(); }
      });
      const request = new Request('http://localhost' + incoming.url, { method: incoming.method, headers: incoming.headers, body, ...(body ? { duplex: 'half' } : {}), signal: controller.signal });
      const response = await handler(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch { if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); outgoing.end('{"error":{"code":"INTERNAL_ERROR","message":"服务暂时不可用。"}}'); }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000; server.maxRequestsPerSocket = 100;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = readConfig(process.env), host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT || 8787);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
    const server = createNodeServer(createHandler(config));
    server.listen(port, host, () => console.log(`Study AI backend listening on ${host}:${port}`));
    server.on('error', () => { console.error('Backend startup failed. Check bind address and port.'); process.exitCode = 1; });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
