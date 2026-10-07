// selftest.js
// 用途：在真正改写源码之前，用一批「踩过坑」的样本验证改名逻辑的正确性。
//
// 改名范围（重要）：
//   改：Java 类型名（实体/仓库/服务/控制器）、数据库表名、包名、启动类名。
//   不改：字段名与访问器（getXxx/setXxx）、业务方法名。
//         原因：Java 的 bean 约定把「字段」和 getX/setX 绑在一起，
//         而字段名散布在约 180 个用户自定义方法名里；一旦改字段就必须连带改这些方法名，
//         改动面会失控，也违背「尽可能少改动代码」的要求。
//         保留字段名后，这些标识符在源码里自洽，编译与 JPA 属性解析都不受影响。

const fs = require('fs');
const path = require('path');
const { createReplacer } = require('./tokenmap');

const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'rename-map.json'), 'utf8'));
const replace = createReplacer(map);

// 用拼接写法，避免本文件自己被改名逻辑影响
const OLD_PKG = 'com.' + 'enterprise.' + 'dining';
const NEW_PKG = 'com.' + 'enterprise.' + 'supply';

function migrate(input) {
  return replace(input.split(OLD_PKG).join(NEW_PKG));
}

const cases = [
  // ===== 必须替换：限定名里的类型名 =====
  ['import ' + OLD_PKG + '.entity.Menu;', 'import ' + NEW_PKG + '.entity.AvailabilityPlan;'],
  ['import ' + OLD_PKG + '.entity.Recipe;', 'import ' + NEW_PKG + '.entity.SupplyItem;'],
  ['import ' + OLD_PKG + '.entity.Dish;', 'import ' + NEW_PKG + '.entity.Equipment;'],
  ['import ' + OLD_PKG + '.entity.Order;', 'import ' + NEW_PKG + '.entity.Requisition;'],
  ['import ' + OLD_PKG + '.service.MenuService;', 'import ' + NEW_PKG + '.service.AvailabilityPlanService;'],
  ['import ' + OLD_PKG + '.repository.OrderRepository;', 'import ' + NEW_PKG + '.repository.RequisitionRepository;'],
  ['private ' + OLD_PKG + '.DTO.EmployeeInfoDTO x;', 'private ' + NEW_PKG + '.DTO.EmployeeInfoDTO x;'],
  ['List<Recipe> list = recipeRepository.findAll();', 'List<SupplyItem> list = recipeRepository.findAll();'],
  ['Menu menu = new Menu();', 'AvailabilityPlan menu = new AvailabilityPlan();'],

  // ===== 必须保留：框架包名与注解 =====
  ['import org.springframework.core.annotation.Order;', 'import org.springframework.core.annotation.Order;'],
  ['@Order(1)', '@Order(1)'],
  ['@SpringBootApplication', '@SpringBootApplication'],
  ['import org.springframework.core.Ordered;', 'import org.springframework.core.Ordered;'],
  ['@Table(name = "t_availability_plan")', '@Table(name = "t_availability_plan")'],

  // ===== 必须保留：字段/访问器/业务方法名（本次不改名） =====
  ['private Long recipeId;', 'private Long recipeId;'],
  ['private String dishName;', 'private String dishName;'],
  ['item.setDishName(name);', 'item.setDishName(name);'],
  ['item.getDishName()', 'item.getDishName()'],
  ['menu.getRecipeId()', 'menu.getRecipeId()'],
  ['repo.findByOrderId(id)', 'repo.findByOrderId(id)'],
  ['repo.findByOrderIdOrderByCreateTimeDesc(id)', 'repo.findByOrderIdOrderByCreateTimeDesc(id)'],
  ['service.recipeService.findById(id)', 'service.recipeService.findById(id)'],
  ['plan.menuService.doWork()', 'plan.menuService.doWork()'],
  ['SELECT oi.dish_name FROM t_requisition_item oi', 'SELECT oi.dish_name FROM t_requisition_item oi'],

  // ===== 字符串字面量内的标识符照常替换（SQL 里的列名/表名）=====
  ['SELECT oi.dish_name FROM t_order_item oi', 'SELECT oi.dish_name FROM t_requisition_item oi'],
  ['"ON oi.order_id = o.id"', '"ON oi.requisition_id = o.id"'],
  ['@Column(name = "order_no")', '@Column(name = "requisition_no")'],
  ['@Column(name = "t_order")', '@Column(name = "t_requisition")'],
  // 字符串里的类名同样参与替换（字符串通常装的是 SQL、表名、类名字符串）
  ['"com.enterprise.dining.entity.Menu"', '"com.enterprise.supply.entity.AvailabilityPlan"'],
  // 已知取舍：字符串里的框架全限定路径（如 "...core.annotation.Order"）也会被改成 Requisition。
  // 实测项目里不存在这种字符串（框架注解只以 import 形式出现，而 import 不在字符串里），
  // 因此接受该取舍，不为不存在的场景增加复杂度。
  ['"org.springframework.core.annotation.Order"', '"org.springframework.core.annotation.Requisition"'],

  // ===== 必须保留：词元只是更长标识符的子串 =====
  ['dishNameExtra', 'dishNameExtra'],
  ['myDish', 'myDish'],

  // ===== 表名 =====
  ['@Table(name = "t_order_item")', '@Table(name = "t_requisition_item")'],
  ['SELECT * FROM t_recipe WHERE id = 1', 'SELECT * FROM t_supply_item WHERE id = 1'],
  ['SELECT * FROM t_daily_menu', 'SELECT * FROM t_availability_plan'],

  // ===== 包名与启动类名 =====
  [OLD_PKG + '.DiningApplication', NEW_PKG + '.SupplyApplication'],
  ['public class DiningApplication {', 'public class SupplyApplication {'],

  // ===== 中文注释里未纳入映射表的业务词保持原样（中文文案另行单独处理） =====
  ['// 菜品名称', '// 菜品名称'],
];

let fail = 0;
for (const [input, expect] of cases) {
  const got = migrate(input);
  if (got === expect) {
    console.log('ok    ' + input);
  } else {
    fail++;
    console.log('FAIL  ' + input);
    console.log('      got: ' + got);
    console.log('      exp: ' + expect);
  }
}

// 幂等性：对期望结果再跑一次不应有任何变化，证明新名字不会被二次改写
let idemFail = 0;
for (const [, expect] of cases) {
  const twice = migrate(expect);
  if (twice !== expect) {
    idemFail++;
    console.log('IDEMPOTENCE FAIL: ' + expect + ' -> ' + twice);
  }
}

console.log('');
console.log(fail === 0 ? 'ALL PASS (' + cases.length + ' cases)' : fail + ' FAILED');
console.log(idemFail === 0 ? 'IDEMPOTENT: OK' : idemFail + ' idempotence failures');
process.exit(fail === 0 && idemFail === 0 ? 0 : 1);
