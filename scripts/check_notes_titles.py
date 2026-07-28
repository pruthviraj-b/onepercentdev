import json

for p in [44, 45]:
    with open(f'frontend/public/api/notes/sql/{p}.json', 'r', encoding='utf-8') as f:
        d = json.load(f)
    print(f"Part {p} title in notes JSON: {d['title']}")
