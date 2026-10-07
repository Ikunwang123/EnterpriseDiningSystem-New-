package com.enterprise.supply.config;

import com.enterprise.supply.entity.User;
import com.enterprise.supply.exception.PermissionException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 接口级角色校验拦截器。
 *
 * 为什么用拦截器而不是在每个 Controller 方法里写校验：
 *   · 策略集中在这一处，一眼能看全"谁能访问什么"，不会漏掉某个端点；
 *   · 业务代码保持干净，不用为了鉴权给每个方法加 HttpSession 参数；
 *   · 前端隐藏菜单只是"看不见入口"，这里才是真正的防线——
 *     否则在地址栏直接敲 /api/user/list 之类的接口就能绕过。
 *
 * 角色：ADMIN（系统管理员）、MANAGER（后勤主管）、DISPATCHER（配送员）、STAFF（普通员工）
 */
@Component
public class RoleInterceptor implements HandlerInterceptor {

    /** URL 前缀 → 允许的角色。按声明顺序匹配，先匹配到的生效。 */
    private static final Map<String, List<String>> PREFIX_RULES = new LinkedHashMap<>();
    /** 精确路径 → 允许的角色（优先于前缀规则） */
    private static final Map<String, List<String>> EXACT_RULES = new LinkedHashMap<>();

    static {
        // 报表：只有系统管理员；但"导出个人月度申领单"任何登录用户都能用（导出自己的数据）
        EXACT_RULES.put("/api/reports/export/personal-monthly", Arrays.asList("ADMIN", "MANAGER", "STAFF", "DISPATCHER"));
        PREFIX_RULES.put("/api/reports", Arrays.asList("ADMIN"));

        // 用品目录、领用计划管理、汇总领用单：管理端
        PREFIX_RULES.put("/api/recipe", Arrays.asList("ADMIN", "MANAGER"));
        PREFIX_RULES.put("/api/menu", Arrays.asList("ADMIN", "MANAGER"));
        PREFIX_RULES.put("/api/summaries", Arrays.asList("ADMIN", "MANAGER"));
        PREFIX_RULES.put("/api/blanket-order", Arrays.asList("ADMIN", "MANAGER"));

        // 配送单打印：配送员 + 管理端
        PREFIX_RULES.put("/api/print", Arrays.asList("DISPATCHER", "MANAGER", "ADMIN"));

        // 用户管理与系统设置：管理端
        PREFIX_RULES.put("/api/user", Arrays.asList("ADMIN", "MANAGER"));
        PREFIX_RULES.put("/api/settings", Arrays.asList("ADMIN", "MANAGER"));
    }

    /**
     * 公共接口：登录、注册、重置密码、登出、当前用户信息，以及员工申领相关接口。
     * 这些不校验角色（但仍需各接口自己判断登录态）。
     */
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/user/login",
            "/api/user/register",
            "/api/user/reset-password",
            "/api/user/logout",
            "/api/user/profile",
            // 申领相关：当天可见用品、按日期取计划、提交申领、我的申领、目标日期
            // 这类接口本身就是给普通员工用的，不能限制角色
            "/api/dining"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        // 去掉 context-path（本项目为 /，通常已经是干净的路径）
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && path.startsWith(ctx)) {
            path = path.substring(ctx.length());
        }

        if (isPublic(path)) {
            return true;
        }

        List<String> allowed = matchRule(path);
        if (allowed == null) {
            // 未配置规则的接口不拦截（例如总览、静态资源）
            return true;
        }

        User user = (User) request.getSession().getAttribute("currentUser");
        if (user == null || user.getRole() == null) {
            throw PermissionException.notLoggedIn();
        }
        String role = user.getRole().toUpperCase().trim();
        if (!allowed.contains(role)) {
            throw PermissionException.denied();
        }
        return true;
    }

    private boolean isPublic(String path) {
        for (String p : PUBLIC_PATHS) {
            if (path.equals(p) || path.startsWith(p + "/")) {
                return true;
            }
        }
        return false;
    }

    private List<String> matchRule(String path) {
        for (Map.Entry<String, List<String>> e : EXACT_RULES.entrySet()) {
            if (path.equals(e.getKey())) {
                return e.getValue();
            }
        }
        for (Map.Entry<String, List<String>> e : PREFIX_RULES.entrySet()) {
            if (path.equals(e.getKey()) || path.startsWith(e.getKey() + "/")) {
                return e.getValue();
            }
        }
        return null;
    }
}
