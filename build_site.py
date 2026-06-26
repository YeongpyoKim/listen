# -*- coding: utf-8 -*-
"""
build_site.py — 경청 프로젝트 '동네 한 바퀴' 사이트 데이터 빌더

하는 일:
  1) '상점 리스트.xlsx' 에서 21개 상점의 사실 정보(메뉴/가격/영업시간/좌석/주차 등)를 읽는다.
  2) 각 상점 폴더에서 사진을 자연정렬(0,1,2,...,10)하여 '가장 앞번호'를 대표사진으로 선정한다.
  3) site_content.py 의 감성 콘텐츠(메시지/스토리/주일안내/주소/전화/색감)를 결합한다.
  4) 사진을 site/assets/<id>/ 로 복사하고, site/data/stores.json 을 생성한다.

폴더가 없는 상점(블리스냅/태문네/은행나무집/김밥365)은 placeholder=true 로 표시되어
프런트엔드에서 감성 그라디언트 카드로 렌더링된다. 나중에 실제 사진을 폴더에 넣고 다시 실행하면
자동으로 대표사진/갤러리가 채워진다.

실행:  python build_site.py
"""
import json
import re
import shutil
from pathlib import Path

import openpyxl

from site_content import CONTENT

ROOT = Path(__file__).resolve().parent
XLSX = ROOT / "상점 리스트.xlsx"
SITE = ROOT / "site"
ASSETS = SITE / "assets"
DATA = SITE / "data"

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# 엑셀 헤더(3행) 기준 컬럼 매핑 (B열=인덱스1 부터)
COLS = [
    "name", "type", "manager", "signature", "price", "hours",
    "seats", "baby_chair", "parking", "history", "tip", "charm",
]


def natural_key(path: Path):
    """파일명 안의 첫 숫자를 기준으로 자연 정렬. 숫자 없으면 맨 뒤로."""
    m = re.search(r"(\d+)", path.stem)
    return (0, int(m.group(1))) if m else (1, 0)


def slugify(index: int) -> str:
    return f"s{index:02d}"


def read_excel():
    wb = openpyxl.load_workbook(XLSX)
    ws = wb.active
    rows = []
    for row in ws.iter_rows(min_row=4, values_only=False):
        name_cell = row[1]
        if not name_cell.value:
            continue
        rec = {}
        for i, key in enumerate(COLS):
            val = row[1 + i].value
            rec[key] = ("" if val is None else str(val).strip())
        rec["naver_url"] = name_cell.hyperlink.target if name_cell.hyperlink else ""
        rows.append(rec)
    return rows


def collect_images(store_name: str):
    folder = ROOT / store_name
    if not folder.is_dir():
        return []
    imgs = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXT]
    imgs.sort(key=natural_key)
    return imgs


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)

    excel_rows = read_excel()
    stores = []

    for idx, rec in enumerate(excel_rows, start=1):
        name = rec["name"]
        sid = slugify(idx)
        content = CONTENT.get(name, {})

        images = collect_images(name)
        dest_dir = ASSETS / sid
        gallery = []
        main_image = ""

        if images:
            # 기존 자산 정리 후 재복사 (idempotent)
            if dest_dir.exists():
                shutil.rmtree(dest_dir)
            dest_dir.mkdir(parents=True, exist_ok=True)
            for i, src in enumerate(images):
                ext = src.suffix.lower()
                fname = f"{i:02d}{ext}"
                shutil.copy2(src, dest_dir / fname)
                rel = f"assets/{sid}/{fname}"
                gallery.append(rel)
            main_image = gallery[0]

        store = {
            "id": sid,
            "name": name,
            "type": rec["type"],
            "emoji": content.get("emoji", "🍽️"),
            "accent": content.get("accent", "#8a6d3b"),
            "tagline": content.get("tagline", ""),
            "story": content.get("story", ""),
            "sunday": content.get("sunday", "check"),
            "sunday_note": content.get("sunday_note", ""),
            "address": content.get("address", ""),
            "phone": content.get("phone", ""),
            "signature": rec["signature"],
            "price": rec["price"],
            "hours": rec["hours"],
            "seats": rec["seats"],
            "baby_chair": rec["baby_chair"],
            "parking": rec["parking"],
            "history": rec["history"],
            "tip": rec["tip"],
            "charm": rec["charm"],
            "naver_url": rec["naver_url"],
            "main_image": main_image,
            "gallery": gallery,
            "placeholder": main_image == "",
        }
        if content.get("sunday_rule"):
            store["sunday_rule"] = content["sunday_rule"]
        stores.append(store)

    out = {
        "title": "동네 한 바퀴, 은혜 한 바구니",
        "subtitle": "경청 프로젝트 2기 · 작은 실천",
        "count": len(stores),
        "stores": stores,
    }
    (DATA / "stores.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    placeholders = [s["name"] for s in stores if s["placeholder"]]
    print(f"[OK] {len(stores)}개 상점 → {DATA / 'stores.json'}")
    print(f"[i] 사진 폴더 없는(감성 카드) 상점 {len(placeholders)}개: {', '.join(placeholders)}")


if __name__ == "__main__":
    main()
