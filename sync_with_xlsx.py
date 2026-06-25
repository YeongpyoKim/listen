# -*- coding: utf-8 -*-
"""
sync_with_xlsx.py

Usage: python sync_with_xlsx.py

Reads '상점 리스트.xlsx' (root) as source of truth. Keeps shops listed there;
removes any shop folders (root) and asset folders (site/assets/<id>) for shops
that are present in the repository but NOT listed in the Excel.

Also updates `site_content.py` to keep only shops in the Excel. For shops
present in Excel but missing in the previous CONTENT, an empty dict is added
so generate_stores.py will still include them.
"""

from pathlib import Path
import json
import openpyxl
import shutil
import re

ROOT = Path(__file__).resolve().parent
XLSX = ROOT / "상점 리스트.xlsx"
SITE = ROOT / "site"
ASSETS = SITE / "assets"
CONTENT_PY = ROOT / "site_content.py"
STORES_JSON = SITE / "data" / "stores.json"


def read_excel_names(xlsx_path):
    wb = openpyxl.load_workbook(xlsx_path)
    ws = wb.active
    names = []
    for row in ws.iter_rows(min_row=4, values_only=False):
        name_cell = row[1]
        if not name_cell.value:
            continue
        names.append(str(name_cell.value).strip())
    return names


def load_content(py_path):
    # Execute the file to get CONTENT
    g = {}
    code = py_path.read_text(encoding="utf-8")
    exec(code, g)
    return g.get("CONTENT", {})


def write_content(py_path, content_dict):
    with open(py_path, "w", encoding="utf-8") as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write("CONTENT = ")
        f.write(json.dumps(content_dict, ensure_ascii=False, indent=4))
        f.write("\n")


def load_stores_map(stores_json_path):
    if not stores_json_path.exists():
        return {}
    j = json.loads(stores_json_path.read_text(encoding="utf-8"))
    m = {}
    for s in j.get("stores", []):
        m[s.get("name")] = s.get("id")
    return m


def natural_key(path: Path):
    m = re.search(r"(\d+)", path.stem)
    return (0, int(m.group(1))) if m else (1, 0)


def main():
    if not XLSX.exists():
        print(f"Error: {XLSX} not found.")
        return

    excel_names = read_excel_names(XLSX)
    print(f"[i] {len(excel_names)} shops in Excel")

    content = load_content(CONTENT_PY)
    stores_map = load_stores_map(STORES_JSON)

    # shops currently in content/stores
    current_names = set(list(content.keys()) + list(stores_map.keys()))
    excel_set = set(excel_names)

    to_remove = sorted(current_names - excel_set)
    print(f"[i] Will remove {len(to_remove)} shops: {to_remove}")

    # delete root source folders matching removed names
    for name in to_remove:
        src = ROOT / name
        if src.exists() and src.is_dir():
            try:
                shutil.rmtree(src)
                print(f"[rm] removed source folder: {src}")
            except Exception as e:
                print(f"[!] failed to remove {src}: {e}")

    # delete asset folders using stores_map
    for name in to_remove:
        sid = stores_map.get(name)
        if sid:
            d = ASSETS / sid
            if d.exists() and d.is_dir():
                try:
                    shutil.rmtree(d)
                    print(f"[rm] removed assets folder: {d}")
                except Exception as e:
                    print(f"[!] failed to remove {d}: {e}")

    # build new CONTENT keeping only excel names
    new_content = {}
    for n in excel_names:
        if n in content:
            new_content[n] = content[n]
        else:
            new_content[n] = {}

    write_content(CONTENT_PY, new_content)
    print(f"[ok] Updated {CONTENT_PY} with {len(new_content)} entries")

    # regenerate stores.json
    print("[i] Regenerating site/data/stores.json via generate_stores.py")
    import subprocess

    subprocess.check_call(["python", str(ROOT / "generate_stores.py")])

    print("[done] sync_with_xlsx completed")


if __name__ == "__main__":
    main()
