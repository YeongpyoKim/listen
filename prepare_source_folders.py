import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JSON_PATH = ROOT / "site" / "data" / "stores.json"

def main():
    if not JSON_PATH.exists():
        print(f"Error: {JSON_PATH} not found.")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    stores = data.get("stores", [])
    
    for s in stores:
        name = s["name"]
        sid = s["id"]
        gallery = s.get("gallery", [])
        
        if not gallery:
            print(f"[i] {name} ({sid}) has no photos. Skipping source folder creation.")
            continue
            
        # Source asset folder: site/assets/sXX
        asset_dir = ROOT / "site" / "assets" / sid
        if not asset_dir.exists():
            print(f"[!] Warning: Asset directory {asset_dir} not found for {name}.")
            continue
            
        # Target source folder: <store_name>
        src_dir = ROOT / name
        src_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy files
        for img_rel in gallery:
            img_name = Path(img_rel).name
            src_file = asset_dir / img_name
            dest_file = src_dir / img_name
            if src_file.exists():
                shutil.copy2(src_file, dest_file)
        
        print(f"[+] Recreated source folder: {name}/ with {len(gallery)} images.")

if __name__ == "__main__":
    main()
