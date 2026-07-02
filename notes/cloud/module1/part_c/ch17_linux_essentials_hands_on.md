# Module 1 — Part C: Systems & Servers
## Chapter 17: Hands-On: Linux Essentials
### (Users, Permissions, Processes, Package Managers)

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part C] — Chapter 17: Linux Essentials Hands-On
Estimated time:   15 minutes theory + 50 minutes hands-on lab = 65 minutes
Prerequisites:    Chapter 16: Introduction to Linux for IT Professionals
```

**Learning Objectives:**
- Create and manage users and groups, configure SSH key authentication
- Manage file permissions with chmod and chown for real security scenarios
- Monitor and control processes with ps, kill, top, and htop
- Install, update, and remove packages with apt/dnf and configure cron jobs

**Chapter bridge:** This chapter converts Chapter 16's Linux theory into muscle memory. It's a pure lab chapter. It leads into Chapter 18 (Storage Systems) — where you'll apply Linux storage commands to manage physical disk resources on servers.

---

## SECTION 2 — SPARK

There's a specific moment that every cloud engineer remembers: the first time they SSH into a fresh Linux server with nothing on it and have to turn it into something. No UI. No installer wizard. Just a terminal prompt and everything to be built. It's equal parts terrifying and empowering. This chapter is about building the muscle memory to make that blank canvas feel like a familiar workspace, not a hostile environment.

The commands here aren't for memorization — they're for fluency. The goal is that when you need to add a deployment user at 2 AM during an incident, you do it correctly, quickly, and without hesitation. Hands don't know how to do that unless they've practiced.

---

## SECTION 3 — WHY THIS MATTERS

Every cloud deployment involves these exact operations: creating a service account user, setting SSH key authentication, managing file permissions for config files and secret keys, monitoring running processes to diagnose issues, and installing dependencies with a package manager. Ansible (Module 4) automates these operations but generates the same underlying commands. If you've never done them manually, Ansible playbooks are magic boxes you can't debug. If you've done them hundreds of times, reading an Ansible playbook is as natural as reading English.

---

## SECTION 4 — CORE THEORY (CONDENSED — LAB-FIRST CHAPTER)

---

### 1. SSH Key Authentication — The Professional Standard

Password-based SSH login is disabled in most production servers. SSH key authentication is the standard:

**How it works:**
1. You generate a key pair: **private key** (stays on your machine, never shared) and **public key** (placed on the server)
2. When you connect, SSH proves you have the private key without sending it over the network (cryptographic challenge-response)
3. Server grants access if the public key is in `~/.ssh/authorized_keys`

**Key commands:**
```bash
# Generate a key pair (RSA 4096-bit)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Saves to ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public)

# Copy public key to a server
ssh-copy-id user@server_ip

# Manual: append public key to server's authorized_keys
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Connect using key (no password)
ssh -i ~/.ssh/id_ed25519 ubuntu@server_ip
```

**Private key permissions must be 600:**
```bash
chmod 600 ~/.ssh/id_ed25519
```
SSH will refuse to use a private key with looser permissions. This is a security enforcement mechanism — world-readable private keys are as useful as a published house key.

---

### 2. Process Management

Every running program is a **process** with a PID (Process ID). Managing processes is a core server administration skill:

```bash
# List all processes
ps aux

# Find a specific process
ps aux | grep nginx

# Kill a process by PID
kill 1234           # Graceful (SIGTERM)
kill -9 1234        # Force kill (SIGKILL) — use only when needed

# Kill by name
pkill nginx         # Kill all processes named nginx
killall nginx

# Interactive process monitor
top                 # Built-in
htop                # Better — install with: sudo apt install htop

# Background processes
long_command &      # Run in background
jobs                # List background jobs
fg                  # Bring background job to foreground
nohup command &     # Run in background, immune to terminal close
```

---

## SECTION 5 — THEORY CHECKPOINT (SKIPPED — this is a lab-first chapter)

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Complete Linux Server Administration Practice
Platform:         Linux (Ubuntu recommended) or WSL on Windows
Tools needed:     Terminal only
Estimated time:   50 minutes
What you'll demonstrate: You can perform the complete set of Linux 
                  administration tasks needed to set up a production server.
```

---

### EXERCISE 1: User and SSH Management (15 min)

**Step 1: Create a service user (simulating a deploy user)**

```bash
# Create user without interactive password (like an automation user)
sudo adduser --disabled-password --gecos "" deployuser

# Verify user was created
id deployuser
cat /etc/passwd | grep deployuser
```

**Step 2: Set up SSH key for the deploy user**

```bash
# Switch to deployuser
sudo su - deployuser

# Create .ssh directory with correct permissions
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create authorized_keys file
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Add your public key (from your actual key if you have one)
# For this lab, generate a test key:
ssh-keygen -t ed25519 -f /tmp/test_key -N ""   # -N "" = no passphrase
cat /tmp/test_key.pub >> ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys

# Return to your normal user
exit
```

**Step 3: Add deployuser to specific groups**

```bash
# View current groups
sudo groups deployuser

# Add to docker group (would allow docker commands)
sudo usermod -aG docker deployuser 2>/dev/null || echo "Docker group doesn't exist on this system"

# Add to sudo group (for system-level access)
# WARNING: Be selective about sudo in production
sudo usermod -aG sudo deployuser

# Verify
sudo groups deployuser
```

---

### EXERCISE 2: File Permissions (10 min)

**Step 1: Set up a configuration file with proper permissions**

```bash
# Create a config file with a "secret"
sudo mkdir -p /etc/myapp
sudo bash -c 'echo "DB_PASSWORD=super_secret_123" > /etc/myapp/config.env'

# Set permissions: only root can read it
sudo chmod 600 /etc/myapp/config.env
sudo chown root:root /etc/myapp/config.env

# Verify nobody else can read it
ls -la /etc/myapp/config.env

# Try to read as normal user (should fail)
cat /etc/myapp/config.env   # Permission denied

# Root can read it
sudo cat /etc/myapp/config.env
```

**Step 2: Allow a specific user to read a config file**

```bash
# Create a group for app users
sudo groupadd appusers

# Add deployuser to this group
sudo usermod -aG appusers deployuser

# Change config file group ownership
sudo chown root:appusers /etc/myapp/config.env

# Set permissions: owner=rw, group=r, world=none
sudo chmod 640 /etc/myapp/config.env

# Verify: deployuser can now read (via group), world cannot
ls -la /etc/myapp/config.env
# Should show: -rw-r----- root appusers ...
```

**Step 3: Make a script executable**

```bash
# Create a deployment script
cat > /tmp/deploy.sh << 'EOF'
#!/bin/bash
echo "Deploying application..."
echo "Deployment complete at $(date)"
EOF

# Make it executable
chmod +x /tmp/deploy.sh

# Verify and run
ls -la /tmp/deploy.sh
/tmp/deploy.sh
```

---

### EXERCISE 3: Process Management (10 min)

**Step 1: Start a background process**

```bash
# Start a long-running process in background
sleep 300 &
echo "Background PID: $!"
SLEEP_PID=$!

# See it in process list
ps aux | grep sleep

# See your background jobs
jobs
```

**Step 2: Monitor processes**

```bash
# Find the sleep process
ps aux | grep "sleep 300" | grep -v grep

# Get just the PID
pgrep sleep

# See process tree
ps auxf | head -30

# Monitor CPU and memory
top -bn1 | head -20   # Single snapshot from top
```

**Step 3: Kill the process**

```bash
# Graceful kill
kill $SLEEP_PID
sleep 1

# Verify it's gone
ps aux | grep "sleep 300" | grep -v grep

# Start another, then force kill
sleep 300 &
SLEEP_PID=$!
kill -9 $SLEEP_PID
```

**Step 4: Run a process that survives terminal close**

```bash
# nohup runs the command immune to hangup signals
nohup sleep 1000 > /tmp/sleep.log 2>&1 &
echo "PID: $!"

# Even if you close this terminal and open a new one, it keeps running
# Find it:
ps aux | grep "sleep 1000"

# Clean up
pkill -f "sleep 1000"
```

---

### EXERCISE 4: Package Management (10 min)

**Ubuntu/Debian:**

```bash
# Update package list (always do this first)
sudo apt update

# Install multiple packages at once
sudo apt install -y curl wget tree git jq

# Verify installation
which curl
curl --version

# Search for a package
apt search "json processor" 2>/dev/null | grep "^jq" || apt-cache search json | grep "^jq"

# Show package information
apt show nginx 2>/dev/null | head -15

# Remove a package
sudo apt remove tree
which tree   # Should now fail

# Autoremove unneeded packages
sudo apt autoremove -y
```

**Step: View installed packages**

```bash
# List all installed packages
dpkg -l | head -20

# Check if a specific package is installed
dpkg -l | grep nginx
```

---

### EXERCISE 5: Cron Jobs — Scheduled Tasks (5 min)

```bash
# View your current crontab
crontab -l

# Edit crontab (opens in your default editor)
crontab -e

# Add this line (runs every minute for testing):
# * * * * * echo "Cron ran at $(date)" >> /tmp/cron_test.log

# Cron time format: minute hour day-of-month month day-of-week
# Examples:
# 0 * * * *     = every hour at :00
# 0 0 * * *     = every day at midnight
# */5 * * * *   = every 5 minutes
# 0 2 * * 0     = every Sunday at 2:00 AM (good for weekly backups)

# Wait 1-2 minutes, then check if cron ran:
cat /tmp/cron_test.log

# Remove the test cron job after verifying
crontab -e   # Delete the line you added
```

---

### EXERCISE 6: System Monitoring — The Production Checklist

```bash
# System uptime and load averages
uptime
# Load average: 1-minute, 5-minute, 15-minute averages
# Rule of thumb: load > number of CPU cores = system under pressure

# Memory usage
free -h

# Disk usage
df -h

# Top disk consumers in current directory
du -sh * | sort -hr | head -10

# Active network connections
ss -tuln   # What's listening
ss -tn state established | head -10  # Active connections

# Recent error logs
sudo journalctl -p err --since "1 hour ago"
sudo tail -50 /var/log/syslog | grep -i error
```

```
Lab reflection:
You've set up a deploy user with SSH key auth, configured file 
permissions for secrets, managed processes, installed packages, 
and set up cron jobs.

This is the setup checklist for every new production server. 

Here's the real question: you've just set all this up manually. 
If you need to set up 50 identical servers, doing this manually 
50 times is unacceptable. 

What would you need to "record" these steps in a reusable format?

Module 4, Chapter 17-21 answers this — Ansible playbooks are 
exactly that: a recorded, repeatable sequence of these exact 
Linux administration commands.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 17

1. What is the purpose of `chmod 600 ~/.ssh/id_rsa`, and what 
   happens if the permissions are set to 644 instead?

2. A web server process on your Linux server has stopped responding 
   but is still listed as running (zombie process). What command 
   sequence would you use to find its PID and force-terminate it?

3. You install a new version of your application and it works when 
   run manually, but after a server reboot it doesn't start. 
   What two commands would you run to make it start automatically 
   after reboot, and how do you verify it's configured correctly?

4. Your cron job is defined as: `0 2 * * 1 /opt/scripts/backup.sh`
   When exactly does this run? (Day of week: 0=Sunday, 1=Monday)

5. True/False: "Running `sudo apt upgrade` on a production server 
   during business hours is always safe and recommended."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **SSH key auth = private key on your machine + public key on server.** Private key must be `chmod 600`. Anyone with the private key can authenticate — treat it like a password.
- **Process management = ps (find) + kill (stop) + nohup (persist).** `ps aux | grep name` to find, `kill PID` to stop gracefully, `kill -9 PID` for force. Processes need `nohup` or a systemd service to survive terminal close.
- **Package management = apt update first, then install.** Never `apt install` without `apt update` first — you'll get stale package versions. `apt upgrade` applies all updates; `apt install <package>` adds new software.
- **Cron syntax = minute hour day-of-month month day-of-week.** `0 2 * * 0` = Sunday 2 AM. `/5` = every 5 units. Test with a 1-minute interval, verify, then set the real schedule.
- **These manual steps become Ansible tasks.** Every `adduser`, `chmod`, `systemctl enable`, `apt install` in this lab has a direct Ansible module equivalent. Understanding the manual operation is understanding what Ansible does — not a black box.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** `chmod 600` sets the SSH private key to owner-read/write only (no group or world access). This is required by SSH as a security measure. If permissions are 644 (world-readable), SSH client refuses to use the key and outputs "WARNING: UNPROTECTED PRIVATE KEY FILE!" with "Permissions are too open." This prevents stolen private keys from being usable by world-readable file inspection.

**Q2:** `ps aux | grep [process-name]` or `pgrep [name]` to find PID. Then `kill -9 [PID]` to force-terminate. For zombies specifically, you may need to kill the parent process: `ps -ef | grep defunct` to find zombie PIDs, then `ps -ef | grep [zombie-pid]` to find parent PID (PPID column), then `kill [parent-pid]`.

**Q3:** `sudo systemctl enable myapp` — creates symlink to start on boot. `sudo systemctl start myapp` — starts it for current session. Verify: `sudo systemctl status myapp` should show "enabled" in the "Loaded" line and "active (running)" in the "Active" line. Also: `sudo systemctl is-enabled myapp` returns "enabled" if configured correctly.

**Q4:** `0 2 * * 1` = At minute 0 of hour 2 (2:00 AM), on any day of month, any month, on day-of-week 1 (Monday). So: **every Monday at 2:00 AM**.

**Q5:** False — with important nuance. `apt upgrade` can update packages that include breaking changes, configuration changes requiring manual review, or require service restarts that cause brief downtime. Running it during business hours without testing on a staging environment first risks production incidents. Best practice: (1) test updates on staging, (2) schedule production updates during maintenance windows (low-traffic periods), (3) use `apt-get --simulate upgrade` first to preview changes, (4) have a rollback plan. Automated security-only updates (via `unattended-upgrades`) are safer because they're scoped to security patches only.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"Linux Process Management" — NixiePixel** — Comprehensive ps, kill, jobs tutorial
- **"Linux Cron Jobs" — NetworkChuck** — Best practical cron job guide on YouTube with examples
- **"SSH Key Authentication" — TechWorld with Nana** — Clear walkthrough of key generation and server configuration

**📖 Articles**
- **"SSH Key Authentication" — DigitalOcean** — Most comprehensive SSH setup guide available
- **"Understanding Cron" — Oracle Linux documentation** — Thorough cron reference with examples
- **"Linux Process Management" — Red Hat** — Enterprise-grade process management reference

**🔗 Practice**
- **Play with Docker (labs.play-with-docker.com)** — Free Linux terminal in browser — perfect for practicing these commands without affecting your machine
- **Linux Survival (linuxsurvival.com)** — Interactive browser-based Linux command practice with immediate feedback
