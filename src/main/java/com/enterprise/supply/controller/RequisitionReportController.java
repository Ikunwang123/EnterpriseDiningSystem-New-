package com.enterprise.supply.controller;

import com.enterprise.supply.service.RequisitionReportService;
import com.enterprise.supply.DTO.EmployeeMonthlyOrderDTO;
import com.enterprise.supply.DTO.MonthlySalesReportDTO;
import com.enterprise.supply.entity.User;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

// RequisitionReportController.java
@RestController
@RequestMapping("/api/reports")
public class RequisitionReportController {

    @Autowired
    private RequisitionReportService salesReportService;

    /**
     * 导出月度领用统计为 Excel
     */
    @GetMapping("/export/monthly-sales")
    public void exportMonthlySalesToExcel(
            @RequestParam String yearMonth,
            HttpServletResponse response,
            HttpSession session) throws IOException {
        // 权限验证
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null ||
                (!"ADMIN".equals(currentUser.getRole()) &&
                        !"FINANCE".equals(currentUser.getRole()) &&
                        !"MANAGER".equals(currentUser.getRole()))){
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "权限不足");
            return;
        }

        try {
            List<Object[]> reportData =
                    salesReportService.getMonthlySalesReport(yearMonth);
            BigDecimal totalRevenue =
                    salesReportService.calculateTotalRevenue(reportData);

            // 转换数据格式
            // 转换数据格式
            List<MonthlySalesReportDTO> reportDtoList = reportData.stream()
                    .map(data -> new MonthlySalesReportDTO(
                            (String) data[0],           // dishName
                            (String) data[1],           // unit
                            ((Number) data[2]).intValue(), // totalQuantity
                            (BigDecimal) data[3],       // unitPrice
                            (BigDecimal) data[4]        // totalAmount
                    ))
                    .collect(Collectors.toList());


            // 使用 try-with-resources 自动关闭 workbook
            try (Workbook workbook = salesReportService.generateMonthlySalesExcel(reportDtoList, totalRevenue)) {
                response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                response.setHeader("Content-Disposition",
                        "attachment; filename=monthly_sales_" + yearMonth + ".xlsx");

                workbook.write(response.getOutputStream());
            }
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "导出失败");
        }
    }


    /**
     * 导出员工月度申领单为Excel
     */
    @GetMapping("/export/employee-monthly")
    public void exportEmployeeMonthlyToExcel(
            @RequestParam Long employeeId,
            @RequestParam String yearMonth,
            HttpServletResponse response,
            HttpSession session) throws IOException {

        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null ||
                (!"ADMIN".equals(currentUser.getRole()) &&
                        !"FINANCE".equals(currentUser.getRole()) &&
                        !"MANAGER".equals(currentUser.getRole()))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "权限不足");
            return;
        }

        try {
            List<EmployeeMonthlyOrderDTO> orders =
                    salesReportService.getEmployeeMonthlyOrders(employeeId, yearMonth);

            String operatorName = (currentUser.getRealName() != null && !currentUser.getRealName().isEmpty())
                    ? currentUser.getRealName() : "未知操作员";

            Workbook workbook = salesReportService.generateEmployeeOrdersExcel(orders, yearMonth, operatorName);

            // ===== 下面是缺失的部分，补上即可 =====
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition",
                    "attachment; filename=employee_monthly_" + yearMonth + "_" + employeeId + ".xlsx");

            try (Workbook wb = workbook) {
                wb.write(response.getOutputStream());
                response.getOutputStream().flush();
            }
            // =====================================

        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "导出失败");
        }
    }

    /**
     * 导出个人月度统计为Excel
     */
    /**
     * 导出个人月度统计为Excel
     */
    @GetMapping("/export/personal-monthly")
    public void exportPersonalMonthlyToExcel(
            @RequestParam String yearMonth,
            HttpServletResponse response,
            HttpSession session) throws IOException {

        // 权限验证 - 用户必须登录（员工可导出自己）
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "用户未登录");
            return;
        }

        try {
            // 获取当前用户（员工）的月度申领单数据
            List<EmployeeMonthlyOrderDTO> orders =
                    salesReportService.getEmployeeMonthlyOrders(currentUser.getId(), yearMonth);

            // 操作员姓名：优先真实姓名，备用用户名
            String operatorName = (currentUser.getRealName() != null && !currentUser.getRealName().isEmpty())
                    ? currentUser.getRealName() : currentUser.getUsername();

            // 生成Excel工作簿
            Workbook workbook = salesReportService.generateEmployeeOrdersExcel(orders, yearMonth, operatorName);

            // ===== 关键：设置响应头和写入Excel（之前缺失的部分） =====
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8");
            response.setHeader("Content-Disposition",
                    "attachment; filename=personal_monthly_" + yearMonth + "_" + currentUser.getId() + ".xlsx");
            response.setCharacterEncoding("UTF-8");

            // 使用try-with-resources确保workbook正确关闭
            try (Workbook wb = workbook) {
                wb.write(response.getOutputStream());
                response.getOutputStream().flush();
            }
            // ===============================================================

        } catch (Exception e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "导出失败: " + e.getMessage());
        }
    }
}
