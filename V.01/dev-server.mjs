import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname);
const mime = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Fora da pasta');
    const details = await stat(file);
    if (!details.isFile()) throw new Error('Não é arquivo');
    response.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'application/octet-stream'}; charset=utf-8` });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end('Não encontrado');
  }
}).listen(port, () => console.log(`Três Frentes: http://localhost:${port}`));
