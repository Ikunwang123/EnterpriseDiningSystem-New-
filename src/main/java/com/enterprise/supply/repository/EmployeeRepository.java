// src/main/java/com/enterprise/dining/repository/EmployeeRepository.java
package com.enterprise.supply.repository;

import com.enterprise.supply.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    // 使用继承的 findById 方法（返回 Optional<Employee>）


    // 其他自定义查询方法
    Employee findByName(String name);

    // 添加按ID查询的明确方法（如果需要）
    Optional<Employee> findById(String id);
}
