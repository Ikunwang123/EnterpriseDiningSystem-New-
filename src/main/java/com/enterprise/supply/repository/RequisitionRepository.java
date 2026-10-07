package com.enterprise.supply.repository;

import com.enterprise.supply.entity.Requisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequisitionRepository extends JpaRepository<Requisition, Long> {
    List<Requisition> findByUserIdOrderByCreateTimeDesc(Long userId);

    List<Requisition> findByUserIdAndStatus(Long userId, Integer status);

    // 查询今日申领单 - 使用date字段或createTime字段
    @Query("SELECT o FROM Requisition o WHERE (o.date = CURRENT_DATE OR DATE(o.createTime) = CURRENT_DATE) AND o.status != 4 ORDER BY o.createTime DESC")
    List<Requisition> findTodayOrders();

    // 查询指定日期的申领单 - 优先使用date字段，如果没有则使用createTime
    @Query("SELECT o FROM Requisition o WHERE (o.date = :date OR DATE(o.createTime) = :date) AND o.status != 4 ORDER BY o.createTime DESC")
    List<Requisition> findOrdersByDate(@Param("date") java.time.LocalDate date);

    @Query("SELECT COUNT(o) FROM Requisition o WHERE DATE(o.createTime) = CURRENT_DATE")
    Long countTodayOrders();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Requisition o WHERE DATE(o.createTime) = CURRENT_DATE")
    java.math.BigDecimal sumTodayRevenue();

    @Query("SELECT COUNT(o) FROM Requisition o WHERE o.status IN (0, 1)")
    Long countPendingOrders();

    @Query("SELECT COUNT(DISTINCT o.userId) FROM Requisition o WHERE DATE(o.createTime) = CURRENT_DATE")
    Long countActiveUsersToday();

    @Query("SELECT o FROM Requisition o ORDER BY o.createTime DESC")
    List<Requisition> findRecentOrders(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT o FROM Requisition o WHERE o.userId = :employeeId " +
            "AND YEAR(o.createTime) = :year AND MONTH(o.createTime) = :month")
    List<Requisition> findEmployeeMonthlyOrders(@Param("employeeId") Long employeeId,
            @Param("year") int year,
            @Param("month") int month);

    // 检查用户今日是否已提交申领 - 使用date字段或createTime字段
    @Query("SELECT COUNT(o) > 0 FROM Requisition o WHERE o.userId = :userId AND (o.date = :date OR DATE(o.createTime) = :date) AND o.status != 4")
    boolean existsByUserIdAndDate(@Param("userId") Long userId, @Param("date") java.time.LocalDate date);

    // 检查员工今日是否已提交申领 - 使用date字段或createTime字段
    @Query("SELECT COUNT(o) > 0 FROM Requisition o WHERE o.employeeId = :employeeId AND (o.date = :date OR DATE(o.createTime) = :date) AND o.status != 4")
    boolean existsByEmployeeIdAndDate(@Param("employeeId") String employeeId, @Param("date") java.time.LocalDate date);

    List<Requisition> findByEmployeeId(String employeeId, org.springframework.data.domain.Sort sort);

    List<Requisition> findByEmployeeIdAndStatus(String employeeId, Integer status, org.springframework.data.domain.Sort sort);

    List<Requisition> findByStatus(Integer status);

    // 配送单打印：查询多个状态的申领单
    List<Requisition> findByStatusIn(List<Integer> statuses);
}
