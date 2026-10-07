# check-schema.py
# 用途：比对「JPA 实体的 @Column/@JoinColumn 列名」与「数据库里实际存在的列」，
#       把不一致的地方直接列出来。
#
# 为什么需要它（真实踩坑）：
#   改名过程中实体列名被改成了 supply_item_id，而数据库里那一列其实叫 item_id，
#   编译完全正常、应用也能启动，**只有真正读写该表时才炸**：
#       Unknown column 'supply_item_id' in 'field list'
#   表现为"提交申领失败""汇总失败"，而普通页面看起来一切正常，非常难查。
#   所以每次改完列名都要跑一遍本脚本。
#
# 用法：
#   python devtools/check-schema.py

import os
import re
import subprocess
import sys

import_ok = True
try:
    import pymysql  # noqa: F401
except ImportError:
    import_ok = False

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENTITY_DIR = os.path.join(ROOT, "src", "main", "java", "com", "enterprise", "supply", "entity")
DB = "office_supply"

MYSQL = r"D:\phpstudy_pro\Extensions\MySQL8.0.12\bin\mysql.exe"


def query(sql):
    """用 phpStudy 自带的 mysql 客户端执行查询，返回行列表（tab 分隔）。"""
    exe = MYSQL if os.path.exists(MYSQL) else "mysql"
    r = subprocess.run(
        [exe, "-uroot", "-proot", "-N", "--default-character-set=utf8mb4", "-e", sql],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if r.returncode != 0:
        return None, (r.stderr or "").strip()
    rows = [ln.split("\t") for ln in (r.stdout or "").strip().splitlines() if ln.strip()]
    return rows, None


def main():
    # 1) 解析实体：表名 + 显式列名
    entities = []
    for f in sorted(os.listdir(ENTITY_DIR)):
        if not f.endswith(".java"):
            continue
        path = os.path.join(ENTITY_DIR, f)
        text = open(path, encoding="utf-8").read()
        table = re.search(r'@Table\(\s*name\s*=\s*"([^"]+)"', text)
        if not table:
            continue
        # 只校验 @Column：它一定是"本表自己的列"。
        # @JoinColumn 不能按本表校验 —— 例如 Requisition 上的
        #   @OneToMany @JoinColumn(name="requisition_id")
        # 指的是**对方表**（t_requisition_item）的列，不是 t_requisition 的列。
        cols = re.findall(r'@Column\(\s*name\s*=\s*"([^"]+)"', text)
        entities.append({"file": f, "table": table.group(1), "cols": cols})

    if not entities:
        print("没有解析到任何实体，检查 ENTITY_DIR 是否正确")
        return 2

    # 2) 取数据库所有表的列
    rows, err = query(
        f"SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='{DB}';"
    )
    if rows is None:
        print("无法查询数据库（确认 MySQL 已启动）：" + (err or ""))
        return 2
    db = {}
    for t, c in rows:
        db.setdefault(t, set()).add(c)

    # 3) 比对
    problems = []
    checked = 0
    for e in entities:
        table = e.get("table") or ""
        if not table or table == "(表名缺失)":
            problems.append((e["file"], "(no @Table name)", "(entity defines no table)"))
            continue
        cols = db.get(table)
        if cols is None:
            problems.append((e["file"], table, "(TABLE NOT FOUND in database)"))
            continue
        for c in e["cols"]:
            checked += 1
            if c not in cols:
                problems.append((e["file"], table, c))

    print("entities parsed : %d" % len(entities))
    print("columns checked : %d" % checked)
    print("")
    if not problems:
        print("OK: every @Column(name=...) exists in the database")
        return 0

    print("MISMATCHES: %d" % len(problems))
    for f, t, c in problems:
        print("  %-26s table=%-24s column=%s" % (f, t, c))
        dbcols = sorted(db.get(t, []))
        if dbcols:
            print("       actual columns: %s" % ", ".join(dbcols))
    print("")
    print("Fix: align @Column(name=...) with the real DB column (or update the DDL script).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
