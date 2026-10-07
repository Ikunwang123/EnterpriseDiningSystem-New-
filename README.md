# 企业办公用品申领管理系统 · 交接总纲

> **这是接手项目要看的第一份文档。**
> 目标：让 4 位成员在 **30 分钟内**把项目跑起来，并清楚自己负责哪一块。
>
> 文档结构：本文（总纲）→ 各专项文档。全部文档都基于**当前代码实测**撰写，不含推测内容。

---

## 目录

1. [项目是什么](#一项目是什么)
2. [30 分钟跑起来](#二30-分钟跑起来)
3. [4 人分工总览](#三4-人分工总览)
4. [文档导航](#四文档导航)
5. [系统角色与权限](#五系统角色与权限)
6. [项目目录结构](#六项目目录结构)
7. [核心业务流程](#七核心业务流程)
8. [必读：6 个历史坑](#八必读6-个历史坑)
9. [常见问题速查](#九常见问题速查)
10. [答辩准备](#十答辩准备)

---

## 一、项目是什么

一套 **企业办公用品申领管理系统**：员工在线申领办公用品，后勤主管维护用品目录与每日领用计划，
仓库按汇总单备货，配送员打印配送单送货，管理员看统计报表。

### 技术栈

| 项 | 内容 |
|---|---|
| 后端 | Spring Boot 2.7.5 · Spring Data JPA (Hibernate 5.6) · Spring MVC |
| 数据库 | MySQL 8.0 |
| 前端 | **原生 HTML + CSS + JavaScript**（无框架、无打包工具、无 npm 依赖） |
| 运行环境 | JDK 17 · Maven（IDEA 自带） |
| 服务端口 | `8080` |
| 数据库名 | `office_supply` |

> **前端是原生 JS**：每个页面对应一个 `class XxxModule`，全部挂在全局。
> 没有 React/Vue，改完直接刷新浏览器即可，不需要构建。

### 代码规模（实测）

| 部分 | 文件数 | 行数 |
|---|---|---|
| Java | 58 | 4,940 |
| JavaScript | 11 | 4,309 |
| HTML | 2 | 563 |
| CSS | 2 | 932 |
| **合计** | **73** | **10,744** |

### 核心数据

| 项 | 数量 |
|---|---|
| 数据库表 | **9** 张 |
| 接口端点 | **50** 个 |
| Controller | **9** 个 |
| 用品目录 | **51** 件（6 个分类） |
| 账号 | **7** 个（4 种角色） |
| 角色 | **4** 个 |
| 申领单状态 | **3** 个 |
| 自动化测试 | **38** 项断言 |

---

## 二、30 分钟跑起来

### 前置：需要装什么

| 软件 | 版本 | 说明 |
|---|---|---|
| JDK | **17**（必须） | `pom.xml` 里 `java.version=17` |
| MySQL | 8.0 | 用 phpStudy 最省事，端口 3306，账号 `root`/`root` |
| IntelliJ IDEA | 2022+ | 社区版即可，自带 Maven |

### 第 1 步：启动 MySQL

打开 **phpStudy** 面板 → 点 **MySQL** 的「启动」。面板显示绿色/运行中即可。

### 第 2 步：建库（第一次必须做）

在项目根目录执行：

```bash
mysql -uroot -proot < src/main/resources/sql/init.sql
```

成功的话**没有任何输出**。验证：

```sql
mysql -uroot -proot
USE office_supply;
SHOW TABLES;                              -- 应为 9 张
SELECT COUNT(*) FROM t_supply_item;       -- 应为 51
SELECT COUNT(*) FROM sys_user;            -- 应为 7
```

> ⚠️ `init.sql` 会**先删库再重建**，库里数据全部丢失。这是刻意设计——它的用途就是"重置到干净状态"，
> 可以反复执行。只想补用品数据、不想清库时用 `sql/data.sql`。

### 第 3 步：IDEA 打开并运行

1. IDEA → `Open` → 选项目根目录
2. 等 Maven 依赖下载完（首次较慢，右侧 Maven 面板点刷新可加速）
3. 运行 `src/main/java/com/enterprise/supply/SupplyApplication.java`（点左侧绿色三角）

看到这行就是成功：

```
Started SupplyApplication in x.xxx seconds
```

### 第 4 步：打开页面

浏览器访问 **http://localhost:8080/login.html**

> 注意路径是 `/login.html`，不是根路径。

### 第 5 步：登录验证

**所有账号密码统一 `123456`**：

| 账号 | 姓名 | 角色 | 菜单数 | 落地页 |
|---|---|---|---|---|
| `superadmin` | 系统管理员 | ADMIN | **10** | 总览 |
| `finance001` | 刘会计 | ADMIN | **10** | 总览 |
| `manager001` | 王主管 | MANAGER | **7** | 总览 |
| `dispatcher001` | 张配送 | DISPATCHER | **2** | 总览 |
| `staff001` | 陈员工 | STAFF | **2** | 领用计划 |
| `staff002` | 李员工 | STAFF | **2** | 领用计划 |
| `staff003` | 张员工 | STAFF | **2** | 领用计划 |

### 第 6 步：跑一遍自动化测试（强烈建议）

前置：MySQL 已启动、应用已运行。

```powershell
powershell -ExecutionPolicy Bypass -File devtools\test-api.ps1
```

预期结尾：

```
=== 测试汇总 ===
  通过: 38    失败: 0    跳过: 0
  结论：核心链路全部通过
```

**如果这 38 项全过，说明环境完全正常**，可以开始开发。

### 快速体验一条完整链路

```
1. superadmin 登录 →「计划管理」创建计划并点「发布菜单」
2. 「用品目录」确认 51 件用品、图片正常显示
3. 退出，用 staff001 登录 →「领用计划」选用品 →「立即提交申领」
4. 「我的申领」看到刚提交的单子（单号 REQ- 开头）
5. 换 manager001 登录 →「汇总领用单」选申领日期 → 生成汇总
6. 换 dispatcher001 登录 →「配送单打印」查看按员工分组的配送单
7. 换 superadmin →「领用统计」看月度报表
```

---

## 三、4 人分工总览

分工原则：**按业务功能切，不按技术层次切**。每人对自己的链路"从页面到数据库"负责到底，
这样答辩时每人都能独立讲清一条完整流程。

| 成员 | 负责功能 | 对应菜单 | 文件数 | 代码量 |
|---|---|---|---|---|
| **A** | 用户权限 · 总览看板 · 领用统计 | 总览、用户管理、系统设置、领用统计 | 18 | 2,921 行 |
| **B** | 用品目录 · 领用计划管理 | 用品目录、计划管理 | 10 | 2,119 行 |
| **C** | 员工申领全流程 | 领用计划、我的申领 | 12 | 1,840 行 |
| **D** | 汇总与打印 | 汇总领用单、配送单打印 | 12 | 1,635 行 |

**业务链路串联**（答辩时可以按这条线演示）：

```
A 建账号/定角色 → B 建用品目录 + 建计划并发布 → C 员工申领 → D 汇总备货/打印 → A 看统计
```

**每位成员的详细职责、负责文件清单、核心难点、协作约定 → 见 [功能分工说明.md](功能分工说明.md)**

---

## 四、文档导航

| 文档 | 内容 | 什么时候看 |
|---|---|---|
| **README.md**（本文） | 总纲：跑起来 + 分工 + 索引 | **第一份就看它** |
| [功能分工说明.md](功能分工说明.md) | 4 人各自负责哪些文件、难点、协作约定 | 想知道自己干什么、和别人怎么对接 |
| [使用说明.md](使用说明.md) | 每个功能怎么用、业务规则、状态含义 | 想知道系统怎么用 |
| [接口文档.md](接口文档.md) | **50 个接口**的路径/方法/参数/返回值/权限 | 要调接口、改接口、写联调 |
| [数据库设计.md](数据库设计.md) | **9 张表**结构、字段含义、表关系 | 要改表、写 SQL、理解数据流 |
| [部署与启动说明.md](部署与启动说明.md) | 环境要求、首次部署、启动失败排查 | 换电脑、装环境、启动报错 |
| [测试说明.md](测试说明.md) | 38 项自动化 + 手工测试用例、报告模板 | 要验收、写测试报告 |
| [常见问题与排查.md](常见问题与排查.md) | 所有踩过的坑与排查方法 | 遇到任何异常先翻它 |
| *[改名说明.md](改名说明.md)* | 可选：项目改名记录 | 老师追问项目来历 |

---

## 五、系统角色与权限

### 4 个角色

| 角色 | 中文 | 职责 | 可见菜单 |
|---|---|---|---|
| `ADMIN` | 系统管理员 | 全部功能 + 统计报表 | **10 项** |
| `MANAGER` | 后勤主管 | 用品、计划、备货汇总、配送打印、用户与设置 | **7 项** |
| `DISPATCHER` | 配送员 | 只看总览与配送单打印 | **2 项** |
| `STAFF` | 普通员工 | 申领用品、查看自己的申领单 | **2 项** |

### 菜单可见性矩阵

| 左侧菜单 | view 标识 | STAFF | DISPATCHER | MANAGER | ADMIN |
|---|---|---|---|---|---|
| 总览 | `overview` | | ● | ● | ● |
| 领用计划 | `menu` | ● | | | ● |
| 我的申领 | `order` | ● | | | ● |
| 配送单打印 | `batch-print` | | ● | ● | ● |
| 用品目录 | `recipe` | | | ● | ● |
| 计划管理 | `menu-manage` | | | ● | ● |
| 汇总领用单 | `blanket` | | | ● | ● |
| 领用统计 | `report` | | | | ● |
| 用户管理 | `users` | | | ● | ● |
| 系统设置 | `settings` | | | ● | ● |
| **合计** | | **2** | **2** | **7** | **10** |

### 权限是怎么实现的（双层）

**第一层：前端隐藏菜单**

- `static/index.html` 里每个 `<a class="nav-link">` 带 `data-roles="MANAGER"` 之类的属性
- `static/js/app.js` 的 `applyRoleFilter()` 按当前角色设置 `display`
- `ADMIN` 在代码里被直接放行（`isAdmin` 判断），所以能看到全部 10 项

**第二层：后端接口校验（真正的防线）**

`src/main/java/com/enterprise/supply/config/RoleInterceptor.java` 集中定义规则：

| URL 前缀 | 允许的角色 |
|---|---|
| `/api/recipe`、`/api/menu`、`/api/summaries`、`/api/user`、`/api/settings` | ADMIN、MANAGER |
| `/api/reports` | ADMIN |
| `/api/print` | DISPATCHER、MANAGER、ADMIN |
| `/api/dining`（申领相关） | 不限角色（登录即可） |
| 登录/注册/重置密码/登出 | 公开 |

角色不符时抛 `PermissionException` → 全局异常处理返回 **403**。

> **为什么要有第二层**：只隐藏菜单的话，在地址栏直接敲 `/api/user/list` 就能拿到数据。
> 实测：`dispatcher001` 调用 `/api/recipe/all`、`/api/user/list`、`/api/settings/all` 都返回 **403**。

### 每个角色登录后看到什么

| 角色 | 落地页 | 原因 |
|---|---|---|
| ADMIN / MANAGER / DISPATCHER | 总览 | 总览是第一个可见菜单 |
| STAFF | 领用计划 | 员工看不到总览，第一个可见菜单是「领用计划」 |

> 落地页由 `app.js` 的 `getDefaultView()` 动态决定：取 `applyRoleFilter()` 返回的**第一个可见菜单**。
> 不要改成写死 `'overview'`——那样员工会落到一个没有菜单项高亮的空页面。

---

## 六、项目目录结构

```
EnterpriseDiningSystem/
├── pom.xml                            Maven 配置（Spring Boot 2.7.5 / JDK 17）
├── README.md                          本文档
├── 功能分工说明.md                     4 人分工
├── 使用说明.md                         功能与业务规则
├── 接口文档.md                         50 个接口
├── 数据库设计.md                        9 张表
├── 部署与启动说明.md                    环境与启动
├── 测试说明.md                         测试用例
├── 常见问题与排查.md                    踩坑记录
├── 改名说明.md                         （可选）改名记录
│
├── devtools/                          ★ 开发辅助脚本（不参与运行，可整个删除）
│   ├── test-api.ps1                   自动化接口测试（38 项断言）
│   ├── check-schema.py                校验实体列名与数据库是否一致
│   ├── align-images.py                配图格式对齐
│   ├── image-map.csv                  51 张配图 ↔ 用品名（含搜索关键词）
│   ├── compile-check.ps1              无 Maven 时的编译检查
│   └── build-rename.ps1               ⚠️ 改名总装脚本，平时不要运行
│
└── src/main/
    ├── java/com/enterprise/supply/
    │   ├── SupplyApplication.java      ★ 启动类（就运行这个）
    │   ├── controller/                 接口层（9 个 Controller）
    │   ├── service/                    业务层
    │   │   └── impl/                   实现类
    │   ├── repository/                 数据访问（Spring Data JPA）
    │   ├── entity/                     数据库实体（11 个）
    │   ├── DTO/                        传输对象
    │   ├── config/                     WebMvcConfig、RoleInterceptor、FileUploadConfig
    │   ├── exception/                  PermissionException、RequisitionException、全局异常处理
    │   └── util/                       RoleGuard、DataInitializer
    │
    └── resources/
        ├── application.properties      数据库/端口/静态资源缓存配置
        ├── sql/
        │   ├── init.sql                ★ 建库脚本（重置数据用）
        │   ├── data.sql                只重灌用品目录
        │   └── migrate_to_office_supply.sql  旧库迁移（历史用）
        └── static/                     前端
            ├── login.html              登录页
            ├── index.html              主页面（菜单在这里）
            ├── css/style.css           全部样式
            ├── js/                     11 个模块（每个页面对应一个）
            └── images/                 51 张配图 1.jpeg ~ 51.jpeg
```

### 包结构约定

| 包 | 放什么 | 命名习惯 |
|---|---|---|
| `controller` | 接收 HTTP 请求、返回 `Result` | `XxxController` |
| `service` | 业务接口 | `XxxService` |
| `service.impl` | 业务实现 | `XxxServiceImpl` |
| `repository` | JPA 仓库接口 | `XxxRepository` |
| `entity` | 数据库实体（`@Entity`） | 单数名词 |
| `DTO` | 传输对象（大写 DTO 包名） | `XxxDTO` |
| `exception` | 自定义异常 + 全局处理 | `XxxException` |
| `util` | 工具类 | `XxxGuard` / `XxxInitializer` |

---

## 七、核心业务流程

### 完整链路

```
① 后勤主管维护「用品目录」（51 件用品，含分类/单价/单位/配图）
                    ↓
② 后勤主管在「计划管理」创建某天的领用计划，选中要开放的用品，然后【发布】
                    ↓
③ 员工在「领用计划」看到已发布的用品，选用品、调数量、提交申领
                    ↓ 生成单号 REQ-yyyyMMdd-xxxxxx
④ 「我的申领」查看自己的申领单
                    ↓
⑤ 仓库在「汇总领用单」按日期汇总（按用品合并数量与金额）
                    ↓
⑥ 配送员在「配送单打印」按员工分组打印领用单
                    ↓
⑦ 管理员在「领用统计」看月度/员工汇总报表
```

### 三个关键设计

**1. 计划必须"发布"员工才能看到**

`t_availability_plan.status`：`0=未发布`、`1=已发布`。
「计划管理」页创建后要点「发布菜单」，员工端才查得到。

**2. 目标申领日期只有一个来源**

`RequisitionService.getTargetOrderDate()` 是**唯一**的日期判断入口。
它被 `/api/dining/order/target-date`（页面显示）和提交申领时的校验**共同使用**。

> ⚠️ **不要在别处再写一份日期判断**。历史上 Controller 里另写了一份硬编码 `today.atTime(11,30)`，
> 导致"页面提示按明天建计划、提交却按今天校验"，申领必然失败。

**3. 汇总按「领用计划日期」聚合**

```sql
WHERE COALESCE(o.date, DATE(o.create_time)) = :date
```

`o.date` 是领用日期，`o.create_time` 是提交时间。两者可能不是同一天
（今天可以为明天的计划申领）。按创建日期聚合会让仓库看不到该备的货。

### 申领单状态（3 个）

| 值 | 名称 | 含义 |
|---|---|---|
| `0` | 待备货 | 刚提交，仓库尚未处理 |
| `1` | 已完成 | 已备货/已送达 |
| `2` | 已取消 | 已取消 |

> 早期设计有 5 个状态（多出"备货中""待领取"），但**界面没有任何入口能修改状态**，
> 单据提交后永远是"待备货"，留着只会让"状态怎么流转"讲不清楚，因此精简为 3 个。

### 时间限制开关

系统设置里有 `ENFORCE_ORDER_TIME`，**默认 `false`（不限制）**：

| 取值 | 行为 |
|---|---|
| `false` / 空 | 不校验时间；目标日期**自动对齐实际已发布的计划日期** |
| `true` | 恢复原有规则：当天需在截止时间前、次日需过领用开始时间 |

```sql
-- 开启（验证业务规则时用，不需要重启应用）
UPDATE office_supply.t_system_settings SET config_value='true'  WHERE config_key='ENFORCE_ORDER_TIME';
-- 关闭
UPDATE office_supply.t_system_settings SET config_value='false' WHERE config_key='ENFORCE_ORDER_TIME';
```

### 其它业务规则

| 规则 | 说明 |
|---|---|
| 每人每天只能申领一次 | 按 `user_id + 目标日期` 判断，重复提交返回"每人每天只能提交申领一次" |
| 单品数量上限 10 | 前端限制，超出提示「单品数量不能超过10份」 |
| 只能申领当天或次日 | 开启时间限制时生效 |

---

## 八、必读：6 个历史坑

这些都是**开发过程中真实踩过的**，接手前务必知道，能省大量排查时间。

### 坑 1：实体列名与数据库不一致 → 只有写数据时才崩

编译能过、应用能启动、页面能看，**只有真正读写那张表时才报**
`Unknown column 'xxx' in 'field list'`。

**改完实体或建表脚本，务必跑一次**：

```bash
python devtools/check-schema.py
```

预期输出 `OK: every @Column(name=...) exists in the database`。

### 坑 2：前后端字段名不一致 → 页面显示 undefined

已踩过的四处：

| 位置 | 曾用名 | 正确名 |
|---|---|---|
| 申领请求体 | `planItemId` | **`menuItemId`** |
| 我的申领响应 | `requisitionNo` | **`orderNo`** |
| 我的申领明细 | `dishName` | **`itemName`** |
| 汇总明细 | `menuItemName` | **`planItemName`** |

**排查方法**：`F12` → Network → 看该接口的 Response，对比前端读取的字段名。

### 坑 3：接口路径不一致 → 404

已踩过：前端调 `/api/dining/my-requisitions`，后端却是 `/my-orders`；
前端调 `/api/dining/menu/list`（不存在），实际在 `/api/menu/list`。

### 坑 4：不要用 `offsetParent` 判断元素是否可见

它**依赖真实布局**，环境稍有不同（侧栏隐藏、无头浏览器、打印模式）就可能对所有元素返回 `null`。
曾经导致员工登录后仍落在总览页。

**正确做法**：判断我们自己设置的行内 `style.display`，见 `app.js` 的 `applyRoleFilter()`。

### 坑 5：静态资源缓存 → 改了前端没效果

早期没设缓存策略，浏览器用"启发式缓存"自行决定，导致改了 JS 看不到变化。

**已修**：`application.properties` 里设了 `spring.web.resources.cache.period=0`，
响应头为 `Cache-Control: no-store`；`index.html` 里 JS 还带 `?v=N` 版本号。

**若仍遇到**：地址栏直接打开 `http://localhost:8080/js/app.js`，搜 `getDefaultView`：
- 搜得到 → 服务器是新代码，问题在浏览器（`Ctrl+F5` 或开无痕窗口）
- 搜不到 → 服务器文件是旧的（应用没重启 / 没 Rebuild）

### 坑 6：`init.sql` 会删库

它**先 `DROP DATABASE` 再重建**，库里数据全部丢失。这是刻意设计（用于重置测试数据），
但**别在需要保留数据时执行**。只想补用品目录用 `sql/data.sql`。

---

## 九、常见问题速查

| 现象 | 原因 / 解决 |
|---|---|
| 启动报 `Connection refused` | MySQL 没启动 → phpStudy 点启动 |
| 启动报 `Port 8080 was already in use` | 已有实例在跑 → 停掉旧进程，或改 `server.port` |
| `Unknown database 'office_supply'` | 还没建库 → 执行 `sql/init.sql` |
| `Access denied for user 'root'` | 数据库密码不对 → 改 `application.properties` |
| 页面 404 但应用启动成功 | 路径不对 → `http://localhost:8080/login.html` |
| 图片全空白 | ① 库连错 ② 扩展名不是 `.jpeg` → 见[常见问题与排查.md](常见问题与排查.md) |
| 页面某列显示 `undefined` | 前后端字段名不一致 → 看 `F12` Network 的 Response |
| 点菜单没反应 | `F12` → Console 看红色报错（JS 语法/引用问题） |
| 提交申领后「我的申领」没有 | 提交失败了但提示被吞 → 看 `order/submit` 的请求体与响应 |
| 提示"每人每天只能提交申领一次" | 该账号当天已申领过 → 换 `staff002`/`staff003` |
| 改了代码没效果 | 后端要 Rebuild + 重启；前端要 `Ctrl + F5` |
| 汇总页提示"无法从数据库获取数据" | 通常是该日期没有汇总数据，不是连接问题 → 换个有申领记录的日期 |

**完整排查手册 → [常见问题与排查.md](常见问题与排查.md)**

---

## 九之二、项目做过的精简（了解即可）

为了让项目更干净、更好讲，先后做过两轮精简，**功能一个都没减少**。

### 第一轮：架构精简

| 项 | 说明 |
|---|---|
| 删除死代码 | 「总括订单」(blanket-order) 整套 Controller/Service/实体 **640 行**，前端从未调用；另删 `menu/add-item`、`print/batch`、调试类 `TestDatabaseConnection` |
| 清掉垃圾表 | 原 `TestDatabaseConnection` 每次启动都往库里建 `test_connection` 表；删掉后库里干净地只有 **9 张表** |
| 角色调整 | `chef001`（库管）移除并入 MANAGER；`dispatcher001` 恢复为独立角色 **DISPATCHER** |
| 加后端校验 | 新增 `RoleInterceptor`，管理接口按角色拦截并返回 **403** |
| 状态 5 → 3 | 申领单状态精简为 **待备货 / 已完成 / 已取消**（界面本就没有改状态的入口） |
| 统一 DTO | `/api/dining/menu/today` 与 `/api/dining/menu/list` 返回**完全相同结构**，前端不再需要转换代码 |

### 第二轮：无用文件清理（体积从 236 MB → 1.9 MB）

| 项 | 清理前 | 清理后 |
|---|---|---|
| **旧配图 `.png`** | 106 个文件 / **229.8 MB** | **51** 个文件 / **1.3 MB**（只留数据库引用的 `.jpeg`） |
| 无用 Java 类 | `ResponseResult`、`RequisitionItemController`、`RequisitionItemService`、`RequisitionDetail` | 已删除（共 156 行） |
| 无人调用的端点 | `/api/reports/{monthly-sales,employee-monthly,personal-monthly}`、`/monthly-sales-report` | 已删除（端点 54 → **50**） |
| 死 CSS | `modules.css` 整个文件（53 个类，HTML 从未加载）+ 20 个死类 | 已删除（CSS 1,495 → **932** 行） |
| 旧页面残留 | `index.txt`（58 KB，原"企业餐厅点餐系统"的控制台页面） | 已删除 |
| 未使用 import | 12 处 | 已清理 |
| 过期对照表 | `image-map.csv` 里还是 `.png` | 已修正为 `.jpeg` |
| 冗余文档 | `配图替换清单.md`（信息已并入使用说明与 CSV） | 已删除（10 份 → **9 份**文档） |

**结果**：Java 62 → **58** 文件，代码总量 11,547 → **10,744** 行，
`src/` 目录 **236 MB → 1.9 MB**，接口 54 → **50** 个。
删完后 **38 项自动化测试全部通过**，所有角色菜单与页面渲染正常。

---

## 十、答辩准备

### 每人建议讲解内容

| 成员 | 讲解重点 |
|---|---|
| **A** | 登录与 Session 机制 · 密码强度校验 · 4 个角色的设计取舍 · `applyRoleFilter()` 权限过滤 · 总览统计口径 |
| **B** | 用品目录 CRUD · 计划的"发布"状态机 · 当日价格设计（`plan_price` 与 `price` 的区别）· 按日期查询与"当前可申领日期"的选取 |
| **C** | 申领单创建流程 · 单号生成规则 · **每人每天一次**的实现 · **目标日期统一逻辑**（重点讲，坑最多）· 状态精简的理由 |
| **D** | 汇总的两种数据来源与兜底逻辑 · **为什么按计划日期聚合** · 契约式返回空结果（不返回 `null`）· 打印分组 · 统计口径 |

### 可以合作演示的集成点

```
B 发布计划 → C 提交申领 → D 汇总/打印 → A 看统计
```

### 可能被问到的问题

| 问题 | 参考回答 |
|---|---|
| 权限是怎么做的？ | 双层：前端按 `data-roles` 隐藏菜单 + 后端 `RoleInterceptor` 拦截管理接口返回 403。防止直接调接口绕过。 |
| 为什么只有 3 个状态？ | 原设计有 5 个，但界面没有改状态的入口，单据永远是"待备货"，多出的中间态无法解释流转，因此精简。 |
| 为什么汇总要按计划日期而不是提交日期？ | 今天可以为明天的计划申领，按提交日期聚合会让仓库在正确的备货日看不到数据。 |
| 前端为什么不用框架？ | 原项目就是原生 JS，改动成本最低；11 个模块按页面对应，结构清晰。 |
| `devtools/` 是什么？ | 开发期辅助脚本（测试、校验、改名工具），不参与运行，可整个删除。 |
| 数据库怎么初始化？ | `sql/init.sql`，一条命令建库建表带全部基础数据，可反复执行。 |

### 提交清单

- [ ] `src/` 全部源码
- [ ] `pom.xml`
- [ ] `src/main/resources/sql/init.sql`（**必须**，否则别人建不了库）
- [ ] `src/main/resources/static/images/`（51 张配图）
- [ ] 全部 `.md` 交接文档

不建议提交：`target/`、`.idea/`、`.run/`、`.build-check/`

---

**祝顺利。遇到问题先翻 [常见问题与排查.md](常见问题与排查.md)，再看浏览器 `F12` 的 Console 与 Network。**
