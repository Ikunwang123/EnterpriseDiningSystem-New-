// src/main/java/com/enterprise/dining/service/impl/PrintServiceImpl.java
package com.enterprise.supply.service.impl;

import com.enterprise.supply.DTO.EmployeeInfoDTO;
import com.enterprise.supply.DTO.GroupedOrderDTO;
import com.enterprise.supply.DTO.RequisitionDetailDTO;
import com.enterprise.supply.entity.*;
import com.enterprise.supply.repository.EmployeeRepository;
import com.enterprise.supply.repository.RequisitionRepository;
import com.enterprise.supply.repository.RequisitionItemRepository;
import com.enterprise.supply.service.PrintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PrintServiceImpl implements PrintService {

    @Autowired
    private RequisitionRepository orderRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RequisitionItemRepository orderItemRepository;

    @Override
    public List<GroupedOrderDTO> getPendingOrdersForPrinting(User currentUser) {
        // 权限检查：配送员负责打印，后勤主管与系统管理员也允许（管理端可见该菜单）
        String role = currentUser != null && currentUser.getRole() != null
                ? currentUser.getRole().toUpperCase().trim()
                : null;
        if (!"DISPATCHER".equals(role) && !"MANAGER".equals(role) && !"ADMIN".equals(role)) {
            throw new SecurityException("无权限访问此功能");
        }

        System.out.println("[配送单打印] 开始查询申领单...");

        // 查询所有未取消的申领单（当前状态枚举：0 待备货 / 1 已完成 / 2 已取消）
        List<Requisition> allOrders = orderRepository.findByStatusIn(Arrays.asList(0, 1));
        System.out.println("[配送单打印] 查询到申领单数量: " + allOrders.size());

        if (allOrders.isEmpty()) {
            System.out.println("[配送单打印] 没有找到任何申领单");
            return new ArrayList<>();
        }

        // 按员工分组
        Map<String, List<Requisition>> ordersByEmployee = allOrders.stream()
                .filter(order -> order.getEmployeeId() != null)
                .collect(Collectors.groupingBy(Requisition::getEmployeeId));

        System.out.println("[配送单打印] 员工分组数: " + ordersByEmployee.size());

        // 构造返回结果
        List<GroupedOrderDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Requisition>> entry : ordersByEmployee.entrySet()) {
            String employeeId = entry.getKey();
            List<Requisition> orders = entry.getValue();

            System.out.println("[配送单打印] 处理员工ID: " + employeeId + ", 申领单数: " + orders.size());

            // 查询员工信息
            Optional<Employee> employeeOptional = employeeRepository.findById(employeeId);
            if (!employeeOptional.isPresent()) {
                System.out.println("[配送单打印] 未找到员工信息: " + employeeId);
                continue;
            }

            Employee employee = employeeOptional.get();
            EmployeeInfoDTO employeeInfo = new EmployeeInfoDTO(
                    employee.getName() != null ? employee.getName() : "未知",
                    employee.getPhone() != null ? employee.getPhone() : "",
                    employee.getWorkstation() != null ? employee.getWorkstation() : "");

            // 转换申领单信息
            List<GroupedOrderDTO.OrderInfo> orderInfos = new ArrayList<>();

            for (Requisition order : orders) {
                // 手动查询申领明细
                List<RequisitionItem> items = orderItemRepository.findByOrderId(order.getId());
                System.out.println("[配送单打印] 申领单 " + order.getOrderNo() + " 的申领明细数: " + items.size());

                // 转换申领明细
                List<RequisitionDetailDTO> orderDetails = items.stream()
                        .map(item -> {
                            RequisitionDetailDTO dto = new RequisitionDetailDTO(
                                    item.getDishName() != null ? item.getDishName()
                                            : (item.getMenuItemName() != null ? item.getMenuItemName() : "未知用品"),
                                    item.getQuantity() != null ? item.getQuantity() : 1,
                                    item.getUnit() != null ? item.getUnit() : "份");
                            dto.setPrice(item.getPrice());
                            dto.setSubtotal(item.getSubtotal());
                            return dto;
                        })
                        .collect(Collectors.toList());

                // 转换创建时间
                LocalDateTime createTime = order.getCreateTime() != null
                        ? order.getCreateTime().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                        : LocalDateTime.now();

                // 创建OrderInfo
                GroupedOrderDTO.OrderInfo orderInfo = new GroupedOrderDTO.OrderInfo(
                        order.getOrderNo(),
                        null, // deliveryPersonId
                        orderDetails,
                        createTime);
                orderInfo.setStatus(order.getStatus());
                orderInfos.add(orderInfo);
            }

            // 转换employeeId为Long
            Long employeeIdLong = null;
            try {
                employeeIdLong = Long.parseLong(employeeId);
            } catch (NumberFormatException e) {
                System.err.println("[配送单打印] employeeId转换失败: " + employeeId);
            }

            GroupedOrderDTO groupedOrder = new GroupedOrderDTO(employeeIdLong, employeeInfo, orderInfos);
            result.add(groupedOrder);

            System.out.println("[配送单打印] 添加分组: 员工 " + employee.getName() + ", 申领单数 " + orderInfos.size());
        }

        System.out.println("[配送单打印] 最终返回分组数: " + result.size());
        return result;
    }
}
