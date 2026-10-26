import test from 'node:test';import assert from 'node:assert/strict';
import {readConfig,createHandler,validateOutput,studyDate} from '../core.mjs';
const token='test-only-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ', origin='https://cool-boy2024.github.io';
const cfg=readConfig({DEEPSEEK_API_KEY:'mock-key',APP_ACCESS_TOKEN:token,ALLOWED_ORIGINS:origin});
const output={reply:'完成',changes:[{date:'2026-10-24',subject:'408',content:'复习Cache'}],reviews:[],progress:[]};
const body={message:'复习',studyDate:'2026-10-24',context:{plans:[],reviews:[],progress:{},recentLogs:[]},history:[]};
const req=(path='/chat',options={})=>new Request('https://api.example.com'+path,{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),...options});
test('valid response, authorization, CORS and study-day boundary',async()=>{let calls=0;const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]})}});assert.deepEqual(await (await handle(req())).json(),output);assert.equal((await handle(req('/chat',{headers:{Origin:origin}}))).status,401);assert.equal((await handle(req('/chat',{headers:{Origin:'https://evil.example'}}))).status,403);assert.equal(calls,1);assert.equal(studyDate(Date.parse('2026-10-25T00:30:00+08:00')),'2026-10-24');assert.equal((await handle(req('/health',{method:'OPTIONS',body:undefined,headers:{Origin:origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}}))).status,204);assert.equal((await handle(req('/health',{method:'GET',body:undefined}))).status,200)});
test('invalid model dates and subjects are rejected',()=>{for(const change of [{...output.changes[0],date:'2026-10-23'},{...output.changes[0],date:'2026-11-30'},{...output.changes[0],subject:'其他'}])assert.throws(()=>validateOutput({...output,changes:[change]},'2026-10-24'))});
test('truncated output does not become a plan',async()=>{const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async()=>Response.json({choices:[{finish_reason:'length',message:{content:JSON.stringify(output)}}]})});assert.equal((await handle(req())).status,502)});
test('weaknesses preserve evidence and reject invalid status or duplicates',()=>{const weakness={subject:'408',topic:'Cache',reason:'用户说计算题做错',action:'独立做对三题',status:'needs_review'};assert.deepEqual(validateOutput({...output,weaknesses:[weakness]},'2026-10-24').weaknesses,[weakness]);assert.throws(()=>validateOutput({...output,weaknesses:[{...weakness,status:'automatic'}]},'2026-10-24'));assert.throws(()=>validateOutput({...output,weaknesses:[weakness,weakness]},'2026-10-24'))});
test('optional empty arrays and harmless extra metadata do not reject valid replies',()=>{const result=validateOutput({reply:'已收到',changes:null,debug:'extra'},'2026-10-24');assert.deepEqual(result,{reply:'已收到',changes:[],reviews:[],progress:[]})});
test('invalid changes get one format repair and remain unapplied when repair fails',async()=>{let calls=0;const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({...output,changes:[{...output.changes[0],date:'2027-01-01'}]})}}]})}});const response=await handle(req());const result=await response.json();assert.equal(response.status,200);assert.equal(calls,2);assert.deepEqual(result.changes,[]);assert.match(result.reply,/均未修改/)});
test('format repair can recover a valid plan without accepting the invalid first result',async()=>{let calls=0;const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(++calls===1?{...output,changes:[{date:'invalid'}]}:output)}}]})});assert.deepEqual(await(await handle(req())).json(),output);assert.equal(calls,2)});
test('image forwarded as vision block and remote image URLs rejected',async()=>{let upstreamBody;const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async(url,options)=>{upstreamBody=JSON.parse(options.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]})}});const image={dataUrl:'data:image/jpeg;base64,/9j/2Q==',mimeType:'image/jpeg',name:'test.jpg'};assert.equal((await handle(req('/chat',{body:JSON.stringify({...body,image})}))).status,200);assert.equal(upstreamBody.messages.at(-1).content[1].type,'image_url');assert.equal((await handle(req('/chat',{body:JSON.stringify({...body,image:{...image,dataUrl:'https://example.com/photo.jpg'}})}))).status,400)});
test('AI context includes task completion, past workload, knowledge, study sessions and completed reviews with bounded dates',async()=>{
 let upstreamBody;const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async(url,options)=>{upstreamBody=JSON.parse(options.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({...output,changes:[]})}}]})}});
 const context={...body.context,plans:[{date:'2026-10-24',items:['数学','408','英语','政治'],completed:[true,false,false,true]}],taskHistory:[{date:'2026-10-23',items:['数学','408','英语','政治'],completed:[false,true,false,true]}],studySessions:[{date:'2026-10-24',subject:'408',topic:'Cache',seconds:1800}],completedReviews:[{subject:'数学一',topic:'换元积分',dueDate:'2026-10-23',note:'已独立做对'}],knowledge:[{subject:'408',topic:'Cache映射和地址划分',mastered:true,note:'三种映射'}]};
 assert.equal((await handle(req('/chat',{body:JSON.stringify({...body,context})}))).status,200);assert.deepEqual(JSON.parse(upstreamBody.messages.at(-1).content).context,context);
 for(const bad of [{...context,plans:[{...context.plans[0],completed:[true]}]},{...context,taskHistory:[{...context.taskHistory[0],date:'2026-10-25'}]},{...context,studySessions:[{...context.studySessions[0],seconds:-1}]},{...context,knowledge:[{...context.knowledge[0],mastered:'yes'}]}])assert.equal((await handle(req('/chat',{body:JSON.stringify({...body,context:bad})}))).status,400);
});
test('invalid base64 reports a client validation error without crashing the endpoint',async()=>{const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:()=>{throw Error('must not call')}});const image={dataUrl:'data:image/jpeg;base64,A',mimeType:'image/jpeg',name:'bad.jpg'};assert.equal((await handle(req('/chat',{body:JSON.stringify({...body,image})}))).status,400)});
test('review rescheduling requires an existing review id and a date within the horizon',async()=>{
 const review={id:'ai:review:test-review',subject:'408',topic:'Cache',dueDate:'2026-10-24',note:'独立复测'};let value={...output,changes:[],reviewUpdates:[{id:review.id,dueDate:'2026-10-25'}]};
 const handle=createHandler(cfg,{now:()=>Date.parse('2026-10-24T09:00:00+08:00'),fetchImpl:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})});const request=()=>req('/chat',{body:JSON.stringify({...body,context:{...body.context,reviews:[review]}})});
 assert.deepEqual((await(await handle(request())).json()).reviewUpdates,value.reviewUpdates);
 value={...value,reviewUpdates:[{id:'ai:review:missing',dueDate:'2026-10-25'}]};const rejected=await(await handle(request())).json();assert.equal(rejected.reviewUpdates,undefined);assert.deepEqual(rejected.changes,[]);assert.match(rejected.reply,/均未修改/);
 assert.throws(()=>validateOutput({...value,reviewUpdates:[{id:review.id,dueDate:'2026-10-23'}]},'2026-10-24'));
});

const reliabilityOptions={now:()=>Date.parse('2026-10-24T09:00:00+08:00'),retryDelayMs:0};
const modelResponse=(value=output)=>Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]});
const idRequest=(id='reliability-test-request-001',extra={})=>req('/chat',{body:JSON.stringify({...body,requestId:id,...extra})});

test('temporary network and server failures recover with at most two retries',async()=>{
 let calls=0;const handle=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{calls++;if(calls===1)throw new TypeError('network unavailable');if(calls===2)return Response.json({error:{code:'server_error'}},{status:503});return modelResponse()}});
 assert.deepEqual(await(await handle(req())).json(),output);assert.equal(calls,3);
 let failedCalls=0;const failing=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{failedCalls++;throw new TypeError('network unavailable')}});
 const failure=await failing(req());assert.equal(failure.status,502);assert.equal((await failure.json()).error.code,'UPSTREAM_UNAVAILABLE');assert.equal(failedCalls,3);
});

test('rate limiting retries briefly, honors long Retry-After and does not retry provider quota errors',async()=>{
 let calls=0;const handle=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>++calls===1?Response.json({error:{code:'rate_limit'}},{status:429,headers:{'Retry-After':'0'}}):modelResponse()});
 assert.equal((await handle(req())).status,200);assert.equal(calls,2);
 let deferredCalls=0;const deferred=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{deferredCalls++;return Response.json({}, {status:429,headers:{'Retry-After':'120'}})}});
 const deferredResponse=await deferred(req());assert.equal((await deferredResponse.json()).error.code,'UPSTREAM_BUSY');assert.equal(deferredCalls,1);
 for(const [status,providerCode,expected] of [[402,'balance','UPSTREAM_QUOTA_EXCEEDED'],[429,'insufficient_quota','UPSTREAM_QUOTA_EXCEEDED'],[401,'key','UPSTREAM_AUTH_ERROR'],[403,'key','UPSTREAM_AUTH_ERROR'],[400,'model','UPSTREAM_CONFIG_ERROR']]){
  let permanentCalls=0;const permanent=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{permanentCalls++;return Response.json({error:{code:providerCode,message:'private provider text'}},{status})}});
  const error=(await(await permanent(req())).json()).error;assert.equal(error.code,expected);assert.equal(error.retryable,false);assert.equal(permanentCalls,1);assert.doesNotMatch(error.message,/private provider text|mock-key/);
 }
});

test('overall timeout aborts a stalled upstream and releases capacity',async()=>{
 let calls=0,aborts=0;const handle=createHandler(cfg,{...reliabilityOptions,upstreamTimeoutMs:20,fetchImpl:async(_url,{signal})=>{calls++;if(calls>1)return modelResponse();return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborts++;reject(new Error('aborted'))},{once:true}))}});
 const result=await handle(idRequest());assert.equal(result.status,504);assert.equal((await result.json()).error.code,'UPSTREAM_TIMEOUT');assert.equal(aborts,1);assert.equal(calls,1);
 assert.equal((await handle(idRequest())).status,200);assert.equal(calls,2);
});

test('request IDs share in-flight work and cached output without consuming extra model calls',async()=>{
 let calls=0,finish,started;const ready=new Promise(resolve=>started=resolve);
 const handle=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{calls++;started();return new Promise(resolve=>finish=()=>resolve(modelResponse()))}});
 const first=handle(idRequest());await ready;const second=handle(idRequest());
 // Read-only health requests stay usable during inference; then release the one shared generation.
 assert.equal((await handle(req('/health',{method:'GET',body:undefined}))).status,200);finish();
 const responses=await Promise.all([first,second]);for(const response of responses){assert.equal(response.status,200);assert.deepEqual(await response.json(),output)}
 assert.deepEqual(await(await handle(idRequest())).json(),output);assert.equal(calls,1);
 const conflict=await handle(idRequest(undefined,{message:'different report'}));assert.equal(conflict.status,409);assert.equal((await conflict.json()).error.code,'REQUEST_ID_CONFLICT');assert.equal(calls,1);
 const invalid=await handle(idRequest('short'));assert.equal(invalid.status,400);assert.equal(calls,1);
 // The cache never bypasses authentication.
 assert.equal((await handle(req('/chat',{headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:'reliability-test-request-001'})}))).status,401);
});

test('retries share their budget with format repair and do not forward requestId to the provider',async()=>{
 let calls=0;const handle=createHandler(cfg,{...reliabilityOptions,fetchImpl:async(_url,options)=>{calls++;assert.doesNotMatch(options.body,/reliability-test-request/);if(calls===1||calls===3)throw new TypeError('temporary');if(calls===2)return modelResponse({...output,changes:[{date:'invalid'}]});return modelResponse()}});
 assert.deepEqual(await(await handle(idRequest())).json(),output);assert.equal(calls,4);
});

test('an interrupted response body is retried but invalid model JSON still cannot alter the plan',async()=>{
 let calls=0;const handle=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{calls++;return calls===1?new Response(new ReadableStream({start(controller){controller.error(new TypeError('connection reset'))}})):modelResponse()}});
 assert.equal((await handle(req())).status,200);assert.equal(calls,2);
 let malformedCalls=0;const malformed=createHandler(cfg,{...reliabilityOptions,fetchImpl:async()=>{malformedCalls++;return new Response('{not json')}});
 const rejected=await malformed(req());assert.equal(rejected.status,502);assert.equal((await rejected.json()).error.code,'MODEL_RESPONSE_INVALID');assert.equal(malformedCalls,1);
});
