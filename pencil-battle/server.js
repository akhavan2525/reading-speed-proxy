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
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'game.html';
  const file = path.join(ROOT, rel);
  const type = TYPES[path.extname(file)];
  if (!file.startsWith(ROOT + path.sep) || !type || PRIVATE.has(rel)) {
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

server.listen(PORT, '0.0.0.0', () => console.log(`Paper Fighters on :${PORT}`));
