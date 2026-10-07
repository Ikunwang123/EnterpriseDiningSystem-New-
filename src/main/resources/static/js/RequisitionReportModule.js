// src/main/resources/static/js/RequisitionReportModule.js
class RequisitionReportModule {
    static getTemplate() {
        const role = (currentUser?.role || 'STAFF').toUpperCase();
        const isManagerOrFinance = ['MANAGER', 'FINANCE', 'ADMIN'].includes(role);

        let html = `<div class="report-container">`;

        if (isManagerOrFinance) {
            html += `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title"><i class="fas fa-chart-bar me-1"></i> 月度领用统计总报表</div>
                        <div class="card-sub">按月份统计所有用品的领用数量和总金额</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="yearMonth">统计年月</label>
                        <input type="text" id="yearMonth" class="form-input" placeholder="格式：YYYY-MM（如 2025-12）" required>
                        <div id="yearMonthError" class="error-msg"></div>
                    </div>
                    <div class="form-actions" style="margin-top: 20px; text-align: right;">
                        <button type="button" class="btn primary medium" id="exportMonthlySales">
                            <i class="fas fa-file-excel me-1"></i> 导出 Excel
                        </button>
                    </div>
                </div>
            </div>`;
        }

        if (isManagerOrFinance) {
            html += `
            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <div>
                        <div class="card-title"><i class="fas fa-user-tie me-1"></i> 员工月度申领单汇总</div>
                        <div class="card-sub">查看指定员工在某月的全部申领单明细</div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="employeeId">员工ID</label>
                        <input type="text" id="employeeId" class="form-input" placeholder="请输入员工ID" required>
                        <div id="employeeIdError" class="error-msg"></div>
                    </div>
                    <div class="form-group">
                        <label for="empYearMonth">统计年月</label>
                        <input type="text" id="empYearMonth" class="form-input" placeholder="格式：YYYY-MM（如 2025-12）" required>
                        <div id="empYearMonthError" class="error-msg"></div>
                    </div>
                    <div class="form-actions" style="margin-top: 20px; text-align: right;">
                        <button type="button" class="btn primary medium" id="exportEmployeeSummary">
                            <i class="fas fa-file-excel me-1"></i> 导出 Excel
                        </button>
                    </div>
                </div>
            </div>`;
        }

        html += `
        <div class="card" style="margin-top: 24px;">
            <div class="card-header">
                <div>
                    <div class="card-title"><i class="fas fa-user me-1"></i> 员工个人月度统计</div>
                    <div class="card-sub">查看您本人在指定月份的申领记录</div>
                </div>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label for="personalYearMonth">统计年月</label>
                    <input type="text" id="personalYearMonth" class="form-input" placeholder="格式：YYYY-MM（如 2025-12）" required>
                    <div id="personalYearMonthError" class="error-msg"></div>
                </div>
                <div class="form-actions" style="margin-top: 20px; text-align: right;">
                    <button type="button" class="btn primary medium" id="exportPersonalSummary">
                        <i class="fas fa-file-excel me-1"></i> 导出个人月度报表
                    </button>
                </div>
            </div>
        </div>
        </div>`;

        return html;
    }

    static initialize() {
        document.getElementById('exportPersonalSummary')?.addEventListener('click', () => this.exportPersonalSummary());
        document.getElementById('exportMonthlySales')?.addEventListener('click', () => this.exportMonthlySales());
        document.getElementById('exportEmployeeSummary')?.addEventListener('click', () => this.exportEmployeeSummary());

        // 输入时自动清除错误提示
        ['yearMonth', 'empYearMonth', 'personalYearMonth', 'employeeId'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.clearError(id));
            }
        });
    }

    static clearError(inputId) {
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(inputId + 'Error');
        if (input) input.classList.remove('error');
        if (errorDiv) errorDiv.textContent = '';
    }

    static showError(inputId, message) {
        this.clearError(inputId);
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(inputId + 'Error');
        if (input) input.classList.add('error');
        if (errorDiv) errorDiv.textContent = message;
        showToast(message, 'error');
    }

    static exportMonthlySales() {
        const yearMonth = document.getElementById('yearMonth')?.value.trim() || '';
        if (!this.isValidYearMonth(yearMonth)) {
            this.showError('yearMonth', '请输入正确的年月格式：YYYY-MM（如 2025-12）');
            return;
        }
        this.clearError('yearMonth');
        const url = `/api/reports/export/monthly-sales?yearMonth=${encodeURIComponent(yearMonth)}`;
        this.downloadExcel(url, `月度领用统计总报表_${yearMonth}.xlsx`, `月度领用统计总报表 ${yearMonth} 导出成功`);
    }

    static async exportEmployeeSummary() {
        const employeeId = document.getElementById('employeeId')?.value.trim() || '';
        const yearMonth = document.getElementById('empYearMonth')?.value.trim() || '';

        let hasError = false;

        if (!employeeId || !/^\d+$/.test(employeeId) || parseInt(employeeId) <= 0) {
            this.showError('employeeId', '请输入有效的员工ID（正整数）');
            hasError = true;
        } else {
            this.clearError('employeeId');
        }

        if (!this.isValidYearMonth(yearMonth)) {
            this.showError('empYearMonth', '请输入正确的年月格式：YYYY-MM（如 2025-12）');
            hasError = true;
        } else {
            this.clearError('empYearMonth');
        }

        if (hasError) return;

        const button = document.getElementById('exportEmployeeSummary');
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> 校验中...';

        try {
            const response = await fetch(`/api/user/exists?id=${employeeId}`, { credentials: 'include' });

            if (!response.ok) {
                throw new Error('网络错误或权限不足');
            }

            const result = await response.json();

            // 正确判断后端返回的 code === 200
            if (result.code !== 200) {
                throw new Error(result.msg || '校验失败');
            }

            // data 在 result.data 中
            if (!result.data.exists) {
                this.showError('employeeId', `员工ID ${employeeId} 不存在，请检查输入`);
                return;
            }

            this.clearError('employeeId');

            const realName = result.data.realName || '未知员工';
            const deptName = result.data.deptName ? `（${result.data.deptName}）` : '';

            if (confirm(`确认导出员工【${realName}${deptName}】（ID: ${employeeId}）的 ${yearMonth} 月度申领单？`)) {
                const url = `/api/reports/export/employee-monthly?employeeId=${employeeId}&yearMonth=${yearMonth}`;
                this.downloadExcel(
                    url,
                    `员工月度申领单汇总_${realName}_${employeeId}_${yearMonth}.xlsx`,
                    `员工 ${realName} (${employeeId}) 月度申领单导出成功`
                );
            }
        } catch (error) {
            console.error('员工ID校验失败:', error);
            this.showError('employeeId', error.message || '员工ID校验失败：网络错误或服务异常');
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    static exportPersonalSummary() {
        const yearMonth = document.getElementById('personalYearMonth')?.value.trim() || '';
        if (!this.isValidYearMonth(yearMonth)) {
            this.showError('personalYearMonth', '请输入正确的年月格式：YYYY-MM（如 2025-12）');
            return;
        }
        this.clearError('personalYearMonth');
        const url = `/api/reports/export/personal-monthly?yearMonth=${encodeURIComponent(yearMonth)}`;
        this.downloadExcel(url, `个人月度申领单汇总_${yearMonth}.xlsx`, `个人月度申领单汇总 ${yearMonth} 导出成功`);
    }

    static isValidYearMonth(value) {
        if (!value) return false;
        const regex = /^(\d{4})-(0[1-9]|1[0-2])$/;
        if (!regex.test(value)) return false;
        const year = parseInt(value.split('-')[0]);
        const currentYear = new Date().getFullYear();
        return year >= 2020 && year <= currentYear + 1;
    }

    static downloadExcel(url, filename, successMessage) {
        fetch(url, { credentials: 'include' })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) throw new Error('登录已过期，请重新登录');
                    if (response.status === 403) throw new Error('权限不足，无法导出该报表');
                    throw new Error('下载失败');
                }
                return response.blob();
            })
            .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                document.body.removeChild(a);
                showToast(successMessage, 'success');
            })
            .catch(error => {
                console.error('导出失败:', error);
                showToast(error.message || '导出失败，请检查网络', 'error');
            });
    }
}