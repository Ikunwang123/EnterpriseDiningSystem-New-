package com.enterprise.supply.exception;

/**
 * 权限不足异常。
 *
 * 用途：服务端角色校验失败时抛出，由 GlobalExceptionHandler 统一转成 403 响应。
 * 比"在每个方法里 return Result.error(...)"更干净——不需要为了返回一个错误
 * 去做 Result 的强制类型转换（那样会产生 unchecked 警告）。
 */
public class PermissionException extends RuntimeException {

    public PermissionException(String message) {
        super(message);
    }

    /** 未登录 */
    public static PermissionException notLoggedIn() {
        return new PermissionException("未登录，请先登录");
    }

    /** 已登录但角色不足 */
    public static PermissionException denied() {
        return new PermissionException("权限不足：当前角色无权访问该功能");
    }
}
