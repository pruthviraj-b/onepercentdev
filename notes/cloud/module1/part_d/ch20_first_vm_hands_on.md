# Module 1 — Part D: Virtualization — The Bridge to Cloud
## Chapter 20: Hands-On: Creating Your First VM

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part D] — Chapter 20: Creating Your First VM
Estimated time:   10 minutes theory + 60 minutes hands-on = 70 minutes
Prerequisites:    Chapter 19: What Is Virtualization?
```

**Learning Objectives:**
- Provision a cloud VM (AWS EC2 or equivalent) from scratch
- Configure security groups, SSH key pairs, and storage at launch time
- Connect to the VM via SSH and perform basic administration
- Understand the relationship between VM configuration choices and cost

**Chapter bridge:** This chapter is the practical application of Chapter 19's virtualization theory. It leads into Chapter 21 (Containers vs VMs) which builds on hands-on VM experience to explain why containers emerged as an alternative — the contrast only makes sense once you've felt the weight of a full VM.

---

## SECTION 2 — SPARK

Before cloud computing, provisioning a server took weeks: submitting a purchase order, waiting for hardware delivery, racking and cabling it, installing the OS, configuring networking. In 2006, AWS changed this to 90 seconds. Today, launching an EC2 instance takes about 60 seconds. For a Terraform script that creates 50 instances: about the same 60-90 seconds, because they launch in parallel.

This lab is your first experience of that transformation. You'll go from zero to a running Linux server, accessible from anywhere in the world, in under 5 minutes. That speed isn't magic — it's virtualization. And having done this manually first, every time you use Terraform or Ansible to do it automatically, you'll know exactly what's happening underneath.

---

## SECTION 3 — WHY THIS MATTERS

This lab is the practical entry point to every cloud module that follows. Module 2 compares AWS/Azure/GCP by having you provision VMs in each. Module 5 (Terraform) automates exactly this process. Module 6 (DevOps) deploys applications to VMs provisioned this way. Engineers who've never manually provisioned a VM can follow Terraform tutorials but can't debug them when they fail — because they don't know what correct output looks like. Do this manually first; automate it later.

---

## SECTION 4 — CORE THEORY (CONDENSED — LAB-FIRST CHAPTER)

---

### Key Concepts Before the Lab

**AMI (Amazon Machine Image):** A snapshot of an OS image used to launch EC2 instances. AWS provides official AMIs (Amazon Linux, Ubuntu, Windows). An AMI specifies: OS, pre-installed software, disk layout. Think of it as the VM template.

**Key Pair:** An SSH public/private key pair. You store the private key; AWS puts the public key on the instance. Required to SSH in. There's no password — only key authentication.

**Security Group:** The instance-level firewall. Default: allow no inbound traffic (except what you specify), allow all outbound.

**Instance Type:** The VM's resource allocation (vCPUs, RAM). `t3.micro` = 2 vCPU, 1GB RAM. Free tier eligible.

**EBS Root Volume:** The instance's boot disk. Size, type (gp3 SSD, etc.), and whether it's deleted on termination — all configured at launch.

---

## SECTION 5 — THEORY CHECKPOINT (Skipped — this is a lab chapter)

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Provision and Access Your First Cloud VM
Platform:         AWS Free Tier Account (required)
Tools needed:     AWS Console, SSH client (terminal on Linux/macOS, 
                  Windows Terminal with OpenSSH or PuTTY)
Estimated time:   60 minutes
What you'll build: A running Ubuntu Linux server on AWS EC2, 
                  accessible via SSH, with a web server running.
```

---

### PHASE 1: AWS Account Setup (if needed, 10 minutes)

1. Go to aws.amazon.com → Create Account
2. Provide email, password, account name
3. Enter credit card (won't be charged for free tier usage)
4. Complete phone verification
5. Choose **Basic (Free) Support**
6. Sign in to the AWS Console: console.aws.amazon.com

**CRITICAL:** Set up billing alerts immediately:
- Go to Billing → Budgets → Create Budget
- Set $10/month alert
- This prevents surprise charges

---

### PHASE 2: Create an SSH Key Pair (5 minutes)

**Option A: Create key in AWS Console:**
1. EC2 → Key Pairs → Create Key Pair
2. Name: `my-first-key`
3. Key pair type: **ED25519**
4. Private key format: **.pem** (Linux/macOS) or **.ppk** (PuTTY/Windows)
5. Click Create — the private key downloads automatically
6. Move it to your SSH directory:

```bash
# Linux/macOS
mkdir -p ~/.ssh
mv ~/Downloads/my-first-key.pem ~/.ssh/
chmod 400 ~/.ssh/my-first-key.pem   # chmod 400 = owner read-only
```

**Option B: Use your existing key:**
```bash
# Generate a key locally
ssh-keygen -t ed25519 -f ~/.ssh/my-first-key -C "my-first-aws-key"

# Import the public key to AWS:
# EC2 → Key Pairs → Actions → Import Key Pair
# Paste contents of ~/.ssh/my-first-key.pub
```

---

### PHASE 3: Launch Your EC2 Instance (10 minutes)

1. Go to **EC2** service → **Launch Instance**

2. **Name:** `my-first-server`

3. **AMI:** Choose **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
   - This is the most common cloud server OS choice

4. **Instance Type:** `t3.micro` (2 vCPU, 1GB RAM — Free Tier eligible)

5. **Key Pair:** Select `my-first-key`

6. **Network Settings:**
   - Create Security Group
   - Allow SSH from **My IP** (not 0.0.0.0/0 — never allow SSH from everywhere)
   - Add rule: **HTTP** (port 80) from anywhere (we'll install nginx)

7. **Storage:**
   - 8 GB gp3 SSD (default, free tier)
   - ✓ Delete on Termination (for learning — in prod this is off)

8. Click **Launch Instance**

Wait 60-90 seconds. Status changes to "running."

---

### PHASE 4: Connect via SSH (5 minutes)

**Find your instance's public IP:**
- EC2 → Instances → Select your instance → Note "Public IPv4 address"

**Connect:**
```bash
# Linux/macOS
ssh -i ~/.ssh/my-first-key.pem ubuntu@<YOUR_PUBLIC_IP>

# The default username for Ubuntu AMIs is "ubuntu"
# For Amazon Linux: ec2-user
# For RHEL: ec2-user
# For Windows: Administrator
```

**First connection will show a fingerprint warning:**
```
The authenticity of host '54.x.x.x (54.x.x.x)' can't be established.
ED25519 key fingerprint is SHA256:...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
Type `yes` — this adds the server's fingerprint to your known_hosts file.

**You're now on your cloud server!** The prompt changes to: `ubuntu@ip-10-0-x-x:~$`

---

### PHASE 5: Basic Server Setup (15 minutes)

```bash
# 1. Update the package list
sudo apt update

# 2. Install nginx (web server)
sudo apt install nginx -y

# 3. Verify nginx is running
sudo systemctl status nginx

# 4. Enable nginx to start on reboot
sudo systemctl enable nginx

# 5. Test locally (from the EC2 instance itself)
curl http://localhost

# 6. Get your public IP (from within the instance)
curl http://checkip.amazonaws.com
```

**Test from your browser:**
Open your browser and go to: `http://<YOUR_PUBLIC_IP>`

You should see: "Welcome to nginx!" — your cloud server is serving web traffic to the public internet.

---

### PHASE 6: Configure and Customize (10 minutes)

```bash
# 7. Modify the web page
sudo bash -c 'cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head><title>My First Cloud Server</title></head>
<body>
<h1>Hello from my EC2 instance!</h1>
<p>Server IP: $(curl -s http://checkip.amazonaws.com)</p>
<p>Server time: $(date)</p>
<p>Kernel: $(uname -r)</p>
</body>
</html>
EOF'

# 8. Reload nginx
sudo systemctl reload nginx

# View in browser again — now shows your custom page

# 9. Explore the server
df -h              # Disk usage
free -h            # Memory usage
top -bn1 | head -15   # CPU usage
uptime             # System load

# 10. Check nginx logs
sudo tail -20 /var/log/nginx/access.log
sudo tail -20 /var/log/nginx/error.log
```

---

### PHASE 7: Understand the Cost (5 minutes)

While the instance is running, check what you're spending:
- Go to AWS → Billing → Cost Explorer
- Or: check the EC2 Free Tier usage

**t3.micro free tier:** 750 hours/month free for 12 months. That's enough to run one instance continuously for a month (24 hours × ~31 days = 744 hours).

**What costs money even on free tier:**
- Data transfer out of AWS (first 100GB/month free)
- EBS snapshots (not free tier)
- Elastic IPs (charged if not attached to a running instance)

---

### PHASE 8: Stop and Terminate (when done) — IMPORTANT

```bash
# Exit the SSH session first
exit
```

**From the AWS Console:**
- EC2 → Instances → Select instance → Instance State → **Stop** (to pause and keep) OR **Terminate** (to delete permanently)

**For learning purposes:** Terminate when done to avoid any accidental charges.

**Difference:**
- **Stop:** VM is paused. EBS volume persists. You're charged for EBS storage only. Public IP is released.
- **Terminate:** VM is deleted. Root EBS is deleted (if "delete on termination" was checked). All gone.

---

```
Lab reflection:
You've just:
1. Created an SSH key pair
2. Configured a security group as a firewall
3. Selected an AMI (Linux image) and instance type (VM specs)
4. Launched a VM in AWS (provisioned in ~60 seconds)
5. Connected via SSH
6. Installed and configured a web server
7. Served a web page to the public internet

Every single step you did manually will be automated in:
- Module 5 (Terraform) — provision the infrastructure as code
- Module 4 (Ansible) — configure the software (install nginx, configure)
- Module 6 (GitHub Actions) — deploy new versions automatically

You just did the manual version of a CI/CD pipeline. 
Understanding what these tools automate is what makes them 
learnable rather than magical.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 20

1. What is an AMI and what information does it encode about a VM?

2. Why should SSH (port 22) in a Security Group be restricted to 
   "My IP" rather than "0.0.0.0/0" (all internet)? What specific 
   risk does unrestricted SSH access create?

3. You run `chmod 400` on your SSH private key. How is this different 
   from `chmod 600`? Is there a functional difference for SSH?

4. Your EC2 instance is stopped (not terminated). Which of the 
   following persist: (a) public IP address, (b) EBS root volume 
   data, (c) instance store data, (d) private IP address?

5. True/False: "The t3.micro instance type is suitable for 
   hosting a small production web application with 100 concurrent users."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **Provisioning a VM in AWS takes ~60 seconds.** AMI = template, instance type = specs, security group = firewall, key pair = SSH authentication. These four choices define a cloud VM.
- **chmod 400 on your private key is non-negotiable.** SSH refuses keys with permissions too open — this is a security enforcement mechanism, not optional.
- **Stop preserves data; Terminate deletes everything.** EBS persists across stop/start. Instance store is ephemeral. Always know which type of storage you're using before terminating.
- **Security Groups: SSH from My IP, HTTP/HTTPS from 0.0.0.0/0.** Never expose port 22 to the whole internet. This is the single most important security habit for cloud server management.
- **Manual provisioning is the foundation for automation.** Terraform, Ansible, and CI/CD don't replace this knowledge — they automate it. Debugging automation requires understanding the manual process.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** AMI = Amazon Machine Image. It encodes: the root disk image (OS installation and pre-installed software), the root device type (EBS vs instance store), disk partition mappings, launch permissions (public/private), and often instance metadata (which architectures it supports). Selecting an AMI determines what OS and pre-configured software state the new VM starts with.

**Q2:** Exposing port 22 to 0.0.0.0/0 means any IP address globally can attempt SSH connections. Automated botnets scan the entire internet for open SSH ports within minutes of a new instance launching. With password authentication disabled (AWS default: key-only), brute force is harder but not impossible if passwords are also enabled. Additionally, limiting to My IP reduces the attack surface from 4 billion IPs to one, making security analysis and audit logging simpler. If a breach happens, you know it came through your IP range.

**Q3:** `chmod 400` = owner read-only (no write). `chmod 600` = owner read+write. For SSH key usage: both are accepted by SSH (the requirement is "no group or world permissions"). However, `chmod 400` prevents accidental overwriting of the private key, which is an additional safety measure. There's no functional difference for SSH authentication specifically — both pass the "permissions too open" check.

**Q4:** After stopping (not terminating): (a) Public IP — NOT preserved (released, new one assigned on next start unless Elastic IP is used). (b) EBS root volume data — PRESERVED (this is the whole point of stopping vs terminating). (c) Instance store data — NOT preserved (instance store is ephemeral, lost on any stop or termination). (d) Private IP — PRESERVED (the private IP is reserved to your account's VPC subnet assignment and retained on restart).

**Q5:** Conditional. For development/staging or very low-traffic production: possibly — t3.micro (2 vCPU, 1GB RAM) can handle basic web traffic. For 100 concurrent users, it depends heavily on what those users are doing. Static content serving (nginx): t3.micro could handle thousands of concurrent users. Dynamic requests (Python/Node.js with database queries): 100 concurrent users may be fine or may overwhelm 1GB RAM (each Node.js process uses ~100MB+). The t3 family is "burstable" — sustained high CPU will throttle. For consistent production load: t3.small (2GB) or t3.medium (4GB) is safer; monitor actual memory and CPU utilization to right-size.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"AWS EC2 Complete Tutorial for Beginners" — TechWorld with Nana** — Comprehensive hands-on walkthrough
- **"Free AWS EC2 Instance — Step by Step" — NetworkChuck** — Covers free tier EC2 setup in detail
- **"SSH from Windows to Linux" — David Bombal** — SSH setup for Windows users specifically

**📖 Articles**
- **AWS Documentation: "Get started with Amazon EC2"** — Official step-by-step guide
- **AWS Free Tier FAQ** — Understand exactly what's free and what isn't
- **DigitalOcean: "How to set up SSH keys"** — General SSH key guide applicable across cloud providers

**🔗 Practice**
- **Your AWS Free Tier account** — The best practice is re-running this lab until the process feels natural. Launch, configure, SSH, stop. Then launch again without notes.
