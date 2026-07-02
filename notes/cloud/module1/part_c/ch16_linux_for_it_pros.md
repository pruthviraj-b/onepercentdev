# Module 1 — Part C: Systems & Servers
## Chapter 16: Introduction to Linux for IT Professionals

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part C] — Chapter 16: Linux for IT Professionals
Estimated time:   40 minutes theory + 20 minutes hands-on lab = 60 minutes
Prerequisites:    Chapter 15: What Is a Server, Really?
```

**Learning Objectives:**
- Explain the Linux ecosystem: distributions, package managers, and the relationship between the kernel and userland
- Navigate the Linux directory structure and understand the purpose of each major directory
- Manage users, groups, and basic system configuration on Linux
- Connect Linux knowledge to cloud server administration

**Chapter bridge:** This chapter provides the Linux conceptual foundation for Chapter 17 (Hands-On: Linux Essentials), which is the pure practical application of this chapter's theory. Together, Chapters 16 and 17 are the Linux foundation that every subsequent module builds on.

---

## SECTION 2 — SPARK

In 1991, Linus Torvalds was a 21-year-old Finnish computer science student who was frustrated that the Unix-like operating systems of the time were either expensive (proprietary Unix) or limited (MINIX, which couldn't be used commercially due to licensing). He started writing an operating system kernel "just for fun" and posted a famous message to a newsgroup:

*"I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu)..."*

Thirty-three years later, that hobby project runs 96% of the world's web servers, all 500 of the world's top 500 supercomputers, Android (the world's most-used OS by device count), and the entire cloud computing infrastructure of AWS, Azure, and GCP. The largest companies in the world depend on code that started as a student's "hobby." Linux is arguably the most consequential open-source project in history — and you're about to learn to use it professionally.

---

## SECTION 3 — WHY THIS MATTERS

Every cloud server you'll ever manage runs Linux. Every Docker container runs Linux. Every CI/CD pipeline runs on Linux. Every Kubernetes cluster runs on Linux. When you SSH into an AWS EC2 instance, you're managing Linux. When you write a bash script in GitHub Actions, it runs on Linux. When you configure an Nginx web server or a PostgreSQL database in production, it's on Linux. Linux isn't one option among many — it's the operating environment of cloud computing, and professional fluency in it is non-negotiable for every role in this course's target career path.

---

## SECTION 4 — CORE THEORY

---

### 1. The Linux Ecosystem — Kernel, Distributions, and Package Managers

**The Linux kernel** is what Linus Torvalds wrote — the core OS component that manages hardware, processes, memory, and file systems. The kernel is the same (or similar) across all Linux systems.

**A Linux distribution (distro)** bundles the kernel with: a package manager, default desktop environment (for desktop distros), system utilities, default applications, and configuration. Distributions make Linux usable as a complete OS.

**Major distributions and their use cases:**

| Distribution | Package Manager | Used For |
|-------------|----------------|---------|
| **Ubuntu** | `apt` | Most popular for cloud servers, developer desktops |
| **Amazon Linux 2/2023** | `yum`/`dnf` | AWS EC2 default, AWS-optimized |
| **RHEL / CentOS Stream** | `dnf` | Enterprise production, stability-focused |
| **Debian** | `apt` | Stable foundation for servers; Ubuntu is based on Debian |
| **Alpine Linux** | `apk` | Minimal, used in Docker containers (5MB base image!) |
| **Arch Linux** | `pacman` | Bleeding-edge, developer/enthusiast desktops |

**Package managers** handle software installation, updates, and dependency resolution:

```bash
# Ubuntu/Debian (apt)
sudo apt update           # Refresh package list
sudo apt install nginx    # Install nginx
sudo apt upgrade          # Upgrade all packages
sudo apt remove nginx     # Remove nginx

# RHEL/CentOS/Amazon Linux (dnf/yum)
sudo dnf update
sudo dnf install nginx
sudo dnf remove nginx

# Alpine (apk — used in Docker)
apk add curl
apk del curl
```

**The magic of package managers:** Before them, installing software meant downloading source code, resolving dependencies manually, compiling, and installing. Package managers handle all of this — they know which version of which dependency is needed and install everything automatically. This is why Linux servers can be fully configured with a handful of `apt install` commands in an Ansible playbook.

> **Real example: Equifax Breach, September 2017.** Attackers exploited a known vulnerability in Apache Struts (CVE-2017-5638) — a Java framework used in Equifax's web application. A patch for this vulnerability had been released 2 months earlier. Equifax hadn't applied it. The breach exposed the personal data of 147 million Americans. The failure? Patch management — keeping software updated. On Linux servers, `apt upgrade` or `dnf update` handles this automatically if configured. Organizations that automate patch management via package managers and configuration management tools (Chapter 18 of Module 4) dramatically reduce this attack surface. Manual update processes create exactly the kind of drift that cost Equifax $700 million in settlements.

---

### 2. The Linux Directory Tree — Every Directory Has a Purpose

Linux has one unified directory tree starting at `/` (root). Everything — all disks, all devices, all files — appears under this tree. There are no "drive letters" (no `C:\`).

| Directory | Contents | Professional Context |
|-----------|---------|---------------------|
| `/` | Root of everything | The top of the tree |
| `/bin` | Essential system binaries | `ls`, `cp`, `bash` — needed even in recovery mode |
| `/etc` | System configuration files | Nginx config, SSH config, network config, cron jobs |
| `/var` | Variable data (changes at runtime) | Log files (`/var/log`), web root for Apache, databases |
| `/tmp` | Temporary files | Cleared on reboot; don't store important data here |
| `/home` | User home directories | `/home/ubuntu`, `/home/deploy` |
| `/root` | Root user's home | Not in `/home` — root is special |
| `/usr` | User programs and data | `/usr/bin` for user commands, `/usr/lib` for libraries |
| `/opt` | Optional/third-party software | Often where manually installed apps go |
| `/proc` | Virtual filesystem — OS state | `/proc/cpuinfo`, `/proc/meminfo` — live system data |
| `/sys` | Virtual filesystem — hardware | Device and driver information |
| `/dev` | Device files | `/dev/sda` = first disk, `/dev/null` = trash |
| `/mnt` | Mount points | Where you mount external drives, NFS shares |
| `/srv` | Service data | Web server files, FTP data |

**The three most important directories for cloud work:**

`/etc` — every config file lives here. Nginx: `/etc/nginx/nginx.conf`. SSH: `/etc/ssh/sshd_config`. Cron: `/etc/crontab`. Hosts file: `/etc/hosts`. Package sources: `/etc/apt/sources.list`. If you're configuring a service, look in `/etc` first.

`/var/log` — every log file lives here. System: `/var/log/syslog`. Nginx: `/var/log/nginx/access.log`. Auth: `/var/log/auth.log`. When something goes wrong, logs in `/var/log` tell you what happened.

`/home/<username>` — each user's home. SSH keys: `~/.ssh/authorized_keys`. Bash config: `~/.bashrc`. Application config: `~/.config/`. Never put app data here for servers — use `/opt` or `/var`.

---

### 3. Systemd — The Init System That Manages Everything

**systemd** is the init system used by most modern Linux distributions. It's the first process started by the kernel (PID 1) and is responsible for starting and managing all other system services.

**Key systemd commands:**

```bash
# Service management
sudo systemctl start nginx      # Start a service
sudo systemctl stop nginx       # Stop a service
sudo systemctl restart nginx    # Restart a service
sudo systemctl reload nginx     # Reload config without restart
sudo systemctl enable nginx     # Start automatically at boot
sudo systemctl disable nginx    # Don't start at boot
sudo systemctl status nginx     # Check if running, show recent logs

# System information
systemctl list-units --type=service    # All running services
journalctl -u nginx                     # Logs for nginx service
journalctl -f                           # Follow all system logs (like tail -f)
journalctl --since "10 minutes ago"    # Recent logs
```

**`systemctl status <service>`** is the first command you run when a service is misbehaving. It shows: is it running, has it crashed, what did it log recently, when did it last restart. This is the production server equivalent of "have you tried turning it off and on again" — but with actual diagnostic information.

---

### 4. Linux User and Group Management

```bash
# View current user and groups
whoami
id
groups

# Add a user
sudo adduser deployuser

# Add user to a group
sudo usermod -aG sudo deployuser   # Grant sudo (admin) access
sudo usermod -aG www-data deployuser  # Grant web server group access

# Switch to another user
su - deployuser
sudo su - deployuser

# View all users
cat /etc/passwd | cut -d: -f1

# View all groups
cat /etc/group
```

**The `sudo` mechanism:** Regular users can't modify system configuration, restart services, or install packages — those require root. `sudo` (Super User Do) allows authorized users to run specific commands as root without becoming root. Who can use sudo: defined in `/etc/sudoers`. Best practice: create a deployment user with only the specific sudo permissions they need, not blanket `ALL=(ALL) NOPASSWD:ALL`.

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. What is the difference between a Linux kernel and a Linux 
   distribution? What does a distribution add on top of the kernel?

2. A service on your Linux server is not starting. What is the 
   first command you run and what are you looking for in the output?

3. In the Equifax breach, an unpatched Apache Struts vulnerability 
   was exploited. Which Linux package manager feature, if used 
   properly, would have prevented this specific attack?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Linux System Exploration
Platform:         Linux, macOS (with adaptations), WSL on Windows
Tools needed:     Terminal only
Estimated time:   20 minutes
What you'll demonstrate: You can navigate the Linux system structure 
                  and manage services — the baseline skill for 
                  managing any cloud server.
```

**Step 1: Explore the directory tree**

```bash
# The top-level structure
ls -la /

# Configuration files
ls /etc/ | head -20

# Log files
ls -la /var/log/ | head -10

# Your home directory structure
ls -la ~
ls -la ~/.ssh 2>/dev/null || echo "No .ssh directory yet"
```

**Step 2: Find system information in /proc**

```bash
# CPU info (the virtual file — no actual file on disk)
cat /proc/cpuinfo | grep "model name" | head -1

# Memory info
cat /proc/meminfo | head -5

# Running processes
cat /proc/uptime    # Seconds since boot
uptime              # Human-readable uptime
```

**Step 3: Manage a service (install and control Nginx)**

**Ubuntu/Debian:**
```bash
# Install nginx (web server)
sudo apt update && sudo apt install nginx -y

# Check status
sudo systemctl status nginx

# Start it (might already be running)
sudo systemctl start nginx

# Verify it's serving web traffic
curl http://localhost
# Should return nginx welcome HTML

# Check its config location
cat /etc/nginx/nginx.conf | head -30

# Check nginx's log
sudo tail -20 /var/log/nginx/access.log
```

**macOS adaptation:**
```bash
brew install nginx
brew services start nginx
curl http://localhost:8080
```

**Step 4: User and group exploration**

```bash
# Who am I?
id

# What groups am I in?
groups

# List system users (system accounts have UID < 1000)
awk -F: '$3 < 1000 {print $1, $3}' /etc/passwd

# List real users (UID >= 1000)
awk -F: '$3 >= 1000 {print $1, $3}' /etc/passwd
```

**Step 5: View and follow system logs**

```bash
# View recent system events
sudo journalctl -n 50

# Follow live (Ctrl+C to stop)
sudo journalctl -f

# Filter by service
sudo journalctl -u nginx --no-pager | tail -20

# Filter by time
sudo journalctl --since "5 minutes ago"
```

```
Lab reflection:
You've installed a web server, managed it with systemctl, and 
read its logs. This is exactly the workflow you use every time 
you deploy a service on a cloud server.

Here's the production scenario to think about: you deploy a new 
version of your application to a Linux server. The process starts 
but immediately stops. `systemctl status myapp` shows it's 
"Active: failed." 

What's your next command, and where do you look for the error 
that's causing the crash?
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 16

1. What is the purpose of the /etc directory in Linux? 
   Name three specific configuration files you would find there 
   for common services.

2. You notice a web server is running on a production Linux box 
   but stops after every server reboot. What systemctl command 
   is missing from the setup process?

3. The 2017 Equifax breach exploited an unpatched Apache Struts 
   vulnerability patched 2 months earlier. What specific automation 
   practice would reliably prevent this category of breach?

4. You run `sudo systemctl status myapp` and see:
   "Active: failed (Result: exit-code)"
   What is your next diagnostic step and which command do you use?

5. True/False: "Ubuntu and Red Hat Enterprise Linux (RHEL) run 
   the same applications without modification because they both 
   use the Linux kernel."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **Linux = kernel + distribution.** The kernel (Torvalds' code) is the core; distributions (Ubuntu, Amazon Linux, RHEL) bundle it with package managers, tools, and defaults. Choose distro based on use case and support model.
- **`/etc` = config, `/var/log` = logs, `/home` = users, `/proc` = live system state.** These four directories solve 90% of "where is X on Linux?" questions on any server.
- **systemd is the modern init system — `systemctl` is how you manage services.** `status`, `start`, `stop`, `enable` (persist across reboots) are the four most-used operations. `journalctl` is how you read service logs.
- **Package managers are the patch management solution.** `apt upgrade`, `dnf update` — keeping these running on a schedule eliminates the largest category of production vulnerabilities. Unpatched software is the #1 enterprise breach vector.
- **Real incidents (Equifax 2017) trace to these fundamentals** — not sophisticated zero-days, just unpatched known vulnerabilities on Linux servers that package management automation would have caught.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** `/etc` contains system-wide configuration files for all installed services. Examples: `/etc/nginx/nginx.conf` (Nginx web server config), `/etc/ssh/sshd_config` (SSH server config), `/etc/hosts` (local DNS overrides), `/etc/crontab` (scheduled tasks), `/etc/apt/sources.list` (package repository sources), `/etc/passwd` (user accounts), `/etc/sudoers` (sudo permissions).

**Q2:** `sudo systemctl enable nginx` (or the application's service name). `systemctl start` starts it for the current session only. `systemctl enable` creates a symlink so systemd automatically starts the service on boot. Both commands are needed: enable for automatic starts, start for the current session.

**Q3:** Automated patch management — specifically: (1) configure automatic security updates (`unattended-upgrades` on Ubuntu, `dnf-automatic` on RHEL), (2) set up a monitoring/vulnerability scanning system (AWS Inspector, Qualys, Nessus) that alerts on known CVEs in installed packages, (3) implement a patch management process with defined SLAs (e.g., critical CVEs patched within 24-48 hours). The Equifax vulnerability was publicly known for 2 months before exploitation — automated scanning would have flagged it within days.

**Q4:** Next step: view the detailed logs with `sudo journalctl -u myapp --no-pager`. This shows the full stdout/stderr from the service's last attempt to run, including any error messages the application produced before exiting. The exit code in the status output tells you the process exited with an error; the logs tell you what the error actually was.

**Q5:** False — with important nuance. Both use the Linux kernel (so kernel system calls are compatible), but: (1) package managers differ (`apt` vs `dnf`/`rpm`) — packages and their names differ between distributions. A `.deb` package for Ubuntu won't install on RHEL. (2) Default tools and init systems may differ. (3) Library versions and paths differ. (4) Security policies (SELinux on RHEL, AppArmor on Ubuntu) behave differently. Applications compiled from source and using only standard system calls are portable. Pre-compiled binaries (.deb, .rpm) are distribution-specific. Docker containers solve this portability problem — the container brings its own Linux environment.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"Linux in 100 Seconds" — Fireship** — Essential quick overview
- **"The Linux File System Explained" — DorianDotSlash** — Clear walkthrough of directory structure
- **"systemd Explained" — Chris Titus Tech** — Comprehensive systemd/systemctl guide for beginners

**📖 Articles**
- **"Understanding the Linux File System Hierarchy" — Red Hat** — Authoritative reference for directory purposes
- **"How package managers work" — Russ Cox** — Deep dive into dependency resolution in package managers
- **DigitalOcean: "An Introduction to systemd"** — Practical guide to service management

**🔗 Practice**
- **Linux Journey (linuxjourney.com)** — Interactive learning platform covering all Linux fundamentals in browser exercises
- **OverTheWire: Bandit** — Continue levels 15-25 which require user management and service interaction knowledge
