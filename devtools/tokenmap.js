// tokenmap.js
// 用途：改名期间共用的「标识符替换」核心逻辑。
//
// 为什么不能只用一条正则：
// 需要同时满足两个互相矛盾的约束——
//   A. import com.enterprise.supply.entity.Menu 里的 Menu 必须被替换（限定名里的类型名）。
//   B. org.springframework.core.annotation.Order 与 @Order 必须原样保留（框架包名/注解）。
// 两者点号前都是小写段，靠前后字符的 lookbehind 区分不了，所以用一个极小的扫描器记录上下文。
//
// 需要区分的三种「点号后」情形：
//   1. 包名链：  com.example.foo.Menu —— 链内每段都不该被改写，链尾的类型名要改写。
//   2. 类名限定：menuItemSummaryRepository.findByDailyOrderSummaryId —— 点号后是普通方法名，应改写。
//   3. 框架包名：core.annotation.Order —— 虽然形态同 1，但链尾是框架符号，必须保留。
//
// 关键判据（踩坑点）：包名链必须是「从根开始的连续链」。
//   a.b.c 中 a 前面没有点（不算限定），于是 b、c 都不算包名段，其中的词元可以正常替换；
//   com.example.foo 中 com 后面跟着点号，example 前面有点且 com 位于「带点链」上，于是整条链成立。
// 因此判断包名链需要同时用到「前面是否有点」和「前一个词是否位于带上点号的链上」。

// 需要保留的框架/库类型名：只有出现在框架包名段之后时才生效
const KEEP_QUALIFIED = new Set([
  'Order',
  'Ordered',
  'OrderComparator',
  'OrderedBeanPostProcessor',
  'OrderUtils',
]);

// 框架包名末段：这些段名后面的、且在保留名单里的类型名不替换
const FRAMEWORK_PACKAGE_SEGMENTS = new Set(['annotation', 'annotations']);

// 需要原样保留的小写标识符。
// 它们同时被用作「类名中的词」和「变量名」，而变量名在方法体里是独立整词出现
// （例如 private SupplyItemService recipeService; 之后到处写 recipeService.xxx()）。
// 类型名必须改，变量名保留可以显著减小改动面，这里显式列出以免被改写。
const KEEP_IDENTIFIERS = new Set([
  'menuService',
  'recipeService',
  'orderService',
  'dishService',
  'orderItemService',
  'summaryService',
  'salesReportService',
  'menuRepository',
  'recipeRepository',
  'orderRepository',
  'orderItemRepository',
  'dishRepository',
  'menuItemRepository',
  'menuItemSummaryRepository',
  'dailyOrderSummaryRepository',
  'menuController',
  'orderController',
  'recipeController',
]);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const isWordChar = (c) => c !== undefined && /[A-Za-z0-9_]/.test(c);
const isLowerWord = (w) => /^[a-z][A-Za-z0-9_]*$/.test(w);

/**
 * @param {Record<string,string>} map 旧词元 -> 新名字
 * @returns {(text:string, onHit?:(token:string)=>void) => string}
 */
function createReplacer(map) {
  const byFirstChar = new Map();
  for (const t of Object.keys(map).sort((a, b) => b.length - a.length)) {
    const c = t[0];
    if (!byFirstChar.has(c)) byFirstChar.set(c, []);
    byFirstChar.get(c).push(t);
  }

  return function replaceTokens(text, onHit) {
    let out = '';
    let i = 0;
    const n = text.length;

    // 上一个词及其「前面是否紧挨点号」，用于判断当前词是否直接跟在简单限定符之后。
    let prevWord = '';
    let prevWasAfterDot = false;

    // 是否处于字符串字面量内部（'...' 或 "..."）。
    // 这个状态很关键：字符串里装的是 SQL / 提示文案，不是 Java 限定名，
    // 包名链的启发式规则在字符串里完全不适用。
    // 例：原生 SQL "ON oi.order_id = o.id" 里的 oi.order_id 必须被替换，
    // 但如果按包名链规则（小写段 + 小写段）判断就会漏掉，导致 SQL 查了不存在的列。
    let inString = false;
    let stringQuote = '';

    // 消费一个词：更新状态并判断是否允许替换
    function consumeWord(word, wasAfterDot) {
      let atBoundary = true;
      if (wasAfterDot) {
        if (inString) {
          // 字符串内部（SQL 等）：点号后一律按普通标识符处理，照常参与替换
          atBoundary = true;
        } else {
          // Java 代码里点号后的情形：
          //   - 首字母大写：类型名（entity.Menu 要改，annotation.Order 由保留名单挡住）
          //   - 首字母小写且限定符首字母大写：字段/方法访问（oi.dish_name 这类不在 Java 代码里）
          //   - 首字母小写且限定符全小写：很可能是包名链（entity.menuItem），不改
          const startsUpper = /^[A-Z]/.test(word);
          const isFrameworkQualified =
            FRAMEWORK_PACKAGE_SEGMENTS.has(prevWord) && KEEP_QUALIFIED.has(word);
          if (isFrameworkQualified) atBoundary = false;
          else if (startsUpper) atBoundary = true;
          else atBoundary = /^[A-Z]/.test(prevWord);
        }
      }

      const cands =
        atBoundary && !KEEP_IDENTIFIERS.has(word) ? byFirstChar.get(word[0]) : undefined;
      let hit = null;
      if (cands) for (const t of cands) if (word === t) { hit = t; break; }

      const emitted = hit ? map[hit] : word;
      if (hit && onHit) onHit(hit);

      prevWord = emitted;
      prevWasAfterDot = wasAfterDot;

      return emitted;
    }

    while (i < n) {
      const c = text[i];

      // '@' 之后紧跟的标识符不替换（保护 @Order、@SpringBootApplication 等注解）
      if (c === '@') {
        let j = i + 1;
        while (j < n && isWordChar(text[j])) j++;
        const word = text.slice(i + 1, j);
        out += text.slice(i, j);
        prevWord = word;
        prevWasAfterDot = false;
        i = j;
        continue;
      }

      // 标识符：无论是否在字符串内部都要走 consumeWord。
      // 之前的写法是 `isWordChar(c) && !inString`，导致字符串开头的第一个词
      // （例如 "t_order_item" 里的 t_order_item）被当成普通字符原样拷贝、
      // 永远不参与替换——SQL 和 @Column 里的列名/表名因此改不掉。
      // 字符串与代码的区别只在 consumeWord 内部处理（是否套用包名链规则）。
      if (isWordChar(c)) {
        let j = i;
        while (j < n && isWordChar(text[j])) j++;
        const word = text.slice(i, j);
        const wasAfterDot = i > 0 && text[i - 1] === '.';
        out += consumeWord(word, wasAfterDot);
        i = j;
        continue;
      }

      // 字符串字面量：进入/退出时切换状态。字符串内部的标识符同样参与替换
      // （SQL 原文里的列名必须改），但不套用 Java 限定名的边界规则。
      if (c === '"' || c === "'") {
        if (!inString) { inString = true; stringQuote = c; }
        else if (c === stringQuote) { inString = false; stringQuote = ''; }
        out += c;
        prevWord = '';
        prevWasAfterDot = false;
        i++;
        continue;
      }

      // 反斜杠转义：在字符串内跳过下一个字符，避免把 \" 当成字符串结束
      if (inString && c === '\\') {
        out += text.slice(i, i + 2);
        i += 2;
        continue;
      }

      out += c;
      // 点号不断开限定名，需要保留 prevWord，供下一个词判断"点号前的段是什么"。
      // 其它字符（含空白）一律断开限定名上下文。
      if (c !== '.') {
        prevWord = '';
        prevWasAfterDot = false;
      }
      i++;
    }

    return out;
  };
}

module.exports = { createReplacer, KEEP_QUALIFIED, KEEP_IDENTIFIERS, FRAMEWORK_PACKAGE_SEGMENTS, escapeRe };
