import json

with open('frontend/public/api/modules-sql.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for m in data:
    for n in m.get('notes', []):
        if n['part'] in [44, 45]:
            print(f"Part {n['part']}: {n['title']}")
