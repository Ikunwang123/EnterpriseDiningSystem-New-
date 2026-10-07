// 计划管理模块
class AvailabilityPlanModule {
    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-tasks me-1"></i> 计划管理</div>
                    <div class="card-sub">从用品目录选择用品生成领用计划，可调整价格和复用历史领用计划</div>
                </div>
                <button class="btn primary small" style="padding: 8px 14px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.showCreateMenuModal()">
                    <i class="fas fa-plus"></i> 创建领用计划
                </button>
            </div>

            <!-- 创建领用计划模态框 -->
            <div id="createMenuModal" class="modal" style="display: none;">
                <div class="modal-overlay" onclick="AvailabilityPlanModule.closeCreateMenuModal()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
                <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 90vw; max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header" style="padding: 20px 20px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #1a202c;"><i class="fas fa-plus me-1"></i> 创建今日领用计划</h3>
                        <button class="modal-close" onclick="AvailabilityPlanModule.closeCreateMenuModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="menuDate" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">领用计划日期</label>
                            <input type="date" id="menuDate" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">选择用品</label>
                            <div class="recipe-selection-container" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc;">
                                <div class="search-box" style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
                                    <input type="text" id="recipeSearch" class="form-input" placeholder="搜索用品..." style="flex: 1; height: 38px; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px;">
                                    <button class="btn outline mini" style="height: 38px; padding: 8px 15px; margin-left: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; font-size: 12px; background: transparent; color: #4a5568; transition: all 0.2s;" onclick="AvailabilityPlanModule.filterRecipesInMenu()"><i class="fas fa-search"></i></button>
                                </div>
                                <div id="recipeSelectionList" class="recipe-selection-list" style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #ffffff;">
                                    <p class="muted" style="color: #718096; font-size: 13px;">加载中...</p>
                                </div>
                            </div>
                        </div>
                        <div class="selected-recipes-summary" style="margin-top: 15px; padding: 10px; background: #ebf8ff; border-radius: 6px; border: 1px solid #bee3f8; color: #2c5282; font-size: 14px;">
                            <span>已选择 <strong id="selectedCount">0</strong> 个用品</span>
                        </div>
                        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" class="btn outline medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.closeCreateMenuModal()">取消</button>
                            <button type="button" class="btn primary medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.createMenu()">创建领用计划</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="menu-history-section">
                <h3 class="section-title"><i class="fas fa-history me-1"></i> 历史领用计划</h3>
                <div class="toolbar mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 10px; flex-wrap: wrap;">
                    <div class="toolbar-item" style="flex: 1; max-width: 300px; display: flex; align-items: center;">
                        <input type="text" id="menuHistorySearch" class="form-input" placeholder="搜索日期..." style="height: 38px; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 14px; width: 100%;">
                    </div>
                    <div class="toolbar-item">
                        <button class="btn outline medium" style="white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; font-size: 14px; background: transparent; color: #4a5568; transition: all 0.2s; padding: 10px 38px; height: 38px;" onclick="AvailabilityPlanModule.refreshMenuHistory()"><i class="fas fa-sync-alt"></i> 刷新</button>
                    </div>
                </div>
                <div id="menuManageList" class="menu-history-list">
                    <p class="muted" style="color: #718096; font-size: 13px;">等待数据加载...</p>
                </div>
            </div>
        </div>
        
        <!-- 领用计划详情模态框 -->
        <div id="menuDetailModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="AvailabilityPlanModule.closeMenuDetailModal()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
            <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; width: 90vw; max-width: 1000px;">
                <div class="modal-header" style="padding: 20px 20px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1a202c;"><i class="fas fa-list me-1"></i> 领用计划详情</h3>
                    <button class="modal-close" onclick="AvailabilityPlanModule.closeMenuDetailModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="menu-detail-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <div class="menu-date-status">
                            <h4 id="detailMenuDate" style="margin: 0; font-size: 20px; font-weight: 600;">领用计划日期</h4>
                            <span id="detailMenuStatus" class="pill" style="margin-top: 8px; display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">状态</span>
                        </div>
                        <div class="menu-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button id="publishBtn" class="btn primary small" style="padding: 8px 30px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.togglePublishStatus()">发布领用计划</button>
                            <button class="btn outline small" style="padding: 8px 30px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.showReuseMenuModal()">复用领用计划</button>
                            <button class="btn danger small" style="padding: 8px 30px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #e53e3e; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.deleteWholeMenu()">删除领用计划</button>
                        </div>
                    </div>
                    <div id="menuItemsList" class="menu-items-list">
                        <p class="muted" style="color: #718096; font-size: 13px;">加载中...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 复用领用计划模态框 -->
        <div id="reuseMenuModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="AvailabilityPlanModule.closeReuseMenuModal()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
            <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; width: 500px;">
                <div class="modal-header" style="padding: 20px 20px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1a202c;"><i class="fas fa-copy me-1"></i> 复用领用计划</h3>
                    <button class="modal-close" onclick="AvailabilityPlanModule.closeReuseMenuModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label for="targetDate" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">目标日期</label>
                        <input type="date" id="targetDate" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                    </div>
                    <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" class="btn outline medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.closeReuseMenuModal()">取消</button>
                        <button type="button" class="btn primary medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.reuseMenu()">复用领用计划</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 价格调整模态框 -->
        <div id="priceAdjustModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="AvailabilityPlanModule.closePriceAdjustModal()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
            <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; width: 500px;">
                <div class="modal-header" style="padding: 20px 20px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1a202c;"><i class="fas fa-edit me-1"></i> 调整价格</h3>
                    <button class="modal-close" onclick="AvailabilityPlanModule.closePriceAdjustModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label for="planItemName" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">用品名称</label>
                        <input type="text" id="planItemName" class="form-input" readonly style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s; background: #FAFAFA;">
                    </div>
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label for="originalPrice" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">原价 (¥)</label>
                        <input type="text" id="originalPrice" class="form-input" readonly style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s; background: #FAFAFA;">
                    </div>
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label for="newPrice" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">新价格 (¥)</label>
                        <input type="number" id="newPrice" class="form-input" step="0.01" min="0" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                    </div>
                    <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" class="btn outline medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.closePriceAdjustModal()">取消</button>
                        <button type="button" class="btn primary medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.updatePrice()">更新价格</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // 当前选中的领用计划日期
    static currentMenuDate = null;
    // 当前选中的计划项ID
    static currentMenuId = null;
    // 当前选中的源领用计划日期（用于复用）
    static sourceMenuDate = null;
    // 已选择的用品
    static selectedRecipes = [];
    
    static initialize() {
        // 初始化计划管理功能
        AvailabilityPlanModule.loadMenuHistory();
        AvailabilityPlanModule.setupEventListeners();
    }
    
    static setupEventListeners() {
        // 设置历史领用计划搜索回车键
        const menuHistorySearchInput = document.getElementById('menuHistorySearch');
        if (menuHistorySearchInput) {
            menuHistorySearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    AvailabilityPlanModule.searchMenuHistory();
                }
            });
        }
        
        // 设置用品搜索回车键
        const recipeSearchInput = document.getElementById('recipeSearch');
        if (recipeSearchInput) {
            recipeSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    AvailabilityPlanModule.filterRecipesInMenu();
                }
            });
        }
        
        // 设置创建领用计划日期默认值
        const menuDateInput = document.getElementById('menuDate');
        if (menuDateInput) {
            // 默认选中明天
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            menuDateInput.valueAsDate = tomorrow;
        }
    }
    
    // 显示创建领用计划模态框
    static showCreateMenuModal() {
        document.getElementById('createMenuModal').style.display = 'block';
        // 重置表单
        document.getElementById('recipeSelectionList').innerHTML = '<p class="muted">加载中...</p>';
        AvailabilityPlanModule.selectedRecipes = [];
        AvailabilityPlanModule.updateSelectedCount();
        // 加载用品列表
        AvailabilityPlanModule.loadRecipeList();
    }
    
    // 关闭创建领用计划模态框
    static closeCreateMenuModal() {
        document.getElementById('createMenuModal').style.display = 'none';
    }
    
    // 加载用品列表（用于创建领用计划）
    static loadRecipeList() {
        // 获取当前搜索关键词
        const keyword = document.getElementById('recipeSearch').value.trim();
        let url = '/api/recipe/all'; // 使用新的API接口获取所有用品数据
        
        if (keyword) {
            url += '?name=' + encodeURIComponent(keyword);
        }
        
        fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    AvailabilityPlanModule.displayRecipeList(result.data);
                } else {
                    document.getElementById('recipeSelectionList').innerHTML = 
                        '<p class="muted">加载失败: ' + result.msg + '</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('recipeSelectionList').innerHTML = 
                    '<p class="muted">加载失败，请检查网络连接</p>';
            });
    }
    
    // 显示用品列表
    static displayRecipeList(recipes) {
        const container = document.getElementById('recipeSelectionList');
        if (!recipes || recipes.length === 0) {
            container.innerHTML = '<p class="muted">暂无用品数据</p>';
            return;
        }
        
        // 移除外层的固定高度和滚动，让内部的 recipe-grid 控制滚动
        let html = '<div class="recipe-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">';
        recipes.forEach(recipe => {
            const isSelected = AvailabilityPlanModule.selectedRecipes.includes(recipe.id);
            html += `
                <div class="recipe-card ${isSelected ? 'selected' : ''}" onclick="AvailabilityPlanModule.toggleRecipeSelection(${recipe.id})" style="cursor: pointer;">
                    ${recipe.imageUrl ? 
                        `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image" style="height: 120px; object-fit: cover;">` :
                        `<div class="recipe-image-placeholder" style="height: 120px;">
                             <i class="fas fa-image" style="font-size: 24px; color: #cbd5e0;"></i>
                         </div>`
                    }
                    <div class="recipe-info">
                        <div class="recipe-name" style="font-size: 14px;">${recipe.name}</div>
                        <div class="recipe-category" style="font-size: 11px;">${recipe.category}</div>
                        <div class="recipe-price" style="font-size: 16px;">¥${parseFloat(recipe.price).toFixed(2)}</div>
                    </div>
                    <div class="recipe-select-indicator" style="padding: 0 10px 10px;">
                        ${isSelected ? 
                            '<i class="fas fa-check-circle" style="color: #4caf50;"></i> 已选择' : 
                            '<i class="far fa-circle"></i> 选择'
                        }
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }
    
    // 切换用品选择状态
    static toggleRecipeSelection(supplyItemId) {
        const index = AvailabilityPlanModule.selectedRecipes.indexOf(supplyItemId);
        if (index > -1) {
            // 已选择，取消选择
            AvailabilityPlanModule.selectedRecipes.splice(index, 1);
        } else {
            // 未选择，添加选择
            AvailabilityPlanModule.selectedRecipes.push(supplyItemId);
        }
        AvailabilityPlanModule.updateSelectedCount();
        // 只更新单个用品卡片的选择状态，不重新加载整个列表
        AvailabilityPlanModule.updateRecipeSelectionState(supplyItemId);
    }
    
    // 更新单个用品卡片的选择状态
    static updateRecipeSelectionState(supplyItemId) {
        const recipeCard = document.querySelector(`.recipe-card[onclick*="${supplyItemId}"]`);
        if (recipeCard) {
            const isSelected = AvailabilityPlanModule.selectedRecipes.includes(supplyItemId);
            
            // 更新卡片样式
            if (isSelected) {
                recipeCard.classList.add('selected');
            } else {
                recipeCard.classList.remove('selected');
            }
            
            // 更新选择指示器
            const indicator = recipeCard.querySelector('.recipe-select-indicator');
            if (indicator) {
                indicator.innerHTML = isSelected ? 
                    '<i class="fas fa-check-circle" style="color: #4caf50;"></i> 已选择' : 
                    '<i class="far fa-circle"></i> 选择';
            }
        }
    }
    

    
    // 更新已选择数量显示
    static updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = AvailabilityPlanModule.selectedRecipes.length;
        }
    }
    
    // 搜索用品（在创建领用计划时）
    static filterRecipesInMenu() {
        const keyword = document.getElementById('recipeSearch').value.trim();
        let url = '/api/recipe/all'; // 使用新的API接口获取所有用品数据
        if (keyword) {
            url += '?name=' + encodeURIComponent(keyword);
        }
        
        fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    AvailabilityPlanModule.displayRecipeList(result.data);
                } else {
                    showToast('搜索失败: ' + result.msg, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('搜索失败，请检查网络连接', 'error');
            });
    }
    
    // 创建领用计划
    static createMenu() {
        const date = document.getElementById('menuDate').value;
        if (!date) {
            showToast('请选择领用计划日期', 'error');
            return;
        }
        
        if (AvailabilityPlanModule.selectedRecipes.length === 0) {
            showToast('请至少选择一个用品', 'error');
            return;
        }
        
        fetch('/api/menu/create?date=' + encodeURIComponent(date), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(AvailabilityPlanModule.selectedRecipes)
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                showToast('领用计划创建成功', 'success');
                AvailabilityPlanModule.closeCreateMenuModal();
                // 延迟一点时间刷新，确保数据库已更新
                setTimeout(() => {
                    AvailabilityPlanModule.loadMenuHistory();
                }, 500);
            } else {
                showToast('创建失败: ' + result.msg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('创建失败，请检查网络连接', 'error');
        });
    }
    
    // 刷新领用计划历史
    static refreshMenuHistory() {
        AvailabilityPlanModule.loadMenuHistory();
    }
    
    // 搜索领用计划历史
    static searchMenuHistory() {
        // 简单实现，后续可增强
        AvailabilityPlanModule.loadMenuHistory();
    }
    
    // 加载领用计划历史
    static loadMenuHistory() {
        fetch('/api/menu/history')
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    AvailabilityPlanModule.displayMenuHistory(result.data);
                } else {
                    document.getElementById('menuManageList').innerHTML = 
                        '<p class="muted">加载失败: ' + result.msg + '</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('menuManageList').innerHTML = 
                    '<p class="muted">加载失败，请检查网络连接</p>';
            });
    }
    
    // 显示领用计划历史
    static displayMenuHistory(dates) {
        const container = document.getElementById('menuManageList');
        if (!dates || dates.length === 0) {
            container.innerHTML = '<p class="muted">暂无历史领用计划</p>';
            return;
        }
        
        // 按日期倒序排列
        dates.sort((a, b) => b.localeCompare(a));
        
        let html = '<div class="menu-history-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">';
        dates.forEach(date => {
            html += `
                <div class="menu-history-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #ffffff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div class="menu-date" style="font-weight: 600; flex: 1; min-width: 120px;">${date}</div>
                    <div class="menu-history-actions" style="display: flex; gap: 8px; flex-shrink: 0;">
                        <button class="btn primary mini" style="padding: 6px 28px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.showMenuDetail('${date}')">
                            <i class="fas fa-eye"></i> 查看
                        </button>
                        <button class="btn primary mini" style="padding: 6px 28px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.deleteWholeMenu('${date}')" >
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }
    
    // 显示领用计划详情
    static showMenuDetail(date) {
        AvailabilityPlanModule.currentMenuDate = date;
        document.getElementById('menuDetailModal').style.display = 'block';
        
        // 设置日期和初始状态
        document.getElementById('detailMenuDate').textContent = date;
        document.getElementById('detailMenuStatus').className = 'pill';
        document.getElementById('detailMenuStatus').textContent = '加载中...';
        
        // 加载计划项
        AvailabilityPlanModule.loadMenuItems(date);
    }
    
    // 关闭领用计划详情模态框
    static closeMenuDetailModal() {
        document.getElementById('menuDetailModal').style.display = 'none';
    }
    
    // 加载计划项
    static loadMenuItems(date) {
        fetch('/api/menu/list?date=' + encodeURIComponent(date))
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    AvailabilityPlanModule.displayMenuItems(result.data);
                } else {
                    document.getElementById('menuItemsList').innerHTML = 
                        '<p class="muted">加载失败: ' + result.msg + '</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('menuItemsList').innerHTML = 
                    '<p class="muted">加载失败，请检查网络连接</p>';
            });
    }
    
    // 显示计划项
    static displayMenuItems(menus) {
        const container = document.getElementById('menuItemsList');
        if (!menus || menus.length === 0) {
            container.innerHTML = '<p class="muted">该日期暂无领用计划</p>';
            return;
        }
        
        // 更新状态显示
        const status = menus[0].status; // 假设同一天的领用计划状态一致
        const statusElement = document.getElementById('detailMenuStatus');
        if (status === 1) {
            statusElement.classList.add('success');
            statusElement.textContent = '已发布';
            document.getElementById('publishBtn').innerHTML = '<i class="fas fa-times-circle"></i> 取消发布';
        } else {
            statusElement.classList.add('warning');
            statusElement.textContent = '未发布';
            document.getElementById('publishBtn').innerHTML = '<i class="fas fa-paper-plane"></i> 发布领用计划';
        }
        
        // 显示计划项列表
        let html = '<div class="menu-items-table" style="overflow-x: auto;">';
        html += `
            <div class="table-header" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 2fr; gap: 10px; padding: 12px; background: #f7fafc; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                <div>用品名称</div>
                <div>分类</div>
                <div>原价</div>
                <div>结算价</div>
                <div>操作</div>
            </div>
        `;
        
        menus.forEach(menu => {
            const recipe = menu.recipe || {};
            html += `
                <div class="table-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 2fr; gap: 10px; padding: 12px; border-bottom: 1px solid #e2e8f0; align-items: center;">
                    <div>${recipe.name || '未知用品'}</div>
                    <div>${recipe.category || '未知分类'}</div>
                    <div>¥${recipe.price ? parseFloat(recipe.price).toFixed(2) : '0.00'}</div>
                    <div>¥${menu.price ? parseFloat(menu.price).toFixed(2) : '0.00'}</div>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="btn outline mini" style="padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.showPriceAdjustModal(${menu.id}, '${recipe.name || ''}', ${menu.price})">
                            <i class="fas fa-edit"></i> 调价
                        </button>
                        <button class="btn danger mini" style="padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #e53e3e; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="AvailabilityPlanModule.deleteMenuItem(${menu.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    // 切换发布状态
    static togglePublishStatus() {
        if (!AvailabilityPlanModule.currentMenuDate) return;
        
        // 获取当前状态
        const statusElement = document.getElementById('detailMenuStatus');
        const isPublished = statusElement.classList.contains('success');
        
        const url = isPublished ? '/api/menu/unpublish' : '/api/menu/publish';
        const action = isPublished ? '取消发布' : '发布';
        
        fetch(url + '?date=' + encodeURIComponent(AvailabilityPlanModule.currentMenuDate), {
            method: 'POST'
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                showToast(`领用计划${action}成功`, 'success');
                // 重新加载计划项以更新状态显示
                AvailabilityPlanModule.loadMenuItems(AvailabilityPlanModule.currentMenuDate);
            } else {
                showToast(`${action}失败: ` + result.msg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(`${action}失败，请检查网络连接`, 'error');
        });
    }
    
    // 显示价格调整模态框
    static showPriceAdjustModal(menuId, itemName, currentPrice) {
        AvailabilityPlanModule.currentMenuId = menuId;
        document.getElementById('priceAdjustModal').style.display = 'block';
        document.getElementById('planItemName').value = itemName;
        document.getElementById('originalPrice').value = currentPrice.toFixed(2);
        document.getElementById('newPrice').value = currentPrice.toFixed(2);
    }
    
    // 关闭价格调整模态框
    static closePriceAdjustModal() {
        document.getElementById('priceAdjustModal').style.display = 'none';
    }
    
    // 更新价格
    static updatePrice() {
        const newPrice = document.getElementById('newPrice').value;
        if (!newPrice || newPrice < 0) {
            showToast('请输入有效的价格', 'error');
            return;
        }
        
        fetch(`/api/menu/update-price?menuId=${AvailabilityPlanModule.currentMenuId}&newPrice=${newPrice}`, {
            method: 'PUT'
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                showToast('价格更新成功', 'success');
                AvailabilityPlanModule.closePriceAdjustModal();
                // 重新加载计划项
                AvailabilityPlanModule.loadMenuItems(AvailabilityPlanModule.currentMenuDate);
            } else {
                showToast('更新失败: ' + result.msg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('更新失败，请检查网络连接', 'error');
        });
    }
    
    // 删除计划项
    static deleteMenuItem(menuId) {
        if (!confirm('确定要删除这个计划项吗？')) {
            return;
        }
        
        fetch(`/api/menu/${menuId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                showToast('计划项删除成功', 'success');
                // 重新加载计划项
                AvailabilityPlanModule.loadMenuItems(AvailabilityPlanModule.currentMenuDate);
            } else {
                showToast('删除失败: ' + result.msg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('删除失败，请检查网络连接', 'error');
        });
    }
    
    // 删除整个领用计划
    static deleteWholeMenu(date) {
        // 如果没有传入日期，则使用当前选中的领用计划日期
        const menuDate = date || AvailabilityPlanModule.currentMenuDate;
        
        if (!menuDate) {
            showToast('未指定要删除的领用计划日期', 'error');
            return;
        }
        
        if (!confirm(`确定要删除 ${menuDate} 的整个领用计划吗？此操作不可恢复。`)) {
            return;
        }
        
        // 使用专门的删除接口
        fetch(`/api/menu/delete-by-date?date=${encodeURIComponent(menuDate)}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                showToast('领用计划删除成功', 'success');
                // 关闭详情模态框（如果是从详情页面删除的）
                if (!date) {
                    AvailabilityPlanModule.closeMenuDetailModal();
                }
                // 刷新领用计划历史列表
                AvailabilityPlanModule.loadMenuHistory();
            } else {
                throw new Error(result.msg || '删除失败');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('删除失败: ' + error.message, 'error');
        });
    }
    
    // 显示复用领用计划模态框
    static showReuseMenuModal() {
        AvailabilityPlanModule.sourceMenuDate = AvailabilityPlanModule.currentMenuDate;
        document.getElementById('reuseMenuModal').style.display = 'block';
        
        // 设置目标日期默认值（明天）
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('targetDate').valueAsDate = tomorrow;
    }
    
    // 关闭复用领用计划模态框
    static closeReuseMenuModal() {
        document.getElementById('reuseMenuModal').style.display = 'none';
    }
    
    // 复用领用计划
    static reuseMenu() {
        const targetDate = document.getElementById('targetDate').value;
        if (!targetDate) {
            showToast('请选择目标日期', 'error');
            return;
        }
        
        fetch('/api/menu/reuse?sourceDate=' + encodeURIComponent(AvailabilityPlanModule.sourceMenuDate) + '&targetDate=' + encodeURIComponent(targetDate), {
            method: 'POST'
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                showToast('领用计划复用成功', 'success');
                AvailabilityPlanModule.closeReuseMenuModal();
                AvailabilityPlanModule.closeMenuDetailModal();
                AvailabilityPlanModule.loadMenuHistory();
            } else {
                showToast('复用失败: ' + result.msg, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('复用失败，请检查网络连接', 'error');
        });
    }
}

// 页面加载完成后初始化模块
document.addEventListener('DOMContentLoaded', function() {
    // 只有当当前视图为menu-manage时才初始化
    if (window.currentView === 'menu-manage') {
        AvailabilityPlanModule.initialize();
    }
});