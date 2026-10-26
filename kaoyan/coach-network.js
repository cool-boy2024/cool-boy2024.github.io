(function(){
'use strict';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function failure(code,message,retryable=false){return Object.assign(new Error(message),{code,retryable})}
function friendly(error){
 if(error?.code)return error;
 if(navigator.onLine===false)return failure('OFFLINE','当前设备已离线。文字草稿已保留，联网后可继续发送。');
 if(error?.name==='AbortError')return failure('TIMEOUT','等待回复超时。文字草稿已保留，可稍后重试。',true);
 if(error?.name==='TypeError'||/failed to fetch|networkerror|load failed/i.test(error?.message||''))return failure('NETWORK_ERROR','连接暂时中断。文字草稿已保留；请重试，若仍无法连接，可点击“重新验证网站”。',true);
 return error;
}
async function request(path,body,{onRetry}={}){
 if(!['cokeblog.cc.cd','localhost','127.0.0.1'].includes(location.hostname))throw failure('WRONG_SITE','请打开 https://cokeblog.cc.cd 登录并使用AI教练。');
 const chat=path==='/chat',serialized=body?JSON.stringify(body):undefined;
 for(let attempt=0;attempt<(chat?2:1);attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),chat?45000:12000);
  try{
   if(navigator.onLine===false)throw failure('OFFLINE','当前设备已离线。文字草稿已保留，联网后可继续发送。');
   const response=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',redirect:'manual',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:serialized}:{}),signal:controller.signal});
   if(response.type==='opaqueredirect'||response.status>=300&&response.status<400)throw failure('ACCESS_VERIFICATION_REQUIRED','网站访问验证已到期，请点击“重新验证网站”。文字草稿已保留，刷新后照片需重新添加。');
   const json=/application\/json/i.test(response.headers.get('Content-Type')||'');
   if(!json){
    if(response.status>=500)throw failure('SERVICE_UNAVAILABLE','网站服务暂时繁忙。文字草稿已保留，请稍后重试。',true);
    const text=(await response.text()).slice(0,4000);
    if([401,403].includes(response.status)||/cloudflare|sign[ -]?in|access\/login/i.test(text))throw failure('ACCESS_VERIFICATION_REQUIRED','网站访问验证需要重新完成，请点击“重新验证网站”。文字草稿已保留，刷新后照片需重新添加。');
    throw failure('INVALID_RESPONSE','网站暂时没有返回有效回复。文字草稿已保留，请稍后重试。',true);
   }
   let data;try{data=await response.json()}catch{throw failure('INVALID_RESPONSE','回复传输不完整。文字草稿已保留，请重试。',true)}
   if(response.status===401)throw failure('AUTH_REQUIRED','此设备的登录已过期，请重新登录。文字草稿和当前照片仍保留。');
   if(!response.ok){const e=data.error||{},code=e.code||'SERVICE_ERROR';throw failure(code,e.message||'暂时无法连接，请稍后重试。',e.retryable!==false&&response.status>=500&&!code.startsWith('UPSTREAM_'))}
   return data;
  }catch(raw){const error=friendly(raw);if(attempt===0&&chat&&error.retryable){onRetry?.();await wait(1200);continue}throw error}
  finally{clearTimeout(timer)}
 }
}
window.KaoyanNetwork={request,friendly};
})();
