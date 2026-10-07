package com.enterprise.supply.service;

import com.enterprise.supply.entity.Requisition;
import com.enterprise.supply.entity.RequisitionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface RequisitionService {
    List<Map<String, Object>> getTodayMenuDTO();

    /**
     * 取指定日期的「已发布」计划，返回的字段结构与 {@link #getTodayMenuDTO()} **完全一致**。
     *
     * 抽出来是为了消除两套 DTO：以前「申领页」有两个数据来源，
     * `/api/dining/menu/today` 返回扁平结构、`/api/menu/list` 返回计划实体，
     * 前端必须写一段转换代码去兼容，既冗余又容易出错。
     * 现在两个来源共用这一份构造逻辑，前端不需要再转换。
     */
    List<Map<String, Object>> getPublishedPlanItems(String date);

    Requisition createOrder(CreateRequisitionRequest request, String employeeId);
    List<Requisition> getMyOrders(String employeeId, RequisitionStatus status);
    Requisition getOrderDetail(Long orderId);
    Requisition cancelOrder(Long orderId, String employeeId);
    Requisition updateOrderStatus(Long orderId, RequisitionStatus newStatus);
    void setCutoffTime(LocalDateTime cutoffTime);

    /**
     * 获取目标申领日期（当天或次日）。
     *
     * 抽到接口里，是为了让「页面显示的目标日期」与「提交时的日期校验」共用同一套逻辑。
     * 原来 Controller 里另写了一份硬编码判断（固定 11:30），两处规则一旦不一致，
     * 就会出现「页面让按明天建计划、提交却按今天校验」从而导致申领失败的问题。
     */
    LocalDate getTargetOrderDate();
}
