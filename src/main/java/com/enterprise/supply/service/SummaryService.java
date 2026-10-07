// src/main/java/com/enterprise/dining/service/SummaryService.java
package com.enterprise.supply.service;

import com.enterprise.supply.entity.RequisitionSummary;
import com.enterprise.supply.entity.PlanItemSummary;

import java.time.LocalDate;
import java.util.List;

public interface SummaryService {
    /**
     * 生成指定日期的汇总领用单
     */
    RequisitionSummary generateDailySummary(LocalDate date);

    /**
     * 查询指定日期的汇总领用单
     */
    RequisitionSummary getDailySummary(LocalDate date);

    /**
     * 获取指定日期的用品汇总详情
     */
    List<PlanItemSummary> getMenuItemSummaries(LocalDate date);

    /**
     * 生成打印内容（HTML格式）
     */
    String generatePrintHtml(LocalDate date);
}

