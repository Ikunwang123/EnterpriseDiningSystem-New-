// 汇总领用单模块
class SummarySheetModule {
    static selectedDate = new Date().toISOString().split('T')[0];
    static currentSummary = null; // 存储当前汇总数据

    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-file-invoice me-1"></i> 汇总领用单</div>
                    <div class="card-sub">申领截止后生成汇总领用单，按用品汇总数量和金额</div>
                </div>
                <div class="header-actions">
                    <input type="date" id="blanketDate" class="form-input small" value="${this.selectedDate}" onchange="SummarySheetModule.onDateChange()">
                    <button class="btn primary small" onclick="SummarySheetModule.generateSummary()">
                        <i class="fas fa-calculator"></i> 生成汇总
                    </button>
                    <button class="btn outline small" onclick="SummarySheetModule.printSummary()">
                        <i class="fas fa-print"></i> 打印
                    </button>
                </div>
            </div>
            
            <div class="card-body">
                <div id="blanketContainer">
                    <div class="text-center" style="padding: 40px;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p class="muted">加载中...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 打印预览模态框 -->
        <div id="printPreviewModal" class="modal" style="display: none;">
            <div class="modal-overlay" onclick="SummarySheetModule.closePrintPreview()"></div>
            <div class="modal-content" style="width: 90vw; max-width: 1200px; height: 90vh;">
                <div class="modal-header">
                    <h3><i class="fas fa-print me-1"></i> 打印预览</h3>
                    <div>
                        <button class="btn outline small" onclick="window.print()">
                            <i class="fas fa-print"></i> 打印
                        </button>
                        <button class="btn primary small" onclick="SummarySheetModule.closePrintPreview()">
                            关闭
                        </button>
                    </div>
                </div>
                <div class="modal-body" id="printPreviewContent" style="height: calc(100% - 80px); overflow: auto;"></div>
            </div>
        </div>
        `;
    }

    static render() {
        this.loadBlanketOrder();
    }

    static onDateChange() {
        this.selectedDate = document.getElementById('blanketDate').value;
        this.loadBlanketOrder();
    }

    static loadBlanketOrder() {
        const dateInput = document.getElementById('blanketDate');
        const date = dateInput ? dateInput.value : this.selectedDate;

        // 显示加载状态
        const container = document.getElementById('blanketContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p class="muted">加载中...</p>
                </div>
            `;
        }

        // 从数据库获取数据
        fetch(`/api/summaries/${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 后端在「该日期没有汇总」时返回的是 null，HTTP 200 但响应体为空。
                // 直接 response.json() 会因空字符串解析失败而抛异常，
                // 结果被下面的 catch 误报成"数据库连接失败"。
                // 这里先取文本自行判断，空响应就按「无数据」处理。
                return response.text();
            })
            .then(text => {
                let data = null;
                if (text && text.trim() !== '' && text.trim() !== 'null') {
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('汇总数据解析失败:', e, text);
                        data = null;
                    }
                }
                if (data) {
                    this.currentSummary = data;
                    this.displayBlanketOrder(data, date);
                } else {
                    // 没有汇总数据属于正常情况（该日期还没有申领），显示空状态而不是报错
                    this.currentSummary = null;
                    this.displayBlanketOrder(null, date);
                }
            })
            .catch(error => {
                console.error('汇总接口调用失败:', error);
                // 只有真正请求失败（网络不通、HTTP 非 2xx）才提示错误
                this.showError('加载汇总领用单失败，请检查应用与数据库是否正常运行');
            });
    }

    static displayBlanketOrder(summary, date) {
        const container = document.getElementById('blanketContainer');

        if (!summary || (!summary.totalQuantity && !summary.totalAmount)) {
            this.showBlanketOrderEmpty(date);
            return;
        }

        // 添加样式
        if (!document.getElementById('blanket-order-styles')) {
            const style = document.createElement('style');
            style.id = 'blanket-order-styles';
            style.textContent = `
                .blanket-summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .summary-stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 24px;
                    border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
                    color: white;
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .summary-stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 28px rgba(102, 126, 234, 0.3);
                }

                .stat-card-label {
                    font-size: 13px;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }

                .stat-card-value {
                    font-size: 36px;
                    font-weight: 700;
                    line-height: 1.2;
                }

                .blanket-table-wrapper {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    border: 1px solid #e2e8f0;
                }

                .blanket-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .blanket-table thead {
                    background: linear-gradient(to right, #f8fafc, #eef2f7);
                }

                .blanket-table th {
                    padding: 16px 20px;
                    text-align: left;
                    font-weight: 600;
                    color: #4a5568;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid #e2e8f0;
                }

                .blanket-table tbody tr {
                    border-bottom: 1px solid #f0f3f7;
                    transition: all 0.2s ease;
                }

                .blanket-table tbody tr:hover {
                    background: linear-gradient(to right, #f8f9fc, #ffffff);
                    transform: scale(1.01);
                }

                .blanket-table td {
                    padding: 16px 20px;
                    color: #2d3748;
                    font-size: 14px;
                }

                .blanket-table tbody td:nth-child(1) {
                    font-weight: 600;
                    color: #1a202c;
                }

                .blanket-table tbody td:nth-child(2) {
                    color: #4a5568;
                }

                .blanket-table tbody td:nth-child(3) {
                    color: #667eea;
                    font-weight: 600;
                }

                .blanket-table tbody td:nth-child(4) {
                    font-weight: 600;
                }

                .blanket-table tbody td:nth-child(5) {
                    color: #48bb78;
                    font-weight: 700;
                }

                .blanket-table tbody td:nth-child(6) {
                    color: #718096;
                    font-size: 13px;
                }

                .blanket-table tfoot {
                    background: linear-gradient(135deg, #f7fafc 0%, #eef2f7 100%);
                }

                .blanket-table tfoot td {
                    padding: 20px;
                    font-weight: 700;
                    color: #1a202c;
                    font-size: 16px;
                    border-top: 3px solid #667eea;
                }
            `;
            document.head.appendChild(style);
        }

        let html = `
            <div style="margin: -8px 0 20px;">
                <div style="display: inline-flex; align-items: center; padding: 8px 16px; background: linear-gradient(135deg, #eef2f7, #f8fafc); border-radius: 8px; font-size: 14px; color: #4a5568;">
                    <i class="fas fa-calendar-alt" style="margin-right: 8px; color: #667eea;"></i>
                    <strong style="color: #1a202c; margin-right: 6px;">${date}</strong>
                    <span>汇总领用单数据</span>
                </div>
            </div>

            <div class="blanket-summary-cards">
                <div class="summary-stat-card">
                    <div class="stat-card-label">
                        <i class="fas fa-sort-amount-up"></i> 总数量
                    </div>
                    <div class="stat-card-value">${summary.totalQuantity || 0}</div>
                </div>
                <div class="summary-stat-card" style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);">
                    <div class="stat-card-label">
                        <i class="fas fa-dollar-sign"></i> 总金额
                    </div>
                    <div class="stat-card-value">¥${summary.totalAmount ? summary.totalAmount.toFixed(2) : '0.00'}</div>
                </div>
            </div>
            
            <div class="blanket-table-wrapper">
                <table class="blanket-table">
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>用品名称</th>
                            <th>单价</th>
                            <th>数量</th>
                            <th>小计</th>
                            <th>占比</th>
                        </tr>
                    </thead>
                    <tbody id="blanketTableBody"></tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2"><i class="fas fa-calculator" style="margin-right: 8px; color: #667eea;"></i>总计</td>
                            <td></td>
                            <td>${summary.totalQuantity || 0}</td>
                            <td>¥${summary.totalAmount ? summary.totalAmount.toFixed(2) : '0.00'}</td>
                            <td>100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        container.innerHTML = html;

        // 加载用品详情
        if (this.currentSummary && this.currentSummary.items) {
            // 如果已有数据，则直接显示
            this.displayMenuItemSummaries(this.currentSummary.items);
        } else {
            // 否则尝试从API加载
            this.loadMenuItemSummaries(date);
        }
    }

    static loadMenuItemSummaries(date) {
        // 从数据库获取数据
        fetch(`/api/summaries/${date}/items`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.displayMenuItemSummaries(data);
            })
            .catch(error => {
                console.error('计划项目API调用失败:', error);
                // 数据库连接失败时显示错误信息而不是模拟数据
                this.showError('无法从数据库获取用品数据');
            });
    }

    static displayMenuItemSummaries(items) {
        const tbody = document.getElementById('blanketTableBody');

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">无用品数据</td></tr>';
            return;
        }

        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);

        let html = '';
        items.forEach((item, index) => {
            const percentage = totalAmount > 0 ? ((item.totalPrice / totalAmount) * 100).toFixed(1) : 0;

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.planItemName}</td>
                    <td>¥${item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                    <td>${item.quantity}</td>
                    <td>¥${item.totalPrice ? item.totalPrice.toFixed(2) : '0.00'}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    static showBlanketOrderEmpty(date) {
        const container = document.getElementById('blanketContainer');
        container.innerHTML = `
            <div class="text-center" style="padding: 40px;">
                <i class="fas fa-file-alt fa-2x" style="color: #cbd5e0;"></i>
                <p class="muted" style="margin-top: 10px;">${date} 暂无汇总领用单数据</p>
                <button class="btn primary" onclick="SummarySheetModule.generateSummary()">
                    生成汇总数据
                </button>
            </div>
        `;
    }

    static generateSummary() {
        const date = document.getElementById('blanketDate').value;

        if (!confirm(`确定要为 ${date} 生成汇总领用单吗？`)) return;

        // 从数据库生成汇总
        fetch(`/api/summaries/generate?date=${date}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data) {
                    showToast('汇总领用单生成成功', 'success');
                    this.loadBlanketOrder();
                } else {
                    showToast('生成失败', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('汇总领用单生成失败', 'error');
            });
    }

    static printSummary() {
        const date = document.getElementById('blanketDate').value;

        // 从数据库获取打印内容
        fetch(`/api/summaries/${date}/print`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(htmlContent => {
                if (htmlContent) {
                    this.showPrintPreview(htmlContent);
                } else {
                    showToast('获取打印内容为空', 'error');
                    this.generatePrintPreview(date);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // 数据库连接失败时使用当前数据生成预览
                this.generatePrintPreview(date);
            });
    }

    static generatePrintPreview(date) {
        // 生成打印预览HTML
        let html = `
            <div class="print-page">
                <div class="print-header">
                    <h2>汇总领用单汇总表</h2>
                    <p>日期: ${date}</p>
                </div>
                
                <table class="blanket-table">
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>用品名称</th>
                            <th>单价</th>
                            <th>数量</th>
                            <th>小计</th>
                            <th>占比</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (this.currentSummary && this.currentSummary.items) {
            const items = this.currentSummary.items;
            const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);

            items.forEach((item, index) => {
                const percentage = totalAmount > 0 ? ((item.totalPrice / totalAmount) * 100).toFixed(1) : 0;

                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.planItemName}</td>
                        <td>¥${item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                        <td>${item.quantity}</td>
                        <td>¥${item.totalPrice ? item.totalPrice.toFixed(2) : '0.00'}</td>
                        <td>${percentage}%</td>
                    </tr>
                `;
            });
        } else {
            // 如果没有数据，显示提示信息
            html += '<tr><td colspan="6" class="text-center">无数据可打印</td></tr>';
        }

        html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2"><strong>总计</strong></td>
                            <td></td>
                            <td><strong>${this.currentSummary?.totalQuantity || 0}</strong></td>
                            <td><strong>¥${this.currentSummary?.totalAmount ? this.currentSummary.totalAmount.toFixed(2) : '0.00'}</strong></td>
                            <td><strong>100%</strong></td>
                        </tr>
                    </tfoot>
                </table>
                
                <div class="print-footer">
                    <p>生成时间: ${new Date().toLocaleString()}</p>
                    <p>Generated by 办公用品申领系统</p>
                </div>
            </div>
        `;

        this.showPrintPreview(html);
    }

    static showPrintPreview(htmlContent) {
        const modal = document.getElementById('printPreviewModal');
        const content = document.getElementById('printPreviewContent');

        content.innerHTML = htmlContent || '<p>无打印内容</p>';
        modal.style.display = 'block';
    }

    static closePrintPreview() {
        document.getElementById('printPreviewModal').style.display = 'none';
    }

    static showError(message) {
        const container = document.getElementById('blanketContainer');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}
