// dump-ui-labels.js
// 用途：把界面上真实显示的文案抓出来，供编写使用说明时核对，避免文档与实际不符。

const fs = require('fs');
const path = require('path');

const STATIC = path.join(__dirname, '..', 'src', 'main', 'resources', 'static');

// 1) 左侧导航项
const html = fs.readFileSync(path.join(STATIC, 'index.html'), 'utf8');
console.log('=== 左侧导航（data-view / 显示文字）===');
const navRe = /data-view="([^"]+)"[\s\S]{0,200}?<\/i>\s*([^<\n]+)/g;
let m;
const seen = new Set();
while ((m = navRe.exec(html)) !== null) {
  const key = m[1];
  if (seen.has(key)) continue;
  seen.add(key);
  console.log('  ' + key.padEnd(14) + m[2].trim());
}

// 2) 各页面标题（app.js pageInfo）
const app = fs.readFileSync(path.join(STATIC, 'js', 'app.js'), 'utf8');
console.log('');
console.log('=== 页面标题栏（pageInfo）===');
const pageRe = /'([a-z][a-z-]*)':\s*\{\s*title:\s*'([^']+)',\s*desc:\s*'([^']+)'\s*\}/g;
while ((m = pageRe.exec(app)) !== null) {
  console.log('  ' + m[1].padEnd(14) + m[2] + '   /   ' + m[3]);
}

// 3) 计划管理页里的关键文案
function dump(file, label, patterns) {
  const t = fs.readFileSync(path.join(STATIC, 'js', file), 'utf8');
  console.log('');
  console.log('=== ' + label + ' (' + file + ') ===');
  for (const p of patterns) {
    const re = new RegExp(p, 'g');
    const hits = [...t.matchAll(re)].map((x) => x[0]).slice(0, 6);
    if (hits.length) console.log('  ' + p + ' : ' + [...new Set(hits)].join(' | '));
  }
}

dump('AvailabilityPlanModule.js', '计划管理', ['创建[^<"]{0,6}菜单', '发布[^<"]{0,6}菜单', '复用[^<"]{0,6}菜单', '历史[^<"]{0,6}菜单', '搜索[^<"]{0,6}']);
dump('SupplyItemModule.js', '用品目录', ['添加[^<"]{0,8}', '编辑[^<"]{0,8}', '搜索[^<"]{0,8}']);
dump('AvailabilityPlanBrowseModule.js', '领用计划(员工)', ['[^<>"]{0,10}截止[^<>"]{0,8}', '今日[^<"]{0,10}', '提交[^<"]{0,8}']);
dump('RequisitionModule.js', '我的申领', ['全部状态|待[^<"]{0,4}|已[^<"]{0,4}']);
dump('SettingsModule.js', '系统设置', ['[^<>"]{0,8}时间[^<>"]{0,6}']);
