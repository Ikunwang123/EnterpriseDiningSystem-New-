// src/main/java/com/example/controller/PrintController.java
package com.enterprise.supply.controller;

import com.enterprise.supply.DTO.GroupedOrderDTO;
import com.enterprise.supply.entity.User;
import com.enterprise.supply.service.PrintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;

@RestController
@RequestMapping("/api/print")
@CrossOrigin(origins = "*")
public class PrintController {

    @Autowired
    private PrintService printService;

    /**
     * 获取待打印申领单列表（按员工分组）
     *
     * 用**当前登录用户**作为操作者身份（原实现是根据请求头 User-ID 手工拼一个假用户，
     * 把 userId==1 当成 MANAGER、==2 当成 DISPATCHER、其余当成 EMPLOYEE，
     * 结果配送员（真实 id=4）被当成无权限的 EMPLOYEE 而返回 403）。
     * 现在改为读取 Session 中的真实用户，身份与登录态一致。
     */
    @GetMapping("/orders")
    public ResponseEntity<List<GroupedOrderDTO>> getPendingOrdersForPrinting(
            @RequestHeader(value = "User-ID", required = false) Long userId,
            HttpSession session) {

        try {
            User currentUser = (User) session.getAttribute("currentUser");
            if (currentUser == null) {
                // 极少数情况下拿不到登录态，才退回用请求头里的 id（不做角色伪造）
                if (userId == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }
                currentUser = new User();
                currentUser.setId(userId);
            }

            List<GroupedOrderDTO> result = printService.getPendingOrdersForPrinting(currentUser);
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 说明：原有一个 POST /batch 端点（后端拼好打印文本返回），
    // 但前端 BatchPrintModule 是在浏览器里用 window.print() 直接打印页面，
    // 从来不调用它，属于死代码，已删除。
}
