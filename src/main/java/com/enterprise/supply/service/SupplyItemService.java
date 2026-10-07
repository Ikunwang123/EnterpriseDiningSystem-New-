package com.enterprise.supply.service;

import com.enterprise.supply.entity.SupplyItem;
import com.enterprise.supply.repository.SupplyItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplyItemService {
    
    @Autowired
    private SupplyItemRepository recipeRepository;
    
    public List<SupplyItem> getAllRecipes() {
        return recipeRepository.findAll(); // Return all recipes regardless of status for debugging
    }
    
    public List<SupplyItem> getRecipesByCategory(String category) {
        if (category != null && !category.isEmpty()) {
            return recipeRepository.findByCategory(category);
        }
        return recipeRepository.findAll();
    }
    
    public List<SupplyItem> searchRecipes(String category, String name) {
        if (category != null && !category.isEmpty() && name != null && !name.isEmpty()) {
            return recipeRepository.findByCategoryAndNameContainingIgnoreCase(category, name);
        } else if (category != null && !category.isEmpty()) {
            return recipeRepository.findByCategory(category);
        } else if (name != null && !name.isEmpty()) {
            return recipeRepository.findByNameContainingIgnoreCase(name);
        }
        return recipeRepository.findByStatus(1);
    }
    
    public Page<SupplyItem> searchRecipesWithPagination(String category, String name, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (category != null && !category.isEmpty() && name != null && !name.isEmpty()) {
            return recipeRepository.findByCategoryAndNameContainingIgnoreCase(category, name, pageable);
        } else if (category != null && !category.isEmpty()) {
            return recipeRepository.findByCategory(category, pageable);
        } else if (name != null && !name.isEmpty()) {
            return recipeRepository.findByNameContainingIgnoreCase(name, pageable);
        }
        return recipeRepository.findByStatus(1,pageable);
    }
    
    public SupplyItem getRecipeById(Long id) {
        return recipeRepository.findById(id).orElse(null);
    }
    
    public SupplyItem saveRecipe(SupplyItem recipe) {
        return recipeRepository.save(recipe);
    }
    
    public void deleteRecipe(Long id) {
        SupplyItem recipe = recipeRepository.findById(id).orElse(null);
        if (recipe != null) {
            recipe.setStatus(0); // 逻辑删除，将状态设置为0
            recipeRepository.save(recipe);
        }
    }
    
    // 获取所有用品（包括已删除的），用于领用计划关联历史数据
    public List<SupplyItem> getAllRecipesWithDeleted() {
        return recipeRepository.findAll();
    }
    
    // 根据ID获取用品（包括已删除的），用于领用计划关联历史数据
    public SupplyItem getRecipeByIdWithDeleted(Long id) {
        return recipeRepository.findById(id).orElse(null);
    }
}