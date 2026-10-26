const {chromium}=require('/Users/a1111/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext(),page=await context.newPage();await page.clock.install({time:new Date('2026-10-26T14:00:00+08:00')});
 await context.route('**/auth/**',r=>r.fulfill({json:{authenticated:true}}));
 let mode='transient',gets=0,puts=0,remote=null;
 await context.route('https://api.github.com/**',r=>{
  if(!r.request().url().includes('/contents/'))return r.fulfill({json:{private:true}});
  if(r.request().method()==='PUT'){puts++;remote=r.request().postDataJSON().content;return r.fulfill({json:{content:{sha:'saved'}}})}
  gets++;if(mode==='transient'&&gets===1||mode==='fail')return r.abort('failed');
  if(mode==='auth')return r.fulfill({status:401,json:{message:'unauthorized'}});
  return remote?r.fulfill({json:{sha:'saved',content:remote}}):r.fulfill({status:404,json:{message:'empty test repo'}});
 });
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-page=cloud]').click();await page.locator('#token').fill('mock-token');await page.locator('#connect').click();await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('秒后重试'));await page.clock.fastForward(3100);await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('同步成功'));assert.equal(puts,1);
 mode='ok';await page.locator('#sync').click();await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('保持一致'));assert.equal(puts,1,'unchanged data must not trigger another upload');await page.evaluate(()=>KaoyanUI.patch({notes:{'ai:cloud-recovery-test':'new local edit'}}));mode='fail';await page.locator('#sync').click();await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('1/3'));for(const [delay,label] of [[3100,'2/3'],[10100,'3/3'],[30100,'已暂停']]){await page.clock.fastForward(delay);await page.waitForFunction(label=>document.querySelector('#cloudStatus').textContent.includes(label),label)}
 const exhausted=gets;await page.clock.fastForward(120000);assert.equal(gets,exhausted,'retries stop after the bounded budget');
 await context.setOffline(true);mode='ok';await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('同步成功'));assert.ok(puts>=2);
 mode='auth';await page.locator('#sync').click();await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('授权已失效'));const unauthorized=gets;await page.clock.fastForward(120000);assert.equal(gets,unauthorized,'authorization failure must not loop');
 mode='fail';await page.locator('#connect').click();await page.waitForFunction(()=>document.querySelector('#cloudStatus').textContent.includes('秒后重试'));await page.locator('#disconnect').click();const disconnected=gets;await page.clock.fastForward(120000);await context.setOffline(true);await context.setOffline(false);assert.equal(gets,disconnected,'disconnect cancels scheduled and online recovery');assert.match(await page.locator('#cloudStatus').innerText(),/已断开/);
 await context.close();console.log('PASS cloud transient recovery, bounded backoff, online recovery, auth failure stop and explicit disconnect cancellation');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
