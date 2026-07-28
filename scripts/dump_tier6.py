import json

with open('frontend/public/api/modules-sql.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print ALL titles for the Joins & Set Operations module
for m in data:
    if 'JOIN' in m.get('module', '') or 'SET' in m.get('module', '') or 'TIER 6' in m.get('module', '') or '1.5' in m.get('module', ''):
        print(f"\nModule: {m.get('module')}")
        for n in m.get('notes', []):
            print(f"  Part {n['part']}: {n['title']}")
