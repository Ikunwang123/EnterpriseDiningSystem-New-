package com.enterprise.supply.controller;

import com.enterprise.supply.common.Result;
import com.enterprise.supply.entity.SupplyItem;
import com.enterprise.supply.service.SupplyItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

/**
 * 用品管理控制器
 * 负责成员: Member 2
 * 任务: 实现用品管理、分类管理 (CRUD)
 */
@RestController
@RequestMapping("/api/recipe")
@CrossOrigin
public class SupplyItemController {

    @Autowired
    private SupplyItemService recipeService;
    
    /**
     * 获取用品列表 (支持按分类筛选、名称搜索和分页)
     */
    @GetMapping("/list")
    public Result<Map<String, Object>> getList(@RequestParam(required = false) String category,
                                              @RequestParam(required = false) String name,
                                              @RequestParam(defaultValue = "0") Integer page,
                                              @RequestParam(defaultValue = "10") Integer size) {
        Page<SupplyItem> recipePage = recipeService.searchRecipesWithPagination(category, name, page, size);
        
        Map<String, Object> resultData = new HashMap<>();
        resultData.put("recipes", recipePage.getContent());
        resultData.put("currentPage", recipePage.getNumber());
        resultData.put("totalPages", recipePage.getTotalPages());
        resultData.put("totalElements", recipePage.getTotalElements());
        resultData.put("size", recipePage.getSize());
        
        return Result.success(resultData);
    }
    
    /**
     * 获取所有用品列表 (不分页，用于创建领用计划时一次性显示所有用品)
     */
    @GetMapping("/all")
    public Result<List<SupplyItem>> getAllRecipes(@RequestParam(required = false) String category,
                                             @RequestParam(required = false) String name) {
        List<SupplyItem> recipes = recipeService.searchRecipes(category, name);
        return Result.success(recipes);
    }

    /**
     * 添加用品
     */
    @PostMapping("/add")
    public Result<String> addRecipe(@RequestBody SupplyItem recipe) {
        try {
            recipeService.saveRecipe(recipe);
            return Result.success("用品添加成功");
        } catch (Exception e) {
            return Result.error("用品添加失败: " + e.getMessage());
        }
    }
    
    /**
     * 上传用品图片
     */
    @PostMapping("/upload-image")
    public Result<String> uploadImage(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        if (file.isEmpty()) {
            return Result.error("上传文件为空");
        }
        
        try {
            // 定义上传目录为static/images文件夹（相对于项目根目录）
            String rootPath = System.getProperty("user.dir");
            String uploadDir = rootPath + "/src/main/resources/static/images";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                if (!created) {
                    return Result.error("无法创建上传目录");
                }
            }
            
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + extension;
            
            // 保存文件
            byte[] bytes = file.getBytes();
            Path path = Paths.get(uploadDir + File.separator + filename);
            Files.write(path, bytes);
            
            // 返回访问URL
            String imageUrl = "/images/" + filename;
            return Result.success(imageUrl);
        } catch (IOException e) {
            return Result.error("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 修改用品
     */
    @PutMapping("/update")
    public Result<String> updateRecipe(@RequestBody SupplyItem recipe) {
        try {
            SupplyItem existingRecipe = recipeService.getRecipeById(recipe.getId());
            if (existingRecipe == null) {
                return Result.error("用品不存在");
            }
            recipeService.saveRecipe(recipe);
            return Result.success("用品更新成功");
        } catch (Exception e) {
            return Result.error("用品更新失败: " + e.getMessage());
        }
    }

    /**
     * 删除用品 (逻辑删除)
     */
    @DeleteMapping("/{id}")
    public Result<String> deleteRecipe(@PathVariable Long id) {
        try {
            SupplyItem existingRecipe = recipeService.getRecipeById(id);
            if (existingRecipe == null) {
                return Result.error("用品不存在");
            }
            recipeService.deleteRecipe(id);
            return Result.success("用品删除成功");
        } catch (Exception e) {
            return Result.error("用品删除失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取用品详情
     */
    @GetMapping("/{id}")
    public Result<SupplyItem> getRecipeDetail(@PathVariable Long id) {
        SupplyItem recipe = recipeService.getRecipeById(id);
        if (recipe == null) {
            return Result.error("用品不存在");
        }
        return Result.success(recipe);
    }
}