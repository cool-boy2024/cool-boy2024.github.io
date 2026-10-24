'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const plan = require('../plan-v4.js');

test('the revised plan contains 56 consecutive complete days plus the October 23 handoff', () => {
  assert.equal(plan.FIRST_DAY, '2026-10-24');
  assert.equal(plan.LAST_DAY, '2026-12-18');
  const dates = Array.from({ length: 56 }, (_, offset) => plan.dateShift(plan.FIRST_DAY, offset));
  assert.equal(new Set(dates).size, 56);
  assert.equal(dates.at(-1), plan.LAST_DAY);
  dates.forEach((date, index) => {
    const day = plan.getPlan(date);
    assert.equal(day.date, date);
    assert.equal(day.revision, plan.VERSION);
    assert.equal(day.week, Math.floor(index / 7));
    assert.equal(day.day, index % 7);
    assert.equal(day.items.length, 4);
    day.items.forEach(item => assert.ok(typeof item === 'string' && item.trim().length > 0));
    assert.ok(date >= plan.PHASES[day.week].start && date <= plan.PHASES[day.week].end);
  });
  const handoff = plan.getPlan('2026-10-23');
  assert.equal(handoff.revision, plan.VERSION);
  assert.equal(handoff.items.length, 4);
  assert.match(handoff.items[2], /00:00–01:00/);
  assert.equal(plan.getPlan('2026-10-22'), null);
  assert.equal(plan.getPlan('2026-12-19'), null);
  assert.equal(plan.getPlan('not-a-date'), null);
});

test('revision gives new daily task keys a separate identity from historical completion keys', () => {
  for (const date of ['2026-10-23', plan.FIRST_DAY, plan.LAST_DAY]) {
    const day = plan.getPlan(date);
    const oldKey = `${date}|0`;
    const newKey = `${day.revision}|${date}|0`;
    assert.notEqual(newKey, oldKey);
    const saved = { [oldKey]: true };
    assert.equal(saved[newKey], undefined);
  }
});

test('daily routine contains exactly 630 study minutes with four hours each for math and 408', () => {
  const totals = {};
  plan.ROUTINE.forEach((row, index) => {
    assert.ok(Number.isInteger(row.start) && Number.isInteger(row.end));
    assert.ok(row.end > row.start, row.name);
    if (index) assert.equal(plan.ROUTINE[index - 1].end, row.start, 'no overlap or unexplained gap');
    if (row.subject) totals[row.subject] = (totals[row.subject] || 0) + row.end - row.start;
  });
  assert.deepEqual(totals, { '数学一': 240, '408': 240, '英语一': 90, '政治': 60 });
  assert.equal(Object.values(totals).reduce((sum, minutes) => sum + minutes, 0), 630);
  assert.equal(plan.ROUTINE[0].start, 9 * 60);
  assert.equal(plan.ROUTINE.at(-1).end, 25 * 60);
  const shower = plan.ROUTINE.find(row => row.name === '洗澡');
  assert.equal(shower.start, 22 * 60 + 30);
  assert.equal(shower.end, 23 * 60);
  assert.equal(shower.subject, undefined);
});

test('Beijing calendar and study dates differ correctly around midnight and the 03:00 cutoff', () => {
  const cases = [
    ['2026-10-23T15:59:59Z', '2026-10-23', '2026-10-23', 1439],
    ['2026-10-23T16:00:00Z', '2026-10-24', '2026-10-23', 1440],
    ['2026-10-23T16:59:59Z', '2026-10-24', '2026-10-23', 1499],
    ['2026-10-23T17:00:00Z', '2026-10-24', '2026-10-23', 1500],
    ['2026-10-23T18:59:59Z', '2026-10-24', '2026-10-23', 1619],
    ['2026-10-23T19:00:00Z', '2026-10-24', '2026-10-24', 180],
    ['2026-10-24T01:00:00Z', '2026-10-24', '2026-10-24', 540]
  ];
  for (const [instant, calendar, study, minutes] of cases) {
    assert.equal(plan.chinaDate(instant), calendar, instant);
    assert.equal(plan.studyDate(instant), study, instant);
    assert.equal(plan.minuteOfStudyDay(instant), minutes, instant);
  }
});

test('the midnight English hour belongs to the previous day and stops highlighting at 01:00', () => {
  for (const instant of ['2026-10-25T00:00:00+08:00', '2026-10-25T00:59:59+08:00']) {
    const row = plan.ROUTINE[plan.activeRoutine(instant)];
    assert.equal(row.subject, '英语一');
    assert.equal(plan.studyDate(instant), '2026-10-24');
  }
  for (const instant of ['2026-10-25T01:00:00+08:00', '2026-10-25T02:59:59+08:00', '2026-10-25T03:00:00+08:00']) {
    assert.equal(plan.activeRoutine(instant), -1, instant);
  }
  assert.equal(plan.studyDate('2026-10-25T03:00:00+08:00'), '2026-10-25');
});

test('routine boundaries select only the following block', () => {
  assert.equal(plan.activeRoutine('2026-10-24T08:59:59+08:00'), -1);
  assert.equal(plan.ROUTINE[plan.activeRoutine('2026-10-24T09:00:00+08:00')].subject, '数学一');
  assert.equal(plan.ROUTINE[plan.activeRoutine('2026-10-24T10:30:00+08:00')].kind, 'rest');
  assert.equal(plan.ROUTINE[plan.activeRoutine('2026-10-24T22:30:00+08:00')].name, '洗澡');
  assert.equal(plan.ROUTINE[plan.activeRoutine('2026-10-24T23:00:00+08:00')].subject, '政治');
});

test('date shifting handles month, year, and leap-year boundaries', () => {
  assert.equal(plan.dateShift('2026-10-31', 1), '2026-11-01');
  assert.equal(plan.dateShift('2026-12-31', 1), '2027-01-01');
  assert.equal(plan.dateShift('2026-01-01', -1), '2025-12-31');
  assert.equal(plan.dateShift('2028-03-01', -1), '2028-02-29');
  assert.equal(plan.studyDate('2027-01-01T01:00:00+08:00'), '2026-12-31');
});

test('countdown decomposes a known duration into days, hours, minutes, and seconds', () => {
  const target = plan.EXAMS[0].at;
  const delta = (((2 * 24 + 3) * 60 + 4) * 60 + 5) * 1000;
  assert.deepEqual(plan.countdown(target, Date.parse(target) - delta), {
    days: 2, hours: 3, minutes: 4, seconds: 5, ended: false
  });
});

for (const exam of plan.EXAMS) {
  test(`${exam.subject}: countdown reaches zero at its own exam time and never goes negative`, () => {
    const start = Date.parse(exam.at);
    assert.deepEqual(plan.countdown(exam.at, start - 1000), {
      days: 0, hours: 0, minutes: 0, seconds: 1, ended: false
    });
    assert.equal(plan.examState(exam, start - 1), '待开考');
    for (const instant of [start, start + 1, start + 3 * 3600000, start + 86400000]) {
      assert.deepEqual(plan.countdown(exam.at, instant), {
        days: 0, hours: 0, minutes: 0, seconds: 0, ended: true
      });
    }
    assert.equal(plan.examState(exam, start), '考试中');
    assert.equal(plan.examState(exam, start + 3 * 3600000 - 1), '考试中');
    assert.equal(plan.examState(exam, start + 3 * 3600000), '已结束');
  });
}

test('all four exams have distinct chronological starts and independent countdowns', () => {
  assert.deepEqual(plan.EXAMS.map(exam => exam.subject), ['政治', '英语一', '数学一', '408']);
  const starts = plan.EXAMS.map(exam => Date.parse(exam.at));
  assert.ok(starts.every((start, index) => index === 0 || start > starts[index - 1]));
  assert.deepEqual(plan.EXAMS.map(exam => plan.countdown(exam.at, starts[0]).ended), [true, false, false, false]);
});

test('date and countdown behavior does not depend on the machine timezone', () => {
  const modulePath = path.resolve(__dirname, '../plan-v4.js');
  const code = `const p=require(${JSON.stringify(modulePath)}); const t='2026-10-24T16:30:00Z'; process.stdout.write(JSON.stringify([p.chinaDate(t),p.studyDate(t),p.activeRoutine(t),p.countdown(p.EXAMS[0].at,t)]));`;
  let baseline;
  for (const timezone of ['UTC', 'Asia/Shanghai', 'America/Los_Angeles', 'Pacific/Auckland']) {
    const child = spawnSync(process.execPath, ['-e', code], { env: { ...process.env, TZ: timezone }, encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
    if (baseline === undefined) baseline = child.stdout;
    else assert.equal(child.stdout, baseline, timezone);
  }
});
