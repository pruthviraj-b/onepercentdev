# Module 1 — Part B: Networking Essentials
## Chapter 8: IP Addresses & Subnets Explained Simply

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part B] — Chapter 8: IP Addresses & Subnets
Estimated time:   45 minutes theory + 20 minutes hands-on lab = 65 minutes
Prerequisites:    Chapter 7: What Is a Network?
```

**Learning Objectives:**
- Explain what an IP address is and why it exists in both IPv4 and IPv6 forms
- Calculate network addresses, broadcast addresses, and valid host ranges from a subnet mask
- Explain CIDR notation and read subnet definitions like `10.0.0.0/24`
- Apply subnetting to design a VPC network layout (the cloud skill this chapter directly enables)

**Chapter bridge:** This chapter explains IP addressing — the addressing layer that makes routing possible. It directly sets up Chapter 9 (DNS) — because DNS exists specifically to translate human-readable names into the IP addresses that networking requires. Without understanding IP, DNS is magic. With it, DNS is logical.

---

## SECTION 2 — SPARK

Your home has a street address. That address tells the postal service exactly where in the world your house is — which city, which street, which number. Without it, mail cannot be delivered. It would just pile up at the post office with nowhere to go.

Every device on a network has an address too. But here's what makes it interesting: the address isn't just a unique identifier — it also encodes *which group* the device belongs to, the way your street address encodes which city and country you're in. The "city" part of an IP address tells routers whether a device is on the same local network or somewhere else in the world — and that decision determines whether the router handles the delivery directly or passes it to someone else.

This hierarchical structure — address + location — is the design insight that allowed the internet to scale from 4 hosts in 1969 to 5 billion devices today without the routing system collapsing under its own complexity.

---

## SECTION 3 — WHY THIS MATTERS

Every cloud network you build will require IP planning. When you create an AWS VPC, you choose a CIDR block (`10.0.0.0/16`). When you create subnets, you divide that block (`10.0.0.0/24` for web servers, `10.0.1.0/24` for databases). When you configure security groups, you write rules in CIDR notation. When a connection fails, you read IP addresses from logs to diagnose it. IP addressing is the vocabulary of cloud networking — without it, you cannot meaningfully configure, debug, or architect cloud networks. This chapter's CIDR notation appears in Module 5 (Terraform) when you provision VPCs programmatically.

---

## SECTION 4 — CORE THEORY

---

### 1. What an IP Address Is — Binary Numbers in Disguise

An **IP address (IPv4)** is a 32-bit binary number, displayed as four decimal numbers separated by dots (called "dotted decimal notation"):

```
Binary:  11000000 . 10101000 . 00000001 . 00000001
Decimal: 192      . 168      . 1        . 1
```

Each group of 8 bits is called an **octet** (because 8 bits = 1 byte). Since each octet can hold values from 00000000 (0) to 11111111 (255), each decimal portion of an IP address is 0–255.

This is why IP addresses look like `192.168.1.1` — four octets, each 0-255, totaling 32 bits.

**IPv4 address space:** 2³² = 4,294,967,296 possible addresses (~4.3 billion). In the 1980s this seemed limitless. By 2011, IANA (the organization managing the address pool) ran out. Every IPv4 address is now assigned — which is why NAT (which lets multiple devices share one public IP) is ubiquitous, and why IPv6 was invented.

**IPv6:** 128-bit addresses. 2¹²⁸ = 340 undecillion addresses. Displayed in hex: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`. IPv6 adoption is accelerating — cloud providers assign IPv6 to resources increasingly by default.

> **Real example: Asia Pacific IPv4 Exhaustion, 2011.** The Asia Pacific Network Information Centre (APNIC) — which distributes IP addresses in Asia — ran out of regular IPv4 addresses in April 2011, the first regional registry to do so. This forced ISPs across Asia to accelerate NAT deployment (multiple users sharing one IP) and IPv6 adoption. Cloud providers in the APAC region now strongly encourage IPv6 deployment. This is a textbook example of a design assumption (4 billion addresses is enough) colliding with reality decades later.

---

### 2. Private vs. Public IP Addresses — The Two Tiers

Not all IP addresses can be used on the public internet. Three ranges are **reserved for private networks** (RFC 1918):

| Range | CIDR Notation | Addresses Available |
|-------|--------------|---------------------|
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | 16 million |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | 1 million |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 65,536 |

Private IPs are **not routable on the internet** — routers on the public internet silently drop packets with private source or destination IPs. This is what allows millions of home networks to all use `192.168.1.x` without conflict — those addresses never appear on the public internet.

Your AWS VPC uses private IPs internally. When an EC2 instance needs to reach the internet, NAT (Network Address Translation) translates its private IP to a public IP. The `10.0.0.0/8` range is the most common for VPC configuration — it's the largest private range and is used by default in AWS VPCs.

---

### 3. Subnet Masks and CIDR — Defining Network Boundaries

A **subnet mask** defines which part of an IP address identifies the network, and which part identifies the individual host within that network. Written in dotted decimal: `255.255.255.0`. In binary:

```
11111111.11111111.11111111.00000000
```

The 1s indicate the **network portion**. The 0s indicate the **host portion**. Applied to IP `192.168.1.45` with mask `255.255.255.0`:
- Network: `192.168.1` (first 24 bits)
- Host: `.45` (last 8 bits)
- All devices with IPs `192.168.1.x` are on the same network

**CIDR notation** (Classless Inter-Domain Routing) replaces writing the full mask with just the count of 1-bits: `192.168.1.0/24` means "24 bits are the network, 8 bits are hosts."

**CIDR math you must internalize:**

| CIDR | Mask | Hosts Available | Cloud Use Case |
|------|------|-----------------|---------------|
| /32 | 255.255.255.255 | 1 | Single host security rule |
| /30 | 255.255.255.252 | 2 | Point-to-point link |
| /28 | 255.255.255.240 | 14 | Small subnet |
| /24 | 255.255.255.0 | 254 | Standard subnet (256 - 2) |
| /23 | 255.255.254.0 | 510 | Medium subnet |
| /16 | 255.255.0.0 | 65,534 | VPC address space |
| /8 | 255.0.0.0 | 16M | Large private range |

**Why subtract 2 for usable hosts?** Two addresses in every subnet are reserved:
- **Network address** (all host bits = 0): `192.168.1.0` — identifies the subnet itself
- **Broadcast address** (all host bits = 1): `192.168.1.255` — sends to all hosts in subnet

So a /24 has 256 addresses, 254 usable. AWS further reserves 5 addresses per subnet (adds 3 for routing, DNS, and future use).

**Ask yourself:** If you're designing a VPC for a company with 3 tiers (web, app, database) and want room for 50 servers in each tier, what CIDR would you choose for each subnet?

> **Real example: AWS VPC /16 Default.** When AWS creates a default VPC in a new account, it uses `172.31.0.0/16`. This gives 65,534 private IPs across the VPC. The subnets per Availability Zone get /20 blocks (4,096 addresses each). Engineers who don't understand this run into VPC peering problems: two VPCs with overlapping CIDR ranges cannot be peered — AWS blocks it. Companies that blindly use the default CIDR in all their VPCs eventually find they can't connect them. Planning CIDR from the start is a real infrastructure skill.

---

### 4. Subnetting in Practice — How Cloud Networks Are Designed

Real cloud network design follows a pattern: choose a large VPC CIDR, then divide it into smaller subnets for different tiers and purposes.

**Example VPC design:**
```
VPC:              10.0.0.0/16    (65,534 addresses total)

Public subnets (internet-facing):
  10.0.0.0/24    (254 hosts) — AZ-1 web/load balancer tier
  10.0.1.0/24    (254 hosts) — AZ-2 web/load balancer tier

Private subnets (no direct internet):
  10.0.2.0/24    (254 hosts) — AZ-1 application tier
  10.0.3.0/24    (254 hosts) — AZ-2 application tier

Database subnets (most restricted):
  10.0.4.0/24    (254 hosts) — AZ-1 database tier
  10.0.5.0/24    (254 hosts) — AZ-2 database tier
```

This pattern — public/private/database in multiple AZs — is the canonical AWS architecture you'll build in Module 5 (Terraform) and Module 7 (Projects). Understanding IP and CIDR is what makes that work not just copying, but actually understanding.

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. A subnet has CIDR notation 10.0.2.0/24. 
   What is the network address? Broadcast address? 
   How many usable host IPs are there?

2. Why can't two AWS VPCs with overlapping CIDR blocks be peered?

3. In the APNIC IPv4 exhaustion example, what design assumption 
   about scale turned out to be wrong? What does this teach about 
   capacity planning?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Calculate Subnets and Plan a VPC Network
Platform:         All (browser-based tools + terminal)
Tools needed:     Browser, terminal (optional Python)
Estimated time:   20 minutes
What you'll demonstrate: You can calculate subnet boundaries and 
                  design a multi-tier network address plan — 
                  the same thing Terraform does when creating a VPC.
```

**Step 1: Verify your own subnet**

**Linux/macOS:**
```bash
ip addr show
```
Find your IP and netmask. Example output:
```
inet 192.168.1.105/24 brd 192.168.1.255 scope global eth0
```
- Your IP: `192.168.1.105`
- CIDR: `/24` (24-bit network)
- Broadcast: `192.168.1.255`
- Network: `192.168.1.0`
- Usable range: `192.168.1.1` to `192.168.1.254`

**Windows:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127*" }
```

**Step 2: Calculate subnet ranges with Python**

```python
# Run: python3
# Or save as subnet_calc.py and run: python3 subnet_calc.py

import ipaddress

# Define a network
network = ipaddress.IPv4Network('10.0.0.0/24', strict=False)

print(f"Network address:   {network.network_address}")
print(f"Broadcast address: {network.broadcast_address}")
print(f"Netmask:           {network.netmask}")
print(f"Total addresses:   {network.num_addresses}")
print(f"Usable hosts:      {network.num_addresses - 2}")
print(f"First host:        {list(network.hosts())[0]}")
print(f"Last host:         {list(network.hosts())[-1]}")
```

**Step 3: Design your own VPC**

```python
# Plan a 3-tier VPC
vpc = ipaddress.IPv4Network('10.0.0.0/16')
subnets = list(vpc.subnets(new_prefix=24))

print("\n=== VPC Design: 10.0.0.0/16 ===")
labels = [
    "Public-AZ1 (Web)", "Public-AZ2 (Web)",
    "Private-AZ1 (App)", "Private-AZ2 (App)",
    "DB-AZ1 (Database)", "DB-AZ2 (Database)"
]

for i, label in enumerate(labels):
    net = subnets[i]
    print(f"{label}: {net} — {net.num_addresses-2} usable hosts")
```

Expected output:
```
Public-AZ1 (Web):   10.0.0.0/24 — 254 usable hosts
Public-AZ2 (Web):   10.0.1.0/24 — 254 usable hosts
Private-AZ1 (App):  10.0.2.0/24 — 254 usable hosts
Private-AZ2 (App):  10.0.3.0/24 — 254 usable hosts
DB-AZ1 (Database):  10.0.4.0/24 — 254 usable hosts
DB-AZ2 (Database):  10.0.5.0/24 — 254 usable hosts
```

**Step 4: Use the visual subnet calculator (browser)**

Go to **cidr.xyz** in your browser. Enter `10.0.0.0/24` and explore the visual breakdown. Change the `/24` to `/28`, `/16`, `/8` — watch how the host count changes.

```
Lab reflection:
You've designed a VPC with 6 subnets. But here's the question 
to sit with: you used /24 for each subnet (254 hosts). 
Your company currently has 10 servers. Is /24 wasteful? 
Or is leaving room a good idea?

And a trickier question: if you later realize your database 
subnet is too small and you need to expand it, can you resize 
an existing VPC subnet without downtime?

The answer is more constrained than you might expect — 
Module 5, Chapter 15 covers VPC subnet planning with Terraform 
and explains why getting the CIDR right from the start matters.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 8

1. Convert the IP address 192.168.10.5 with subnet mask 255.255.255.0 
   to CIDR notation. What is the network address?

2. Why were private IP address ranges (10.x.x.x, 192.168.x.x) 
   defined, and what problem do they solve in the context of 
   IPv4 address exhaustion?

3. The default AWS VPC uses 172.31.0.0/16. A company creates VPCs 
   in three regions all using this default. Later, they want to 
   connect these VPCs using VPC Peering. What problem will they encounter?

4. Your organization needs a subnet that will contain exactly 
   20 servers. What is the smallest CIDR block you could use 
   that accommodates all 20 hosts? (Remember AWS reserves 5 addresses.)

5. True/False: "A /16 subnet always contains 65,534 usable host addresses."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **An IPv4 address is a 32-bit binary number in four decimal octets.** It encodes both identity (which specific device) and location (which network). This dual encoding is what allows internet routing to scale.
- **Private IP ranges (10.x, 172.16-31.x, 192.168.x) are never routed on the public internet.** They can be reused across millions of private networks. AWS VPCs always use private ranges.
- **CIDR /N means N bits identify the network.** Usable hosts = 2^(32-N) - 2. Every cloud architect must be fluent in this calculation — it's in every Terraform config and VPC design.
- **Overlapping CIDR blocks prevent VPC peering.** Plan IP space before building. Changing a VPC CIDR after it contains resources requires rebuilding. Start with a large VPC block (/16) and carve /24s from it.
- **Real incidents (APNIC exhaustion 2011, VPC peering conflicts) trace to these fundamentals** — not abstract math failures, just insufficient address planning at scale.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** `192.168.10.5/24`. The subnet mask `255.255.255.0` has 24 bits set to 1, giving `/24`. Network address: `192.168.10.0` (all host bits zeroed).

**Q2:** Private ranges were defined to conserve the limited IPv4 address space. Instead of assigning a public IP to every device in a home or office, the entire network shares one public IP (via NAT), while internal devices use private IPs that can be reused across any number of private networks without conflict. This extended the usability of IPv4 by decades.

**Q3:** VPC Peering requires non-overlapping CIDR blocks. Three VPCs all using `172.31.0.0/16` have completely overlapping address spaces. AWS will block the peering. To fix: either recreate the VPCs with different CIDR ranges, or use AWS Transit Gateway (which has different overlap rules). This is a common production mistake that requires expensive re-architecture.

**Q4:** Need 20 servers + 5 AWS reserved = 25 addresses minimum. A /27 gives 2^5 = 32 addresses, minus 5 reserved = 27 usable. This fits 20 servers with room for 7 more. A /28 gives only 16 addresses - 5 = 11 usable — not enough. Answer: `/27`.

**Q5:** Not exactly — it depends on the context. In pure math: 2^(32-16) - 2 = 65,534 usable IPs. But in AWS, each subnet within the /16 loses 5 addresses (network, broadcast, + 3 AWS reserved). If the /16 is divided into subnets, the usable count per subnet is reduced by 5 each. The /16 itself as a VPC block has 65,536 addresses from which subnets are carved — the "65,534" figure applies to a /16 as a single subnet, not as a VPC containing multiple subnets. Answer: approximately true for a flat network, but the nuance matters in cloud networking.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"Subnetting is Simple" — Sunny Classroom** — Best visual introduction to subnetting with binary breakdowns
- **"IP Addressing and Subnetting for Beginners" — Professor Messer** — Clear, methodical walkthrough for certification-level understanding
- **"AWS VPC Explained" — Be A Better Dev** — Shows how IP/subnetting concepts apply directly to AWS networking

**📖 Articles**
- **RFC 1918 — "Address Allocation for Private Internets"** — The original standard defining private IP ranges, surprisingly readable
- **AWS Docs: "VPC CIDR blocks"** — Official documentation on how to choose CIDR for AWS VPCs
- **cidr.xyz** — Interactive CIDR calculator — the best visual tool for building intuition

**🔗 Practice**
- **SubnettingPractice.com** — Randomized subnetting drills that build calculation speed — do 20 problems until you stop counting fingers
- **Python `ipaddress` module docs** — The module used in the lab. Building your own subnet calculator is excellent practice.
