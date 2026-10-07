// audit-features.js
// 用途：审计"后端提供的接口"与"前端实际调用"的对应关系，
// 找出没有被任何页面使用的僵尸接口/模块，为精简功能提供依据。
// 只做只读分析，不修改任何文件。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || path.join(__dirname, '..');
const CTRL = path.join(ROOT, 'src', 'main', 'java', 'com', 'enterprise', 'supply', 'controller');
const STATIC = path.join(ROOT, 'src', 'main', 'resources', 'static');

// 1) 收集后端所有接口：类级前缀 + 方法级路径
const endpoints = [];
for (const f of fs.readdirSync(CTRL)) {
  if (!f.endsWith('.java')) continue;
  const t = fs.readFileSync(path.join(CTRL, f), 'utf8');
  const base = (/@RequestMapping\("([^"]*)"\)/.exec(t) || [null, ''])[1];
  const re = /@(Get|Post|Put|Delete|Patch)Mapping\((?:value\s*=\s*)?"([^"]*)"/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    endpoints.push({ file: f, verb: m[1].toUpperCase(), path: base + m[2] });
  }
}

// 2) 收集前端所有 fetch 调用路径
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['images'].includes(e.name)) walk(p, out); }
    else if (e.name.endsWith('.js') || e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const frontendText = walk(STATIC).map((p) => fs.readFileSync(p, 'utf8')).join('\n');

// 把前端出现的所有 /api/... 片段抽出来（模板字符串与拼接都覆盖）
const calledPaths = new Set();
for (const m of frontendText.matchAll(/['"`](\/api\/[A-Za-z0-9_\-./${}]*)/g)) {
  calledPaths.add(m[1]);
}

function isCalled(p) {
  // 去掉路径参数（{id} 等）后做前缀匹配
  const norm = p.replace(/\{[^}]*\}/g, '');
  for (const c of calledPaths) {
    const base = c.split('?')[0].replace(/\$\{[^}]*\}/g, '');
    if (base.startsWith(norm) || norm.startsWith(base)) return true;
  }
  return false;
}

console.log('=== 后端接口总数: ' + endpoints.length + ' ===');
const unused = endpoints.filter((e) => !isCalled(e.path));
console.log('');
console.log('=== 疑似未被前端调用的接口 (' + unused.length + ') ===');
for (const u of unused) {
  console.log('  ' + u.verb.padEnd(6) + u.path.padEnd(34) + '  <- ' + u.file);
}

// 3) 控制器级别：整个控制器都没有被调用
const byFile = new Map();
for (const e of endpoints) {
  if (!byFile.has(e.file)) byFile.set(e.file, { total: 0, unused: 0 });
  byFile.get(e.file).total++;
  if (!isCalled(e.path)) byFile.get(e.file).unused++;
}
console.log('');
console.log('=== 按控制器统计 ===');
for (const [f, s] of [...byFile.entries()].sort((a, b) => b[1].unused - a[1].unused)) {
  const flag = s.unused === s.total ? '  <<< 整个控制器都没被调用' : '';
  console.log('  ' + f.padEnd(38) + s.unused + '/' + s.total + ' 未使用' + flag);
}

// 4) 顺带导出「配图文件名 -> 用品名称」对照表，便于人工替换真实商品图
const dataSql = path.join(ROOT, 'src', 'main', 'resources', 'sql', 'data.sql');
if (fs.existsSync(dataSql)) {
  const t = fs.readFileSync(dataSql, 'utf8');
  const re = /UPDATE t_supply_item SET image_url = '\/images\/(\d+)\.png' WHERE name = '([^']+)'/g;
  const rows = [];
  let m;
  while ((m = re.exec(t)) !== null) rows.push([m[1], m[2]]);
  if (rows.length) {
    const out = path.join(ROOT, 'devtools', 'image-map.csv');
    fs.writeFileSync(out, '\uFEFF文件名,用品名称\n' + rows.map((r) => r[0] + '.png,' + r[1]).join('\n') + '\n', 'utf8');
    console.log('');
    console.log('配图对照表已导出: devtools/image-map.csv （共 ' + rows.length + ' 条）');
  }
}
