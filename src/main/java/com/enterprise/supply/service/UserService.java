package com.enterprise.supply.service;

import com.enterprise.supply.entity.User;
import com.enterprise.supply.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户管理服务类
 */
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * 添加单个用户
     * 自动查找并重用已删除的ID
     */
    @Transactional
    public User addUser(User user) {
        // 检查用户名是否已存在
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 查找最小的可用ID（重用已删除的ID）
        Long availableId = findAvailableId();
        
        if (availableId != null) {
            // 使用JdbcTemplate手动插入，指定ID
            String sql = "INSERT INTO sys_user (id, username, password, real_name, role, dept_name, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                availableId,
                user.getUsername(),
                user.getPassword(),
                user.getRealName(),
                user.getRole(),
                user.getDeptName(),
                user.getLocation(),
                user.getPhone()
            );
            // 返回保存的用户对象
            User savedUser = userRepository.findById(availableId).orElse(user);
            // 重置自增ID，确保下次添加时继续使用可用ID
            resetAutoIncrement();
            return savedUser;
        } else {
            // 如果没有可用ID，使用JPA自动生成
            User savedUser = userRepository.save(user);
            // 重置自增ID，确保下次添加时继续使用可用ID
            resetAutoIncrement();
            return savedUser;
        }
    }
    
    /**
     * 查找最小的可用ID（已删除的ID或下一个自增ID）
     */
    private Long findAvailableId() {
        List<Long> existingIds = userRepository.findAllIds();
        if (existingIds.isEmpty()) {
            return 1L; // 如果没有用户，从1开始
        }
        
        // 查找最小的缺失ID
        for (long i = 1; i <= existingIds.get(existingIds.size() - 1) + 1; i++) {
            if (!existingIds.contains(i)) {
                return i;
            }
        }
        
        // 如果没有缺失的ID，返回null，让数据库自动生成
        return null;
    }
    
    /**
     * 重置自增ID，使其指向当前最大ID+1
     */
    private void resetAutoIncrement() {
        try {
            // 获取当前最大ID
            Long maxId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id), 0) FROM sys_user", Long.class);
            // 重置自增ID为最大ID+1
            jdbcTemplate.execute("ALTER TABLE sys_user AUTO_INCREMENT = " + (maxId + 1));
        } catch (Exception e) {
            // 忽略错误，不影响主流程
            System.err.println("重置自增ID失败: " + e.getMessage());
        }
    }
    
    /**
     * 分页查询用户列表（支持搜索）
     */
    public Page<User> getUserList(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            // 搜索用户名、真实姓名、部门
            List<User> users = userRepository.findByUsernameContainingOrRealNameContainingOrDeptNameContaining(
                keyword, keyword, keyword);
            // 手动分页
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), users.size());
            List<User> pageContent = start < users.size() ? users.subList(start, end) : new java.util.ArrayList<>();
            return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, users.size());
        }
        
        return userRepository.findAll(pageable);
    }
    
    /**
     * 根据ID获取用户
     */
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    /**
     * 更新用户信息
     */
    public User updateUser(User user) {
        User existingUser = userRepository.findById(user.getId()).orElse(null);
        if (existingUser == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 只更新允许修改的字段，保留原有字段的值
        // 用户名不允许修改（保持原有值）
        // existingUser.setUsername(user.getUsername()); // 不修改用户名
        
        // 如果提供了密码，则更新密码
        if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
            existingUser.setPassword(user.getPassword());
        }
        
        // 更新其他字段
        if (user.getRealName() != null) {
            existingUser.setRealName(user.getRealName());
        }
        if (user.getRole() != null) {
            existingUser.setRole(user.getRole());
        }
        if (user.getDeptName() != null) {
            existingUser.setDeptName(user.getDeptName());
        }
        if (user.getLocation() != null) {
            existingUser.setLocation(user.getLocation());
        }
        if (user.getPhone() != null) {
            existingUser.setPhone(user.getPhone());
        }
        
        return userRepository.save(existingUser);
    }
    
    /**
     * 删除用户
     * 删除后重置自增ID，以便重用已删除的ID
     */
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("用户不存在");
        }
        userRepository.deleteById(id);
        // 删除后重置自增ID，确保下次添加时能重用已删除的ID
        resetAutoIncrement();
    }
    
    /**
     * 批量保存用户
     * 自动为每个用户分配可用的ID
     */
    @Transactional
    public void batchSaveUsers(List<User> users) {
        String sql = "INSERT INTO sys_user (id, username, password, real_name, role, dept_name, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        for (User user : users) {
            // 查找可用的ID
            Long availableId = findAvailableId();
            if (availableId != null) {
                // 使用JdbcTemplate手动插入，指定ID
                jdbcTemplate.update(sql,
                    availableId,
                    user.getUsername(),
                    user.getPassword(),
                    user.getRealName(),
                    user.getRole(),
                    user.getDeptName(),
                    user.getLocation(),
                    user.getPhone()
                );
            } else {
                // 如果没有可用ID，使用JPA自动生成
                userRepository.save(user);
            }
        }
        
        // 批量插入后，重置自增ID
        resetAutoIncrement();
    }
    
    /**
     * 获取所有用户（用于导出）
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}

