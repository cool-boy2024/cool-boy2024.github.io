(function (root) {
  'use strict';
  const VERSION = '20261023-v4';
  const FIRST_DAY = '2026-10-24';
  const LAST_DAY = '2026-12-18';
  const DAY_MS = 86400000;
  const OFFSET_MS = 8 * 3600000;
  const EXAMS = [
    { subject: '政治', at: '2026-12-19T08:30:00+08:00', label: '12月19日 08:30' },
    { subject: '英语一', at: '2026-12-19T14:00:00+08:00', label: '12月19日 14:00' },
    { subject: '数学一', at: '2026-12-20T08:30:00+08:00', label: '12月20日 08:30' },
    { subject: '408', at: '2026-12-20T14:00:00+08:00', label: '12月20日 14:00' }
  ];
  const ROUTINE = [
    { start: 540, end: 630, time: '09:00–10:30', name: '高数 · 新内容与例题', subject: '数学一', kind: 'math', note: '从第九讲当前位置继续，关掉解析独立做题。' },
    { start: 630, end: 645, time: '10:30–10:45', name: '休息', kind: 'rest', note: '起身、喝水，离开屏幕。' },
    { start: 645, end: 735, time: '10:45–12:15', name: '高数 · 配套题与订正', subject: '数学一', kind: 'math', note: '先订正，再做同类题；不无限延长听课。' },
    { start: 735, end: 840, time: '12:15–14:00', name: '午餐与午休', kind: 'rest', note: '留出完整休息时间。' },
    { start: 840, end: 900, time: '14:00–15:00', name: '线代 / 概率', subject: '数学一', kind: 'math', note: '隔天轮换；先把当前小节学扎实。' },
    { start: 900, end: 915, time: '15:00–15:15', name: '休息', kind: 'rest', note: '准备切换科目。' },
    { start: 915, end: 975, time: '15:15–16:15', name: '计组 · 新内容与题目', subject: '408', kind: 'cs', note: '从Cache命中率与平均访问时间继续。' },
    { start: 975, end: 1005, time: '16:15–16:45', name: '英语单词', subject: '英语一', kind: 'english', note: '保留每天30分钟背词。' },
    { start: 1005, end: 1140, time: '16:45–19:00', name: '晚餐、活动与休息', kind: 'rest', note: '恢复精力，为晚间408留出完整时间。' },
    { start: 1140, end: 1230, time: '19:00–20:30', name: '计网 · 新内容与题目', subject: '408', kind: 'cs', note: '从链路层设备继续，接着推进网络层。' },
    { start: 1230, end: 1245, time: '20:30–20:45', name: '休息', kind: 'rest', note: '短暂离开书桌。' },
    { start: 1245, end: 1335, time: '20:45–22:15', name: '408 · 综合题与复做', subject: '408', kind: 'cs', note: '计组、数据结构、操作系统轮换；旧科目直接用题检验。' },
    { start: 1335, end: 1350, time: '22:15–22:30', name: '收拾与休息', kind: 'rest', note: '结束408时段，准备洗澡。' },
    { start: 1350, end: 1380, time: '22:30–23:00', name: '洗澡', kind: 'rest', note: '固定半小时。' },
    { start: 1380, end: 1440, time: '23:00–00:00', name: '政治', subject: '政治', kind: 'politics', note: '毛概及后续内容，配套选择题、订正与回忆。' },
    { start: 1440, end: 1500, time: '00:00–01:00', name: '英语 · 做题 / 背作文', subject: '英语一', kind: 'english', note: '按当天任务选择做题或背作文，仍计入前一天。' }
  ];

  function stamp(value) { return value === undefined ? Date.now() : Number(new Date(value)); }
  function chinaDate(value) { return new Date(stamp(value) + OFFSET_MS).toISOString().slice(0, 10); }
  function dateShift(date, days) { return new Date(Date.parse(date + 'T00:00:00Z') + days * DAY_MS).toISOString().slice(0, 10); }
  function studyDate(value) {
    const local = new Date(stamp(value) + OFFSET_MS);
    const day = local.toISOString().slice(0, 10);
    return local.getUTCHours() < 3 ? dateShift(day, -1) : day;
  }
  function minuteOfStudyDay(value) {
    const local = new Date(stamp(value) + OFFSET_MS);
    const mins = local.getUTCHours() * 60 + local.getUTCMinutes();
    return mins < 180 ? mins + 1440 : mins;
  }
  function activeRoutine(value) {
    const mins = minuteOfStudyDay(value);
    return ROUTINE.findIndex(row => mins >= row.start && mins < row.end);
  }
  function countdown(target, value) {
    const seconds = Math.max(0, Math.floor((Date.parse(target) - stamp(value)) / 1000));
    return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds % 86400 / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60, ended: stamp(value) >= Date.parse(target) };
  }
  function examState(exam, value) {
    const now = stamp(value), start = Date.parse(exam.at);
    return now < start ? '待开考' : now < start + 3 * 3600000 ? '考试中' : '已结束';
  }

  const PHASES = [
    { start: '2026-10-24', end: '2026-10-30', name: '第1周 · 从真实进度接上', math: '不定积分；分块矩阵、逆矩阵；事件独立性和独立重复试验', cs: 'Cache基础与计算；链路层设备、IPv4与子网；旧科目复做', politics: '毛概，穿插马原剩余多选' },
    { start: '2026-10-31', end: '2026-11-06', name: '第2周 · 积分与网络主线', math: '定积分及应用；矩阵秩、向量组；一维随机变量', cs: '虚存、指令系统；子网、路由与传输层入门', politics: '毛概收尾，进入习思想' },
    { start: '2026-11-07', end: '2026-11-13', name: '第3周 · 补齐主要方法', math: '多元微分、二重积分；方程组和特征值；二维随机变量', cs: 'CPU、流水线；TCP与应用层；混合真题开始', politics: '习思想，穿插史纲主线' },
    { start: '2026-11-14', end: '2026-11-20', name: '第4周 · 剩余主干与复做', math: '微分方程、级数；二次型；数字特征、大数定律与中心极限定理', cs: '总线、I/O；四门典型题、算法与PV专项', politics: '史纲，进入思想道德与法治' },
    { start: '2026-11-21', end: '2026-11-27', name: '第5周 · 补缺口，接综合', math: '空间与多元积分；抽样、估计与检验；按周测补缺口', cs: '四门混合训练，集中处理反复错题', politics: '剩余内容与全科选择题；分析题作答结构' },
    { start: '2026-11-28', end: '2026-12-04', name: '第6周 · 整卷与订正', math: '两次完整真题训练，其余时段订正和补弱项', cs: '两次完整真题训练，与数学整卷错开日期', politics: '选择题错因、分析题要点与回忆' },
    { start: '2026-12-05', end: '2026-12-11', name: '第7周 · 整卷查漏', math: '两次整卷，复做计算和方法失分题', cs: '两次整卷，复做综合题和算法', politics: '当年材料中的选择题与分析题重点' },
    { start: '2026-12-12', end: '2026-12-18', name: '第8周 · 收尾与考试准备', math: '公式条件、典型错题与适量限时练习', cs: '算法、计算、核心概念和典型错题', politics: '重点回顾，临考降低强度' }
  ];
  const FIRST_MATH = [
    '高数：不定积分公式与凑微分，独立做代表题；线代：分块矩阵运算。',
    '高数：第一类换元及配套题；概率：事件独立性、独立重复试验。',
    '高数：第二类换元的基本类型，先补未掌握的方法；线代：逆矩阵和矩阵方程。',
    '高数：分部积分及方法选择；概率：随机变量、离散分布律。',
    '高数：不定积分混合练习与订正；线代：初等变换、矩阵秩基础。',
    '高数：不定积分收尾，掌握后进入定积分基础；概率：分布函数及其与分布律的关系。',
    '本周已学内容闭卷小测＋订正；优先补积分、矩阵和随机事件的基础缺口。'
  ];
  const FIRST_CS = [
    '计组：Cache命中率、平均访问时间；计网：链路层设备及错题；晚间复做数据结构代表题。',
    '计组：Cache映射与地址字段；计网：IPv4、子网掩码；晚间复做操作系统PV题。',
    '计组：Cache写策略与综合计算；计网：子网划分；晚间整理两科错因。',
    '计组：Cache小测，过关后进入虚存；计网：CIDR与最长前缀匹配；复做树与图题。',
    '计组：页表与地址转换基础；计网：路由表及相关协议；复做操作系统内存管理题。',
    '计组：地址转换代表题；计网：子网和路由综合题；晚间复做本周错题。',
    '四门已学内容混合小测＋订正，优先解决Cache与子网计算；安排一道算法或PV题。'
  ];
  const MATH_DAYS = [
    [],
    ['定积分性质与计算；线代矩阵秩', '变上限积分；概率分布函数', '反常积分基础；线代向量组', '积分几何应用；概率常见离散分布', '积分应用基础题；线代线性相关', '定积分综合与订正；概率连续分布', '积分、矩阵与一维分布周测＋订正'],
    ['多元函数、偏导与全微分；线性方程组', '复合函数偏导；二维分布入门', '隐函数与多元极值；基础解系', '二重积分区域与换序；边缘分布', '二重积分极坐标；特征值', '多元微分与积分混合；条件分布与独立性', '已学章节混合真题＋订正'],
    ['一阶微分方程；特征向量与对角化', '二阶常系数微分方程；期望和方差', '数项级数；二次型', '幂级数；协方差与相关系数', '级数基础题；二次型正定性', '微分方程与级数订正；大数定律与中心极限定理', '本周已学内容小测，补方法与计算缺口'],
    ['空间向量、直线与平面；抽样分布', '三重积分基础；常见统计量', '曲线积分基础；矩估计', '曲面积分基础；最大似然估计', '多元积分公式适用条件；区间估计', '多元积分代表题；假设检验基础', '数学一混合诊断，列出仍需补救的专题'],
    ['未做数学一整卷180分钟，剩余时间标记错因', '上一套整卷逐题订正与复做', '补上一套卷暴露的主要弱项', '第二套未做数学一整卷180分钟', '第二套卷订正与独立复做', '两套卷反复出错专题训练', '本周错题回测，调整下周重点'],
    ['第三套未做数学一整卷180分钟', '整卷订正，定位概念、方法与计算错误', '高数与概率薄弱专题复做', '第四套未做数学一整卷180分钟', '整卷订正，线代与计算专题补漏', '典型错题变式与限时练习', '四套卷共性失分点回测'],
    ['公式条件与典型错题，适量限时练习', '线代、概率核心方法与常错题', '高数积分、级数和微分方程回顾', '按失分清单复做熟悉题型', '公式与典型题，减少新题量', '轻量计算与公式回顾，准备考试用品', '轻量回顾，不开启新章节；按考试时间调整休息']
  ];
  const CS_DAYS = [
    [],
    ['虚存与TLB；子网和路由基础；链表复做', '页表地址转换；路由表；PV复做', '指令格式；路由选择；树题复做', '寻址方式；TCP/UDP基础；存储管理复做', '指令执行；TCP连接管理；图题复做', '指令综合题；可靠传输；两科错题订正', '虚存、指令、网络已学部分小测＋订正'],
    ['CPU数据通路；TCP可靠传输；算法练习', '控制器与指令周期；滑动窗口；PV练习', '流水线性能；流量控制；树图练习', '流水线冲突；拥塞控制；分页练习', 'CPU综合计算；DNS、HTTP；错题复做', 'CPU订正；其他应用层协议；混合真题', '计组计网阶段小测，旧科目混合复做'],
    ['总线基础；网络主干回顾；链表算法', '总线性能；网络计算；进程调度', '中断机制；TCP计算；树算法', 'DMA及I/O；子网路由；PV综合', '计组I/O综合；协议辨析；排序与查找', '计组计网剩余缺口；文件与磁盘题', '四门混合小测＋订正，检查尚未学过的章节'],
    ['数据结构算法、计组存储综合', '操作系统PV、计网TCP综合', '数据结构树图、计组CPU综合', '操作系统地址转换、计网子网路由', '四门选择题混合与错因归纳', '算法及综合题独立作答与订正', '阶段混合诊断，确定整卷前主要缺口'],
    ['混合题与算法练习，为整卷做准备', '未做408整卷180分钟；下午时段做前置复习', '上一套卷订正与复做', '补主要弱项、算法和计算练习', '第二套未做408整卷180分钟', '第二套卷订正与复做', '本周错题回测与核心概念回顾'],
    ['PV、Cache和算法专项', '第三套未做408整卷180分钟', '整卷订正与独立复做', '数据结构、计网薄弱专题', '第四套未做408整卷180分钟', '整卷订正与综合题复做', '四套卷共性错误回测'],
    ['四门核心计算与典型错题', '算法、PV和存储综合题回顾', 'TCP、路由、流水线代表题', '核心概念和易混淆选项回顾', '错题与熟悉算法，减少新题量', '公式图表、地址转换步骤回顾', '轻量基础题与考试用品检查，不攻新难题']
  ];
  const ENGLISH = [
    '单词30分钟；凌晨：订正当前真题阅读，未完成的2003年题目优先。',
    '单词30分钟；凌晨：选一篇未做阅读，完成定位与订正。',
    '单词30分钟；凌晨：背一篇小作文，并合上材料默写、核对。',
    '单词30分钟；凌晨：阅读或新题型练习及订正。',
    '单词30分钟；凌晨：背大作文结构和可用表达，尝试复述或默写。',
    '单词30分钟；凌晨：翻译、完形或阅读薄弱题型，练后订正。',
    '单词30分钟；凌晨：复做本周错题，回忆两篇作文的结构与表达。'
  ];

  function getPlan(date) {
    if (date === '2026-10-23') return { date, revision: VERSION, phase: '今晚接续', items: [
      '今天已完成的数学保留；明天从第九讲、分块矩阵与概率独立性继续。',
      '今晚从Cache命中率、平均访问时间及链路层设备继续；22:15收尾。',
      '已背单词保留；00:00–01:00做当前真题订正或背作文。',
      '23:00–00:00开始毛概，完成一小节及对应题目。'
    ] };
    if (date < FIRST_DAY || date > LAST_DAY) return null;
    const index = Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(FIRST_DAY + 'T00:00:00Z')) / DAY_MS);
    if (!Number.isFinite(index) || index < 0 || index >= 56) return null;
    const week = Math.floor(index / 7), day = index % 7, phase = PHASES[week];
    let politics = '政治1小时：' + phase.politics + '；新内容配题，做后订正。';
    if (week === 0 && [1, 3].includes(day)) politics = '政治1小时：毛概40分钟；马原尚未完成的多选及订正20分钟。';
    if (day === 6) politics = '政治1小时：回忆本周知识框架，复做错题，安排下一周内容。';
    if (week === 7 && day >= 4) politics = '政治：重点内容回忆与错题回顾，临考减少强度、提前休息。';
    const en = week < 5 ? ENGLISH[day] : '单词30分钟；凌晨：' + (day % 2 ? '限时做题与订正，优先反复失分题型。' : '背诵并默写作文，回顾常用表达和易错语法。');
    return { date, revision: VERSION, phase: phase.name, week, day, items: [week === 0 ? FIRST_MATH[day] : MATH_DAYS[week][day], week === 0 ? FIRST_CS[day] : CS_DAYS[week][day], en, politics] };
  }
  const api = { VERSION, FIRST_DAY, LAST_DAY, EXAMS, ROUTINE, PHASES, chinaDate, studyDate, dateShift, activeRoutine, countdown, examState, getPlan, minuteOfStudyDay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KaoyanPlan = api;
})(typeof window === 'undefined' ? globalThis : window);
