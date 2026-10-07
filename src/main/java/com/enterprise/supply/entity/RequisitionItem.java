package com.enterprise.supply.entity;

import lombok.Getter;

import javax.persistence.*;
import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "t_requisition_item")
public class RequisitionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 关键修复：使用正确的关联方式（推荐方式）
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id", insertable = false, updatable = false)
    private Requisition order;

    // 同时保留 orderId 字段用于兼容和手动设置
    // 注意：由于@ManyToOne的@JoinColumn设置了insertable=false，我们需要手动设置orderId
    @Column(name = "requisition_id", nullable = false)
    private Long orderId;

    // 提交申领时存 RecipeId（对应数据库字段 supply_item_id）
    @Column(name = "item_id")
    private Long menuItemId;

    // 兼容旧字段：某些旧代码可能使用 menuItemName
    // 注意：item_name字段只能有一个持久化映射，所以menuItemName作为只读
    @Transient
    private String menuItemName;

    // 持久化字段：用品名称
    @Column(name = "item_name")
    private String dishName;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "sub_total")
    private BigDecimal subtotal;

    // 单位字段（如"份"、"两"、"个"等）
    @Column(name = "unit", length = 20)
    private String unit;

    // 构造函数
    public RequisitionItem() {
    }

    public RequisitionItem(Long menuItemId, String menuItemName, BigDecimal price, Integer quantity) {
        this.menuItemId = menuItemId;
        this.menuItemName = menuItemName;
        this.price = price;
        this.quantity = quantity;
        this.subtotal = price.multiply(new BigDecimal(quantity));
    }

    // 兼容 RequisitionReportService 中的 getUnitPrice()
    public BigDecimal getUnitPrice() {
        return price;
    }

    // ========== 显式Setter方法 ==========

    public void setId(Long id) {
        this.id = id;
    }

    public void setOrder(Requisition order) {
        this.order = order;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public void setMenuItemName(String menuItemName) {
        this.menuItemName = menuItemName;
        // 如果dishName还没有设置，也设置dishName
        if (this.dishName == null || this.dishName.isEmpty()) {
            this.dishName = menuItemName;
        }
    }

    public void setDishName(String dishName) {
        this.dishName = dishName;
        this.menuItemName = dishName; // 保持兼容性
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    // ========== JPA 生命周期回调 ==========

    /**
     * 在持久化之前确保必填字段有值
     * 这是最后的防线，确保 dishName 永远不会为 null
     */
    @PrePersist
    @PreUpdate
    protected void ensureRequiredFields() {
        // 确保 item_name 不为空
        if (this.dishName == null || this.dishName.isEmpty()) {
            if (this.menuItemName != null && !this.menuItemName.isEmpty()) {
                this.dishName = this.menuItemName;
                System.out.println("[@PrePersist] dishName为空，从menuItemName设置: " + this.dishName);
            } else {
                this.dishName = "未知用品"; // 兜底默认值
                System.err.println("[@PrePersist] 警告：dishName和menuItemName都为空，使用默认值");
            }
        }

        // 同步 menuItemName
        if (this.menuItemName == null || this.menuItemName.isEmpty()) {
            this.menuItemName = this.dishName;
        }
    }

    // 兼容旧代码的menuItemName getter
    public String getMenuItemName() {
        return menuItemName != null ? menuItemName : dishName;
    }
}
