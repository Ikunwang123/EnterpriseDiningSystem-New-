// src/main/java/com/example/dto/RequisitionDetailDTO.java
package com.enterprise.supply.DTO;

import java.math.BigDecimal;

public class RequisitionDetailDTO {
    private String dishName;
    private Integer quantity;
    private String unit;
    private BigDecimal price;
    private BigDecimal subtotal;

    public RequisitionDetailDTO() {
    }

    public RequisitionDetailDTO(String dishName, Integer quantity, String unit) {
        this.dishName = dishName;
        this.quantity = quantity;
        this.unit = unit;
    }

    // Getters and Setters
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
