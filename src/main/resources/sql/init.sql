-- ============================================================
-- 企业办公用品申领管理系统 - 数据库初始化脚本
-- 说明：用于把测试数据重置到固定初始状态，可反复执行
-- ============================================================

-- ⚠ 本脚本会先 DROP 再重建 office_supply 库，库中现有数据会全部丢失！
--   这是刻意设计的：本脚本的用途就是「把测试数据重置到已知初始状态」，
--   必须保证反复执行都得到完全一致的结果。
--   之前用 CREATE DATABASE IF NOT EXISTS 不删库，第二次执行会因为
--   sys_user.username 唯一约束而报 Duplicate entry 'superadmin'，
--   并且脚本会中断在半路，导致数据处于不完整状态。
--   若只想补数据、不清库，请改用 sql/data.sql。

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS office_supply;
SET FOREIGN_KEY_CHECKS = 1;

CREATE DATABASE office_supply DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE office_supply;

-- 1. 用户表 (User)
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '工号',
    password VARCHAR(100) NOT NULL DEFAULT '123456',
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'ADMIN(系统管理员), MANAGER(后勤主管), STAFF(普通员工)',
    dept_name VARCHAR(50) COMMENT '部门',
    location VARCHAR(100) COMMENT '工位',
    phone VARCHAR(20)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '用户表';

-- 2. 用品目录表 (SupplyItem)：对应原食谱库，存放可申领的办公用品
CREATE TABLE IF NOT EXISTS t_supply_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) COMMENT '书写工具, 纸张本册, 文件管理, 桌面文具, 办公耗材, 办公设备',
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10) DEFAULT '个',
    image_url VARCHAR(255) COMMENT '图片URL',
    description VARCHAR(500),
    status INT DEFAULT 1 COMMENT '1: 正常, 0: 已删除'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '用品目录（可申领的办公用品）';

-- 3. 领用计划表 (AvailabilityPlan)：对应原每日菜单，表示某日可申领的用品
CREATE TABLE IF NOT EXISTS t_availability_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    supply_item_id BIGINT COMMENT '关联用品目录ID',
    plan_price DECIMAL(10,2) COMMENT '当日结算单价',
    plan_date VARCHAR(10) COMMENT '计划日期 YYYY-MM-DD',
    status INT DEFAULT 1 COMMENT '1: 已发布, 0: 未发布',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    stock INT DEFAULT 999 COMMENT '可申领数量'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '领用计划（某日可申领的用品清单）';

-- 4. 申领主表 (Requisition)：对应原订单主表
CREATE TABLE IF NOT EXISTS t_requisition (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '申领人ID',
    requisition_no VARCHAR(50) UNIQUE NOT NULL COMMENT '申领单号',
    total_amount DECIMAL(10,2),
    status INT DEFAULT 0 COMMENT '0:待备货 1:已完成 2:已取消',
    note TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    finish_time DATETIME,
    employee_id VARCHAR(50),
    date DATE,
    cancel_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '申领主表';

-- 5. 申领明细表 (RequisitionItem)：对应原订单项表
CREATE TABLE IF NOT EXISTS t_requisition_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    requisition_id BIGINT NOT NULL COMMENT '所属申领单',
    item_id BIGINT COMMENT '用品ID',
    item_name VARCHAR(100) NULL COMMENT '用品名称',
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    sub_total DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT '个' COMMENT '单位（如支、包、个等）',
    FOREIGN KEY (requisition_id) REFERENCES t_requisition(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '申领明细表';


-- 7. 汇总表 (SummarySheet 相关)：按日汇总申领数量与金额
CREATE TABLE IF NOT EXISTS requisition_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    summary_date DATE,
    total_amount DECIMAL(10,2),
    total_quantity INT,
    generated_at DATETIME
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '申领汇总表';

CREATE TABLE IF NOT EXISTS plan_item_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    daily_summary_id BIGINT,
    plan_item_id BIGINT,
    plan_item_name VARCHAR(255),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    FOREIGN KEY (daily_summary_id) REFERENCES requisition_summaries(id)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '汇总明细表';

-- 8. 系统设置表 (System Settings)
CREATE TABLE IF NOT EXISTS t_system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value VARCHAR(500) COMMENT '配置值',
    description VARCHAR(500) COMMENT '配置说明',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '系统设置表';

-- 9. 员工表 (Staff)：用于配送与打印，对应原员工表
CREATE TABLE IF NOT EXISTS t_staff (
    id VARCHAR(255) NOT NULL PRIMARY KEY COMMENT '员工ID',
    name VARCHAR(255) COMMENT '员工姓名',
    phone VARCHAR(255) COMMENT '联系电话',
    workstation VARCHAR(255) COMMENT '工位信息'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '员工信息表';

-- ============================================================
-- 基础数据
-- ============================================================

-- 测试账号（密码均为 123456）
INSERT INTO sys_user (username, password, real_name, role, dept_name, location, phone) VALUES
('superadmin', '123456', '系统管理员', 'ADMIN', '信息中心', '行政楼501', '13800000001'),
('manager001', '123456', '王主管', 'MANAGER', '后勤处', '行政楼101', '13800001001'),
('dispatcher001', '123456', '张配送', 'DISPATCHER', '后勤处', '配送中心', '13800003001'),
('finance001', '123456', '刘会计', 'ADMIN', '财务处', '行政楼201', '13800004001'),
('staff001', '123456', '陈员工', 'STAFF', '技术部', '办公楼3楼301', '13800005001'),
('staff002', '123456', '李员工', 'STAFF', '市场部', '办公楼2楼205', '13800005002'),
('staff003', '123456', '张员工', 'STAFF', '人事部', '办公楼2楼210', '13800005003');

-- 员工数据（配送单使用）
INSERT INTO t_staff (id, name, phone, workstation) VALUES
('1', '张三', '13800138001', '研发部-A101'),
('2', '李四', '13800138002', '测试部-B201'),
('3', '王五', '13800138003', '产品部-C301'),
('4', '赵六', '13800138004', '设计部-D401'),
('5', '钱七', '13800138005', '运营部-E501'),
('6', '孙八', '13800138006', '市场部-F601'),
('7', '周九', '13800138007', '财务部-G701'),
('8', '吴十', '13800138008', '人事部-H801');

-- 用品目录数据
INSERT INTO t_supply_item (name, category, price, unit, description, status) VALUES
('中性笔 0.5mm 黑色', '书写工具', 2.50, '支', '速干墨水，书写顺滑，日常办公必备', 1),
('中性笔 0.5mm 蓝色', '书写工具', 2.50, '支', '速干墨水，用于签名与批注', 1),
('中性笔 0.5mm 红色', '书写工具', 2.50, '支', '用于批改与重点标注', 1),
('按动圆珠笔 0.7mm', '书写工具', 3.00, '支', '按键式设计，无需笔帽', 1),
('自动铅笔 0.5mm', '书写工具', 8.00, '支', '金属笔夹，附送铅芯', 1),
('铅笔 HB 12支装', '书写工具', 6.00, '盒', '椴木笔杆，易削不易断', 1),
('荧光笔 6色套装', '书写工具', 15.00, '套', '醒目不透纸，标注重点', 1),
('白板笔 黑色', '书写工具', 6.00, '支', '可擦写，会议室专用', 1),
('记号笔 油性 黑色', '书写工具', 5.00, '支', '防水耐磨，适用多种表面', 1),
('笔芯 0.5mm 黑色', '书写工具', 1.50, '支', '适配通用中性笔', 1),
('A4 复印纸 70g', '纸张本册', 22.00, '包', '500张/包，高白度不卡纸', 1),
('A4 复印纸 80g', '纸张本册', 28.00, '包', '500张/包，加厚挺括', 1),
('A3 复印纸 70g', '纸张本册', 45.00, '包', '500张/包，用于图纸与表格', 1),
('B5 笔记本 60页', '纸张本册', 5.00, '本', '横线内页，胶装不掉页', 1),
('A5 笔记本 100页', '纸张本册', 8.00, '本', '便携尺寸，适合会议记录', 1),
('皮革封面记事本 A5', '纸张本册', 25.00, '本', '商务风格，含笔插与书签带', 1),
('便利贴 76x76mm', '纸张本册', 4.00, '本', '100张/本，可反复粘贴', 1),
('指示标签 5色', '纸张本册', 3.50, '包', '用于文件索引与页码标记', 1),
('牛皮纸档案袋', '纸张本册', 1.20, '个', '加厚牛皮纸，可装A4文件', 1),
('收据本 二联', '纸张本册', 4.50, '本', '自带复写，用于报销凭证', 1),
('A4 抽杆文件夹', '文件管理', 2.00, '个', '透明抽杆，可容纳60页', 1),
('A4 强力夹文件夹', '文件管理', 6.50, '个', '硬壳板夹，适合外出携带', 1),
('A4 资料册 60页', '文件管理', 18.00, '本', '内置透明内袋，防尘防潮', 1),
('档案盒 A4 塑料', '文件管理', 7.00, '个', '背宽55mm，脊背可写标签', 1),
('拉链文件袋 A4', '文件管理', 9.00, '个', '防水耐磨，带提手', 1),
('长尾夹 15mm 60只', '文件管理', 8.00, '盒', '强力夹持，反复使用', 1),
('订书钉 24/6', '文件管理', 2.00, '盒', '1000枚/盒，适配12号订书机', 1),
('回形针 100只', '文件管理', 2.50, '盒', '镀镍防锈，不易变形', 1),
('订书机 12号', '桌面文具', 15.00, '个', '金属机身，可订25页', 1),
('重型订书机', '桌面文具', 45.00, '个', '可订100页，适合装订标书', 1),
('起钉器', '桌面文具', 3.00, '个', '省力设计，不伤纸面', 1),
('剪刀 中号', '桌面文具', 9.00, '把', '不锈钢刀刃，办公裁切', 1),
('美工刀 18mm', '桌面文具', 6.00, '把', '可折断刀片，带锁定', 1),
('固体胶 21g', '桌面文具', 4.50, '支', '粘性强，不易渗透纸张', 1),
('透明胶带 18mm', '桌面文具', 3.00, '卷', '高透明，不易发黄', 1),
('胶带座 中号', '桌面文具', 12.00, '个', '防滑底座，单手撕断', 1),
('直尺 30cm', '桌面文具', 3.50, '把', '不锈钢材质，刻度清晰', 1),
('计算器 12位', '桌面文具', 35.00, '个', '太阳能双电源，大屏显示', 1),
('笔筒 金属网纹', '桌面文具', 14.00, '个', '多格分隔，收纳桌面文具', 1),
('桌面文件架 三层', '桌面文具', 28.00, '个', '金属网架，分类放置文件', 1),
('硒鼓 通用型', '办公耗材', 180.00, '个', '适配主流激光打印机', 1),
('墨盒 黑色', '办公耗材', 120.00, '个', '高容量，打印清晰', 1),
('复印机碳粉', '办公耗材', 260.00, '瓶', '原厂规格，打印量大', 1),
('打印纸标签 A4', '办公耗材', 32.00, '包', '不干胶标签，100张/包', 1),
('白板擦', '办公耗材', 6.00, '个', '绒面吸附，擦拭干净', 1),
('白板清洁剂', '办公耗材', 18.00, '瓶', '去除顽固笔迹', 1),
('电池 5号 4粒', '办公耗材', 9.00, '板', '碱性电池，用于键鼠设备', 1),
('电池 7号 4粒', '办公耗材', 9.00, '板', '碱性电池，用于遥控设备', 1),
('碎纸机 家用小型', '办公设备', 320.00, '台', '单次6张，带过载保护', 1),
('键盘 有线 USB', '办公设备', 65.00, '个', '静音按键，即插即用', 1),
('鼠标 有线 USB', '办公设备', 45.00, '个', '光学追踪，人体工学', 1);

-- 为每个用品绑定配图
UPDATE t_supply_item SET image_url = '/images/1.jpeg' WHERE name = '中性笔 0.5mm 黑色';
UPDATE t_supply_item SET image_url = '/images/2.jpeg' WHERE name = '中性笔 0.5mm 蓝色';
UPDATE t_supply_item SET image_url = '/images/3.jpeg' WHERE name = '中性笔 0.5mm 红色';
UPDATE t_supply_item SET image_url = '/images/4.jpeg' WHERE name = '按动圆珠笔 0.7mm';
UPDATE t_supply_item SET image_url = '/images/5.jpeg' WHERE name = '自动铅笔 0.5mm';
UPDATE t_supply_item SET image_url = '/images/6.jpeg' WHERE name = '铅笔 HB 12支装';
UPDATE t_supply_item SET image_url = '/images/7.jpeg' WHERE name = '荧光笔 6色套装';
UPDATE t_supply_item SET image_url = '/images/8.jpeg' WHERE name = '白板笔 黑色';
UPDATE t_supply_item SET image_url = '/images/9.jpeg' WHERE name = '记号笔 油性 黑色';
UPDATE t_supply_item SET image_url = '/images/10.jpeg' WHERE name = '笔芯 0.5mm 黑色';
UPDATE t_supply_item SET image_url = '/images/11.jpeg' WHERE name = 'A4 复印纸 70g';
UPDATE t_supply_item SET image_url = '/images/12.jpeg' WHERE name = 'A4 复印纸 80g';
UPDATE t_supply_item SET image_url = '/images/13.jpeg' WHERE name = 'A3 复印纸 70g';
UPDATE t_supply_item SET image_url = '/images/14.jpeg' WHERE name = 'B5 笔记本 60页';
UPDATE t_supply_item SET image_url = '/images/15.jpeg' WHERE name = 'A5 笔记本 100页';
UPDATE t_supply_item SET image_url = '/images/16.jpeg' WHERE name = '皮革封面记事本 A5';
UPDATE t_supply_item SET image_url = '/images/17.jpeg' WHERE name = '便利贴 76x76mm';
UPDATE t_supply_item SET image_url = '/images/18.jpeg' WHERE name = '指示标签 5色';
UPDATE t_supply_item SET image_url = '/images/19.jpeg' WHERE name = '牛皮纸档案袋';
UPDATE t_supply_item SET image_url = '/images/20.jpeg' WHERE name = '收据本 二联';
UPDATE t_supply_item SET image_url = '/images/21.jpeg' WHERE name = 'A4 抽杆文件夹';
UPDATE t_supply_item SET image_url = '/images/22.jpeg' WHERE name = 'A4 强力夹文件夹';
UPDATE t_supply_item SET image_url = '/images/23.jpeg' WHERE name = 'A4 资料册 60页';
UPDATE t_supply_item SET image_url = '/images/24.jpeg' WHERE name = '档案盒 A4 塑料';
UPDATE t_supply_item SET image_url = '/images/25.jpeg' WHERE name = '拉链文件袋 A4';
UPDATE t_supply_item SET image_url = '/images/26.jpeg' WHERE name = '长尾夹 15mm 60只';
UPDATE t_supply_item SET image_url = '/images/27.jpeg' WHERE name = '订书钉 24/6';
UPDATE t_supply_item SET image_url = '/images/28.jpeg' WHERE name = '回形针 100只';
UPDATE t_supply_item SET image_url = '/images/29.jpeg' WHERE name = '订书机 12号';
UPDATE t_supply_item SET image_url = '/images/30.jpeg' WHERE name = '重型订书机';
UPDATE t_supply_item SET image_url = '/images/31.jpeg' WHERE name = '起钉器';
UPDATE t_supply_item SET image_url = '/images/32.jpeg' WHERE name = '剪刀 中号';
UPDATE t_supply_item SET image_url = '/images/33.jpeg' WHERE name = '美工刀 18mm';
UPDATE t_supply_item SET image_url = '/images/34.jpeg' WHERE name = '固体胶 21g';
UPDATE t_supply_item SET image_url = '/images/35.jpeg' WHERE name = '透明胶带 18mm';
UPDATE t_supply_item SET image_url = '/images/36.jpeg' WHERE name = '胶带座 中号';
UPDATE t_supply_item SET image_url = '/images/37.jpeg' WHERE name = '直尺 30cm';
UPDATE t_supply_item SET image_url = '/images/38.jpeg' WHERE name = '计算器 12位';
UPDATE t_supply_item SET image_url = '/images/39.jpeg' WHERE name = '笔筒 金属网纹';
UPDATE t_supply_item SET image_url = '/images/40.jpeg' WHERE name = '桌面文件架 三层';
UPDATE t_supply_item SET image_url = '/images/41.jpeg' WHERE name = '硒鼓 通用型';
UPDATE t_supply_item SET image_url = '/images/42.jpeg' WHERE name = '墨盒 黑色';
UPDATE t_supply_item SET image_url = '/images/43.jpeg' WHERE name = '复印机碳粉';
UPDATE t_supply_item SET image_url = '/images/44.jpeg' WHERE name = '打印纸标签 A4';
UPDATE t_supply_item SET image_url = '/images/45.jpeg' WHERE name = '白板擦';
UPDATE t_supply_item SET image_url = '/images/46.jpeg' WHERE name = '白板清洁剂';
UPDATE t_supply_item SET image_url = '/images/47.jpeg' WHERE name = '电池 5号 4粒';
UPDATE t_supply_item SET image_url = '/images/48.jpeg' WHERE name = '电池 7号 4粒';
UPDATE t_supply_item SET image_url = '/images/49.jpeg' WHERE name = '碎纸机 家用小型';
UPDATE t_supply_item SET image_url = '/images/50.jpeg' WHERE name = '键盘 有线 USB';
UPDATE t_supply_item SET image_url = '/images/51.jpeg' WHERE name = '鼠标 有线 USB';

INSERT INTO t_system_settings (config_key, config_value, description) VALUES
('ORDER_CUTOFF_TIME', '09:00', '申领截止时间（ENFORCE_ORDER_TIME=true 时生效）'),
('SERVE_START_TIME', '11:30', '领用开始时间（ENFORCE_ORDER_TIME=true 时生效）'),
('ENFORCE_ORDER_TIME', 'false', '是否启用申领时间限制：true=启用；false/空=不限制（便于测试）')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
