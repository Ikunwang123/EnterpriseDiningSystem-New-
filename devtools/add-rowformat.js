const fs = require('fs');
const files = [
  'src/main/resources/sql/migrate_to_office_supply.sql',
  'src/main/resources/sql/init.sql',
];
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  // 给所有以 ") COMMENT '...';" 结尾的建表语句补上 ENGINE / ROW_FORMAT
  const before = t;
  t = t.replace(/\)\s*COMMENT '([^']*)';/g, (m, c) => {
    if (t.includes('ROW_FORMAT')) { /* 逐条判断见下 */ }
    return ") ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '" + c + "';";
  });
  // 避免把已经是 ENGINE= 的重复加
  t = t.replace(/\) ENGINE=InnoDB ROW_FORMAT=DYNAMIC ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT/g,
                ") ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT");
  if (t !== before) { fs.writeFileSync(f, t, 'utf8'); console.log('updated ' + f); }
  else console.log('no change ' + f);
}
