import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname);
const mime = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const route = pathname === '/' ? '/index.html' : /^\/colecao\/?$/.test(pathname) ? '/colecao.html' : pathname;
    const file = resolve(root, `.${route}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Fora da pasta');
    const details = await stat(file);
    if (!details.isFile()) throw new Error('Não é arquivo');
    const contentType = mime[extname(file)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Não encontrado');
  }
}).listen(port, () => console.log(`Duck and Robots: http://localhost:${port}`));
