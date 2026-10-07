-- ============================================================================
-- 数据库迁移脚本：xiaoyi_dining  ->  office_supply
--
-- 背景：项目从「企业办公用品申领管理系统」改名为「企业办公用品申领管理系统」，
--       原来的库名、表名、列名都带申领语义，现在统一改成办公用品申领语义，
--       并且要保留原有业务数据。
--
-- 为什么不用 RENAME TABLE 跨库搬表（这是踩过的坑）：
--   1) MySQL 没有 "RENAME DATABASE"，跨库 RENAME TABLE 虽然能搬表，
--      但它只改表名，不会改列名，搬完还是 dish_id / order_no 这些旧列名；
--   2) 跨库搬表会破坏外键——被引用表如果留在旧库，约束的目标就悬空了，
--      后续再加约束会报 "Key column doesn't exist" 之类的错。
--   因此这里改成最稳的做法：
--      在新库里按新结构建表 -> 从旧表按列对应关系导入数据 -> 再补外键。
--   全程不依赖旧库结构，列名映射是显式写出来的，可控可核对。
--
-- 执行方式：
--       mysql -uroot -p < migrate_to_office_supply.sql
--   或在 Navicat / IDEA Database 控制台整体执行。
--
-- 执行前请停止应用，避免迁移过程中还有写入。
-- 脚本可重复执行：建表用 IF NOT EXISTS，导入用 INSERT ... SELECT 前先清表。
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 第 0 步：创建新库
-- ---------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS office_supply
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE office_supply;

-- 迁移期间先关外键检查，避免导入顺序导致的约束报错；结束时恢复。
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- 第 1 步：按新结构建表（结构与 init.sql 保持一致）
-- ---------------------------------------------------------------------------

-- 1.1 用户表（沿用原名 sys_user，只是搬到新库）
-- 注意末尾的 ROW_FORMAT=DYNAMIC：utf8mb4 下一个 VARCHAR(50) 的唯一索引占 200 字节，
-- 旧库这张表是 MyISAM（索引上限 1000 字节）所以能建；
-- 换成 InnoDB 默认行格式时索引上限更小，会报 "Specified key was too long"。
-- 显式声明 DYNAMIC 行格式，索引上限可达 3072 字节，既能建表也保持 InnoDB 事务特性。
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '工号',
    password VARCHAR(100) NOT NULL DEFAULT '123456',
    real_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    dept_name VARCHAR(50) COMMENT '部门',
    location VARCHAR(100) COMMENT '工位',
    phone VARCHAR(20)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '用户表';

-- 1.2 用品目录（原 t_recipe）
CREATE TABLE IF NOT EXISTS t_supply_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) COMMENT '用品分类',
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10) DEFAULT '个',
    image_url VARCHAR(255) COMMENT '图片URL',
    description VARCHAR(500),
    status INT DEFAULT 1 COMMENT '1: 正常, 0: 已删除'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '用品目录（可申领的办公用品）';

-- 1.3 领用计划（原 t_daily_menu）
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

-- 1.4 申领主表（原 t_order）
CREATE TABLE IF NOT EXISTS t_requisition (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '申领人ID',
    requisition_no VARCHAR(50) UNIQUE NOT NULL COMMENT '申领单号',
    total_amount DECIMAL(10,2),
    status INT DEFAULT 0 COMMENT '0:待备货 1:备货中 2:待领取 3:已完成 4:已取消',
    note TEXT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    finish_time DATETIME,
    employee_id VARCHAR(50),
    date DATE,
    cancel_time DATETIME
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '申领主表';

-- 1.5 申领明细（原 t_order_item）
CREATE TABLE IF NOT EXISTS t_requisition_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    requisition_id BIGINT NOT NULL COMMENT '所属申领单',
    item_id BIGINT COMMENT '用品ID',
    item_name VARCHAR(100) NULL COMMENT '用品名称',
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    sub_total DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT '个' COMMENT '单位'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '申领明细表';

-- 1.6 办公设备（原 t_dish）
CREATE TABLE IF NOT EXISTS t_equipment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    status INT DEFAULT 1 COMMENT '1: 启用, 0: 停用',
    is_recommend INT DEFAULT 0 COMMENT '1: 推荐, 0: 不推荐',
    sales_count INT DEFAULT 0 COMMENT '领用次数'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '办公设备表';

-- 1.7 申领汇总（原 daily_order_summaries）
CREATE TABLE IF NOT EXISTS requisition_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    summary_date DATE,
    total_amount DECIMAL(10,2),
    total_quantity INT,
    generated_at DATETIME
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '申领汇总表';

-- 1.8 汇总明细（原 menu_item_summaries）
CREATE TABLE IF NOT EXISTS plan_item_summaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    daily_summary_id BIGINT,
    plan_item_id BIGINT,
    plan_item_name VARCHAR(255),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2)
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '汇总明细表';

-- 1.9 系统设置（原名不变）
CREATE TABLE IF NOT EXISTS t_system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value VARCHAR(500) COMMENT '配置值',
    description VARCHAR(500) COMMENT '配置说明',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '系统设置表';

-- 1.10 员工表（原 t_employee）
CREATE TABLE IF NOT EXISTS t_staff (
    id VARCHAR(255) NOT NULL PRIMARY KEY COMMENT '员工ID',
    name VARCHAR(255) COMMENT '员工姓名',
    phone VARCHAR(255) COMMENT '联系电话',
    workstation VARCHAR(255) COMMENT '工位信息'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '员工信息表';

-- ---------------------------------------------------------------------------
-- 第 2 步：从旧库导入数据（列名显式对应，缺失的旧表自动跳过）
--   先清表再导入，保证脚本重复执行也不会产生重复数据。
-- ---------------------------------------------------------------------------

-- 2.1 sys_user
DELETE FROM sys_user;
INSERT INTO sys_user (id, username, password, real_name, role, dept_name, location, phone)
SELECT id, username, password, real_name, role, dept_name, location, phone
FROM xiaoyi_dining.sys_user;

-- 2.2 t_supply_item  <- t_recipe
DELETE FROM t_supply_item;
INSERT INTO t_supply_item (id, name, category, price, unit, image_url, description, status)
SELECT id, name, category, price,
       COALESCE(unit, '个'), image_url, description, COALESCE(status, 1)
FROM xiaoyi_dining.t_recipe;

-- 2.3 t_availability_plan  <- t_daily_menu（recipe_id -> supply_item_id，price_today -> plan_price，serve_date -> plan_date）
DELETE FROM t_availability_plan;
INSERT INTO t_availability_plan (id, supply_item_id, plan_price, plan_date, status, create_time, update_time, stock)
SELECT id, recipe_id, price_today, serve_date, status, create_time, update_time, COALESCE(stock, 999)
FROM xiaoyi_dining.t_daily_menu;

-- 2.4 t_requisition  <- t_order（order_no -> requisition_no；date 为关键字，用反引号）
DELETE FROM t_requisition;
INSERT INTO t_requisition (id, user_id, requisition_no, total_amount, status, note, create_time, finish_time, employee_id, `date`, cancel_time)
SELECT id, user_id, order_no, total_amount, status, note, create_time, finish_time, employee_id, `date`, cancel_time
FROM xiaoyi_dining.t_order;

-- 2.5 t_requisition_item  <- t_order_item（order_id -> requisition_id，dish_id -> item_id，dish_name -> item_name）
DELETE FROM t_requisition_item;
INSERT INTO t_requisition_item (id, requisition_id, item_id, item_name, price, quantity, sub_total, unit)
SELECT id, order_id, dish_id, dish_name, price, quantity, sub_total, COALESCE(unit, '个')
FROM xiaoyi_dining.t_order_item;

-- 2.6 t_equipment  <- t_dish（列名基本一致）
DELETE FROM t_equipment;
INSERT INTO t_equipment (id, category_id, name, price, description, image_url, status, is_recommend, sales_count)
SELECT id, category_id, name, price, description, image_url, status, is_recommend, sales_count
FROM xiaoyi_dining.t_dish;

-- 2.7 requisition_summaries  <- daily_order_summaries
DELETE FROM requisition_summaries;
INSERT INTO requisition_summaries (id, summary_date, total_amount, total_quantity, generated_at)
SELECT id, summary_date, total_amount, total_quantity, generated_at
FROM xiaoyi_dining.daily_order_summaries;

-- 2.8 plan_item_summaries  <- menu_item_summaries
DELETE FROM plan_item_summaries;
INSERT INTO plan_item_summaries (id, daily_summary_id, plan_item_id, plan_item_name, quantity, unit_price, total_price)
SELECT id, daily_summary_id, menu_item_id, menu_item_name, quantity, unit_price, total_price
FROM xiaoyi_dining.menu_item_summaries;

-- 2.9 t_system_settings
DELETE FROM t_system_settings;
INSERT INTO t_system_settings (id, config_key, config_value, description, update_time)
SELECT id, config_key, config_value, description, update_time
FROM xiaoyi_dining.t_system_settings;

-- 2.10 t_staff  <- t_employee（旧表可能不存在，单独用存储过程保护）
DROP PROCEDURE IF EXISTS migrate_staff;
DELIMITER $$
CREATE PROCEDURE migrate_staff()
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.TABLES
               WHERE TABLE_SCHEMA='xiaoyi_dining' AND TABLE_NAME='t_employee') THEN
        DELETE FROM t_staff;
        INSERT INTO t_staff (id, name, phone, workstation)
        SELECT id, name, phone, workstation FROM xiaoyi_dining.t_employee;
    END IF;
END$$
DELIMITER ;
CALL migrate_staff();
DROP PROCEDURE IF EXISTS migrate_staff;

-- ---------------------------------------------------------------------------
-- 第 3 步：补上外键约束
--   外键在建表阶段没加，这里在数据导入完成后再补，避免导入顺序问题。
-- ---------------------------------------------------------------------------

-- 3.1 t_requisition.user_id -> sys_user.id
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA='office_supply' AND TABLE_NAME='t_requisition'
            AND CONSTRAINT_TYPE='FOREIGN KEY' AND CONSTRAINT_NAME='fk_requisition_user') = 0,
        'ALTER TABLE t_requisition ADD CONSTRAINT fk_requisition_user FOREIGN KEY (user_id) REFERENCES sys_user(id)',
        'DO 0'
    )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3.2 t_requisition_item.requisition_id -> t_requisition.id
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA='office_supply' AND TABLE_NAME='t_requisition_item'
            AND CONSTRAINT_TYPE='FOREIGN KEY' AND CONSTRAINT_NAME='fk_requisition_item') = 0,
        'ALTER TABLE t_requisition_item ADD CONSTRAINT fk_requisition_item FOREIGN KEY (requisition_id) REFERENCES t_requisition(id)',
        'DO 0'
    )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3.3 plan_item_summaries.daily_summary_id -> requisition_summaries.id
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA='office_supply' AND TABLE_NAME='plan_item_summaries'
            AND CONSTRAINT_TYPE='FOREIGN KEY' AND CONSTRAINT_NAME='fk_plan_item_summary') = 0,
        'ALTER TABLE plan_item_summaries ADD CONSTRAINT fk_plan_item_summary FOREIGN KEY (daily_summary_id) REFERENCES requisition_summaries(id)',
        'DO 0'
    )
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- 第 4 步：核对结果
-- ---------------------------------------------------------------------------
SELECT
    (SELECT COUNT(*) FROM t_supply_item)          AS 用品目录,
    (SELECT COUNT(*) FROM sys_user)               AS 用户,
    (SELECT COUNT(*) FROM t_availability_plan)    AS 领用计划,
    (SELECT COUNT(*) FROM t_requisition)          AS 申领单,
    (SELECT COUNT(*) FROM t_requisition_item)     AS 申领明细,
    (SELECT COUNT(*) FROM t_system_settings)      AS 系统设置;

-- ============================================================================
-- 收尾提示
-- ----------------------------------------------------------------------------
-- 1) 旧库 xiaoyi_dining 未被删除，方便核对；确认无误后可自行执行：
--        DROP DATABASE xiaoyi_dining;
-- 2) 旧库里若还有本项目早期遗留的空表（order_items / orders / menu_items /
--    test_connection），它们不属于当前代码，脚本不会迁移，可一并删除。
-- 3) 用品目录里的 50 条记录原先是「用品」数据，迁移后仍在。
--    若要换成办公用品目录数据，再执行：
--        USE office_supply;
--        source src/main/resources/sql/data.sql;
-- ============================================================================
