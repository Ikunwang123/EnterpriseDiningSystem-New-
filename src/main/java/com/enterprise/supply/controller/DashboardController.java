package com.enterprise.supply.controller;

import com.enterprise.supply.common.Result;
import com.enterprise.supply.entity.Requisition;
import com.enterprise.supply.repository.RequisitionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * 总览仪表盘控制器
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private RequisitionRepository orderRepository;

    /**
     * 获取总览统计数据
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats(HttpSession session) {
        try {
            Map<String, Object> stats = new HashMap<>();

            // 今日申领单数
            Long todayOrders = orderRepository.countTodayOrders();
            stats.put("todayOrders", todayOrders != null ? todayOrders : 0L);

            // 今日领用金额
            BigDecimal todayRevenue = orderRepository.sumTodayRevenue();
            stats.put("todayRevenue", todayRevenue != null ? todayRevenue : BigDecimal.ZERO);

            // 待处理申领单数
            Long pendingOrders = orderRepository.countPendingOrders();
            stats.put("pendingOrders", pendingOrders != null ? pendingOrders : 0L);

            // 活跃用户数（今日提交申领的用户数）
            Long activeUsers = orderRepository.countActiveUsersToday();
            stats.put("activeUsers", activeUsers != null ? activeUsers : 0L);

            return Result.success(stats);
        } catch (Exception e) {
            return Result.error("获取统计数据失败: " + e.getMessage());
        }
    }

    /**
     * 获取最近申领单列表
     */
    @GetMapping("/recent-orders")
    public Result<List<Map<String, Object>>> getRecentOrders(
            @RequestParam(defaultValue = "10") int limit,
            HttpSession session) {
        try {
            List<Requisition> orders = orderRepository.findRecentOrders(PageRequest.of(0, limit));

            List<Map<String, Object>> result = new ArrayList<>();
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

            for (Requisition order : orders) {
                Map<String, Object> orderMap = new HashMap<>();
                orderMap.put("id", order.getId());
                orderMap.put("orderNo", order.getOrderNo());
                orderMap.put("userId", order.getUserId());
                orderMap.put("totalAmount", order.getTotalAmount());

                // 修复：处理可能的Integer类型status
                Object statusObj = order.getStatus();
                String statusStr;
                if (statusObj instanceof Integer) {
                    statusStr = String.valueOf(statusObj);
                } else if (statusObj instanceof String) {
                    statusStr = (String) statusObj;
                } else {
                    statusStr = statusObj != null ? statusObj.toString() : null;
                }

                orderMap.put("status", statusStr);
                orderMap.put("statusText", getStatusText(statusStr));
                orderMap.put("createTime", order.getCreateTime() != null ? sdf.format(order.getCreateTime()) : "");
                result.add(orderMap);
            }

            return Result.success(result);
        } catch (Exception e) {
            return Result.error("获取最近申领单失败: " + e.getMessage());
        }
    }

    /**
     * 获取申领单状态文本（处理 Integer 或 String 类型的 status）
     */
    private String getStatusText(Object status) {
        if (status == null) return "未知";

        String statusStr;
        if (status instanceof Integer) {
            statusStr = String.valueOf(status);
        } else if (status instanceof String) {
            statusStr = (String) status;
        } else {
            statusStr = status.toString();
        }

        switch (statusStr) {
            case "0":
                return "待制作";
            case "1":
                return "制作中";
            case "2":
                return "已配送";
            case "3":
                return "已完成";
            default:
                return "未知";
        }
    }
}
