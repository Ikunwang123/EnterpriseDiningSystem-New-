// 总览模块
class OverviewModule {
    static getTemplate() {
        return `
        <div class="grid cards-4">
            <div class="card stat">
                <div class="stat-label">今日申领单数</div>
                <div class="stat-value" id="statOrders">-</div>
                <div class="stat-trend info">等待数据加载</div>
            </div>
            <div class="card stat">
                <div class="stat-label">今日领用金额</div>
                <div class="stat-value" id="statRevenue">-</div>
                <div class="stat-trend up">等待数据加载</div>
            </div>
            <div class="card stat">
                <div class="stat-label">待处理申领单</div>
                <div class="stat-value" id="statPending">-</div>
                <div class="stat-trend warn">等待数据加载</div>
            </div>
            <div class="card stat">
                <div class="stat-label">活跃用户</div>
                <div class="stat-value" id="statUsers">-</div>
                <div class="stat-trend info">等待数据加载</div>
            </div>
        </div>
        <div class="grid grid-2">
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title"><i class="fas fa-clock me-1"></i> 最近申领单</div>
                        <div class="card-sub">最新提交的申领单记录</div>
                    </div>
                </div>
                <div id="recentOrders">
                    <p class="muted">等待数据加载...</p>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title"><i class="fas fa-info-circle me-1"></i> 系统状态</div>
                        <div class="card-sub">当前系统运行状态</div>
                    </div>
                </div>
                <ul class="list">
                    <li>
                        <span>申领截止时间</span>
                        <span class="pill info" id="cutoffTime">09:00</span>
                    </li>
                    <li>
                        <span>领用开始时间</span>
                        <span class="pill info" id="serveTime">11:30</span>
                    </li>
                    <li>
                        <span>当前状态</span>
                        <span class="pill success" id="systemStatus">正常运行</span>
                    </li>
                </ul>
            </div>
        </div>
        `;
    }

    static initialize() {
        // 初始化总览数据
        OverviewModule.loadOverviewData();
    }

    // 加载总览数据
    static loadOverviewData() {
        // 加载统计数据
        fetch('/api/dashboard/stats', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    const stats = result.data;
                    document.getElementById('statOrders').textContent = stats.todayOrders || 0;
                    document.getElementById('statRevenue').textContent = '¥' + (stats.todayRevenue || 0).toFixed(2);
                    document.getElementById('statPending').textContent = stats.pendingOrders || 0;
                    document.getElementById('statUsers').textContent = stats.activeUsers || 0;
                } else {
                    this.setDefaultStats();
                }
            })
            .catch(() => {
                this.setDefaultStats();
            });
        
        // 加载最近申领单
        fetch('/api/dashboard/recent-orders?limit=10', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    this.renderRecentOrders(result.data);
                } else {
                    document.getElementById('recentOrders').innerHTML = '<p class="muted">暂无申领单数据</p>';
                }
            })
            .catch(() => {
                document.getElementById('recentOrders').innerHTML = '<p class="muted">加载失败</p>';
            });
        
        // 加载系统设置
        fetch('/api/settings/all', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    const settings = result.data;
                    document.getElementById('cutoffTime').textContent = settings.ORDER_CUTOFF_TIME || '09:00';
                    document.getElementById('serveTime').textContent = settings.SERVE_START_TIME || '11:30';
                }
            })
            .catch(() => {
                // 使用默认值
            });
    }
    
    // 设置默认统计数据
    static setDefaultStats() {
        document.getElementById('statOrders').textContent = '0';
        document.getElementById('statRevenue').textContent = '¥0.00';
        document.getElementById('statPending').textContent = '0';
        document.getElementById('statUsers').textContent = '0';
    }
    
    // 渲染最近申领单列表
    static renderRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="muted">暂无申领单数据</p>';
            return;
        }
        
        const html = `
            <div class="list">
                ${orders.map(order => `
                    <li>
                        <div>
                            <div style="font-weight: 500; color: #1a202c;">${order.orderNo || 'N/A'}</div>
                            <div style="font-size: 12px; color: #718096; margin-top: 2px;">${order.createTime || ''}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: #667eea;">¥${(order.totalAmount || 0).toFixed(2)}</div>
                            <span class="pill ${this.getStatusPillClass(order.status)}">${order.statusText || '未知'}</span>
                        </div>
                    </li>
                `).join('')}
            </div>
        `;
        container.innerHTML = html;
    }
    
    // 获取申领单状态对应的pill样式类
    static getStatusPillClass(status) {
        switch (status) {
            case 0: return 'warn';
            case 1: return 'info';
            case 2: return 'primary';
            case 3: return 'success';
            default: return 'ghost';
        }
    }
}

// 页面加载完成后初始化模块
document.addEventListener('DOMContentLoaded', function() {
    // 只有当当前视图为overview时才初始化
    if (window.currentView === 'overview') {
        OverviewModule.initialize();
    }
});