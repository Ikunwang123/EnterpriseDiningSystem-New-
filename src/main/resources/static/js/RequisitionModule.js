class RequisitionModule {
    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-shopping-cart me-1"></i> 我的申领</div>
                    <div class="card-sub">查看和管理您的申领单记录</div>
                </div>
                <div class="header-actions">
                    <select id="statusFilter" class="form-input small" style="width:140px;margin-right:8px;">
                        <option value="">全部状态</option>
                        <option value="0">待备货</option>
                        <option value="1">已完成</option>
                        <option value="2">已取消</option>
                    </select>
                    <input type="date" id="dateFilter" class="form-input small" style="width:160px;margin-right:8px;">
                    <button class="btn primary small" id="refreshOrders">
                        <i class="fas fa-sync-alt"></i> 刷新
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div id="ordersList">
                    <p class="muted">加载中...</p>
                </div>
            </div>
        </div>
        `;
    }

    // 添加 render 方法
    static render(container) {
        if (container) {
            container.innerHTML = this.getTemplate();
            this.addStyles();
            this.initialize();
        }
        return this.getTemplate();
    }

    static addStyles() {
        if (document.getElementById('order-module-styles')) return;

        const style = document.createElement('style');
        style.id = 'order-module-styles';
        style.textContent = `
            #ordersList {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .order-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 0;
                background: #ffffff;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .order-card:hover {
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
                transform: translateY(-2px);
            }

            .order-card-header {
                padding: 20px;
                background: linear-gradient(to right, #f8fafc, #ffffff);
                border-bottom: 2px solid #f0f3f7;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .order-main-info {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .order-number-row {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .order-number {
                font-weight: 600;
                font-size: 16px;
                color: #1a202c;
                font-family: 'Courier New', monospace;
            }

            .order-status-badge {
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .status-pending {
                background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                color: #856404;
            }

            .status-completed {
                background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
                color: #ffffff;
            }

            .status-cancelled {
                background: linear-gradient(135deg, #fab1a0 0%, #e17055 100%);
                color: #ffffff;
            }

            .order-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 13px;
                color: #718096;
            }

            .order-meta-item {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .order-meta-item i {
                font-size: 12px;
            }

            .order-card-body {
                padding: 20px;
            }

            .order-items-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 16px;
            }

            .order-dish-item {
                padding: 12px;
                background: #f8f9fc;
                border-radius: 8px;
                border: 1px solid #edf2f7;
                transition: all 0.2s;
            }

            .order-dish-item:hover {
                background: #eef2f9;
                border-color: #dae1f0;
            }

            .dish-item-name {
                font-weight: 500;
                color: #2d3748;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .dish-item-details {
                font-size: 12px;
                color: #718096;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .dish-item-price {
                font-weight: 600;
                color: #667eea;
            }

            .order-total-section {
                padding: 16px;
                background: linear-gradient(135deg, #f7fafc 0%, #eef2f7 100%);
                border-radius: 8px;
                border: 2px dashed #cbd5e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .order-total-label {
                font-size: 16px;
                font-weight: 600;
                color: #4a5568;
            }

            .order-total-price {
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .empty-orders {
                text-align: center;
                padding: 80px 40px;
                background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
                border-radius: 12px;
                border: 2px dashed #e2e8f0;
            }

            .empty-orders i {
                font-size: 64px;
                color: #cbd5e0;
                margin-bottom: 16px;
            }

            .empty-orders p {
                color: #718096;
                font-size: 16px;
                margin: 8px 0;
            }

            @media (max-width: 768px) {
                .order-items-grid {
                    grid-template-columns: 1fr;
                }
                
                .order-card-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    static initialize() {
        this.loadOrders();
        document.getElementById('refreshOrders')?.addEventListener('click', () => this.loadOrders());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.loadOrders());
        document.getElementById('dateFilter')?.addEventListener('change', () => this.loadOrders());
    }

    static async loadOrders() {
        const list = document.getElementById('ordersList');
        list.innerHTML = '<p class="muted">加载中...</p>';

        try {
            const status = document.getElementById('statusFilter').value;
            const date = document.getElementById('dateFilter').value;

            let url = '/api/dining/my-requisitions';
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (date) params.append('date', date);
            if (params.toString()) url += '?' + params.toString();

            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('加载失败');

            const result = await response.json();
            if (result.code !== 200) throw new Error(result.msg || '加载失败');

            const orders = result.data || [];

            if (orders.length === 0) {
                list.innerHTML = `
                    <div class="empty-orders">
                        <i class="fas fa-receipt"></i>
                        <p style="font-weight: 600; color: #4a5568;">暂无申领单记录</p>
                        <p style="font-size: 14px;">您还没有下过申领单，快去领用计划选择需要的用品吧！</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = orders.map(order => {
                const statusInfo = this.getStatusInfo(order.status);

                const itemsHtml = order.items.map(item => `
                    <div class="order-dish-item">
                        <div class="dish-item-name">${item.itemName}</div>
                        <div class="dish-item-details">
                            <span>× ${item.quantity}${item.unit || '份'}</span>
                            <span class="dish-item-price">¥${(item.subtotal || item.unitPrice * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('');

                return `
                <div class="order-card">
                    <div class="order-card-header">
                        <div class="order-main-info">
                            <div class="order-number-row">
                                <!-- 后端 getMyOrders 返回的字段名是 orderNo（见 RequisitionController），
                                     这里曾误写成 requisitionNo，导致单号显示为 undefined。
                                     两种都兼容一下，避免以后后端改名又失效。 -->
                                <span class="order-number">${order.orderNo || order.requisitionNo || '-'}</span>
                                <span class="order-status-badge status-${statusInfo.class}">${statusInfo.text}</span>
                            </div>
                            <div class="order-meta">
                                <div class="order-meta-item">
                                    <i class="fas fa-clock"></i>
                                    <span>${order.createTime || new Date(order.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="order-card-body">
                        <div class="order-items-grid">
                            ${itemsHtml}
                        </div>
                        <div class="order-total-section">
                            <span class="order-total-label">申领单总额</span>
                            <span class="order-total-price">¥${order.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

        } catch (error) {
            list.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p style="color: #f56565; font-weight: 600;">加载失败</p>
                    <p style="color: #e53e3e; font-size: 14px;">${error.message}</p>
                    <button class="btn primary" onclick="RequisitionModule.loadOrders()" style="margin-top: 16px;">重试</button>
                </div>
            `;
        }
    }

    static getStatusInfo(status) {
        // 与后端 RequisitionStatus 枚举一一对应（3 个状态）：
        //   PENDING=0 待备货 / DONE=1 已完成 / CANCELLED=2 已取消
        // 原来的「备货中」「待领取」两个中间态已去掉——界面没有任何入口能改状态，
        // 留着只会让"状态怎么流转"讲不清楚。
        const map = {
            0: { text: '待备货', class: 'pending' },
            1: { text: '已完成', class: 'completed' },
            2: { text: '已取消', class: 'cancelled' }
        };
        return map[status] || { text: '未知', class: 'pending' };
    }
}
