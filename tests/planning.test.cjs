const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const html = fs.readFileSync('msp.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function evaluateRange(startMarker, endMarker, context = {}) {
  const start = script.indexOf(startMarker);
  const end = script.indexOf(endMarker, start);
  assert.notEqual(start, -1, `marker absent: ${startMarker}`);
  assert.notEqual(end, -1, `marker absent: ${endMarker}`);
  vm.runInNewContext(script.slice(start, end), context);
  return context;
}

test('standard week excludes weekends', () => {
  const ctx = evaluateRange('const msOfDay', 'function calOf(t)', { DAY: 86400000, $: () => null });
  ctx.cals = {};
  vm.runInContext(`
    cal = effCal ? effCal(null) : { week: stdWeek(), exc: [] };
  `, ctx);
  const cal = vm.runInContext('effCal ? effCal(null) : { week: stdWeek(), exc: [] }', ctx);
  assert.equal(vm.runInContext('dayStatus(cal, new Date(2025,0,11))', ctx), false);
  assert.equal(vm.runInContext('dayStatus(cal, new Date(2025,0,13))', ctx), true);
});

test('fixed exception overrides the standard week', () => {
  const ctx = evaluateRange('const msOfDay', 'function calOf(t)', { DAY: 86400000, $: () => null });
  vm.runInContext(`
    cal = {week:stdWeek(),exc:[{
      from:+ymd(new Date(2025,0,13)),to:+ymd(new Date(2025,0,13)),
      working:false,recur:false,times:[]
    }]};
  `, ctx);
  assert.equal(vm.runInContext('dayStatus(cal, new Date(2025,0,13))', ctx), false);
});

test('daily recurring exception follows the period', () => {
  const ctx = evaluateRange('const msOfDay', 'function calOf(t)', { DAY: 86400000, $: () => null });
  vm.runInContext(`
    cal = {week:stdWeek(),exc:[{
      from:+ymd(new Date(2025,0,6)),to:null,working:false,recur:true,times:[],
      type:1,period:2,occurrences:0,daysOfWeek:0,month:0,monthDay:0,monthPosition:0,weekDay:0
    }]};
  `, ctx);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,0,6))', ctx), false);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,0,8))', ctx), false);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,0,9))', ctx), true);
});

test('weekly recurring exception matches selected weekdays', () => {
  const ctx = evaluateRange('const msOfDay', 'function calOf(t)', { DAY: 86400000, $: () => null });
  vm.runInContext(`
    cal = {week:stdWeek(),exc:[{
      from:+ymd(new Date(2025,0,6)),to:null,working:false,recur:true,times:[],
      type:4,period:1,occurrences:0,daysOfWeek:2,month:0,monthDay:0,monthPosition:0,weekDay:2
    }]};
  `, ctx);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,0,6))', ctx), false);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,0,7))', ctx), true);
});

test('monthly nth-weekday recurring exception works', () => {
  const ctx = evaluateRange('const msOfDay', 'function calOf(t)', { DAY: 86400000, $: () => null });
  vm.runInContext(`
    cal = {week:stdWeek(),exc:[{
      from:+ymd(new Date(2025,0,1)),to:null,working:false,recur:true,times:[],
      type:6,period:1,occurrences:0,daysOfWeek:4,month:0,monthDay:0,monthPosition:2,weekDay:3
    }]};
  `, ctx);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,1,11))', ctx), false);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,1,12))', ctx), true);
});

test('annual recurring exception matches month and weekday position', () => {
  const ctx = evaluateRange('const msOfDay', 'function calOf(t)', { DAY: 86400000, $: () => null });
  vm.runInContext(`
    cal = {week:stdWeek(),exc:[{
      from:+ymd(new Date(2025,0,1)),to:null,working:false,recur:true,times:[],
      type:8,period:1,occurrences:0,daysOfWeek:2,month:5,monthDay:0,monthPosition:5,weekDay:2
    }]};
  `, ctx);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,4,26))', ctx), false);
  assert.equal(vm.runInContext('dayStatus(cal,new Date(2025,4,27))', ctx), true);
});

test('workday duration parsing accepts MS Project formats', () => {
  const ctx = evaluateRange('function parseDurInput', 'function parseUser', { dayH: 8 });
  assert.equal(vm.runInContext('parseDurInput("3j")', ctx), 24);
  assert.equal(vm.runInContext('parseDurInput("24h")', ctx), 24);
  assert.equal(vm.runInContext('parseDurInput("PT8H30M")', ctx), 8.5);
  assert.equal(vm.runInContext('parseDurInput("invalid")', ctx), null);
});

test('dependency graph rejects circular predecessor chains', () => {
  const ctx = evaluateRange('function rebuildTree', 'function setTaskDates', { doc: {} });
  vm.runInContext(`
    tasks = [
      {uid:'1',lvl:1,preds:[],kids:[],v:{}},
      {uid:'2',lvl:1,preds:[{uid:'1'}],kids:[],v:{}}
    ];
    byUid={1:tasks[0],2:tasks[1]};
  `, ctx);
  assert.equal(vm.runInContext('linkGraphHasCycle()', ctx), false);
  vm.runInContext(`tasks[0].preds=[{uid:'2'}]`, ctx);
  assert.equal(vm.runInContext('linkGraphHasCycle()', ctx), true);
});

test('hierarchy renumbering updates WBS and outline numbers', () => {
  const ctx = evaluateRange('function rebuildTree', 'function setTaskDates', { doc: {} });
  vm.runInContext(`
    tasks = [
      {uid:'1',lvl:1,preds:[],kids:[],v:{},s:new Date(),f:new Date()},
      {uid:'2',lvl:2,preds:[],kids:[],v:{},s:new Date(),f:new Date()},
      {uid:'3',lvl:1,preds:[],kids:[],v:{},s:new Date(),f:new Date()}
    ];
    roots=[];rebuildTree();renumberHierarchy();
  `, ctx);
  assert.equal(vm.runInContext('tasks[0].v.WBS', ctx), '1');
  assert.equal(vm.runInContext('tasks[1].v.WBS', ctx), '1.1');
  assert.equal(vm.runInContext('tasks[1].v.OutlineLevel', ctx), '2');
  assert.equal(vm.runInContext('tasks[2].v.WBS', ctx), '2');
});
