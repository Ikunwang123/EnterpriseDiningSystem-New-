// audit-identifiers.js
// 用途：列出源码里「包含被改名词元、但本身不是映射表键」的所有标识符。
// 这些是替换逻辑覆盖不到的地方（因为边界规则要求词元是独立整词），
// 必须逐个决定是「显式加入映射表」还是「有意保留」。
// 不做任何修改，只输出审计结果。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'G:\\EnterpriseDiningSystem';
const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'rename-map.json'), 'utf8'));
const tokens = Object.keys(map).sort((a, b) => b.length - a.length);

// 需要检查的源目录（已改名的包）
const targetDirs = [
  path.join(ROOT, 'src', 'main', 'java'),
  path.join(ROOT, 'src', 'main', 'resources', 'static'),
];

const EXTS = ['.java', '.js', '.html', '.css', '.sql'];
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['.git', 'target', '.build-check', 'node_modules'].includes(e.name)) continue;
      walk(p, out);
    } else if (EXTS.includes(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

const files = targetDirs.flatMap((d) => walk(d));
const found = new Map(); // identifier -> Set(files)

const identRe = /[A-Za-z_$][A-Za-z0-9_$]*/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = identRe.exec(text)) !== null) {
    const ident = m[0];
    if (map[ident]) continue; // 已经是映射表键，会被正常替换
    // 是否包含任一被改名词元（作为子串，且词元首字母大写或带下划线，避免噪音）
    for (const t of tokens) {
      if (t.length < 3) continue;
      if (!ident.includes(t)) continue;
      if (ident === t) continue;
      if (!found.has(ident)) found.set(ident, new Set());
      found.get(ident).add(path.relative(ROOT, file));
      break;
    }
  }
}

const rows = [...found.entries()].map(([id, fs_]) => ({ id, n: fs_.size, files: [...fs_].slice(0, 2) }));
rows.sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));

console.log('identifiers containing mapped tokens but NOT in the map: ' + rows.length);
console.log('');
for (const r of rows) {
  console.log(String(r.n).padStart(4) + '  ' + r.id + '   [' + r.files.join(', ') + ']');
}
