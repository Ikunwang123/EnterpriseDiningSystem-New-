// Mock Data (Simulating Backend)
const mockDishes = [
    { id: 1, name: '古井烧鹅饭', price: 22.00, category: '五邑特色', image: 'https://images.unsplash.com/photo-1574484284008-86d47dc7b905?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', desc: '皮脆肉嫩，独特烟熏味' },
    { id: 2, name: '外海竹升面', price: 12.00, category: '五邑特色', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', desc: '口感爽滑弹牙' },
    { id: 3, name: '台山黄鳝饭', price: 38.00, category: '五邑特色', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', desc: '鲜美无比' },
    { id: 4, name: '黑椒牛排意面', price: 28.00, category: '西式简餐', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', desc: '西式简餐首选' },
    { id: 5, name: '香煎鸡扒饭', price: 18.00, category: '西式简餐', image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', desc: '外酥里嫩' },
    { id: 6, name: '陈皮红豆沙', price: 6.00, category: '甜点办公设备', image: 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', desc: '清热解毒' },
];

let cart = [];
let currentUser = null;
let currentRole = 'STAFF';
// 用于存储已选用品
let selectedRecipes = [];
let allRecipes = []; // 用于存储所有用品数据，便于搜索过滤

// 添加全局变量跟踪当前视图
window.currentView = 'overview';
// 当前角色可见的菜单项（由 applyRoleFilter 填充，按页面顺序）
window.visibleViews = [];

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkAuth().then(() => {
        // 登录验证通过后才设置导航和渲染视图
        setupNavigation();
        // 渲染「当前角色第一个可见的菜单」，而不是写死总览：
        // 总览只对 MANAGER/ADMIN 开放，普通员工看不到它，
        // 若仍固定渲染总览，员工登录后会落到总览页并顶着空菜单，看起来像页面坏了。
        renderView(getDefaultView());
    }).catch(() => {
        // 验证失败会跳转到登录页，这里不需要做任何事
    });
});

// 取落地页：当前角色可见的第一个菜单
function getDefaultView() {
    if (window.visibleViews && window.visibleViews.length > 0) {
        return window.visibleViews[0];
    }
    // 兜底（正常情况下不会走到）
    return 'overview';
}

// 让指定菜单高亮。
// 原来 index.html 里把「总览」写成了 class="nav-link active"，
// 但总览现在只给 MANAGER/ADMIN，所以改为渲染后动态设置高亮。
function markActiveNav(view) {
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-view') === view);
    });
}

// 检查登录状态
function checkAuth() {
    return new Promise((resolve, reject) => {
        // 调用后端接口验证 Session 是否有效
        fetch('/api/user/profile', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success' && result.user) {
                    // Session 有效，更新用户信息
                    currentUser = result.user;
                    currentRole = (currentUser.role || 'STAFF').toUpperCase();
                    // 保存到本地存储（用于前端显示）
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateUserInfo();
                    // applyRoleFilter 会返回「当前角色可见的菜单」，存起来供落地页使用
                    window.visibleViews = applyRoleFilter();
                    resolve(); // 验证成功
                } else {
                    // Session 无效，清除本地存储并跳转到登录页
                    localStorage.removeItem('currentUser');
                    sessionStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                    reject(); // 验证失败
                }
            })
            .catch(error => {
                console.error('验证登录状态失败', error);
                // 网络错误也跳转到登录页
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
                reject(); // 验证失败
            });
    });
}

// 更新用户信息显示
function updateUserInfo() {
    const name = currentUser.realName || currentUser.name || '用户';
    const role = currentUser.role || 'STAFF';
    document.getElementById('userName').textContent = name;
    document.getElementById('userRole').textContent = getRoleName(role);
}

// 获取角色中文名
// 当前系统角色：
//   ADMIN      系统管理员 —— 全部功能
//   MANAGER    后勤主管   —— 用品、计划、备货汇总、配送打印、用户与设置
//   DISPATCHER 配送员     —— 只看配送单打印与总览
//   STAFF      普通员工   —— 申领、查看自己的申领单
// CHEF（库管）已移除，其职责并入 MANAGER；FINANCE（财务）已并入 ADMIN。
// 下面保留对旧角色值的兼容映射，避免数据库里残留旧值导致界面显示英文。
function getRoleName(role) {
    const roleMap = {
        'ADMIN': '系统管理员',
        'MANAGER': '后勤主管',
        'DISPATCHER': '配送员',
        'STAFF': '普通员工',
        // 兼容历史数据
        'CHEF': '后勤主管',
        'FINANCE': '系统管理员'
    };
    return roleMap[role] || role;
}

// 根据角色过滤导航，并**返回当前角色可见的菜单项（按页面顺序）**。
//
// 为什么要有返回值：落地页需要"第一个可见菜单"。
// 早期实现是另外遍历一次 DOM 并用 link.offsetParent !== null 判断是否可见，
// 但 offsetParent 依赖真实布局，环境稍有不同（侧栏被隐藏、无头浏览器、打印模式等）
// 就可能对所有元素都返回 null，于是函数一路兜底到 'overview'，
// 结果普通员工登录后仍然落在总览页 —— 这正是"员工还是看到总览"的原因。
// 现在改为：过滤时顺手收集，可见与否只看我们自己设置的行内 display，结果确定可靠。
function applyRoleFilter() {
    const navLinks = document.querySelectorAll('.nav-link');
    // 注意：要取「所有」分组，不能只取带 data-require 的。
    // 第一个分组（核心功能）没有 data-require，如果只查带属性的，
    // 它永远不会被隐藏，普通员工就会看到一个只有标题、没有菜单项的空分组。
    const navGroups = document.querySelectorAll('.nav-group');
    // ADMIN角色拥有全部权限，显示所有模块
    const isAdmin = currentRole === 'ADMIN';

    const visibleViews = [];

    navLinks.forEach(link => {
        const roles = link.getAttribute('data-roles') || '';
        const ok = isAdmin || roles === 'ALL' || roles.split(',').includes(currentRole);
        link.style.display = ok ? 'flex' : 'none';
        if (ok) visibleViews.push(link.getAttribute('data-view'));
    });

    navGroups.forEach(group => {
        if (isAdmin) {
            group.style.display = 'flex';
            return;
        }
        const requireRoles = group.getAttribute('data-require');
        // 先按 data-require 判断分组本身是否对该角色开放
        let groupAllowed = true;
        if (requireRoles) {
            groupAllowed = requireRoles.split(',').includes(currentRole);
        }
        // 再兜一层：如果组内所有菜单项都被隐藏，这个组也没必要显示
        // （否则会留下一个只有分组标题的空壳）
        let hasVisibleLink = false;
        group.querySelectorAll('.nav-link').forEach(l => {
            if (l.style.display !== 'none') hasVisibleLink = true;
        });
        group.style.display = (groupAllowed && hasVisibleLink) ? 'flex' : 'none';
    });

    return visibleViews;
}

// 设置导航事件
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            // 高亮由 renderView 内的 markActiveNav 统一处理
            renderView(view);
        });
    });
}

// 渲染视图
function renderView(view) {
    // 更新当前视图
    window.currentView = view;
    // 同步左侧菜单高亮（落地页与点击切换都要生效）
    markActiveNav(view);
    const event = new CustomEvent('viewChange', {
        detail: { view: view }
    });
    document.dispatchEvent(event);

    // 根据视图类型决定如何渲染
    let content;
    if (view === 'overview') {
        content = OverviewModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        OverviewModule.initialize();
    } else if (view === 'recipe') {
        content = SupplyItemModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        SupplyItemModule.initialize();
    } else if (view === 'menu-manage') {
        content = AvailabilityPlanModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        AvailabilityPlanModule.initialize();
    } else if (view === 'menu') {
        content = AvailabilityPlanBrowseModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        AvailabilityPlanBrowseModule.initialize();
    } else if (view === 'order') {
        content = RequisitionModule.getTemplate();
        const container = document.getElementById('contentArea');
        container.innerHTML = content;
        RequisitionModule.render(container);
    } else if (view === 'blanket') {
        content = SummarySheetModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        SummarySheetModule.render();
    } else if (view === 'batch-print') {
        content = BatchPrintModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        BatchPrintModule.render();
    } else if (view === 'users') {
        content = UserModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        UserModule.initialize();
    } else if (view === 'settings') {
        content = SettingsModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        SettingsModule.initialize();
    } else if (view === 'report') {
        // 使用与其它模块一致的调用方式
        content = RequisitionReportModule.getTemplate();
        document.getElementById('contentArea').innerHTML = content;
        RequisitionReportModule.initialize();
    } else {
        content = '<div class="card"><p class="muted">功能开发中...</p></div>';
        document.getElementById('contentArea').innerHTML = content;
    }

    updatePageInfo(view);
}

// 更新页面信息
function updatePageInfo(view) {
    const pageInfo = {
        'overview': { title: '总览', desc: '系统概览与数据统计' },
        'menu': { title: '领用计划', desc: '浏览今日领用计划并提交申领' },
        'order': { title: '我的申领', desc: '查看您的申领单记录' },
        'recipe': { title: '用品目录', desc: '管理后勤基础用品' },
        'menu-manage': { title: '计划管理', desc: '创建和管理领用计划' },
        'blanket': { title: '汇总领用单', desc: '生成汇总领用单用于仓库' },
        'batch-print': { title: '配送单打印', desc: '批量打印领用单' },
        'report': { title: '领用统计', desc: '查看领用报表和统计' },
        'users': { title: '用户管理', desc: '管理系统用户' },
        'settings': { title: '系统设置', desc: '配置系统参数' }
    };
    const info = pageInfo[view] || { title: '页面', desc: '' };
    document.getElementById('pageTitle').textContent = info.title;
    document.getElementById('pageDesc').textContent = info.desc;
}

// 退出登录
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        fetch('/api/user/logout', {
            credentials: 'include'
        })
            .then(() => {
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            })
            .catch(() => {
                // 即使请求失败也清除本地存储并跳转
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
    }
}

// Toast 通知函数
function showToast(message, type) {
    // 移除已有的 toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建新的 toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;

    document.body.appendChild(toast);

    // 显示 toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

