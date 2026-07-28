# Module 1 — Part D: Virtualization — The Bridge to Cloud
## Chapter 22: Module 1 Capstone — Build Your Own Mini Cloud Lab

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part D] — Chapter 22: Module 1 Capstone
Estimated time:   20 minutes review + 90 minutes hands-on = 110 minutes
Prerequisites:    All of Module 1 (Chapters 1–21)
```

**Learning Objectives:**
- Synthesize all Module 1 concepts in one unified hands-on project
- Demonstrate command-line fluency, Linux administration, networking diagnosis, and container operation
- Build a multi-service system (web server + application + container) that mirrors real cloud architecture
- Self-assess gaps and identify which Module 2 topics to prioritize

**Chapter bridge:** This capstone closes Module 1 and transitions to Module 2 (Cloud Platform Selection). Everything built here — the networking model, the Linux server, the container — has a direct cloud equivalent you'll configure in Module 2: VPCs, EC2 instances, ECS containers.

---

## SECTION 2 — SPARK

The measure of Module 1 isn't whether you can answer questions about it. The measure is whether the concepts feel *physical* — whether "a packet traverses the OSI stack from Layer 7 to Layer 1" describes something you can trace in your mind's eye, not just a sentence you've memorized.

This capstone builds a small system that touches every major concept from the module. It's not a test with a grade. It's a stress-test of the mental models. When something goes wrong — and something will go wrong — the way you diagnose it demonstrates whether the knowledge is yours or just borrowed.

---

## SECTION 3 — WHY THIS MATTERS

Module 2 starts immediately with cloud platform comparison and workload selection. That comparison assumes fluency with the primitives: compute (what you learned in Ch 15, 19, 20), networking (Ch 7-13), storage (Ch 18), and containers (Ch 21). This capstone is the last chance to consolidate those fundamentals before building on them.

---

## SECTION 4 — THE CAPSTONE PROJECT

**What You're Building:**

```
Browser (Client)
    ↓ HTTP request to port 8080
[Nginx Reverse Proxy] ← Port 8080 on your machine/server
    ↓ Forwards to port 3000
[Python App Container] ← Running in Docker
    ↓ Serves dynamic HTML with system info
[User]  ← Views page with: hostname, IP, OS, time
```

This miniature 3-tier system demonstrates:
- Client-server architecture (Ch 14)
- Linux web server administration (Ch 16, 17)
- Container deployment (Ch 21)
- Reverse proxy and port concepts (Ch 10)
- DNS and networking (Ch 7-9)
- File permissions and system management (Ch 17)

---

## SECTION 5 — THEORY CHECKPOINT

### Module 1 Quick-Fire Review

Before starting the lab, answer these 10 questions from memory. If you need to look anything up, mark it and review that chapter.

```
1. What are the four parts of an IP address (how many bits, 
   displayed format, private range examples)?

2. What does chmod 600 mean in numeric and symbolic notation?

3. What command shows all running processes on Linux?

4. What is the difference between a switch and a router?

5. What DNS record type maps a domain name to an IPv4 address?

6. What is the TCP 3-way handshake?

7. What are namespaces and cgroups in the context of containers?

8. In RAID 1, what happens to data if one of the two mirrored 
   disks fails?

9. What is the purpose of a reverse proxy (like Nginx)?

10. What is a vCPU, and how does it differ from a physical CPU core?
```

**Scoring:** 
- 10/10: Ready. Do the lab.
- 7-9/10: Review the 2-3 missed chapters, then do the lab.
- <7/10: Go back to those chapters before proceeding.

---

## SECTION 6 — HANDS-ON CAPSTONE LAB

```
Lab: Build a Mini 3-Tier System
Platform:         Linux (Ubuntu) — on your EC2 instance from Chapter 20, 
                  a local VM, or any Linux machine
Tools needed:     Docker, Nginx, curl
Estimated time:   90 minutes
What you'll build: A containerized app served through a reverse proxy, 
                  accessible from your browser.
```

---

### PHASE 1: System Preparation (10 min)

```bash
# Confirm you're on Linux
uname -a
cat /etc/os-release | grep PRETTY

# Update and install required tools
sudo apt update
sudo apt install -y nginx docker.io curl jq

# Ensure docker works without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
nginx -v
```

---

### PHASE 2: Build the Python Application Container (20 min)

```bash
# Create project directory
mkdir -p ~/capstone/app && cd ~/capstone/app

# Create the application
cat > app.py << 'PYEOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import platform, socket, datetime, json, os

class SystemInfoHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default access logs
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "healthy"}')
            return
        
        info = {
            "hostname": socket.gethostname(),
            "ip": socket.gethostbyname(socket.gethostname()),
            "platform": platform.platform(),
            "python": platform.python_version(),
            "time": datetime.datetime.utcnow().isoformat() + "Z",
            "request_path": self.path,
            "request_from": self.client_address[0]
        }
        
        html = f"""<!DOCTYPE html>
<html>
<head>
<title>1% Dev — Mini Cloud Lab</title>
<style>
  body {{ font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 40px; }}
  .container {{ max-width: 800px; margin: 0 auto; }}
  h1 {{ color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }}
  .card {{ background: #1e1e2e; border: 1px solid #312e81; border-radius: 8px; padding: 20px; margin: 15px 0; }}
  .label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; }}
  .value {{ color: #f1f5f9; font-size: 16px; font-weight: bold; margin-top: 4px; }}
  .badge {{ background: #4f46e5; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-right: 8px; }}
</style>
</head>
<body>
<div class="container">
  <h1>🚀 OnePercent Dev — Module 1 Capstone</h1>
  <p>Mini 3-Tier System: Nginx → Container → You</p>
  
  <div class="card">
    <div class="label">Container Hostname</div>
    <div class="value">{info["hostname"]}</div>
  </div>
  
  <div class="card">
    <div class="label">Container IP</div>
    <div class="value">{info["ip"]}</div>
  </div>
  
  <div class="card">
    <div class="label">Platform</div>
    <div class="value">{info["platform"]}</div>
  </div>
  
  <div class="card">
    <div class="label">Server Time (UTC)</div>
    <div class="value">{info["time"]}</div>
  </div>
  
  <div class="card">
    <div class="label">Request received from</div>
    <div class="value">{info["request_from"]}</div>
  </div>
  
  <div class="card">
    <div class="label">Technologies in use</div>
    <div class="value">
      <span class="badge">Docker</span>
      <span class="badge">Nginx</span>
      <span class="badge">Python {info["python"]}</span>
      <span class="badge">Linux</span>
    </div>
  </div>
  
  <p style="color: #64748b; margin-top: 30px; font-size: 13px;">
    Module 1 ✅ | Computing Foundations | Networking | Linux | Virtualization
  </p>
</div>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"Server running on port {port}")
    HTTPServer(('', port), SystemInfoHandler).serve_forever()
PYEOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app
COPY app.py .

ENV PORT=3000
EXPOSE 3000

CMD ["python", "app.py"]
EOF

# Build the image
docker build -t capstone-app:1.0 .

# Test it directly first
docker run -d -p 3000:3000 --name capstone-test capstone-app:1.0
sleep 2
curl http://localhost:3000
curl http://localhost:3000/health

# If it worked, stop the test
docker stop capstone-test
docker rm capstone-test
```

---

### PHASE 3: Configure Nginx as Reverse Proxy (15 min)

```bash
# Create nginx config for reverse proxy
sudo cat > /etc/nginx/sites-available/capstone << 'NGEOF'
server {
    listen 8080;
    server_name _;
    
    # Logging
    access_log /var/log/nginx/capstone_access.log;
    error_log /var/log/nginx/capstone_error.log;
    
    # Proxy all requests to the Python container
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Health check endpoint
    location /nginx-health {
        return 200 "nginx is healthy\n";
        add_header Content-Type text/plain;
    }
}
NGEOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/capstone /etc/nginx/sites-enabled/capstone

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

### PHASE 4: Run the Full System (10 min)

```bash
# Start the container (connects to the Docker network)
docker run -d \
  --name capstone-app \
  -p 3000:3000 \
  --restart unless-stopped \
  capstone-app:1.0

# Verify container is running
docker ps

# Verify container app is responding
curl http://localhost:3000/health

# Verify nginx is forwarding
curl http://localhost:8080

# System status check
echo "=== SYSTEM STATUS ==="
echo "Docker container:"
docker ps | grep capstone
echo ""
echo "Nginx status:"
sudo systemctl status nginx | grep Active
echo ""
echo "Port listeners:"
ss -tlnp | grep -E ":3000|:8080"
```

---

### PHASE 5: Networking Diagnosis (15 min)

Apply the Chapter 12 diagnostic ladder to your own system:

```bash
echo "=== LAYER 1-2: Physical/Link ==="
ip link show | grep -E "UP|LOWER_UP"

echo ""
echo "=== LAYER 3: Network (can we reach ourselves?) ==="
ping -c 2 127.0.0.1

echo ""
echo "=== LAYER 3: Routing ==="
ip route show

echo ""
echo "=== DNS: Does our hostname resolve? ==="
nslookup $(hostname)

echo ""
echo "=== LAYER 4: Port check ==="
nc -zv localhost 3000
nc -zv localhost 8080

echo ""
echo "=== LAYER 7: Application response ==="
curl -o /dev/null -s -w "App (port 3000): HTTP %{http_code}, %{time_total}s\n" http://localhost:3000
curl -o /dev/null -s -w "Nginx (port 8080): HTTP %{http_code}, %{time_total}s\n" http://localhost:8080

echo ""
echo "=== Container isolation check ==="
echo "Host hostname: $(hostname)"
echo "Container hostname: $(docker exec capstone-app hostname)"
echo "They're different — container is isolated"
```

---

### PHASE 6: Stress Test and Monitoring (10 min)

```bash
# Generate some load to see in logs
for i in {1..20}; do
    curl -s -o /dev/null http://localhost:8080
done

# Check nginx access logs
sudo tail -20 /var/log/nginx/capstone_access.log

# Monitor the container's resource usage
docker stats capstone-app --no-stream

# Check system resources
echo "=== System Load ==="
uptime
free -h
df -h /
```

---

### PHASE 7: Cleanup and Teardown

```bash
# Stop and remove the container
docker stop capstone-app
docker rm capstone-app

# Disable nginx site
sudo rm /etc/nginx/sites-enabled/capstone
sudo nginx -t && sudo systemctl reload nginx

# Remove project files (optional)
# rm -rf ~/capstone

echo "Capstone lab complete!"
```

---

### BONUS CHALLENGE: Add a Second Container (Scale Out)

If you've completed the main lab, simulate horizontal scaling:

```bash
# Run TWO app containers on different ports
docker run -d --name app1 -p 3001:3000 capstone-app:1.0
docker run -d --name app2 -p 3002:3000 capstone-app:1.0

# Update nginx to load balance between them (upstream block)
sudo cat > /etc/nginx/sites-available/capstone-lb << 'EOF'
upstream app_servers {
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 8080;
    location / {
        proxy_pass http://app_servers;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/capstone-lb /etc/nginx/sites-enabled/capstone
sudo nginx -t && sudo systemctl reload nginx

# Test — requests alternate between app1 and app2 (note different hostnames)
for i in {1..6}; do
    curl -s http://localhost:8080 | grep "Container Hostname" | grep -o "ip-[^<]*"
done

# Cleanup
docker stop app1 app2
docker rm app1 app2
```

The different container hostnames in the loop output prove nginx is round-robin load balancing — different requests hit different containers. This is exactly how AWS load balancers work across multiple EC2 instances.

---

## SECTION 7 — CAPSTONE SELF-ASSESSMENT

After completing the lab, score yourself on each concept:

```
Rate each 1-5 (1=struggled, 5=nailed it):

Computing Foundations (Ch 1-6):
[ ] CLI navigation and file management
[ ] File permissions (chmod, chown)
[ ] Process management (ps, kill, nohup)

Networking (Ch 7-13):
[ ] TCP/IP concepts and ports
[ ] Nginx as reverse proxy
[ ] OSI layer-based troubleshooting
[ ] netstat/ss port inspection

Systems & Servers (Ch 14-18):
[ ] Client-server mental model
[ ] Linux service management (systemctl)
[ ] Package management (apt)

Virtualization (Ch 19-22):
[ ] Container concepts (build, run, exec)
[ ] Dockerfile basics
[ ] Container isolation verification

TOTAL: /100
80+: Strong foundation — move to Module 2 confidently
60-79: Review flagged chapters, then move forward
<60: Spend another day on Module 1 before Module 2
```

---

## SECTION 8 — KEY TAKEAWAYS (Module 1 Summary)

**The six mental models from Module 1:**

1. **The computer is deterministic.** CPU executes instructions, RAM provides working memory, storage persists. Every failure has a traceable cause. Chapter 1.

2. **The file system is a tree you navigate.** Everything is a file: devices, processes, configuration. Permissions control access at every node. Chapters 4, 6.

3. **The network is a layered system.** Physical → IP → TCP → Application. Each layer is debugged with specific tools. Knowing which layer to inspect first is the professional skill. Chapters 7-13.

4. **The server is a role, not a machine.** Physical → virtual machine → container. Each level of abstraction trades isolation for efficiency. Chapters 14-15, 19-21.

5. **Linux is the environment.** /etc for config, /var/log for logs, systemctl for services, apt for packages. These four cover 90% of server administration. Chapters 16-17.

6. **Security is default-deny.** Firewalls block everything unless allowed. Permissions deny unless granted. SSH requires explicit key placement. This pattern repeats throughout cloud infrastructure. Chapters 3, 11, 17.

---

## SECTION 9 — ANSWER KEY (Quick-Fire Questions)

**Q1:** IP = 32 bits, displayed as 4 octets (0-255) separated by dots. Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.
**Q2:** chmod 600 = rw------- (owner read+write, no group, no world). Symbolic: `u=rw,g=,o=`
**Q3:** `ps aux` — all processes. `top` or `htop` for interactive.
**Q4:** Switch connects devices within a LAN using MAC addresses. Router connects different networks using IP addresses.
**Q5:** A record.
**Q6:** SYN → SYN-ACK → ACK. Client initiates, server acknowledges and responds, client acknowledges. Connection established.
**Q7:** Namespaces = isolate what a container can see (PID, network, filesystem). cgroups = limit what it can use (CPU, RAM, I/O).
**Q8:** RAID 1: zero data loss. The surviving disk has a complete, identical copy. Array runs in degraded mode until replaced.
**Q9:** Reverse proxy sits in front of application servers, accepts client connections, and forwards them to backend servers. Hides backend topology, enables load balancing, handles TLS termination.
**Q10:** vCPU = a virtual CPU thread allocated to a VM. Multiple vCPUs may share one physical core (especially on burstable instances like t3). A physical core runs 1-2 threads via hyperthreading.

---

## SECTION 10 — LEARNING RESOURCES

**Module 1 Completion Resources**

**📹 Videos — Consolidation**
- **"Linux Basics for Cloud Engineers" — TechWorld with Nana** — Best overall review of everything in Module 1
- **"Networking Fundamentals Playlist" — Professor Messer** — Certify your networking knowledge at CompTIA Network+ level

**📖 Books — Go Deeper**
- **"The Linux Command Line" — William Shotts (free at linuxcommand.org)** — The definitive Linux CLI reference
- **"Computer Networking: A Top-Down Approach" — Kurose & Ross** — University-level networking textbook, widely available

**🔗 Next Steps**
- **AWS Cloud Practitioner (free practice)** — The material from Module 1 directly maps to the foundation sections of the AWS CCP exam
- **Linux Foundation Introduction to Linux (free on edX)** — Official Linux Foundation beginner course that reinforces everything in Module 1

---

*End of Module 1, Part D — Virtualization*
*Part D Complete: Chapters 19–22*
*Module 1 Complete: 22 Chapters*
*═══════════════════════════════════════*
*Next: Module 2 — Cloud Platforms (AWS, Azure, GCP) Deep Dive*
*Chapters 23–46*
