// Paper Fighters web server (Liara, Node platform). No dependencies.
// Serves the game and its assets; the same http server can host a WebSocket
// endpoint later for online play.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.apk': 'application/vnd.android.package-archive',
};
const PRIVATE = new Set(['server.js', 'package.json', 'liara.json']);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') return res.end('ok');
  if (url.pathname === '/ws') { res.writeHead(426); return res.end('websocket only'); }
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'game.html';
  const file = path.join(ROOT, rel);
  const type = TYPES[path.extname(file)];
  if (!file.startsWith(ROOT + path.sep) || !type || PRIVATE.has(rel) || rel.startsWith('node_modules') || rel.startsWith('.')) {
    res.writeHead(404);
    return res.end('not found');
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      return res.end('not found');
    }
    // always revalidate; the service worker does the offline caching
    const etag = `"${st.size.toString(36)}-${st.mtimeMs.toString(36)}"`;
    const head = { 'Content-Type': type, 'Cache-Control': 'no-cache', ETag: etag };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, head);
      return res.end();
    }
    res.writeHead(200, { ...head, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

// ===== online battles: room codes + relay (the room creator's game is authoritative) =====
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024 });
const rooms = new Map(); // code -> { code, host, guest, hostInfo, born }
const send = (ws, m) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
function newCode() {
  for (let i = 0; i < 50; i++) {
    const c = String(1000 + Math.floor(Math.random() * 9000));
    if (!rooms.has(c)) return c;
  }
  return null;
}
wss.on('connection', (ws) => {
  ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', (buf) => {
    const raw = buf.toString();
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'ping') { ws.alive = true; return; }
    if (m.t === 'create') {
      const code = newCode();
      if (!code) return send(ws, { t: 'err', e: 'busy' });
      rooms.set(code, { code, host: ws, guest: null, hostInfo: m.info || {}, born: Date.now() });
      ws.room = code; ws.role = 'host';
      return send(ws, { t: 'created', code });
    }
    if (m.t === 'join') {
      const r = rooms.get(String(m.code || '').trim());
      if (!r) return send(ws, { t: 'err', e: 'notfound' });
      if (r.guest) return send(ws, { t: 'err', e: 'full' });
      r.guest = ws; ws.room = r.code; ws.role = 'guest';
      const start = { t: 'start', host: r.hostInfo, guest: m.info || {} };
      send(r.host, { ...start, role: 'host' });
      return send(ws, { ...start, role: 'guest' });
    }
    // everything else is game traffic for the other player in the room
    const r = rooms.get(ws.room);
    if (!r) return;
    const other = ws.role === 'host' ? r.guest : r.host;
    if (other && other.readyState === 1) other.send(raw);
  });
  ws.on('close', () => {
    const r = rooms.get(ws.room);
    if (!r) return;
    send(ws.role === 'host' ? r.guest : r.host, { t: 'left' });
    rooms.delete(ws.room);
  });
});
// drop dead connections and rooms nobody joined within 10 minutes
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false;
    try { ws.ping(); } catch {}
  }
  for (const [code, r] of rooms) if (!r.guest && Date.now() - r.born > 600000) { try { r.host.close(); } catch {} rooms.delete(code); }
}, 30000);

server.listen(PORT, '0.0.0.0', () => console.log(`Paper Fighters on :${PORT}`));
