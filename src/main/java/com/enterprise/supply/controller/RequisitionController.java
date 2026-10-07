package com.enterprise.supply.controller;

import com.enterprise.supply.common.Result;
import com.enterprise.supply.entity.Requisition;
import com.enterprise.supply.entity.RequisitionItem;
import com.enterprise.supply.entity.User;
import com.enterprise.supply.repository.RequisitionItemRepository;
import com.enterprise.supply.repository.RequisitionRepository;
import com.enterprise.supply.service.CreateRequisitionRequest;
import com.enterprise.supply.service.RequisitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dining")
@CrossOrigin
public class RequisitionController {

    @Autowired
    private RequisitionRepository orderRepository;

    @Autowired
    private RequisitionItemRepository orderItemRepository;

    @Autowired
    private RequisitionService orderService;

    @Autowired
    private com.enterprise.supply.service.AvailabilityPlanService availabilityPlanService;

    // 获取今日领用计划
    @GetMapping("/menu/today")
    public Result<List<Map<String, Object>>> getTodayMenu() {
        try {
            List<Map<String, Object>> menuItems = orderService.getTodayMenuDTO();
            return Result.success(menuItems);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // 获取「可申领的计划日期」列表（供申领页做日期切换）
    @GetMapping("/menu/available-dates")
    public Result<List<String>> getAvailablePlanDates() {
        try {
            return Result.success(availabilityPlanService.getPublishedPlanDates());
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 取指定日期的可申领用品。
     *
     * 与 /menu/today 返回**完全相同的字段结构**，只是日期由调用方指定。
     * 申领页切换日期时用它，前端因此不需要再写一段"把计划实体转成用品结构"的兼容代码。
     */
    @GetMapping("/menu/list")
    public Result<List<Map<String, Object>>> getMenuListByDate(@RequestParam String date) {
        try {
            return Result.success(orderService.getPublishedPlanItems(date));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // 获取目标申领日期信息
    @GetMapping("/order/target-date")
    public Result<Map<String, Object>> getTargetOrderDate() {
        try {
            // 统一调用 Service 的目标日期计算，避免与提交时的校验规则不一致。
            // 原实现是在这里另写一份「固定 11:30」的判断：两处规则一旦跑偏，
            // 就会出现「页面让按明天建计划、提交却按今天校验」从而申领失败的问题。
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate targetDate = orderService.getTargetOrderDate();

            // 文案按与实际日期的关系生成，不再假设"只能是今天或明天"，
            // 因为关闭时间限制时目标日期可能是更晚的、已发布的计划日期。
            String displayText;
            if (targetDate.equals(today)) {
                displayText = "今日领用计划 (" + targetDate + ")";
            } else if (targetDate.equals(today.plusDays(1))) {
                displayText = "明日领用计划 (" + targetDate + ")";
            } else {
                displayText = "领用计划 (" + targetDate + ")";
            }

            Map<String, Object> result = new HashMap<>();
            result.put("targetDate", targetDate.toString());
            result.put("isTomorrow", targetDate.equals(today.plusDays(1)));
            result.put("displayText", displayText);
            result.put("currentTime", java.time.LocalDateTime.now().toString());
            result.put("availableDates", availabilityPlanService.getPublishedPlanDates());
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // 提交申领单
    @PostMapping("/order/submit")
    public Result<Map<String, Object>> submitOrder(@RequestBody CreateRequisitionRequest request, HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error("未登录");
        }

        try {
            Requisition order = orderService.createOrder(request, String.valueOf(currentUser.getId()));
            Map<String, Object> data = new HashMap<>();
            data.put("orderId", order.getId());
            data.put("orderNo", order.getOrderNo());
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取当前登录用户的申领单列表
     * 支持筛选：
     * - status: 0(待备货) / 1(已完成) / 2(已取消) （可选）
     * - date: yyyy-MM-dd （可选，匹配申领单日期）
     */
    @GetMapping("/my-requisitions")
    @ResponseBody
    public Result<List<Map<String, Object>>> getMyOrders(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpSession session) {

        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return Result.error("未登录");
        }

        Long userId = currentUser.getId();

        // 查询当前用户的申领单（倒序）
        List<Requisition> orders = orderRepository.findByUserIdOrderByCreateTimeDesc(userId);

        // 筛选：状态
        if (status != null) {
            orders = orders.stream()
                    .filter(o -> o.getStatus() != null && o.getStatus().equals(status))
                    .collect(Collectors.toList());
        }

        // 筛选：日期（匹配 order.date 或 createTime.toLocalDate()）
        if (date != null) {
            orders = orders.stream()
                    .filter(o -> {
                        if (o.getDate() != null) {
                            return o.getDate().isEqual(date);
                        } else if (o.getCreateTime() != null) {
                            return LocalDate.ofInstant(o.getCreateTime().toInstant(), java.time.ZoneId.systemDefault())
                                    .isEqual(date);
                        }
                        return false;
                    })
                    .collect(Collectors.toList());
        }

        // 组装返回数据
        List<Map<String, Object>> orderList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (Requisition order : orders) {
            Map<String, Object> orderMap = new HashMap<>();
            // 确保申领单号正确返回
            String orderNo = order.getOrderNo() != null ? order.getOrderNo() : order.getOrderNumber();
            orderMap.put("orderNo", orderNo);
            orderMap.put("orderId", order.getId()); // 添加申领单ID，方便后续操作
            orderMap.put("createTime", order.getCreateTime() != null
                    ? LocalDateTime.ofInstant(order.getCreateTime().toInstant(), java.time.ZoneId.systemDefault())
                            .format(formatter)
                    : "");
            orderMap.put("status", order.getStatus() != null ? order.getStatus() : 0); // 返回整数 0-4，前端处理显示
            orderMap.put("totalAmount", order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);
            // 前端「我的申领」会读 order.date（无创建时间时作兜底显示），这里一并返回，避免显示 undefined
            orderMap.put("date", order.getDate() != null ? order.getDate().toString() : "");

            // 查询申领单明细 - 确保正确查询
            List<RequisitionItem> items = orderItemRepository.findByOrderId(order.getId());
            List<Map<String, Object>> itemList = new ArrayList<>();

            if (items != null && !items.isEmpty()) {
                itemList = items.stream().map(item -> {
                    Map<String, Object> itemMap = new HashMap<>();
                    // 确保用品名称正确
                    String dishName = item.getDishName() != null ? item.getDishName()
                            : (item.getMenuItemName() != null ? item.getMenuItemName() : "未知用品");
                    // 前端读取的是 item.itemName（见 RequisitionModule），
                    // 曾经只返回 dishName，导致"我的申领"里用品名显示为 undefined。
                    // 两个键都返回：itemName 给当前前端，dishName 保留兼容旧调用方。
                    itemMap.put("itemName", dishName);
                    itemMap.put("dishName", dishName);
                    itemMap.put("quantity", item.getQuantity() != null ? item.getQuantity() : 0);
                    itemMap.put("unit", item.getUnit() != null ? item.getUnit() : "份");
                    itemMap.put("unitPrice", item.getPrice() != null ? item.getPrice().doubleValue() : 0.0);
                    // 计算小计
                    BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal()
                            : (item.getPrice() != null && item.getQuantity() != null
                                    ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                                    : BigDecimal.ZERO);
                    itemMap.put("subtotal", subtotal.doubleValue());
                    return itemMap;
                }).collect(Collectors.toList());
            }

            orderMap.put("items", itemList);
            orderList.add(orderMap);
        }

        return Result.success(orderList);
    }
}
