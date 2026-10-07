const map = JSON.parse(require('fs').readFileSync('devtools/rename-map.json','utf8'));
const alts = Object.keys(map).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
const re = new RegExp('(?<![A-Za-z0-9_])(?<!\\.[a-z])(?<![.@])('+alts+')(?![A-Za-z0-9_])','g');

const cases = [
  ['import com.enterprise.dining.entity.Menu;',        'import com.enterprise.supply.entity.AvailabilityPlan;'],
  ['import com.enterprise.dining.entity.Recipe;',      'import com.enterprise.supply.entity.SupplyItem;'],
  ['import org.springframework.core.annotation.Order;','import org.springframework.core.annotation.Order;'],
  ['@Order(1)',                                        '@Order(1)'],
  ['@SpringBootApplication',                           '@SpringBootApplication'],
  ['private AvailabilityPlanService menuService;',     'private AvailabilityPlanService menuService;'],
  ['private Long recipeId;',                           'private Long supplyItemId;'],
  ['item.setDishName(name);',                          'item.setItemName(name);'],
  ['dishName',                                         'itemName'],
  ['Menu.java',                                        'AvailabilityPlan.java'],
  ['t_order_item',                                     't_requisition_item'],
  ['findByOrderId',                                    'findByRequisitionId'],
  ['OrderStatus.PENDING',                              'RequisitionStatus.PENDING'],
  ['com.enterprise.dining.DiningApplication',          'com.enterprise.supply.SupplyApplication'],
  ['order_no',                                         'requisition_no'],
];
let fail=0;
for (const [input, expect] of cases) {
  let out = input.replace(/(?<![A-Za-z0-9_.])DiningApplication(?![A-Za-z0-9_])/g,'SupplyApplication').split('com.enterprise.dining').join('com.enterprise.supply');
  out = out.replace(re, m => map[m]);
  const ok = out === expect;
  if (!ok) { fail++; console.log('FAIL\n  in : '+input+'\n  got: '+out+'\n  exp: '+expect); }
  else console.log('ok   '+input+'  ->  '+out);
}
console.log(fail===0 ? '\nALL PASS' : '\n'+fail+' FAILED');
