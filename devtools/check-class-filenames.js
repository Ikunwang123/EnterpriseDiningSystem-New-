// check-class-filenames.js
// 用途：找出「public 类型名 ≠ 文件名」的 Java 文件。
// javac 在大小写不敏感的文件系统上会静默跳过这类文件，所以必须显式检查，
// 否则改名后会以为编译通过，实际有文件根本没被编译。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'G:\\EnterpriseDiningSystem';
const srcRoot = path.join(ROOT, 'src', 'main', 'java');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.java')) out.push(p);
  }
  return out;
}

const files = walk(srcRoot);
const problems = [];

// 只统计「顶层」类型：扫描时维护花括号深度，深度为 0 时遇到的类型声明才是顶层的。
// 嵌套类型不参与「类型名 == 文件名」的判定。
function topLevelTypes(text) {
  const found = [];
  let depth = 0;
  let i = 0;
  const n = text.length;
  let lineStart = 0;

  while (i < n) {
    const ch = text[i];

    if (ch === '\n') lineStart = i + 1;

    if (ch === '{') { depth++; i++; continue; }
    if (ch === '}') { depth = Math.max(0, depth - 1); i++; continue; }

    // 只在顶层、且位于行首（允许前导空白）处匹配类型声明
    if (depth === 0) {
      const lineHead = text.slice(lineStart, i);
      if (/^\s*$/.test(lineHead)) {
        const rest = text.slice(i);
        const m = /^(?:public\s+)?(?:final\s+|abstract\s+|static\s+)*(class|interface|enum|record)\s+([A-Za-z_$][A-Za-z0-9_$]*)/.exec(rest);
        if (m) {
          // 需要是 public（否则 javac 不强制文件名一致）
          const isPublic = /^public\b/.test(rest);
          if (isPublic) found.push({ kind: m[1], name: m[2] });
        }
      }
    }
    // 跳过字符串/字符/注释，避免误判
    if (ch === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i);
      i = nl === -1 ? n : nl;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < n && text[i] !== quote) {
        if (text[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    i++;
  }
  return found;
}

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const base = path.basename(f, '.java');
  const names = topLevelTypes(text);

  if (names.length === 0) {
    problems.push({ file: f, kind: '(none)', declared: '-', note: '没有 public 顶层类型' });
    continue;
  }
  for (const n of names) {
    if (n.name !== base) {
      problems.push({ file: f, kind: n.kind, declared: n.name, expected: base, note: '类型名与文件名不一致' });
    }
  }
}

console.log('scanned java files: ' + files.length);
if (problems.length === 0) {
  console.log('OK: 所有 public 类型名与文件名一致');
} else {
  console.log('PROBLEMS: ' + problems.length);
  for (const p of problems) {
    console.log('  ' + path.relative(ROOT, p.file));
    console.log('      declared=' + p.declared + '  expectedFileBase=' + (p.expected || '-') + '  ' + p.note);
  }
}
