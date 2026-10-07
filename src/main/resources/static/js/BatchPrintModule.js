class BatchPrintModule {
    static selectedOrders = new Set();
    static currentPage = 1;
    static pageSize = 10;
    static allGroupedOrders = [];

    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-print me-1"></i> 批量打印领用单</div>
                    <div class="card-sub">领用开始后配送单打印员工申领单领用单</div>
                </div>
                <div class="header-actions">
                    <button class="btn primary small" onclick="BatchPrintModule.selectAllOrders()">
                        <i class="fas fa-check-square"></i> 全选
                    </button>
                    <button class="btn outline small" onclick="BatchPrintModule.deselectAllOrders()">
                        <i class="fas fa-times-circle"></i> 取消全选
                    </button>
                    <button class="btn primary small" onclick="BatchPrintModule.loadOrders()">
                        <i class="fas fa-sync"></i> 刷新
                    </button>
                    <button class="btn success small" onclick="BatchPrintModule.batchPrint()">
                        <i class="fas fa-print"></i> 配送单打印
                    </button>
                </div>
            </div>
            
            <div class="card-body">
                <div class="batch-info">
                    <span>已选择 <strong id="selectedCount">0</strong> 个申领单</span>
                </div>
                
                <div id="batchOrdersContainer">
                    <div class="text-center" style="padding: 40px;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p class="muted">加载中...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 打印预览模态框 -->
        <div id="batchPrintPreviewModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="BatchPrintModule.closeBatchPrintPreview()"></div>
            <div class="modal-content" style="width: 95vw; max-width: 1400px; height: 95vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-print me-1"></i> 配送单打印预览</h3>
                    <div>
                        <button class="btn outline small" onclick="window.print()">
                            <i class="fas fa-print"></i> 打印
                        </button>
                        <button class="btn primary small" onclick="BatchPrintModule.closeBatchPrintPreview()">
                            关闭
                        </button>
                    </div>
                </div>
                <div class="modal-body" id="batchPrintPreviewContent" style="height: calc(100% - 80px); overflow: auto;"></div>
            </div>
        </div>
        `;
    }

    static render() {
        this.loadOrders();
    }

    static loadOrders() {
        const container = document.getElementById('batchOrdersContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center" style="padding: 40px;">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p class="muted">正在加载申领单...</p>
            </div>
        `;

        console.log('[配送单打印] 开始请求API...');

        fetch('/api/print/orders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': '1'  // 使用ID 1（MANAGER）
            },
            credentials: 'include'
        })
            .then(response => {
                console.log('[配送单打印] API响应状态:', response.status);
                console.log('[配送单打印] API响应头:', response.headers);
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('[配送单打印] 错误响应内容:', text);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('[配送单打印] 收到数据类型:', typeof data);
                console.log('[配送单打印] 收到数据内容:', data);
                console.log('[配送单打印] 数据是否为数组:', Array.isArray(data));
                console.log('[配送单打印] 数据长度:', data ? data.length : '无');

                this.allGroupedOrders = data || [];
                console.log('[配送单打印] 设置allGroupedOrders:', this.allGroupedOrders);

                this.displayOrders(this.allGroupedOrders);
            })
            .catch(error => {
                console.error('[配送单打印] API调用失败:', error);
                console.error('[配送单打印] 错误堆栈:', error.stack);
                container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f56565; display: block; margin-bottom: 16px;"></i>
                        <p style="color: #f56565; margin: 0 0 8px 0; font-weight: 500;">加载失败</p>
                        <p style="color: #e53e3e; font-size: 14px; margin: 0 0 24px 0;">${error.message}</p>
                        <button class="btn primary" onclick="BatchPrintModule.loadOrders()">
                            <i class="fas fa-sync"></i> 重试
                        </button>
                    </div>
                `;
            });
    }

    static displayOrders(groupedOrders) {
        const container = document.getElementById('batchOrdersContainer');

        if (!groupedOrders || groupedOrders.length === 0) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px; text-align: center;">
                    <i class="fas fa-inbox" style="font-size: 64px; color: #cbd5e0; display: block; margin-bottom: 16px;"></i>
                    <p style="color: #718096; font-size: 16px; margin: 0 0 8px 0; font-weight: 500;">暂无可打印申领单</p>
                    <p style="color: #a0aec0; font-size: 14px; margin: 0;">当前没有待打印的申领单数据</p>
                    <button class="btn primary" onclick="BatchPrintModule.loadOrders()" style="margin-top: 24px;">
                        <i class="fas fa-sync"></i> 刷新
                    </button>
                </div>
            `;
            return;
        }

        // 添加样式
        if (!document.getElementById('batch-print-styles')) {
            const style = document.createElement('style');
            style.id = 'batch-print-styles';
            style.textContent = `
                .batch-orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
                    gap: 20px;
                    margin-top: 16px;
                }

                .batch-order-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .batch-order-card:hover {
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
                    transform: translateY(-3px);
                    border-color: #667eea;
                }

                .batch-order-card.selected {
                    border: 2px solid #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .batch-card-header {
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .batch-checkbox {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    accent-color: white;
                }

                .batch-employee-info {
                    flex: 1;
                }

                .batch-employee-name {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 4px;
                }

                .batch-employee-contact {
                    font-size: 13px;
                    opacity: 0.95;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .batch-employee-contact i {
                    font-size: 12px;
                }

                .batch-card-body {
                    padding: 20px;
                }

                .batch-stats-row {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .batch-stat-item {
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, #f8f9fc 0%, #eef2f7 100%);
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                }

                .batch-stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #667eea;
                    margin-bottom: 4px;
                }

                .batch-stat-label {
                    font-size: 12px;
                    color: #718096;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .batch-workstation {
                    padding: 10px 16px;
                    background: #f7fafc;
                    border-radius: 8px;
                    border-left: 3px solid #667eea;
                    margin-bottom: 16px;
                }

                .batch-workstation i {
                    color: #667eea;
                    margin-right: 8px;
                }

                .batch-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 16px;
                }

                @media (max-width: 768px) {
                    .batch-orders-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        let html = '<div class="batch-orders-grid">';

        groupedOrders.forEach((group, index) => {
            const employeeInfo = group.employeeInfo || {};
            const orders = group.orders || [];
            const totalDishes = orders.reduce((sum, order) => {
                return sum + (order.orderDetails ? order.orderDetails.length : 0);
            }, 0);

            const groupKey = `group-${index}`;
            const isSelected = this.selectedOrders.has(groupKey);

            html += `
                <div class="batch-order-card ${isSelected ? 'selected' : ''}" onclick="event.target.type !== 'checkbox' && BatchPrintModule.toggleCardSelection('${groupKey}')">
                    <div class="batch-card-header">
                        <input type="checkbox" 
                               class="batch-checkbox"
                               data-group-key="${groupKey}"
                               ${isSelected ? 'checked' : ''}
                               onchange="event.stopPropagation(); BatchPrintModule.toggleGroupSelection('${groupKey}', this)">
                        <div class="batch-employee-info">
                            <div class="batch-employee-name">
                                <i class="fas fa-user-circle"></i> ${employeeInfo.name || '未知员工'}
                            </div>
                            <div class="batch-employee-contact">
                                <span><i class="fas fa-phone"></i> ${employeeInfo.phone || '无'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="batch-card-body">
                        ${employeeInfo.workstation ? `
                        <div class="batch-workstation">
                            <i class="fas fa-map-marker-alt"></i>
                            <strong>工位：</strong>${employeeInfo.workstation}
                        </div>
                        ` : ''}
                        
                        <div class="batch-stats-row">
                            <div class="batch-stat-item">
                                <div class="batch-stat-value">${orders.length}</div>
                                <div class="batch-stat-label">申领单数</div>
                            </div>
                            <div class="batch-stat-item">
                                <div class="batch-stat-value">${totalDishes}</div>
                                <div class="batch-stat-label">用品数</div>
                            </div>
                        </div>
                        
                        <div class="batch-actions">
                            <button class="btn outline small" onclick="event.stopPropagation(); BatchPrintModule.previewGroup(${index})" style="flex: 1;">
                                <i class="fas fa-eye"></i> 预览
                            </button>
                            <button class="btn primary small" onclick="event.stopPropagation(); BatchPrintModule.printSingleGroup(${index})" style="flex: 1;">
                                <i class="fas fa-print"></i> 打印
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;
        this.updateSelectedCount();
    }

    static toggleCardSelection(groupKey) {
        const checkbox = document.querySelector(`input[data-group-key="${groupKey}"]`);
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            this.toggleGroupSelection(groupKey, checkbox);
        }
    }

    static printSingleGroup(groupIndex) {
        const group = this.allGroupedOrders[groupIndex];
        if (!group) return;

        const html = this.generateGroupPreviewHtml(group);
        this.showBatchPrintPreview(html);

        // 延迟调用打印
        setTimeout(() => window.print(), 300);
    }

    static toggleGroupSelection(groupKey, checkbox) {
        const card = checkbox.closest('.batch-order-card');
        if (checkbox.checked) {
            this.selectedOrders.add(groupKey);
            if (card) card.classList.add('selected');
        } else {
            this.selectedOrders.delete(groupKey);
            if (card) card.classList.remove('selected');
        }
        this.updateSelectedCount();
        this.updateSelectAllCheckbox();
    }

    static toggleSelectAll(checkbox) {
        const allCheckboxes = document.querySelectorAll('#batchOrdersContainer tbody input[type="checkbox"]');

        if (checkbox.checked) {
            allCheckboxes.forEach(cb => {
                const groupKey = cb.getAttribute('data-group-key');
                if (groupKey) {
                    cb.checked = true;
                    this.selectedOrders.add(groupKey);
                }
            });
        } else {
            allCheckboxes.forEach(cb => {
                const groupKey = cb.getAttribute('data-group-key');
                if (groupKey) {
                    cb.checked = false;
                    this.selectedOrders.delete(groupKey);
                }
            });
        }

        this.updateSelectedCount();
    }

    static updateSelectAllCheckbox() {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            const allCheckboxes = document.querySelectorAll('#batchOrdersContainer tbody input[type="checkbox"]');
            const checkedCount = document.querySelectorAll('#batchOrdersContainer tbody input[type="checkbox"]:checked').length;

            selectAll.checked = checkedCount === allCheckboxes.length && allCheckboxes.length > 0;
            selectAll.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
        }
    }

    static selectAllOrders() {
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
            this.toggleSelectAll(selectAllCheckbox);
        }
    }

    static deselectAllOrders() {
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            this.toggleSelectAll(selectAllCheckbox);
        }
    }

    static updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedOrders.size;
        }
    }

    static previewGroup(groupIndex) {
        const group = this.allGroupedOrders[groupIndex];
        if (!group) return;

        const html = this.generateGroupPreviewHtml(group);
        this.showBatchPrintPreview(html);
    }

    static generateGroupPreviewHtml(group) {
        const employeeInfo = group.employeeInfo || {};
        const orders = group.orders || [];

        let html = `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
                    <h2 style="margin: 0;">申领单领用单</h2>
                </div>
                <div style="margin-bottom: 20px;">
                    <p><strong>员工姓名：</strong>${employeeInfo.name || '未知'}</p>
                    <p><strong>联系电话：</strong>${employeeInfo.phone || '无'}</p>
                    <p><strong>工位信息：</strong>${employeeInfo.workstation || '无'}</p>
                </div>
        `;

        orders.forEach((order, index) => {
            const orderDetails = order.orderDetails || [];
            html += `
                <div style="margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0;">申领单 ${index + 1}: ${order.orderNumber}</h3>
                    <p><strong>提交申领时间：</strong>${order.createTime ? new Date(order.createTime).toLocaleString() : '未知'}</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">用品名称</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">数量</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">单位</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            orderDetails.forEach(detail => {
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${detail.dishName || '未知用品'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.quantity || 1}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detail.unit || '份'}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        html += `
                <div style="text-align: right; margin-top: 30px; font-size: 12px; color: #666;">
                    打印时间：${new Date().toLocaleString()}
                </div>
            </div>
        `;

        return html;
    }

    static batchPrint() {
        if (this.selectedOrders.size === 0) {
            alert('请先选择要打印的申领单');
            return;
        }

        // 生成所有选中申领单的预览
        let allHtml = '';
        this.selectedOrders.forEach(groupKey => {
            const groupIndex = parseInt(groupKey.replace('group-', ''));
            const group = this.allGroupedOrders[groupIndex];
            if (group) {
                allHtml += this.generateGroupPreviewHtml(group);
                allHtml += '<div style="page-break-after: always;"></div>';
            }
        });

        this.showBatchPrintPreview(allHtml);
    }

    static showBatchPrintPreview(htmlContent) {
        const modal = document.getElementById('batchPrintPreviewModal');
        const content = document.getElementById('batchPrintPreviewContent');

        content.innerHTML = htmlContent || '<p>无打印内容</p>';
        modal.style.display = 'block';
    }

    static closeBatchPrintPreview() {
        const modal = document.getElementById('batchPrintPreviewModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}
