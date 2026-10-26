const {chromium}=require('/Users/a1111/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const BASE='http://127.0.0.1:8765/';
const empty={reply:'收到，按剩余时间安排即可。',changes:[],reviews:[],progress:[],weaknesses:[]};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-26T14:00:00+08:00')});
 let logged=true,mode='lost-response',requests=[],version='20261026-v9';
 await context.route('**/auth/**',r=>{if(r.request().url().endsWith('/auth/login'))logged=true;return r.fulfill({status:logged?200:401,json:logged?{authenticated:true}:{error:{message:'登录过期'}}})});
 await context.route('**/version.json',r=>r.fulfill({json:{version}}));
 await context.route('https://api.github.com/**',r=>r.abort());
 await context.route('**/chat',async r=>{
  requests.push(r.request().postDataJSON());
  if(mode==='lost-response'&&requests.length===1||mode==='network')return r.abort('failed');
  if(mode==='access')return r.fulfill({status:302,headers:{location:'https://example.invalid/cdn-cgi/access/login'}});
  if(mode==='html503')return r.fulfill({status:503,contentType:'text/html',body:'service unavailable'});
  if(mode==='auth')return r.fulfill({status:401,json:{error:{message:'expired'}}});
  if(mode==='quota')return r.fulfill({status:503,json:{error:{code:'UPSTREAM_QUOTA_EXCEEDED',message:'AI服务余额或额度不足',retryable:false}}});
  return r.fulfill({json:{...empty,progress:[{subject:'数学一',summary:'本次已复习积分'}]}});
 });
 await page.goto(BASE);await page.waitForFunction(()=>document.querySelector('#coachStatus').textContent.includes('已登录'));await page.locator('[data-page=coach]').click();
 async function send(text){await page.locator('#coachInput').fill(text);await page.locator('#coachSend').click();await page.waitForFunction(()=>!document.querySelector('#coachSend').disabled)}
 await send('今天上午没完成，帮我安排剩余时间');
 assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1],'automatic retry must reuse the entire body and ID');assert.match(requests[0].requestId,/^[a-f0-9-]{36}$/);
 assert.equal(await page.locator('#coachMessages .user').count(),1);assert.equal(await page.locator('#coachMessages .assistant').count(),1);assert.equal(await page.locator('#coachInput').inputValue(),'');
 assert.equal(await page.evaluate(()=>KaoyanUI.readState().notes['ai:progress:数学一']),'本次已复习积分');
 mode='network';let before=requests.length;await send('网络中断也不能丢的内容');assert.equal(requests.length-before,2);assert.match(await page.locator('#coachFeedback').innerText(),/连接暂时中断/);assert.equal(await page.locator('#coachVerify').isVisible(),true);assert.doesNotMatch(await page.locator('#coachMessages').innerText(),/Failed to fetch/);
 const users=await page.locator('#coachMessages .user').count();await page.locator('#coachRetry').click();await page.waitForFunction(()=>!document.querySelector('#coachSend').disabled);assert.equal(await page.locator('#coachMessages .user').count(),users,'manual failure retries do not duplicate user messages');
 await page.evaluate(()=>sessionStorage.removeItem('kaoyan-ai-draft-v1'));await page.reload();await page.locator('[data-page=coach]').click();assert.equal(await page.locator('#coachInput').inputValue(),'网络中断也不能丢的内容');
 mode='access';before=requests.length;await send('访问验证过期');assert.equal(requests.length-before,1);assert.match(await page.locator('#coachRecoveryText').innerText(),/网站访问验证/);assert.equal(await page.locator('#coachVerify').isVisible(),true);assert.equal(await page.locator('#coachRetry').isVisible(),false);
 mode='html503';before=requests.length;await send('网关繁忙');assert.equal(requests.length-before,2);assert.match(await page.locator('#coachRecoveryText').innerText(),/服务暂时繁忙/);assert.equal(await page.locator('#coachVerify').isVisible(),false);
 mode='quota';before=requests.length;await send('检查余额异常');assert.equal(requests.length-before,1);assert.match(await page.locator('#coachFeedback').innerText(),/余额/);
 mode='auth';await send('登录过期也保留');assert.equal(await page.locator('#coachRelogin').isVisible(),true);await page.locator('#coachRelogin').click();await page.locator('#coachPassword').fill('test-password');await page.locator('#coachLogin').click();assert.equal(await page.locator('#coachInput').inputValue(),'登录过期也保留');mode='ok';await page.locator('#coachSend').click();await page.waitForFunction(()=>!document.querySelector('#coachSend').disabled);
 await context.setOffline(true);await page.locator('#coachInput').fill('离线内容');before=requests.length;await page.locator('#coachSend').click();await page.waitForFunction(()=>!document.querySelector('#coachSend').disabled);assert.match(await page.locator('#coachRecoveryText').innerText(),/离线/);assert.equal(requests.length,before);
 await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#coachStatus').textContent.includes('已登录'));assert.equal(requests.length,before,'online must not silently send a draft');await page.locator('#coachRetry').click();await page.waitForFunction(()=>!document.querySelector('#coachSend').disabled);assert.match(await page.locator('#coachFeedback').innerText(),/已回复/);
 version='20261026-v10';await page.locator('#coachInput').fill('新版刷新保留的文字');await page.clock.fastForward(61000);await page.waitForSelector('.coach-update:not([hidden])');await page.locator('.coach-update button').click();await page.waitForLoadState();await page.locator('[data-page=coach]').click();assert.equal(await page.locator('#coachInput').inputValue(),'新版刷新保留的文字');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await page.screenshot({path:'screenshots/network-recovery-mobile.png',fullPage:true});
 await context.close();console.log('PASS bounded retry + same request ID/body, single apply, failed-send recovery, Access redirect, HTML 503, quota, login expiry, offline/online, version refresh, draft preservation, mobile');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
