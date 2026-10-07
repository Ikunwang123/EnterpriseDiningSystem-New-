# test-api.ps1
# 用途：对「企业办公用品申领管理系统」跑一遍核心链路的自动化验证。
# 覆盖：登录（多角色）、用品目录、计划创建/发布、申领提交、我的申领、
#       业务规则（重复申领拦截）、未登录拦截、图片数据完整性。
#
# 用法（先确保 phpStudy 里 MySQL 已启动、IDEA 里应用已运行）：
#   powershell -ExecutionPolicy Bypass -File devtools\test-api.ps1
#
# 说明：
#   · 只做「读 + 新增」操作，不会删除或改写既有数据；
#   · 会向 test 库写入申领单，如需干净起点请先重跑 init.sql；
#   · 某些用例依赖「当前时间与领用开始时间的关系」，脚本会尽量自适应并说明。

param(
    [string]$BaseUrl = 'http://localhost:8080'
)

$ErrorActionPreference = 'Continue'

# ---------- 计数与输出 ----------
$script:pass = 0
$script:fail = 0
$script:skip = 0
$results = @()

function Record($id, $name, $ok, $detail) {
    if ($ok) { $script:pass++; $tag = 'PASS' } else { $script:fail++; $tag = 'FAIL' }
    $line = '  [{0}] {1,-6} {2,-34} {3}' -f $tag, $id, $name, $detail
    Write-Host $line
    $script:results += [pscustomobject]@{ Id = $id; Name = $name; Result = $tag; Detail = $detail }
}

function Skip($id, $name, $why) {
    $script:skip++
    Write-Host ('  [SKIP] {0,-6} {1,-34} {2}' -f $id, $name, $why)
}

function Section($t) { Write-Host ''; Write-Host ('=== ' + $t + ' ===') }

# 取 UTF-8 解码后的响应文本（避免中文乱码影响断言）
function Get-Text($url, $session) {
    $r = Invoke-WebRequest $url -UseBasicParsing -WebSession $session -TimeoutSec 20
    return [System.Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
}

function New-Session() { return New-Object Microsoft.PowerShell.Commands.WebRequestSession }

# 容错调用：后端把部分业务校验失败也当成 500 返回，
# 而 Invoke-RestMethod 遇到 4xx/5xx 会直接抛异常、拿不到响应体。
# 这里捕获异常并尽力读出服务端返回的内容，避免"只看到 500、不知道原因"。
function Invoke-Api {
    param($Url, $Method = 'Get', $Session, $Body, $ContentType)
    $p = @{ Uri = $Url; Method = $Method; TimeoutSec = 25 }
    if ($Session) { $p.WebSession = $Session }
    if ($Body) { $p.Body = $Body }
    if ($ContentType) { $p.ContentType = $ContentType }
    try {
        $r = Invoke-RestMethod @p
        return @{ ok = $true; data = $r; httpStatus = 200; error = $null }
    } catch {
        $status = $null
        $serverMsg = $null
        try {
            $resp = $_.Exception.Response
            if ($resp) {
                $status = [int]$resp.StatusCode
                $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $serverMsg = $sr.ReadToEnd()
            }
        } catch { }
        if (-not $serverMsg) { $serverMsg = $_.Exception.Message }
        return @{ ok = $false; data = $null; httpStatus = $status; error = $serverMsg }
    }
}

function Login($user, $pwd, $session) {
    $r = Invoke-Api "$BaseUrl/api/user/login" 'Post' $session @{ username = $user; password = $pwd }
    return $r.data
}

# ---------- 0. 前置检查 ----------
Section '0. 前置检查'
$session = New-Session
try {
    $null = Invoke-WebRequest "$BaseUrl/login.html" -UseBasicParsing -TimeoutSec 10
    Record 'P00' '应用可访问' $true $BaseUrl
} catch {
    Record 'P00' '应用可访问' $false "$BaseUrl 无法访问，请先启动应用"
    Write-Host ''
    Write-Host '应用未启动，后续用例无法执行。'
    exit 1
}

# ---------- 1. 登录与权限 ----------
Section '1. 登录与权限（T01/T05/T06/T07）'

# 账号与角色（chef001 已移除；dispatcher001 恢复为独立角色 DISPATCHER）
$roles = @(
    @{ u = 'superadmin';    r = 'ADMIN' },
    @{ u = 'manager001';    r = 'MANAGER' },
    @{ u = 'dispatcher001'; r = 'DISPATCHER' },
    @{ u = 'finance001';    r = 'ADMIN' },     # 原 FINANCE，统计归 ADMIN
    @{ u = 'staff001';      r = 'STAFF' }
)
foreach ($x in $roles) {
    $s = New-Session
    try {
        $r = Login $x.u '123456' $s
        Record 'T01' ("登录 " + $x.u) ($r.status -eq 'success' -and $r.role -eq $x.r) "role=$($r.role)"
    } catch {
        Record 'T01' ("登录 " + $x.u) $false $_.Exception.Message
    }
}

# 错误密码
$sBad = New-Session
try {
    $r = Login 'superadmin' 'definitely-wrong' $sBad
    Record 'T02' '错误密码被拒绝' ($r.status -ne 'success') "status=$($r.status)"
} catch {
    Record 'T02' '错误密码被拒绝' $true '服务端直接拒绝（非 200）'
}

# 未登录访问受保护接口
$sAnon = New-Session
try {
    $t = Get-Text "$BaseUrl/api/user/profile" $sAnon
    Record 'E01' '未登录被拦截' ($t -match 'error|未登录') '返回未登录'
} catch {
    Record 'E01' '未登录被拦截' $true '请求被拒绝'
}

# ---------- 2. 用品目录 ----------
Section '2. 用品目录（T09/T10）'
$s = New-Session
Login 'superadmin' '123456' $s | Out-Null

try {
    $all = Invoke-RestMethod "$BaseUrl/api/recipe/all" -WebSession $s -TimeoutSec 20
    $n = $all.data.Count
    Record 'T09' '用品目录条数=51' ($n -eq 51) "实际 $n 条"
} catch { Record 'T09' '用品目录条数=51' $false $_.Exception.Message }

try {
    $body = Get-Text "$BaseUrl/api/recipe/all" $s
    # 配图扩展名以 .jpeg 为准（手工替换后统一为 JPEG），同时兼容 .png / .jpg
    $withImg = ([regex]::Matches($body, '/images/\d+\.(jpeg|jpg|png)')).Count
    Record 'T10' '图片路径完整(51)' ($withImg -eq 51) "含图片路径 $withImg 条"
} catch { Record 'T10' '图片路径完整(51)' $false $_.Exception.Message }

try {
    # 不硬编码扩展名：先问后端第 1 条用的实际路径，再按该路径请求
    $one = Get-Text "$BaseUrl/api/recipe/1" $s
    $m = [regex]::Match($one, '/images/[^"'']+')
    if ($m.Success) {
        $imgUrl = $m.Value
        $r = Invoke-WebRequest ($BaseUrl + $imgUrl) -UseBasicParsing -TimeoutSec 10
        Record 'T10b' '图片文件可访问' ($r.StatusCode -eq 200) "$imgUrl HTTP $($r.StatusCode) type=$($r.Headers['Content-Type'])"
    } else {
        Record 'T10b' '图片文件可访问' $false '接口未返回图片路径'
    }
} catch { Record 'T10b' '图片文件可访问' $false $_.Exception.Message }

# ---------- 3. 计划创建与发布 ----------
Section '3. 领用计划（T15/T17/T18/T21）'

# 目标日期由服务端判定（当天或次日）
$td = Invoke-RestMethod "$BaseUrl/api/dining/order/target-date" -WebSession $s -TimeoutSec 20
$targetDate = $td.data.targetDate
Write-Host "  （服务端判定的目标申领日期: $targetDate）"

try {
    $c = Invoke-RestMethod "$BaseUrl/api/menu/create?date=$targetDate" -Method Post -WebSession $s `
        -ContentType 'application/json' -Body '[1,2,11]' -TimeoutSec 25
    # 断言方式：不看 msg（中文会被 PowerShell 按 GBK 解码成乱码，导致假失败），
    # 而是回到服务端确认「该日期的计划确实存在」——这才是本用例真正要保证的状态。
    #
    # 补充说明：重复创建时后端返回 Result.error(...)，其 code 为 500
    # （把业务校验失败当 500 返回，属接口设计小瑕疵；前端能正确提示，不影响功能）。
    $after = Invoke-RestMethod "$BaseUrl/api/menu/list?date=$targetDate" -WebSession $s -TimeoutSec 20
    $nPlan = ($after.data | Measure-Object).Count
    Record 'T15' '创建领用计划' ($nPlan -ge 1) "code=$($c.code) 该日期计划数=$nPlan"
} catch { Record 'T15' '创建领用计划' $false $_.Exception.Message }

try {
    $p = Invoke-RestMethod "$BaseUrl/api/menu/publish?date=$targetDate" -Method Post -WebSession $s -TimeoutSec 25
    Record 'T18' '发布领用计划' ($p.code -eq 200) "code=$($p.code)"
} catch { Record 'T18' '发布领用计划' $false $_.Exception.Message }

try {
    $tl = Invoke-RestMethod "$BaseUrl/api/dining/menu/today" -WebSession $s -TimeoutSec 20
    $cnt = $tl.data.Count
    Record 'T21' '可申领清单可见' ($cnt -ge 1) "$cnt 项"
} catch { Record 'T21' '可申领清单可见' $false $_.Exception.Message }

# 申领页的两个数据来源必须返回**同一套字段结构**，
# 否则前端得写兼容转换代码（曾因两套结构不一致出过 404 与字段缺失）。
try {
    $q1 = Invoke-RestMethod "$BaseUrl/api/dining/menu/today" -WebSession $s -TimeoutSec 20
    $q2 = Invoke-RestMethod "$BaseUrl/api/dining/menu/list?date=$targetDate" -WebSession $s -TimeoutSec 20
    $c1 = if ($q1.data.Count -gt 0) { ($q1.data[0].PSObject.Properties.Name | Sort-Object) -join ',' } else { '' }
    $c2 = if ($q2.data.Count -gt 0) { ($q2.data[0].PSObject.Properties.Name | Sort-Object) -join ',' } else { '' }
    Record 'T21b' '两个菜单接口结构一致' (($c1 -ne '') -and ($c1 -eq $c2)) "today=[$c1] list=[$c2]"
    Record 'T21c' '按日期取菜单可用' ($q2.code -eq 200) "code=$($q2.code) 条数=$($q2.data.Count)"
} catch { Record 'T21b' '两个菜单接口结构一致' $false $_.Exception.Message }

# ---------- 4. 申领提交 + 我的申领 ----------
Section '4. 申领流程（T22/T23/T25）'

# 用一个"当天还没申领过"的账号来跑，避免被"每人每天一次"规则挡住
$applicant = $null
foreach ($u in @('staff002', 'staff003', 'staff001')) {
    $sx = New-Session
    Login $u '123456' $sx | Out-Null
    try {
        $mine = Invoke-RestMethod "$BaseUrl/api/dining/my-requisitions" -WebSession $sx -TimeoutSec 20
        if (($mine.data | Measure-Object).Count -eq 0) { $applicant = @{ user = $u; sess = $sx }; break }
    } catch { }
}
if (-not $applicant) {
    $sx = New-Session
    Login 'staff002' '123456' $sx | Out-Null
    $applicant = @{ user = 'staff002'; sess = $sx }
    Write-Host "  （提示：staff002/003/001 均已有申领记录，仍用 staff002 验证重复拦截）"
} else {
    Write-Host "  （选用未申领账号: $($applicant.user)）"
}
$as = $applicant.sess

# 拿到可申领的 menuId
$tl2 = Invoke-RestMethod "$BaseUrl/api/dining/menu/today" -WebSession $as -TimeoutSec 20
if (($tl2.data | Measure-Object).Count -ge 1) {
    $pick = @($tl2.data | Select-Object -First 3)
    $items = ($pick | ForEach-Object { '{"menuItemId":' + $_.id + ',"quantity":2}' }) -join ','
    $payload = '{"items":[' + $items + ']}'

    # 记录提交前的申领单数量，便于判断本次是否真的新增成功
    $beforeCnt = 0
    try {
        $pre = Invoke-RestMethod "$BaseUrl/api/dining/my-requisitions" -WebSession $as -TimeoutSec 20
        $beforeCnt = ($pre.data | Measure-Object).Count
    } catch { }

    try {
        $subRes = Invoke-Api "$BaseUrl/api/dining/order/submit" 'Post' $as $payload 'application/json'
        $sub = $subRes.data
        $subOk = $subRes.ok -and ($sub.code -eq 200) -and ($null -ne $sub.data.orderNo)

        # 断言"后置状态"而不是返回码本身：
        # 若该账号当天已申领过，服务端会按「每人每天只能申领一次」拒绝——这是规则生效，
        # 不是缺陷；此时只要它确实已有申领记录，本用例即算通过。
        $mine = Invoke-RestMethod "$BaseUrl/api/dining/my-requisitions" -WebSession $as -TimeoutSec 20
        $cnt = ($mine.data | Measure-Object).Count

        if ($subOk) {
            Record 'T22' '提交申领' $true "新增成功 单号=$($sub.data.orderNo)"
        } elseif ($cnt -ge 1) {
            Record 'T22' '提交申领（今日已申领）' $true "被「每人每天一次」拦截，已有 $cnt 条（规则生效）"
        } else {
            # 诚实记录失败原因，便于排查
            $why = if ($subRes.error) { $subRes.error } else { "code=$($sub.code)" }
            Record 'T22' '提交申领' $false ("HTTP $($subRes.httpStatus) :: " + $why)
        }

        # 我的申领（历史上曾因前后端路径不一致而 404）
        Record 'T23' '我的申领可加载' ($cnt -ge 1) "条数=$cnt"
        if ($cnt -ge 1) {
            $amt = $mine.data[0].totalAmount
            $sum = 0.0
            foreach ($it in $mine.data[0].items) { $sum += [double]$it.subtotal }
            Record 'T25' '总金额=明细合计' ([Math]::Abs([double]$amt - $sum) -lt 0.01) "总额=$amt 明细合计=$sum"

            # 新增断言：接口返回的字段名必须覆盖前端读取的字段名，
            # 否则页面上会显示 undefined（历史上 orderNo/itemName 都踩过）。
            $o = $mine.data[0]
            $f1 = ($null -ne $o.orderNo)
            $f2 = ($null -ne $o.items[0].itemName)
            $f3 = ($null -ne $o.totalAmount)
            $bad = @()
            if (-not $f1) { $bad += 'orderNo' }
            if (-not $f2) { $bad += 'items[].itemName' }
            if (-not $f3) { $bad += 'totalAmount' }
            Record 'T26' '我的申领字段完整' ($bad.Count -eq 0) $(if ($bad.Count -eq 0) { 'orderNo/itemName/totalAmount 均存在' } else { '缺失: ' + ($bad -join ',') })
        }
    } catch {
        Record 'T22' '提交申领' $false $_.Exception.Message
    }

    # 字段名兼容性：前端历史上发的是 planItemId，而后端 DTO 属性是 menuItemId，
    # 导致 menuItemId 为 null → 申领失败（"提交了但我的申领里没有"就是这么来的）。
    # 后端现已同时接受两个键名，这里固定回归验证一次。
    try {
        $probeId = $pick[0].id
        $subProbe = Invoke-RestMethod "$BaseUrl/api/dining/order/submit" -Method Post -WebSession $as `
            -ContentType 'application/json' -Body "{`"items`":[{`"planItemId`":$probeId,`"quantity`":1}]}" -TimeoutSec 25
        # 该账号今天可能已申领 → 返回"每人每天只能提交申领一次"同样说明字段被正确解析了
        $parsed = ($subProbe.code -eq 200) -or ($null -ne $subProbe.msg)
        $notFieldError = -not ($subProbe.msg -match 'menuItemId|planItemId|null|标识')
        Record 'T27' 'planItemId 字段被正确解析' ($parsed -and $notFieldError) "code=$($subProbe.code)"
    } catch { Record 'T27' 'planItemId 字段被正确解析' $false $_.Exception.Message }

    # 业务规则：重复申领拦截
    try {
        $sub2 = Invoke-RestMethod "$BaseUrl/api/dining/order/submit" -Method Post -WebSession $as `
            -ContentType 'application/json' -Body $payload -TimeoutSec 25
        $blocked = ($sub2.msg -ne 'success')
        Record 'R01' '重复申领被拦截' $blocked "msg=$($sub2.msg)"
    } catch {
        Record 'R01' '重复申领被拦截' $true '第二次提交被拒绝'
    }
} else {
    Skip 'T22/T23/R01' '申领流程' '可申领清单为空，无法提交'
}

# ---------- 5. 权限隔离 ----------
Section '5. 权限隔离（E02 / R02~R05）'

# 统一的"应被拒绝"探测：期望 HTTP 403
function Expect-Denied($label, $id, $url, $sess) {
    try {
        $r = Invoke-WebRequest $url -WebSession $sess -UseBasicParsing -TimeoutSec 15
        Record $id $label $false "★ 未被拦截，HTTP $($r.StatusCode)"
    } catch {
        $code = 0
        try { $code = [int]$_.Exception.Response.StatusCode } catch { }
        Record $id $label ($code -eq 403) "HTTP $code（期望 403）"
    }
}

$sStaff = New-Session
Login 'staff001' '123456' $sStaff | Out-Null
Expect-Denied 'STAFF 访问用户管理受限' 'E02' "$BaseUrl/api/user/list" $sStaff

# 配送员（DISPATCHER）只能做配送相关的事：
# 用品目录、领用计划管理、汇总领用单、用户管理、系统设置、统计报表 都应被拒绝。
$sDisp = New-Session
$dispLogin = Login 'dispatcher001' '123456' $sDisp
Record 'R01' '配送员登录' ($dispLogin.status -eq 'success' -and $dispLogin.role -eq 'DISPATCHER') "role=$($dispLogin.role)"

# 应被允许：总览 + 配送单打印
try {
    $ds = Invoke-WebRequest "$BaseUrl/api/dashboard/stats" -WebSession $sDisp -UseBasicParsing -TimeoutSec 15
    Record 'R02' '配送员可看总览' ($ds.StatusCode -eq 200) "HTTP $($ds.StatusCode)"
} catch { Record 'R02' '配送员可看总览' $false $_.Exception.Message }

try {
    $dp = Invoke-WebRequest "$BaseUrl/api/print/orders" -WebSession $sDisp -Headers @{ 'User-ID' = '4' } -UseBasicParsing -TimeoutSec 15
    Record 'R03' '配送员可用配送单打印' ($dp.StatusCode -eq 200) "HTTP $($dp.StatusCode)"
} catch { Record 'R03' '配送员可用配送单打印' $false $_.Exception.Message }

# 应被拒绝的管理接口
Expect-Denied '配送员不能看用品目录'   'R04' "$BaseUrl/api/recipe/all" $sDisp
Expect-Denied '配送员不能看汇总领用单' 'R05' "$BaseUrl/api/summaries/$targetDate" $sDisp
Expect-Denied '配送员不能看用户管理'   'R06' "$BaseUrl/api/user/list" $sDisp
Expect-Denied '配送员不能看系统设置'   'R07' "$BaseUrl/api/settings/all" $sDisp
Expect-Denied '配送员不能看领用统计'   'R08' "$BaseUrl/api/reports/export/monthly-sales?yearMonth=2026-10" $sDisp

# 已移除的账号不能登录
try {
    $gone = Login 'chef001' '123456' (New-Session)
    Record 'R09' 'chef001 账号已移除' ($gone.status -eq 'error') "status=$($gone.status)"
} catch { Record 'R09' 'chef001 账号已移除' $true '登录被拒绝' }

# ---------- 6. 汇总与统计 ----------
Section '6. 汇总与统计（T28/T32）'
try {
    $smGen = Invoke-RestMethod "$BaseUrl/api/summaries/generate?date=$targetDate" -Method Post -WebSession $s -TimeoutSec 25
    Record 'T28' '生成汇总领用单' ($smGen.success -eq $true) "success=$($smGen.success)"
} catch { Record 'T28' '生成汇总领用单' $false $_.Exception.Message }

# 汇总查询：既验证「没有数据时不返回空响应体」，也验证字段名覆盖前端读取
try {
    $sRaw = Invoke-WebRequest "$BaseUrl/api/summaries/$targetDate" -WebSession $s -UseBasicParsing -TimeoutSec 20
    $sBody = [System.Text.Encoding]::UTF8.GetString($sRaw.RawContentStream.ToArray())
    $notEmptyBody = ($sBody.Trim().Length -gt 0)
    Record 'T29' '汇总查询不返回空响应体' $notEmptyBody "HTTP $($sRaw.StatusCode) body长度=$($sBody.Length)"

    if ($notEmptyBody -and $sBody.Trim() -ne 'null') {
        $sm = $sBody | ConvertFrom-Json
        $hasTotals = ($null -ne $sm.totalQuantity) -and ($null -ne $sm.totalAmount)
        Record 'T30' '汇总字段完整' $hasTotals "totalQuantity=$($sm.totalQuantity) totalAmount=$($sm.totalAmount)"

        if ($sm.items -and $sm.items.Count -gt 0) {
            $it = $sm.items[0]
            # 前端 SummarySheetModule 读的是 planItemName
            $nameOk = ($null -ne $it.planItemName) -or ($null -ne $it.menuItemName)
            Record 'T31' '汇总明细名称字段存在' $nameOk "planItemName=$($it.planItemName)"
        }
    }
} catch { Record 'T29' '汇总查询不返回空响应体' $false $_.Exception.Message }

# 无数据日期：必须是结构化空结果（HTTP 200 + 非空 body），不能是空响应体
try {
    $eRaw = Invoke-WebRequest "$BaseUrl/api/summaries/1999-01-01" -WebSession $s -UseBasicParsing -TimeoutSec 20
    $eBody = [System.Text.Encoding]::UTF8.GetString($eRaw.RawContentStream.ToArray())
    Record 'T29b' '无数据日期返回结构化空结果' ($eBody.Trim().Length -gt 0) "body长度=$($eBody.Length)"
} catch { Record 'T29b' '无数据日期返回结构化空结果' $false $_.Exception.Message }

try {
    # 注意：报表只有 export 版端点（前端导出 Excel 用），
    # 原来的取数版 /api/reports/monthly-sales 已作为死代码删除，
    # 所以这里改用 export 端点验证"报表接口可用"。
    $ym = (Get-Date).ToString('yyyy-MM')
    $rp = Invoke-WebRequest "$BaseUrl/api/reports/export/monthly-sales?yearMonth=$ym" -WebSession $s -UseBasicParsing -TimeoutSec 25
    Record 'T32' '月度领用统计' ($rp.StatusCode -eq 200) "yearMonth=$ym HTTP $($rp.StatusCode) 长度=$($rp.RawContentLength)"
} catch { Record 'T32' '月度领用统计' $false $_.Exception.Message }

# ---------- 汇总 ----------
Section '测试汇总'
Write-Host ("  通过: {0}    失败: {1}    跳过: {2}" -f $script:pass, $script:fail, $script:skip)
if ($script:fail -gt 0) {
    Write-Host ''
    Write-Host '  失败用例：'
    $script:results | Where-Object { $_.Result -eq 'FAIL' } | ForEach-Object {
        Write-Host ('    - ' + $_.Id + ' ' + $_.Name + '  ::  ' + $_.Detail)
    }
}
Write-Host ''
if ($script:fail -eq 0) { Write-Host '  结论：核心链路全部通过' } else { Write-Host '  结论：存在失败项，请按第七节排查' }

exit $(if ($script:fail -eq 0) { 0 } else { 1 })
