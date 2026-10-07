// 用品目录模块
class SupplyItemModule {
    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header" style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: space-between;">
                <div>
                    <div class="card-title"><i class="fas fa-book me-1"></i> 用品目录管理</div>
                </div>
                <button class="btn primary small" style="padding: 8px 14px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;" onclick="SupplyItemModule.showAddRecipeModal()">
                    <i class="fas fa-plus"></i> 添加用品
                </button>
            </div>
            <!-- 搜索和筛选区域 -->
            <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; margin-bottom: 20px;">      
                <div class="chips">
                    <span class="pill ghost info" onclick="SupplyItemModule.filterRecipes('全部')" id="filter-all" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; color: #2d3748; background: #e2e8f0; cursor: pointer;">全部</span>
                    <span class="pill ghost" onclick="SupplyItemModule.filterRecipes('书写工具')" id="filter-main" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; color: #718096; background: #edf2f7; cursor: pointer;">书写工具</span>
                    <span class="pill ghost" onclick="SupplyItemModule.filterRecipes('办公耗材')" id="filter-dish" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; color: #718096; background: #edf2f7; cursor: pointer;">办公耗材</span>
                    <span class="pill ghost" onclick="SupplyItemModule.filterRecipes('纸张本册')" id="filter-soup" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; color: #718096; background: #edf2f7; cursor: pointer;">纸张本册</span>
                    <span class="pill ghost" onclick="SupplyItemModule.filterRecipes('桌面文具')" id="filter-dessert" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; color: #718096; background: #edf2f7; cursor: pointer;">桌面文具</span>
                </div>
                <div style="display: flex; flex: 1; min-width: 300px; gap: 10px;" class="recipe-search-container">
                    <input type="text" class="form-input" id="recipeSearchInput" placeholder="搜索用品名称..." style="flex: 1; min-width: 0; height: 38px; padding: 8px 12px; font-size: 14px; width: auto; border: 1px solid #cbd5e0; border-radius: 6px;">
                    <button class="btn outline medium" style="white-space: nowrap; height: 38px; width: auto; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; font-size: 14px; background: transparent; color: #4a5568; transition: all 0.2s;" onclick="SupplyItemModule.searchRecipes()">
                        <i class="fas fa-search"></i> 搜索
                    </button>
                </div>
            </div>
            <!-- 用品列表 -->
            <div id="recipeList">
                <p class="muted" style="color: #718096; font-size: 13px;">等待数据加载...</p>
            </div>
            <!-- 分页控件 -->
            <div id="recipePagination" class="pagination">
                <!-- 分页控件将在这里动态生成 -->
            </div>
        </div>
        <!-- 添加用品模态框 -->
        <div id="addRecipeModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="SupplyItemModule.closeAddRecipeModal()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
            <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; width: 500px;">
                <div class="modal-header" style="padding: 20px 20px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1a202c;"><i class="fas fa-plus me-1"></i> 添加新用品</h3>
                    <button class="modal-close" onclick="SupplyItemModule.closeAddRecipeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <form id="recipeForm">
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="recipeName" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">用品名称</label>
                            <input type="text" id="recipeName" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="recipeCategory" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">分类</label>
                            <select id="recipeCategory" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                                <option value="">请选择分类</option>
                                <option value="书写工具">书写工具</option>
                                <option value="办公耗材">办公耗材</option>
                                <option value="纸张本册">纸张本册</option>
                                <option value="桌面文具">桌面文具</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="recipePrice" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">价格 (¥)</label>
                            <input type="number" id="recipePrice" class="form-input" step="0.01" min="0" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="recipeUnit" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">单位(份)</label>
                            <input type="text" id="recipeUnit" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="recipeImage" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">上传图片</label>
                            <input type="file" id="recipeImage" class="form-input" accept="image/*" style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                            <div id="imagePreviewContainer" style="margin-top: 10px; display: none;">
                                <img id="imagePreview" src="" alt="预览图片" style="max-width: 100%; max-height: 200px; border-radius: 6px;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="recipeDescription" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">描述</label>
                            <textarea id="recipeDescription" class="form-input" rows="3" style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;"></textarea>
                        </div>
                        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" class="btn outline medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="SupplyItemModule.closeAddRecipeModal()">取消</button>
                            <button type="submit" class="btn primary medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;">添加用品</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- 编辑用品模态框 -->
        <div id="editRecipeModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="SupplyItemModule.closeEditRecipeModal()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5);"></div>
            <div class="modal-content" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; width: 500px;">
                <div class="modal-header" style="padding: 20px 20px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #1a202c;"><i class="fas fa-edit me-1"></i> 编辑用品</h3>
                    <button class="modal-close" onclick="SupplyItemModule.closeEditRecipeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <form id="editRecipeForm">
                        <input type="hidden" id="editRecipeId">
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="editRecipeName" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">用品名称</label>
                            <input type="text" id="editRecipeName" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="editRecipeCategory" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">分类</label>
                            <select id="editRecipeCategory" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                                <option value="">请选择分类</option>
                                <option value="书写工具">书写工具</option>
                                <option value="办公耗材">办公耗材</option>
                                <option value="纸张本册">纸张本册</option>
                                <option value="桌面文具">桌面文具</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="editRecipePrice" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">价格 (¥)</label>
                            <input type="number" id="editRecipePrice" class="form-input" step="0.01" min="0" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="editRecipeUnit" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">单位(份)</label>
                            <input type="text" id="editRecipeUnit" class="form-input" required style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="editRecipeImage" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">上传新图片</label>
                            <input type="file" id="editRecipeImage" class="form-input" accept="image/*" style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;">
                            <div id="editImagePreviewContainer" style="margin-top: 10px;">
                                <img id="editImagePreview" src="" alt="当前图片" style="max-width: 100%; max-height: 200px; border-radius: 6px;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 24px;">
                            <label for="editRecipeDescription" style="display: block; margin-bottom: 6px; font-size: 14px; font-weight: 600; color: #1a202c;">描述</label>
                            <textarea id="editRecipeDescription" class="form-input" rows="3" style="width: 100%; padding: 14px 16px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 15px; transition: all 0.2s;"></textarea>
                        </div>
                        <div class="form-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" class="btn outline medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap;" onclick="SupplyItemModule.closeEditRecipeModal()">取消</button>
                            <button type="submit" class="btn primary medium" style="padding: 10px 18px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s; white-space: nowrap;">更新用品</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        `;
    }

    // 当前选中的分类和搜索关键词
    static currentCategory = null;
    static currentSearchKeyword = null;
    static currentPage = 0;
    static pageSize = 10;
    static allRecipes = [];

    static initialize() {
        SupplyItemModule.setupRecipeForm();
        SupplyItemModule.setupRecipeSearch();
        // 默认加载第一页
        SupplyItemModule.loadRecipeData(0);
    }

    static filterRecipes(category) {
        // 更新激活状态 - 使用更可靠的方式
        const pills = document.querySelectorAll('.chips .pill');
        pills.forEach(pill => {
            pill.classList.remove('info');
        });

        if (category === '全部') {
            document.getElementById('filter-all').classList.add('info');
            SupplyItemModule.currentCategory = null; // 全部则不传分类参数
            // 当切换到"全部"时，也应该清除搜索关键字
            SupplyItemModule.currentSearchKeyword = null;
            // 清空搜索框
            const searchInput = document.getElementById('recipeSearchInput');
            if (searchInput) {
                searchInput.value = '';
            }
        } else if (category === '书写工具') {
            document.getElementById('filter-main').classList.add('info');
            SupplyItemModule.currentCategory = '书写工具';
        } else if (category === '办公耗材') {
            document.getElementById('filter-dish').classList.add('info');
            SupplyItemModule.currentCategory = '办公耗材';
        } else if (category === '纸张本册') {
            document.getElementById('filter-soup').classList.add('info');
            SupplyItemModule.currentCategory = '纸张本册';
        } else if (category === '桌面文具') {
            document.getElementById('filter-dessert').classList.add('info');
            SupplyItemModule.currentCategory = '桌面文具';
        }

        // 重新加载数据并过滤（重置到第一页）
        SupplyItemModule.loadRecipeData(0);
    }

    // 搜索用品
    static searchRecipes() {
        const keyword = document.getElementById('recipeSearchInput').value.trim();
        SupplyItemModule.currentSearchKeyword = keyword || null;
        // 搜索时重置到第一页
        SupplyItemModule.loadRecipeData(0);
    }
    
    // 回车搜索
    static setupRecipeSearch() {
        const searchInput = document.getElementById('recipeSearchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    SupplyItemModule.searchRecipes();
                }
            });
            
            // 添加输入事件监听器，当搜索框变为空时自动显示全部用品
            searchInput.addEventListener('input', function(e) {
                if (e.target.value.trim() === '') {
                    // 用户清空了搜索框，自动显示全部用品
                    SupplyItemModule.currentSearchKeyword = null;
                    SupplyItemModule.loadRecipeData(0);
                }
            });
        }
    }

    static loadRecipeData(page = 0) {
        // 更新当前页码
        SupplyItemModule.currentPage = page;
        // 构造查询参数
        let url = '/api/recipe/list';
        const params = [];
        // 添加分类参数
        if (SupplyItemModule.currentCategory) {
            params.push('category=' + encodeURIComponent(SupplyItemModule.currentCategory));
        }
        // 添加搜索参数
        if (SupplyItemModule.currentSearchKeyword) {
            params.push('name=' + encodeURIComponent(SupplyItemModule.currentSearchKeyword));
        }
        // 添加分页参数
        params.push('page=' + page);
        params.push('size=' + SupplyItemModule.pageSize);
        // 如果有参数，则拼接到URL上
        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    SupplyItemModule.displayRecipes(result.data.recipes, result.data);
                } else {
                    document.getElementById('recipeList').innerHTML =
                        '<p class="muted">加载失败: ' + result.msg + '</p>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('recipeList').innerHTML =
                    '<p class="muted">加载失败，请检查网络连接</p>';
            });
    }

    static displayRecipes(recipes, paginationData) {
        const container = document.getElementById('recipeList');
        if (!recipes || recipes.length === 0) {
            container.innerHTML = '<p class="muted" style="color: #718096; font-size: 13px;">暂无用品数据</p>';
            // 清空分页控件
            document.getElementById('recipePagination').innerHTML = '';
            return;
        }

        let html = '<div class="recipe-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">';
        recipes.forEach(recipe => {
            html += `
                <div class="recipe-card" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;">
                    ${recipe.imageUrl ?
                `<img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image" style="width: 100%; height: 150px; object-fit: cover;">` :
                `<div class="recipe-image-placeholder" style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f7fafc;">
                         <i class="fas fa-image" style="font-size: 32px; color: #cbd5e0;"></i>
                       </div>`
            }
                    <div class="recipe-info" style="padding: 15px;">
                        <div class="recipe-name" style="font-weight: 600; font-size: 16px; margin-bottom: 5px; color: #1a202c;">${recipe.name}</div>
                        <div class="recipe-category" style="font-size: 12px; color: #667eea; margin-bottom: 10px;">${recipe.category}</div>
                        <div class="recipe-price" style="font-weight: 700; color: #1a202c; font-size: 18px; margin-bottom: 10px;">¥${parseFloat(recipe.price).toFixed(2)}</div>
                        <div class="recipe-description" style="font-size: 13px; color: #718096; margin-bottom: 15px; line-height: 1.4;">${recipe.description || '暂无描述'}</div>
                    </div>
                    <div class="recipe-actions" style="padding: 0 15px 15px; display: flex; gap: 5px;">
                        <button class="btn outline mini" style="padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap; flex: 1;" onclick="SupplyItemModule.editRecipe(${recipe.id})">
                            <i class="fas fa-edit"></i> 修改
                        </button>
                        <button class="btn outline mini" style="padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: transparent; color: #4a5568; transition: all 0.2s; white-space: nowrap; flex: 1;" onclick="SupplyItemModule.deleteRecipe(${recipe.id})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        // 显示分页控件
        if (paginationData) {
            SupplyItemModule.displayPagination(paginationData);
        }
    }

    static displayPagination(paginationData) {
        const paginationContainer = document.getElementById('recipePagination');
        const totalPages = paginationData.totalPages;
        const currentPage = paginationData.currentPage;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        // 直接创建分页按钮
        let paginationHtml = '<div style="display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; margin: 16px 0; padding: 0;">';

        // 上一页按钮
        if (currentPage > 0) {
            paginationHtml += `<button class="btn outline mini" style="min-width: 60px; height: 30px; padding: 0 8px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: #fff; color: #4a5568; transition: all 0.2s ease;" onclick="SupplyItemModule.loadRecipeData(${currentPage - 1})">上一页</button>`;
        }

        // 页码
        for (let i = 0; i < totalPages; i++) {
            if (i === currentPage) {
                paginationHtml += `<button class="btn primary mini" style="min-width: 30px; height: 30px; padding: 0 8px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #667eea; cursor: pointer; font-weight: 500; background: #667eea; color: #fff; transition: all 0.2s ease;">${i + 1}</button>`;
            } else {
                paginationHtml += `<button class="btn outline mini" style="min-width: 30px; height: 30px; padding: 0 8px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: #fff; color: #4a5568; transition: all 0.2s ease;" onclick="SupplyItemModule.loadRecipeData(${i})">${i + 1}</button>`;
            }
        }

        // 下一页按钮
        if (currentPage < totalPages - 1) {
            paginationHtml += `<button class="btn outline mini" style="min-width: 60px; height: 30px; padding: 0 8px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #cbd5e0; cursor: pointer; font-weight: 500; background: #fff; color: #4a5568; transition: all 0.2s ease;" onclick="SupplyItemModule.loadRecipeData(${currentPage + 1})">下一页</button>`;
        }

        paginationHtml += '</div>';

        paginationContainer.innerHTML = paginationHtml;
    }

    static deleteRecipe(id) {
        if (!confirm('确定要删除这个用品吗？此操作不可恢复。')) {
            return;
        }
        fetch('/api/recipe/' + id, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    showToast('用品删除成功', 'success');
                    SupplyItemModule.loadRecipeData(SupplyItemModule.currentPage);
                } else {
                    showToast('删除失败: ' + result.msg, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('删除失败，请检查网络连接', 'error');
            });
    }

    // 编辑用品
    static editRecipe(id) {
        // 获取用品详细信息
        fetch('/api/recipe/' + id)
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    const recipe = result.data;
                    // 填充编辑表单
                    document.getElementById('editRecipeId').value = recipe.id;
                    document.getElementById('editRecipeName').value = recipe.name;
                    document.getElementById('editRecipeCategory').value = recipe.category;
                    document.getElementById('editRecipePrice').value = recipe.price;
                    document.getElementById('editRecipeUnit').value = recipe.unit;
                    document.getElementById('editRecipeDescription').value = recipe.description || '';

                    // 显示当前图片
                    if (recipe.imageUrl) {
                        document.getElementById('editImagePreview').src = recipe.imageUrl;
                        document.getElementById('editImagePreviewContainer').style.display = 'block';
                        // 保存当前图片URL，以便在不更换图片时使用
                        document.getElementById('editRecipeForm').dataset.currentImageUrl = recipe.imageUrl;
                    } else {
                        document.getElementById('editImagePreviewContainer').style.display = 'none';
                        document.getElementById('editRecipeForm').dataset.currentImageUrl = '';
                    }

                    // 显示编辑模态框
                    document.getElementById('editRecipeModal').style.display = 'block';
                } else {
                    showToast('获取用品信息失败: ' + result.msg, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('获取用品信息失败，请检查网络连接', 'error');
            });
    }

    // 关闭编辑用品模态框
    static closeEditRecipeModal() {
        document.getElementById('editRecipeModal').style.display = 'none';
    }

    // 更新用品
    static updateRecipe() {
        const id = document.getElementById('editRecipeId').value;
        const name = document.getElementById('editRecipeName').value;
        const category = document.getElementById('editRecipeCategory').value;
        const price = parseFloat(document.getElementById('editRecipePrice').value);
        const unit = document.getElementById('editRecipeUnit').value;
        const description = document.getElementById('editRecipeDescription').value;
        const imageFile = document.getElementById('editRecipeImage').files[0];
        // 获取当前图片URL
        const currentImageUrl = document.getElementById('editRecipeForm').dataset.currentImageUrl;

        // 如果选择了新图片，先上传图片
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);

            fetch('/api/recipe/upload-image', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(result => {
                    if (result.code === 200) {
                        // 图片上传成功，更新用品信息
                        SupplyItemModule.submitUpdatedRecipe(id, name, category, price, unit, result.data, description);
                    } else {
                        showToast('图片上传失败: ' + result.msg, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('图片上传失败，请检查网络连接', 'error');
                });
        } else {
            // 没有选择新图片，直接更新用品信息，保留当前图片URL
            SupplyItemModule.submitUpdatedRecipe(id, name, category, price, unit, currentImageUrl, description);
        }
    }

    // 提交更新的用品信息
    static submitUpdatedRecipe(id, name, category, price, unit, imageUrl, description) {
        const recipe = {
            id: id,
            name: name,
            category: category,
            price: price,
            unit: unit,
            description: description
        };

        // 如果有图片URL（新上传的或原有的），则使用该URL
        if (imageUrl) {
            recipe.imageUrl = imageUrl;
        }

        fetch('/api/recipe/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipe)
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    showToast('用品更新成功', 'success');
                    SupplyItemModule.closeEditRecipeModal();
                    SupplyItemModule.loadRecipeData(SupplyItemModule.currentPage);
                } else {
                    showToast('更新失败: ' + result.msg, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('更新失败，请检查网络连接', 'error');
            });
    }

    // 图片预览功能
    static setupRecipeForm() {
        // 绑定表单提交事件
        const recipeForm = document.getElementById('recipeForm');
        if (recipeForm) {
            // 移除已有的事件监听器（如果有的话）
            recipeForm.removeEventListener('submit', SupplyItemModule.handleRecipeFormSubmit);
            // 添加新的事件监听器
            recipeForm.addEventListener('submit', SupplyItemModule.handleRecipeFormSubmit);
        }

        // 绑定编辑表单提交事件
        const editRecipeForm = document.getElementById('editRecipeForm');
        if (editRecipeForm) {
            editRecipeForm.removeEventListener('submit', SupplyItemModule.handleEditRecipeFormSubmit);
            editRecipeForm.addEventListener('submit', SupplyItemModule.handleEditRecipeFormSubmit);
        }

        // 绑定图片预览事件
        const recipeImage = document.getElementById('recipeImage');
        if (recipeImage) {
            // 移除已有的事件监听器（如果有的话）
            recipeImage.removeEventListener('change', SupplyItemModule.handleImageChange);
            // 添加新的事件监听器
            recipeImage.addEventListener('change', SupplyItemModule.handleImageChange);
        }

        // 绑定编辑图片预览事件
        const editRecipeImage = document.getElementById('editRecipeImage');
        if (editRecipeImage) {
            editRecipeImage.removeEventListener('change', SupplyItemModule.handleEditImageChange);
            editRecipeImage.addEventListener('change', SupplyItemModule.handleEditImageChange);
        }
    }

    // 表单提交处理函数
    static handleRecipeFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        SupplyItemModule.addRecipe();
        return false;
    }

    // 编辑表单提交处理函数
    static handleEditRecipeFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        SupplyItemModule.updateRecipe();
        return false;
    }

    // 图片变更处理函数
    static handleImageChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.src = e.target.result;
                document.getElementById('imagePreviewContainer').style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }

    // 编辑图片变更处理函数
    static handleEditImageChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('editImagePreview');
                preview.src = e.target.result;
                document.getElementById('editImagePreviewContainer').style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }

    // 添加用品
    static addRecipe() {
        const imageFile = document.getElementById('recipeImage').files[0];
        if (!imageFile) {
            showToast('请选择要上传的图片', 'error');
            return;
        }

        // 先上传图片
        const formData = new FormData();
        formData.append('file', imageFile);

        fetch('/api/recipe/upload-image', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应异常: ' + response.status);
                }
                return response.json();
            })
            .then(result => {
                if (result.code === 200) {
                    // 图片上传成功，再添加用品
                    SupplyItemModule.submitRecipe(result.data);
                } else {
                    showToast('图片上传失败: ' + result.msg, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('图片上传失败，请检查网络连接', 'error');
            });
    }

    // 提交用品信息
    static submitRecipe(imageUrl) {
        const recipe = {
            name: document.getElementById('recipeName').value,
            category: document.getElementById('recipeCategory').value,
            price: parseFloat(document.getElementById('recipePrice').value),
            unit: document.getElementById('recipeUnit').value,
            imageUrl: imageUrl,
            description: document.getElementById('recipeDescription').value
        };

        fetch('/api/recipe/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipe)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应异常: ' + response.status);
                }
                return response.json();
            })
            .then(result => {
                if (result.code === 200) {
                    showToast('用品添加成功', 'success');
                    SupplyItemModule.closeAddRecipeModal();
                    SupplyItemModule.loadRecipeData(SupplyItemModule.currentPage);
                } else {
                    showToast('添加失败: ' + result.msg, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('添加失败，请检查网络连接', 'error');
            });
    }

    static showAddRecipeModal() {
        document.getElementById('addRecipeModal').style.display = 'block';
        document.getElementById('recipeForm').reset();
        document.getElementById('imagePreviewContainer').style.display = 'none';
        // 确保表单事件已经绑定
        SupplyItemModule.setupRecipeForm();
    }

    static closeAddRecipeModal() {
        document.getElementById('addRecipeModal').style.display = 'none';
    }
}

// 页面加载完成后初始化模块
document.addEventListener('DOMContentLoaded', function() {
    // 只有当当前视图为recipe时才初始化
    if (window.currentView === 'recipe') {
        SupplyItemModule.initialize();
    }
});