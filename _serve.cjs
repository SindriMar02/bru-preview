const http=require('http'),fs=require('fs'),p=require('path');
const T={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain'};
http.createServer((q,s)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f==='/')f='/index.html';
const fp=p.join(__dirname,f);fs.readFile(fp,(e,d)=>{if(e){s.writeHead(404);return s.end('404')}
s.writeHead(200,{'Content-Type':T[p.extname(fp)]||'application/octet-stream','Cache-Control':'no-store'});s.end(d)})}).listen(5322,()=>console.log('bru on :5322'));
