import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname),port=Number(process.env.PORT||4197);
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.md':'text/plain','.ttf':'font/ttf'};
createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw Error();
 res.writeHead(200,{'Content-Type':(mime[extname(file)]||'application/octet-stream')+'; charset=utf-8'});res.end(await readFile(file));
}catch{res.writeHead(404);res.end('Arquivo não encontrado.');}}).listen(port,'127.0.0.1',()=>console.log(`Estudo local: http://127.0.0.1:${port}`));
