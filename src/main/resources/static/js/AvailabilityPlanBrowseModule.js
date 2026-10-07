// 领用计划模块 (员工申领)
class AvailabilityPlanBrowseModule {
    static menuItems = [];
    static cart = new Map(); // itemId -> quantity
    static currentDate = new Date().toISOString().split('T')[0];
    // 当前正在查看/申领的计划日期（由后端 target-date 接口给出，或用户在下拉框里切换）
    static activeDate = null;

    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-calendar-day me-1"></i> 今日领用计划</div>
                    <div class="card-sub">请在上午 9:00 前完成申领</div>
                </div>
                <div class="header-actions">
                    <!-- 可申领的日期选择：管理员可能只发布了某一天的计划，
                         这里让员工能自己切换，而不是死盯"今天" -->
                    <select id="planDateSelect" class="form-input small"
                            style="width: 190px; display: none;"
                            onchange="AvailabilityPlanBrowseModule.onPlanDateChange()">
                    </select>
                    <span class="badge info" id="menuDateDisplay">...</span>
                </div>
            </div>
            
            <div class="card-body">
                <div class="menu-layout" style="display: flex; gap: 20px; flex-wrap: wrap;">
                    <!-- 领用计划列表区域 -->
                    <div class="menu-list-section" style="flex: 1; min-width: 0;">
                        <div id="dailyMenuList" class="menu-grid">
                            <p class="muted text-center" style="padding: 40px;">正在加载领用计划...</p>
                </div>
                    </div>

                    <!-- 申领单结算区域 -->
                    <div class="order-summary-section" style="width: 300px; flex-shrink: 0;">
                        <div class="order-summary-card" style="position: sticky; top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff;">
                            <div class="summary-header" style="padding: 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600;">
                                <i class="fas fa-receipt me-1"></i> 申领单详情
                            </div>
                            <div class="summary-body" style="padding: 15px;">
                                <div id="cartItems" style="min-height: 100px; max-height: 400px; overflow-y: auto;">
                                    <p class="muted text-center small">暂无选择用品</p>
                </div>
                                <div class="summary-total" style="margin-top: 15px; padding-top: 15px; border-top: 2px dashed #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 500;">合计金额</span>
                                    <span class="total-price" style="font-size: 20px; font-weight: 700; color: #e53e3e;">¥0.00</span>
            </div>
        </div>
                            <div class="summary-footer" style="padding: 15px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                                <button class="btn primary medium" style="width: 100%;" onclick="AvailabilityPlanBrowseModule.submitRequisition()">
                                    立即提交申领
                        </button>
                                <p class="text-center muted small mt-2" style="margin-bottom: 0; font-size: 12px;">每日限下一单，不可修改</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    static initialize() {
        // 设置日期显示
        const dateDisplay = document.getElementById('menuDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = new Date().toLocaleDateString();
        }

        // 添加样式
        if (!document.getElementById('daily-menu-styles')) {
            const style = document.createElement('style');
            style.id = 'daily-menu-styles';
            style.textContent = `
                .menu-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                }
                .dish-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    transition: all 0.2s;
                    background: #fff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                }
                .dish-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                    border-color: #667eea;
                }
                .dish-image {
                    width: 100%;
                    height: 160px;
                    object-fit: cover;
                    background: #f7fafc;
                }
                .dish-info {
                    padding: 16px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .dish-name {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 8px;
                    color: #2d3748;
                }
                .dish-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .dish-category {
                    font-size: 12px;
                    color: #718096;
                    background: #edf2f7;
                    padding: 2px 8px;
                    border-radius: 12px;
                }
                .dish-price {
                    color: #e53e3e;
                    font-weight: 700;
                    font-size: 18px;
                }
                .dish-desc {
                    font-size: 13px;
                    color: #718096;
                    margin-bottom: 16px;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    flex: 1;
                }
                .dish-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: auto;
                }
                .qty-control {
                    display: flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .qty-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f7fafc;
                    border: none;
                    cursor: pointer;
                    color: #4a5568;
                    transition: all 0.2s;
                }
                .qty-btn:hover {
                    background: #edf2f7;
                    color: #2d3748;
                }
                .qty-input {
                    width: 40px;
                    height: 32px;
                    border: none;
                    border-left: 1px solid #e2e8f0;
                    border-right: 1px solid #e2e8f0;
                    text-align: center;
                    font-size: 14px;
                    padding: 0;
                    -moz-appearance: textfield;
                    background: #fff;
                }
                .qty-input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                }
                .cart-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px dashed #e2e8f0;
                }
                .cart-item:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: none;
                }
                
                /* Empty state styles */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 40px;
                    text-align: center;
                    grid-column: 1 / -1;
                    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                    border-radius: 12px;
                    border: 2px dashed #e2e8f0;
                    min-height: 300px;
                }
                .empty-state i {
                    color: #cbd5e0;
                    margin-bottom: 20px;
                    display: block;
                    width: 64px;
                    height: 64px;
                    line-height: 64px;
                }
                .empty-state p {
                    color: #718096;
                    margin: 0;
                    font-size: 16px;
                    line-height: 1.6;
                    max-width: 400px;
                }
                .empty-state p:first-of-type {
                    font-weight: 500;
                    color: #4a5568;
                    margin-bottom: 8px;
                }
                
                @media (max-width: 768px) {
                    .menu-layout {
                        flex-direction: column;
                    }
                    .order-summary-section {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // 必须「先」拿到目标日期再去加载计划：
        // loadTodayMenu 依赖 this.activeDate，若并发触发会先按 null 去查，
        // 结果又退回到"今天"，出现日期与内容不一致的问题。
        this.fetchTargetOrderDate().then(() => this.loadTodayMenu());
    }

    // 获取目标申领日期，并填充「可申领日期」下拉框
    static async fetchTargetOrderDate() {
        try {
            const response = await fetch('/api/dining/order/target-date');
            const result = await response.json();

            if (result.code === 200) {
                const data = result.data;
                this.activeDate = data.targetDate;

                // 更新日期显示（文案由后端给出，避免前端再假设"只能今天或明天"）
                const dateDisplay = document.getElementById('menuDateDisplay');
                if (dateDisplay) {
                    dateDisplay.textContent = data.displayText;
                }

                // 填充日期下拉：有多个已发布计划时允许切换
                const sel = document.getElementById('planDateSelect');
                if (sel) {
                    const dates = data.availableDates || [];
                    if (dates.length > 0) {
                        sel.innerHTML = dates.map(d =>
                            `<option value="${d}"${d === data.targetDate ? ' selected' : ''}>${d}</option>`
                        ).join('');
                        // 只有一个日期时不必显示下拉
                        sel.style.display = dates.length > 1 ? 'inline-block' : 'none';
                    } else {
                        sel.style.display = 'none';
                    }
                }

                // 只有开启时间限制、"订次日"时才提示；关闭限制时不再误报
                if (data.isTomorrow) {
                    setTimeout(() => {
                        showToast('当前已过领用开始时间，现在显示的是次日的领用计划', 'info', 4000);
                    }, 500);
                }
            }
        } catch (error) {
            console.error('获取目标申领日期失败:', error);
        }
    }

    // 用户切换要申领的日期
    static onPlanDateChange() {
        const sel = document.getElementById('planDateSelect');
        if (!sel) return;
        this.activeDate = sel.value;
        const dateDisplay = document.getElementById('menuDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = '领用计划 (' + sel.value + ')';
        }
        this.cart.clear();
        this.loadTodayMenu();
    }

    static loadTodayMenu() {
        const container = document.getElementById('dailyMenuList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px;"></i>
                <p>正在加载领用计划...</p>
            </div>`;

        // 按当前选中的日期查询已发布的用品。
        // /api/dining/menu/list 与 /api/dining/menu/today 返回**同一套字段结构**
        // （都由后端 getPublishedPlanItems 生成），所以这里不需要再做字段转换——
        // 以前要写一段"判断是不是计划实体再逐个映射"的兼容代码，纯属冗余。
        const date = this.activeDate;
        const url = date
            ? `/api/dining/menu/list?date=${encodeURIComponent(date)}`
            : '/api/dining/menu/today';

        fetch(url)
            .then(res => res.json())
            .then(result => {
                if (result.code === 200) {
                    this.menuItems = result.data || [];
                    this.renderMenu();
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #f56565;"></i>
                            <p style="color: #f56565;">${result.msg || '加载失败'}</p>
                        </div>`;
                }
            })
            .catch(err => {
                console.error('加载领用计划失败:', err);
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-wifi" style="font-size: 48px; color: #f56565;"></i>
                        <p style="color: #f56565;">加载失败，请检查网络连接</p>
                    </div>`;
            });
    }

    static renderMenu() {
        const container = document.getElementById('dailyMenuList');

        if (this.menuItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils" style="font-size: 64px;"></i>
                    <p>今日领用计划尚未发布</p>
                    <p style="font-size: 14px; margin-top: 4px; color: #a0aec0;">请稍后再来或联系管理员发布领用计划</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.menuItems.forEach(item => {
            const qty = this.cart.get(item.id) || 0;
            html += `
                <div class="dish-card">
                    <img src="${item.imageUrl || '/images/' + item.id + '.png'}" class="dish-image" onerror="this.onerror=null;this.src='/images/' + item.id + '.png'">
                    <div class="dish-info">
                        <div class="dish-name">${item.name}</div>
                        <div class="dish-meta">
                            <span class="dish-category">${item.category || '未分类'}</span>
                            <span class="dish-price">¥${item.price.toFixed(2)}/${item.unit}</span>
                        </div>
                        <div class="dish-desc" title="${item.description || ''}">${item.description || '暂无描述'}</div>
                        <div class="dish-actions">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="AvailabilityPlanBrowseModule.updateQuantity(${item.id}, -1)"><i class="fas fa-minus" style="font-size: 10px;"></i></button>
                                <input type="number" class="qty-input" value="${qty}" readonly>
                                <button class="qty-btn" onclick="AvailabilityPlanBrowseModule.updateQuantity(${item.id}, 1)"><i class="fas fa-plus" style="font-size: 10px;"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        this.renderCart();
    }

    static updateQuantity(itemId, delta) {
        const currentQty = this.cart.get(itemId) || 0;
        let newQty = currentQty + delta;

        if (newQty < 0) newQty = 0;
        if (newQty > 10) {
            showToast('单品数量不能超过10份', 'warning');
            return;
        }

        if (newQty === 0) {
            this.cart.delete(itemId);
        } else {
            this.cart.set(itemId, newQty);
        }

        // 更新界面
        this.renderMenu(); // 重新渲染以更新数量输入框
        // 实际上为了性能不应该重绘整个列表，这里简化处理
    }

    static renderCart() {
        const container = document.getElementById('cartItems');
        const totalEl = document.querySelector('.summary-total .total-price');

        if (this.cart.size === 0) {
            container.innerHTML = `
                <div class="text-center muted" style="padding: 20px 0;">
                    <i class="fas fa-shopping-basket mb-2" style="font-size: 24px; color: #e2e8f0;"></i>
                    <p class="small">暂无选择用品</p>
                </div>
            `;
            totalEl.textContent = '¥0.00';
            return;
        }

        let html = '';
        let totalAmount = 0;

        this.cart.forEach((qty, itemId) => {
            const item = this.menuItems.find(i => i.id === itemId);
            if (item) {
                const subtotal = item.price * qty;
                totalAmount += subtotal;
                html += `
                    <div class="cart-item">
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                            <div class="small muted">¥${item.price.toFixed(2)} × ${qty}</div>
                        </div>
                        <div style="font-weight: 600; font-size: 14px;">¥${subtotal.toFixed(2)}</div>
                    </div>
                `;
            }
        });

        container.innerHTML = html;
        totalEl.textContent = '¥' + totalAmount.toFixed(2);
    }

    static submitRequisition() {
        console.log('[申领单] 开始提交申领单...');

        if (this.cart.size === 0) {
            console.warn('[申领单] 购物车为空');
            showToast('请先选择用品', 'warning');
            return;
        }

        console.log('[申领单] 购物车内容:', this.cart);

        if (!confirm('确定要提交申领单吗？提交后不可修改。')) {
            console.log('[申领单] 用户取消申领单');
            return;
        }

        const items = [];
        this.cart.forEach((qty, itemId) => {
            // 字段名必须是 menuItemId：后端 CreateRequisitionItemRequest 的属性名就是它。
            // 曾经这里写成 planItemId，后端收不到值 → menuItemId 为 null → 申领失败，
            // 而前端只看到一句笼统错误，很难排查。
            // 后端现已兼容 planItemId，但这里保持与 DTO 一致的规范写法。
            items.push({
                menuItemId: itemId,
                quantity: qty
            });
        });

        const request = {
            items: items
        };

        console.log('[申领单] 发送请求:', request);
        console.log('[申领单] 请求URL: /api/dining/order/submit');

        fetch('/api/dining/order/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(request)
        })
            .then(res => {
                console.log('[申领单] 响应状态:', res.status);
                // 不要直接 res.json()：出错时后端可能返回非 JSON（HTML 错误页/空响应体），
                // 那样会在 .then 里解析异常，用户只看到"请检查网络"这种误导性提示。
                return res.text().then(text => {
                    let data = null;
                    try {
                        data = text && text.trim() ? JSON.parse(text) : null;
                    } catch (e) {
                        console.error('[申领单] 响应不是合法 JSON:', text);
                    }
                    return { ok: res.ok, status: res.status, data: data, raw: text };
                });
            })
            .then(({ ok, status, data, raw }) => {
                console.log('[申领单] 解析后的结果:', data);

                if (ok && data && data.code === 200) {
                    console.log('[申领单] 申领单提交成功！');
                    showToast('提交申领成功！', 'success');
                    // 清空购物车
                    this.cart.clear();
                    this.renderCart();
                    this.renderMenu();

                    // 跳转到我的申领页面
                    setTimeout(() => {
                        const navOrder = document.querySelector('[data-view="order"]');
                        if (navOrder) navOrder.click();
                    }, 1500);
                } else {
                    // 把服务端的真实原因显示出来，而不是笼统提示
                    const reason = (data && data.msg) ? data.msg
                        : (status ? ('服务端返回 HTTP ' + status) : '未知错误');
                    console.error('[申领单] 提交失败:', status, data, raw);
                    showToast('提交申领失败: ' + reason, 'error');
                }
            })
            .catch(err => {
                console.error('[申领单] 请求失败:', err);
                showToast('提交申领失败: ' + (err && err.message ? err.message : '请检查网络'), 'error');
            });
    }
}

// 页面加载完成后初始化模块 (如果 app.js 支持)
document.addEventListener('viewChange', function (e) {
    if (e.detail.view === 'menu') {
        AvailabilityPlanBrowseModule.initialize();
    }
});
