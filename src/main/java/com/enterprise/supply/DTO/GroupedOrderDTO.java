// src/main/java/com/example/dto/GroupedOrderDTO.java
package com.enterprise.supply.DTO;

import java.time.LocalDateTime;
import java.util.List;
import com.enterprise.supply.DTO.RequisitionDetailDTO;
import com.enterprise.supply.DTO.EmployeeInfoDTO;

public class GroupedOrderDTO {
    private Long employeeId;
    private com.enterprise.supply.DTO.EmployeeInfoDTO employeeInfo;
    private List<OrderInfo> orders;

    // 内部类表示申领单信息
    public static class OrderInfo {
        private String orderNumber;
        private Long deliveryPersonId;
        private List<RequisitionDetailDTO> orderDetails;
        private LocalDateTime createTime;
        private Integer status;

        public OrderInfo() {
        }

        public OrderInfo(String orderNumber, Long deliveryPersonId,
                List<RequisitionDetailDTO> orderDetails, LocalDateTime createTime) {
            this.orderNumber = orderNumber;
            this.deliveryPersonId = deliveryPersonId;
            this.orderDetails = orderDetails;
            this.createTime = createTime;
        }

        // Getters and Setters
        public String getOrderNumber() {
            return orderNumber;
        }

        public void setOrderNumber(String orderNumber) {
            this.orderNumber = orderNumber;
        }

        public Long getDeliveryPersonId() {
            return deliveryPersonId;
        }

        public void setDeliveryPersonId(Long deliveryPersonId) {
            this.deliveryPersonId = deliveryPersonId;
        }

        public List<RequisitionDetailDTO> getOrderDetails() {
            return orderDetails;
        }

        public void setOrderDetails(List<RequisitionDetailDTO> orderDetails) {
            this.orderDetails = orderDetails;
        }

        public LocalDateTime getCreateTime() {
            return createTime;
        }

        public void setCreateTime(LocalDateTime createTime) {
            this.createTime = createTime;
        }

        public Integer getStatus() {
            return status;
        }

        public void setStatus(Integer status) {
            this.status = status;
        }
    }

    public GroupedOrderDTO() {
    }

    public GroupedOrderDTO(Long employeeId, EmployeeInfoDTO employeeInfo, List<OrderInfo> orders) {
        this.employeeId = employeeId;
        this.employeeInfo = employeeInfo;
        this.orders = orders;
    }

    // Getters and Setters
    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeInfoDTO getEmployeeInfo() {
        return employeeInfo;
    }

    public void setEmployeeInfo(EmployeeInfoDTO employeeInfo) {
        this.employeeInfo = employeeInfo;
    }

    public List<OrderInfo> getOrders() {
        return orders;
    }

    public void setOrders(List<OrderInfo> orders) {
        this.orders = orders;
    }
}
