package com.enterprise.supply.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "t_requisition")
public class Requisition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requisition_no", unique = true, nullable = false)
    private String orderNo; // 申领单号：ORD-YYYYMMDD-XXX

    @Transient
    private String orderNumber; // 申领单号（别名，兼容性，不持久化）

    @Column(name = "user_id", nullable = false)
    private Long userId; // 用户ID

    @Column(name = "employee_id")
    private String employeeId; // 员工ID

    @Column(name = "total_amount")
    private BigDecimal totalAmount; // 申领单总金额

    @Column(name = "status")
    private Integer status; // 0:Pending, 1:Prep(Cooking), 2:Ready, 3:Done, 4:Cancelled

    @Column(name = "note")
    private String note; // 备注

    @Column(name = "create_time")
    private Date createTime; // 创建时间

    @Column(name = "finish_time")
    private Date finishTime; // 完成时间

    @Column(name = "cancel_time")
    private Date cancelTime; // 取消时间

    @Column(name = "date")
    private LocalDate date; // 申领单日期

    // 修复：使用@OneToMany关联查询申领明细，而不是@Transient
    @OneToMany
    @JoinColumn(name = "requisition_id", referencedColumnName = "id")
    private List<RequisitionItem> items; // 申领明细列表

    @Transient
    private String userName; // 用户名（非数据库字段）

    @Transient
    private String userPhone; // 用户电话（非数据库字段）

    @Transient
    private String userWorkstation; // 用户工位（非数据库字段）

    // 添加示例代码中的字段（为了兼容性）
    @Transient
    private Long deliveryPersonId; // 送餐员ID

    @Transient
    private LocalDateTime localCreateTime; // LocalDateTime类型的创建时间

    // 为了兼容性，添加 setter/getter 方法
    public String getOrderNumber() {
        return orderNo;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNo = orderNumber;
        this.orderNumber = orderNumber;
    }

    // 添加 getOrderTime 方法以兼容 RequisitionReportService
    public Date getOrderTime() {
        return createTime;
    }

    public String getEmployeeId() {
        return employeeId != null ? employeeId : userId != null ? userId.toString() : null;
    }

    // 手动添加 setEmployeeId(String) 以消除 Lombok 警告
    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    // 添加示例代码中的getter和setter方法
    public Long getEmployeeIdAsLong() {
        if (employeeId != null) {
            try {
                return Long.parseLong(employeeId);
            } catch (NumberFormatException e) {
                // 如果转换失败，返回null或默认值
                return null;
            }
        }
        return userId;
    }

    public void setEmployeeId(Long employeeId) {
        this.userId = employeeId;
        this.employeeId = employeeId != null ? employeeId.toString() : null;
    }

    public Long getDeliveryPersonId() {
        return deliveryPersonId;
    }

    public void setDeliveryPersonId(Long deliveryPersonId) {
        this.deliveryPersonId = deliveryPersonId;
    }

    public void setDeliveryPersonId(long l) {
        this.deliveryPersonId = l;
    }

    public LocalDateTime getLocalCreateTime() {
        return localCreateTime;
    }

    public void setLocalCreateTime(LocalDateTime localCreateTime) {
        this.localCreateTime = localCreateTime;
    }

    // 状态字符串与 RequisitionStatus 枚举保持一致（3 个状态）
    public String getStatusAsString() {
        if (status == null)
            return null;
        switch (status) {
            case 0:
                return "PENDING";
            case 1:
                return "DONE";
            case 2:
                return "CANCELLED";
            default:
                return status.toString();
        }
    }

    public void setStatusFromString(String statusString) {
        if (statusString == null) {
            this.status = null;
            return;
        }

        switch (statusString.toUpperCase()) {
            case "PENDING":
                this.status = 0;
                break;
            case "DONE":
            case "COMPLETED":
                this.status = 1;
                break;
            case "CANCELLED":
                this.status = 2;
                break;
            // 兼容历史字符串值（早期有 5 个状态）
            case "PREPARING":
                this.status = 0;
                break;
            case "READY":
                this.status = 1;
                break;
            default:
                try {
                    this.status = Integer.parseInt(statusString);
                } catch (NumberFormatException e) {
                    this.status = null;
                }
        }
    }
}
