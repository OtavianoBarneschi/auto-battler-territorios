const fs = require('fs');
const path = require('path');
const moduleRoot = process.env.CARD_TOOLS || path.join(process.env.LOCALAPPDATA,'CodexCardTools/node_modules/@resvg/resvg-js');
const { Resvg } = require(moduleRoot);
const root=path.resolve(__dirname,'..');
const fontFiles=fs.readdirSync(path.join(root,'assets/fonts')).filter(f=>f.endsWith('.ttf')).map(f=>path.join(root,'assets/fonts',f));
fs.mkdirSync(path.join(root,'renders'),{recursive:true});
for(const file of fs.readdirSync(path.join(root,'artboards')).filter(f=>f.endsWith('.svg'))){
 const input=fs.readFileSync(path.join(root,'artboards',file),'utf8').replace(/xlink:href="([^"]+)"/g,(_,href)=>`xlink:href="data:image/png;base64,${fs.readFileSync(path.resolve(root,'artboards',href)).toString('base64')}"`);
 const r=new Resvg(input,{font:{fontFiles,loadSystemFonts:true},fitTo:{mode:'width',value:file.includes('mini')?432:960}});
 for(const href of r.imagesToResolve()) r.resolveImage(href,fs.readFileSync(path.resolve(root,'artboards',href)));
 const png=r.render().asPng();
 fs.writeFileSync(path.join(root,'renders',file.replace('.svg','.png')),png);
 console.log(file, png.length);
}
