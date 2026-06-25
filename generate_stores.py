# -*- coding: utf-8 -*-
"""
generate_stores.py

Creates site/data/stores.json by combining `site_content.py` (CONTENT)
and local asset folders (site/assets or <store_name> folders).

Run: python generate_stores.py
"""

from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
ASSETS = SITE / "assets"
DATA = SITE / "data"
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# import CONTENT
from site_content import CONTENT


def natural_key(path: Path):
    m = re.search(r"(\d+)", path.stem)
    return (0, int(m.group(1))) if m else (1, 0)


def slugify(i):
    return f"s{i:02d}"


def collect_images_by_name(name, sid):
    # Prefer site/assets/sid, then folder name under ROOT
    imgs = []
    d1 = ASSETS / sid
    if d1.is_dir():
        imgs = [p for p in d1.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXT]
    else:
        d2 = ROOT / name
        if d2.is_dir():
            imgs = [
                p for p in d2.iterdir() if p.is_file() and p.suffix.lower() in IMG_EXT
            ]
    imgs.sort(key=natural_key)
    return [
        (
            str(p.as_posix()).replace(str(SITE.as_posix()) + "/", "")
            if str(p).startswith(str(SITE))
            else f"assets/{sid}/{p.name}"
        )
        for p in imgs
    ]


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    stores = []
    for idx, (name, content) in enumerate(CONTENT.items(), start=1):
        sid = slugify(idx)
        gallery = collect_images_by_name(name, sid)
        main_image = gallery[0] if gallery else ""
        store = {
            "id": sid,
            "name": name,
            "type": "",
            "emoji": content.get("emoji", "🍽️"),
            "accent": content.get("accent", "#8a6d3b"),
            "tagline": content.get("tagline", ""),
            "story": content.get("story", ""),
            "sunday": content.get("sunday", "check"),
            "sunday_note": content.get("sunday_note", ""),
            "address": content.get("address", ""),
            "phone": content.get("phone", ""),
            "signature": "",
            "price": "",
            "hours": "",
            "seats": "",
            "baby_chair": "",
            "parking": "",
            "history": "",
            "tip": "",
            "charm": "",
            "naver_url": "",
            "main_image": main_image,
            "gallery": gallery,
            "placeholder": main_image == "",
        }
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
    print(f"[+] Wrote {DATA / 'stores.json'} ({len(stores)} stores)")


if __name__ == "__main__":
    main()
