// src/main/java/com/enterprise/dining/service/impl/SummaryServiceImpl.java
package com.enterprise.supply.service.impl;

import com.enterprise.supply.entity.RequisitionSummary;
import com.enterprise.supply.entity.PlanItemSummary;
import com.enterprise.supply.repository.RequisitionSummaryRepository;
import com.enterprise.supply.repository.PlanItemSummaryRepository;
import com.enterprise.supply.repository.RequisitionItemRepository;
import com.enterprise.supply.service.SummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class SummaryServiceImpl implements SummaryService {

    @Autowired
    private RequisitionItemRepository orderItemRepository;


    @Autowired
    private RequisitionSummaryRepository dailyOrderSummaryRepository;

    @Autowired
    private PlanItemSummaryRepository menuItemSummaryRepository;

    @Override
    @Transactional
    public RequisitionSummary generateDailySummary(LocalDate date) {
        // 检查是否已经存在该日期的汇总
        RequisitionSummary existingSummary = dailyOrderSummaryRepository.findBySummaryDate(date);
        if (existingSummary != null) {
            // 如果已存在，则先删除旧的汇总数据
            menuItemSummaryRepository.deleteByDailyOrderSummaryId(existingSummary.getId());
            dailyOrderSummaryRepository.delete(existingSummary);
        }

        // 统计当天所有申领明细
        // 查询返回格式: [item_name, unit, SUM(quantity), SUM(sub_total)]
        List<Object[]> orderStats = orderItemRepository.getDailyOrderStatistics(date);

        // 计算总数量和总金额
        int totalQuantity = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Object[] stat : orderStats) {
            totalQuantity += ((Number) stat[2]).intValue(); // SUM(quantity)
            totalAmount = totalAmount.add((BigDecimal) stat[3]); // SUM(sub_total)
        }

        // 创建每日汇总记录
        RequisitionSummary dailySummary = new RequisitionSummary(date, totalAmount, totalQuantity);
        
        // 如果表存在，保存汇总记录；否则只返回对象
        try {
            dailySummary = dailyOrderSummaryRepository.save(dailySummary);

            // 创建每个用品的汇总记录
            for (Object[] stat : orderStats) {
                String dishName = (String) stat[0]; // item_name
                String unit = (String) stat[1]; // unit
                Integer quantity = ((Number) stat[2]).intValue(); // SUM(quantity)
                BigDecimal totalPrice = (BigDecimal) stat[3]; // SUM(sub_total)
                
                // 计算单价：总价/数量
                BigDecimal unitPrice = quantity > 0 ? 
                    totalPrice.divide(BigDecimal.valueOf(quantity), 2, java.math.RoundingMode.HALF_UP) : 
                    BigDecimal.ZERO;

                PlanItemSummary itemSummary = new PlanItemSummary(
                        dailySummary, null, dishName, quantity, unitPrice, totalPrice
                );
                menuItemSummaryRepository.save(itemSummary);
            }
        } catch (Exception e) {
            // 如果表不存在，只返回对象，不保存到数据库
            // 这样至少可以让查询接口工作
        }

        return dailySummary;
    }

    @Override
    public RequisitionSummary getDailySummary(LocalDate date) {
        try {
            RequisitionSummary summary = dailyOrderSummaryRepository.findBySummaryDate(date);
            if (summary != null) {
                return summary;
            }
        } catch (Exception e) {
            // 如果表不存在或查询失败，继续执行实时聚合
        }
        
        // 如果数据库中没有记录，实时从申领单数据聚合
        try {
            List<Object[]> orderStats = orderItemRepository.getDailyOrderStatistics(date);
            
            if (orderStats == null || orderStats.isEmpty()) {
                return null;
            }
            
            int totalQuantity = 0;
            BigDecimal totalAmount = BigDecimal.ZERO;
            
            for (Object[] stat : orderStats) {
                totalQuantity += ((Number) stat[2]).intValue();
                totalAmount = totalAmount.add((BigDecimal) stat[3]);
            }
            
            return new RequisitionSummary(date, totalAmount, totalQuantity);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public List<PlanItemSummary> getMenuItemSummaries(LocalDate date) {
        try {
            RequisitionSummary summary = dailyOrderSummaryRepository.findBySummaryDate(date);
            if (summary != null) {
                return menuItemSummaryRepository.findByDailyOrderSummaryId(summary.getId());
            }
        } catch (Exception e) {
            // 如果表不存在，继续执行实时聚合
        }
        
        // 如果数据库中没有记录，实时从申领单数据聚合
        try {
            List<Object[]> orderStats = orderItemRepository.getDailyOrderStatistics(date);
            List<PlanItemSummary> result = new java.util.ArrayList<>();
            
            for (Object[] stat : orderStats) {
                String dishName = (String) stat[0];
                String unit = (String) stat[1];
                Integer quantity = ((Number) stat[2]).intValue();
                BigDecimal totalPrice = (BigDecimal) stat[3];
                
                BigDecimal unitPrice = quantity > 0 ? 
                    totalPrice.divide(BigDecimal.valueOf(quantity), 2, java.math.RoundingMode.HALF_UP) : 
                    BigDecimal.ZERO;
                
                PlanItemSummary itemSummary = new PlanItemSummary();
                itemSummary.setMenuItemName(dishName);
                itemSummary.setQuantity(quantity);
                itemSummary.setUnitPrice(unitPrice);
                itemSummary.setTotalPrice(totalPrice);
                result.add(itemSummary);
            }
            
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    @Override
    public String generatePrintHtml(LocalDate date) {
        RequisitionSummary summary = getDailySummary(date);
        if (summary == null) {
            return "<h2>无指定日期的汇总数据</h2>";
        }

        List<PlanItemSummary> itemSummaries = getMenuItemSummaries(date);

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
                .append("<html>")
                .append("<head>")
                .append("<meta charset='UTF-8'>")
                .append("<title>申领汇总</title>")
                .append("<style>")
                .append("body { font-family: Arial, sans-serif; }")
                .append("table { border-collapse: collapse; width: 100%; margin-top: 20px; }")
                .append("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }")
                .append("th { background-color: #f2f2f2; }")
                .append(".text-center { text-align: center; }")
                .append(".text-right { text-align: right; }")
                .append(".header { text-align: center; margin-bottom: 20px; }")
                .append("</style>")
                .append("</head>")
                .append("<body>")
                .append("<div class='header'>")
                .append("<h1>申领汇总单</h1>")
                .append("<p>日期: ").append(date.toString()).append("</p>")
                .append("</div>")
                .append("<table>")
                .append("<thead>")
                .append("<tr>")
                .append("<th>用品名称</th>")
                .append("<th>单价</th>")
                .append("<th>数量</th>")
                .append("<th>小计</th>")
                .append("</tr>")
                .append("</thead>")
                .append("<tbody>");

        for (PlanItemSummary item : itemSummaries) {
            html.append("<tr>")
                    .append("<td>").append(item.getMenuItemName()).append("</td>")
                    .append("<td class='text-right'>￥").append(item.getUnitPrice()).append("</td>")
                    .append("<td class='text-center'>").append(item.getQuantity()).append("</td>")
                    .append("<td class='text-right'>￥").append(item.getTotalPrice()).append("</td>")
                    .append("</tr>");
        }

        html.append("</tbody>")
                .append("<tfoot>")
                .append("<tr>")
                .append("<th colspan='2'>总计</th>")
                .append("<th class='text-center'>").append(summary.getTotalQuantity()).append("</th>")
                .append("<th class='text-right'>￥").append(summary.getTotalAmount()).append("</th>")
                .append("</tr>")
                .append("</tfoot>")
                .append("</table>")
                .append("</body>")
                .append("</html>");

        return html.toString();
    }
}
