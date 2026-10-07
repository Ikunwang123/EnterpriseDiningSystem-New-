const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'main', 'java', 'com', 'enterprise', 'supply', 'controller');
const all = new Map();
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.java')) continue;
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  const base = (/@RequestMapping\("([^"]*)"\)/.exec(t) || [null, ''])[1];
  const re = /@(Get|Post|Put|Delete|Patch)Mapping\((?:"([^"]*)")?\)/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    const verb = m[1].toUpperCase();
    const sub = m[2] || '';
    const full = (base + sub) || '/';
    const key = verb + ' ' + full;
    if (!all.has(key)) all.set(key, []);
    all.get(key).push(f);
  }
}
const dups = [...all.entries()].filter(([, v]) => v.length > 1);
console.log('总映射数: ' + all.size);
if (dups.length === 0) console.log('没有重复映射');
else { console.log('重复映射:'); for (const [k, v] of dups) console.log('  ' + k + '  <- ' + v.join(' | ')); }
