package com.enterprise.supply.DTO;

import java.math.BigDecimal;

// RequisitionItemDTO.java
    public class RequisitionItemDTO {
        private String dishName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String unit;


        // getters and setters
        public String getDishName() {
            return dishName;
        }

    public void setDishName(String dishName) {
        this.dishName = dishName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getUnit() {  // 添加getUnit方法
        return unit;
    }

    public void setUnit(String unit) {  // 添加setUnit方法
        this.unit = unit;
    }
}
