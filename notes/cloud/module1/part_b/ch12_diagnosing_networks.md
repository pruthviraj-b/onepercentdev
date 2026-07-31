# Module 1 — Part B: Networking Essentials
## Chapter 12: Hands-On: Diagnosing Networks
### (ping, traceroute, nslookup)

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part B] — Chapter 12: Diagnosing Networks
Estimated time:   20 minutes theory + 40 minutes hands-on lab = 60 minutes
Prerequisites:    Chapter 11: Firewalls, NAT & Network Security Basics
```

**Learning Objectives:**
- Use `ping`, `traceroute`, `nslookup`, `dig`, `netstat`, and `curl` to diagnose network issues
- Interpret diagnostic output to identify whether a problem is DNS, routing, firewall, or application layer
- Build a systematic network troubleshooting methodology
- Recognize the network diagnostic tools used in real incident response

**Chapter bridge:** This chapter is the pure practical application of everything in Part B. It closes out the networking section and leads into Chapter 13 (The OSI Model) — where the theoretical framework that organizes all these protocols is formally presented.

---

## SECTION 2 — SPARK

It's 2 AM. Your on-call phone is ringing. Users can't reach your service. The first question your incident commander asks: "Is it a DNS problem, a routing problem, a firewall problem, or the application itself?"

If you don't know how to answer that question in under two minutes, the incident drags on. If you do — if you can run five commands in sequence and say "the DNS lookup is fine, the ping works, the port is reachable, but curl returns 502" — you've just narrowed a universe of possibilities down to one specific component: the application server behind the load balancer. That's when you fix things fast. That's when engineers earn their reputation.

Network troubleshooting isn't guesswork. It's a systematic movement through the layers — from physical connectivity up to application — eliminating possibilities at each step.

---

## SECTION 3 — WHY THIS MATTERS

Network diagnostic tools are used every single time a cloud deployment has connectivity issues — which is every non-trivial deployment. SSH can't connect? `ping` first. Application can't reach its database? `nc -zv` the database port. Load balancer returning 502? Check application health with `curl localhost:8080/health`. DNS propagation happened? `dig` from multiple resolvers. These aren't advanced skills — they're minimum baselines for any cloud engineer. You'll use them in Module 6's deployment labs and in every production incident you're ever involved in.

---

## SECTION 4 — CORE THEORY

---

### 1. The Network Troubleshooting Ladder — Work Up the Layers

Professional network troubleshooting follows the OSI model bottom-up. You eliminate lower layers before investigating higher ones:

```
Layer 7 — Application   → Is the application responding correctly?
Layer 6-5 — (Session)   → Is TLS/SSL working?
Layer 4 — Transport     → Is the TCP port reachable?
Layer 3 — Network       → Can I route packets to the host?
Layer 2 — Data Link     → Am I connected to the local network?
Layer 1 — Physical      → Is the cable plugged in / WiFi connected?
```

**Troubleshooting commands per layer:**

| Layer | Question | Command |
|-------|----------|---------|
| Physical/Link | Am I connected? | Check WiFi/cable; `ip link show` |
| Network | Can I reach the host? | `ping <IP>` |
| Network | What path do packets take? | `traceroute <host>` |
| DNS | Does the name resolve? | `nslookup <domain>` / `dig <domain>` |
| Transport | Is the port open? | `nc -zv <host> <port>` |
| Application | Is the service responding? | `curl -v <URL>` |

**The golden rule:** Work bottom-up. If `ping` fails, fix routing before investigating DNS. If DNS fails, fix DNS before investigating the port. Each layer's failure masks higher layers — you cannot diagnose layer 7 if layer 3 is broken.

---

### 2. ping — The "Are You There?" Tool

`ping` sends ICMP Echo Request packets to a host and expects Echo Reply responses. It tests Layer 3 (IP) connectivity.

```bash
ping google.com          # Linux/macOS (runs forever, Ctrl+C to stop)
ping -c 4 google.com     # Linux/macOS (4 packets)
ping google.com          # Windows (4 packets by default)
ping -t google.com       # Windows (runs forever)
```

**Reading ping output:**
```
64 bytes from 142.250.80.46: icmp_seq=1 ttl=116 time=12.3 ms
64 bytes from 142.250.80.46: icmp_seq=2 ttl=116 time=11.8 ms
```
- `ttl`: Time To Live — decremented by each router hop. Tells you roughly how many hops away the host is.
- `time`: Round-trip latency in ms
- Packet loss %: shown in summary — 0% is good, >5% indicates network problems

**ping failure interpretations:**
- `Request timeout`: host doesn't respond (host is down, ICMP is firewalled, or host doesn't exist)
- `Network unreachable`: local routing table has no route to destination
- `Name resolution failure`: DNS failed before ping even tried

**Limitation:** Many production servers firewall ICMP — `ping` fails even if the server is healthy. Always follow a failed ping with a port test before concluding the host is down.

---

### 3. traceroute/tracert — Mapping the Path

`traceroute` sends packets with incrementally increasing TTL values. Each router that decrements TTL to 0 sends back a "TTL exceeded" message — revealing its IP address and the latency to that point.

```bash
traceroute google.com      # Linux/macOS
tracert google.com         # Windows
```

**Reading traceroute output:**
```
1   192.168.1.1    1.2 ms   1.1 ms   1.0 ms   (your router)
2   10.0.0.1       5.2 ms   5.1 ms   5.3 ms   (ISP router)
3   72.14.216.68  18.4 ms  18.2 ms  18.1 ms   (Google backbone)
4   * * *                                       (hop didn't respond)
5   142.250.80.46  21.3 ms  21.1 ms  21.4 ms  (google.com)
```

- `* * *`: This router blocks ICMP/UDP probes — normal, don't be alarmed
- Sudden latency spike: indicates a slow or congested link at that hop
- Destination unreachable or final hop never responds: firewall or routing issue at/near destination

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. You ping a server and get "Request timeout" for all packets. 
   What are two possible explanations — one that means the server 
   is down, and one that means the server is up?

2. What does traceroute actually use to reveal each hop's 
   IP address, and why does the TTL field make this possible?

3. If a service is responding to curl on localhost but curl fails 
   from a remote machine, at which troubleshooting ladder layer 
   is the problem most likely located?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Full Network Diagnostic Workflow
Platform:         All (Windows/macOS/Linux)
Tools needed:     Terminal only (all tools are pre-installed)
Estimated time:   40 minutes
What you'll demonstrate: You can diagnose any network problem 
                  systematically using a repeatable workflow — 
                  the same one used in real incident response.
```

**SCENARIO:** "Users report they can't reach api.github.com. Diagnose the problem systematically."

---

**STEP 1: Check local network connectivity**

```bash
# Linux/macOS:
ip route show default
# or
route -n

# Windows:
ipconfig
route print
```

If no default gateway: your machine isn't connected to a network. Start here.

---

**STEP 2: Test IP-level connectivity with ping**

```bash
# Ping Google's DNS server (always reachable if internet works)
ping -c 4 8.8.8.8

# Linux/macOS:
# Ping a known IP (avoids DNS)
ping -c 4 140.82.112.4   # GitHub's IP

# Windows:
ping 8.8.8.8
```

**If ping to IP fails**: routing problem. Your packets can't reach the internet.
**If ping to IP succeeds**: internet connectivity is fine. Move to DNS.

---

**STEP 3: Test DNS resolution**

```bash
# Can we resolve the domain name?
nslookup api.github.com

# More detailed:
dig api.github.com

# Try a different resolver (bypass ISP DNS):
dig @8.8.8.8 api.github.com
dig @1.1.1.1 api.github.com
```

**If nslookup works but dig @8.8.8.8 fails**: your ISP's DNS is blocking or redirecting
**If both fail**: DNS server is unreachable or domain doesn't exist
**If both work**: DNS is fine, move to port testing

---

**STEP 4: Test TCP port connectivity**

```bash
# Test HTTPS port (443)
nc -zv api.github.com 443

# Windows:
Test-NetConnection -ComputerName api.github.com -Port 443
```

**If port test fails but DNS works**: firewall blocking the port (either local or remote)
**If port test works**: move to application layer

---

**STEP 5: Test application response**

```bash
# Full HTTP request with timing
curl -v https://api.github.com 2>&1 | head -30

# Just status code
curl -o /dev/null -s -w "%{http_code}" https://api.github.com

# With timing breakdown
curl -o /dev/null -s -w "\
DNS lookup: %{time_namelookup}s\n\
TCP connect: %{time_connect}s\n\
TLS handshake: %{time_appconnect}s\n\
TTFB: %{time_starttransfer}s\n\
Total: %{time_total}s\n" https://api.github.com
```

The timing breakdown shows exactly where delays occur — DNS resolution, TCP handshake, TLS, server processing, or transfer.

---

**STEP 6: Trace the route**

```bash
# Where do packets go before reaching GitHub?
traceroute api.github.com    # Linux/macOS
tracert api.github.com       # Windows
```

Look for:
- Where the latency spikes (slow link at that hop)
- Where `* * *` stops (possible firewall or blackhole)
- Final hop reaching GitHub or dying before it

---

**STEP 7: Check local firewall**

```bash
# Linux — check iptables rules
sudo iptables -L -n | grep -E "REJECT|DROP"

# Check if ufw is blocking
sudo ufw status

# macOS — application firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
```

---

**PRACTICE EXERCISE — Real Diagnosis:**

Run through all 7 steps for these three targets and document what you find:

1. `ping -c 4 8.8.8.8` → note the round-trip time
2. `dig github.com` → note the TTL and IP returned
3. `nc -zv smtp.gmail.com 25` → does port 25 open? (hint: most ISPs block port 25)
4. `curl -w "%{http_code}" -o /dev/null -s https://example.com`

Write what each result tells you about that layer's health.

---

**STEP 8: Create your personal diagnostic script**

```bash
#!/bin/bash
# Save as ~/network_diag.sh
# chmod +x ~/network_diag.sh

HOST="${1:-google.com}"
echo "=== Network Diagnostic for: $HOST ==="

echo -e "\n[1] Default Gateway"
ip route show default 2>/dev/null || route -n 2>/dev/null | grep UG

echo -e "\n[2] Ping 8.8.8.8 (IP connectivity)"
ping -c 2 8.8.8.8 | tail -2

echo -e "\n[3] DNS Resolution"
dig +short $HOST

echo -e "\n[4] Port 443 (HTTPS)"
nc -zv -w 3 $HOST 443 2>&1

echo -e "\n[5] HTTP Response"
curl -o /dev/null -s -w "Status: %{http_code} | Time: %{time_total}s\n" https://$HOST

echo -e "\n=== Diagnostic Complete ==="
```

Run it:
```bash
chmod +x ~/network_diag.sh
~/network_diag.sh github.com
~/network_diag.sh example.com
```

```
Lab reflection:
You now have a systematic network diagnostic workflow. 

Think about this real scenario: you've deployed a Node.js app 
on an AWS EC2 instance. It's listening on port 3000. The Security 
Group allows port 3000 from your IP. But `nc -zv <ec2-ip> 3000` 
times out.

Walk through all 7 diagnostic steps mentally. At which step 
would you find the problem, and what would the output tell you?

(Answer revealed in Module 6, Chapter 19 — CD Pipelines — 
when you deploy your first real application.)
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 12

1. You ping a remote server and receive: "PING google.com: 
   Network is unreachable." What does this error mean at the 
   network layer? What would you check first?

2. traceroute output shows `* * *` for 5 consecutive hops 
   before the destination responds successfully. 
   Is this a problem? What does it indicate?

3. A junior engineer concludes a server is down because ping 
   times out. Explain why this conclusion is premature and 
   what additional tests should be run.

4. You run: 
   curl -o /dev/null -s -w "%{time_namelookup}" https://api.example.com
   
   The output is: 0.823 seconds.
   
   What does this tell you about where the performance problem is, 
   and what would you investigate?

5. True/False: "If ping succeeds to a server's IP address, 
   the web application running on that server is working correctly."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **Troubleshoot bottom-up: Physical → IP → DNS → Port → Application.** Each layer's failure can mask higher layers. Don't guess; eliminate.
- **ping tests IP reachability; does NOT test application health.** Many healthy production servers drop ICMP. ping success means routing works; ping failure doesn't mean the server is down.
- **traceroute reveals the path and where latency originates.** `* * *` hops are normal (firewall). A sudden ms spike identifies a congested link.
- **dig/nslookup separates DNS from connectivity.** "Connection refused" at the port means DNS worked. "Name resolution failed" means DNS is the problem.
- **curl -w with timing fields is the most powerful diagnostic tool** — it breaks down exactly how long DNS, TCP, TLS, and server response each took. Use it before writing "it's slow."

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** "Network is unreachable" means the local routing table has no route to the destination. The packet never left the machine — the OS rejected it before transmission. Check: (1) is there a default gateway configured (`ip route show default`)? (2) Is the local network interface up (`ip link show`)? This is a Layer 3 routing problem, not a Layer 1 connectivity problem.

**Q2:** No, this is not a problem. `* * *` indicates those router hops are configured to not respond to traceroute probes (ICMP TTL-exceeded messages are blocked by their firewall or they're configured for silent forwarding). This is common on ISP backbone routers. Since the destination responds successfully, packets are being forwarded through those hops — they're just not advertising themselves. Treat `* * *` as invisible hops, not broken ones.

**Q3:** Ping tests only Layer 3 IP reachability AND requires the server to allow ICMP (which many firewalls block). A server could have: (1) ICMP blocked by firewall while serving web traffic fine, (2) Ping disabled by OS configuration, (3) A security policy that ignores ICMP. Additional tests: `nc -zv <IP> 443` to test the HTTPS port, `curl -I https://domain` to test HTTP response, `traceroute` to verify routing. Only after these fail is "server is down" a defensible conclusion.

**Q4:** 0.823 seconds for DNS lookup is extremely slow — typical DNS resolution is 20-100ms. This means the application's DNS resolver is slow — possibly a misconfigured or overloaded resolver, or the server doesn't have a properly configured DNS server in `/etc/resolv.conf`. Investigate: (1) what resolver is configured (`cat /etc/resolv.conf`), (2) test that resolver directly (`dig @<resolver-IP> api.example.com`), (3) consider switching to a faster resolver (8.8.8.8 or 1.1.1.1) if the current one is slow.

**Q5:** False. Ping tests IP-layer reachability — can packets reach the server. Application health is an entirely separate question. The server could be reachable by IP but: the web application could be crashed, listening on the wrong port, returning errors (503, 500), or firewalled specifically for the port the application uses while ICMP is allowed through. Ping success tells you the OS is running and the network path works. It says nothing about whether port 443 is open, TLS is working, or the application is serving valid responses.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"Network Troubleshooting using PING, TRACERT, IPCONFIG, NSLOOKUP — Windows" — PowerCert** — Comprehensive walkthrough
- **"Linux Network Commands — Beginner to Advanced" — NetworkChuck** — All the CLI tools covered in this lab
- **"How to Debug Network Issues" — TechWorld with Nana** — Production-focused troubleshooting mindset

**📖 Articles**
- **"Troubleshooting Network Connectivity" — AWS Documentation** — Official AWS guide covering the same ladder methodology
- **explainshell.com** — Paste any command you encounter and get flag-by-flag explanations
- **"Linux Network Debugging Commands" — DigitalOcean Community** — Comprehensive reference

**🔗 Practice**
- **Your own AWS Free Tier EC2 instance** — Deliberately break and fix connectivity: misconfigure a Security Group, add it back, test the change with nc/curl. Real-world experience.
- **OverTheWire Bandit (levels 20-25)** — Challenges involving network connections, port listening, and data transfer using nc.
