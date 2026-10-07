package com.enterprise.supply.repository;

import com.enterprise.supply.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository   <User, Long> {
    // 自动生成 SQL: select * from sys_user where username = ?
    User findByUsername(String username);
    
    // 搜索用户（用户名、真实姓名、部门）
    java.util.List<User> findByUsernameContainingOrRealNameContainingOrDeptNameContaining(
        String username, String realName, String deptName);
    
    // 查询所有已存在的ID（用于查找可用ID）
    @Query("SELECT u.id FROM User u ORDER BY u.id")
    List<Long> findAllIds();
}