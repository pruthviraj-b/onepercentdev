import json

with open('frontend/public/api/modules-sql.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for m in data:
    for n in m.get('notes', []):
        if n['part'] in [43, 44, 45, 46]:
            print(f"Part {n['part']}: {json.dumps(n, ensure_ascii=False, indent=2)}")
