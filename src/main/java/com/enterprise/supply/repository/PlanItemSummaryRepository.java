// src/main/java/com/enterprise/dining/repository/PlanItemSummaryRepository.java
package com.enterprise.supply.repository;

import com.enterprise.supply.entity.PlanItemSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanItemSummaryRepository extends JpaRepository<PlanItemSummary, Long> {
    List<PlanItemSummary> findByDailyOrderSummaryId(Long dailyOrderSummaryId);

    @Modifying
    @Query("DELETE FROM PlanItemSummary m WHERE m.dailyOrderSummary.id = ?1")
    void deleteByDailyOrderSummaryId(Long dailyOrderSummaryId);
}

