# build-rename.ps1
# 用途：把项目从「改名前基线」一次性、可复现地重建为「办公用品申领系统」。
#
# ⚠️⚠️ 重要：改名已经完成，**平时不要再运行本脚本**。
#   它会把 src/main/java 与 src/main/resources 全部还原到"改名前基线"再重做改名，
#   过程中会丢掉你在这些目录里做的手工改动（例如替换好的配图、手工调整的页面）。
#   仅在"需要从零重现整套改名"时才使用。
#   而且它需要 cd0586b 这个基线提交仍然存在（见 -Baseline 参数）。
#
# 为什么需要这个脚本：
#   改名涉及好几步（Java 标识符、SQL 与配图、前端文件名、中文措辞、库名、接口路径），
#   之前这些步骤是手工零散执行的，一旦中途"从基线重跑"就会丢步骤
#   （实际踩过：前端模块引用没跟上导致页面点不动、库名没改回导致连错库图片全空）。
#   所以把全流程固化到这里，任何时候跑一遍就能得到一致结果。
#
# 用法（在项目根目录）：
#   powershell -ExecutionPolicy Bypass -File devtools\build-rename.ps1
#
# 前置：BASELINE 指向"改名前"的那个提交（默认 cd0586b）。

param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$Baseline = 'cd0586b'
)

$ErrorActionPreference = 'Stop'
Set-Location $ProjectRoot

function Step($n, $msg) { Write-Host ''; Write-Host "=== [$n] $msg ===" }

Step 1 "从基线快照恢复 Java 与资源"
if (Test-Path 'src\main\java\com\enterprise\supply') { Remove-Item 'src\main\java\com\enterprise\supply' -Recurse -Force }
if (Test-Path 'src\main\java\com\enterprise\dining')  { Remove-Item 'src\main\java\com\enterprise\dining' -Recurse -Force }
& git checkout $Baseline -- src/main/java src/main/resources
if ($LASTEXITCODE -ne 0) { throw "git checkout 失败，确认基线提交 $Baseline 是否存在" }
Write-Host "  已恢复"

Step 2 "Java 标识符改名 + 前端模块改名 + 修复原有 JS 语法错误"
& node devtools\rename-java.js $ProjectRoot
if ($LASTEXITCODE -ne 0) { throw "rename-java.js 失败" }

Step 3 "生成办公用品数据集：SQL + 配图 + DataInitializer 种子数据"
# ⚠️ 重要保护：generate_all.py 会重新生成 images/ 下的占位图标，
# 从而覆盖已经手工替换的真实商品图。这里检测配图是否已被替换过
# （存在一定数量的 .jpeg 即视为人工替换），是则跳过配图生成，只生成 SQL。
$imgDir = Join-Path $ProjectRoot 'src\main\resources\static\images'
$realImgCount = 0
if (Test-Path $imgDir) {
    $realImgCount = (Get-ChildItem $imgDir -Filter '*.jpeg' -ErrorAction SilentlyContinue | Measure-Object).Count
}
$py = Join-Path $env:USERPROFILE '.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path $py)) { $py = 'python' }

if ($realImgCount -ge 10) {
    Write-Host "  检测到 $realImgCount 张已替换的真实配图(*.jpeg)，跳过配图生成以保护现有图片"
    & $py devtools\generate_all.py --apply-java --skip-images
} else {
    & $py devtools\generate_all.py --apply-java
}
if ($LASTEXITCODE -ne 0) { throw "generate_all.py 失败" }

Step 4 "给建表语句补 InnoDB DYNAMIC 行格式（避免 utf8mb4 大索引超限）"
& node devtools\add-rowformat.js

Step 4b "从建库脚本里去掉已废弃的表定义"
# generate_all.py 会把 t_equipment（原菜品表）一并生成，但对应的实体/控制器
# 已在步骤 2 作为死代码删除，这里需要同步从 init.sql / data.sql 里移除，
# 避免建库时又建出一张没人用的空表。
& node devtools\strip-dead-tables.js $ProjectRoot
if ($LASTEXITCODE -ne 0) { throw "strip-dead-tables.js 失败" }

Step 5 "中文措辞替换（单次匹配，避免连锁改写）"
& node devtools\apply-wording.js $ProjectRoot
if ($LASTEXITCODE -ne 0) { throw "apply-wording.js 失败" }

Step 6 "一致性校验"
Write-Host '--- Java 文件名与类型名 ---'
& node devtools\check-class-filenames.js $ProjectRoot
Write-Host '--- 前端引用完整性 ---'
& node devtools\check-frontend-refs.js $ProjectRoot
Write-Host '--- 改名逻辑自测 ---'
& node devtools\selftest.js | Select-Object -Last 3

Step 7 "JS 语法检查（被 index.html 引用的模块）"
$refs = (Select-String -Path 'src\main\resources\static\index.html' -Pattern 'js/([\w]+\.js)' -AllMatches).Matches |
        ForEach-Object { $_.Groups[1].Value }
$bad = 0
foreach ($f in $refs) {
    $p = "src\main\resources\static\js\$f"
    & node --check $p 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "  [语法错误] $f"; $bad++ } else { Write-Host "  [ok] $f" }
}
if ($bad -gt 0) { throw "有 $bad 个前端模块存在语法错误" }

Step 8 "列名一致性检查（需数据库已按 init.sql 建好）"
# 这一步非常重要：实体 @Column 与数据库列名不一致时，编译能过、应用也能正常启动，
# 只有真正读写该表才会炸（Unknown column 'xxx' in 'field list'），
# 表现为"提交申领失败/汇总失败"而普通页面看起来一切正常，极难排查。
# 详见 devtools/check-schema.py 顶部说明。
$schemaCheck = Join-Path $ProjectRoot 'devtools\check-schema.py'
if ((Test-Path $schemaCheck) -and (Test-Path $py)) {
    & $py $schemaCheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Write-Host '  ⚠ 列名检查未通过。若数据库还没建好，请先执行：'
        Write-Host '      mysql -uroot -proot < src/main/resources/sql/init.sql'
        Write-Host '    然后重跑本脚本。'
    }
} else {
    Write-Host '  （未找到 check-schema.py 或 python，跳过）'
}

Write-Host ''
Write-Host '完成。下一步：'
Write-Host '  1) 编译： devtools\compile-check.ps1'
Write-Host '  2) 建库： mysql -uroot -proot < src/main/resources/sql/init.sql'
Write-Host '  3) 运行： IDEA 运行 SupplyApplication'
Write-Host '  4) 测试： devtools\test-api.ps1'
