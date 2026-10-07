package com.enterprise.supply.util;

import com.enterprise.supply.entity.User;

import javax.servlet.http.HttpSession;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 服务端的角色校验工具。
 *
 * 为什么要它：前端的菜单隐藏只是"看不见入口"，接口本身仍然可以被直接调用
 * （例如在浏览器地址栏敲 /api/user/list）。对管理类接口必须在服务端也校验角色，
 * 否则"隐藏系统管理"只是表面效果。
 *
 * 角色只有 3 个：
 *   ADMIN   系统管理员 —— 全部功能
 *   MANAGER 后勤主管   —— 用品、计划、备货汇总、配送打印、用户与设置
 *   STAFF   普通员工   —— 申领、查看自己的申领单
 * 另有 DISPATCHER（配送员）只负责配送单打印与总览。
 *
 * 说明：原来 UserController / SystemSettingsController 各写了一份
 * checkManagerPermission，这里统一为一份，避免多处逻辑漂移。
 */
public final class RoleGuard {

    private RoleGuard() {
    }

    /** 取当前登录用户；未登录返回 null */
    public static User currentUser(HttpSession session) {
        if (session == null) {
            return null;
        }
        return (User) session.getAttribute("currentUser");
    }

    /** 取当前用户角色（大写、去空格）；未登录或角色为空返回 null */
    public static String currentRole(HttpSession session) {
        User u = currentUser(session);
        if (u == null || u.getRole() == null) {
            return null;
        }
        return u.getRole().toUpperCase().trim();
    }

    /** 当前用户是否属于给定角色之一 */
    public static boolean hasRole(HttpSession session, String... roles) {
        String role = currentRole(session);
        if (role == null) {
            return false;
        }
        Set<String> allow = new HashSet<>(Arrays.asList(roles));
        return allow.contains(role);
    }

    /** 管理端（系统管理员 / 后勤主管）：可访问用品目录、领用计划、汇总、用户与系统设置 */
    public static boolean isAdminOrManager(HttpSession session) {
        return hasRole(session, "ADMIN", "MANAGER");
    }

    /** 仅系统管理员：可访问统计报表 */
    public static boolean isAdmin(HttpSession session) {
        return hasRole(session, "ADMIN");
    }

    /** 可访问配送相关功能：配送员、后勤主管、系统管理员 */
    public static boolean isDispatcherOrAbove(HttpSession session) {
        return hasRole(session, "DISPATCHER", "MANAGER", "ADMIN");
    }

    /** 未登录时的统一提示 */
    public static String notLoggedIn() {
        return "未登录，请先登录";
    }

    /** 角色不足时的统一提示 */
    public static String noPermission() {
        return "权限不足：当前角色无权访问该功能";
    }
}
