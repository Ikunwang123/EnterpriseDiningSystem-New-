// rename-java.js
// 用途：把 Java 源码里的「点餐域」标识符整体改成「办公用品申领域」标识符，并把文件名同步成新的类型名。
// 三步：1) 换包名/启动类名  2) 按词元映射表换类名/字段名/表名  3) 文件重命名
// 这是改名期间的一次性工具，不属于项目运行时代码。

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'G:\\EnterpriseDiningSystem';
const MAP_FILE = path.join(__dirname, 'rename-map.json');

const OLD = 'com.' + 'enterprise.' + 'dining';
const NEW = 'com.' + 'enterprise.' + 'supply';

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

const identity = Object.keys(map).filter((k) => map[k] === k);
if (identity.length) {
  console.error('FATAL: 映射表存在自映射: ' + identity.join(', '));
  process.exit(1);
}

// 标识符替换的核心逻辑在 tokenmap.js（上下文扫描器），这里只负责遍历与文件重命名
const { createReplacer } = require('./tokenmap');
const replaceTokens = createReplacer(map);

function walkJava(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJava(p, out);
    else if (e.name.endsWith('.java')) out.push(p);
  }
  return out;
}

const javaRoot = path.join(ROOT, 'src', 'main', 'java');

// ---------- 步骤 1 + 2：改内容 ----------
// 先替换包名，再交给扫描器做标识符替换。
// DiningApplication -> SupplyApplication 也放在映射表里统一处理，不再单独写正则。
let changed = 0;
const perToken = new Map();
for (const file of walkJava(javaRoot)) {
  const text = fs.readFileSync(file, 'utf8');
  let out = text.split(OLD).join(NEW);
  out = replaceTokens(out, (m) => perToken.set(m, (perToken.get(m) || 0) + 1));

  if (out !== text) {
    fs.writeFileSync(file, out, 'utf8');
    changed++;
  }
}
console.log('content-changed java files: ' + changed);

// ---------- 步骤 3：移动包目录 ----------
const oldDir = path.join(javaRoot, 'com', 'enterprise', 'dining');
const newDir = path.join(javaRoot, 'com', 'enterprise', 'supply');
if (fs.existsSync(newDir)) { console.error('FATAL: 目标包目录已存在: ' + newDir); process.exit(1); }
if (!fs.existsSync(oldDir)) { console.error('FATAL: 找不到原包目录: ' + oldDir); process.exit(1); }
fs.renameSync(oldDir, newDir);
console.log('moved package dir -> com/enterprise/supply');

// ---------- 步骤 4：文件名跟随类型名 ----------
let renamed = 0;
for (const file of walkJava(newDir)) {
  const text = fs.readFileSync(file, 'utf8');
  // 只取顶层 public 类型：逐个字符扫描维护花括号深度，避免命中嵌套类
  let depth = 0;
  let lineStart = 0;
  let decl = null;
  for (let i = 0; i < text.length && !decl; i++) {
    const ch = text[i];
    if (ch === '\n') { lineStart = i + 1; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') { depth = Math.max(0, depth - 1); continue; }
    if (depth === 0 && /^\s*$/.test(text.slice(lineStart, i))) {
      const rest = text.slice(i);
      const m = /^(?:public\s+)(?:final\s+|abstract\s+|static\s+)*(class|interface|enum|record)\s+([A-Za-z_$][A-Za-z0-9_$]*)/.exec(rest);
      if (m) decl = m[2];
    }
  }
  if (!decl) { console.log('  no top-level public type: ' + path.relative(ROOT, file)); continue; }
  const base = path.basename(file, '.java');
  if (decl !== base) {
    const target = path.join(path.dirname(file), decl + '.java');
    if (fs.existsSync(target)) { console.log('  SKIP (exists): ' + base + ' -> ' + decl); continue; }
    fs.renameSync(file, target);
    renamed++;
  }
}
console.log('renamed files: ' + renamed);

// ---------- 步骤 5：删除未实现的存根控制器 ----------
// ReportController 与 KitchenController 是小组分工时留下的 TODO 骨架：
//   - ReportController 的 /api/report/monthly 与真正的报表控制器路由重复，
//     两个 @RequestMapping 撞在一起会让 Spring MVC 初始化直接抛
//     NullPointerException（PatternsRequestCondition.condition 为 null）；
//   - KitchenController 的接口全是写死的返回值，前端也没有任何地方调用。
// 删除它们是改名过程中为了让应用能正常启动所必需的。
const stubs = [
  path.join(newDir, 'controller', 'ReportController.java'),
  path.join(newDir, 'controller', 'KitchenController.java'),
];
for (const s of stubs) {
  if (fs.existsSync(s)) { fs.unlinkSync(s); console.log('removed stub: ' + path.relative(ROOT, s)); }
}

// ---------- 步骤 6：统一包名大小写 ----------
// 原项目里同时存在 com.enterprise.dining.service 与 com.enterprise.dining.Service
// 两个只差大小写的包（部分文件的 package 声明写成了大写的 Service）。
// 在 Windows 的大小写不敏感文件系统上能编译通过，但在 Linux 构建机或 CI 上会失败，
// 而且属于明显的结构问题。这里统一收敛到小写 service，并移除大写目录。
const serviceUpper = path.join(newDir, 'Service');
const serviceLower = path.join(newDir, 'service');

// 递归把 src 目录内容合并进 dst 目录（含子目录），然后删除 src。
function mergeDirInto(src, dst) {
  if (!fs.existsSync(src)) return 0;
  let moved = 0;
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) moved += mergeDirInto(from, to);
    else if (!fs.existsSync(to)) { fs.renameSync(from, to); moved++; }
    else fs.unlinkSync(from);
  }
  return moved;
}

function isSameDir(a, b) {
  try {
    return path.resolve(fs.realpathSync(a)).toLowerCase() === path.resolve(fs.realpathSync(b)).toLowerCase();
  } catch (e) {
    return false;
  }
}

if (fs.existsSync(serviceUpper)) {
  const sameDir = fs.existsSync(serviceLower) && isSameDir(serviceUpper, serviceLower);
  if (sameDir) {
    // Windows 等大小写不敏感的文件系统上，"Service" 与 "service" 其实就是同一个目录。
    // 这种情况下只能把目录名真正改成小写（先改成临时名再改回来），
    // 绝不能按"合并两个目录"处理——那会把整个包删掉。
    const tmp = path.join(newDir, 'service_tmp_rename');
    fs.renameSync(serviceUpper, tmp);
    fs.renameSync(tmp, serviceLower);
    console.log('renamed package dir case: Service -> service');
  } else {
    const mergedCount = mergeDirInto(serviceUpper, serviceLower);
    fs.rmSync(serviceUpper, { recursive: true, force: true });
    console.log('merged package dir: Service -> service (' + mergedCount + ' files)');
  }
}

// 把所有源码里大写 Service 包的引用改成小写
let caseFixed = 0;
const upperRef = new RegExp('com\\.enterprise\\.supply\\.Service(?![A-Za-z])', 'g');
for (const f of walkJava(newDir)) {
  const t = fs.readFileSync(f, 'utf8');
  const out = t.replace(upperRef, 'com.enterprise.supply.service');
  if (out !== t) { fs.writeFileSync(f, out, 'utf8'); caseFixed++; }
}
console.log('package-case fixed files: ' + caseFixed);

// ---------- 步骤 7：申领单号前缀 ----------
// 原单号形如 ORD-20260101-123456（Order），改成 REQ- 前缀以匹配「申领」语义。
// 前端没有硬编码该前缀，只有这一个生成点。
let prefixFixed = 0;
for (const f of walkJava(newDir)) {
  const t = fs.readFileSync(f, 'utf8');
  if (t.includes('"ORD-%s-%d"')) {
    fs.writeFileSync(f, t.replace(/"ORD-%s-%d"/g, '"REQ-%s-%d"'), 'utf8');
    prefixFixed++;
  }
}
console.log('requisition-no prefix fixed files: ' + prefixFixed);

// ---------- 步骤 8：前端模块文件改名 + 补齐 index.html 引用 ----------
// 前端的 JS 模块文件名里同样带业务词（RecipeModule.js 等），必须跟着改；
// index.html 的 <script src> 也要同步。
// 这两步之前是手工做的，导致"从基线重跑"时会丢失——所以并入脚本，保证可复现。
const staticDir = path.join(ROOT, 'src', 'main', 'resources', 'static');
const jsDir = path.join(staticDir, 'js');

const JS_RENAMES = {
  'RecipeModule.js': 'SupplyItemModule.js',
  'MenuModule.js': 'AvailabilityPlanModule.js',
  'DailyMenuModule.js': 'AvailabilityPlanBrowseModule.js',
  'BlanketOrderModule.js': 'SummarySheetModule.js',
  'ReportModule.js': 'RequisitionReportModule.js',
  'OrderModule.js': 'RequisitionModule.js',
};

let jsRenamed = 0;
if (fs.existsSync(jsDir)) {
  for (const [from, to] of Object.entries(JS_RENAMES)) {
    const a = path.join(jsDir, from);
    const b = path.join(jsDir, to);
    if (fs.existsSync(a) && !fs.existsSync(b)) { fs.renameSync(a, b); jsRenamed++; }
  }
}
console.log('frontend module files renamed: ' + jsRenamed);

// index.html 的 script 引用同步改名
const indexPath = path.join(staticDir, 'index.html');
const appJsPath = path.join(jsDir, 'app.js');

// app.js 里对这些模块「全局名」的调用也要同步改。
// 注意：模块名里的业务词元（Recipe/Menu/Order/BlanketOrder/DailyMenu/Report）
// 在改名映射表里能匹配到，所以形如 BlanketOrderModule 的名字已由步骤 2 换好；
// 但 RecipeModule / MenuModule / OrderModule / DailyMenuModule / ReportModule
// 是"整词等于映射键"或"前缀即映射键"的情况，必须在这里按最长优先显式替换，
// 否则 app.js 会引用根本不存在的全局名，表现为「点击导航没反应」。
const APP_GLOBAL_RENAMES = [
  ['RecipeModule', 'SupplyItemModule'],           // 必须在 MenuItem* 之前无影响，但放前面更直观
  ['MenuItemSummaryModule', 'PlanItemSummaryModule'],
  ['MenuItemModule', 'PlanItemModule'],
  ['BlanketOrderModule', 'SummarySheetModule'],   // 兜底：若步骤 2 未覆盖
  ['DailyMenuModule', 'AvailabilityPlanBrowseModule'],
  ['MenuModule', 'AvailabilityPlanModule'],
  ['OrderModule', 'RequisitionModule'],
  ['ReportModule', 'RequisitionReportModule'],
];

function applyAppGlobalRenames(text) {
  let out = text;
  for (const [from, to] of APP_GLOBAL_RENAMES) {
    out = out.replace(new RegExp('(?<![A-Za-z0-9_])' + from + '(?![A-Za-z0-9_])', 'g'), to);
  }
  return out;
}

if (fs.existsSync(appJsPath)) {
  const before = fs.readFileSync(appJsPath, 'utf8');
  const after = applyAppGlobalRenames(before);
  if (after !== before) {
    fs.writeFileSync(appJsPath, after, 'utf8');
    console.log('app.js module globals fixed');
  }
}

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  let refFixed = 0;
  for (const [from, to] of Object.entries(JS_RENAMES)) {
    const before = html;
    html = html.split('js/' + from).join('js/' + to);
    if (html !== before) refFixed++;
  }
  if (html !== fs.readFileSync(indexPath, 'utf8')) {
    fs.writeFileSync(indexPath, html, 'utf8');
  }
  console.log('index.html script refs fixed: ' + refFixed);
}

// ---------- 步骤 9：删除改名后残留的旧模块文件 ----------
// 基线里有几个模块已经不被 index.html 引用了（例如旧版菜单/总括实现），
// 改名后它们会同时保留"旧名 + 新名"两份，容易造成混乱。
// 只删除「既不被 index.html 引用、又存在同目录新名字版本」的孤儿文件。
const ORPHAN_CANDIDATES = [
  'MenuModule.js', 'RecipeModule.js', 'OrderModule.js',
  'DailyMenuModule.js', 'BlanketOrderModule.js', 'ReportModule.js',
];
if (fs.existsSync(indexPath)) {
  const htmlNow = fs.readFileSync(indexPath, 'utf8');
  for (const f of ORPHAN_CANDIDATES) {
    const p = path.join(jsDir, f);
    if (!fs.existsSync(p)) continue;
    if (htmlNow.includes('js/' + f)) continue;   // 仍被引用则保留
    fs.unlinkSync(p);
    console.log('removed orphan frontend module: ' + f);
  }
}

// ---------- 步骤 10：修复原项目自带的一处 JS 语法错误 ----------
// 基线 MenuModule.js（改名后为 AvailabilityPlanModule.js）第 358-359 行本来就是坏的：
//     fetch('/ap/menu/create?dazte=' + encodeURIComponent(date), {
//         i            method: 'POST',
// `?dazte=` 是 `?date=` 的手滑，`i` 是多余字符，导致整个 JS 文件语法错误、
// 浏览器直接不执行，表现为「点击计划管理没反应」。
// 这里顺手修正，否则该功能无法使用。
const planModulePath = path.join(jsDir, 'AvailabilityPlanModule.js');
if (fs.existsSync(planModulePath)) {
  let js = fs.readFileSync(planModulePath, 'utf8');
  const broken = /fetch\('\/ap\/menu\/create\?dazte=' \+ encodeURIComponent\(date\), \{\s*\n\s*i\s+method: 'POST',/;
  if (broken.test(js)) {
    js = js.replace(broken, "fetch('/api/menu/create?date=' + encodeURIComponent(date), {\n            method: 'POST',");
    fs.writeFileSync(planModulePath, js, 'utf8');
    console.log('fixed pre-existing JS syntax error in AvailabilityPlanModule.js');
  }
}

// ---------- 步骤 11：后端配置里的数据库名 ----------
// 这一步曾经漏掉，导致严重且隐蔽的问题：
// 构建从基线恢复 src/main/resources 后，application.properties 里的库名又变回
// 改名前旧的 xiaoyi_dining；而旧库里恰好也有一张同名 t_supply_item 表
// （历史迁移演练时留下的），于是应用"能正常启动、数据也能查出来"，
// 只是字段全是旧的、image_url 全为 NULL ——
// 症状表现成"图片不显示"，实际根因是连错库，非常难查。
// 因此库名替换必须固化在流程里。
const appPropsPath = path.join(ROOT, 'src', 'main', 'resources', 'application.properties');
const DB_OLD = 'xiaoyi_dining';
const DB_NEW = 'office_supply';
if (fs.existsSync(appPropsPath)) {
  const before = fs.readFileSync(appPropsPath, 'utf8');
  const after = before.split(DB_OLD).join(DB_NEW);
  if (after !== before) {
    fs.writeFileSync(appPropsPath, after, 'utf8');
    console.log('datasource db name fixed: ' + DB_OLD + ' -> ' + DB_NEW);
  } else {
    console.log('datasource db name already correct');
  }
}

// ---------- 步骤 12：确认 pom 依赖（这些是手工加过、易被回退的）----------
// pom.xml 不在"从基线恢复"的范围内，但为防以后有人手滑，这里做一次存在性检查。
const pomPath = path.join(ROOT, 'pom.xml');
if (fs.existsSync(pomPath)) {
  const pom = fs.readFileSync(pomPath, 'utf8');
  if (!pom.includes('javax.annotation-api')) {
    console.log('WARNING: pom.xml 缺少 javax.annotation-api，JDK17 下启动会失败');
  }
  if (!pom.includes('supply-system')) {
    console.log('WARNING: pom.xml 的 artifactId 未改成 supply-system');
  }
  if (pom.includes('com.enterprise.dining.DiningApplication')) {
    console.log('WARNING: pom.xml 的 mainClass 仍指向旧的 DiningApplication');
  }
}

// ---------- 步骤 13：修掉前端一个失效的兜底图 ----------
// AvailabilityPlanBrowseModule 里写的是：
//     <img src="${item.imageUrl || 'images/default-food.png'}"
//          onerror="this.src='images/default-food.png'">
// 有两个问题：
//   1) static/images 下并没有 default-food.png，兜底本身就 404；
//   2) 路径用的是相对写法 'images/...'，且名字还是"food"（餐饮语义）。
// 由于配图约定就是 /images/<用品ID>.png，这里直接把兜底改成按 ID 推导，
// 既能兜住 imageUrl 为空的情况，也不依赖那个不存在的文件。
const browseModulePath = path.join(jsDir, 'AvailabilityPlanBrowseModule.js');
if (fs.existsSync(browseModulePath)) {
  let js = fs.readFileSync(browseModulePath, 'utf8');
  const before = js;
  js = js.replace(
    /<img src="\$\{item\.imageUrl \|\| 'images\/default-food\.png'\}"([^>]*?)onerror="this\.src='images\/default-food\.png'">/,
    '<img src="${item.imageUrl || \'/images/\' + item.id + \'.png\'}"$1onerror="this.onerror=null;this.src=\'/images/\' + item.id + \'.png\'">'
  );
  if (js !== before) {
    fs.writeFileSync(browseModulePath, js, 'utf8');
    console.log('fixed broken fallback image in AvailabilityPlanBrowseModule.js');
  } else {
    console.log('NOTE: AvailabilityPlanBrowseModule 的兜底图未匹配到，请人工确认');
  }
}

// ---------- 步骤 14：修正接口路径 -----
// 「我的申领」接口原本是 /api/dining/my-orders，前端调用处被改成了
// /api/dining/my-requisitions，但后端 @GetMapping 还是 /my-orders，
// 于是前端 404、页面显示"加载失败"。
// 原因：路径带连字符（my-orders），词元扫描器按 [A-Za-z0-9_] 断词匹配不到，
// 所以必须作为完整字符串处理。这里把「后端定义」和「前端调用」统一到 my-requisitions。
let apiPathFixed = 0;

const requisitionControllerPath = path.join(newDir, 'controller', 'RequisitionController.java');
if (fs.existsSync(requisitionControllerPath)) {
  const t = fs.readFileSync(requisitionControllerPath, 'utf8');
  if (t.includes('"/my-orders"')) {
    fs.writeFileSync(requisitionControllerPath, t.split('"/my-orders"').join('"/my-requisitions"'), 'utf8');
    apiPathFixed++;
  }
}

// 前端遗留的美食文案
const requisitionModulePath = path.join(jsDir, 'RequisitionModule.js');
if (fs.existsSync(requisitionModulePath)) {
  const t = fs.readFileSync(requisitionModulePath, 'utf8');
  const fixed = t.split('快去领用计划选择美食吧').join('快去领用计划选择需要的用品吧');
  if (fixed !== t) {
    fs.writeFileSync(requisitionModulePath, fixed, 'utf8');
    console.log('fixed leftover copy in RequisitionModule.js');
  }
}
console.log('api path fixed files: ' + apiPathFixed);

// ---------- 步骤 15：删除确认无用的死代码 ----------
// 经审计（devtools/audit-features.js）确认：这两组代码没有任何入口——
//   · 办公设备（Equipment）：实体 + 控制器 + 服务 + 仓库，前端无调用、导航无入口，
//     对应的 t_equipment 表也一直是空的。
//   · PlanItem：实体 + 仓库，没有任何代码引用（注意 PlanItemSummary 是汇总用的，必须保留）。
// 删除后页面与接口行为完全不变，只是少了一批僵尸代码。
const DEAD_FILES = [
  ['controller', 'EquipmentController.java'],
  ['service', 'EquipmentService.java'],
  ['repository', 'EquipmentRepository.java'],
  ['entity', 'Equipment.java'],
  ['repository', 'PlanItemRepository.java'],
  ['entity', 'PlanItem.java'],
];
let deadRemoved = 0;
for (const [pkg, file] of DEAD_FILES) {
  const p = path.join(newDir, pkg, file);
  if (fs.existsSync(p)) { fs.unlinkSync(p); deadRemoved++; }
}
console.log('dead code files removed: ' + deadRemoved);

// 删除死的 PlanItemRepository 之后，SummaryServiceImpl 里还留着它的 import 与字段声明
// （该字段只有声明、全项目从未被使用），必须一起清掉否则编译不过。
const summaryImplPath = path.join(newDir, 'service', 'impl', 'SummaryServiceImpl.java');
if (fs.existsSync(summaryImplPath)) {
  let t = fs.readFileSync(summaryImplPath, 'utf8');
  const before = t;
  t = t.replace(/^import com\.enterprise\.supply\.repository\.PlanItemRepository;\r?\n/m, '');
  t = t.replace(/\r?\n[ \t]*@Autowired\r?\n[ \t]*private PlanItemRepository menuItemRepository;\r?\n/, '\n');
  if (t !== before) {
    fs.writeFileSync(summaryImplPath, t, 'utf8');
    console.log('cleaned unused PlanItemRepository reference in SummaryServiceImpl');
  }
}

// ---------- 步骤 16：修正实体列名与数据库一致性 ----------
// 踩过的坑：映射表里 dish_id 与 recipeId 都指向了 supplyItemId，
// 于是 RequisitionItem 的 @Column 被改成 supply_item_id，
// 而数据库（由 init.sql / 迁移脚本创建）用的是 item_id，
// 结果运行时才炸：Unknown column 'supply_item_id' in 'field list'
// —— 只有「提交申领 / 汇总」这类真正读写该表的操作才会触发。
// 这里显式把两处列名拉齐（Java 字段名保持 menuItemId，仅列名对齐数据库）。
const entityFix = [
  // RequisitionItem：数据库列是 item_id，但映射表把 dish_id 改成了 supply_item_id，需拉回 item_id
  ['entity/RequisitionItem.java', [
    ['@Column(name = "supply_item_id")', '@Column(name = "item_id")'],
  ]],
  // PlanItemSummary：数据库列是 plan_item_id / plan_item_name（由 generate_all.py 生成），
  // 但映射表把 menu_item_id 改成了 plan_item_id 之后、实体这里仍是旧值，
  // 需要统一到数据库实际列名 plan_item_*。
  ['entity/PlanItemSummary.java', [
    ['@Column(name = "menu_item_id")', '@Column(name = "plan_item_id")'],
    ['@Column(name = "menu_item_name")', '@Column(name = "plan_item_name")'],
  ]],
];
let entityFixed = 0;
for (const [rel, pairs] of entityFix) {
  const p = path.join(newDir, rel);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, 'utf8');
  const before = t;
  for (const [from, to] of pairs) t = t.split(from).join(to);
  if (t !== before) { fs.writeFileSync(p, t, 'utf8'); entityFixed++; }
}
console.log('entity column-name fixed files: ' + entityFixed);

console.log('--- replacements per token (top 40) ---');
for (const [k, v] of [...perToken.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)) {
  console.log(String(v).padStart(5) + '  ' + k + ' -> ' + map[k]);
}
