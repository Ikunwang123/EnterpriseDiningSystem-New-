package com.enterprise.supply.util;

import com.enterprise.supply.entity.User;
import com.enterprise.supply.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * 数据初始化类
 * 项目启动时自动执行，初始化测试用户和基础数据
 */
@Component
@Order(1)
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // 静默初始化，不输出日志
        initUsers();
        initRecipes();
    }

    /**
     * 初始化测试用户
     */
    private void initUsers() {
        // 检查是否已有测试用户，避免重复插入
        User existingUser = userRepository.findByUsername("superadmin");
        if (existingUser != null) {
            // 静默跳过，不输出日志
            return;
        }

        // 静默初始化用户
        List<User> testUsers = Arrays.asList(
                createUser("superadmin", "123456", "系统管理员", "ADMIN", "信息中心", "行政楼501", "13800000001"),
                createUser("manager001", "123456", "王主管", "MANAGER", "后勤处", "行政楼101", "13800001001"),
                createUser("dispatcher001", "123456", "张配送", "DISPATCHER", "后勤处", "配送中心", "13800003001"),
                createUser("finance001", "123456", "刘会计", "ADMIN", "财务处", "行政楼201", "13800004001"),
                createUser("staff001", "123456", "陈员工", "STAFF", "技术部", "办公楼3楼301", "13800005001"),
                createUser("staff002", "123456", "李员工", "STAFF", "市场部", "办公楼2楼205", "13800005002"),
                createUser("staff003", "123456", "张员工", "STAFF", "人事部", "办公楼2楼210", "13800005003")
        );

        for (User user : testUsers) {
            try {
                userRepository.save(user);
                // 静默保存，不输出日志
            } catch (Exception e) {
                // 静默处理异常，不输出日志
            }
        }
    }

    /**
     * 初始化用品目录数据
     */
    private void initRecipes() {
        try {
            // 检查是否已有用品数据
            String countSql = "SELECT COUNT(*) FROM t_supply_item";
            Integer count = jdbcTemplate.queryForObject(countSql, Integer.class);
            if (count != null && count > 0) {
                // 已有数据也要做一次兜底修复：避免历史数据 status 为空导致业务逻辑过滤掉
                try {
                    jdbcTemplate.update("UPDATE t_supply_item SET status = 1 WHERE status IS NULL");
                } catch (Exception ignored) {
                    // 静默处理
                }
                // 静默跳过初始化插入，不输出日志
                return;
            }

            // 静默初始化用品目录数据
            String insertSql = "INSERT INTO t_supply_item (name, category, price, unit, description, status) VALUES (?, ?, ?, ?, ?, 1)";

            List<Object[]> recipes = Arrays.asList(
                    new Object[]{"中性笔 0.5mm 黑色", "书写工具", 2.50, "支", "速干墨水，书写顺滑，日常办公必备"},
                    new Object[]{"中性笔 0.5mm 蓝色", "书写工具", 2.50, "支", "速干墨水，用于签名与批注"},
                    new Object[]{"中性笔 0.5mm 红色", "书写工具", 2.50, "支", "用于批改与重点标注"},
                    new Object[]{"按动圆珠笔 0.7mm", "书写工具", 3.00, "支", "按键式设计，无需笔帽"},
                    new Object[]{"自动铅笔 0.5mm", "书写工具", 8.00, "支", "金属笔夹，附送铅芯"},
                    new Object[]{"铅笔 HB 12支装", "书写工具", 6.00, "盒", "椴木笔杆，易削不易断"},
                    new Object[]{"荧光笔 6色套装", "书写工具", 15.00, "套", "醒目不透纸，标注重点"},
                    new Object[]{"白板笔 黑色", "书写工具", 6.00, "支", "可擦写，会议室专用"},
                    new Object[]{"记号笔 油性 黑色", "书写工具", 5.00, "支", "防水耐磨，适用多种表面"},
                    new Object[]{"笔芯 0.5mm 黑色", "书写工具", 1.50, "支", "适配通用中性笔"},
                    new Object[]{"A4 复印纸 70g", "纸张本册", 22.00, "包", "500张/包，高白度不卡纸"},
                    new Object[]{"A4 复印纸 80g", "纸张本册", 28.00, "包", "500张/包，加厚挺括"},
                    new Object[]{"A3 复印纸 70g", "纸张本册", 45.00, "包", "500张/包，用于图纸与表格"},
                    new Object[]{"B5 笔记本 60页", "纸张本册", 5.00, "本", "横线内页，胶装不掉页"},
                    new Object[]{"A5 笔记本 100页", "纸张本册", 8.00, "本", "便携尺寸，适合会议记录"},
                    new Object[]{"皮革封面记事本 A5", "纸张本册", 25.00, "本", "商务风格，含笔插与书签带"},
                    new Object[]{"便利贴 76x76mm", "纸张本册", 4.00, "本", "100张/本，可反复粘贴"},
                    new Object[]{"指示标签 5色", "纸张本册", 3.50, "包", "用于文件索引与页码标记"},
                    new Object[]{"牛皮纸档案袋", "纸张本册", 1.20, "个", "加厚牛皮纸，可装A4文件"},
                    new Object[]{"收据本 二联", "纸张本册", 4.50, "本", "自带复写，用于报销凭证"},
                    new Object[]{"A4 抽杆文件夹", "文件管理", 2.00, "个", "透明抽杆，可容纳60页"},
                    new Object[]{"A4 强力夹文件夹", "文件管理", 6.50, "个", "硬壳板夹，适合外出携带"},
                    new Object[]{"A4 资料册 60页", "文件管理", 18.00, "本", "内置透明内袋，防尘防潮"},
                    new Object[]{"档案盒 A4 塑料", "文件管理", 7.00, "个", "背宽55mm，脊背可写标签"},
                    new Object[]{"拉链文件袋 A4", "文件管理", 9.00, "个", "防水耐磨，带提手"},
                    new Object[]{"长尾夹 15mm 60只", "文件管理", 8.00, "盒", "强力夹持，反复使用"},
                    new Object[]{"订书钉 24/6", "文件管理", 2.00, "盒", "1000枚/盒，适配12号订书机"},
                    new Object[]{"回形针 100只", "文件管理", 2.50, "盒", "镀镍防锈，不易变形"},
                    new Object[]{"订书机 12号", "桌面文具", 15.00, "个", "金属机身，可订25页"},
                    new Object[]{"重型订书机", "桌面文具", 45.00, "个", "可订100页，适合装订标书"},
                    new Object[]{"起钉器", "桌面文具", 3.00, "个", "省力设计，不伤纸面"},
                    new Object[]{"剪刀 中号", "桌面文具", 9.00, "把", "不锈钢刀刃，办公裁切"},
                    new Object[]{"美工刀 18mm", "桌面文具", 6.00, "把", "可折断刀片，带锁定"},
                    new Object[]{"固体胶 21g", "桌面文具", 4.50, "支", "粘性强，不易渗透纸张"},
                    new Object[]{"透明胶带 18mm", "桌面文具", 3.00, "卷", "高透明，不易发黄"},
                    new Object[]{"胶带座 中号", "桌面文具", 12.00, "个", "防滑底座，单手撕断"},
                    new Object[]{"直尺 30cm", "桌面文具", 3.50, "把", "不锈钢材质，刻度清晰"},
                    new Object[]{"计算器 12位", "桌面文具", 35.00, "个", "太阳能双电源，大屏显示"},
                    new Object[]{"笔筒 金属网纹", "桌面文具", 14.00, "个", "多格分隔，收纳桌面文具"},
                    new Object[]{"桌面文件架 三层", "桌面文具", 28.00, "个", "金属网架，分类放置文件"},
                    new Object[]{"硒鼓 通用型", "办公耗材", 180.00, "个", "适配主流激光打印机"},
                    new Object[]{"墨盒 黑色", "办公耗材", 120.00, "个", "高容量，打印清晰"},
                    new Object[]{"复印机碳粉", "办公耗材", 260.00, "瓶", "原厂规格，打印量大"},
                    new Object[]{"打印纸标签 A4", "办公耗材", 32.00, "包", "不干胶标签，100张/包"},
                    new Object[]{"白板擦", "办公耗材", 6.00, "个", "绒面吸附，擦拭干净"},
                    new Object[]{"白板清洁剂", "办公耗材", 18.00, "瓶", "去除顽固笔迹"},
                    new Object[]{"电池 5号 4粒", "办公耗材", 9.00, "板", "碱性电池，用于键鼠设备"},
                    new Object[]{"电池 7号 4粒", "办公耗材", 9.00, "板", "碱性电池，用于遥控设备"},
                    new Object[]{"碎纸机 家用小型", "办公设备", 320.00, "台", "单次6张，带过载保护"},
                    new Object[]{"键盘 有线 USB", "办公设备", 65.00, "个", "静音按键，即插即用"},
                    new Object[]{"鼠标 有线 USB", "办公设备", 45.00, "个", "光学追踪，人体工学"}
            );

            jdbcTemplate.batchUpdate(insertSql, recipes);
            // 初始化完成后兜底修复一次，确保 status 不为空
            try {
                jdbcTemplate.update("UPDATE t_supply_item SET status = 1 WHERE status IS NULL");
            } catch (Exception ignored) {
                // 静默处理
            }
            // 静默保存，不输出日志
        } catch (Exception e) {
            // 表可能不存在，静默处理
        }
    }

    /**
     * 创建用户对象
     */
    private User createUser(String username, String password, String realName,
                            String role, String deptName, String location, String phone) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(password);
        user.setRealName(realName);
        user.setRole(role);
        user.setDeptName(deptName);
        user.setLocation(location);
        user.setPhone(phone);
        return user;
    }
}
