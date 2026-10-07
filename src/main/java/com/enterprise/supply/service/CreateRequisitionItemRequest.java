// 文件路径: E:/Projects/dining-system/src/main/java/com/enterprise/dining/Service/CreateRequisitionItemRequest.java
package com.enterprise.supply.service;

public class CreateRequisitionItemRequest {
    private Long menuItemId;
    private Integer quantity;
    private String notes;

    public CreateRequisitionItemRequest() {}

    public CreateRequisitionItemRequest(Long menuItemId, Integer quantity, String notes) {
        this.menuItemId = menuItemId;
        this.quantity = quantity;
        this.notes = notes;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    /**
     * 兼容前端使用的 planItemId 字段名。
     *
     * 前端 AvailabilityPlanBrowseModule 提交时发的是 {"planItemId": N}，
     * 而本 DTO 的属性名是 menuItemId，导致反序列化后 menuItemId 为 null，
     * 服务端 findById(null) 抛异常、申领失败，且前端只看到一句笼统报错。
     * 这里同时接受两个键名，避免因为命名不一致而静默失败。
     */
    public void setPlanItemId(Long planItemId) {
        if (this.menuItemId == null) {
            this.menuItemId = planItemId;
        }
    }

    public Long getPlanItemId() {
        return menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
