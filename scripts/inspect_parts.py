import json
import os

for p in range(1, 55):
    md_path = os.path.join("content", "sql", f"Part-{p}", "notes.md")
    if os.path.exists(md_path):
        with open(md_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            title = lines[0].strip() if lines else "EMPTY"
            word_count = sum(len(line.split()) for line in lines)
            print(f"Part {p:2d}: {word_count:5d} words | {title}")
