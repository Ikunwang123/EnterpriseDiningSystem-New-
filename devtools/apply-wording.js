// apply-wording.js
// 用途：把源码与文案里的「点餐/餐饮」措辞替换为「办公用品申领」措辞。
//
// 与 rename-map.json 的区别：
//   rename-map.json  改的是「标识符」（类名/表名），必须遵守 Java 与 SQL 的边界规则；
//   本文件的表是「人类可读散文」（中文注释、界面文案、按钮文字），
//   可以用较长短语优先的方式直接做字符串替换，不涉及标识符语义。
//
// 顺序很关键：必须先长后短。例如「企业餐厅点餐系统」要先于「点餐」被替换，
// 否则「点餐」先变成「申领」后，长短语就再也匹配不上了。

const fs = require('fs');
const path = require('path');
const { createReplacer } = require('./tokenmap');

const ROOT = process.argv[2] || 'G:\\EnterpriseDiningSystem';

// 按「长优先」排列，createReplacer 内部也会再排序，这里保持可读性
const WORDING = {
  // ---- 完整系统名/品牌 ----
  '企业餐厅点餐系统': '企业办公用品申领管理系统',
  'Xiaoyi Dining': 'SupplyHub',
  '企业餐厅': '企业后勤',
  '点餐管理系统': '申领管理系统',
  '食堂订餐系统': '办公用品申领系统',
  '企业餐饮服务': '企业后勤服务',

  // ---- 角色与岗位 ----
  '餐厅经理': '后勤主管',
  '厨房主管': '库存管理员',
  '配餐员': '配送员',
  '企业员工': '企业员工',

  // ---- 模块与菜单 ----
  // 注意顺序无关（单次匹配），但下面几条是"完整短语"映射：
  // 若只靠 批量打印->配送单打印 + 配送单->领用单 两条组合，
  // "批量打印配送单" 会变成不自然的 "配送单打印领用单"，所以整条给出。
  '批量打印配送单': '批量打印领用单',
  '批量打印': '配送单打印',
  '食谱库管理': '用品目录管理',
  '食谱库': '用品目录',
  '每日菜单': '领用计划',
  '菜单管理': '计划管理',
  '我的订单': '我的申领',
  '总括订单': '汇总领用单',
  '批量打印': '配送单打印',
  '销售统计': '领用统计',
  '销售报表': '领用报表',
  '用户管理': '用户管理',
  '系统设置': '系统设置',

  // ---- 业务动作 ----
  '订餐': '申领',
  '点餐': '申领',
  '菜品名称': '用品名称',
  '菜品数': '用品数',
  '菜品': '用品',
  '菜单项': '计划项',
  '菜单价': '结算价',
  '菜单': '领用计划',
  '食谱': '用品',
  '订单项': '申领明细',
  '订单': '申领单',
  '营业额': '领用金额',
  '下单': '提交申领',
  '配餐': '领用',
  '配送单': '领用单',
  '厨房': '仓库',
  '后厨': '仓库',
  '餐厅': '后勤',
  '销售': '领用',
  '口味': '规格',
  '主食': '书写工具',
  '甜品': '桌面文具',
  '汤品': '纸张本册',
  '菜肴': '办公耗材',
  '饮品': '办公设备',
  '套餐': '办公设备',
  '小吃': '办公耗材',

  // 注意：刻意不做「份->个」「碗->个」这类单字单位替换。
  // 中文没有词边界，单字替换会误伤无关词（例如 备份、身份、一份文件），
  // 而用品单位已由 devtools/supply_data.py 生成的种子数据给出，无需在此处理。
};

const EXTS = ['.java', '.js', '.html', '.css', '.sql', '.properties'];
const replace = createReplacer(WORDING);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'target', '.build-check', '.idea', 'devtools', 'images'].includes(e.name)) continue;
      walk(p, out);
    } else if (EXTS.includes(path.extname(e.name).toLowerCase())) {
      out.push(p);
    }
  }
  return out;
}

// WORDING 里含中文，不能用标识符扫描器（它按 [A-Za-z0-9_] 断词），
// 中文没有词边界，因此这里用「长优先」的字符串替换。
//
// 但**必须是一次匹配完成**，不能逐条 replace：
// 逐条替换时，前一条替换出来的结果会被后一条规则再次命中，产生连锁改写。
// 实测踩到的坑：批量打印 ->(规则1) 配送单打印 ->(规则2「配送单->领用单」) 领用单打印。
// 因此这里用一条合并正则，在原文上一次扫描完成所有替换，
// 新生成的文本不会再被本轮任何规则处理。
function buildWordingRegex(keys) {
  const alts = keys
    .slice()
    .sort((a, b) => b.length - a.length)   // 长优先：保证「批量打印」先于「打印」匹配
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp('(' + alts + ')', 'g');
}

const WORDING_KEYS = Object.keys(WORDING);
const WORDING_RE = buildWordingRegex(WORDING_KEYS);

function applyWording(text, onHit) {
  return text.replace(WORDING_RE, (m) => {
    if (onHit) onHit(m, 1);
    return WORDING[m];
  });
}

const files = walk(ROOT);
const perKey = new Map();
let changed = 0;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const out = applyWording(text, (k, n) => perKey.set(k, (perKey.get(k) || 0) + n));
  if (out !== text) {
    fs.writeFileSync(file, out, 'utf8');
    changed++;
  }
}

console.log('changed files: ' + changed);
console.log('--- wording replacements ---');
for (const [k, v] of [...perKey.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(String(v).padStart(6) + '  ' + k + ' -> ' + WORDING[k]);
}
