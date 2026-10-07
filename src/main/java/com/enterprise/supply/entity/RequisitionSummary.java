package com.enterprise.supply.entity;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "requisition_summaries")
public class RequisitionSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "summary_date")
    private LocalDate summaryDate;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "total_quantity")
    private Integer totalQuantity;

    @Column(name = "generated_at")
    private java.time.LocalDateTime generatedAt;

    // Constructors
    public RequisitionSummary() {}

    public RequisitionSummary(LocalDate summaryDate, BigDecimal totalAmount, Integer totalQuantity) {
        this.summaryDate = summaryDate;
        this.totalAmount = totalAmount;
        this.totalQuantity = totalQuantity;
        this.generatedAt = java.time.LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getSummaryDate() {
        return summaryDate;
    }

    public void setSummaryDate(LocalDate summaryDate) {
        this.summaryDate = summaryDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public java.time.LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(java.time.LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
