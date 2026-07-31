# Module 1 — Part B: Networking Essentials
## Chapter 9: DNS — How Domain Names Actually Work

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part B] — Chapter 9: DNS — How Domain Names Work
Estimated time:   40 minutes theory + 15 minutes hands-on lab = 55 minutes
Prerequisites:    Chapter 8: IP Addresses & Subnets Explained Simply
```

**Learning Objectives:**
- Explain the DNS resolution process step-by-step, from browser query to IP address
- Describe the DNS hierarchy: root servers, TLD servers, authoritative nameservers
- Identify common DNS record types (A, AAAA, CNAME, MX, NS, TXT) and their purposes
- Diagnose DNS problems using `nslookup` and `dig` from the terminal

**Chapter bridge:** This chapter explains DNS — the internet's phone book that translates names to IPs. It leads directly into Chapter 10 (Ports, Protocols & Data Travel) — because once DNS resolves a domain to an IP, the actual TCP/IP connection (ports, protocols, HTTP) begins. DNS is the lookup; Chapter 10 is the delivery.

---

## SECTION 2 — SPARK

Every time you type `google.com` in your browser and it loads instantly, something remarkable happens: your browser doesn't know Google's IP address. It has to ask. And the asking process traverses an international hierarchy of servers across multiple countries, receives an answer, and completes — all before the first byte of the webpage loads.

This happens billions of times per second globally. The entire system runs without central coordination, with no single point of control, maintained by thousands of independently operated servers. And yet it almost always works, almost instantly.

But here's the interesting question: *what happens when it doesn't?* When DNS fails, every domain name on the internet becomes unreachable — even though the servers behind them are running perfectly. The content exists. The servers exist. But without DNS, nobody can find them. It's like the internet exists but someone removed all the street signs.

---

## SECTION 3 — WHY THIS MATTERS

DNS is one of the first things you'll configure when deploying a cloud service. You'll set up A records to point your domain to a load balancer IP. You'll configure CNAME records for subdomains. You'll add MX records for email. You'll use TXT records for domain verification. You'll set TTLs (Time To Live) and discover they affect how quickly changes propagate globally. DNS misconfiguration is one of the top causes of deployment failures — "the site is up but nobody can reach it." Understanding DNS is the difference between spending 3 minutes on a DNS change and spending 3 hours.

---

## SECTION 4 — CORE THEORY

---

### 1. The DNS Hierarchy — A Distributed Phone Book

DNS is not a single server — it's a hierarchy of millions of servers, each responsible for a different level of the naming system.

**The hierarchy, from top to bottom:**

**Root DNS servers (13 clusters globally):**
Know only where to find TLD servers. They don't know `google.com` — they know where to find `.com` servers. There are 13 root server *addresses* (labeled A through M) but each is actually a cluster of hundreds of servers worldwide via anycast routing.

**TLD (Top-Level Domain) servers:**
Know where to find authoritative nameservers for domains within their TLD. `.com` TLD servers know where `google.com`'s nameservers are, but not the actual IP of `google.com`.

**Authoritative nameservers:**
The final authority for a specific domain. When you register a domain and configure DNS at Route 53 (AWS), Cloudflare, or GoDaddy, you're configuring authoritative nameservers. They hold the actual DNS records mapping names to IPs.

**Recursive resolvers (your ISP or Google's 8.8.8.8):**
Your computer sends DNS queries to a recursive resolver. The resolver does the work of walking the hierarchy (root → TLD → authoritative) and caching the results. Your laptop doesn't query root servers directly.

> **Real example: Dyn DDoS Attack, October 2016.** Dyn was a major DNS provider — their servers were the authoritative nameservers for companies including Twitter, Netflix, Reddit, Spotify, and PayPal. On October 21, 2016, a botnet (the Mirai botnet, made of compromised IoT devices) launched a massive DDoS attack against Dyn's servers. Without Dyn's authoritative nameservers, DNS queries for Twitter, Netflix, etc. couldn't be resolved. Users got "server not found" even though Netflix's actual servers were completely fine. Major internet services were unreachable for hours across the US East Coast. DNS is not redundant infrastructure by default — it's a critical single point of failure unless deliberately architected otherwise.

---

### 2. The DNS Resolution Process — Step by Step

When you type `academy.onepercentdev.com` in your browser:

**Step 1:** Browser checks its own DNS cache — did we look this up recently?

**Step 2:** If not cached, OS checks the `/etc/hosts` file (Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts` (Windows) — a local override file. (`127.0.0.1 localhost` lives here.)

**Step 3:** OS asks the recursive resolver (configured via DHCP from your router — usually your ISP's resolver or 8.8.8.8).

**Step 4:** Recursive resolver checks its own cache.

**Step 5:** If not cached, resolver asks a root server: "Where are the .com TLD servers?"

**Step 6:** Root server responds: "Here are the .com TLD server addresses."

**Step 7:** Resolver asks .com TLD server: "Where are onepercentdev.com's nameservers?"

**Step 8:** .com TLD responds: "onepercentdev.com is managed by nameservers ns1.example-host.com."

**Step 9:** Resolver asks ns1.example-host.com: "What is the IP of academy.onepercentdev.com?"

**Step 10:** Authoritative nameserver responds: "academy.onepercentdev.com = 54.23.11.8"

**Step 11:** Resolver returns that IP to your browser. Browser connects to `54.23.11.8`.

This entire process typically completes in 20–120ms. Every result is cached with a **TTL (Time To Live)** — the number of seconds until the cached record expires and must be re-fetched.

**Ask yourself:** If you change your domain's A record to a new server IP, when will all users globally see the new IP? What determines this?

---

### 3. DNS Record Types — The Full Vocabulary

| Record Type | Purpose | Example |
|-------------|---------|---------|
| **A** | Maps domain name → IPv4 address | `api.app.com → 54.23.1.1` |
| **AAAA** | Maps domain name → IPv6 address | `api.app.com → 2001:db8::1` |
| **CNAME** | Maps domain name → another domain name (alias) | `www.app.com → app.com` |
| **MX** | Mail server for domain | `app.com → mail.google.com (priority 10)` |
| **NS** | Nameservers for domain | `app.com → ns1.route53.com` |
| **TXT** | Free-text verification/information | `app.com → "v=spf1 include:sendgrid.net ~all"` |
| **PTR** | Reverse DNS — IP → domain name | `1.23.54.54.in-addr.arpa → api.app.com` |
| **SOA** | Start of Authority — primary nameserver info | (auto-configured) |

**CNAME rules and pitfalls:**
- CNAME cannot coexist with other records for the same name (root/apex domain restriction)
- `CNAME app.com → otherdomain.com` is illegal — you can't CNAME an apex domain with a plain CNAME record. This is why AWS Route 53 created "Alias records" (a Route53-specific extension that works around this restriction).
- CNAMEs add a second DNS lookup — the resolver must resolve the target domain too.

**TTL strategy:**
- High TTL (86400 = 24 hours): DNS cached globally, changes take up to 24 hours to propagate
- Low TTL (60 = 1 minute): Changes propagate quickly but create more DNS query load
- Best practice before a major change: drop TTL to 300 (5 minutes) 24-48 hours before the change, make the change, then raise TTL again

> **Real example: CloudFlare's Adoption of 1.1.1.1 (2018).** Cloudflare launched their public DNS resolver at `1.1.1.1` on April 1, 2018, claiming it was the fastest public resolver in the world (faster than Google's 8.8.8.8). They achieved this partly through anycast routing (the same IP announced from Cloudflare data centers globally — your query goes to the nearest one) and aggressive caching. Within 24 hours, 1.1.1.1 received 2 billion queries — people pointing their DNS resolvers at the new service. DNS resolver choice is a real performance decision that affects every request your users make.

---

### 4. DNS and Cloud — Route 53, Private DNS, and Split-Horizon

In cloud environments, DNS gets more complex:

**AWS Route 53** is Amazon's DNS service — both a registrar and an authoritative nameserver. When you create a hosted zone in Route 53 for your domain, you're creating an authoritative nameserver that Route 53 manages.

**Private DNS:** Cloud VPCs have internal DNS. An EC2 instance in your VPC can be reached at `ip-10-0-1-5.ec2.internal` from within the same VPC — a private DNS name that resolves only inside your network. This is used by microservices to find each other without exposing public IPs.

**Split-horizon DNS:** The same domain name resolves to different IPs depending on whether you're querying from inside or outside the VPC. Internal: `api.myapp.com → 10.0.1.5` (private IP). External: `api.myapp.com → 54.23.1.1` (public IP). This is used for internal traffic to stay on the private network without traversing the internet unnecessarily.

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. What is TTL in DNS, and why does it create a tradeoff 
   between change propagation speed and DNS query load?

2. What's the difference between an A record and a CNAME record?
   When would you use each?

3. In the Dyn DDoS attack (2016), Twitter and Netflix were unreachable 
   even though their servers were fine. What does this reveal about 
   the relationship between DNS availability and service availability?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: DNS Investigation From the Terminal
Platform:         All (Windows/macOS/Linux)
Tools needed:     nslookup (built-in), dig (built-in on Linux/macOS, 
                  install on Windows), browser
Estimated time:   15 minutes
What you'll demonstrate: DNS resolution is observable and debuggable 
                  from the CLI — a critical skill for diagnosing 
                  deployment failures.
```

**Step 1: Basic DNS lookup**

**All platforms (nslookup is universal):**
```bash
nslookup google.com
```

Output shows: the recursive resolver you're using (Server), and the A records returned.

**Step 2: Look up specific record types**

```bash
# A records (IPv4)
nslookup -type=A github.com

# MX records (mail servers)
nslookup -type=MX gmail.com

# NS records (nameservers)
nslookup -type=NS amazon.com

# TXT records (verify SPF, domain ownership)
nslookup -type=TXT google.com
```

**Step 3: Use dig for detailed DNS trace (Linux/macOS)**

```bash
# Install dig if missing (Linux):
sudo apt install dnsutils

# Basic dig
dig google.com

# Show the full resolution path
dig +trace google.com

# Look up specific record type
dig MX gmail.com
dig TXT github.com

# Query a specific DNS server (bypass your default resolver)
dig @8.8.8.8 google.com    # Query Google's resolver
dig @1.1.1.1 google.com    # Query Cloudflare's resolver
```

The `+trace` flag shows you each step of the DNS hierarchy — from root servers down to the authoritative nameserver. You'll see the actual root server names, the TLD servers, and the final answer.

**Step 4: Check TTL of a record**

```bash
dig google.com | grep -A2 "ANSWER SECTION"
```

In the ANSWER section, the number before `IN A` is the TTL in seconds — how long this answer is cached before re-querying.

**Step 5: Check what happens with a non-existent domain**

```bash
nslookup thisdoesnotexistanywhere123456.com
dig thisdoesnotexistanywhere123456.com
```

You'll get `NXDOMAIN` (Non-Existent Domain) — the authoritative server confirmed this name doesn't exist. Different from a timeout (server unreachable) or `SERVFAIL` (server error).

**Step 6: Check your local hosts file (local DNS override)**

**Linux/macOS:**
```bash
cat /etc/hosts
```

**Windows:**
```powershell
Get-Content C:\Windows\System32\drivers\etc\hosts
```

```
Lab reflection:
You've watched DNS resolution in detail. Now consider: 
When a company deploys a new version of their API and updates 
the A record in Route 53, some users see the new version and 
some still see the old one for hours. 

Why does this happen even after the change is made? 
What determines when each user sees the update?

And: is there any way to guarantee instant propagation?
Chapter 10 connects DNS to the actual connection setup, 
and Module 6's CD chapter addresses this in deployment contexts.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 9

1. Describe the DNS resolution process for a domain not in any cache, 
   starting from the user's browser and ending with the IP being returned. 
   Name each type of server involved.

2. Why can't you use a regular CNAME record for the root/apex domain 
   (e.g., app.com directly, not www.app.com)? What is the DNS 
   protocol rule that prevents this?

3. In the October 2016 Dyn DDoS attack, attackers targeted DNS 
   infrastructure rather than the actual web servers of Twitter/Netflix. 
   What does this reveal about which layer of internet infrastructure 
   is most efficient to attack?

4. You just changed your domain's A record from old-server-IP to 
   new-server-IP in Route 53. The TTL was 86400 (24 hours). 
   A customer in Singapore reports they still see the old server 
   24 hours later. What are two possible explanations?

5. True/False: "If a DNS query for your domain returns NXDOMAIN, 
   it means your web server is down."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **DNS is a distributed, hierarchical, cached naming system.** Root → TLD → Authoritative nameservers. Your recursive resolver (8.8.8.8, 1.1.1.1) does the walking; your laptop just asks it.
- **TTL is the key lever for change propagation speed.** Long TTL = fast resolution, slow updates. Short TTL = slow resolution (more queries), fast updates. Always lower TTL before planned DNS migrations.
- **A = IP address. CNAME = alias to another name. MX = mail. TXT = verification.** These four cover 90% of real DNS work. Know them cold.
- **DNS failure = total service unavailability, regardless of server health.** The Dyn attack proved this. DNS is not automatically highly available — it must be architected with multiple providers or redundant nameservers.
- **Real incidents (Dyn 2016, platform outages via DNS) trace to these fundamentals** — when DNS fails, nothing works, even when every application server is healthy. DNS is invisible infrastructure until it isn't.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** (1) Browser checks local cache. (2) Checks `/etc/hosts`. (3) Asks recursive resolver (ISP/8.8.8.8). (4) Resolver checks its cache. (5) Resolver asks root server → gets TLD nameserver location. (6) Resolver asks TLD server → gets authoritative nameserver location. (7) Resolver asks authoritative nameserver → gets actual IP. (8) Resolver returns IP to browser with TTL.

**Q2:** DNS protocol requires that a name can have EITHER a CNAME record OR any other record type (A, MX, etc.) — not both. The apex domain (app.com) MUST have an NS record (for delegation) and an SOA record. Therefore a CNAME at the apex conflicts with these required records. The workaround: AWS Route 53 Alias records, Cloudflare CNAME flattening — provider-specific extensions that resolve the CNAME server-side before returning an A record.

**Q3:** DNS infrastructure is a force multiplier — one service authenticates for hundreds of downstream services. Attacking Dyn took down Twitter, Netflix, Reddit, GitHub simultaneously without needing to attack each individually. The attack surface at the DNS layer has a 100:1 leverage ratio. This is why security architects classify DNS as critical infrastructure and why DNSSEC, anycast DNS, and multi-provider DNS strategies are essential for high-profile services.

**Q4:** Two explanations: (1) The customer's recursive resolver cached the old A record when TTL was 86400 (24 hours). Even after 24 hours, if their resolver cached it at the last moment before the change, they could see it for up to 24 more hours after your change. (2) Some DNS resolvers don't respect TTLs exactly and cache longer than specified (non-compliant behavior). Mitigation: always reduce TTL to 300-600 seconds *before* a planned DNS migration.

**Q5:** False. NXDOMAIN means the DNS nameserver confirmed the domain name does not exist in DNS — there is no DNS record for that name. This is a DNS-layer failure, completely independent of whether a web server is running. The web server could be fully operational, but if there's no A record pointing to it, clients can't find it. Common causes of NXDOMAIN for a domain you own: DNS records accidentally deleted, wrong domain configured, nameservers not propagated yet.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"DNS Explained" — NetworkChuck** — 15-minute clear walkthrough of the full DNS resolution process
- **"How DNS Works" — DNS Made Easy (YouTube)** — Animated visualization of the resolution hierarchy
- **"Dyn DDoS Attack Explained" — various YouTube** — Multiple good breakdowns of the 2016 incident

**📖 Articles**
- **Cloudflare Blog: "What is DNS?"** — One of the best written DNS explanations on the internet, with excellent diagrams
- **"How DNS Works" — Howstuffworks** — Accessible, thorough, covers all record types
- **AWS Docs: "Amazon Route 53 Developer Guide"** — The definitive reference for cloud DNS configuration

**🔗 Practice**
- **dnschecker.org** — Check DNS propagation globally for any domain — see which regions have cached your new records
- **mxtoolbox.com** — DNS lookup, MX record checking, blacklist checking — essential diagnostic tool
