package com.enterprise.supply.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Entity
@Table(name = "t_availability_plan")
public class AvailabilityPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "supply_item_id")
    private Long recipeId;
    
    @Transient
    private SupplyItem recipe;
    
    @Column(name = "plan_price")
    private BigDecimal price;
    
    @Column(name = "plan_date")
    private String date; // YYYY-MM-DD format
    
    private Integer status; // 1: Published, 0: Unpublished
    
    @Column(name = "create_time")
    private Date createTime;
    
    @Column(name = "update_time")
    private Date updateTime;
    
    // stock 字段在数据库中有但在实体类中没有，根据需要添加
    private Integer stock = 999;
}