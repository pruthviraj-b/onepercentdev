import os
import re
import subprocess

parts = [4, 5, 6, 7, 8, 13, 14]
base_dir = r"f:\onepercentdev-main\content\cloud"

for part in parts:
    file_path = os.path.join(base_dir, f"Part-{part}", "notes.md")
    if not os.path.exists(file_path):
        continue
    
    # Get original content
    try:
        orig = subprocess.check_output(
            ["git", "show", f"HEAD:content/cloud/Part-{part}/notes.md"],
            cwd=r"f:\onepercentdev-main"
        ).decode("utf-8")
    except Exception as e:
        print(f"Error reading git for Part {part}: {e}")
        continue
    
    # Extract original H1
    h1_match = re.search(r'^#\s+(.+)', orig, re.MULTILINE)
    orig_h1 = h1_match.group(1).strip() if h1_match else f"Part {part}"
    
    # Extract original first chapter number
    ch_match = re.search(r'^## Chapter\s+(\d+):', orig, re.MULTILINE)
    start_ch = int(ch_match.group(1)) if ch_match else 1
    
    # Read current generated content
    with open(file_path, "r", encoding="utf-8") as f:
        curr = f.read()
    
    # Fix H1
    curr = re.sub(r'^#\s+.*', f"# {orig_h1}", curr, count=1, flags=re.MULTILINE)
    
    # Remove [SECTION X]
    curr = re.sub(r'\[SECTION \d+\]\s*', '', curr)
    
    # Remove **Chapter:** lines
    curr = re.sub(r'^\*\*Chapter:\*\*.*\n?', '', curr, flags=re.MULTILINE)
    
    # Renumber chapters
    def ch_replacer(match):
        ch_replacer.counter += 1
        return f"## Chapter {ch_replacer.counter}: {match.group(1)}"
    ch_replacer.counter = start_ch - 1
    
    curr = re.sub(r'^## Chapter \d+[:—\-\s]*(.+)$', ch_replacer, curr, flags=re.MULTILINE)
    
    # Save
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(curr)
    
    print(f"Fixed Part-{part}. Original H1: {orig_h1}. Started Chapters at: {start_ch}")
