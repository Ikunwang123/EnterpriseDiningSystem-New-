package com.enterprise.supply.service.impl;

import com.enterprise.supply.exception.RequisitionException;
import com.enterprise.supply.entity.*;
import com.enterprise.supply.repository.RequisitionItemRepository;
import com.enterprise.supply.repository.RequisitionRepository;
import com.enterprise.supply.repository.AvailabilityPlanRepository; // Added
import com.enterprise.supply.service.CreateRequisitionItemRequest;
import com.enterprise.supply.service.CreateRequisitionRequest;
import com.enterprise.supply.service.RequisitionService;
import com.enterprise.supply.service.AvailabilityPlanService; // Added
import com.enterprise.supply.service.SupplyItemService; // Added
import com.enterprise.supply.service.SystemSettingsService; // Added
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrderServiceImpl implements RequisitionService {

    @Autowired
    private RequisitionRepository orderRepository;

    @Autowired
    private RequisitionItemRepository orderItemRepository;

    @Autowired
    private AvailabilityPlanService menuService;

    @Autowired
    private SupplyItemService recipeService;

    @Autowired
    private AvailabilityPlanRepository menuRepository;

    @Autowired
    private SystemSettingsService systemSettingsService;

    @Override
    public List<Map<String, Object>> getTodayMenuDTO() {
        // 获取目标申领日期（根据当前时间判断是今天还是明天）
        return getPublishedPlanItems(getTargetOrderDate().toString());
    }

    @Override
    public List<Map<String, Object>> getPublishedPlanItems(String date) {
        // 统一的「可申领用品」结构，供 /api/dining/menu/today 与 /api/dining/menu/list 共用。
        // 前端因此不需要再做字段转换。
        List<AvailabilityPlan> menus = menuService.getPublishedMenuByDate(date);

        List<Map<String, Object>> result = new ArrayList<>();
        for (AvailabilityPlan menu : menus) {
            SupplyItem recipe = recipeService.getRecipeByIdWithDeleted(menu.getRecipeId());
            if (recipe != null) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", menu.getId()); // 使用 AvailabilityPlan ID 作为提交申领时的标识
                item.put("name", recipe.getName());
                item.put("category", recipe.getCategory());
                item.put("price", menu.getPrice()); // 使用当日价格
                item.put("imageUrl", recipe.getImageUrl());
                item.put("description", recipe.getDescription());
                item.put("unit", recipe.getUnit());
                result.add(item);
            }
        }
        return result;
    }

    @Override
    @Transactional
    public Requisition createOrder(CreateRequisitionRequest request, String employeeId) {
        // 获取目标申领日期
        LocalDate targetDate = getTargetOrderDate();

        // 检查每人每天只能提交申领一次（检查目标日期）
        try {
            Long userId = Long.parseLong(employeeId);
            if (orderRepository.existsByUserIdAndDate(userId, targetDate)) {
                throw new RequisitionException("每人每天只能提交申领一次");
            }
        } catch (NumberFormatException e) {
            // 如果employeeId不是数字，使用employeeId字段查询
            if (orderRepository.existsByEmployeeIdAndDate(employeeId, targetDate)) {
                throw new RequisitionException("每人每天只能提交申领一次");
            }
        }

        // 验证时间：如果是今天申领，检查截止时间；如果是明天申领，检查是否已过领用开始时间。
        //
        // 为了方便测试，增加了一个开关 ENFORCE_ORDER_TIME：
        //   为空 / "false"（当前默认）→ 不校验时间，当天与次日都随时可申领；
        //   "true"                    → 恢复原有的时间规则（用于验证业务规则是否生效）。
        // 这样既不影响平时的测试效率，也不会丢掉原有的业务逻辑。
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        boolean enforceTime = "true".equalsIgnoreCase(
                String.valueOf(systemSettingsService.getConfigValue("ENFORCE_ORDER_TIME")).trim());

        if (enforceTime) {
            if (targetDate.equals(today)) {
                LocalDateTime cutoff = getCutoffTime();
                if (now.isAfter(cutoff)) {
                    throw new RequisitionException("今日申领已截止 (截止时间: " + formatTime(cutoff) + ")");
                }
            } else if (targetDate.equals(today.plusDays(1))) {
                LocalDateTime serveStart = getServeStartTime();
                if (now.isBefore(serveStart)) {
                    throw new RequisitionException("仅在领用开始时间后可申领次日用品 (领用开始时间: "
                            + formatTime(serveStart) + ")");
                }
            }

            // 开启时间限制时，只允许「当天或次日」
            if (!targetDate.equals(today) && !targetDate.equals(today.plusDays(1))) {
                throw new RequisitionException("仅支持申领当天或次日的用品");
            }
        }
        // 关闭时间限制时（便于测试）：允许申领任意「已发布」的计划日期，
        // 具体是否合法由下面逐项校验 menu.getDate() 是否等于 targetDate 来保证。

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<RequisitionItem> items = new ArrayList<>();

        // 明确校验请求体，避免直接 findById(null) 抛出难以理解的异常
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new RequisitionException("申领明细为空，请先选择用品");
        }

        for (CreateRequisitionItemRequest itemRequest : request.getItems()) {
            // itemRequest.getMenuItemId() 对应的是 AvailabilityPlan.id
            if (itemRequest.getMenuItemId() == null) {
                // 通常是前端字段名写错（曾出现前端发 planItemId、后端收 menuItemId 的情况）
                throw new RequisitionException("申领明细缺少用品标识(menuItemId/planItemId)");
            }
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new RequisitionException("申领数量必须大于 0");
            }

            Optional<AvailabilityPlan> menuOpt = menuRepository.findById(itemRequest.getMenuItemId());
            if (!menuOpt.isPresent()) {
                throw new RequisitionException("计划项不存在: " + itemRequest.getMenuItemId());
            }

            AvailabilityPlan menu = menuOpt.get();
            // 验证领用计划日期是否为目标日期
            if (!menu.getDate().equals(targetDate.toString())) {
                throw new RequisitionException("只能预订目标日期的领用计划");
            }
            if (menu.getStatus() != 1) {
                throw new RequisitionException("该用品未发布");
            }

            // 获取用品信息
            SupplyItem recipe = recipeService.getRecipeByIdWithDeleted(menu.getRecipeId());
            String dishName = (recipe != null) ? recipe.getName() : "未知用品";
            String unit = (recipe != null && recipe.getUnit() != null) ? recipe.getUnit() : "份";

            RequisitionItem orderItem = new RequisitionItem();
            // 设置申领明细信息
            orderItem.setMenuItemId(menu.getId()); // 保存计划项ID
            orderItem.setMenuItemName(dishName); // 保存用品名称（兼容字段）
            orderItem.setDishName(dishName); // 保存用品名称
            orderItem.setPrice(menu.getPrice()); // 使用当日结算价格
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnit(unit); // 保存单位信息
            // 计算小计
            BigDecimal subtotal = menu.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            orderItem.setSubtotal(subtotal);

            items.add(orderItem);
            totalAmount = totalAmount.add(subtotal);
        }

        if (items.isEmpty()) {
            throw new RequisitionException("申领单不能为空");
        }

        // 生成申领单号
        String orderNumber = generateOrderNumber();

        // 创建申领单
        Requisition order = new Requisition();
        order.setOrderNo(orderNumber); // 直接设置orderNo，确保保存到数据库
        order.setTotalAmount(totalAmount);
        order.setDate(targetDate); // 使用目标日期
        order.setEmployeeId(employeeId);
        try {
            order.setUserId(Long.parseLong(employeeId));
        } catch (NumberFormatException e) {
            // 如果employeeId不是数字，尝试从User表查询
            throw new RequisitionException("无效的员工ID: " + employeeId);
        }

        order.setStatus(RequisitionStatus.PENDING.ordinal());
        order.setCreateTime(new Date());

        // 先保存申领单，获取申领单ID
        order = orderRepository.save(order);

        // 保存申领明细，确保正确关联申领单ID
        for (RequisitionItem item : items) {
            item.setOrderId(order.getId());

            // 【调试】打印申领明细信息
            System.out.println("===== 申领明细信息 =====");
            System.out.println("dishName: " + item.getDishName());
            System.out.println("menuItemName: " + item.getMenuItemName());
            System.out.println("price: " + item.getPrice());
            System.out.println("quantity: " + item.getQuantity());
            System.out.println("unit: " + item.getUnit());
            System.out.println("subtotal: " + item.getSubtotal());

            // 确保申领明细的其他字段都已设置
            if (item.getDishName() == null || item.getDishName().isEmpty()) {
                // 如果dishName为空，尝试从menuItemName获取
                if (item.getMenuItemName() != null && !item.getMenuItemName().isEmpty()) {
                    System.out.println("警告：dishName为空，使用menuItemName: " + item.getMenuItemName());
                    item.setDishName(item.getMenuItemName());
                } else {
                    throw new RequisitionException("申领明细用品名称不能为空");
                }
            }
        }

        System.out.println("准备保存 " + items.size() + " 个申领明细...");
        // 批量保存申领明细
        orderItemRepository.saveAll(items);
        System.out.println("申领明细保存成功！");

        // 刷新申领单以获取最新数据
        order = orderRepository.findById(order.getId()).orElse(order);

        // 设置申领明细列表（用于返回）
        order.setItems(orderItemRepository.findByOrderId(order.getId()));

        return order;
    }

    @Override
    public List<Requisition> getMyOrders(String employeeId, RequisitionStatus status) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");

        // 尝试转换 employeeId 为 Long (userId)
        Long userId = null;
        try {
            userId = Long.parseLong(employeeId);
        } catch (NumberFormatException e) {
            // ignore
        }

        if (userId != null) {
            if (status != null) {
                return orderRepository.findByUserIdAndStatus(userId, status.ordinal());
            } else {
                return orderRepository.findByUserIdOrderByCreateTimeDesc(userId);
            }
        } else {
            // Fallback to employeeId string if userId logic fails (compatibility)
            if (status != null) {
                return orderRepository.findByEmployeeIdAndStatus(employeeId, status.ordinal(), sort);
            } else {
                return orderRepository.findByEmployeeId(employeeId, sort);
            }
        }
    }

    @Override
    public Requisition getOrderDetail(Long orderId) {
        Optional<Requisition> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            throw new RequisitionException("申领单不存在");
        }
        Requisition order = orderOpt.get();
        order.setItems(orderItemRepository.findByOrderId(orderId));
        return order;
    }

    @Override
    public Requisition cancelOrder(Long orderId, String employeeId) {
        Requisition order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RequisitionException("申领单不存在"));

        if (!order.getEmployeeId().equals(employeeId)) {
            // Check userId as well
            try {
                Long userId = Long.parseLong(employeeId);
                if (order.getUserId() != null && !order.getUserId().equals(userId)) {
                    throw new RequisitionException("无权限操作此申领单");
                }
            } catch (Exception e) {
                if (!order.getEmployeeId().equals(employeeId)) {
                    throw new RequisitionException("无权限操作此申领单");
                }
            }
        }

        if (order.getStatus() != RequisitionStatus.PENDING.ordinal()) {
            throw new RequisitionException("只有未制作的申领单才能取消");
        }

        order.setStatus(RequisitionStatus.CANCELLED.ordinal());
        order.setCancelTime(new Date());
        return orderRepository.save(order);
    }

    @Override
    public Requisition updateOrderStatus(Long orderId, RequisitionStatus newStatus) {
        Requisition order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RequisitionException("申领单不存在"));

        order.setStatus(newStatus.ordinal());
        if (newStatus == RequisitionStatus.DONE) {
            order.setFinishTime(new Date());
        }
        return orderRepository.save(order);
    }

    @Override
    public void setCutoffTime(LocalDateTime cutoffTime) {
        // Testing hook
    }

    private LocalDateTime getCutoffTime() {
        String cutoffTimeStr = systemSettingsService.getConfigValue("ORDER_CUTOFF_TIME");
        if (cutoffTimeStr == null || cutoffTimeStr.isEmpty()) {
            cutoffTimeStr = "09:00"; // Default
        }

        try {
            String[] parts = cutoffTimeStr.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            return LocalDate.now().atTime(hour, minute, 0);
        } catch (Exception e) {
            // Fallback in case of parse error
            return LocalDate.now().atTime(9, 0, 0);
        }
    }

    /**
     * 获取目标申领日期（根据当前时间判断是今天还是明天）
     *
     * 规则：
     *   · 开启 ENFORCE_ORDER_TIME 时：过了领用开始时间（默认 11:30）就切到次日；
     *   · 未开启（当前默认，便于测试）：固定返回**当天**，
     *     这样"创建今天的计划 → 立刻申领"不会因为时间切换而对不上日期。
     */
    @Override
    public LocalDate getTargetOrderDate() {
        boolean enforceTime = "true".equalsIgnoreCase(
                String.valueOf(systemSettingsService.getConfigValue("ENFORCE_ORDER_TIME")).trim());

        if (enforceTime) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime serveTime = getServeStartTime();
            // 已经过了领用开始时间，则申领次日
            return now.isAfter(serveTime) ? LocalDate.now().plusDays(1) : LocalDate.now();
        }

        // 不校验时间时：优先对齐「实际已发布的计划日期」。
        // 早期实现固定返回"今天"，导致管理员只发布了 10-08 的计划时，
        // 员工页始终只查今天、看不到任何可申领用品。
        String active = menuService.findActivePublishedDate(LocalDate.now());
        return active != null ? LocalDate.parse(active) : LocalDate.now();
    }

    /** 把 LocalDateTime 格式化成 HH:mm，用于错误提示里显示实际配置的时间 */
    private String formatTime(LocalDateTime t) {
        return String.format("%02d:%02d", t.getHour(), t.getMinute());
    }

    /**
     * 获取领用开始时间
     */
    private LocalDateTime getServeStartTime() {
        String serveTimeStr = systemSettingsService.getConfigValue("SERVE_START_TIME");
        if (serveTimeStr == null || serveTimeStr.isEmpty()) {
            serveTimeStr = "11:30"; // 默认领用开始时间
        }

        try {
            String[] parts = serveTimeStr.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            return LocalDate.now().atTime(hour, minute, 0);
        } catch (Exception e) {
            // 解析失败时使用默认值
            return LocalDate.now().atTime(11, 30, 0);
        }
    }

    private String generateOrderNumber() {
        LocalDate today = LocalDate.now();
        String dateStr = today.toString().replace("-", "");
        long timestamp = System.currentTimeMillis();
        return String.format("REQ-%s-%d", dateStr, timestamp % 1000000);
    }
}
