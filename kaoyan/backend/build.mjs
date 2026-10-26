import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),files=['index.html','enhance.css','enhance.js','plan-v4.js','ai-coach.css','photo-input.js','ai-coach.js','coach-network.js','version.json'];const assets={};for(const name of files)assets['/'+name]=await readFile(new URL(name,root),'utf8');
const auth=await readFile(new URL('auth.mjs',import.meta.url),'utf8');
const core=(await readFile(new URL('core.mjs',import.meta.url),'utf8')).replace(/import \{ handleAuth, authenticateSession \} from '.\/auth.mjs';\n/, '');
const entry=`
const ASSETS=${JSON.stringify(assets)};
let handler;
export default {async fetch(request,env){
 const url=new URL(request.url); let path=url.pathname.replace(/^\\/kaoyan(?=\\/|$)/,'')||'/';if(path==='/')path='/index.html';
 if(ASSETS[path]!==undefined){if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const type=path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':path.endsWith('.json')?'application/json':'application/javascript';return new Response(request.method==='HEAD'?null:ASSETS[path],{headers:{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}})}
 try{handler ||= createHandler(readConfig(env));return await handler(request)}catch{const origin=request.headers.get('Origin'),allowed=['https://cokeblog.cc.cd','https://cool-boy2024.github.io'];return Response.json({error:{code:'SERVICE_NOT_CONFIGURED',message:'AI后台已部署，尚需在Cloudflare配置DeepSeek密钥及访问口令。'}},{status:503,headers:{'Cache-Control':'no-store',...(allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}})}
}};
`;
await writeFile(new URL('worker-bundle.mjs',import.meta.url),auth+'\n'+core+entry);console.log('Built static tracker and AI Worker');
