// check-frontend-refs.js
// 用途：校验前端引用完整性——index.html 里引用的每个脚本文件是否存在，
// 以及 app.js 里用到的模块全局对象是否真的有定义。改名后最容易在这里出问题。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || path.join(__dirname, '..');
const STATIC = path.join(ROOT, 'src', 'main', 'resources', 'static');
const JS_DIR = path.join(STATIC, 'js');

const html = fs.readFileSync(path.join(STATIC, 'index.html'), 'utf8');
const refs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

let bad = 0;

console.log('--- index.html 引用的脚本是否存在 ---');
for (const r of refs) {
  const p = path.join(STATIC, r.replace(/\//g, path.sep));
  const ok = fs.existsSync(p);
  if (!ok) bad++;
  console.log((ok ? 'ok    ' : 'MISS  ') + r);
}

// app.js 里用到的模块全局对象
const app = fs.readFileSync(path.join(JS_DIR, 'app.js'), 'utf8');
const used = [...new Set([...app.matchAll(/\b([A-Z][A-Za-z]*Module)\b/g)].map((m) => m[1]))];

console.log('--- app.js 用到的模块全局对象是否已定义 ---');
for (const g of used) {
  let found = false;
  for (const f of fs.readdirSync(JS_DIR)) {
    const t = fs.readFileSync(path.join(JS_DIR, f), 'utf8');
    // 模块可以是 class 声明（全局绑定），也可以是 const/var/window. 赋值
    const patterns = [
      new RegExp('(?:const|var|let|window\\.)' + g + '\\s*='),
      new RegExp('\\b' + g + '\\s*=\\s*\\{'),
      new RegExp('\\bclass\\s+' + g + '\\b'),
    ];
    if (patterns.some((re) => re.test(t))) { found = true; break; }
  }
  if (!found) bad++;
  console.log((found ? 'ok    ' : 'MISS  ') + g);
}

// 反向检查：有没有文件定义了模块但 index.html 没引入（改名漏挂载的典型症状）
console.log('--- 定义了模块但未被引入? ---');
const referenced = new Set(refs.map((r) => r.replace(/^js\//, '')));
for (const f of fs.readdirSync(JS_DIR)) {
  const t = fs.readFileSync(path.join(JS_DIR, f), 'utf8');
  const m = /(?:const|var|let|window\.)([A-Z][A-Za-z]*Module)\s*=/.exec(t);
  if (!m) continue;
  const g = m[1];
  // app.js 通过全局调用，必须被 index.html 引入
  if (f !== 'app.js' && !referenced.has(f) && used.includes(g)) {
    bad++;
    console.log('MISS  ' + f + ' 定义了 ' + g + ' 但 index.html 未引入');
  }
}

console.log(bad === 0 ? '\nALL REFERENCES OK' : '\n' + bad + ' PROBLEMS');
process.exit(bad === 0 ? 0 : 1);
