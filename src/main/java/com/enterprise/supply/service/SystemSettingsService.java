package com.enterprise.supply.service;

import com.enterprise.supply.entity.SystemSettings;
import com.enterprise.supply.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统设置服务类
 */
@Service
public class SystemSettingsService {
    
    @Autowired
    private SystemSettingsRepository settingsRepository;
    
    /**
     * 获取系统配置（所有配置）
     */
    public Map<String, String> getAllSettings() {
        List<SystemSettings> settings = settingsRepository.findAll();
        Map<String, String> result = new HashMap<>();
        for (SystemSettings setting : settings) {
            result.put(setting.getConfigKey(), setting.getConfigValue());
        }
        return result;
    }
    
    /**
     * 获取单个配置值
     */
    public String getConfigValue(String configKey) {
        return settingsRepository.findByConfigKey(configKey)
                .map(SystemSettings::getConfigValue)
                .orElse(null);
    }
    
    /**
     * 更新系统配置
     */
    public void updateSettings(Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            SystemSettings setting = settingsRepository.findByConfigKey(entry.getKey())
                    .orElse(new SystemSettings());
            
            setting.setConfigKey(entry.getKey());
            setting.setConfigValue(entry.getValue());
            setting.setUpdateTime(new Date());
            
            // 设置默认描述
            if (setting.getDescription() == null) {
                switch (entry.getKey()) {
                    case "ORDER_CUTOFF_TIME":
                        setting.setDescription("申领截止时间");
                        break;
                    case "SERVE_START_TIME":
                        setting.setDescription("领用开始时间");
                        break;
                    default:
                        setting.setDescription(entry.getKey());
                }
            }
            
            settingsRepository.save(setting);
        }
    }
    
    /**
     * 初始化默认配置
     */
    public void initDefaultSettings() {
        // 检查是否已有配置
        if (settingsRepository.count() > 0) {
            return;
        }
        
        SystemSettings cutoffTime = new SystemSettings();
        cutoffTime.setConfigKey("ORDER_CUTOFF_TIME");
        cutoffTime.setConfigValue("09:00");
        cutoffTime.setDescription("申领截止时间");
        cutoffTime.setUpdateTime(new Date());
        settingsRepository.save(cutoffTime);
        
        SystemSettings serveTime = new SystemSettings();
        serveTime.setConfigKey("SERVE_START_TIME");
        serveTime.setConfigValue("11:30");
        serveTime.setDescription("领用开始时间");
        serveTime.setUpdateTime(new Date());
        settingsRepository.save(serveTime);

        // 申领时间限制开关：false = 不校验时间（便于测试），true = 恢复原有时间规则
        SystemSettings enforceTime = new SystemSettings();
        enforceTime.setConfigKey("ENFORCE_ORDER_TIME");
        enforceTime.setConfigValue("false");
        enforceTime.setDescription("是否启用申领时间限制：true=启用；false/空=不限制（便于测试）");
        enforceTime.setUpdateTime(new Date());
        settingsRepository.save(enforceTime);
    }
}

