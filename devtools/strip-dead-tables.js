// strip-dead-tables.js
// 用途：把已废弃表（t_equipment、plan_items）的建表语句从生成的 SQL 脚本里移除。
//
// 背景：generate_all.py 是「从零按数据源生成 SQL」，它并不知道哪些表已经因为
// 实体被删除而废弃了，所以会照样生成 t_equipment。这些死表会在建库时又建出来，
// 因此必须在生成之后再做一次剔除。
//
// 处理方式：按「注释行 + CREATE TABLE ... ;」整体删除（到第一个单独成行的 ";" 为止），
// 这样不会误删后面的语句。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || path.join(__dirname, '..');
const SQL_DIR = path.join(ROOT, 'src', 'main', 'resources', 'sql');

// 已废弃的表名 -> 中文说明（用于删掉那行注释）
const DEAD_TABLES = ['t_equipment', 'plan_items'];

function stripTable(text, table) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let removed = 0;

  for (let i = 0; i < lines.length; i++) {
    // 命中建表语句开头
    if (new RegExp('^\\s*CREATE TABLE IF NOT EXISTS\\s+' + table + '\\b', 'i').test(lines[i])) {
      // 往回看：如果上一行是紧邻的注释，一起删掉
      let back = 0;
      while (out.length - 1 - back >= 0 && /^\s*--/.test(out[out.length - 1 - back])) back++;
      for (let k = 0; k < back; k++) out.pop();

      // 往前跳到语句结束。
      // 关键：生成器产出的是
      //     CREATE TABLE ... (
      //         ...
      //     ) ENGINE=InnoDB ... COMMENT '...';
      // 结束行是 "   ) ENGINE=...;" **同一行带分号**，
      // 而不是单独一行的 ";"。
      // 之前用「找单独成行的 ;」判断，结果一路跳过后面所有语句，
      // 把整个 init.sql 从这张表起全部截断（只剩 68 行，少了 4 张表）。
      let j = i;
      while (j < lines.length && !/;\s*$/.test(lines[j])) j++;
      i = j;                       // 跳过整段（for 的 i++ 会再 +1，正好落到下一行）
      removed++;
      continue;
    }
    out.push(lines[i]);
  }

  return { text: out.join('\n'), removed };
}

let total = 0;
for (const f of ['init.sql', 'data.sql', 'employee_data.sql']) {
  const p = path.join(SQL_DIR, f);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, 'utf8');
  let hits = 0;
  for (const table of DEAD_TABLES) {
    const r = stripTable(t, table);
    t = r.text;
    hits += r.removed;
  }
  if (hits > 0) {
    fs.writeFileSync(p, t, 'utf8');
    console.log('  ' + f + ': 移除 ' + hits + ' 段废弃表定义');
    total += hits;
  }
}
console.log('dead table definitions removed: ' + total);
