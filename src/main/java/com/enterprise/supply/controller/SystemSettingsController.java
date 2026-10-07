package com.enterprise.supply.controller;

import com.enterprise.supply.common.Result;
import com.enterprise.supply.entity.User;
import com.enterprise.supply.service.SystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * 系统设置控制器
 */
@RestController
@RequestMapping("/api/settings")
public class SystemSettingsController {
    
    @Autowired
    private SystemSettingsService settingsService;
    
    /**
     * 检查权限（MANAGER或ADMIN）
     */
    private boolean checkManagerPermission(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return false;
        }
        String role = currentUser.getRole();
        if (role == null) {
            return false;
        }
        // 忽略大小写比较，确保ADMIN和MANAGER都能访问
        role = role.toUpperCase().trim();
        return "MANAGER".equals(role) || "ADMIN".equals(role);
    }
    
    /**
     * 获取系统配置（所有配置）
     */
    @GetMapping("/all")
    public Result<Map<String, String>> getAllSettings() {
        try {
            Map<String, String> settings = settingsService.getAllSettings();
            // 如果没有配置，初始化默认配置
            if (settings.isEmpty()) {
                settingsService.initDefaultSettings();
                settings = settingsService.getAllSettings();
            }
            return Result.success(settings);
        } catch (Exception e) {
            return Result.error("获取系统配置失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取单个配置值
     */
    @GetMapping("/{key}")
    public Result<String> getConfigValue(@PathVariable String key) {
        try {
            String value = settingsService.getConfigValue(key);
            if (value == null) {
                // 如果配置不存在，初始化默认配置
                settingsService.initDefaultSettings();
                value = settingsService.getConfigValue(key);
            }
            return Result.success(value);
        } catch (Exception e) {
            return Result.error("获取配置失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新系统配置（MANAGER或ADMIN权限）
     */
    @PutMapping("/update")
    public Result<String> updateSettings(@RequestBody Map<String, String> settings, HttpSession session) {
        if (!checkManagerPermission(session)) {
            User currentUser = (User) session.getAttribute("currentUser");
            String roleInfo = currentUser != null && currentUser.getRole() != null 
                ? "当前角色: " + currentUser.getRole() 
                : "未登录或Session失效";
            return Result.error("权限不足，需要MANAGER或ADMIN权限。" + roleInfo);
        }
        
        try {
            settingsService.updateSettings(settings);
            return Result.success("配置更新成功");
        } catch (Exception e) {
            return Result.error("更新配置失败: " + e.getMessage());
        }
    }
}

