package com.enterprise.supply.service;

import com.enterprise.supply.DTO.MonthlySalesReportDTO;
import com.enterprise.supply.entity.*;
import com.enterprise.supply.DTO.EmployeeMonthlyOrderDTO;
import com.enterprise.supply.repository.RequisitionItemRepository;
import com.enterprise.supply.repository.RequisitionRepository;
import com.enterprise.supply.repository.UserRepository;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.stream.Collectors;
import com.enterprise.supply.DTO.RequisitionItemDTO;

// RequisitionReportService.java
@Service
public class RequisitionReportService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RequisitionRepository orderRepository;

    @Autowired
    private RequisitionItemRepository orderItemRepository;

    /**
     * 获取月度领用统计报表数据
     */
    public List<Object[]> getMonthlySalesReport(String yearMonth) {
        // 解析年月参数
        String[] parts = yearMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        return orderItemRepository.findMonthlySalesReport(year, month);
    }

    /**
     * 计算月度总领用金额
     */
    /**
     * 计算月度总领用金额
     */
    public BigDecimal calculateTotalRevenue(List<Object[]> reportData) {
        return reportData.stream()
                .map(data -> (BigDecimal) data[4]) // 假设索引4为totalAmount字段
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 获取员工月度申领单
     */
    /**
     * 获取员工月度申领单
     */
    public List<EmployeeMonthlyOrderDTO> getEmployeeMonthlyOrders(Long employeeId, String yearMonth) {
        String[] parts = yearMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        List<Requisition> orders = orderRepository.findEmployeeMonthlyOrders(employeeId, year, month);

        if (orders == null) {
            orders = new ArrayList<>();
        }
        // 只查询一次用户表获取姓名、部门、电话
        User employee = userRepository.findById(employeeId).orElse(null);
        String realName = (employee != null) ? employee.getRealName() : "未知用户";
        String deptName = (employee != null && employee.getDeptName() != null) ? employee.getDeptName() : "";
        String phone    = (employee != null && employee.getPhone() != null) ? employee.getPhone() : "";

        if (orders.isEmpty()) {
            return new ArrayList<>();  // 明确返回空列表
        }
        return orders.stream().map(order -> {
            EmployeeMonthlyOrderDTO dto = new EmployeeMonthlyOrderDTO();
            dto.setOrderId(order.getId());
            if (order.getOrderTime() != null) {
                dto.setOrderTime(order.getOrderTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            }
            dto.setTotalAmount(order.getTotalAmount());

            // 填充员工信息（每条申领单都带上）
            dto.setRealName(realName);
            dto.setDeptName(deptName);
            dto.setPhone(phone);

            List<RequisitionItem> items = orderItemRepository.findByOrderId(order.getId());
            List<RequisitionItemDTO> itemDTOs = items.stream().map(item -> {
                RequisitionItemDTO itemDTO = new RequisitionItemDTO();
                itemDTO.setDishName(item.getDishName());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setUnitPrice(item.getUnitPrice());
                itemDTO.setSubtotal(item.getSubtotal());
                return itemDTO;
            }).collect(Collectors.toList());

            dto.setItems(itemDTOs);
            return dto;
        }).collect(Collectors.toList());
    }


    /**
     * 生成月度领用统计Excel
     */
    /**
     * 生成月度领用统计Excel
     */
    public Workbook generateMonthlySalesExcel(List<MonthlySalesReportDTO> reportData,
                                              BigDecimal totalRevenue) {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("月度领用统计");

        // 创建表头
        Row headerRow = sheet.createRow(0);
        String[] headers = {"用品名", "单位", "总数量", "单价", "总金额"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        // 填充数据
        int rowNum = 1;
        for (MonthlySalesReportDTO data : reportData) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(data.getDishName());
            row.createCell(1).setCellValue(data.getUnit());
            row.createCell(2).setCellValue(data.getTotalQuantity());
            row.createCell(3).setCellValue(data.getUnitPrice().doubleValue());
            row.createCell(4).setCellValue(data.getTotalAmount().doubleValue());
        }

        // 添加总计行
        Row totalRow = sheet.createRow(rowNum);
        totalRow.createCell(3).setCellValue("月度总领用金额:");
        totalRow.createCell(4).setCellValue(totalRevenue.doubleValue());

        // 自动调整列宽
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        return workbook;
    }
    /**
     * 生成员工申领单Excel
     */
    public Workbook generateEmployeeOrdersExcel(List<EmployeeMonthlyOrderDTO> orders, String yearMonth, String operatorName) {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("员工月度申领单汇总");

        // ==================== 样式定义（增强边框） ====================
        Font titleFont = workbook.createFont();
        titleFont.setFontHeightInPoints((short) 20);
        titleFont.setBold(true);

        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(titleFont);
        titleStyle.setAlignment(HorizontalAlignment.CENTER);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        Font infoFont = workbook.createFont();
        infoFont.setFontHeightInPoints((short) 11);

        CellStyle infoStyle = workbook.createCellStyle();
        infoStyle.setFont(infoFont);

        // 表头样式（灰底 + 加粗 + 完整边框）
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 12);

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);

        // 数据单元格样式（完整边框 + 居中）
        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setAlignment(HorizontalAlignment.CENTER);
        dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        dataStyle.setBorderTop(BorderStyle.THIN);
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);

        // 用品名左对齐（但仍有边框）
        CellStyle leftAlignStyle = workbook.createCellStyle();
        leftAlignStyle.cloneStyleFrom(dataStyle);
        leftAlignStyle.setAlignment(HorizontalAlignment.LEFT);

        // 金额右对齐（带边框）
        CellStyle amountStyle = workbook.createCellStyle();
        amountStyle.cloneStyleFrom(dataStyle);
        amountStyle.setAlignment(HorizontalAlignment.RIGHT);

        // 合计行样式
        CellStyle totalLabelStyle = workbook.createCellStyle();
        totalLabelStyle.cloneStyleFrom(headerStyle);
        totalLabelStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle totalAmountStyle = workbook.createCellStyle();
        totalAmountStyle.cloneStyleFrom(amountStyle);
        totalAmountStyle.setFont(headerFont);

        // ==================== 填充内容 ====================
        int rowNum = 0;

        // 标题
        Row titleRow = sheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("员工月度申领单汇总");
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));
        titleRow.setHeightInPoints(50);

        rowNum++; // 空行

        // 员工信息
        String realName = orders.isEmpty() ? "未知" : orders.get(0).getRealName();
        String deptName = orders.isEmpty() ? "" : orders.get(0).getDeptName();
        String phone    = orders.isEmpty() ? "" : orders.get(0).getPhone();

        Row infoRow1 = sheet.createRow(rowNum++);
        infoRow1.createCell(0).setCellValue("员工： " + realName);
        infoRow1.createCell(3).setCellValue("统计月份： " + yearMonth);
        infoRow1.getCell(0).setCellStyle(infoStyle);
        infoRow1.getCell(3).setCellStyle(infoStyle);

        Row infoRow2 = sheet.createRow(rowNum++);
        infoRow2.createCell(0).setCellValue("部门： " + deptName);
        infoRow2.createCell(3).setCellValue("电话： " + phone);
        infoRow2.getCell(0).setCellStyle(infoStyle);
        infoRow2.getCell(3).setCellStyle(infoStyle);

        rowNum += 2; // 空行

        // 表头
        Row headerRow = sheet.createRow(rowNum++);
        String[] headers = {"申领单号", "提交申领时间", "用品名", "数量", "单价", "小计"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // 数据行 + 合计
        BigDecimal grandTotal = BigDecimal.ZERO;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (EmployeeMonthlyOrderDTO order : orders) {
            for (RequisitionItemDTO item : order.getItems()) {
                Row dataRow = sheet.createRow(rowNum++);
                dataRow.createCell(0).setCellValue(order.getOrderId());
                dataRow.createCell(1).setCellValue(order.getOrderTime().format(formatter));
                dataRow.createCell(2).setCellValue(item.getDishName());
                dataRow.createCell(3).setCellValue(item.getQuantity());

                // 修复：unitPrice 为 null 时使用 0.00
                BigDecimal unitPrice = item.getUnitPrice();
                double unitPriceValue = (unitPrice != null) ? unitPrice.setScale(2, RoundingMode.HALF_UP).doubleValue() : 0.00;
                dataRow.createCell(4).setCellValue(unitPriceValue);

                // 修复：subtotal 为 null 时使用 0.00（核心修复）
                BigDecimal subtotal = item.getSubtotal();
                double subtotalValue = (subtotal != null) ? subtotal.setScale(2, RoundingMode.HALF_UP).doubleValue() : 0.00;
                dataRow.createCell(5).setCellValue(subtotalValue);

                // 样式
                dataRow.getCell(0).setCellStyle(dataStyle);
                dataRow.getCell(1).setCellStyle(dataStyle);
                dataRow.getCell(2).setCellStyle(leftAlignStyle);
                dataRow.getCell(3).setCellStyle(dataStyle);
                dataRow.getCell(4).setCellStyle(amountStyle);
                dataRow.getCell(5).setCellStyle(amountStyle);

                // 合计安全累加
                grandTotal = grandTotal.add(subtotal != null ? subtotal : BigDecimal.ZERO);
            }
        }

        // 合计行
        Row totalRow = sheet.createRow(rowNum++);
        totalRow.createCell(4).setCellValue("合计金额：");
        totalRow.createCell(5).setCellValue(grandTotal.setScale(2, RoundingMode.HALF_UP).doubleValue());
        totalRow.getCell(4).setCellStyle(headerStyle);
        totalRow.getCell(5).setCellStyle(amountStyle);

        rowNum += 2;

        // 页脚
        Row footerRow = sheet.createRow(rowNum++);
        footerRow.createCell(0).setCellValue("操作员： " + operatorName);
        footerRow.createCell(3).setCellValue("生成时间： " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        footerRow.getCell(0).setCellStyle(infoStyle);
        footerRow.getCell(3).setCellStyle(infoStyle);

        // 列宽调整
        for (int i = 0; i < 6; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 1200);
        }

        return workbook;
    }
}
