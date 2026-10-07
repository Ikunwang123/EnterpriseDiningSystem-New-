package com.enterprise.supply.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(com.enterprise.supply.exception.RequisitionException.class)
    public ResponseEntity<String> handleOrderException(com.enterprise.supply.exception.RequisitionException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    /**
     * 权限不足 → 403。
     * 前端的统一错误处理会读取响应体并弹提示，这里返回纯文本消息即可。
     */
    @ExceptionHandler(com.enterprise.supply.exception.PermissionException.class)
    public ResponseEntity<String> handlePermissionException(com.enterprise.supply.exception.PermissionException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception e) {
        return ResponseEntity.status(500).body("系统内部错误: " + e.getMessage());
    }
}
