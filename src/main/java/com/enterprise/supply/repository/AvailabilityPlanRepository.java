package com.enterprise.supply.repository;

import com.enterprise.supply.entity.AvailabilityPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvailabilityPlanRepository extends JpaRepository<AvailabilityPlan, Long> {
    List<AvailabilityPlan> findByDateAndStatus(String date, Integer status);
    List<AvailabilityPlan> findByDate(String date);
    List<AvailabilityPlan> findByStatus(Integer status);
    
    // 根据日期排序获取所有领用计划
    List<AvailabilityPlan> findAllByOrderByDateDesc();
    
    // 根据日期删除领用计划
    @Modifying
    @Query("DELETE FROM AvailabilityPlan m WHERE m.date = ?1")
    void deleteByDate(String date);
}
