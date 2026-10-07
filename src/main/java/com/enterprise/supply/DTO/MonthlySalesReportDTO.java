package com.enterprise.supply.DTO;

import java.math.BigDecimal;

public class MonthlySalesReportDTO {
    private String dishName;
    private String unit;
    private Integer totalQuantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;

    // 新增无参构造函数（解决JPA反序列化潜在问题）
    public MonthlySalesReportDTO() {}

    // 原有带参构造函数（保持不变）
    public MonthlySalesReportDTO(String dishName, String unit, Integer totalQuantity, BigDecimal unitPrice, BigDecimal totalAmount) {
        this.dishName = dishName;
        this.unit = unit;
        this.totalQuantity = totalQuantity;
        this.unitPrice = unitPrice;
        this.totalAmount = totalAmount;
    }

    // getter 和 setter 方法（保持不变）
    public String getDishName() { return dishName; }
    public void setDishName(String dishName) { this.dishName = dishName; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}