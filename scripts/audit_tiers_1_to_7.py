import json
import os

missing_markdown = []
missing_api_json = []
empty_files = []
unmatched_modules = []

output_dir = os.path.join("frontend", "public", "api")
modules_file = os.path.join(output_dir, "modules-sql.json")

with open(modules_file, "r", encoding="utf-8") as f:
    modules_data = json.load(f)

module_part_map = {}
for m in modules_data:
    for n in m.get("notes", []):
        module_part_map[n["part"]] = {
            "title": n.get("title"),
            "wordCount": n.get("wordCount", 0),
            "module": m.get("module")
        }

print(f"Total parts in modules-sql.json: {len(module_part_map)}")

for p in range(1, 55):
    # Check markdown file
    md_path = os.path.join("content", "sql", f"Part-{p}", "notes.md")
    if not os.path.exists(md_path):
        missing_markdown.append(p)
    else:
        size = os.path.getsize(md_path)
        if size < 50:
            empty_files.append((p, md_path, size))

    # Check API json file
    json_path = os.path.join(output_dir, "notes", "sql", f"{p}.json")
    if not os.path.exists(json_path):
        missing_api_json.append(p)
    else:
        with open(json_path, "r", encoding="utf-8") as f:
            jdata = json.load(f)
            if not jdata.get("notes") or len(jdata.get("notes")) < 50:
                empty_files.append((p, json_path, len(jdata.get("notes", ""))))

    # Check mapping
    if p not in module_part_map or module_part_map[p]["wordCount"] == 0:
        unmatched_modules.append(p)

print("--- AUDIT RESULTS FOR PARTS 1 TO 54 ---")
print(f"Missing Markdown Files: {missing_markdown}")
print(f"Missing API JSON Files: {missing_api_json}")
print(f"Empty/Corrupted Files: {empty_files}")
print(f"Unmatched/Zero Word Modules: {unmatched_modules}")

if not missing_markdown and not missing_api_json and not empty_files and not unmatched_modules:
    print("SUCCESS! All 54 parts (Tiers 1 to 7) are 100% complete, non-empty, and verified!")
