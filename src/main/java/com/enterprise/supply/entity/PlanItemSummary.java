package com.enterprise.supply.entity;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "plan_item_summaries")
public class PlanItemSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "daily_summary_id")
    private RequisitionSummary dailyOrderSummary;

    @Column(name = "plan_item_id")
    private Long menuItemId;

    @Column(name = "plan_item_name")
    private String menuItemName;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "total_price")
    private BigDecimal totalPrice;

    // Constructors
    public PlanItemSummary() {}

    public PlanItemSummary(RequisitionSummary dailyOrderSummary, Long menuItemId, String menuItemName,
                           Integer quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
        this.dailyOrderSummary = dailyOrderSummary;
        this.menuItemId = menuItemId;
        this.menuItemName = menuItemName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RequisitionSummary getDailyOrderSummary() {
        return dailyOrderSummary;
    }

    public void setDailyOrderSummary(RequisitionSummary dailyOrderSummary) {
        this.dailyOrderSummary = dailyOrderSummary;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getMenuItemName() {
        return menuItemName;
    }

    public void setMenuItemName(String menuItemName) {
        this.menuItemName = menuItemName;
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

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }
}
