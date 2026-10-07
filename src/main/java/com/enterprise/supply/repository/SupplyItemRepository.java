package com.enterprise.supply.repository;

import com.enterprise.supply.entity.SupplyItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplyItemRepository extends JpaRepository<SupplyItem, Long> {

    List<SupplyItem> findByCategory(String category);

    List<SupplyItem> findByNameContainingIgnoreCase(String name);

    List<SupplyItem> findByCategoryAndNameContainingIgnoreCase(String category, String name);

    // 按状态查询
    List<SupplyItem> findByStatus(Integer status);

    List<SupplyItem> findByStatusAndCategory(Integer status, String category);

    List<SupplyItem> findByStatusAndNameContainingIgnoreCase(Integer status, String name);

    List<SupplyItem> findByStatusAndCategoryAndNameContainingIgnoreCase(Integer status, String category, String name);

    // 分页查询方法
    Page<SupplyItem> findAll(Pageable pageable);

    Page<SupplyItem> findByCategory(String category, Pageable pageable);

    Page<SupplyItem> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<SupplyItem> findByCategoryAndNameContainingIgnoreCase(String category, String name, Pageable pageable);

    // 分页按状态查询方法
    Page<SupplyItem> findByStatus(Integer status, Pageable pageable);

    Page<SupplyItem> findByStatusAndCategory(Integer status, String category, Pageable pageable);

    Page<SupplyItem> findByStatusAndNameContainingIgnoreCase(Integer status, String name, Pageable pageable);

    Page<SupplyItem> findByStatusAndCategoryAndNameContainingIgnoreCase(Integer status, String category, String name, Pageable pageable);
}