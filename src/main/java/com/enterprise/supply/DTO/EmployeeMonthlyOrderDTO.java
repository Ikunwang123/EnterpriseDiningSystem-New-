package com.enterprise.supply.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class EmployeeMonthlyOrderDTO {
    private Long orderId;
    private LocalDateTime orderTime;
    private List<RequisitionItemDTO> items;
    private BigDecimal totalAmount;

    // 新增字段：员工真实姓名、部门、电话
    private String realName;
    private String deptName;
    private String phone;

    // 原有 getters 和 setters（保持不变）
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public LocalDateTime getOrderTime() { return orderTime; }
    public void setOrderTime(LocalDateTime orderTime) { this.orderTime = orderTime; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public List<RequisitionItemDTO> getItems() { return items; }
    public void setItems(List<RequisitionItemDTO> items) { this.items = items; }

    // 新增 getters 和 setters
    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
    public String getDeptName() { return deptName; }
    public void setDeptName(String deptName) { this.deptName = deptName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}