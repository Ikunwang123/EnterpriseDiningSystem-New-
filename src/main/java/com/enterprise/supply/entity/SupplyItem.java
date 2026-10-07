package com.enterprise.supply.entity;

import lombok.Data;
import javax.persistence.*;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "t_supply_item")
public class SupplyItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    private String category;
    
    private BigDecimal price;
    
    private String unit = "份";
    
    @Column(name = "image_url")
    private String imageUrl;
    
    private String description;
    
    private Integer status = 1; // 1: 正常, 0: 已删除
}