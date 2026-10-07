package com.enterprise.supply.service;

import com.enterprise.supply.entity.AvailabilityPlan;
import com.enterprise.supply.entity.SupplyItem;
import com.enterprise.supply.repository.AvailabilityPlanRepository;
import com.enterprise.supply.repository.SupplyItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AvailabilityPlanService {
    
    @Autowired
    private AvailabilityPlanRepository menuRepository;
    
    @Autowired
    private SupplyItemRepository recipeRepository;
    
    public List<AvailabilityPlan> getMenuByDate(String date) {
        return menuRepository.findByDate(date);
    }
    
    public List<AvailabilityPlan> getPublishedMenuByDate(String date) {
        return menuRepository.findByDateAndStatus(date, 1);
    }

    /**
     * 所有「已发布」计划的日期，按日期升序去重。
     * 用于：申领页显示可切换的日期、以及自动定位到最近一个可申领的计划。
     */
    public List<String> getPublishedPlanDates() {
        return menuRepository.findByStatus(1).stream()
                .map(AvailabilityPlan::getDate)
                .filter(d -> d != null && !d.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * 找出最合适的「当前可申领计划日期」：
     *   1) 优先取今天已发布的计划；
     *   2) 否则取不早于今天的、最早的已发布计划（即最近将来的一场）；
     *   3) 都没有则返回 null。
     * 这样管理员只发布了「某一天」的计划时，员工页也能自动定位过去，而不是只看今天。
     */
    public String findActivePublishedDate(java.time.LocalDate today) {
        List<String> dates = getPublishedPlanDates();
        if (dates.isEmpty()) {
            return null;
        }
        String todayStr = today.toString();
        if (dates.contains(todayStr)) {
            return todayStr;
        }
        for (String d : dates) {
            if (d.compareTo(todayStr) > 0) {
                return d;
            }
        }
        return null;
    }
    
    public AvailabilityPlan saveMenu(AvailabilityPlan menu) {
        menu.setUpdateTime(new Date());
        if (menu.getCreateTime() == null) {
            menu.setCreateTime(new Date());
        }
        return menuRepository.save(menu);
    }
    
    public void deleteMenu(Long id) {
        menuRepository.deleteById(id);
    }
    
    public List<AvailabilityPlan> getAllMenus() {
        return menuRepository.findAll();
    }
    
    public List<AvailabilityPlan> getAllMenusOrderByDateDesc() {
        return menuRepository.findAllByOrderByDateDesc();
    }
    
    public AvailabilityPlan getMenuById(Long id) {
        return menuRepository.findById(id).orElse(null);
    }
    
    /**
     * Create menu items from recipes
     */
    public void createMenuFromRecipes(List<Long> recipeIds, String date) {
        for (Long recipeId : recipeIds) {
            SupplyItem recipe = recipeRepository.findById(recipeId).orElse(null);
            // 验证用品是否存在且未被删除
            if (recipe != null && recipe.getStatus() != null && recipe.getStatus() == 1) {
                AvailabilityPlan menu = new AvailabilityPlan();
                menu.setRecipeId(recipeId);
                menu.setDate(date);
                menu.setPrice(recipe.getPrice());
                menu.setStatus(0); // 默认未发布
                menu.setStock(999); // 默认库存
                saveMenu(menu);
            }
        }
    }
    
    /**
     * Publish menu
     */
    public void publishMenu(String date) {
        List<AvailabilityPlan> menus = getMenuByDate(date);
        for (AvailabilityPlan menu : menus) {
            menu.setStatus(1);
            saveMenu(menu);
        }
    }
    
    /**
     * Unpublish menu
     */
    public void unpublishMenu(String date) {
        List<AvailabilityPlan> menus = getMenuByDate(date);
        for (AvailabilityPlan menu : menus) {
            menu.setStatus(0);
            saveMenu(menu);
        }
    }
    
    /**
     * Update menu price
     */
    public boolean updateMenuPrice(Long menuId, BigDecimal newPrice) {
        AvailabilityPlan menu = getMenuById(menuId);
        if (menu != null) {
            menu.setPrice(newPrice);
            saveMenu(menu);
            return true;
        }
        return false;
    }
    
    /**
     * Get history menu dates
     */
    public List<String> getHistoryMenuDates() {
        List<AvailabilityPlan> allMenus = menuRepository.findAll();
        return allMenus.stream()
                .map(AvailabilityPlan::getDate)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    
    /**
     * Reuse history menu
     */
    public boolean reuseHistoryMenu(String sourceDate, String targetDate) {
        // Check if target date menu already exists
        List<AvailabilityPlan> existingMenus = getMenuByDate(targetDate);
        if (!existingMenus.isEmpty()) {
            return false;
        }
        
        // Get source date menu
        List<AvailabilityPlan> sourceMenus = getMenuByDate(sourceDate);
        if (sourceMenus.isEmpty()) {
            return false;
        }
        
        // Copy menu to target date
        for (AvailabilityPlan sourceMenu : sourceMenus) {
            AvailabilityPlan newMenu = new AvailabilityPlan();
            newMenu.setRecipeId(sourceMenu.getRecipeId());
            newMenu.setDate(targetDate);
            newMenu.setPrice(sourceMenu.getPrice());
            newMenu.setStatus(0); // Default unpublished
            newMenu.setStock(999); // Default stock
            saveMenu(newMenu);
        }
        
        return true;
    }
    
    /**
     * Delete menu by date
     */
    @Transactional
    public void deleteMenuByDate(String date) {
        menuRepository.deleteByDate(date);
    }
    
    /**
     * Update menu items for a specific date
     */
    @Transactional
    public void updateMenuForDate(String date, List<Long> recipeIds) {
        // First delete existing menu for the date
        deleteMenuByDate(date);
        
        // Then create new menu items
        createMenuFromRecipes(recipeIds, date);
    }
}