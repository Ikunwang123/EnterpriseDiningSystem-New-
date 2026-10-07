package com.enterprise.supply.service;

import java.util.List;

public class CreateRequisitionRequest {
    private List<CreateRequisitionItemRequest> items;

    public CreateRequisitionRequest() {}

    public CreateRequisitionRequest(List<CreateRequisitionItemRequest> items) {
        this.items = items;
    }

    public List<CreateRequisitionItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreateRequisitionItemRequest> items) {
        this.items = items;
    }
}
