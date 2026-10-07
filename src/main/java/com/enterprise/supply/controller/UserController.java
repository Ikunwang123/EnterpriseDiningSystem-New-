package com.enterprise.supply.controller;

import com.enterprise.supply.common.Result;
import com.enterprise.supply.entity.ApiResponse;
import com.enterprise.supply.entity.User;
import com.enterprise.supply.repository.UserRepository;
import com.enterprise.supply.service.UserService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.util.*;

@RestController // 注意这里是用 RestController 返回 JSON 给前端
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserService userService;

    // 登录接口
    @PostMapping("/login")
    public Map<String, Object> login(@RequestParam String username,
                                     @RequestParam String password,
                                     @RequestParam(required = false, defaultValue = "false") boolean rememberMe,
                                     HttpSession session,
                                     javax.servlet.http.HttpServletResponse response) {
        Map<String, Object> result = new HashMap<>();

        // 1. 查询数据库
        User user = userRepository.findByUsername(username);

        // 2. 验证密码
        if (user != null && user.getPassword().equals(password)) {
            // 3. 登录成功，将用户信息存入 Session
            session.setAttribute("currentUser", user);

            // 4. 处理"记住我"功能
            if (rememberMe) {
                javax.servlet.http.Cookie cookie = new javax.servlet.http.Cookie("remember_user", username);
                cookie.setMaxAge(7 * 24 * 60 * 60); // 7天有效期
                cookie.setPath("/");
                response.addCookie(cookie);
            } else {
                // 如果未勾选，清除可能存在的 Cookie
                javax.servlet.http.Cookie cookie = new javax.servlet.http.Cookie("remember_user", null);
                cookie.setMaxAge(0);
                cookie.setPath("/");
                response.addCookie(cookie);
            }

            result.put("status", "success");
            result.put("msg", "登录成功");
            result.put("role", user.getRole());
            
            // 返回完整的用户信息
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("realName", user.getRealName());
            userInfo.put("name", user.getRealName()); // 兼容前端
            userInfo.put("role", user.getRole());
            userInfo.put("deptName", user.getDeptName());
            userInfo.put("location", user.getLocation());
            userInfo.put("phone", user.getPhone());
            result.put("user", userInfo);
        } else {
            result.put("status", "error");
            result.put("msg", "账号或密码错误");
        }
        return result;
    }

    // 注册接口
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User user) {
        Map<String, Object> result = new HashMap<>();
        
        // --- Server Side Validation ---
        if (user.getUsername() == null || user.getPassword() == null || user.getRealName() == null) {
            result.put("status", "error");
            result.put("msg", "注册信息不完整");
            return result;
        }

        // 检查学号是否含中文 (双重保险)
        if (user.getUsername().matches(".*[\\u4e00-\\u9fa5].*")) {
             result.put("status", "error");
             result.put("msg", "学号不能包含中文字符");
             return result;
        }

        // 检查密码复杂度：至少7位，且包含数字、字母、符号中的任意两种
        if (!isValidPassword(user.getPassword())) {
            result.put("status", "error");
            result.put("msg", "密码必须至少7位，且包含数字、字母、符号中的任意两种");
            return result;
        }

        // 检查账号是否存在
        if (userRepository.findByUsername(user.getUsername()) != null) {
            result.put("status", "error");
            result.put("msg", "该工号/学号已被注册");
            return result;
        }
        
        // 设置默认值
        if (user.getRole() == null) user.setRole("STAFF");
        
        try {
            userRepository.save(user);
            result.put("status", "success");
            result.put("msg", "注册成功，请返回登录");
        } catch (Exception e) {
            result.put("status", "error");
            result.put("msg", "注册失败: " + e.getMessage());
        }
        return result;
    }

    // 重置密码接口 (修改为验证旧密码)
    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@RequestParam String username,
                                             @RequestParam String oldPassword,
                                             @RequestParam String newPassword) {
        Map<String, Object> result = new HashMap<>();
        
        // 验证新密码复杂度：至少7位，且包含数字、字母、符号中的任意两种
        if (!isValidPassword(newPassword)) {
            result.put("status", "error");
            result.put("msg", "新密码必须至少7位，且包含数字、字母、符号中的任意两种");
            return result;
        }
        
        User user = userRepository.findByUsername(username);
        
        if (user == null) {
            result.put("status", "error");
            result.put("msg", "账号不存在");
            return result;
        }
        
        // 验证旧密码
        if (!user.getPassword().equals(oldPassword)) {
            result.put("status", "error");
            result.put("msg", "旧密码错误，无法重置");
            return result;
        }
        
        user.setPassword(newPassword);
        userRepository.save(user);
        
        result.put("status", "success");
        result.put("msg", "密码已重置，请使用新密码登录");
        return result;
    }

    // 获取当前登录用户信息的接口 (供首页展示用)
    @GetMapping("/profile")
    public Map<String, Object> getProfile(HttpSession session) {
        Map<String, Object> result = new HashMap<>();
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            result.put("status", "error");
            result.put("msg", "未登录");
            return result;
        }
        
        result.put("status", "success");
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("realName", user.getRealName());
        userInfo.put("name", user.getRealName()); // 兼容前端
        userInfo.put("role", user.getRole());
        userInfo.put("deptName", user.getDeptName());
        userInfo.put("location", user.getLocation());
        userInfo.put("phone", user.getPhone());
        result.put("user", userInfo);
        return result;
    }

    // 退出登录
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate(); // 销毁 Session
        return "ok";
    }
    
    // ==================== 用户管理模块（MANAGER权限） ====================
    
    /**
     * 检查权限（MANAGER或ADMIN）
     */
    private boolean checkManagerPermission(HttpSession session) {
        User currentUser = (User) session.getAttribute("currentUser");
        if (currentUser == null) {
            return false;
        }
        String role = currentUser.getRole();
        if (role == null) {
            return false;
        }
        // 忽略大小写比较，确保ADMIN和MANAGER都能访问
        role = role.toUpperCase().trim();
        return "MANAGER".equals(role) || "ADMIN".equals(role);
    }
    
    /**
     * 添加单个用户
     */
    @PostMapping("/add")
    public Result<User> addUser(@RequestBody User user, HttpSession session) {
        if (!checkManagerPermission(session)) {
            return Result.error("权限不足，需要管理员权限");
        }
        
        try {
            User savedUser = userService.addUser(user);
            return Result.success(savedUser);
        } catch (Exception e) {
            return Result.error("添加用户失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户列表查询（分页、搜索）
     */
    @GetMapping("/list")
    public Result<Map<String, Object>> getUserList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            HttpSession session) {
        if (!checkManagerPermission(session)) {
            return Result.error("权限不足，需要管理员权限");
        }
        
        try {
            Page<User> userPage = userService.getUserList(page, size, keyword);
            Map<String, Object> result = new HashMap<>();
            result.put("users", userPage.getContent());
            result.put("total", userPage.getTotalElements());
            result.put("totalPages", userPage.getTotalPages());
            result.put("currentPage", userPage.getNumber());
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("查询用户列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户信息修改
     */
    @PutMapping("/update")
    public Result<User> updateUser(@RequestBody User user, HttpSession session) {
        if (!checkManagerPermission(session)) {
            return Result.error("权限不足，需要管理员权限");
        }
        
        try {
            User updatedUser = userService.updateUser(user);
            return Result.success(updatedUser);
        } catch (Exception e) {
            return Result.error("更新用户失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取单个用户信息
     */
    @GetMapping("/{id}")
    public Result<User> getUserById(@PathVariable Long id, HttpSession session) {
        if (!checkManagerPermission(session)) {
            return Result.error("权限不足，需要管理员权限");
        }
        
        try {
            User user = userService.getUserById(id);
            if (user == null) {
                return Result.error("用户不存在");
            }
            return Result.success(user);
        } catch (Exception e) {
            return Result.error("获取用户信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户删除
     */
    @DeleteMapping("/{id}")
    public Result<String> deleteUser(@PathVariable Long id, HttpSession session) {
        if (!checkManagerPermission(session)) {
            return Result.error("权限不足，需要管理员权限");
        }
        
        try {
            userService.deleteUser(id);
            return Result.success("删除成功");
        } catch (Exception e) {
            return Result.error("删除用户失败: " + e.getMessage());
        }
    }
    
    /**
     * 批量导入用户（Excel文件上传）
     */
    @PostMapping("/import")
    public Result<Map<String, Object>> importUsers(
            @RequestParam("file") MultipartFile file,
            HttpSession session) {
        if (!checkManagerPermission(session)) {
            return Result.error("权限不足，需要管理员权限");
        }
        
        if (file.isEmpty()) {
            return Result.error("上传文件为空");
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xls") && !filename.endsWith(".xlsx"))) {
            return Result.error("文件格式错误，仅支持.xls和.xlsx格式");
        }
        
        Map<String, Object> result = new HashMap<>();
        List<User> successList = new ArrayList<>();
        List<String> errorList = new ArrayList<>();
        
        try {
            Workbook workbook;
            if (filename.endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(file.getInputStream());
            } else {
                workbook = WorkbookFactory.create(file.getInputStream());
            }
            
            Sheet sheet = workbook.getSheetAt(0);
            int totalRows = sheet.getPhysicalNumberOfRows();
            
            // 跳过表头，从第二行开始
            for (int i = 1; i < totalRows; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                try {
                    User user = new User();
                    
                    // 读取Excel列：用户名、密码、真实姓名、角色、部门、工位、电话
                    String username = getCellValue(row.getCell(0));
                    String password = getCellValue(row.getCell(1));
                    String realName = getCellValue(row.getCell(2));
                    String role = getCellValue(row.getCell(3));
                    String deptName = getCellValue(row.getCell(4));
                    String location = getCellValue(row.getCell(5));
                    String phone = getCellValue(row.getCell(6));
                    
                    // 验证必填字段：用户名
                    if (username == null || username.trim().isEmpty()) {
                        errorList.add("第" + (i + 1) + "行：用户名为空");
                        continue;
                    }
                    username = username.trim();
                    
                    // 验证用户名格式：不能包含中文字符
                    if (username.matches(".*[\\u4e00-\\u9fa5].*")) {
                        errorList.add("第" + (i + 1) + "行：用户名不能包含中文字符");
                        continue;
                    }
                    
                    // 验证真实姓名：不能为空
                    if (realName == null || realName.trim().isEmpty()) {
                        errorList.add("第" + (i + 1) + "行：真实姓名不能为空");
                        continue;
                    }
                    realName = realName.trim();
                    
                    // 验证角色：必须是有效的角色值
                    if (role != null && !role.trim().isEmpty()) {
                        role = role.trim().toUpperCase();
                        String[] validRoles = {"ADMIN", "MANAGER", "CHEF", "DISPATCHER", "FINANCE", "STAFF"};
                        boolean isValidRole = false;
                        for (String validRole : validRoles) {
                            if (validRole.equals(role)) {
                                isValidRole = true;
                                break;
                            }
                        }
                        if (!isValidRole) {
                            errorList.add("第" + (i + 1) + "行：角色无效，必须是：ADMIN、MANAGER、CHEF、DISPATCHER、FINANCE、STAFF 之一");
                            continue;
                        }
                    } else {
                        role = "STAFF"; // 默认角色
                    }
                    
                    // 设置密码：如果为空则使用默认密码
                    if (password == null || password.trim().isEmpty()) {
                        password = "123456"; // 默认密码
                    } else {
                        password = password.trim();
                    }
                    
                    // 验证电话格式（如果提供了电话）
                    if (phone != null && !phone.trim().isEmpty()) {
                        phone = phone.trim();
                        // 电话应该是数字，长度在7-15位之间
                        if (!phone.matches("^\\d{7,15}$")) {
                            errorList.add("第" + (i + 1) + "行：电话格式错误，应为7-15位数字");
                            continue;
                        }
                    }
                    
                    // 设置用户对象
                    user.setUsername(username);
                    user.setPassword(password);
                    user.setRealName(realName);
                    user.setRole(role);
                    user.setDeptName(deptName != null && !deptName.trim().isEmpty() ? deptName.trim() : null);
                    user.setLocation(location != null && !location.trim().isEmpty() ? location.trim() : null);
                    user.setPhone(phone != null && !phone.trim().isEmpty() ? phone : null);
                    
                    // 检查用户名是否已存在
                    if (userRepository.findByUsername(user.getUsername()) != null) {
                        errorList.add("第" + (i + 1) + "行：用户名" + user.getUsername() + "已存在");
                        continue;
                    }
                    
                    userService.addUser(user);
                    successList.add(user);
                } catch (Exception e) {
                    errorList.add("第" + (i + 1) + "行：" + e.getMessage());
                }
            }
            
            workbook.close();
            
            result.put("successCount", successList.size());
            result.put("errorCount", errorList.size());
            result.put("errors", errorList);
            result.put("totalRows", totalRows - 1); // 减去表头
            
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("导入失败: " + e.getMessage());
        }
    }
    
    /**
     * 用户信息导出（Excel下载）
     */
    @GetMapping("/export")
    public void exportUsers(HttpServletResponse response, HttpSession session) {
        if (!checkManagerPermission(session)) {
            try {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":403,\"msg\":\"权限不足\"}");
            } catch (IOException e) {
                // 忽略
            }
            return;
        }
        
        Workbook workbook = null;
        OutputStream outputStream = null;
        
        try {
            List<User> users = userService.getAllUsers();
            
            // 创建Excel工作簿
            workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("用户列表");
            
            // 创建表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "用户名", "真实姓名", "角色", "部门", "工位", "电话"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // 填充数据
            int rowNum = 1;
            for (User user : users) {
                if (user == null) continue;
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(user.getId() != null ? user.getId() : 0L);
                row.createCell(1).setCellValue(user.getUsername() != null ? user.getUsername() : "");
                row.createCell(2).setCellValue(user.getRealName() != null ? user.getRealName() : "");
                row.createCell(3).setCellValue(user.getRole() != null ? user.getRole() : "");
                row.createCell(4).setCellValue(user.getDeptName() != null ? user.getDeptName() : "");
                row.createCell(5).setCellValue(user.getLocation() != null ? user.getLocation() : "");
                row.createCell(6).setCellValue(user.getPhone() != null ? user.getPhone() : "");
            }
            
            // 自动调整列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // 设置最大列宽，避免过宽
                if (sheet.getColumnWidth(i) > 15000) {
                    sheet.setColumnWidth(i, 15000);
                }
            }
            
            // 设置响应头
            String filename = "用户列表_" + System.currentTimeMillis() + ".xlsx";
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setCharacterEncoding("UTF-8");
            // 使用 RFC 5987 格式支持中文文件名
            response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + URLEncoder.encode(filename, "UTF-8"));
            
            // 写入响应流
            outputStream = response.getOutputStream();
            workbook.write(outputStream);
            outputStream.flush();
        } catch (Exception e) {
            e.printStackTrace();
            try {
                // 如果响应还没有提交，设置错误响应
                if (!response.isCommitted()) {
                    response.reset();
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"code\":500,\"msg\":\"导出失败: " + e.getMessage().replace("\"", "'") + "\"}");
                }
            } catch (IOException ioException) {
                // 忽略
            }
        } finally {
            // 确保资源关闭
            try {
                if (workbook != null) {
                    workbook.close();
                }
            } catch (IOException e) {
                // 忽略关闭异常
            }
            try {
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                // 忽略关闭异常
            }
        }
    }
    
    /**
     * 验证密码复杂度
     * 要求：至少7位，且包含数字、字母、符号中的任意两种
     * @param password 待验证的密码
     * @return true表示符合要求，false表示不符合
     */
    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 7) {
            return false;
        }
        
        // 检查是否包含数字
        boolean hasDigit = password.matches(".*\\d.*");
        
        // 检查是否包含字母（大小写都算）
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        
        // 检查是否包含符号（非字母数字字符，包括小数点等）
        boolean hasSymbol = password.matches(".*[^a-zA-Z0-9].*");
        
        // 统计满足条件的类型数量
        int count = 0;
        if (hasDigit) count++;
        if (hasLetter) count++;
        if (hasSymbol) count++;
        
        // 至少满足两种
        return count >= 2;
    }
    
    /**
     * 辅助方法：获取单元格值
     */
    private String getCellValue(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // 处理数字，避免科学计数法
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }


    @GetMapping("/exists")
    public ResponseEntity<ApiResponse> checkUserExists(
            @RequestParam Long id,
            HttpSession session) {

        try {
            User currentUser = (User) session.getAttribute("currentUser");
            if (currentUser == null) {
                return ResponseEntity.status(401).body(ApiResponse.error("未登录"));
            }

            String role = currentUser.getRole();
            if (!"ADMIN".equals(role) && !"FINANCE".equals(role) && !"MANAGER".equals(role)) {
                return ResponseEntity.status(403).body(ApiResponse.error("权限不足"));
            }

            // 加日志，看看 id 是多少
            System.out.println("校验员工ID: " + id);

            boolean exists = userRepository.existsById(id);
            Map<String, Object> data = new HashMap<>();
            data.put("exists", exists);

            if (exists) {
                User user = userRepository.findById(id).orElse(null);
                if (user != null) {
                    data.put("realName", user.getRealName() != null ? user.getRealName() : "未知");
                    data.put("deptName", user.getDeptName() != null ? user.getDeptName() : "");
                    System.out.println("找到用户: " + user.getRealName());
                } else {
                    System.out.println("findById 返回 null，尽管 existsById 为 true");
                }
            }

            return ResponseEntity.ok(ApiResponse.success(data));

        } catch (Exception e) {
            e.printStackTrace();  // 关键！打印完整异常栈
            return ResponseEntity.status(500).body(ApiResponse.error("服务器内部错误: " + e.getMessage()));
        }
    }
}