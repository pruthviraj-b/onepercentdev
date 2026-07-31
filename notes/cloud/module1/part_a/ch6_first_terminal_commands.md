# Module 1 — Part A: Computing Foundations
## Chapter 6: Hands-On: Your First Terminal Commands
### (Navigation, Files, Permissions)

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part A] — Chapter 6: Hands-On Terminal Commands
Estimated time:   20 minutes theory + 45 minutes hands-on lab = 65 minutes
Prerequisites:    Chapter 5: Introduction to the Command Line
```

**Learning Objectives:**
- Navigate the Linux/macOS file system using `cd`, `ls`, `pwd`, and `find`
- Create, read, move, copy, and delete files and directories from the terminal
- Read and modify file permissions using `chmod` and `chown`
- Read and search file contents using `cat`, `less`, `grep`, and `tail`

**Chapter bridge:** This chapter is the pure hands-on companion to Chapter 5's theory. It closes Part A (Computing Foundations) and directly launches Part B (Networking Essentials) — where you'll apply these same terminal skills to run network diagnostic commands like `ping`, `traceroute`, and `nslookup`.

---

## SECTION 2 — SPARK

There are roughly 200 commands built into a standard Linux system. Memorizing all of them is useless. Using 20 of them fluently will make you more effective than 90% of people who've "learned Linux." The question isn't how many commands you know — it's whether the commands you know feel like natural extensions of your hands, or whether you have to look them up every time.

Professional terminal fluency isn't about memorization. It's about building a mental model of the file system as a space you navigate, files as objects you manipulate, and permissions as a security boundary you control. When those abstractions feel physical and intuitive — when you *reach* for `grep` the way you reach for a word in a conversation — you've crossed the line from user to engineer. This chapter is where that begins.

---

## SECTION 3 — WHY THIS MATTERS

Cloud servers are managed exclusively through the command line. Every time you provision an EC2 instance and SSH in, your first actions will be navigation, file inspection, configuration editing, and permission management — exactly what this chapter teaches. These commands are also the building blocks of every bash script in Module 4, every Dockerfile in Part D, and every Ansible task in Module 4, Part D. You cannot automate what you cannot first do manually.

---

## SECTION 4 — CORE THEORY (COMMAND REFERENCE)

---

### 1. Navigation Commands — Moving Through the File System

The Linux file system is a tree. You are always "in" exactly one directory (the **working directory**). Navigation commands change your position in this tree.

| Command | What it does | Example |
|---------|-------------|---------|
| `pwd` | Print working directory — show where you are | `pwd` → `/home/ubuntu` |
| `ls` | List contents of current directory | `ls -la` |
| `cd` | Change directory | `cd /etc` |
| `cd ..` | Go up one level | `cd ..` |
| `cd ~` | Go to your home directory | `cd ~` |
| `cd -` | Go back to previous directory | `cd -` |

**`ls` flags you'll use constantly:**
- `ls -l` — long format (permissions, owner, size, date)
- `ls -a` — show hidden files (files starting with `.`)
- `ls -la` — both combined (the most common form)
- `ls -lh` — human-readable file sizes (KB, MB, GB)
- `ls -lt` — sort by modification time (newest first)

**Understanding `ls -la` output:**
```
drwxr-xr-x  5 ubuntu ubuntu  4096 Jun 27 10:00 Documents
-rw-r--r--  1 ubuntu ubuntu  1234 Jun 27 09:30 notes.txt
```
- Column 1: Type + permissions (`d`=dir, `-`=file) + owner/group/world perms
- Column 2: Hard link count
- Column 3: Owner username
- Column 4: Group name
- Column 5: Size in bytes (use `-h` for human readable)
- Column 6-8: Last modified date/time
- Column 9: Name

---

### 2. File and Directory Operations — Create, Move, Copy, Delete

| Command | What it does | Example |
|---------|-------------|---------|
| `touch filename` | Create empty file / update timestamp | `touch README.md` |
| `mkdir dirname` | Create directory | `mkdir projects` |
| `mkdir -p a/b/c` | Create nested directories | `mkdir -p src/components/ui` |
| `cp src dst` | Copy file | `cp notes.txt backup.txt` |
| `cp -r src/ dst/` | Copy directory recursively | `cp -r projects/ projects_backup/` |
| `mv src dst` | Move or rename | `mv oldname.txt newname.txt` |
| `rm filename` | Delete file (permanent, no trash) | `rm temp.log` |
| `rm -rf dirname` | Delete directory recursively (DANGER) | `rm -rf /tmp/old_build` |

**Critical: `rm` is permanent.** There is no trash bin. No undo. The GitLab incident from Chapter 4 happened with `rm -rf`. Always double-check the path before pressing Enter. A common safety habit: run `ls` on the path first to confirm what you're about to delete.

---

### 3. Reading File Contents — The Right Tool for the Right Job

| Command | When to use it |
|---------|---------------|
| `cat file` | Print entire file to screen (good for small files) |
| `less file` | Page through large files (press `q` to quit, `/` to search) |
| `head -n 20 file` | Show first 20 lines |
| `tail -n 20 file` | Show last 20 lines |
| `tail -f file` | Follow a file in real time (log monitoring) |
| `grep "pattern" file` | Search for lines containing "pattern" |
| `grep -r "pattern" dir/` | Search recursively through directory |
| `wc -l file` | Count lines in file |

**`tail -f` is indispensable for live log monitoring:**
```bash
tail -f /var/log/nginx/error.log
```
This stays open and prints new lines as they're appended — every cloud engineer uses this during deployments.

---

### 4. File Permissions — chmod and chown

From Chapter 3, permissions are `rwx` per owner/group/world. `chmod` changes permissions; `chown` changes owner.

**Numeric permission notation:**
```
r = 4, w = 2, x = 1
rwx = 7, rw- = 6, r-x = 5, r-- = 4, --- = 0
```

So `chmod 755 script.sh` means: owner=7(rwx), group=5(r-x), world=5(r-x)

```bash
# Make a script executable
chmod +x deploy.sh
chmod 755 deploy.sh    # equivalent

# Remove write permission from everyone
chmod a-w important_config.conf

# Only owner can read/write, nobody else
chmod 600 ~/.ssh/id_rsa   # REQUIRED for SSH keys

# Change owner to www-data (web server user)
sudo chown www-data:www-data /var/www/html/app.py
```

**SSH key permissions are critical:** `~/.ssh/id_rsa` (your private key) MUST be `chmod 600` — if it's world-readable, SSH refuses to use it and returns "Permissions too open" error.

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. What does `ls -la` show that plain `ls` does not?

2. You need to search all `.log` files in /var/log for the string 
   "FATAL ERROR". What single command would you use?

3. Why does SSH refuse to use a private key file with permissions 
   set to 644 instead of 600?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Build a Project Directory Structure and Manage It
Platform:         Linux, macOS, or Windows with WSL/Git Bash
Tools needed:     Terminal only
Estimated time:   45 minutes
What you'll demonstrate: You can navigate, create, modify, inspect, 
                  and permission-control files entirely from the 
                  terminal — the core daily skill of cloud engineers.
```

**EXERCISE A: Navigation**

```bash
# 1. See where you are
pwd

# 2. Go to your home directory
cd ~

# 3. List all files including hidden
ls -la

# 4. Check what hidden files exist (dotfiles are config files)
ls -la | grep "^\."
```

---

**EXERCISE B: Build a project structure**

```bash
# Create a project directory
mkdir -p ~/dev-academy/module1/labs

# Verify it was created
ls -la ~/dev-academy/

# Create some files
touch ~/dev-academy/module1/labs/lab1.sh
touch ~/dev-academy/module1/labs/notes.txt
touch ~/dev-academy/module1/README.md

# Navigate into it
cd ~/dev-academy

# See the full tree
find . -type f
```

You should see:
```
./README.md
./module1/labs/lab1.sh
./module1/labs/notes.txt
```

---

**EXERCISE C: Write to and read from files**

```bash
# Write content to a file
echo "# My Cloud Learning Journey" > ~/dev-academy/README.md
echo "Started: $(date)" >> ~/dev-academy/README.md

# Read it back
cat ~/dev-academy/README.md

# Add multiple lines using heredoc
cat >> ~/dev-academy/README.md << 'EOF'

## Modules
- Module 1: IT & Cloud Fundamentals
- Module 2: Cloud Platform Selection
EOF

# View the full file
cat ~/dev-academy/README.md

# Count the lines
wc -l ~/dev-academy/README.md
```

---

**EXERCISE D: Search file contents**

```bash
# Write some content to search
cat > ~/dev-academy/module1/labs/notes.txt << 'EOF'
Chapter 1: CPU, RAM, Storage
Chapter 2: Binary and Bytes
Chapter 3: Operating Systems
Key insight: Linux runs 96% of cloud servers
Key insight: chmod 600 for SSH keys
EOF

# Search for lines containing "Key insight"
grep "Key insight" ~/dev-academy/module1/labs/notes.txt

# Case-insensitive search
grep -i "chapter" ~/dev-academy/module1/labs/notes.txt

# Show line numbers
grep -n "Linux" ~/dev-academy/module1/labs/notes.txt
```

---

**EXERCISE E: File permissions**

```bash
# Make lab1.sh executable
chmod +x ~/dev-academy/module1/labs/lab1.sh

# Verify the change
ls -la ~/dev-academy/module1/labs/

# The x bit should appear in the permissions
# -rwxr-xr-x for chmod 755
# -rw-r--r-- before

# Set strict permissions on notes (only you can read/write)
chmod 600 ~/dev-academy/module1/labs/notes.txt

# Verify
ls -la ~/dev-academy/module1/labs/notes.txt
# Should show: -rw-------
```

---

**EXERCISE F: Find files**

```bash
# Find all .md files under your home directory
find ~/dev-academy -name "*.md"

# Find all files modified in the last 1 minute
find ~/dev-academy -mmin -1

# Find files larger than 1KB
find ~/dev-academy -size +1k
```

---

**EXERCISE G: Move and copy**

```bash
# Copy notes.txt to a backup
cp ~/dev-academy/module1/labs/notes.txt ~/dev-academy/module1/labs/notes.backup.txt

# Rename it
mv ~/dev-academy/module1/labs/notes.backup.txt ~/dev-academy/module1/labs/notes_v1.txt

# Verify
ls -la ~/dev-academy/module1/labs/
```

---

**EXERCISE H: Clean up (carefully)**

```bash
# ALWAYS verify before deleting
ls ~/dev-academy/module1/labs/

# Delete a specific file
rm ~/dev-academy/module1/labs/notes_v1.txt

# Verify deletion
ls ~/dev-academy/module1/labs/
```

---

**Windows Users — PowerShell equivalents:**

```powershell
# Navigation
Set-Location $HOME
Get-Location
Get-ChildItem -Force   # equivalent of ls -la

# Create structure
New-Item -ItemType Directory -Path "dev-academy/module1/labs" -Force
New-Item -ItemType File -Path "dev-academy/README.md"

# Write to file
"# My Cloud Journey" | Out-File dev-academy/README.md
Get-Date | Add-Content dev-academy/README.md

# Search
Select-String -Pattern "insight" -Path dev-academy/module1/labs/notes.txt

# Permissions (ACL)
Get-Acl dev-academy/README.md
```

---

**Common errors and fixes:**

- **"Permission denied"** when trying to write a file → the file is owned by another user or is read-only. Use `ls -la` to check permissions. Use `sudo` if you need elevated access.
- **"No such file or directory"** → check your path with `pwd` first. Use `ls` to verify the directory exists. Tab-complete paths to avoid typos.
- **`rm -rf` on wrong path** → there is no fix. Prevention: always run `ls` on the path first. Advanced: use `rm -i` (interactive, asks before each deletion).

```
Lab reflection:
You've just managed a file system entirely from text commands. 

Now think about this: in CI/CD pipelines (Module 6), every step 
runs these same commands — copying build artifacts, reading config 
files, setting permissions on scripts. When a pipeline fails with 
"Permission denied" on a deploy script, what is the first command 
you run to diagnose it, and what are you looking for in the output?

Write your answer in your notes. You'll validate it in Module 6, Chapter 13.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 6

1. What is the difference between `cp` and `mv`? What happens to 
   the source file in each case?

2. A file has permissions `-rw-r--r--`. Can the group members 
   execute this file? Can they write to it? Show the numeric 
   representation of these permissions.

3. A junior engineer accidentally ran `rm -rf /var/www/html` on 
   a production web server (not in a backup scenario). 
   What has happened to the files, and why can they likely not 
   be recovered by "undeleting" them?

4. You need to monitor a web server's error log in real time while 
   a deployment is happening. What exact command would you use, 
   assuming the log is at /var/log/nginx/error.log?

5. True/False: "The command `chmod 777 script.sh` is a good solution 
   when a script gives 'Permission denied' errors in production."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **`pwd`, `ls -la`, `cd` are your orientation commands.** You should always know exactly where you are in the file system. These three commands, used habitually, prevent the most common navigation mistakes.
- **`rm` is permanent — there is no undo.** Unlike GUI file deletion (which goes to Trash), `rm` immediately frees the inode and marks blocks available. Verify the path with `ls` before any deletion.
- **`chmod 600` for private files, `chmod 755` for scripts.** Private keys must be 600 — SSH enforces this. Scripts must be executable (`chmod +x`) to run directly. Wrong permissions are a top production deployment failure cause.
- **`grep`, `tail -f`, and `find` are your diagnostic triad.** Live log monitoring (`tail -f`), searching log content (`grep`), and finding files by name/size/date (`find`) — these three cover 80% of server investigation scenarios.
- **Real incidents trace back to these fundamentals.** The GitLab database deletion was `rm -rf` on the wrong path. SSH key permission failures block deployments. Wrong file ownership causes "Permission denied" in production.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** `cp` copies the file — source and destination both exist afterward. `mv` moves (or renames) — the source is removed, destination is created. If moving within the same file system, `mv` is near-instant (just updates the directory entry); if moving across file systems, it must copy then delete.

**Q2:** `-rw-r--r--` = owner: rw (6), group: r (4), world: r (4) = numeric `644`. Group members can READ the file (r permission) but cannot execute (no x) and cannot write (no w). Numeric: 644.

**Q3:** `rm -rf` removes directory entries for all files recursively and marks their blocks as free. The data physically remains on disk but the file system no longer tracks where it is. Recovery requires forensic tools that scan raw disk blocks for patterns — possible but unreliable, especially if the disk is active and new data is being written over the freed blocks. Production servers with active I/O make recovery increasingly unlikely every second after deletion.

**Q4:** `tail -f /var/log/nginx/error.log` — the `-f` flag follows the file, printing new lines as they appear. This is the standard real-time log monitoring command. For multiple files simultaneously: `tail -f /var/log/nginx/error.log /var/log/nginx/access.log`.

**Q5:** False — `chmod 777` gives read/write/execute to everyone including other users and processes on the system. In production, this is a security vulnerability: any user or compromised process can modify or execute the script. The correct fix is to identify *who* needs to run the script and give only that user/group the necessary permissions (`chmod 750` if the owner's group needs to run it, `chmod 700` if only the owner does). Blanket `777` is the lazy fix that creates security holes.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"60 Linux Commands you NEED to know" — NetworkChuck** — Comprehensive practical command reference with real demonstrations
- **"Linux Command Line Full Course" — freeCodeCamp (YouTube)** — 5-hour complete practical course, free
- **"Vim in 100 Seconds" — Fireship** — Essential: you'll need a terminal text editor for cloud servers. Vim is the universal option.

**📖 Articles**
- **"The Linux Command Line" — William Shotts (free online)** — The definitive free book on Linux CLI. Chapter 1-9 cover everything in this chapter at greater depth.
- **explainshell.com** — Paste any complex command and get each flag explained individually. Bookmark this.
- **tldr.sh** — Community-maintained simplified man pages with practical examples. Install: `npm install -g tldr`

**🔗 Practice**
- **OverTheWire: Bandit (levels 0-15)** — The best CLI practice game. Each level requires using the commands from this chapter. Highly recommended.
- **cmdchallenge.com** — Browser-based challenges requiring you to solve tasks with single shell commands. Excellent for building fluency.

---

*End of Module 1, Part A — Computing Foundations*
*Part A Complete: Chapters 1–6*
*Next: Part B — Networking Essentials (Chapters 7–13)*
