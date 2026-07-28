# Module 1 — Part B: Networking Essentials
## Chapter 11: Firewalls, NAT & Network Security Basics

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part B] — Chapter 11: Firewalls, NAT & Network Security
Estimated time:   40 minutes theory + 15 minutes hands-on lab = 55 minutes
Prerequisites:    Chapter 10: Ports, Protocols & How Data Travels
```

**Learning Objectives:**
- Explain what a firewall does and how packet-filtering rules work
- Describe how NAT (Network Address Translation) allows multiple devices to share one public IP
- Distinguish between stateful and stateless firewalls
- Map these concepts to AWS Security Groups and Network ACLs

**Chapter bridge:** This chapter applies ports and protocols from Chapter 10 to security. It leads directly into Chapter 12 (Hands-On: Diagnosing Networks) — where you'll use tools like `ping` and `netstat` to test whether firewall rules are working as expected.

---

## SECTION 2 — SPARK

Right now, as you read this, automated scanners are probing public IP addresses across the internet, looking for open ports, known vulnerabilities, and misconfigured services. This isn't speculation — security researchers estimate that any new public IP address receives its first automated scan within minutes of becoming reachable. The internet is a hostile environment by default.

Without firewalls, every service running on a server is reachable by every device on the internet — your database, your internal admin panel, your debug endpoints, all of it. The question isn't whether attackers will probe your servers. They will, automatically, constantly. The question is: what do they find when they do?

---

## SECTION 3 — WHY THIS MATTERS

AWS Security Groups are firewalls. Every single EC2 instance, RDS database, and Lambda function in AWS sits behind a Security Group — and configuring them correctly is one of the first things you'll do when provisioning cloud infrastructure. Security Groups use the exact same concepts as traditional firewalls: allow/deny rules based on port, protocol, and IP range. Engineers who don't understand firewalls configure Security Groups by trial and error, often leaving ports open that should be closed. Module 5 (IaC) uses Terraform to define Security Group rules in code — the abstraction is useless without understanding what it represents.

---

## SECTION 4 — CORE THEORY

---

### 1. What a Firewall Is — The Traffic Inspector at the Gate

A **firewall** is a system that examines network traffic and decides whether to allow or block it based on a set of rules. Rules are evaluated against:
- **Source IP address** (where is the traffic coming from?)
- **Destination IP address** (where is it going?)
- **Protocol** (TCP, UDP, ICMP?)
- **Port number** (which service?)
- **Direction** (inbound to server? outbound from server?)

Firewalls operate on a deny-by-default model: everything is blocked unless a rule explicitly allows it. This is the **principle of least privilege** from Chapter 3 applied to network traffic.

**Stateless vs. Stateful firewalls:**

A **stateless firewall** evaluates each packet independently without remembering previous packets. To allow TCP traffic, you need rules for both directions: allow inbound on port 443, AND allow outbound responses on the ephemeral port the client used.

A **stateful firewall** tracks connection state. When an outbound request is allowed, it automatically allows the return traffic for that connection. You only need one rule per connection direction. AWS Security Groups are stateful — allow inbound SSH port 22, and the response packets are automatically allowed.

**Network ACLs (NACLs)** in AWS are stateless — you must configure both inbound and outbound rules explicitly. They operate at the subnet level (not instance level). Security Groups operate at the instance level.

> **Real example: Capital One Data Breach, 2019.** A former AWS employee exploited a misconfigured web application firewall (WAF) at Capital One. The misconfiguration allowed Server-Side Request Forgery (SSRF) — the attacker tricked the WAF into making requests on their behalf to the AWS metadata service, obtaining temporary credentials. Those credentials had overly broad IAM permissions, enabling access to 100 million customer records stored in S3. The firewall was in place but misconfigured. This illustrates that having a firewall is not enough — the rules must be precise and tested.

---

### 2. NAT — How Many Devices Share One IP

Your home network has many devices (phone, laptop, TV, smart devices) but your ISP gives you one public IP address. How do they all access the internet simultaneously?

**NAT (Network Address Translation)** allows multiple devices with private IPs to share a single public IP by rewriting packet headers:

**Outbound (your laptop → internet):**
1. Laptop sends packet: `Source: 192.168.1.5:54321 → Destination: 142.250.80.46:443`
2. Router rewrites source: `Source: 203.0.113.1:45678 → Destination: 142.250.80.46:443` (public IP, different port)
3. Router records: "port 45678 maps to internal 192.168.1.5:54321"
4. Packet sent to internet

**Inbound (internet → your laptop):**
1. Response arrives: `Source: 142.250.80.46:443 → Destination: 203.0.113.1:45678`
2. Router looks up port 45678 in NAT table: maps to `192.168.1.5:54321`
3. Router rewrites destination: `Source: 142.250.80.46:443 → Destination: 192.168.1.5:54321`
4. Delivered to laptop

This is **NAPT (Network Address Port Translation)**, sometimes called PAT. The router maintains a translation table of active connections.

**In cloud:** AWS EC2 instances in private subnets use a **NAT Gateway** (or NAT Instance) to access the internet — outbound traffic gets NAT'd through the gateway's public IP. Inbound connections from the internet are impossible without it being explicitly configured (via an internet gateway + Elastic IP or load balancer). This is the security boundary between private and public subnets.

**Ask yourself:** If NAT gives you a single public IP for your entire home network, can someone on the internet initiate a connection to your laptop directly? Why or why not?

> **Real example: Mirai Botnet IoT Exploitation, 2016.** The Mirai botnet — which launched the Dyn DDoS attack from Chapter 7 — compromised hundreds of thousands of IoT devices (cameras, DVRs, routers). Most home routers are behind NAT — but these IoT devices were often the *router itself* or were placed in DMZ mode (which forwards all incoming traffic to them, bypassing NAT protection). Manufacturers had shipped devices with default passwords (`admin`/`admin`) listening on port 23 (Telnet) — and NAT provided no protection because the devices were border devices. NAT is not a security measure — it's an address conservation measure. Defense requires actual firewall rules.

---

### 3. AWS Security Groups — Cloud Firewalls in Practice

AWS Security Groups are virtual firewalls for EC2 instances (and other resources). Key properties:

- **Stateful:** Allow inbound SSH → return traffic automatically allowed
- **Allow-only rules:** You can only add allow rules, never explicit deny (use NACLs for explicit deny)
- **Applied per-instance:** Multiple instances can share a Security Group; one instance can have multiple Security Groups
- **Reference other Security Groups:** Rule can say "allow inbound port 3306 from the app-server Security Group" — this means only instances in that group can connect. More flexible and robust than IP ranges.

**Best practice Security Group architecture:**
```
Load Balancer SG:
  Inbound: 80 from 0.0.0.0/0
  Inbound: 443 from 0.0.0.0/0

App Server SG:
  Inbound: 8080 from [Load Balancer SG]   # Only LB can connect
  Inbound: 22 from [Bastion Host SG]       # Only bastion can SSH in

Database SG:
  Inbound: 3306 from [App Server SG]       # Only app can connect
  # No port 22, no port 80, nothing else
```

This layered security model (defense in depth) ensures even if the load balancer is compromised, the attacker cannot directly reach the database.

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. What is the difference between a stateful and stateless firewall? 
   Which does AWS use for Security Groups?

2. How does NAT allow multiple private-IP devices to share a single 
   public IP without conflicts?

3. In the Capital One breach, a WAF was in place but misconfigured. 
   What does this illustrate about the difference between "having 
   security tools" and "having effective security"?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Test Firewall Behavior and Map Open Ports
Platform:         All (Windows/macOS/Linux)
Tools needed:     Terminal, curl, nmap (optional install)
Estimated time:   15 minutes
What you'll demonstrate: Firewall behavior is testable from the CLI — 
                  the same way you verify Security Group rules are 
                  working in cloud deployments.
```

**Step 1: Test if a port is reachable using curl**

```bash
# Test HTTPS (port 443)
curl -v --max-time 5 https://github.com 2>&1 | head -20

# Test HTTP (port 80)
curl -v --max-time 5 http://example.com 2>&1 | head -20

# Test a port that's likely blocked
curl --max-time 5 telnet://scanme.nmap.org:22
# If SSH is open, you'll see SSH banner
# If firewalled: connection refused or timeout
```

**Step 2: Use netcat to test port connectivity**

```bash
# Test if port 443 is open on a host (Linux/macOS)
nc -zv github.com 443
# -z = don't send data, just check if open
# -v = verbose

# Test port 22 (SSH)
nc -zv github.com 22

# Test a closed port (should fail/timeout)
nc -zv -w 3 github.com 9999
# -w 3 = timeout after 3 seconds
```

**Windows equivalent:**
```powershell
Test-NetConnection -ComputerName github.com -Port 443
Test-NetConnection -ComputerName github.com -Port 22
```

**Step 3: Scan your own machine's open ports (with nmap)**

**Install nmap:**
```bash
# Linux (Ubuntu/Debian)
sudo apt install nmap

# macOS
brew install nmap
```

```bash
# Scan your own machine
nmap localhost

# Scan with service detection
nmap -sV localhost
```

**IMPORTANT:** Only scan hosts you own or have permission to scan. Scanning others' systems without permission is illegal in many jurisdictions.

**Step 4: View your machine's firewall rules**

**Linux (using iptables — the traditional firewall):**
```bash
sudo iptables -L -n
```

**Linux (using ufw — simpler interface):**
```bash
sudo ufw status verbose
```

**macOS:**
```bash
sudo pfctl -sr 2>/dev/null || echo "No active pf rules"
```

**Windows:**
```powershell
Get-NetFirewallRule | Where-Object {$_.Enabled -eq "True"} | 
  Select-Object DisplayName, Direction, Action | 
  Format-Table -AutoSize
```

```
Lab reflection:
You've tested port reachability from the outside, and inspected 
firewall rules from the inside.

Now think about this classic deployment problem: 
"My application is running on port 8080, I can curl it from 
the server itself (localhost:8080), but I can't reach it from 
my browser using the server's public IP."

List the three things you would check, in order, to diagnose this. 
What command tests each one?

Write your checklist now — you'll validate it in Module 6.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 11

1. What does "stateful" mean in the context of a stateful firewall? 
   How does this differ from stateless packet filtering?

2. If NAT protects home devices from unsolicited inbound connections, 
   why were Mirai botnet authors still able to infect home routers 
   and IoT devices?

3. In the Capital One 2019 breach, the attacker exploited SSRF through 
   a misconfigured WAF. How does this illustrate that security tools 
   can create a false sense of security if not properly configured?

4. You're designing Security Groups for a 3-tier web application 
   (load balancer, app server, database). Write the minimum set 
   of Security Group rules needed, referencing Security Group names 
   rather than IP addresses.

5. True/False: "NAT provides security equivalent to a firewall by 
   preventing all unsolicited inbound connections."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **Firewalls allow or deny traffic based on IP, port, protocol, and direction.** Default-deny is the safe default — everything blocked unless explicitly allowed. AWS Security Groups enforce this.
- **Stateful firewalls track connections** — allow inbound traffic and the return traffic is automatically allowed. Security Groups are stateful; NACLs are stateless (need both inbound and outbound rules).
- **NAT conserves IPv4 addresses by mapping private IPs to one public IP.** It's not a security measure — it's an address conservation mechanism. Devices behind NAT are still vulnerable to attacks originating from within their network.
- **Defense in depth: layer Security Groups.** LB accepts from internet. App accepts only from LB. DB accepts only from App. Each layer reduces blast radius if one component is compromised.
- **Real incidents (Capital One 2019, Mirai 2016) trace to these fundamentals** — misconfigured rules and NAT misunderstood as security, resulting in million-record breaches and global DDoS infrastructure.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** Stateful firewalls track the state of network connections. When an outbound connection is initiated and allowed, the firewall automatically allows the corresponding inbound response packets without requiring an explicit inbound rule — because it knows they're part of an established connection. Stateless firewalls evaluate each packet independently, requiring explicit rules in both directions.

**Q2:** NAT protects against unsolicited inbound connections to devices behind the router. However: (1) Home routers themselves are border devices — not behind NAT. Their management ports (Telnet port 23, HTTP port 80 for admin panel) are directly internet-facing. (2) Some IoT devices were placed in DMZ mode or had UPnP enabled (automatically opening ports). (3) Many devices had Telnet running with default `admin/admin` credentials with no firewall. NAT only protects devices behind it, not the NAT device itself.

**Q3:** Capital One had a WAF in place — which sounds like adequate security. But the WAF was misconfigured to allow SSRF (it didn't block requests from itself to the AWS metadata service). Security tools create the impression of protection without providing it if they're not correctly configured and tested. A locked door with a known key hidden under the mat is not effective security regardless of the door's quality.

**Q4:** Minimum Security Group rules:
- LB-SG: Inbound 80/443 from 0.0.0.0/0
- App-SG: Inbound app-port from LB-SG; Inbound 22 from Bastion-SG (or your IP)
- DB-SG: Inbound 3306 (or 5432) from App-SG
No other inbound rules needed. All outbound: default allow (stateful return traffic handled).

**Q5:** False. NAT provides a side-effect of blocking unsolicited inbound connections to devices behind it — because the router has no NAT table entry for inbound traffic that wasn't preceded by an outbound request. However: (1) It provides no protection against traffic originating from within the network. (2) The NAT device itself is exposed. (3) Applications can use techniques (UPnP, STUN, hole-punching) to create NAT traversal paths for inbound connections. (4) NAT has no rule-based filtering — it either passes or drops, with no inspection of content. A firewall inspects traffic; NAT translates addresses. They're different tools with different purposes.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"Firewalls Explained" — PowerCert Animated Videos** — Clear animated walkthrough of stateful/stateless firewalls
- **"NAT Explained" — PowerCert** — Best visual explanation of NAT and NAPT available on YouTube
- **"AWS Security Groups vs NACLs" — Stephane Maarek** — Practical cloud-specific comparison

**📖 Articles**
- **AWS Docs: "Security groups for your VPC"** — Complete reference for AWS Security Group configuration
- **Cloudflare: "What is a firewall?"** — Comprehensive introduction including WAF concepts
- **Krebs on Security: "Who is Anna-Senpai, the Mirai Worm Author?"** — Deep investigative piece on the Mirai botnet's origins

**🔗 Practice**
- **AWS Free Tier:** Create an EC2 instance and experiment with Security Group rules — add and remove rules and test connectivity with `nc` or `curl`. This is the hands-on Security Group experience no article can replace.
