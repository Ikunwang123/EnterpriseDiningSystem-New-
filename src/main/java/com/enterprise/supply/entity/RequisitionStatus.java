package com.enterprise.supply.entity;

/**
 * 申领单状态。
 *
 * 精简为 3 个状态：
 *   PENDING(0)   待备货 —— 刚提交，仓库尚未处理
 *   DONE(1)      已完成 —— 已备货/已送达
 *   CANCELLED(2) 已取消
 *
 * 原来还有 PREPARING(备货中) 与 READY(待领取) 两个中间态，
 * 但界面上**没有任何入口能修改状态**（状态永远是 PENDING），
 * 留着只会让"状态怎么流转"讲不清楚，因此去掉。
 * 状态值由 ordinal() 写入数据库，改动后 init.sql 重建即可（无历史数据迁移问题）。
 */
public enum RequisitionStatus {
    PENDING,     // 待备货 (0)
    DONE,        // 已完成 (1)
    CANCELLED    // 已取消 (2)
}
