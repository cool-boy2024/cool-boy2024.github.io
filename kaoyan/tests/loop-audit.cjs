const {chromium}=require('/Users/a1111/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const BASE='http://127.0.0.1:8765/',K='kaoyan-web-2027-v1';
const empty={reply:'保持原计划。',changes:[],reviews:[],progress:[],weaknesses:[]};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/auth/**',r=>r.fulfill({json:{authenticated:true}}));
 await context.route('https://api.github.com/**',r=>r.abort());
 let response=empty,sent,release,hold=false;
 await context.route('**/chat',async r=>{sent=r.request().postDataJSON();if(hold)await new Promise(resolve=>release=resolve);await r.fulfill({json:response})});
 const errors=[];
 async function page(){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.clock.install({time:new Date('2026-10-24T10:00:00+08:00')});await p.goto(BASE);await p.waitForFunction(()=>document.querySelector('#coachStatus').textContent.includes('在线'));return p}
 const p=await page();
 await p.locator('#todayTasks input').first().check();
 await p.evaluate(()=>KaoyanUI.patch({notes:{'ai:review:old':JSON.stringify({subject:'政治',topic:'马原',dueDate:'2026-10-23',done:true,note:'独立复测',completedAt:1})}}));
 await p.locator('[data-page=coach]').click();
 async function send(text){await p.locator('#coachInput').fill(text);await p.locator('#coachSend').click();await p.waitForFunction(()=>!document.querySelector('#coachSend').disabled)}
 response={...empty,reply:'Cache 需要你先判定。',weaknesses:[{subject:'408',topic:'Cache映射',reason:'尚需本人确认',action:'独立完成三题',status:'needs_review'}],reviews:[{subject:'408',topic:'Cache映射',dueDate:'2026-10-24',note:'三题复测'}]};
 await send('Cache有点不熟');
 assert.equal(sent.context.plans[0].completed[0],true);assert.equal(sent.context.taskHistory.length,7);assert.equal(sent.context.completedReviews[0].topic,'马原');
 assert.equal(await p.locator('#dueReviews .review-card').count(),0,'pending weakness must not schedule review yet');
 await p.locator('#coachConfirmations button').first().click();
 assert.equal(await p.locator('#dueReviews .review-card').count(),1,'confirm weakness schedules review');
 await p.locator('[data-page=dashboard]').click();await p.locator('#dueReviews button').first().click();
 let weakness=await p.evaluate(()=>JSON.parse(KaoyanUI.readState().notes['ai:weakness:'+encodeURIComponent('408|Cache映射')]));assert.equal(weakness.status,'mastered');
 assert.equal(await p.locator('#dueReviews .review-card').count(),0);assert.equal(await p.locator('#completedReviews .review-card').count(),2);
 await p.locator('#completedReviewCount').click();await p.locator('#completedReviews button').first().click();
 weakness=await p.evaluate(()=>JSON.parse(KaoyanUI.readState().notes['ai:weakness:'+encodeURIComponent('408|Cache映射')]));assert.equal(weakness.status,'needs_review');assert.equal(await p.locator('#dueReviews .review-card').count(),1);
 // AI reschedules the existing review instead of creating an overdue duplicate.
 const reviewKey=await p.evaluate(()=>Object.keys(KaoyanUI.readState().notes).find(k=>k.startsWith('ai:review:')&&JSON.parse(KaoyanUI.readState().notes[k]).topic==='Cache映射'));
 response={...empty,reviewUpdates:[{id:reviewKey,dueDate:'2026-10-25'}]};await p.locator('[data-page=coach]').click();await send('把Cache复习改到明天');assert.equal(await p.locator('#dueReviews .review-card').count(),1);assert.match(await p.locator('#dueReviews').innerText(),/2026-10-25/);
 await p.locator('[data-page=dashboard]').click();await p.locator('#dueReviews button').last().click();assert.equal(await p.locator('#dueReviews .review-card').count(),0);if(!await p.locator('#completedReviews button').filter({hasText:'恢复到今天'}).isVisible())await p.locator('#completedReviewCount').click();await p.locator('#completedReviews button').filter({hasText:'恢复到今天'}).click();assert.equal(await p.locator('#dueReviews .review-card').count(),1);
 // Changing a task invalidates its checkbox, but repeating identical content does not.
 response={...empty,changes:[{date:'2026-10-24',subject:'数学一',content:'独立复做三道定积分题'}],progress:[{subject:'数学一',summary:'完成一组定积分训练'}]};
 await p.locator('[data-page=coach]').click();await send('调整数学任务');
 await p.reload();await p.waitForFunction(()=>document.querySelector('#coachStatus').textContent.includes('在线'));await p.locator('[data-page=coach]').click();assert.equal(await p.locator('#coachUndo').isEnabled(),true,'undo survives reload');
 response=empty;await send('解释一下学习建议');assert.equal(await p.locator('#coachUndo').isEnabled(),true,'ordinary chat retains undo');
 await p.locator('#coachUndo').click();assert.notEqual(await p.evaluate(()=>KaoyanUI.getPlan('2026-10-24').items[0]),'独立复做三道定积分题');
 await p.locator('[data-page=dashboard]').click();await p.locator('#todayTasks input').first().check();const original=await p.evaluate(()=>KaoyanUI.getPlan('2026-10-24').items[0]);
 response={...empty,changes:[{date:'2026-10-24',subject:'数学一',content:original}]};await p.locator('[data-page=coach]').click();await send('保持数学安排');assert.equal(await p.locator('#todayTasks input').first().isChecked(),true,'no-op plan must retain completion');
 // Sending locks the draft and photo controls; failed concurrent data changes are not overwritten.
 hold=true;response={...empty,progress:[{subject:'数学一',summary:'旧请求返回的摘要'}]};await p.locator('#coachInput').fill('看看进度');await p.locator('#coachSend').click();await p.waitForFunction(()=>document.querySelector('#coachSend').disabled);
 assert.equal(await p.locator('#coachInput').getAttribute('readonly'),'');assert.equal(await p.locator('.photo-choose').isDisabled(),true);
 await p.evaluate(()=>KaoyanUI.patch({notes:{'ai:progress:数学一':'等待期间的新进度'}}));while(!release)await new Promise(r=>setTimeout(r,10));release();hold=false;await p.waitForFunction(()=>!document.querySelector('#coachSend').disabled);
 assert.equal(await p.evaluate(()=>KaoyanUI.readState().notes['ai:progress:数学一']),'等待期间的新进度');assert.match(await p.locator('#coachFeedback').innerText(),/发生变化/);
 // Invalid upload can be removed without choosing a replacement.
 await p.locator('.photo-file').setInputFiles({name:'bad.heic',mimeType:'image/heic',buffer:Buffer.from('bad')});await p.locator('.photo-reset').click();response=empty;await send('只发文字');assert.match(await p.locator('#coachFeedback').innerText(),/已回复/);
 // Storage quota failure leaves the entire AI patch unapplied.
 const atomic=await p.evaluate(()=>{const before=JSON.stringify(KaoyanUI.readState()),original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='kaoyan-web-2027-v1')throw new DOMException('quota','QuotaExceededError');return original.call(this,key,value)};let rejected=false;try{KaoyanUI.patch({notes:{'ai:atomic-test':'must not persist'},plan:{'test-key':true}})}catch{rejected=true}finally{Storage.prototype.setItem=original}return {rejected,same:before===JSON.stringify(KaoyanUI.readState())}});assert.deepEqual(atomic,{rejected:true,same:true});
 // Multi-tab edits merge; timer checkpoints no longer write a stale full state.
 const q=await page();await p.locator('[data-page=dashboard]').click();await q.locator('#todayTasks input').nth(1).check();await p.waitForFunction(()=>document.querySelectorAll('#todayTasks input')[1].checked);
 await p.locator('#todayTasks input').nth(2).check();await q.waitForFunction(()=>document.querySelectorAll('#todayTasks input')[2].checked);
 await p.locator('#todayTasks [data-start-subject="0"]').click();await p.clock.fastForward(2000);await q.evaluate(()=>KaoyanUI.patch({notes:{'ai:multitab':'another tab saved'}}));await p.clock.fastForward(2000);
 assert.equal(await q.evaluate(()=>JSON.parse(localStorage.getItem('kaoyan-web-2027-v1')).notes['ai:multitab']),'another tab saved');await p.locator('#end').click();await q.waitForFunction(()=>KaoyanUI.readState().sessions.length>0);
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('kaoyan-web-2027-v1')).timer),null);
 // A completion from old task content must not complete a rewritten task after merging.
 await p.evaluate(()=>{const plan=KaoyanUI.getPlan('2026-10-24');KaoyanUI.patch({notes:{'ai:completion:2026-10-24|0':plan.items[0],'ai:plan:2026-10-24|0':JSON.stringify({content:'新版本数学任务',updatedAt:Date.now()})},plan:{[KaoyanPlan.VERSION+'|2026-10-24|0']:true}})});
 assert.equal(await p.evaluate(()=>KaoyanUI.isTaskDone('2026-10-24',0)),false);assert.equal(await p.locator('#todayTasks input').first().isChecked(),false);
 // 03:00 rolls over tasks, review labels, manual-review date and daily journal.
 await p.evaluate(()=>KaoyanUI.patch({notes:{'ai:review:rollover':JSON.stringify({subject:'英语一',topic:'作文',dueDate:'2026-10-24',note:'复测',done:false})}}));
 await p.clock.setFixedTime(new Date('2026-10-25T03:00:00+08:00'));await p.clock.fastForward(1200);
 assert.equal(await p.locator('#reviewDate').inputValue(),'2026-10-25');assert.equal(await p.locator('#date').inputValue(),'2026-10-25');assert.match(await p.locator('#dueReviews').innerText(),/逾期/);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 await p.screenshot({path:'screenshots/audit-mobile.png',fullPage:true});await context.close();
 // Cloudflare Access HTML is explained clearly and drafts survive a refresh.
 const access=await browser.newContext();await access.route('**/auth/**',r=>r.fulfill({json:{authenticated:true}}));await access.route('**/chat',r=>r.fulfill({contentType:'text/html',body:'<html>Cloudflare Access sign in</html>'}));const a=await access.newPage();await a.goto(BASE);await a.waitForFunction(()=>document.querySelector('#coachStatus').textContent.includes('在线'));await a.locator('[data-page=coach]').click();await a.locator('#coachInput').fill('验证到期时不能丢失的草稿');await a.locator('#coachSend').click();await a.waitForFunction(()=>!document.querySelector('#coachSend').disabled);assert.match(await a.locator('#coachFeedback').innerText(),/网站访问验证/);await a.reload();await a.locator('[data-page=coach]').click();assert.equal(await a.locator('#coachInput').inputValue(),'验证到期时不能丢失的草稿');await access.close();
 // Disconnect during pending cloud read prevents a later merge/upload.
 const cloud=await browser.newContext();await cloud.route('**/auth/**',r=>r.fulfill({json:{authenticated:false}}));let remoteRelease,puts=0;
 await cloud.route('https://api.github.com/**',async r=>{if(r.request().method()==='PUT'){puts++;return r.fulfill({json:{content:{sha:'new'}}})}if(r.request().url().includes('/contents/')){await new Promise(resolve=>remoteRelease=resolve);return r.fulfill({json:{sha:'old',content:Buffer.from(JSON.stringify({done:{},notes:{'ai:remote':'must not merge'},plan:{},sessions:[],changed:9})).toString('base64')}})}return r.fulfill({json:{private:true}})});
 const c=await cloud.newPage();await c.goto(BASE);await c.locator('[data-page=cloud]').click();await c.locator('#token').fill('mock-github-token');await c.locator('#connect').click();while(!remoteRelease)await new Promise(r=>setTimeout(r,10));await c.locator('#disconnect').click();remoteRelease();await c.waitForTimeout(100);assert.equal(puts,0);assert.equal(await c.evaluate(()=>KaoyanUI.readState().notes['ai:remote']),undefined);await cloud.close();
 await browser.close();console.log('PASS: weakness/review mastery and reopen; pending review gating; task context; persistent undo; no-op completion; busy draft; concurrent response rejection; photo error recovery; atomic quota failure; multi-tab + timer persistence; 03:00 rollover; cloud disconnect race');
})().catch(e=>{console.error(e);process.exit(1)});
