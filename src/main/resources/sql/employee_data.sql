-- ============================================
-- 企业办公用品申领管理系统 - 员工数据初始化
-- ============================================
-- 说明：批量打印/配送功能需要员工数据，请执行此脚本

USE office_supply;

CREATE TABLE IF NOT EXISTS t_staff (
    id VARCHAR(255) NOT NULL PRIMARY KEY COMMENT '员工ID',
    name VARCHAR(255) COMMENT '员工姓名',
    phone VARCHAR(255) COMMENT '联系电话',
    workstation VARCHAR(255) COMMENT '工位信息'
) ENGINE=InnoDB ROW_FORMAT=DYNAMIC COMMENT '员工信息表';

INSERT INTO t_staff (id, name, phone, workstation) VALUES
('1', '张三', '13800138001', '研发部-A101'),
('2', '李四', '13800138002', '测试部-B201'),
('3', '王五', '13800138003', '产品部-C301'),
('4', '赵六', '13800138004', '设计部-D401'),
('5', '钱七', '13800138005', '运营部-E501'),
('6', '孙八', '13800138006', '市场部-F601'),
('7', '周九', '13800138007', '财务部-G701'),
('8', '吴十', '13800138008', '人事部-H801')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    phone = VALUES(phone),
    workstation = VALUES(workstation);

SELECT * FROM t_staff;
SELECT CONCAT('成功添加 ', COUNT(*), ' 条员工数据') AS result FROM t_staff;
