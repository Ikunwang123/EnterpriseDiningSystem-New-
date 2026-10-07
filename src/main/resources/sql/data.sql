USE office_supply;

-- 初始化用品目录数据
DELETE FROM t_supply_item;
ALTER TABLE t_supply_item AUTO_INCREMENT = 1;

INSERT INTO t_supply_item (name, category, price, unit, description) VALUES
('中性笔 0.5mm 黑色', '书写工具', 2.50, '支', '速干墨水，书写顺滑，日常办公必备'),
('中性笔 0.5mm 蓝色', '书写工具', 2.50, '支', '速干墨水，用于签名与批注'),
('中性笔 0.5mm 红色', '书写工具', 2.50, '支', '用于批改与重点标注'),
('按动圆珠笔 0.7mm', '书写工具', 3.00, '支', '按键式设计，无需笔帽'),
('自动铅笔 0.5mm', '书写工具', 8.00, '支', '金属笔夹，附送铅芯'),
('铅笔 HB 12支装', '书写工具', 6.00, '盒', '椴木笔杆，易削不易断'),
('荧光笔 6色套装', '书写工具', 15.00, '套', '醒目不透纸，标注重点'),
('白板笔 黑色', '书写工具', 6.00, '支', '可擦写，会议室专用'),
('记号笔 油性 黑色', '书写工具', 5.00, '支', '防水耐磨，适用多种表面'),
('笔芯 0.5mm 黑色', '书写工具', 1.50, '支', '适配通用中性笔'),
('A4 复印纸 70g', '纸张本册', 22.00, '包', '500张/包，高白度不卡纸'),
('A4 复印纸 80g', '纸张本册', 28.00, '包', '500张/包，加厚挺括'),
('A3 复印纸 70g', '纸张本册', 45.00, '包', '500张/包，用于图纸与表格'),
('B5 笔记本 60页', '纸张本册', 5.00, '本', '横线内页，胶装不掉页'),
('A5 笔记本 100页', '纸张本册', 8.00, '本', '便携尺寸，适合会议记录'),
('皮革封面记事本 A5', '纸张本册', 25.00, '本', '商务风格，含笔插与书签带'),
('便利贴 76x76mm', '纸张本册', 4.00, '本', '100张/本，可反复粘贴'),
('指示标签 5色', '纸张本册', 3.50, '包', '用于文件索引与页码标记'),
('牛皮纸档案袋', '纸张本册', 1.20, '个', '加厚牛皮纸，可装A4文件'),
('收据本 二联', '纸张本册', 4.50, '本', '自带复写，用于报销凭证'),
('A4 抽杆文件夹', '文件管理', 2.00, '个', '透明抽杆，可容纳60页'),
('A4 强力夹文件夹', '文件管理', 6.50, '个', '硬壳板夹，适合外出携带'),
('A4 资料册 60页', '文件管理', 18.00, '本', '内置透明内袋，防尘防潮'),
('档案盒 A4 塑料', '文件管理', 7.00, '个', '背宽55mm，脊背可写标签'),
('拉链文件袋 A4', '文件管理', 9.00, '个', '防水耐磨，带提手'),
('长尾夹 15mm 60只', '文件管理', 8.00, '盒', '强力夹持，反复使用'),
('订书钉 24/6', '文件管理', 2.00, '盒', '1000枚/盒，适配12号订书机'),
('回形针 100只', '文件管理', 2.50, '盒', '镀镍防锈，不易变形'),
('订书机 12号', '桌面文具', 15.00, '个', '金属机身，可订25页'),
('重型订书机', '桌面文具', 45.00, '个', '可订100页，适合装订标书'),
('起钉器', '桌面文具', 3.00, '个', '省力设计，不伤纸面'),
('剪刀 中号', '桌面文具', 9.00, '把', '不锈钢刀刃，办公裁切'),
('美工刀 18mm', '桌面文具', 6.00, '把', '可折断刀片，带锁定'),
('固体胶 21g', '桌面文具', 4.50, '支', '粘性强，不易渗透纸张'),
('透明胶带 18mm', '桌面文具', 3.00, '卷', '高透明，不易发黄'),
('胶带座 中号', '桌面文具', 12.00, '个', '防滑底座，单手撕断'),
('直尺 30cm', '桌面文具', 3.50, '把', '不锈钢材质，刻度清晰'),
('计算器 12位', '桌面文具', 35.00, '个', '太阳能双电源，大屏显示'),
('笔筒 金属网纹', '桌面文具', 14.00, '个', '多格分隔，收纳桌面文具'),
('桌面文件架 三层', '桌面文具', 28.00, '个', '金属网架，分类放置文件'),
('硒鼓 通用型', '办公耗材', 180.00, '个', '适配主流激光打印机'),
('墨盒 黑色', '办公耗材', 120.00, '个', '高容量，打印清晰'),
('复印机碳粉', '办公耗材', 260.00, '瓶', '原厂规格，打印量大'),
('打印纸标签 A4', '办公耗材', 32.00, '包', '不干胶标签，100张/包'),
('白板擦', '办公耗材', 6.00, '个', '绒面吸附，擦拭干净'),
('白板清洁剂', '办公耗材', 18.00, '瓶', '去除顽固笔迹'),
('电池 5号 4粒', '办公耗材', 9.00, '板', '碱性电池，用于键鼠设备'),
('电池 7号 4粒', '办公耗材', 9.00, '板', '碱性电池，用于遥控设备'),
('碎纸机 家用小型', '办公设备', 320.00, '台', '单次6张，带过载保护'),
('键盘 有线 USB', '办公设备', 65.00, '个', '静音按键，即插即用'),
('鼠标 有线 USB', '办公设备', 45.00, '个', '光学追踪，人体工学')
ON DUPLICATE KEY UPDATE name=name;

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
