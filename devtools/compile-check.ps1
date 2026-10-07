# compile-check.ps1
# 用途：在没有 Maven 的环境下，用 JDK 的 javac + 本地 .m2 依赖对项目做一次编译校验。
# 这是开发期临时校验工具，不是项目构建的一部分（正式构建仍用 Maven / IDE）。
# 退出码 0 表示编译通过。

param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$OutDir = $null
)

$ErrorActionPreference = 'Stop'

if (-not $OutDir) { $OutDir = Join-Path $ProjectRoot '.build-check' }

$m2 = Join-Path $env:USERPROFILE '.m2\repository'
if (-not (Test-Path $m2)) { Write-Error "找不到本地 Maven 仓库: $m2"; exit 2 }

# 本地仓库里往往同时存在同一个库的多个版本（例如同时有 slf4j 1.5 和 1.7、lombok 1.18.12 和 1.18.24）。
# 如果简单地把所有 jar 都塞进 classpath，旧版本会先被加载，导致
# AbstractMethodError / NoClassDefFoundError 之类的运行期错误——本项目就踩过这个坑。
# 因此这里按「同一 artifact 只保留最高版本」做一次去重。
$allJars = Get-ChildItem $m2 -Recurse -Filter *.jar -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -notmatch '\\sources\\|\\javadoc\\' }

# 排除已知会破坏 Spring Boot 运行时的依赖。
# 本地仓库里混进了 Maven 插件自身的日志依赖（1.5.x 时代的 slf4j 桥接），
# 它们与 Spring Boot 2.7 自带的 slf4j 1.7.36 不兼容，会抛出
#   NoSuchMethodError: LocationAwareLogger.log(...)
# 这类错误只在运行期暴露、编译期完全正常，所以必须显式剔除。
# 另外 commons-logging 与 spring-jcl 是互斥实现，同时存在会导致日志绑定冲突。
$blockedPrefixes = @(
    'slf4j-jdk14', 'slf4j-log4j12', 'slf4j-simple', 'slf4j-nop',
    'slf4j-jcl', 'jcl-over-slf4j', 'log4j-slf4j-impl',
    'commons-logging', 'doxia-logging-api',

    # 独立的 Servlet API：Tomcat 9 内嵌版自带正确版本（Servlet 4.0）。
    # 本地仓库里旧的 servlet-api（2.5 等，来自 Maven 插件依赖）会覆盖它，
    # 运行时表现为 NoSuchMethodError: ServletContext.getVirtualServerName()。
    'servlet-api', 'javax.servlet-api', 'jakarta.servlet-api',

    # Maven 插件 / 旧版 starter 的残留，混入应用 classpath 会干扰自动配置
    'spring-boot-devtools', 'spring-boot-configuration-processor',
    'spring-boot-starter-validation', 'spring-boot-starter-test',
    'spring-boot-test', 'spring-boot-test-autoconfigure',

    # 本地仓库里其它项目留下的 Web 框架残留（本项目是纯 Spring MVC，用不到）
    'jersey-', 'jakarta.servlet.jsp', 'osgi-', 'knife4j', 'druid',

    # springfox / swagger：pom.xml 里并没有这些依赖，属于本地仓库其它项目的残留。
    # springfox 3.0 与 Spring Boot 2.6+ 的默认路径匹配策略（PathPatternParser）不兼容，
    # 混入后启动会失败：
    #   Failed to start bean 'documentationPluginsBootstrapper'
    #   NullPointerException: PatternsRequestCondition.getPatterns() ... condition is null
    'springfox-', 'swagger-', 'springdoc-'
)
$beforeCount = $allJars.Count
$allJars = $allJars | Where-Object {
    $n = $_.Name
    $isBlocked = $false
    foreach ($pre in $blockedPrefixes) {
        # 必须用 "$pre*" 拼接通配符，不能写成 "$_-*"：
        # 后者会被 PowerShell 解析成变量 "$_-"，通配符模式实际变成 "-*"，永远匹配不到，
        # 于是黑名单静默失效（曾因此让 springfox、旧 slf4j 一直留在 classpath 里）。
        if ($n -like "$pre*") { $isBlocked = $true; break }
    }
    -not $isBlocked
}
Write-Host "日志冲突依赖剔除: $beforeCount -> $($allJars.Count)"

# 指定必须使用的精确版本。
# 去重逻辑只按版本号取最高，未必是运行期正确的那个：
# 例如 jakarta.xml.bind-api 4.x 用的是 jakarta.* 命名空间，
# 而 Hibernate 5.6（Spring Boot 2.7.5 配套版本）需要 javax.xml.bind.*，
# 取 4.0.1 会导致 NoClassDefFoundError: javax/xml/bind/JAXBException。
# 这类"版本更高反而不兼容"的情况必须显式钉住。
$pinVersions = @{
    'jakarta.xml.bind-api' = '2.3.3'
    # Hibernate 5.6.12 需要 jsqlparser 4.2+（用到 Function.withName）；
    # 本地仓库里只有 3.2，不钉版本会在 Repository 初始化时报 NoSuchMethodError。
    'jsqlparser' = '4.2'
}
$allJars = $allJars | Where-Object {
    $artifact = $_.Directory.Parent.Name
    $ver = $_.Directory.Name
    -not ($pinVersions.ContainsKey($artifact) -and $ver -ne $pinVersions[$artifact])
}
Write-Host "版本钉定后 jar 数: $($allJars.Count)"

function Parse-Version($v) {
    # 把版本号拆成数字段（非数字如 Final/RELEASE 当作 0），
    # 再拼成定宽字符串，保证 Sort-Object 能按数值大小正确比较
    # （直接返回数组会报 op_Addition 异常）。
    $parts = @(($v -split '[.\-]') | ForEach-Object {
        $n = 0; if ([int]::TryParse($_, [ref]$n)) { $n } else { 0 }
    })
    while ($parts.Count -lt 4) { $parts += 0 }
    return ('{0:D5}{1:D5}{2:D5}{3:D5}' -f $parts[0], $parts[1], $parts[2], $parts[3])
}

# 按「artifact 目录」分组（即 .../<groupIdPath>/<artifactId>/），每个 artifact 只保留版本最高的 jar。
# 注意：$_.Directory 是版本目录，$_.Directory.Parent 才是 artifact 目录；
# 之前按「artifact + 版本」拼串分组等于没分组，旧版本仍会全部留在 classpath 里。
$groups = $allJars | Group-Object { $_.Directory.Parent.FullName }
$jars = @()
$dropped = 0
foreach ($g in $groups) {
    $best = $g.Group |
        Sort-Object -Property @{ Expression = { Parse-Version $_.Directory.Name } } -Descending |
        Select-Object -First 1
    $jars += $best.FullName
    $dropped += ($g.Group | Where-Object { $_.FullName -ne $best.FullName } | Measure-Object).Count
}
if ($jars.Count -eq 0) { Write-Error "本地仓库里没有可用 jar"; exit 2 }
Write-Host "依赖 jar 去重: $($allJars.Count) -> $($jars.Count)（丢弃低版本 $dropped 个）"

# 显式指定 Lombok 处理器，避免旧版本 lombok 抢占 classpath 在 JDK17 上失败
$lombok = Get-ChildItem (Join-Path $m2 'org\projectlombok\lombok') -Recurse -Filter 'lombok-1.18.24.jar' -ErrorAction SilentlyContinue |
          Select-Object -First 1 -ExpandProperty FullName
if (-not $lombok) { Write-Error "找不到 lombok-1.18.24.jar"; exit 2 }

$srcRoot = Join-Path $ProjectRoot 'src\main\java'
$srcs = Get-ChildItem $srcRoot -Recurse -Filter *.java | Select-Object -ExpandProperty FullName
if ($srcs.Count -eq 0) { Write-Error "没有找到 Java 源文件"; exit 2 }

if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# javac 的参数文件必须用系统 ANSI 编码，否则中文路径会解析失败
$argFile = Join-Path $OutDir 'javac.args'
$cp = (($jars | ForEach-Object { $_ -replace '\\', '/' }) -join ';')
$outFwd = $OutDir -replace '\\', '/'

# -parameters 必须加：Spring 的 @RequestParam/@PathVariable 依赖方法参数名，
# 而 Java 默认不保留参数名。Maven 构建（spring-boot-starter-parent）会自动传入该选项，
# 这里手工 javac 校验时也必须保持一致，否则运行时会报
# "Name for argument of type [java.lang.String] not specified"。
$lines = @('-nowarn', '-encoding', 'UTF-8', '-parameters', '-d', "`"$outFwd`"", '-cp', "`"$cp`"",
           '-processorpath', "`"$($lombok -replace '\\','/')`"",
           '-processor', 'lombok.launch.AnnotationProcessorHider$AnnotationProcessor')
$lines += $srcs | ForEach-Object { "`"$($_ -replace '\\','/')`"" }

[System.IO.File]::WriteAllLines($argFile, $lines, [System.Text.Encoding]::GetEncoding(936))

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$res = & javac "@$argFile" 2>&1
$sw.Stop()

if ($LASTEXITCODE -eq 0) {
    $n = (Get-ChildItem $OutDir -Recurse -Filter *.class | Measure-Object).Count
    Write-Host "COMPILE OK  classes=$n  elapsed=$([int]$sw.Elapsed.TotalSeconds)s"

    # 顺带导出运行所需 classpath（编译产物目录 + 全部依赖），方便直接 java -cp @file 启动。
    # 用 ANSI 编码写出，因为 java 读取 @argfile 时按平台默认字符集解析。
    $runCp = $cp + ';' + (Resolve-Path $OutDir).Path
    $cpFile = Join-Path $OutDir 'cp.txt'
    [System.IO.File]::WriteAllText($cpFile, $runCp, [System.Text.Encoding]::GetEncoding(936))
    Write-Host "classpath file: $cpFile"
} else {
    Write-Host "COMPILE FAILED (exit $LASTEXITCODE)"
    $res | Select-Object -First 60 | ForEach-Object { Write-Host $_ }
}
exit $LASTEXITCODE
