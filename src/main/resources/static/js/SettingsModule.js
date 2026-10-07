// 系统设置模块
class SettingsModule {
    static getTemplate() {
        return `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-cog me-1"></i> 系统设置</div>
                    <div class="card-sub">配置系统运行参数</div>
                </div>
            </div>
            <form id="settingsForm">
                <div class="form-group">
                    <label class="form-label">申领截止时间</label>
                    <input type="time" class="form-input" id="orderCutoffTime" required>
                    <div class="card-sub" style="margin-top: 4px;">员工必须在此时间之前完成申领</div>
                </div>
                <div class="form-group">
                    <label class="form-label">领用开始时间</label>
                    <input type="time" class="form-input" id="serveStartTime" required>
                    <div class="card-sub" style="margin-top: 4px;">配送员可以开始领用的时间</div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn primary">保存设置</button>
                    <button type="button" class="btn outline" onclick="SettingsModule.resetSettings()">重置</button>
                </div>
            </form>
        </div>
        `;
    }

    static initialize() {
        SettingsModule.loadSettings();
        document.getElementById('settingsForm').addEventListener('submit', SettingsModule.handleSubmit);
    }

    static loadSettings() {
        fetch('/api/settings/all', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200 && result.data) {
                    const settings = result.data;
                    // 将时间格式从 HH:mm 转换为 HTML time input 格式
                    if (settings.ORDER_CUTOFF_TIME) {
                        document.getElementById('orderCutoffTime').value = settings.ORDER_CUTOFF_TIME;
                    }
                    if (settings.SERVE_START_TIME) {
                        document.getElementById('serveStartTime').value = settings.SERVE_START_TIME;
                    }
                } else {
                    alert('加载设置失败: ' + (result.msg || '未知错误'));
                }
            })
            .catch(error => {
                alert('加载设置失败: ' + error.message);
            });
    }

    static handleSubmit(e) {
        e.preventDefault();
        
        const settings = {
            ORDER_CUTOFF_TIME: document.getElementById('orderCutoffTime').value,
            SERVE_START_TIME: document.getElementById('serveStartTime').value
        };

        fetch('/api/settings/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(settings)
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    alert('设置保存成功');
                } else {
                    alert('保存失败: ' + (result.msg || '未知错误'));
                }
            })
            .catch(error => {
                alert('保存失败: ' + error.message);
            });
    }

    static resetSettings() {
        if (!confirm('确定要重置为默认设置吗？')) {
            return;
        }
        
        const defaultSettings = {
            ORDER_CUTOFF_TIME: '09:00',
            SERVE_START_TIME: '11:30'
        };
        
        fetch('/api/settings/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(defaultSettings)
        })
            .then(response => response.json())
            .then(result => {
                if (result.code === 200) {
                    alert('已重置为默认设置');
                    SettingsModule.loadSettings();
                } else {
                    alert('重置失败: ' + (result.msg || '未知错误'));
                }
            })
            .catch(error => {
                alert('重置失败: ' + error.message);
            });
    }
}

