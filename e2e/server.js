const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const types = { '.css': 'text/css', '.js': 'application/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' };

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const safePath = path.normalize(pathname).replace(/^([.][.][\\/])+/, '');
  let file = path.join(root, safePath);
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!path.extname(file)) file = path.join(file, 'index.html');
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500); return res.end(); }
    res.writeHead(200, { 'content-type': `${types[path.extname(file).toLowerCase()] || 'application/octet-stream'}; charset=utf-8`, 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(process.env.PORT || 4173, '127.0.0.1');
