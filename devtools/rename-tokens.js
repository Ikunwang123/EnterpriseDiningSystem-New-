// rename-tokens.js
// 用途：按“词元映射表”批量重命名标识符（类名 / 字段名 / 表名列名 / 方法名片段）。
// 只做整词匹配（前后不能是字母、数字、下划线，也不能是点号），避免误伤子串。
// 映射顺序由 longest-first 保证，避免 PlanItem 抢在 PlanItemSummary 前面替换。
// 这是改名期间使用的一次性工具，不属于项目的运行时代码。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'G:\\EnterpriseDiningSystem';
const MAP_FILE = process.argv[3];
const EXTS = ['.java', '.js', '.html', '.css', '.sql', '.properties', '.xml'];

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

// 自映射是写错的信号：它会白白计入变更统计，掩盖真正的替换
const identity = Object.keys(map).filter((k) => map[k] === k);
if (identity.length) {
  console.error('FATAL: 映射表里存在自映射（键与值相同）: ' + identity.join(', '));
  process.exit(1);
}

// 目标名冲突：两个不同的源词元映射到同一个新名字（例如两个 Controller 合并成一个类名）
const byValue = new Map();
for (const [k, v] of Object.entries(map)) {
  if (!byValue.has(v)) byValue.set(v, []);
  byValue.get(v).push(k);
}
const collisions = [...byValue.entries()].filter(([, ks]) => ks.length > 1);
if (collisions.length) {
  console.error('WARNING: 多个源词元映射到同一个新名字（请确认是否真的要合并）:');
  for (const [v, ks] of collisions) console.error('  ' + ks.join(' | ') + '  ->  ' + v);
}

// 标识符替换的核心逻辑在 tokenmap.js（上下文扫描器），这里只负责遍历文件
const { createReplacer } = require('./tokenmap');
const replaceTokens = createReplacer(map);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'target', '.build-check', '.idea'].includes(e.name)) continue;
      walk(p, out);
    } else if (EXTS.includes(path.extname(e.name).toLowerCase())) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(ROOT);
const perToken = new Map();
const changedFiles = [];

for (const file of files) {
  // 统一按 UTF-8 处理（PNG 等二进制不在 EXTS 内）
  const text = fs.readFileSync(file, 'utf8');
  const out = replaceTokens(text, (m) => perToken.set(m, (perToken.get(m) || 0) + 1));
  if (out !== text) {
    fs.writeFileSync(file, out, 'utf8');
    changedFiles.push(path.relative(ROOT, file));
  }
}

console.log('changed files: ' + changedFiles.length);
console.log('--- replacements per token ---');
for (const [k, v] of [...perToken.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(String(v).padStart(6) + '  ' + k + '  ->  ' + map[k]);
}
const unused = Object.keys(map).filter((t) => !perToken.has(t));
if (unused.length) console.log('--- NEVER MATCHED (check these) ---\n' + unused.join('\n'));
