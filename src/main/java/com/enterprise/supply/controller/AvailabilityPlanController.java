package com.enterprise.supply.controller;

import com.enterprise.supply.common.Result;
import com.enterprise.supply.entity.AvailabilityPlan;
import com.enterprise.supply.entity.SupplyItem;
import com.enterprise.supply.service.AvailabilityPlanService;
import com.enterprise.supply.service.SupplyItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 计划管理控制器
 * 负责成员: Member 2
 * 任务: 实现领用计划管理功能
 */
@RestController
@RequestMapping("/api/menu")
@CrossOrigin
public class AvailabilityPlanController {

    @Autowired
    private AvailabilityPlanService menuService;
    
    @Autowired
    private SupplyItemService recipeService;

    /**
     * 创建今日领用计划 (从用品目录选择用品)
     */
    @PostMapping("/create")
    public Result<String> createMenu(@RequestParam String date, @RequestBody List<Long> recipeIds) {
        try {
            // 检查是否已存在该日期的领用计划
            List<AvailabilityPlan> existingMenus = menuService.getMenuByDate(date);
            if (!existingMenus.isEmpty()) {
                return Result.error("该日期的领用计划已存在，请先删除或更新现有领用计划");
            }
            
            // 验证所有用品是否有效且未被删除
            for (Long recipeId : recipeIds) {
                SupplyItem recipe = recipeService.getRecipeById(recipeId);
                if (recipe == null) {
                    return Result.error("用品不存在: " + recipeId);
                }
                if (recipe.getStatus() != null && recipe.getStatus() == 0) {
                    return Result.error("用品已被删除，无法添加到领用计划: " + recipeId);
                }
            }
            
            // 为每个选中的用品创建计划项
            menuService.createMenuFromRecipes(recipeIds, date);
            
            return Result.success("领用计划创建成功");
        } catch (Exception e) {
            return Result.error("领用计划创建失败: " + e.getMessage());
        }
    }

    /**
     * 更新领用计划用品价格
     */
    @PutMapping("/update-price")
    public Result<String> updateMenuPrice(@RequestParam Long menuId, @RequestParam BigDecimal newPrice) {
        try {
            boolean success = menuService.updateMenuPrice(menuId, newPrice);
            if (!success) {
                return Result.error("计划项不存在");
            }
            
            return Result.success("结算价格更新成功");
        } catch (Exception e) {
            return Result.error("结算价格更新失败: " + e.getMessage());
        }
    }

    /**
     * 获取指定日期的领用计划列表
     */
    @GetMapping("/list")
    public Result<List<AvailabilityPlan>> getMenuList(@RequestParam String date) {
        try {
            List<AvailabilityPlan> menus = menuService.getMenuByDate(date);
            // 为每个计划项填充用品信息（包括已删除的用品）
            for (AvailabilityPlan menu : menus) {
                SupplyItem recipe = recipeService.getRecipeByIdWithDeleted(menu.getRecipeId());
                menu.setRecipe(recipe);
            }
            return Result.success(menus);
        } catch (Exception e) {
            return Result.error("获取领用计划列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取领用计划详情
     */
    @GetMapping("/{id}")
    public Result<AvailabilityPlan> getMenuDetail(@PathVariable Long id) {
        try {
            AvailabilityPlan menu = menuService.getMenuById(id);
            if (menu == null) {
                return Result.error("计划项不存在");
            }
            
            // 填充用品信息（包括已删除的用品）
            SupplyItem recipe = recipeService.getRecipeByIdWithDeleted(menu.getRecipeId());
            menu.setRecipe(recipe);
            
            return Result.success(menu);
        } catch (Exception e) {
            return Result.error("获取领用计划详情失败: " + e.getMessage());
        }
    }

    /**
     * 发布领用计划
     */
    @PostMapping("/publish")
    public Result<String> publishMenu(@RequestParam String date) {
        try {
            List<AvailabilityPlan> menus = menuService.getMenuByDate(date);
            if (menus.isEmpty()) {
                return Result.error("该日期的领用计划不存在");
            }
            
            menuService.publishMenu(date);
            
            return Result.success("领用计划发布成功");
        } catch (Exception e) {
            return Result.error("领用计划发布失败: " + e.getMessage());
        }
    }

    /**
     * 取消发布领用计划
     */
    @PostMapping("/unpublish")
    public Result<String> unpublishMenu(@RequestParam String date) {
        try {
            List<AvailabilityPlan> menus = menuService.getMenuByDate(date);
            if (menus.isEmpty()) {
                return Result.error("该日期的领用计划不存在");
            }
            
            menuService.unpublishMenu(date);
            
            return Result.success("领用计划取消发布成功");
        } catch (Exception e) {
            return Result.error("领用计划取消发布失败: " + e.getMessage());
        }
    }

    /**
     * 删除计划项
     */
    @DeleteMapping("/{id}")
    public Result<String> deleteMenuItem(@PathVariable Long id) {
        try {
            AvailabilityPlan menu = menuService.getMenuById(id);
            if (menu == null) {
                return Result.error("计划项不存在");
            }
            
            menuService.deleteMenu(id);
            return Result.success("计划项删除成功");
        } catch (Exception e) {
            return Result.error("计划项删除失败: " + e.getMessage());
        }
    }

    /**
     * 说明：原有一个 POST /add-item 端点（往指定日期追加单个用品），
     * 但「计划管理」页创建计划时走的是 POST /create（整批提交），
     * 前端从未调用它，属死代码，已于本次精简中删除。
     */

    /**
     * 获取历史领用计划列表
     */
    @GetMapping("/history")
    public Result<List<String>> getHistoryMenus() {
        try {
            List<String> dates = menuService.getHistoryMenuDates();
            return Result.success(dates);
        } catch (Exception e) {
            return Result.error("获取历史领用计划列表失败: " + e.getMessage());
        }
    }

    /**
     * 复用历史领用计划
     */
    @PostMapping("/reuse")
    public Result<String> reuseHistoryMenu(@RequestParam String sourceDate, @RequestParam String targetDate) {
        try {
            boolean success = menuService.reuseHistoryMenu(sourceDate, targetDate);
            if (!success) {
                return Result.error("目标日期的领用计划已存在或源日期领用计划不存在");
            }
            
            return Result.success("历史领用计划复用成功");
        } catch (Exception e) {
            return Result.error("历史领用计划复用失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新指定日期的领用计划
     */
    @PutMapping("/update")
    public Result<String> updateMenu(@RequestParam String date, @RequestBody List<Long> recipeIds) {
        try {
            // 验证所有用品是否有效且未被删除
            for (Long recipeId : recipeIds) {
                SupplyItem recipe = recipeService.getRecipeById(recipeId);
                if (recipe == null) {
                    return Result.error("用品不存在: " + recipeId);
                }
                if (recipe.getStatus() != null && recipe.getStatus() == 0) {
                    return Result.error("用品已被删除，无法添加到领用计划: " + recipeId);
                }
            }
            
            menuService.updateMenuForDate(date, recipeIds);
            return Result.success("领用计划更新成功");
        } catch (Exception e) {
            return Result.error("领用计划更新失败: " + e.getMessage());
        }
    }
    
    /**
     * 根据日期删除整个领用计划
     */
    @DeleteMapping("/delete-by-date")
    public Result<String> deleteMenuByDate(@RequestParam String date) {
        try {
            menuService.deleteMenuByDate(date);
            return Result.success("领用计划删除成功");
        } catch (Exception e) {
            return Result.error("领用计划删除失败: " + e.getMessage());
        }
    }
}