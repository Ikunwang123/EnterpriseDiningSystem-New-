// 用户管理模块
class UserModule {
    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-users me-1"></i> 用户管理</div>
                    <div class="card-sub">管理系统用户信息</div>
                </div>
                <div class="toolbar">
                    <button class="btn primary" onclick="UserModule.showAddUserModal()">
                        <i class="fas fa-plus"></i> 添加用户
                    </button>
                    <button class="btn outline" onclick="UserModule.importUsers()">
                        <i class="fas fa-file-upload"></i> 导入用户
                    </button>
                    <button class="btn outline" onclick="UserModule.exportUsers()">
                        <i class="fas fa-file-download"></i> 导出用户
                    </button>
                </div>
            </div>
            <div class="search-box">
                <input type="text" class="form-input" id="userSearchInput" placeholder="搜索用户名、姓名、部门...">
                <button class="btn primary" onclick="UserModule.searchUsers()">
                    <i class="fas fa-search"></i> 搜索
                </button>
            </div>
            <div id="userListContainer">
                <p class="muted">加载中...</p>
            </div>
            <div id="userPagination" class="pagination"></div>
        </div>
        `;
    }

    static initialize() {
        UserModule.currentPage = 0;
        UserModule.pageSize = 10;
        UserModule.keyword = '';
        UserModule.loadUserList();
        
        // 绑定搜索框回车事件
        document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                UserModule.searchUsers();
            }
        });
    }

    static loadUserList() {
        const url = `/api/user/list?page=${UserModule.currentPage}&size=${UserModule.pageSize}&keyword=${encodeURIComponent(UserModule.keyword)}`;
        
        fetch(url, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    UserModule.renderUserList(result.data);
                } else {
                    document.getElementById('userListContainer').innerHTML = '<p class="muted">加载失败: ' + (result.msg || '未知错误') + '</p>';
                }
            })
            .catch(error => {
                document.getElementById('userListContainer').innerHTML = '<p class="muted">加载失败: ' + error.message + '</p>';
            });
    }

    static renderUserList(data) {
        const container = document.getElementById('userListContainer');
        const users = data.users || [];
        const total = data.total || 0;
        const totalPages = data.totalPages || 0;

        if (users.length === 0) {
            container.innerHTML = '<p class="muted">暂无用户数据</p>';
            return;
        }

        const html = `
            <div class="table user-table">
                <div class="table-row head">
                    <div>ID</div>
                    <div>用户名</div>
                    <div>真实姓名</div>
                    <div>角色</div>
                    <div>部门</div>
                    <div>操作</div>
                </div>
                ${users.map(user => `
                    <div class="table-row">
                        <div>${user.id}</div>
                        <div>${user.username || ''}</div>
                        <div>${user.realName || ''}</div>
                        <div><span class="pill primary">${UserModule.getRoleName(user.role)}</span></div>
                        <div>${user.deptName || '-'}</div>
                        <div>
                            <button class="btn ghost mini" onclick="UserModule.editUser(${user.id})">编辑</button>
                            <button class="btn ghost mini" onclick="UserModule.deleteUser(${user.id})" style="color: #e53e3e;">删除</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.innerHTML = html;

        // 渲染分页
        UserModule.renderPagination(totalPages);
    }

    static renderPagination(totalPages) {
        const container = document.getElementById('userPagination');
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const currentPage = UserModule.currentPage;
        let html = '';

        // 上一页
        html += `<button class="btn outline mini" ${currentPage === 0 ? 'disabled' : ''} onclick="UserModule.goToPage(${currentPage - 1})">上一页</button>`;

        // 页码
        for (let i = 0; i < totalPages; i++) {
            if (i === currentPage) {
                html += `<button class="btn primary mini">${i + 1}</button>`;
            } else {
                html += `<button class="btn outline mini" onclick="UserModule.goToPage(${i})">${i + 1}</button>`;
            }
        }

        // 下一页
        html += `<button class="btn outline mini" ${currentPage >= totalPages - 1 ? 'disabled' : ''} onclick="UserModule.goToPage(${currentPage + 1})">下一页</button>`;

        container.innerHTML = html;
    }

    static goToPage(page) {
        UserModule.currentPage = page;
        UserModule.loadUserList();
    }

    static searchUsers() {
        UserModule.keyword = document.getElementById('userSearchInput').value.trim();
        UserModule.currentPage = 0;
        UserModule.loadUserList();
    }

    static getRoleName(role) {
        const roleMap = {
            'ADMIN': '超级管理员',
            'MANAGER': '后勤主管',
            'CHEF': '库存管理员',
            'DISPATCHER': '配送员',
            'FINANCE': '财务管理',
            'STAFF': '企业员工'
        };
        return roleMap[role] || role;
    }

    static showAddUserModal() {
        UserModule.showUserModal(null);
    }

    static editUser(userId) {
        fetch(`/api/user/${userId}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    UserModule.showUserModal(result.data);
                } else {
                    alert('获取用户信息失败: ' + (result.msg || '未知错误'));
                }
            })
            .catch(error => {
                alert('获取用户信息失败: ' + error.message);
            });
    }

    static showUserModal(user) {
        const isEdit = user !== null;
        const modalHtml = `
            <div class="modal" id="userModal">
                <div class="modal-overlay" onclick="UserModule.closeModal()"></div>
                <div class="modal-content" style="width: 500px;">
                    <div class="modal-header">
                        <h3>${isEdit ? '编辑用户' : '添加用户'}</h3>
                        <button class="modal-close" onclick="UserModule.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="userForm">
                            <input type="hidden" id="userId" value="${user ? user.id : ''}">
                            <div class="form-group">
                                <label class="form-label">用户名 *</label>
                                <input type="text" class="form-input" id="username" value="${user ? user.username : ''}" ${isEdit ? 'readonly' : ''} required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码 ${isEdit ? '(留空不修改)' : '*'}</label>
                                <input type="password" class="form-input" id="password" ${isEdit ? '' : 'required'}>
                            </div>
                            <div class="form-group">
                                <label class="form-label">真实姓名 *</label>
                                <input type="text" class="form-input" id="realName" value="${user ? user.realName : ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">角色 *</label>
                                <select class="form-input" id="role" required>
                                    <option value="STAFF" ${user && user.role === 'STAFF' ? 'selected' : ''}>企业员工</option>
                                    <option value="MANAGER" ${user && user.role === 'MANAGER' ? 'selected' : ''}>后勤主管</option>
                                    <option value="CHEF" ${user && user.role === 'CHEF' ? 'selected' : ''}>库存管理员</option>
                                    <option value="DISPATCHER" ${user && user.role === 'DISPATCHER' ? 'selected' : ''}>配送员</option>
                                    <option value="FINANCE" ${user && user.role === 'FINANCE' ? 'selected' : ''}>财务管理</option>
                                    <option value="ADMIN" ${user && user.role === 'ADMIN' ? 'selected' : ''}>超级管理员</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">部门</label>
                                <input type="text" class="form-input" id="deptName" value="${user ? (user.deptName || '') : ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">工位</label>
                                <input type="text" class="form-input" id="location" value="${user ? (user.location || '') : ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">电话</label>
                                <input type="text" class="form-input" id="phone" value="${user ? (user.phone || '') : ''}">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn primary">${isEdit ? '更新' : '添加'}</button>
                                <button type="button" class="btn outline" onclick="UserModule.closeModal()">取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('userForm').addEventListener('submit', UserModule.handleSubmit);
    }

    static handleSubmit(e) {
        e.preventDefault();
        const userId = document.getElementById('userId').value;
        const isEdit = userId !== '';

        const userData = {
            realName: document.getElementById('realName').value.trim(),
            role: document.getElementById('role').value,
            deptName: document.getElementById('deptName').value.trim() || null,
            location: document.getElementById('location').value.trim() || null,
            phone: document.getElementById('phone').value.trim() || null
        };

        // 编辑时：如果密码不为空才更新密码
        // 添加时：必须有密码
        const password = document.getElementById('password').value.trim();
        if (isEdit) {
            userData.id = parseInt(userId);
            // 编辑时，只有密码不为空才更新
            if (password) {
                userData.password = password;
            }
        } else {
            // 添加时，必须有密码
            userData.username = document.getElementById('username').value.trim();
            userData.password = password || '123456';
        }

        const url = isEdit ? '/api/user/update' : '/api/user/add';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    alert(isEdit ? '更新成功' : '添加成功');
                    UserModule.closeModal();
                    UserModule.loadUserList();
                } else {
                    alert('操作失败: ' + (result.msg || '未知错误'));
                }
            })
            .catch(error => {
                alert('操作失败: ' + error.message);
            });
    }

    static deleteUser(userId) {
        if (!confirm('确定要删除该用户吗？')) {
            return;
        }

        fetch(`/api/user/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    alert('删除成功');
                    UserModule.loadUserList();
                } else {
                    alert('删除失败: ' + (result.msg || '未知错误'));
                }
            })
            .catch(error => {
                alert('删除失败: ' + error.message);
            });
    }

    static importUsers() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xls,.xlsx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            fetch('/api/user/import', {
                method: 'POST',
                credentials: 'include',
                body: formData
            })
                .then(response => response.json())
                .then(result => {
                    if (result.code === 200 && result.data) {
                        const data = result.data;
                        alert(`导入完成！\n成功: ${data.successCount}条\n失败: ${data.errorCount}条\n${data.errors && data.errors.length > 0 ? '\n错误详情:\n' + data.errors.join('\n') : ''}`);
                        UserModule.loadUserList();
                    } else {
                        alert('导入失败: ' + (result.msg || '未知错误'));
                    }
                })
                .catch(error => {
                    alert('导入失败: ' + error.message);
                });
        };
        input.click();
    }

    static exportUsers() {
        // 使用fetch下载文件，正确处理文件流响应
        fetch('/api/user/export', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => {
                // 检查响应状态
                if (!response.ok) {
                    // 如果是错误响应，尝试解析JSON错误信息
                    return response.text().then(text => {
                        try {
                            const data = JSON.parse(text);
                            alert('导出失败: ' + (data.msg || '未知错误'));
                        } catch (e) {
                            alert('导出失败: HTTP ' + response.status);
                        }
                        throw new Error('导出失败');
                    });
                }
                
                // 获取文件名
                const contentDisposition = response.headers.get('Content-Disposition') || '';
                let filename = '用户列表.xlsx';
                if (contentDisposition) {
                    const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition);
                    if (matches && matches[1]) {
                        filename = decodeURIComponent(matches[1]);
                    } else {
                        const matches2 = /filename="(.+)"/.exec(contentDisposition);
                        if (matches2 && matches2[1]) {
                            filename = matches2[1];
                        }
                    }
                }
                
                // 转换为blob并下载
                return response.blob().then(blob => {
                    // 检查blob大小，如果太小可能是错误信息
                    if (blob.size < 100) {
                        return blob.text().then(text => {
                            try {
                                const data = JSON.parse(text);
                                alert('导出失败: ' + (data.msg || '未知错误'));
                                throw new Error('导出失败');
                            } catch (e) {
                                if (e.message && e.message.includes('导出失败')) {
                                    throw e;
                                }
                                alert('导出失败: 文件大小异常');
                                throw new Error('导出失败');
                            }
                        });
                    }
                    
                    // 文件大小正常，创建下载链接
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    
                    // 清理
                    setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    }, 100);
                });
            })
            .catch(error => {
                // 只有在不是"导出失败"的错误时才显示
                // "Failed to fetch"错误可能是因为浏览器已经处理了下载，忽略它
                if (error.message && !error.message.includes('导出失败') && !error.message.includes('Failed to fetch')) {
                    console.error('导出错误:', error);
                    alert('导出失败: ' + (error.message || '未知错误'));
                }
            });
    }

    static closeModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.remove();
        }
    }
}

