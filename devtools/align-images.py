# align-images.py
# 用途：把 static/images 里「配图文件的实际格式与命名」和「数据库里的 image_url」对齐。
#
# 背景（实际遇到的问题）：
#   手工找的配图命名不统一 —— 1~40 是 1.jpeg，41~51 是 41.png（但内部其实是 JPEG 数据）。
#   而数据库 t_supply_item.image_url 统一存的是 /images/N.png，
#   于是 1~40 全部 404、页面不显示图片。
#
# 本脚本做三件事：
#   1. 按「文件头」识别每张 N.* 的真实格式（不信扩展名）；
#   2. 把格式与扩展名不符的转成真正的 JPEG，并统一改名为 N.jpeg；
#   3. 把数据库 image_url 改成与真实文件名一致。
#
# 用法：
#   python devtools/align-images.py            # 只看会改什么（dry-run）
#   python devtools/align-images.py --apply    # 真正执行
#
# 依赖：Pillow（工作区自带）

import argparse
import os
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG_DIR = os.path.join(ROOT, "src", "main", "resources", "static", "images")

DB = "office_supply"
# 统一使用的扩展名：配图以 JPEG 为主，统一成 .jpeg 便于脚本判断
TARGET_EXT = ".jpeg"
JPEG_QUALITY = 85


def sniff(path):
    """按文件头判断真实格式，返回 'JPEG' / 'PNG' / 'GIF' / 'WEBP' / 'UNKNOWN'。"""
    with open(path, "rb") as f:
        b = f.read(12)
    if b[:2] == b"\xff\xd8":
        return "JPEG"
    if b[:4] == b"\x89PNG":
        return "PNG"
    if b[:3] == b"GIF":
        return "GIF"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "WEBP"
    return "UNKNOWN"


def find_image(i):
    """找出编号 i 的配图文件（不论扩展名）。"""
    for ext in (".png", ".jpeg", ".jpg", ".webp", ".gif"):
        p = os.path.join(IMG_DIR, f"{i}{ext}")
        if os.path.exists(p):
            return p
    return None


def mysql_cmd(sql):
    """用 phpStudy 自带的 mysql 客户端执行 SQL。

    注意 encoding/errors：Windows 下 subprocess 默认按 GBK 解码子进程输出，
    而 mysql 客户端会回显中文（如列名"已更新条数"），
    用默认设置会抛 UnicodeDecodeError。这里显式指定 utf-8 并忽略无法解码的字节。
    """
    mysql = r"D:\phpstudy_pro\Extensions\MySQL8.0.12\bin\mysql.exe"
    if not os.path.exists(mysql):
        mysql = "mysql"
    return subprocess.run(
        [mysql, "-uroot", "-proot", "--default-character-set=utf8mb4", "-e", sql],
        capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="真正执行（默认只预览）")
    ap.add_argument("--total", type=int, default=51, help="用品总数")
    args = ap.parse_args()

    if not os.path.isdir(IMG_DIR):
        print("找不到图片目录: " + IMG_DIR)
        return 2

    plan = []       # (编号, 原文件, 真实格式, 目标文件, 是否需要转格式)
    for i in range(1, args.total + 1):
        src = find_image(i)
        if not src:
            print(f"  [缺失] {i}.* —— 该编号没有配图，跳过")
            continue
        real = sniff(src)
        dst = os.path.join(IMG_DIR, f"{i}{TARGET_EXT}")
        need_convert = real != "JPEG" or os.path.splitext(src)[1].lower() not in (".jpeg", ".jpg")
        plan.append((i, src, real, dst, need_convert))

    conv = [p for p in plan if p[4]]
    print(f"检查 {len(plan)} 张配图：需要规范化 {len(conv)} 张")
    for i, src, real, dst, need in conv[:10]:
        print(f"  {i}: {os.path.basename(src)} (真实 {real}) -> {os.path.basename(dst)}")
    if len(conv) > 10:
        print(f"  ...（其余 {len(conv) - 10} 张同理）")

    if not args.apply:
        print("")
        print("以上为预览。确认无误后执行： python devtools/align-images.py --apply")
        return 0

    # ---- 1) 规范化文件 ----
    converted = renamed = 0
    for i, src, real, dst, need in plan:
        if not need:
            continue
        if real == "JPEG":
            # 内容已是 JPEG，只需把扩展名改成 .jpeg（用重命名，不重新编码，避免二次压缩）
            if os.path.abspath(src) != os.path.abspath(dst):
                if os.path.exists(dst):
                    os.remove(dst)
                os.rename(src, dst)
                renamed += 1
        else:
            # 真正转码成 JPEG
            with Image.open(src) as im:
                if im.mode in ("RGBA", "LA", "P"):
                    im = im.convert("RGB")
                elif im.mode != "RGB":
                    im = im.convert("RGB")
                im.save(dst, "JPEG", quality=JPEG_QUALITY, optimize=True)
            if os.path.abspath(src) != os.path.abspath(dst):
                os.remove(src)
            converted += 1

    print(f"文件处理完成：转码 {converted} 张，仅改名 {renamed} 张")

    # ---- 2) 校验最终命名 ----
    bad = []
    for i in range(1, args.total + 1):
        p = os.path.join(IMG_DIR, f"{i}{TARGET_EXT}")
        if not os.path.exists(p):
            bad.append(i)
        elif sniff(p) != "JPEG":
            bad.append(i)
    if bad:
        print("以下编号的配图仍不符合预期（缺失或不是 JPEG）: " + ", ".join(map(str, bad)))
        print("请先把它们放进 images 目录后重跑本脚本。")
    else:
        print(f"全部 {args.total} 张均为 JPEG 且命名统一为 N{TARGET_EXT}")

    # ---- 3) 同步数据库 ----
    sql = (
        f"USE {DB}; "
        f"UPDATE t_supply_item SET image_url = CONCAT('/images/', id, '{TARGET_EXT}'); "
        f"SELECT COUNT(*) AS 已更新条数 FROM t_supply_item;"
    )
    r = mysql_cmd(sql)
    if r.returncode == 0 and "已更新条数" in (r.stdout or ""):
        print("数据库 image_url 已同步为 /images/N" + TARGET_EXT)
    else:
        print("数据库更新失败（可手动执行）：")
        print("  USE %s;" % DB)
        print("  UPDATE t_supply_item SET image_url = CONCAT('/images/', id, '%s');" % TARGET_EXT)
        if r.stderr:
            print("  错误: " + r.stderr.strip()[:200])

    return 0


if __name__ == "__main__":
    sys.exit(main())
