// src/main/java/com/enterprise/dining/repository/RequisitionSummaryRepository.java
package com.enterprise.supply.repository;

import com.enterprise.supply.entity.RequisitionSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface RequisitionSummaryRepository extends JpaRepository<RequisitionSummary, Long> {
    RequisitionSummary findBySummaryDate(LocalDate date);
}

