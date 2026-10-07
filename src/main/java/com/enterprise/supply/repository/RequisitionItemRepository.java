package com.enterprise.supply.repository;

import com.enterprise.supply.entity.RequisitionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequisitionItemRepository extends JpaRepository<RequisitionItem, Long> {

        // 根据申领单ID查询明细（“我的申领”和报表必需）
        List<RequisitionItem> findByOrderId(Long orderId);

        // 根据申领单ID删除申领明细
        void deleteByOrderId(Long orderId);

        // 月度领用统计查询
        // 按「领用计划日期」(o.date) 统计，而不是创建日期：
        // 员工今天可以为明天的计划申领，按创建日期统计会让这笔申领落到错误的月份/日期。
        // COALESCE 兼容早期没有写入 o.date 的历史数据。
        @Query(value = "SELECT oi.item_name AS dishName, '个' AS unit, SUM(oi.quantity) AS totalQuantity, AVG(oi.price) AS unitPrice, SUM(oi.quantity * oi.price) AS totalAmount "
                        +
                        "FROM `t_requisition_item` oi JOIN `t_requisition` o ON oi.requisition_id = o.id " +
                        "WHERE YEAR(COALESCE(o.date, DATE(o.create_time))) = :year " +
                        "AND MONTH(COALESCE(o.date, DATE(o.create_time))) = :month " +
                        "GROUP BY oi.item_name " +
                        "ORDER BY SUM(oi.quantity) DESC", nativeQuery = true)
        List<Object[]> findMonthlySalesReport(@Param("year") int year,
                        @Param("month") int month);

        // 每日申领统计查询（仓库按计划日期备货）
        // 关键修正：原实现用 DATE(o.create_time) = :date，即按「申领单创建日期」聚合。
        // 但员工常常是今天申领、领用日期是明天，于是：
        //   · 今天申领明天的用品 → 明天的汇总查不到任何数据（仓库看到的汇总一直是空的）
        //   · 这笔申领反而出现在"今天"的汇总里，与实际备货日期不符
        // 现改为按「领用计划日期」o.date 聚合，并保留对历史数据的兼容。
        @Query(value = "SELECT oi.item_name, COALESCE(oi.unit, '份') as unit, SUM(oi.quantity) as total_quantity, SUM(oi.sub_total) as total_price "
                        +
                        "FROM t_requisition_item oi JOIN t_requisition o ON oi.requisition_id = o.id " +
                        "WHERE COALESCE(o.date, DATE(o.create_time)) = :date " +
                        "GROUP BY oi.item_name, oi.unit", nativeQuery = true)
        List<Object[]> getDailyOrderStatistics(@Param("date") java.time.LocalDate date);
}