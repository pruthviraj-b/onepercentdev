import json

with open('frontend/public/api/modules-sql.json', 'r', encoding='utf-8') as f:
    raw = f.read()
    data = json.loads(raw)

# Find the raw chunk around parts 44 and 45
# Print raw JSON for module 6
for m in data:
    if m.get('id') == 6:
        print(json.dumps(m, indent=2, ensure_ascii=False))
        break
