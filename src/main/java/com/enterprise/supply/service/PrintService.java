// src/main/java/com/example/service/PrintService.java
package com.enterprise.supply.service;

import com.enterprise.supply.DTO.GroupedOrderDTO;
import com.enterprise.supply.entity.User;

import java.util.List;

public interface PrintService {
    /**
     * 获取待打印申领单列表（按员工分组）
     * @param currentUser 当前用户
     * @return 按员工分组的申领单列表
     */
    List<GroupedOrderDTO> getPendingOrdersForPrinting(User currentUser);
}
