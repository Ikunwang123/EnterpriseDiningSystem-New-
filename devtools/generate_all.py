# -*- coding: utf-8 -*-
"""
根据 supply_data.py 生成办公用品申领系统的全部资产：
  1. src/main/resources/sql/init.sql     建库 + 建表 + 种子数据
  2. src/main/resources/sql/data.sql     仅种子数据（含配图映射）
  3. src/main/resources/static/images/N.png  每个用品一张配图
  4. DataInitializer.java 的种子数据片段（由 --apply-java 写回源码）

用法：
  python generate_all.py                 # 生成 SQL 与图片
  python generate_all.py --apply-java    # 另外把种子数据写回 DataInitializer.java
"""

import os
import re
import sys
import argparse

from PIL import Image, ImageDraw, ImageFont

from supply_data import SUPPLIES, STAFF, USERS, CATEGORY_COLORS, sql_escape

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SQL_DIR = os.path.join(ROOT, "src", "main", "resources", "sql")
IMG_DIR = os.path.join(ROOT, "src", "main", "resources", "static", "images")
JAVA_INIT = os.path.join(
    ROOT, "src", "main", "java", "com", "enterprise", "supply", "util", "DataInitializer.java"
)

DB_NAME = "office_supply"

# utf8mb4 下 VARCHAR(255) 主键占 1020 字节，超过部分 InnoDB 行格式的索引上限（1000 字节），
# 必须显式声明 DYNAMIC 行格式（上限 3072 字节），否则建表会报
# "Specified key was too long; max key length is 1000 bytes"。
ROW_FORMAT_TAIL = ") ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '员工信息表';"

# 字体候选：优先中文黑体，保证在图上渲染汉字不出方块
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\simsun.ttc",
]


def find_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def make_icon(index, name, category):
    """生成一张简洁的用品配图。

    设计约束：不是照片，避免与任何真实菜品图片产生观感关联；
    用纯色块 + 用品名首字，视觉上统一、可辨识、风格一致。
    """
    size = 400
    color = CATEGORY_COLORS.get(category, (100, 116, 139))

    # 浅色底：把分类色混白，保证文字对比度
    bg = tuple(int(c + (255 - c) * 0.88) for c in color)

    img = Image.new("RGB", (size, size), bg)
    d = ImageDraw.Draw(img)

    # 圆角卡片 + 分类色
    margin = 36
    d.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=32,
        fill=tuple(int(c + (255 - c) * 0.55) for c in color),
        outline=color,
        width=6,
    )

    # 首字（去掉规格后缀，取中文首字更直观）
    label = name[0] if name else "用"
    font = find_font(150)
    bbox = d.textbbox((0, 0), label, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), label, font=font, fill=color)

    # 底部编号，便于对照
    idx_font = find_font(30)
    tag = f"{index:02d}"
    tb = d.textbbox((0, 0), tag, font=idx_font)
    d.text((size - 36 - (tb[2] - tb[0]), size - 36 - (tb[3] - tb[1])), tag, font=idx_font, fill=color)

    img.save(os.path.join(IMG_DIR, f"{index}.jpeg"), "JPEG", quality=85, optimize=True)


def build_supply_rows():
    rows = []
    for name, cat, price, unit, desc in SUPPLIES:
        rows.append(
            f"('{sql_escape(name)}', '{sql_escape(cat)}', {price:.2f}, "
            f"'{sql_escape(unit)}', '{sql_escape(desc)}', 1)"
        )
    return rows


def gen_init_sql():
    L = []
    L.append("-- ============================================================")
    L.append("-- 企业办公用品申领管理系统 - 数据库初始化脚本")
    L.append("-- 说明：用于把测试数据重置到固定初始状态，可反复执行")
    L.append("-- ============================================================")
    L.append("")
    L.append("-- ⚠ 本脚本会先 DROP 再重建 office_supply 库，库中现有数据会全部丢失！")
    L.append("--   这是刻意设计的：本脚本的用途就是「把测试数据重置到已知初始状态」，")
    L.append("--   必须保证反复执行都得到完全一致的结果。")
    L.append("--   之前用 CREATE DATABASE IF NOT EXISTS 不删库，第二次执行会因为")
    L.append("--   sys_user.username 唯一约束而报 Duplicate entry 'superadmin'，")
    L.append("--   并且脚本会中断在半路，导致数据处于不完整状态。")
    L.append("--   若只想补数据、不清库，请改用 sql/data.sql。")
    L.append("")
    L.append("SET FOREIGN_KEY_CHECKS = 0;")
    L.append(f"DROP DATABASE IF EXISTS {DB_NAME};")
    L.append("SET FOREIGN_KEY_CHECKS = 1;")
    L.append("")
    L.append(f"CREATE DATABASE {DB_NAME} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;")
    L.append(f"USE {DB_NAME};")
    L.append("")
    L.append("-- 1. 用户表 (User)")
    L.append("CREATE TABLE IF NOT EXISTS sys_user (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    username VARCHAR(50) UNIQUE NOT NULL COMMENT '工号',")
    L.append("    password VARCHAR(100) NOT NULL DEFAULT '123456',")
    L.append("    real_name VARCHAR(50) NOT NULL,")
    L.append("    role VARCHAR(20) NOT NULL COMMENT 'ADMIN(系统管理员), MANAGER(后勤主管), STAFF(普通员工)',")
    L.append("    dept_name VARCHAR(50) COMMENT '部门',")
    L.append("    location VARCHAR(100) COMMENT '工位',")
    L.append("    phone VARCHAR(20)")
    L.append(") COMMENT '用户表';")
    L.append("")
    L.append("-- 2. 用品目录表 (SupplyItem)：对应原食谱库，存放可申领的办公用品")
    L.append("CREATE TABLE IF NOT EXISTS t_supply_item (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    name VARCHAR(100) NOT NULL,")
    L.append("    category VARCHAR(20) COMMENT '书写工具, 纸张本册, 文件管理, 桌面文具, 办公耗材, 办公设备',")
    L.append("    price DECIMAL(10,2) NOT NULL,")
    L.append("    unit VARCHAR(10) DEFAULT '个',")
    L.append("    image_url VARCHAR(255) COMMENT '图片URL',")
    L.append("    description VARCHAR(500),")
    L.append("    status INT DEFAULT 1 COMMENT '1: 正常, 0: 已删除'")
    L.append(") COMMENT '用品目录（可申领的办公用品）';")
    L.append("")
    L.append("-- 3. 领用计划表 (AvailabilityPlan)：对应原每日菜单，表示某日可申领的用品")
    L.append("CREATE TABLE IF NOT EXISTS t_availability_plan (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    supply_item_id BIGINT COMMENT '关联用品目录ID',")
    L.append("    plan_price DECIMAL(10,2) COMMENT '当日结算单价',")
    L.append("    plan_date VARCHAR(10) COMMENT '计划日期 YYYY-MM-DD',")
    L.append("    status INT DEFAULT 1 COMMENT '1: 已发布, 0: 未发布',")
    L.append("    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,")
    L.append("    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,")
    L.append("    stock INT DEFAULT 999 COMMENT '可申领数量'")
    L.append(") COMMENT '领用计划（某日可申领的用品清单）';")
    L.append("")
    L.append("-- 4. 申领主表 (Requisition)：对应原订单主表")
    L.append("CREATE TABLE IF NOT EXISTS t_requisition (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    user_id BIGINT NOT NULL COMMENT '申领人ID',")
    L.append("    requisition_no VARCHAR(50) UNIQUE NOT NULL COMMENT '申领单号',")
    L.append("    total_amount DECIMAL(10,2),")
    L.append("    status INT DEFAULT 0 COMMENT '0:待备货 1:已完成 2:已取消',")
    L.append("    note TEXT,")
    L.append("    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,")
    L.append("    finish_time DATETIME,")
    L.append("    employee_id VARCHAR(50),")
    L.append("    date DATE,")
    L.append("    cancel_time DATETIME,")
    L.append("    FOREIGN KEY (user_id) REFERENCES sys_user(id)")
    L.append(") COMMENT '申领主表';")
    L.append("")
    L.append("-- 5. 申领明细表 (RequisitionItem)：对应原订单项表")
    L.append("CREATE TABLE IF NOT EXISTS t_requisition_item (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    requisition_id BIGINT NOT NULL COMMENT '所属申领单',")
    L.append("    item_id BIGINT COMMENT '用品ID',")
    L.append("    item_name VARCHAR(100) NULL COMMENT '用品名称',")
    L.append("    price DECIMAL(10,2) NOT NULL,")
    L.append("    quantity INT NOT NULL DEFAULT 1,")
    L.append("    sub_total DECIMAL(10,2) NOT NULL,")
    L.append("    unit VARCHAR(20) DEFAULT '个' COMMENT '单位（如支、包、个等）',")
    L.append("    FOREIGN KEY (requisition_id) REFERENCES t_requisition(id)")
    L.append(") COMMENT '申领明细表';")
    L.append("")
    L.append("-- 6. 办公设备表 (Equipment)：对应原菜品表，存放固定资产类设备")
    L.append("CREATE TABLE IF NOT EXISTS t_equipment (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    category_id BIGINT,")
    L.append("    name VARCHAR(100) NOT NULL,")
    L.append("    price DECIMAL(10,2) NOT NULL,")
    L.append("    description TEXT,")
    L.append("    image_url VARCHAR(255),")
    L.append("    status INT DEFAULT 1 COMMENT '1: 启用, 0: 停用',")
    L.append("    is_recommend INT DEFAULT 0 COMMENT '1: 推荐, 0: 不推荐',")
    L.append("    sales_count INT DEFAULT 0 COMMENT '领用次数'")
    L.append(") COMMENT '办公设备表';")
    L.append("")
    L.append("-- 7. 汇总表 (SummarySheet 相关)：按日汇总申领数量与金额")
    L.append("CREATE TABLE IF NOT EXISTS requisition_summaries (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    summary_date DATE,")
    L.append("    total_amount DECIMAL(10,2),")
    L.append("    total_quantity INT,")
    L.append("    generated_at DATETIME")
    L.append(") COMMENT '申领汇总表';")
    L.append("")
    L.append("CREATE TABLE IF NOT EXISTS plan_item_summaries (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    daily_summary_id BIGINT,")
    L.append("    plan_item_id BIGINT,")
    L.append("    plan_item_name VARCHAR(255),")
    L.append("    quantity INT,")
    L.append("    unit_price DECIMAL(10,2),")
    L.append("    total_price DECIMAL(10,2),")
    L.append("    FOREIGN KEY (daily_summary_id) REFERENCES requisition_summaries(id)")
    L.append(") COMMENT '汇总明细表';")
    L.append("")
    L.append("-- 8. 系统设置表 (System Settings)")
    L.append("CREATE TABLE IF NOT EXISTS t_system_settings (")
    L.append("    id BIGINT PRIMARY KEY AUTO_INCREMENT,")
    L.append("    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',")
    L.append("    config_value VARCHAR(500) COMMENT '配置值',")
    L.append("    description VARCHAR(500) COMMENT '配置说明',")
    L.append("    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    L.append(") COMMENT '系统设置表';")
    L.append("")
    L.append("-- 9. 员工表 (Staff)：用于配送与打印，对应原员工表")
    L.append("CREATE TABLE IF NOT EXISTS t_staff (")
    L.append("    id VARCHAR(255) NOT NULL PRIMARY KEY COMMENT '员工ID',")
    L.append("    name VARCHAR(255) COMMENT '员工姓名',")
    L.append("    phone VARCHAR(255) COMMENT '联系电话',")
    L.append("    workstation VARCHAR(255) COMMENT '工位信息'")
    L.append(ROW_FORMAT_TAIL)
    L.append("")
    L.append("-- ============================================================")
    L.append("-- 基础数据")
    L.append("-- ============================================================")
    L.append("")
    L.append("-- 测试账号（密码均为 123456）")
    L.append("INSERT INTO sys_user (username, password, real_name, role, dept_name, location, phone) VALUES")
    urows = []
    for u in USERS:
        urows.append(
            f"('{sql_escape(u[0])}', '{sql_escape(u[1])}', '{sql_escape(u[2])}', "
            f"'{sql_escape(u[3])}', '{sql_escape(u[4])}', '{sql_escape(u[5])}', '{sql_escape(u[6])}')"
        )
    L.append(",\n".join(urows) + ";")
    L.append("")
    L.append("-- 员工数据（配送单使用）")
    L.append("INSERT INTO t_staff (id, name, phone, workstation) VALUES")
    srows = []
    for s in STAFF:
        srows.append(f"('{sql_escape(s[0])}', '{sql_escape(s[1])}', '{sql_escape(s[2])}', '{sql_escape(s[3])}')")
    L.append(",\n".join(srows) + ";")
    L.append("")
    L.append("-- 用品目录数据")
    L.append("INSERT INTO t_supply_item (name, category, price, unit, description, status) VALUES")
    L.append(",\n".join(build_supply_rows()) + ";")
    L.append("")
    L.append("-- 为每个用品绑定配图")
    for i, (name, *_rest) in enumerate(SUPPLIES, start=1):
        L.append(f"UPDATE t_supply_item SET image_url = '/images/{i}.jpeg' WHERE name = '{sql_escape(name)}';")
    L.append("")
    L.append("INSERT INTO t_system_settings (config_key, config_value, description) VALUES")
    # 配置键必须与代码里读取的完全一致：
    #   OrderServiceImpl 读 "ORDER_CUTOFF_TIME" / "SERVE_START_TIME" / "ENFORCE_ORDER_TIME"
    #   SettingsModule.js 用前两个键收发
    # 之前这里误写成 REQUISITION_CUTOFF_TIME，会导致「申领截止时间」的配置读不到
    # （代码里虽有默认值 09:00 兜底，不会崩，但界面上改的值会失效）。
    #
    # ENFORCE_ORDER_TIME 是方便测试的开关：
    #   false（默认）→ 不校验申领时间，当天/次日随时可申领，目标日期固定为"当天"
    #   true         → 恢复原有时间规则（用于验证业务规则）
    L.append("('ORDER_CUTOFF_TIME', '09:00', '申领截止时间（ENFORCE_ORDER_TIME=true 时生效）'),")
    L.append("('SERVE_START_TIME', '11:30', '领用开始时间（ENFORCE_ORDER_TIME=true 时生效）'),")
    L.append("('ENFORCE_ORDER_TIME', 'false', '是否启用申领时间限制：true=启用；false/空=不限制（便于测试）')")
    L.append("ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);")
    L.append("")

    with open(os.path.join(SQL_DIR, "init.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    return len(L)


def gen_data_sql():
    L = []
    # 加上 USE，保证这个脚本可以单独执行（否则会报 No database selected）
    L.append(f"USE {DB_NAME};")
    L.append("")
    L.append("-- 初始化用品目录数据")
    # 先清空并把自增计数器归零：这样无论库里之前是什么数据，
    # 用品 ID 都从 1 开始，与 static/images/N.png 的配图一一对应，便于核对。
    L.append("DELETE FROM t_supply_item;")
    L.append("ALTER TABLE t_supply_item AUTO_INCREMENT = 1;")
    L.append("")
    L.append("INSERT INTO t_supply_item (name, category, price, unit, description) VALUES")
    rows = []
    for name, cat, price, unit, desc in SUPPLIES:
        rows.append(f"('{sql_escape(name)}', '{sql_escape(cat)}', {price:.2f}, '{sql_escape(unit)}', '{sql_escape(desc)}')")
    L.append(",\n".join(rows) + "\nON DUPLICATE KEY UPDATE name=name;")
    L.append("")
    for i, (name, *_rest) in enumerate(SUPPLIES, start=1):
        L.append(f"UPDATE t_supply_item SET image_url = '/images/{i}.jpeg' WHERE name = '{sql_escape(name)}';")
    L.append("")
    with open(os.path.join(SQL_DIR, "data.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))


def gen_employee_sql():
    L = []
    L.append("-- ============================================")
    L.append("-- 企业办公用品申领管理系统 - 员工数据初始化")
    L.append("-- ============================================")
    L.append("-- 说明：批量打印/配送功能需要员工数据，请执行此脚本")
    L.append("")
    L.append(f"USE {DB_NAME};")
    L.append("")
    L.append("CREATE TABLE IF NOT EXISTS t_staff (")
    L.append("    id VARCHAR(255) NOT NULL PRIMARY KEY COMMENT '员工ID',")
    L.append("    name VARCHAR(255) COMMENT '员工姓名',")
    L.append("    phone VARCHAR(255) COMMENT '联系电话',")
    L.append("    workstation VARCHAR(255) COMMENT '工位信息'")
    L.append(ROW_FORMAT_TAIL)
    L.append("")
    L.append("INSERT INTO t_staff (id, name, phone, workstation) VALUES")
    rows = []
    for s in STAFF:
        rows.append(f"('{sql_escape(s[0])}', '{sql_escape(s[1])}', '{sql_escape(s[2])}', '{sql_escape(s[3])}')")
    L.append(",\n".join(rows))
    L.append("ON DUPLICATE KEY UPDATE")
    L.append("    name = VALUES(name),")
    L.append("    phone = VALUES(phone),")
    L.append("    workstation = VALUES(workstation);")
    L.append("")
    L.append("SELECT * FROM t_staff;")
    L.append("SELECT CONCAT('成功添加 ', COUNT(*), ' 条员工数据') AS result FROM t_staff;")
    L.append("")
    with open(os.path.join(SQL_DIR, "employee_data.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(L))


def patch_data_initializer():
    """把 DataInitializer.java 里的菜品种子数据换成办公用品数据。"""
    with open(JAVA_INIT, "r", encoding="utf-8") as f:
        src = f.read()

    # 用户数据：整块替换
    user_block_new = "        List<User> testUsers = Arrays.asList(\n" + ",\n".join(
        f'                createUser("{u[0]}", "{u[1]}", "{u[2]}", "{u[3]}", "{u[4]}", "{u[5]}", "{u[6]}")'
        for u in USERS
    ) + "\n        );"
    src = re.sub(
        r"        List<User> testUsers = Arrays\.asList\(.*?\n        \);",
        user_block_new,
        src,
        flags=re.S,
    )

    # 用品数据：整块替换
    item_block_new = "            List<Object[]> recipes = Arrays.asList(\n" + ",\n".join(
        f'                    new Object[]{{"{n}", "{c}", {p:.2f}, "{un}", "{sql_escape(d).replace(chr(92), chr(92)*2)}"}}'
        for n, c, p, un, d in SUPPLIES
    ) + "\n            );"
    src = re.sub(
        r"            List<Object\[\]> recipes = Arrays\.asList\(.*?\n            \);",
        item_block_new,
        src,
        flags=re.S,
    )

    # 注释与文案
    src = src.replace("初始化食谱数据", "初始化用品目录数据")
    src = src.replace("检查是否已有食谱数据", "检查是否已有用品数据")

    with open(JAVA_INIT, "w", encoding="utf-8") as f:
        f.write(src)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply-java", action="store_true", help="同时把种子数据写回 DataInitializer.java")
    ap.add_argument("--skip-images", action="store_true",
                    help="不生成配图（用于保护已经手工替换的真实商品图）")
    args = ap.parse_args()

    os.makedirs(SQL_DIR, exist_ok=True)
    os.makedirs(IMG_DIR, exist_ok=True)

    n = gen_init_sql()
    gen_data_sql()
    gen_employee_sql()

    if args.skip_images:
        print(f"init.sql 行数={n}, 用品数={len(SUPPLIES)}, 配图=已跳过（保留现有图片）")
    else:
        # 先删掉旧的占位配图，避免残留
        for i in range(1, 51):
            p = os.path.join(IMG_DIR, f"{i}.jpeg")
            if os.path.exists(p):
                os.remove(p)
        for i, (name, cat, *_rest) in enumerate(SUPPLIES, start=1):
            make_icon(i, name, cat)
        print(f"init.sql 行数={n}, 用品数={len(SUPPLIES)}, 配图数={len(SUPPLIES)}")

    if args.apply_java:
        patch_data_initializer()
        print("DataInitializer.java 已更新")


if __name__ == "__main__":
    main()
