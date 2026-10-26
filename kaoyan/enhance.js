
(function(){
"use strict";
const planner=window.KaoyanPlan;
const startDay=new Date(2026,9,13), endDay=new Date(2026,11,18);
const fmt=x=>x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");
const today=()=>planner.studyDate();
const shift=(dt,n)=>{let x=new Date(dt);x.setDate(x.getDate()+n);return x};
const math=[
"张宇第9讲：换元积分复盘、分部积分；线代行列式概念，数学12题",
"第9讲：有理函数和三角积分；线代行列式性质，数学12题",
"第9讲：定积分换元与分部；线代行列式展开，数学12题",
"第9讲：变上限积分及求导；线代矩阵基本运算，数学12题",
"第9讲：反常积分与综合计算；线代逆矩阵，数学12题",
"第10讲：定积分面积与旋转体体积；线代矩阵秩，数学12题",
"积分与矩阵周测90分钟，订正易错题",
"第13讲：复合偏导与全微分；线代向量组，数学12题",
"第13讲：隐函数求导、多元极值；线代线性相关，数学12题",
"第14讲：二重积分区域；线代方程组有解条件，数学12题",
"第14讲：积分换序、极坐标；线代基础解系，数学12题",
"第15讲：一阶微分方程；线代特征值入门，数学12题",
"第15讲：二阶常系数微分方程；线代特征值；概率随机事件入门，数学12题",
"数学周测90分钟：积分、多元微分、线代与概率，订正",
"第16讲：数项级数收敛判别；线代相似对角化；概率条件概率",
"第16讲：幂级数、收敛域；线代正交对角化；概率全概率与贝叶斯",
"第16讲：傅里叶级数基础；线代二次型；概率独立性",
"第17讲：空间向量、直线、平面；概率分布函数",
"第17讲：空间曲面与坐标；概率离散分布、二项分布",
"第18讲：三重积分入门；概率连续分布、正态分布",
"周测90分钟：级数、线代、概率，独立订正",
"第18讲：三重积分坐标变换；概率一维随机变量函数分布",
"第18讲：第一类曲线积分；概率二维联合分布",
"第18讲：第二类曲线积分与Green公式；概率边缘分布",
"第18讲：第一、二类曲面积分；概率条件分布与独立性",
"第18讲：Gauss、Stokes公式；概率二维函数分布",
"高数第10—12讲基础应用查漏；概率期望、方差、协方差",
"周测90分钟：多元积分、二维分布、线代综合",
"高数微分方程与级数基础题；概率总体、样本及统计量",
"线代矩阵和方程组专题；概率三大抽样分布",
"高数极限、中值定理查漏；概率矩估计",
"高数定积分应用与计算；概率最大似然估计",
"线代特征值、二次型综合；概率区间估计",
"高数多元微分和重积分；概率假设检验",
"周测90分钟：概率统计、线代及高数",
"概率：假设检验、统计量计算；数学精选题16道",
"高数：极限与泰勒展开专题；线代计算12道",
"高数：不定积分、定积分、反常积分专题16道",
"高数：多元积分、曲线曲面积分专题14道",
"线代：向量组、线性方程组、二次型专题16道",
"概率：二维分布、数字特征与估计专题16道",
"周测90分钟：数学三部分综合；错题复测",
"高数：极限、导数、中值定理跨章节训练20道",
"线代：矩阵、秩、线性方程组专题20道",
"概率：二维分布、数字特征、估计专题18道",
"高数：微分方程、级数、积分专题18道",
"高数：多元微分、重积分专题18道",
"数学一混合限时训练120分钟，集中订正",
"数学阶段综合测试120分钟，整理失分前5专题",
"2023年数学一整卷180分钟＋重点订正",
"2023年数学错题复做；线代、概率薄弱题12道",
"积分与概率专题练习16道，控制计算时间",
"极限、多元微分专项16道＋公式整理",
"2024年数学一整卷180分钟＋重点订正",
"2024年数学错题复做，补最弱专题",
"2023—2024年数学错题限时复测15道",
"2025年数学一整卷180分钟＋重点订正",
"2025年数学错题复做；线代与概率12道",
"计算与综合题补漏15道，不开启新课程",
"高数与线代跨章节题18道，重点做错题变式",
"2026年数学一整卷180分钟＋重点订正",
"2026年数学错题复做12道",
"数学四套整卷反复失分题型复测12道",
"线代特征值、矩阵和概率公式回顾10道",
"高数积分、级数、微分方程经典题10道",
"数学公式过一遍，熟题8道，别再做偏怪题",
"轻量复习：公式和基础小题6道，早休息"
];
const cs=[
"计组主存概念与容量、编址；计网分层与时延，选择12题",
"主存存储芯片与扩展；计网物理层、传输速率，选15＋综1",
"主存结构和访存；计网差错检验、CRC，选15＋综1",
"Cache基础、直接映射；计网以太网和MAC，选15＋综1",
"Cache组相联、地址划分；IPv4地址，选15＋综1",
"虚存、页表入门；计网子网划分；OS PV综合1题",
"408周测90分钟：主存Cache、网络前两层＋订正",
"页表、TLB地址转换；CIDR与路由表，选15＋综1",
"虚拟存储计算；最长前缀匹配，选15＋综1",
"指令格式、寻址方式；UDP与TCP入门，选15＋综1",
"指令执行过程；TCP握手挥手，选15＋综1",
"CPU数据通路、流水线；TCP可靠传输，选15＋综1",
"流水线性能；TCP流量、拥塞控制，选15＋综1",
"408周测90分钟：Cache、指令、CPU、TCP",
"CPU控制器、指令周期；计网DNS和HTTP，选15＋综1",
"总线、传输与仲裁；计网FTP、邮件，选15＋综1",
"中断、DMA、I/O；网络基本协议综合，选15＋综1",
"计组主存、Cache、虚存混合计算20选＋综1",
"计网IPv4、路由、TCP混合计算20选＋综1",
"数据结构：顺序表、链表手写算法；计组综合",
"408周测90分钟：计组+计网主干，订正",
"数据结构：栈、队列、树，选18＋算法1",
"数据结构：二叉树遍历、BST、AVL，选18＋综1",
"数据结构：图、DFS、BFS、最短路，选18＋算1",
"数据结构：查找、哈希、B树，选18＋综1",
"数据结构：排序、复杂度，选18＋综1",
"操作系统：进程、线程、调度，选18＋综1",
"408周测90分钟：数据结构＋操作系统",
"操作系统PV、生产者消费者，选15＋综2",
"操作系统死锁、银行家算法，选15＋综2",
"操作系统分页、地址转换，选18＋综1",
"操作系统页面置换、缺页次数，选18＋综1",
"操作系统文件与磁盘调度，选18＋综1",
"计组：流水线性能、数据通路，选18＋综1",
"408周测：进程PV、死锁、存储管理、计组",
"计网：IP路由、CIDR、NAT，选18＋综1",
"计网：TCP窗口、序号、拥塞控制，选18＋综1",
"计组：补码、浮点、Cache综合，选18＋综2",
"数据结构：图算法、排序手工模拟，选18＋算1",
"操作系统：PV、分页、文件系统，选18＋综2",
"408：C语言链表与树算法2题＋选择12道",
"408周测90分钟，整理四科错题",
"数据结构：链表、树、图算法2题＋选12",
"操作系统：PV、死锁、分页，选20＋综2",
"计组：Cache、页表、流水线，选20＋综2",
"计网：TCP、IP、路由、CRC，选20＋综2",
"数据结构：排序、查找、图，选18＋综2",
"408混合限时120分钟，综合大题训练",
"408阶段综合测试120分钟，整理错题前5专题",
"数据结构算法手写1题＋选择12道",
"2023年408整卷180分钟＋重点订正",
"2023年408错题复做，选15＋综2",
"计组Cache、操作系统PV，选15＋综2",
"数据结构算法手写1题＋选择10道",
"2024年408整卷180分钟＋重点订正",
"2023—2024年408错题复测，选15＋综2",
"408选12＋综1保持手感",
"2025年408整卷180分钟＋重点订正",
"计组与OS专题练习，选15＋综2",
"算法手写2题＋计网选择15题",
"408选12＋综1保持手感",
"2026年408整卷180分钟＋重点订正",
"408反复错题复测，选15＋综2",
"主存、Cache、流水线，选12＋综1",
"链表算法、PV与TCP，选12＋算1",
"四科公式图表、基础题10道",
"轻量复习：408基础选择8道，检查考试用品"
];
if(math.length!==67||cs.length!==67)throw Error("计划日期数不符："+math.length+"/"+cs.length);
const englishCycle=[
"阅读理解A真题1篇＋复习30词，整理错因",
"完形填空1套20空＋词汇复盘",
"小作文独立写1篇＋新题型1组",
"阅读A真题1篇＋长难句2句＋翻译",
"完形填空1套20空＋新题型1组",
"大作文写1篇＋修改语法与结构",
"阅读A真题1篇＋本周生词和错题复盘"
];
const politicsFocus=["马原基础与辩证法","马原认识论、政治经济学","史纲历史主线","毛中特理论框架","习近平新时代中国特色社会主义思想","思法及当年时政","全科选择题错题"];
const schedule=math.map((m,i)=>{
let date=fmt(shift(startDay,i)),dow=i%7,week=Math.floor(i/7);
let en=i>=49&&i<=62?(i===52||i===58?"英语一真题整卷180分钟，集中订正":"英语阅读、新题型、作文错题复盘，约60分钟"):
(i>=63?"英语作文结构、单词、常错题轻量回顾":englishCycle[dow]);
let po=i>=49?(i===62?"政治整卷模拟与订正":"当年政治分析题背诵＋选择题错题"):("政治："+politicsFocus[Math.min(week,6)]+"；肖1000题15道"+(dow===5?"＋分析题提纲1道":""));
return {date,items:[m,cs[i],en,po]};});
d.meta=d.meta||{done:{},notes:{},plan:{}};
for(const x of ["done","notes","plan"])d.meta[x]=d.meta[x]||{};
d.plan=d.plan||{};
for(const [k,v] of Object.entries(d.done))if(!(k in d.meta.done))d.meta.done[k]=d.changed||0;
for(const [k,v] of Object.entries(d.notes))if(!(k in d.meta.notes))d.meta.notes[k]=d.changed||0;
for(const [k,v] of Object.entries(d.plan))if(!(k in d.meta.plan))d.meta.plan[k]=d.changed||0;
localStorage.setItem(K,JSON.stringify({...d,timer:null}));
let savedState=structuredClone(d);
const nav=document.querySelector(".nav");
nav.insertAdjacentHTML("afterbegin",'<button data-page="dashboard" class="active">今日计划</button><button data-page="analytics">学习统计</button>');
$("study").classList.add("hidden");
nav.querySelector('[data-page="study"]').classList.remove("active");
const dashboard=document.createElement("section");
dashboard.id="dashboard";dashboard.className="panel";
dashboard.innerHTML='<div class="dashboard-heading"><div><h2>今日学习任务</h2><p class="muted">10月24日起按实际进度重排 · 数学与408优先</p></div><span class="pill" id="dayProgress">0 / 4 已完成</span></div><div class="tools"><label for="planDate">学习日</label><input type="date" id="planDate" min="2026-10-13" max="2026-12-18"><button id="goToday">返回今天</button></div><div id="planContext" class="plan-context"></div><div class="today-grid" id="todayTasks"></div><div class="tools"><button id="goJournal">记录这天学了什么</button><button id="goTimer" class="primary">打开专注计时</button></div><div class="routine-head"><h3>每天的固定作息</h3><span class="routine-pill" id="routineStatus">按北京时间显示</span></div><div class="routine-summary">数学 <b>4小时</b> · 408 <b>4小时</b> · 英语 <b>1小时30分</b> · 政治 <b>1小时</b><br>净学习 <b>10小时30分</b>，数学与408占约76%；听课、练题、订正都在时段内。</div><details class="routine-details" open><summary>查看作息时间表</summary><div id="routineRows"></div></details><p class="muted">00:00—01:00的英语归入前一学习日，每天03:00切换日期。计时结束保存到开始时的学习日。</p><details class="phase-details"><summary>查看接下来8周的阶段目标</summary><div class="phase-list" id="phaseList"></div><p class="muted">阶段目标按独立做题情况调整。第7天用于周测和补漏；未完成内容优先保留最重要的1—2项。整卷训练当天调整时间块，订正仍包含在当天预算内。临考一周逐步减少晚间强度。</p></details><p class="muted">初试时间依据 <a href="https://yz.chsi.com.cn/yzwb/" target="_blank" rel="noopener">研招网官方安排</a>，具体考场安排以准考证为准。</p>';

nav.after(dashboard);
const countdownPanel=document.createElement("section");
countdownPanel.id="countdownPanel";countdownPanel.className="countdown-panel";
countdownPanel.setAttribute("aria-labelledby","countdownTitle");
countdownPanel.innerHTML='<div class="countdown-intro"><div class="eyebrow">2027 / 考研倒计时</div><h2 id="countdownTitle">距离初试，还有</h2><p>2026年12月19日 08:30 · 北京时间</p></div><div class="countdown-clock" role="timer" aria-label="距离考研初试的时间">'+[["countDays","天"],["countHours","时"],["countMinutes","分"],["countSeconds","秒"]].map(([id,label])=>'<div class="count-unit"><strong id="'+id+'">00</strong><span>'+label+'</span></div>').join("")+'</div><div class="exam-phases" id="examPhases"></div>';
document.querySelector("main").prepend(countdownPanel);

const analytics=document.createElement("section");
analytics.id="analytics";analytics.className="panel hidden";
analytics.innerHTML='<div class="dashboard-heading"><h2>近7天学习时长</h2><span class="pill" id="weekTotal">0小时</span></div><p class="muted">每天结束计时后自动归入对应科目。图表显示最近7天的有效时长。</p><div class="subject-legend" id="legend"></div><div id="weeklyBars"></div><h3>各科累计</h3><div class="stats-subject" id="allSubjects"></div>';
dashboard.after(analytics);
$("stats").closest(".panel").classList.add("overview-stats");
const pages=["dashboard","study","timer","journal","cloud","analytics"];
function switchPage(name){document.body.classList.toggle("coach-active",name==="coach"||name==="account");nav.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===name));pages.forEach(p=>$(p).classList.toggle("hidden",p!==name));if(name==="analytics")renderAnalytics();if(name==="dashboard")renderDashboard();if(name==="timer")showSessions();}
nav.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
$("goTimer").onclick=()=>switchPage("timer");$("goJournal").onclick=()=>{$("date").value=planDate;$("note").value=d.notes["day:"+planDate]||"";switchPage("journal")};
$("date").value=today();$("note").value=d.notes["day:"+today()]||"";
let planDate=today();
if(planDate<"2026-10-13")planDate="2026-10-13";
if(planDate>"2026-12-18")planDate="2026-12-18";
$("planDate").value=planDate;
$("planDate").onchange=()=>{planDate=$("planDate").value;renderDashboard()};
$("goToday").onclick=()=>{planDate=today();if(planDate<"2026-10-13")planDate="2026-10-13";if(planDate>"2026-12-18")planDate="2026-12-18";$("planDate").value=planDate;renderDashboard()};
const names=["数学一","408","英语一","政治"];
const colors={"数学一":"#3184bc","408":"#239783","英语一":"#916cc3","政治":"#d69e53"};
const budgets=["4小时","4小时","1小时30分","1小时"];
function basePlan(date){return planner.getPlan(date)||schedule.find(row=>row.date===date)}
function effectivePlan(date){const base=basePlan(date);if(!base)return null;const row={...base,items:[...base.items]};row.items=row.items.map((value,i)=>{try{const edit=JSON.parse(d.notes["ai:plan:"+date+"|"+i]||"null");return edit&&typeof edit.content==="string"?edit.content:value}catch{return value}});return row}
function selectedPlan(){return effectivePlan(planDate)}
function taskDone(date,index,row=effectivePlan(date)){
 if(!row)return false;const key=(row.revision?row.revision+"|":"")+date+"|"+index;
 const recorded=d.notes["ai:completion:"+date+"|"+index];return !!d.plan[key]&&(!recorded||recorded===row.items[index]);
}
function renderDashboard(){
const info=selectedPlan();
if(!info){$("todayTasks").innerHTML='<p>此日期不在复习计划内</p>';$("dayProgress").textContent="0 / 0";return}
const revised=!!info.revision;let cnt=0;
$("planContext").textContent=revised?(info.phase+" · 从当前章节接着学，已完成内容保留。"):("历史计划 · 10月23日前的任务和勾选记录保留，按当时版本展示。");
$("todayTasks").innerHTML=info.items.map((text,i)=>{
 const key=(revised?info.revision+"|":"")+info.date+"|"+i;if(taskDone(info.date,i,info))cnt++;
 return '<div class="today-task"><div class="tag">'+names[i]+'<span class="task-budget">'+(revised?budgets[i]:"历史任务")+'</span></div><label><input type="checkbox" aria-label="完成'+names[i]+'当天任务" data-pk="'+key+'" '+(taskDone(info.date,i,info)?"checked":"")+'><span>'+esc(text)+'</span></label><button class="task-start" data-start-subject="'+i+'">现在学'+names[i]+'</button></div>';
}).join("");
$("dayProgress").textContent=cnt+" / 4 已完成";
$("todayTasks").querySelectorAll("[data-pk]").forEach(el=>el.onchange=()=>{d.plan[el.dataset.pk]=el.checked;d.meta.plan[el.dataset.pk]=Date.now();if(el.checked){const i=Number(el.dataset.pk.split("|").at(-1)),key="ai:completion:"+info.date+"|"+i;d.notes[key]=info.items[i];d.meta.notes[key]=Date.now()}save()});
$("todayTasks").querySelectorAll("[data-start-subject]").forEach(el=>el.onclick=()=>beginTask(names[Number(el.dataset.startSubject)],info.items[Number(el.dataset.startSubject)]));
renderRoutine();
$("phaseList").innerHTML=planner.PHASES.map(row=>'<div class="phase-row '+(planDate>=row.start&&planDate<=row.end?'current':'')+'"><div class="time">'+row.start.slice(5)+'—'+row.end.slice(5)+'</div><div><b>'+row.name+'</b><p>数学：'+esc(row.math)+'</p><p>408：'+esc(row.cs)+'</p><p>政治：'+esc(row.politics)+'</p></div></div>').join("");
}
function beginTask(subject,topic){
 switchPage("timer");
 if(d.timer){$("timerNotice").textContent="当前已有一条"+(d.timer.running?"正在进行":"暂停中")+"的计时，请先结束记录；暂停的计时也可以直接继续。";return}
 $("subj").value=subject;$("topic").value=topic;$("start").click();
}
function renderRoutine(){
 $("routineRows").innerHTML=planner.ROUTINE.map((row,i)=>'<div class="routine-row '+row.kind+'" data-routine="'+i+'"><div class="time">'+row.time+'</div><div class="routine-info"><div class="routine-name">'+row.name+'</div><div class="routine-note">'+row.note+'</div></div>'+(row.subject?'<button class="routine-start" data-routine-start="'+i+'" aria-label="开始'+row.name+'计时">开始计时</button>':'<span class="routine-pill">休息</span>')+'</div>').join("");
 $("routineRows").querySelectorAll("[data-routine-start]").forEach(el=>el.onclick=()=>{const row=planner.ROUTINE[Number(el.dataset.routineStart)];beginTask(row.subject,row.name)});
 updateLive();
}
function updateLive(){
 const left=planner.countdown(planner.EXAMS[0].at);
 for(const [id,field] of [["countDays","days"],["countHours","hours"],["countMinutes","minutes"],["countSeconds","seconds"]])$(id).textContent=String(left[field]).padStart(2,"0");
 $("countdownTitle").textContent=left.ended?(planner.examState(planner.EXAMS[3])==="已结束"?"初试已结束":"初试已开始"):"距离初试，还有";
 $("examPhases").innerHTML=planner.EXAMS.map(exam=>{const remaining=planner.countdown(exam.at),state=planner.examState(exam);return '<div><b>'+exam.subject+'</b><span>'+exam.label+'</span><strong>'+(remaining.ended?state:remaining.days+'天 '+remaining.hours+'小时')+'</strong></div>'}).join("");
 const active=planner.activeRoutine();
 $("routineRows").querySelectorAll("[data-routine]").forEach(el=>{const isCurrent=Number(el.dataset.routine)===active;el.classList.toggle("current",isCurrent);if(isCurrent)el.setAttribute("aria-current","time");else el.removeAttribute("aria-current")});
 $("routineStatus").textContent=active>=0?"现在 · "+planner.ROUTINE[active].name:"休息时间";
}
// Keep sessions attached to the study day on which they start, including midnight.
const timerNotice=document.createElement("p");timerNotice.id="timerNotice";timerNotice.className="muted";$("clock").after(timerNotice);
$("start").onclick=()=>{
 if(d.timer?.running)return;
 if(!d.timer)d.timer={subject:$("subj").value,topic:$("topic").value,mode:$("mode").value,acc:0,at:Date.now(),running:true,studyDate:today()};
 else{d.timer.at=Date.now();d.timer.running=true;d.timer.studyDate=d.timer.studyDate||today()}
 $("timerNotice").textContent="正在记录："+d.timer.subject+" · 学习日 "+d.timer.studyDate;
 save();display();
};
finish=function(){
 if(!d.timer)return;
 const timer=d.timer,limit=Number(timer.mode||0)*60000;
 const seconds=Math.floor((limit?Math.min(elapsed(),limit):elapsed())/1000);
 if(seconds>=1)d.sessions.unshift({subject:timer.subject,topic:timer.topic,seconds,date:timer.studyDate||today(),id:Date.now()});
 d.timer=null;$("timerNotice").textContent=seconds>=1?"已保存本次专注记录":"本次不足1秒，未生成记录";
 save();display();showSessions();
};
$("end").onclick=()=>finish();
update=function(){
 const all=Object.values(GROUPS).flatMap(x=>Object.values(x).flat()),done=Object.keys(d.done).filter(k=>d.done[k]).length;
 const total=d.sessions.reduce((sum,session)=>sum+(Number(session.seconds)||0),0),daily=d.sessions.filter(session=>session.date===today()).reduce((sum,session)=>sum+(Number(session.seconds)||0),0);
 $("stats").innerHTML=[["已攻克",done+"/"+all.length],["学习时长",Math.floor(total/3600)+"小时"],["专注次数",d.sessions.length],["本学习日",Math.floor(daily/60)+"分钟"]].map(([label,value])=>'<div class="stat"><strong>'+value+'</strong><span class="sub">'+label+'</span></div>').join("");
 $("progress").style.width=Math.min(100,done/all.length*100)+"%";
};
let lastStudyDay=today();
setInterval(()=>{const next=today();if(next!==lastStudyDay){if(planDate===lastStudyDay){planDate=next<"2026-10-13"?"2026-10-13":next>"2026-12-18"?"2026-12-18":next;$("planDate").value=planDate;renderDashboard()}if($("date").value===lastStudyDay){$("date").value=next;$("note").value=d.notes["day:"+next]||""}lastStudyDay=next;update();renderAnalytics();document.dispatchEvent(new Event("kaoyan:data"))}updateLive()},1000);
function duration(s){const m=Math.floor(s/60);return m>=60?Math.floor(m/60)+"小时"+(m%60?m%60+"分":""):m+"分钟"}
function renderAnalytics(){
const days=Array.from({length:7},(_,i)=>planner.dateShift(today(),i-6));
const tally={};const total={};for(const day of days)tally[day]={};
for(const s of d.sessions){const seconds=Number(s.seconds)||0;total[s.subject]=(total[s.subject]||0)+seconds;if(tally[s.date])tally[s.date][s.subject]=(tally[s.date][s.subject]||0)+seconds}
const max=Math.max(3600,...days.map(day=>Object.values(tally[day]).reduce((a,b)=>a+b,0)));
$("legend").innerHTML=names.map(n=>'<span style="--dot:'+colors[n]+'">'+n+'</span>').join("");
let weekSecs=0;
$("weeklyBars").innerHTML=days.map(day=>{
const sum=Object.values(tally[day]).reduce((a,b)=>a+b,0);weekSecs+=sum;
const inner=names.map(n=>'<div title="'+n+' '+duration(tally[day][n]||0)+'" style="background:'+colors[n]+';width:'+((tally[day][n]||0)/max*100)+'%"></div>').join("");
return '<div class="barline"><span>'+day.slice(5)+'</span><div class="stackbar">'+inner+'</div><b>'+duration(sum)+'</b></div>'}).join("");
$("weekTotal").textContent=duration(weekSecs);
$("allSubjects").innerHTML=names.map(n=>'<div><span class="muted">'+n+'</span><b>'+duration(total[n]||0)+'</b></div>').join("");
}
function readStored(){try{return JSON.parse(localStorage.getItem(K)||"{}")}catch{return {}}}
function persist(next=d){
 const latest=readStored(),candidate=structuredClone(next);
 for(const f of ["done","notes","plan"])for(const k of Object.keys(candidate[f]||{})){
  if(candidate[f][k]!==savedState[f]?.[k])candidate.meta[f][k]=Math.max(Date.now(),(candidate.meta[f][k]||0),(latest.meta?.[f]?.[k]||0)+1);
 }
 const result={...candidate,...merged(latest,candidate),timer:candidate.timer};result.changed=Math.max(Date.now(),result.changed||0);
 try{localStorage.setItem(K,JSON.stringify({...result,timer:null}))}
 catch(error){$("status").textContent="本机保存失败，请保留页面并释放浏览器存储空间";throw Error("本机存储空间不足或不可用，未能保存本次更改。")}
 d=result;savedState=structuredClone(d);try{sessionStorage.setItem(TIMER_KEY,JSON.stringify(d.timer))}catch{$("timerNotice").textContent="计时暂存失败，请结束并记录本次学习。"}return d;
}
function redraw(){renderDashboard();renderAnalytics();update();showSessions();document.dispatchEvent(new Event("kaoyan:data"))}
function scheduleSync(){if(connected){$("status").textContent="本机已保存 · 云端待同步";clearTimeout(syncLater);syncLater=setTimeout(push,20000)}}
save=function(){persist();redraw();scheduleSync()};
window.addEventListener("storage",event=>{
 if(event.key!==K||!event.newValue)return;
 try{const remote=JSON.parse(event.newValue),copy=merged(d,remote);d={...d,...copy};savedState=structuredClone(d);redraw();renderTasks();if(document.activeElement!==$("note"))$("note").value=d.notes["day:"+$("date").value]||""}catch{}
});
document.addEventListener("change",e=>{if(e.target.matches("#items [data-key]")){d.meta.done[e.target.dataset.key]=Date.now()}},true);
document.addEventListener("input",e=>{
if(e.target.matches("#items [data-note]"))d.meta.notes[e.target.dataset.note]=Date.now();
if(e.target.id==="note")d.meta.notes["day:"+$("date").value]=Date.now();
},true);
const cloud=$("cloud");
cloud.insertAdjacentHTML("beforeend",'<label class="cloud-label"><input type="checkbox" id="rememberToken"><span><b>在此浏览器记住GitHub授权</b>（可选）。勾选后，重新打开网页将自动尝试连接，无需反复粘贴。<br>注意：令牌会保存在本设备浏览器中，和同域其他网页共享安全边界；只建议在私人电脑上使用，并确保令牌仅授权考研数据私有仓库。</span></label><p class="cloud-state" id="syncDetails">未授权时所有勾选、日志和计时仍自动保存在本机。云端同步需要单独授权，ChatGPT的GitHub连接不能代替网页授权。</p>');
const TOKEN_KEY="kaoyan-gh-token-private";
$("rememberToken").checked=!!localStorage.getItem(TOKEN_KEY);
if($("rememberToken").checked)$("token").value=localStorage.getItem(TOKEN_KEY);
$("rememberToken").onchange=()=>{if(!$("rememberToken").checked)localStorage.removeItem(TOKEN_KEY);else if(cloudToken)localStorage.setItem(TOKEN_KEY,cloudToken)};
function normalized(data){
const z=data&&typeof data==="object"?data:{};
const x={done:{...z.done},notes:{...z.notes},plan:{...z.plan},sessions:Array.isArray(z.sessions)?z.sessions:[],meta:{done:{...z.meta?.done},notes:{...z.meta?.notes},plan:{...z.meta?.plan}},changed:z.changed||0};
for(const f of ["done","notes","plan"])for(const k of Object.keys(x[f]))if(x.meta[f][k]===undefined)x.meta[f][k]=x.changed;
return x;
}
function merged(a,b){
const left=normalized(a),right=normalized(b),res={done:{},notes:{},plan:{},sessions:[],meta:{done:{},notes:{},plan:{}},changed:Math.max(left.changed,right.changed)};
for(const f of ["done","notes","plan"]){
const keys=new Set([...Object.keys(left[f]),...Object.keys(right[f])]);
for(const k of keys){const lm=left.meta[f][k]??-1,rm=right.meta[f][k]??-1,useRight=rm>lm||(lm===rm&&(!(k in left[f])||JSON.stringify(right[f][k])>JSON.stringify(left[f][k])));res[f][k]=useRight?right[f][k]:left[f][k];res.meta[f][k]=Math.max(lm,rm)}
}
const sessions=new Map();for(const s of [...right.sessions,...left.sessions])sessions.set(String(s.id||s.date+"|"+s.subject+"|"+s.seconds+"|"+s.topic),s);
res.sessions=[...sessions.values()].sort((x,y)=>(Number(y.id)||0)-(Number(x.id)||0));
return res;
}
function replaceData(payload){
const copy={...d,...merged(d,payload)};
// Remote values keep their original field timestamps; they are not local edits.
const prior=savedState;savedState=structuredClone(copy);try{persist(copy)}catch(error){savedState=prior;throw error}
renderTasks();renderDashboard();renderAnalytics();update();showSessions();document.dispatchEvent(new Event("kaoyan:data"));
if(document.activeElement!==$("note"))$("note").value=d.notes["day:"+$("date").value]||"";
}
function cloudData(){const n=normalized(d);return {...n,version:2}}
function sameCloudState(a,b){
 const left=normalized(a),right=normalized(b);
 for(const field of ['notes','plan','done'])for(const key of new Set([...Object.keys(left[field]),...Object.keys(right[field])]))if(left[field][key]!==right[field][key]||left.meta[field][key]!==right.meta[field][key])return false;
 return JSON.stringify(left.sessions.map(x=>JSON.stringify(x)).sort())===JSON.stringify(right.sessions.map(x=>JSON.stringify(x)).sort());
}
async function getRemote(){try{const r=await req(uri);sha=r.sha;return JSON.parse(dec(r.content))}catch(e){if(e.code===404){sha="";return null}throw e}}
let syncing=false,lastSynced=0,connectionGeneration=0;
const CLOUD_RETRY_DELAYS=[3000,10000,30000];
let cloudRetryTimer=null,cloudRetryCount=0,cloudRetryPaused=false,cloudRecoverable=false,lastOnlineProbe=0;
function resetCloudRecovery(){clearTimeout(cloudRetryTimer);cloudRetryTimer=null;cloudRetryCount=0;cloudRetryPaused=false;cloudRecoverable=false}
function cloudFailure(error,generation){
 const code=Number(error.code)||0;
 const retryable=error instanceof TypeError||error.name==='AbortError'||/连接超时/.test(error.message)||code===408||code===429||code>=500&&code<=599||code===409||code===422;
 if(!retryable){resetCloudRecovery();connected=false;state((code===401||code===403?'云端授权已失效，请重新连接：':'云端同步失败：')+error.message+'。本机内容仍已保存。',false);return}
 cloudRecoverable=true;
 if(navigator.onLine===false){cloudRetryPaused=true;state('当前已离线，本机内容已保存；联网后会检查并恢复云端同步。',false);return}
 if(cloudRetryCount>=CLOUD_RETRY_DELAYS.length){cloudRetryPaused=true;state('云端暂时无法连接，自动重试已暂停。本机内容已保存；可点击“立即同步”重试。',false);return}
 const delay=CLOUD_RETRY_DELAYS[cloudRetryCount++];
 state((code===409||code===422?'检测到并发修改，稍后重新合并':'云端连接暂时中断，本机内容已保存')+'；'+delay/1000+'秒后重试（'+cloudRetryCount+'/'+CLOUD_RETRY_DELAYS.length+'）。',false);
 cloudRetryTimer=setTimeout(()=>{cloudRetryTimer=null;if(connected&&generation===connectionGeneration)synchronize()},delay);
}
function state(msg,cloudOk){$("cloudStatus").textContent=msg;$("syncDetails").textContent=msg;$("status").textContent=cloudOk?"云端已同步":"本机已保存 · "+(connected?"等待云端同步":"未连接云端")}
async function synchronize(){
if(!connected||syncing||cloudRetryPaused||cloudRetryTimer!==null)return;
if(navigator.onLine===false){cloudRecoverable=true;cloudRetryPaused=true;state('当前已离线，本机内容已保存；联网后会检查并恢复云端同步。',false);return}
syncing=true;const generation=connectionGeneration;
let start=d.changed;
try{
const remote=await getRemote();if(!connected||generation!==connectionGeneration)return;
if(remote&&!sameCloudState(remote,d)){replaceData(remote)}
start=d.changed;
const payload=JSON.stringify(cloudData());
if(remote&&sameCloudState(remote,d)){lastSynced=Date.now();resetCloudRecovery();state("已与私有云端保持一致 · "+new Date().toLocaleTimeString(),true);return}
const response=await req(uri,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"Sync 2027 study progress",content:enc(payload),...(sha?{sha}:{}),branch:"main"})});
if(!connected||generation!==connectionGeneration)return;sha=response.content.sha;lastSynced=Date.now();resetCloudRecovery();
if(d.changed===start)state("云端同步成功 · "+new Date().toLocaleTimeString(),true);
else{state("上次数据已保存，但出现新编辑，即将继续同步",false);setTimeout(synchronize,2500)}
}catch(e){
if(!connected||generation!==connectionGeneration)return;
cloudFailure(e,generation);
}finally{syncing=false;if(connected&&generation!==connectionGeneration)setTimeout(synchronize,0)}
}
push=synchronize;
$("connect").onclick=async()=>{
const generation=++connectionGeneration;resetCloudRecovery();clearTimeout(syncLater);connected=false;cloudToken=$("token").value.trim();
if(!cloudToken){state("请在此页面填写私有数据仓库的最小权限令牌",false);return}
state("正在验证私有仓库权限……",false);
try{const repo=await req("https://api.github.com/repos/cool-boy2024/kaoyan-study-data");if(generation!==connectionGeneration)return;if(!repo.private)throw Error("数据仓库不是Private，请停止连接");
if($("rememberToken").checked)localStorage.setItem(TOKEN_KEY,cloudToken);else localStorage.removeItem(TOKEN_KEY);
connected=true;state("权限验证成功，正在合并并同步记录……",false);await synchronize();
}catch(e){if(generation!==connectionGeneration)return;connected=false;state("连接失败："+e.message,false)}
};
$("sync").onclick=()=>{if(!connected){state("请先连接GitHub",false);return}resetCloudRecovery();synchronize()};
$("disconnect").onclick=()=>{connectionGeneration++;clearTimeout(syncLater);resetCloudRecovery();connected=false;cloudToken="";localStorage.removeItem(TOKEN_KEY);$("token").value="";$("rememberToken").checked=false;state("已断开并清除本机保存的访问令牌，学习数据依然保存在本机",false)};
window.addEventListener('online',()=>{
 if(!connected||!cloudRecoverable||syncing||Date.now()-lastOnlineProbe<5000)return;
 lastOnlineProbe=Date.now();resetCloudRecovery();state('网络已恢复，正在检查并同步云端记录……',false);synchronize();
});
setInterval(async()=>{if(connected&&!syncing&&!cloudRetryPaused&&cloudRetryTimer===null&&Date.now()-lastSynced>90000)await synchronize()},30000);
window.KaoyanUI={
registerPage(name,title,element){if(pages.includes(name))return;pages.push(name);element.id=name;element.classList.add("hidden");dashboard.after(element);const button=document.createElement("button");button.dataset.page=name;button.textContent=title;button.onclick=()=>switchPage(name);nav.append(button)},
showPage:switchPage,isTaskDone:taskDone,getBasePlan:basePlan,getPlan:effectivePlan,getStudyDate:today,dateShift:planner.dateShift,
readState(){d={...d,...merged(d,readStored())};savedState=structuredClone(d);return JSON.parse(JSON.stringify({notes:d.notes,plan:d.plan,done:d.done,sessions:d.sessions,meta:d.meta}))},
patch(patch){const next=structuredClone(d);for(const field of ["notes","plan"])for(const [key,value] of Object.entries(patch[field]||{})){if(field==="notes"&&(!key.startsWith("ai:")||typeof value!=="string"))throw Error("Invalid note");if(field==="plan"&&typeof value!=="boolean")throw Error("Invalid completion");next[field][key]=value;next.meta[field][key]=Math.max(Date.now(),(next.meta[field][key]||0)+1)}persist(next);redraw();scheduleSync()},
refresh(){renderDashboard();renderAnalytics();document.dispatchEvent(new Event("kaoyan:data"))}
};
renderDashboard();renderAnalytics();update();switchPage("dashboard");
if($("rememberToken").checked&&$("token").value)setTimeout(()=>$("connect").click(),500);
})();

