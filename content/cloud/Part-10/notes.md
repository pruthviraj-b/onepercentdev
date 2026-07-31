# Part 10 — Systems & Servers

Welcome to the systems and servers course. In this part, we explore the client-server architecture model, the physical and virtual roles of server hardware, Linux systems administration, and physical/virtual storage mechanisms.

---

## Chapter 14: Client-Server Architecture Explained

### Spark — A Question Before the Answer
When you check your bank balance on an app, your phone isn't storing your account data — it's asking *someone else* for it, every single time. Why design things this way instead of just keeping everything on your device? The answer is one of the oldest and most foundational architectural decisions in all of computing, and it shapes literally every cloud service you'll ever build.

### Why This Matters
"Client-server" isn't just a diagram in a textbook — it's the literal shape of every web app, mobile app, and API you'll work with in cloud computing. Every architecture decision from here forward (load balancers, databases, microservices) is a variation on this one core pattern. Get this foundation solid, and everything else in systems design will click into place faster.

### Core Theory

**1. The Core Pattern**
A **client** requests something. A **server** responds with it. That's the entire model. Your browser (client) requests a webpage; a web server responds with the HTML. Your banking app (client) requests your balance; a server responds with the number, pulled from a database it controls.

**2. Why Not Just Store Everything Locally?**
Centralizing data and logic on a server (instead of every device) means: data stays consistent and up-to-date for everyone, sensitive logic/data never has to leave a controlled environment, and updates can be pushed once centrally instead of to millions of individual devices.

*Real example:* When **Instagram** changes its feed algorithm, it changes code on its servers — not on a billion individual phones. Every client automatically gets the new behavior the next time it asks the server for data, with zero user action required.

**3. One Server, Many Clients**
A single server (or more realistically, a fleet of servers behind a load balancer) can serve enormous numbers of clients simultaneously, because most of what a server does — handling a request, querying a database, sending a response — takes milliseconds.

*Real example:* During the 2022 World Cup final, streaming platforms like **YouTube TV** served millions of simultaneous client connections from centralized server infrastructure — a scale only possible because client-server architecture allows massive request volumes to be load-balanced (Module 6 territory) across many servers behind the scenes, invisible to any individual user.

**4. Thick Client vs Thin Client**
A "thin client" does very little processing itself and relies almost entirely on the server (most modern web apps). A "thick client" (or "fat client") handles significant processing locally and only talks to the server when necessary (some desktop software, certain games).

*Real example:* A basic webmail interface like older versions of Outlook Web Access is a thin client — nearly everything happens server-side. A locally-installed video editing app is a thick client — most processing happens on your own machine, with the server (if any) only used for things like cloud backup.

**5. Where This Breaks Down at Scale**
Client-server is simple with one server and a few clients. It becomes genuinely hard at the scale of millions of clients — which is precisely the problem cloud computing, load balancing, and distributed systems exist to solve. This chapter is your entry point into a problem space the rest of this course spends a lot of time solving.

### Hands-On Lab
1. Open your browser's Developer Tools (F12 or right-click → Inspect), go to the "Network" tab, then visit any website.
2. Reload the page and watch the list of requests appear — each one is your browser (client) asking a server for a specific piece of data (HTML, images, scripts).
3. Click on one request and look at the response — note the server's IP/domain that responded, and how fast it came back (in milliseconds).

### Quiz
1. In one sentence, define the client-server model.
2. Why do companies like Instagram centralize logic on servers instead of running it on every device?
3. What's the difference between a thin client and a thick client?
4. Why does serving millions of simultaneous clients (like during a World Cup final) require more than just "one server"?
5. What real-world example from this chapter illustrates a thick client?

### Key Takeaways
- Client-server architecture means clients request, servers respond — the foundational pattern behind nearly all modern software.
- Centralizing logic/data on servers enables consistency, security, and easy updates at scale.
- Thin vs thick client describes how much processing happens locally vs on the server.
- This simple pattern becomes genuinely complex at scale — which is exactly the problem the rest of this course (load balancing, distributed systems, cloud architecture) is built to solve.

---

## Chapter 15: What Is a Server, Really? (Physical vs Virtual)

### Spark — A Question Before the Answer
You've used the word "server" constantly through this course already — but is a server a special type of machine, or just a regular computer doing a specific job? The answer reshapes how you'll think about every cloud resource you create from Module 2 onward.

### Why This Matters
Understanding what a server actually *is* — and isn't — is what lets you understand why cloud computing is even possible. When you "launch" an AWS EC2 instance, you're not getting a dedicated physical machine built just for you; you're getting a carefully managed slice of a much bigger system. This chapter explains exactly how that works.

### Core Theory

**1. A Server Is a Role, Not a Special Machine**
Technically, any computer that responds to requests from other computers is "a server" — including, in principle, your own laptop, if you configured it to respond to network requests. What makes something a "server" in practice is its *role* (always-on, responding to client requests) — not unique hardware.

*Real example:* Plenty of hobbyist developers run a basic web server directly on a Raspberry Pi — a $35 computer — proving that "server" describes a function, not a category of expensive specialized hardware.

**2. Physical (Dedicated) Servers**
That said, real production servers are usually purpose-built: rack-mounted machines in data centers, designed for reliability, redundancy (backup power, backup network connections), and 24/7 uptime — very different from a consumer laptop.

*Real example:* Before cloud computing existed, a company like **eBay** in its early years had to buy, physically rack, cable, and maintain its own servers in a data center it leased or owned — an enormous upfront capital cost and ongoing maintenance burden that limited how fast they could grow.

**3. Virtual Servers — The Cloud Breakthrough**
A virtual server is software that *behaves* like a complete, independent server, but actually runs as one of many isolated partitions on a single powerful physical machine, using a technology called virtualization (full details in Chapter 19).

*Real example:* When you launch an AWS EC2 instance, you are not getting your own dedicated physical computer. You're getting a virtual slice of a much larger physical server in an AWS data center — sharing that hardware with other AWS customers, but completely isolated from them, unaware of each other's existence. This is the single technical breakthrough that made modern cloud computing economically possible — instead of buying a whole physical machine, you rent exactly the slice of computing power you actually need.

**4. Why This Distinction Matters Practically**
Virtual servers can be created and destroyed in seconds (compare that to ordering, shipping, and racking physical hardware, which used to take weeks). This is *why* cloud computing enables rapid scaling — spinning up 50 additional virtual servers during a traffic spike, then deleting them an hour later, paying only for that hour.

*Real example:* During **Black Friday**, retailers like **Target** scale up enormous numbers of virtual servers temporarily to handle the traffic surge, then scale back down afterward — something that would have been physically and financially impossible in the pre-cloud, physical-server-only era, when companies had to permanently own enough hardware to handle their absolute peak load, year-round, even though it sat mostly idle 364 days a year.

### Hands-On Lab
1. Search "AWS EC2 instance types" and look at the list — note the naming pattern (e.g., t3.micro, m5.large) and how each maps to a different amount of virtual CPU/RAM.
2. Search "data center rack server photo" to see what physical servers actually look like before virtualization slices them up.
3. Write down, in your own words, why a company would prefer renting a virtual server for one hour over buying a physical machine, for a short-term traffic spike.

### Quiz
1. What technically makes a computer "a server" — special hardware, or a role it performs?
2. Why did pre-cloud companies like early eBay face high upfront costs?
3. What is a virtual server, in your own words?
4. Why can virtual servers be created/destroyed far faster than physical ones?
5. How does Target's Black Friday scaling illustrate the practical value of virtual servers?

### Key Takeaways
- "Server" describes a role (responding to client requests), not a fixed category of hardware.
- Physical servers are real machines in data centers, with high upfront cost and slow provisioning.
- Virtual servers are software-defined slices of physical machines — fast to create/destroy, and the core innovation enabling cloud computing's flexibility.
- This distinction directly explains *why* cloud computing can offer pay-as-you-go scaling that physical-only infrastructure never could.

---

## Chapter 16: Introduction to Linux for IT Professionals

### Spark — A Question Before the Answer
You learned in Chapter 3 that Linux dominates cloud servers. But *why*, specifically, does an operating system originally built by a Finnish college student in 1991 as a hobby project end up running the majority of the world's most critical infrastructure — including, almost certainly, several systems you personally depend on today without knowing it?

### Why This Matters
From this chapter forward, Linux stops being background knowledge and becomes a skill you actively build. Every remaining systems chapter, every DevOps tool in Module 6, and the vast majority of real cloud servers you'll manage in your career will be Linux-based. This is the chapter where "knowing about Linux" becomes "starting to actually use Linux."

### Core Theory

**1. A Brief, Relevant History**
Linux began in 1991 when Linus Torvalds released a free, open-source kernel (the core part of an OS that talks directly to hardware). Because it was free and open — anyone could view, modify, and redistribute the code — it was rapidly adopted and improved by a global community of developers, rather than being controlled by a single company's roadmap and pricing decisions.

*Real example:* This open, collaborative model is precisely why **Linux today powers the majority of the world's supercomputers** (according to the TOP500 list, virtually all of the world's fastest supercomputers run Linux), the vast majority of public cloud infrastructure (AWS, Azure, GCP), and nearly all of the servers powering websites you use daily.

**2. The Linux Philosophy: Small Tools, Combined Powerfully**
Unix (which Linux is conceptually descended from) was built on a philosophy: create small, simple programs that each do one thing well, then combine them together to accomplish complex tasks. This is *why* the command line (Chapter 5) is so central to Linux — it's the connective tissue that lets you chain these small tools together.

**3. The Linux File System Hierarchy**
Unlike Windows' drive-letter system (`C:\`, `D:\`), Linux uses a single unified tree starting at `/` (root). Key directories you'll use constantly: `/home` (user files), `/etc` (configuration files), `/var` (logs and variable data), `/bin` (essential programs).

*Real example:* When a server is misbehaving in production, an experienced engineer's instinct is almost always to check `/var/log` first — system and application logs live there by convention across virtually all Linux distributions, making it one of the first places professionals look during an incident, regardless of which specific Linux distro or company they're working at.

**4. Root vs Regular Users**
Linux enforces a strict permissions model (foreshadowed in Chapter 4): a "root" user has unrestricted control over the entire system, while regular users have limited permissions. Professional practice is to avoid working as root directly — instead using `sudo` ("superuser do") to temporarily elevate privileges only for the specific command that needs it.

*Real example:* This is precisely the discipline that could have prevented incidents like the GitLab 2017 data loss mentioned in Chapter 5 — working as a limited user by default, and only elevating to root briefly and deliberately, adds a crucial moment of friction before destructive commands can execute.

### Hands-On Lab
1. If you haven't already, set up access to a Linux environment: search "free online Linux terminal" (several browser-based sandboxes exist, no install required) — or use WSL if you're on Windows (from Chapter 3).
2. Run `whoami` to confirm which user you're logged in as.
3. Run `ls /` and identify at least 3 directories from the list above (`/home`, `/etc`, `/var`, `/bin`).
4. Try running a command that requires elevated privileges (like installing a package) without `sudo`, observe the permission error, then try again with `sudo` in front of it.

### Quiz
1. Why did Linux's open-source nature lead to its rapid adoption, compared to closed-source alternatives?
2. What is the "Unix philosophy," in your own words?
3. Where would you typically look first to diagnose a misbehaving Linux server?
4. What's the difference between the root user and a regular user?
5. Why is using `sudo` for specific commands considered safer than working as root by default?

### Key Takeaways
- Linux's open-source, collaborative model is the direct historical reason it became the dominant server/cloud OS.
- The Unix philosophy (small tools, combined together) explains why the command line is so central to Linux work.
- Linux's unified file system tree (`/etc`, `/var`, `/home`, etc.) follows predictable conventions used across virtually all distributions.
- Root vs. regular user permissions, and disciplined use of `sudo`, are core professional safety habits — not just technical trivia.

---

## Chapter 17: Hands-On — Linux Essentials (Users, Permissions, Processes, Package Managers)

### Spark — A Question Before the Answer
A single Linux server might run a web application, a database, a monitoring tool, and a logging service all at once, managed by multiple team members with different access levels, while installing and updating dozens of software packages over its lifetime — all without ever needing a mouse. This chapter is where you build the actual hands-on fluency to make that work.

### Why This Matters
This is one of the most practically important chapters in the entire course. Real cloud job interviews frequently include live Linux administration tasks. The skills here — users, permissions, processes, package management — are used in literally every Linux server you will ever touch professionally, cloud or otherwise.

### Core Theory

**1. Users and Groups**
Linux supports multiple users on one system, each with their own permissions, and "groups" that bundle users together for shared access rules (e.g., a "developers" group that can all access certain application files).

- `useradd username` — create a new user
- `passwd username` — set/change a password
- `groups username` — see what groups a user belongs to

*Real example:* On a real production server, a company might create a separate Linux user account for each team member who needs access, rather than sharing one set of credentials — so that every action is individually traceable, which becomes critical during security audits or incident investigations (you'll see this principle again in cloud IAM, Module 5).

**2. File Permissions, Properly Explained**
Every file has three permission sets: **owner**, **group**, and **everyone else** — each with **read (r)**, **write (w)**, and **execute (x)** permissions. Running `ls -la` shows this as a string like `-rwxr-xr--`.

- `chmod 755 filename` — sets specific permission levels (owner: full control, group/others: read+execute only)
- `chown username filename` — changes who owns a file

*Real example:* A misconfigured permission — like a sensitive configuration file containing database passwords being set to "world-readable" — is a textbook way real breaches happen. Understanding *exactly* what `rwx` means for each of the three permission groups is what separates someone who can recognize this mistake instantly from someone who can't.

**3. Processes — What's Actually Running**
A process is a running instance of a program. Servers run dozens to hundreds simultaneously (web server process, database process, logging process, etc.).

- `ps aux` — list all currently running processes
- `top` (or `htop` if installed) — live, continuously updating view of process activity and resource usage
- `kill PID` — stop a specific process by its Process ID

*Real example:* When a cloud server suddenly becomes unresponsive, one of the very first diagnostic steps is running `top` to check if a single runaway process is consuming all available CPU or RAM — a common real-world cause of server slowdowns, and something you can often fix in seconds once correctly identified.

**4. Package Managers — Installing Software Properly**
Rather than downloading installers from random websites (a major security risk), Linux distributions use package managers that install software from verified, trusted repositories.

- `apt install packagename` (Ubuntu/Debian-based systems)
- `yum install packagename` or `dnf install packagename` (RHEL/CentOS-based systems)

*Real example:* When you eventually install tools like Docker (Chapter 22), Git, or Terraform (Module 5) on a Linux cloud server, you'll be using exactly these commands — this isn't a simplified teaching example, it's the literal real-world workflow.

### Hands-On Lab
1. In your Linux environment (from Chapter 16's lab), run `ps aux` and identify at least 3 running processes.
2. Create a test file with `touch testfile.txt`, then run `ls -la testfile.txt` and identify the permission string — write out what each character means.
3. Change its permissions using `chmod 644 testfile.txt`, then re-check with `ls -la` to confirm the change took effect.
4. Use your distro's package manager to install a simple tool (e.g., `sudo apt install tree` or equivalent), then run it to confirm installation succeeded.

### Quiz
1. Why would a company create individual Linux user accounts instead of sharing one login?
2. What do the `r`, `w`, and `x` permission letters each control?
3. What's the difference between `ps aux` and `top`?
4. Why are package managers (apt, yum) considered safer than downloading installers from random websites?
5. What real-world security risk does a "world-readable" sensitive file create?

### Key Takeaways
- User/group management enables traceable, individual access control — a security and accountability foundation.
- File permissions (`rwx` for owner/group/others) are a frequent real-world source of breaches when misconfigured.
- Process management tools (`ps`, `top`, `kill`) are essential for diagnosing and resolving server performance issues.
- Package managers provide secure, trusted software installation — the standard professional workflow, not a shortcut.

---

## Chapter 18: Storage Systems Explained (HDD vs SSD, RAID, Storage Types)

### Spark — A Question Before the Answer
A bank cannot afford to lose a single transaction record, even if a hard drive fails at the exact moment that transaction is being written. So how do real systems guarantee data survives hardware failure, when all hardware eventually fails? The answer is a set of strategies developed specifically because engineers assumed failure as a *certainty*, not a possibility.

### Why This Matters
Cloud storage options (Module 2 onward) — like AWS EBS, S3, and various database storage tiers — are all built on the storage concepts in this chapter. Understanding *why* certain storage choices exist (and what tradeoffs they represent) is what lets you make informed architecture decisions later, instead of just picking the first storage option you see in a dropdown menu.

### Core Theory

**1. HDD vs SSD, Revisited With Depth**
HDDs (Hard Disk Drives) store data magnetically on spinning physical disks, read by a moving mechanical arm — inherently slower and more failure-prone due to moving parts. SSDs (Solid State Drives) store data electronically with no moving parts, making them faster and more durable, but historically more expensive per gigabyte (though that gap has narrowed significantly).

*Real example:* Cloud providers offer both as deliberate tradeoffs: AWS's standard EBS volumes include cheaper HDD-based options (`st1`, `sc1` — optimized for large, sequential data like backups/logs) alongside faster SSD-based options (`gp3`, `io2` — optimized for databases and frequently-accessed data). Choosing wrong (e.g., putting a high-traffic database on HDD-based storage) is a real, common cause of poor application performance that engineers discover only after launch.

**2. RAID — Redundancy Against Hardware Failure**
RAID (Redundant Array of Independent Disks) combines multiple physical drives to improve performance, redundancy, or both. Different "RAID levels" make different tradeoffs:
- **RAID 0** — combines drives for speed, but *zero* redundancy (one drive fails, all data is lost)
- **RAID 1** — mirrors data across two drives identically (if one fails, the other has a complete copy)
- **RAID 5/6** — distributes data and "parity" information across multiple drives, allowing the array to survive one (RAID 5) or two (RAID 6) drive failures without data loss

*Real example:* Enterprise database servers handling critical financial or healthcare data are almost never run on a single drive — they're run on RAID configurations (often RAID 1 or RAID 10) specifically so that a hardware failure, which is statistically inevitable over a server's lifetime, doesn't mean data loss. This is a foundational assumption in real systems design: hardware *will* fail, so the system must survive that failure gracefully.

**3. Block Storage vs Object Storage vs File Storage**
- **Block storage** — raw storage divided into fixed-size blocks, like a traditional hard drive; used for things like operating system drives and databases that need fast, low-level access. (AWS EBS)
- **Object storage** — stores data as discrete "objects" (a file plus metadata) accessed via simple API calls rather than a file system; ideal for unstructured data like images, videos, backups at massive scale. (AWS S3)
- **File storage** — a shared file system (like a network drive) multiple servers can access simultaneously. (AWS EFS)

*Real example:* When **Netflix** stores billions of video files, it uses object storage (not block storage) — because object storage scales to essentially unlimited size, doesn't require managing a traditional file system, and is accessed simply via API calls from anywhere. Meanwhile, the actual database servers tracking your viewing history and account data likely run on fast block storage, because databases need the low-level, high-speed access block storage provides. Choosing the right storage *type* for the right job is a core cloud architecture skill you'll build throughout this course.

**4. The Real Lesson: Redundancy Isn't Paranoia, It's Math**
If a single hard drive has even a small annual failure probability, and a company runs 100,000 drives across its data centers (entirely realistic at cloud scale), drive failures aren't a rare edge case — they're a routine, daily occurrence. This is *why* cloud providers build redundancy into storage by default at a scale individual companies never could on their own — it's not optional engineering polish, it's a mathematical certainty they're designing around.

### Hands-On Lab
1. Search "AWS EBS volume types" and list the differences between at least two types (e.g., gp3 vs st1) — note their use cases as described in AWS's own documentation.
2. Search "RAID 1 vs RAID 5 diagram" and look at a visual explanation — write one sentence describing the tradeoff each makes.
3. Decide, in your own words: would you store a company's video backup archive on object storage or block storage? Justify your answer using concepts from this chapter.

### Quiz
1. What's the core physical difference between HDD and SSD that explains their speed difference?
2. What's the critical difference between RAID 0 and RAID 1?
3. What's the difference between block storage and object storage, and give one real example of each.
4. Why do cloud providers treat hardware failure as a certainty rather than a rare exception?
5. Why might a database use block storage while a video archive uses object storage?

### Key Takeaways
- HDD vs SSD is a speed/cost/durability tradeoff that directly maps to real cloud storage tier choices.
- RAID provides redundancy against hardware failure — different levels balance speed, cost, and fault tolerance differently.
- Block, object, and file storage serve fundamentally different use cases — choosing correctly is a real architecture skill.
- At cloud scale, hardware failure isn't an edge case to plan for — it's a statistical certainty systems are built to survive.
