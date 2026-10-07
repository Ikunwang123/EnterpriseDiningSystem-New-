package com.enterprise.supply.entity;

import lombok.Data;
import javax.persistence.*;
import java.util.Date;

/**
 * 系统设置实体类
 * 存储系统配置参数，如申领截止时间、领用开始时间等
 */
@Data
@Entity
@Table(name = "t_system_settings")
public class SystemSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String configKey; // 配置键，如：ORDER_CUTOFF_TIME, SERVE_START_TIME

    private String configValue; // 配置值，如：09:00, 11:30

    private String description; // 配置说明

    @Column(name = "update_time")
    private Date updateTime;

    @PreUpdate
    @PrePersist
    public void updateTime() {
        this.updateTime = new Date();
    }
}

