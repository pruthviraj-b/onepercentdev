import json

with open('frontend/public/api/modules-sql.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print all modules and their parts
for m in data:
    print(f"\nModule ID={m.get('id')}: {m.get('module')}")
    for n in m.get('notes', []):
        print(f"  Part {n['part']}: {n['title']}")
