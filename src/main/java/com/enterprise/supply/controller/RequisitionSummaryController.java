// src/main/java/com/enterprise/dining/controller/RequisitionSummaryController.java
package com.enterprise.supply.controller;

import com.enterprise.supply.entity.RequisitionSummary;
import com.enterprise.supply.entity.PlanItemSummary;
import com.enterprise.supply.service.SummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/summaries")
@CrossOrigin
public class RequisitionSummaryController {

    @Autowired
    private SummaryService summaryService;

    /**
     * 生成指定日期的汇总领用单
     */
    @PostMapping("/generate")
    public Map<String, Object> generateDailySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        RequisitionSummary summary = summaryService.generateDailySummary(date);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", summary);
        return result;
    }

    /**
     * 查询指定日期的汇总领用单
     * 返回格式适配前端期望：{ totalQuantity, totalAmount, items }
     */
    @GetMapping("/{date}")
    public Map<String, Object> getDailySummary(
            @PathVariable String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            RequisitionSummary summary = summaryService.getDailySummary(localDate);
            
            if (summary == null) {
                // 不要 return null：Spring 会把 null 序列化成"空响应体"（HTTP 200 但 body 为空），
                // 前端 response.json() 解析空字符串会抛异常，从而把"该日期没有汇总"
                // 误报成"无法从数据库获取数据"。这里返回一个语义明确的空结果。
                Map<String, Object> empty = new HashMap<>();
                empty.put("totalQuantity", 0);
                empty.put("totalAmount", 0.0);
                empty.put("items", java.util.Collections.emptyList());
                empty.put("empty", true);
                return empty;
            }

            // 转换为前端期望的格式
            Map<String, Object> result = new HashMap<>();
            result.put("totalQuantity", summary.getTotalQuantity() != null ? summary.getTotalQuantity() : 0);
            result.put("totalAmount", summary.getTotalAmount() != null ? summary.getTotalAmount().doubleValue() : 0.0);
            
            // 获取items
            List<PlanItemSummary> items = summaryService.getMenuItemSummaries(localDate);
            List<Map<String, Object>> itemList = items.stream().map(item -> {
                Map<String, Object> itemMap = new HashMap<>();
                // 前端 SummarySheetModule 读取的是 item.planItemName，
                // 这里额外提供该键，避免明细名称显示为 undefined。
                itemMap.put("planItemName", item.getMenuItemName());
                itemMap.put("menuItemName", item.getMenuItemName());
                itemMap.put("unitPrice", item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0);
                itemMap.put("quantity", item.getQuantity() != null ? item.getQuantity() : 0);
                itemMap.put("totalPrice", item.getTotalPrice() != null ? item.getTotalPrice().doubleValue() : 0.0);
                return itemMap;
            }).collect(java.util.stream.Collectors.toList());
            
            result.put("items", itemList);
            return result;
        } catch (Exception e) {
            // 同上：异常时也返回结构化空结果，避免空响应体让前端误判为连接失败。
            // 同时打印日志，便于排查真实故障（原实现是静默 return null）。
            System.err.println("[汇总查询失败] date=" + date + " : " + e.getMessage());
            Map<String, Object> err = new HashMap<>();
            err.put("totalQuantity", 0);
            err.put("totalAmount", 0.0);
            err.put("items", java.util.Collections.emptyList());
            err.put("empty", true);
            return err;
        }
    }

    /**
     * 获取指定日期的用品汇总详情
     */
    @GetMapping("/{date}/items")
    public List<Map<String, Object>> getMenuItemSummaries(
            @PathVariable String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            List<PlanItemSummary> summaries = summaryService.getMenuItemSummaries(localDate);
            
            return summaries.stream().map(item -> {
                Map<String, Object> itemMap = new HashMap<>();
                // 同 /{date}：同时提供 planItemName 与 menuItemName，兼容前端字段名
                itemMap.put("planItemName", item.getMenuItemName());
                itemMap.put("menuItemName", item.getMenuItemName());
                itemMap.put("unitPrice", item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0);
                itemMap.put("quantity", item.getQuantity() != null ? item.getQuantity() : 0);
                itemMap.put("totalPrice", item.getTotalPrice() != null ? item.getTotalPrice().doubleValue() : 0.0);
                return itemMap;
            }).collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    /**
     * 生成并下载打印内容（HTML格式）
     */
    @GetMapping(value = "/{date}/print", produces = MediaType.TEXT_HTML_VALUE)
    public String printDailySummary(
            @PathVariable String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            return summaryService.generatePrintHtml(localDate);
        } catch (Exception e) {
            return "<h2>获取打印内容失败: " + e.getMessage() + "</h2>";
        }
    }
}
