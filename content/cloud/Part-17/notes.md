# Part 17 — Scalability & Performance

Now that we understand systems thinking and identifying Single Points of Failure, we must examine how systems scale to handle growing demands, and how to measure and optimize their performance. This part covers vertical vs horizontal scaling, load balancing algorithms, caching strategies, latency, throughput, and bottleneck diagnosis.

---

## Chapter 6: Vertical vs Horizontal Scaling Explained

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Differentiate between vertical and horizontal scaling.
- Articulate the operational tradeoffs of each scaling model.
- Explain why modern cloud-native applications strongly favor horizontal scaling.

---

### Spark — A Question Before the Answer
If a small delivery wagon is carrying more packages than it can hold, you have two choices: buy a bigger, more expensive wagon (with a larger engine), or buy five more identical delivery wagons and hire five drivers. Which choice is more sustainable as your business grows to cover the entire country?

### Why This Matters
In the cloud, you don't buy hardware; you rent capacity. Knowing whether to scale "up" or "out" determines your budget, your software design, and your ability to survive sudden viral growth. Architecting for the wrong type of scale can lead to system collapse during high-traffic events.

### Core Theory

**1. Vertical Scaling (Scaling UP)**
Adding more power (CPU, RAM, faster storage) to an existing server. Instead of a 2-core machine, you rent a 16-core machine.
- **Pros:** Simple. No software changes required. The application runs exactly as it did before, just faster.
- **Cons:** Hard physical limits (you can only buy a server so large), and requires downtime. To swap to a bigger instance in the cloud, you must stop the VM, change the instance type, and restart it.
- **Use Case:** Legacy monolithic applications, small databases, or simple batch processing scripts.

**2. Horizontal Scaling (Scaling OUT)**
Adding more servers to your infrastructure pool. Instead of one 16-core machine, you run eight 2-core machines.
- **Pros:** Practically limitless scale. High availability (if one server dies, the other seven keep running). No downtime to scale—you just add nodes to the pool.
- **Cons:** Complex. Requires a load balancer to distribute traffic. Requires the application to be *stateless* (since a user's request might hit Server A on minute one, and Server B on minute two).
- **Use Case:** Web applications, microservices, containerized workloads.

*Real example:* In the early 2000s, websites scaled vertically. When MySpace grew rapidly, they simply bought the largest, most expensive physical database servers money could buy, until they hit the physical limit of hardware engineering. When Facebook launched, they architected their system to scale horizontally—using thousands of cheap, commodity servers working together. Facebook's architecture survived; MySpace collapsed under its own weight.

### Theory Checkpoint
1. Why does vertical scaling usually require downtime?
2. What architectural component is absolutely mandatory if you want to scale horizontally?

---

### Hands-On Lab
*No specific lab for this chapter. Reflect on the difference.*

---

### Quiz
1. A company running an old Java monolith that stores user session data in local RAM cannot be easily scaled out. Why?
2. True/False: Horizontal scaling removes the Single Point of Failure (SPOF) at the compute layer.

### Key Takeaways
- Vertical scaling is simple but has a hard ceiling and requires downtime.
- Horizontal scaling is complex but allows infinite growth and high availability.
- Cloud-native architecture defaults to horizontal scaling using small, ephemeral instances.

### Instructor Answer Key
1. Because the application is stateful. If scaled horizontally, a user might log in on Server 1 (storing their session in Server 1's RAM). Their next click might route to Server 2, which has no record of them, logging them out.
2. True. If you have 5 servers and one dies, the other 4 take over. Vertical scaling (1 giant server) remains a SPOF.

---

## Chapter 7: Load Balancing Fundamentals

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Define the role of a Load Balancer in a distributed system.
- Compare common load balancing algorithms.
- Explain how health checks prevent catastrophic failures.

---

### Spark — A Question Before the Answer
If 100 hungry customers arrive at a restaurant with 5 cashiers, but all 100 customers line up behind Cashier 1, what happens to the service? The restaurant is slow, despite having 4 empty registers. How do you direct customers evenly to all 5 registers? The network equivalent of that host directing traffic is a Load Balancer.

### Why This Matters
You cannot scale horizontally without load balancing. Load balancers sit at the entrance of your system, distributing incoming traffic across your pool of servers. Without them, horizontal scaling is just a room full of idle servers while one server burns down.

### Core Theory

**1. The Role of a Load Balancer (LB)**
An LB acts as the "traffic cop" for your application. When a user requests your website, they actually connect to the Load Balancer. The LB then silently forwards that request to one of the backend servers, receives the response, and sends it back to the user.

**2. Load Balancing Algorithms**
How does the LB decide which server gets the next request?
- **Round Robin:** Sends requests sequentially down the list (Server 1, then 2, then 3, then 1...). Simple and effective if all servers are identical.
- **Least Connections:** Directs traffic to the server with the fewest active sessions. Better for long-lived connections (like websockets or video streaming).
- **IP Hash:** Uses the client's IP address to mathematically ensure they always connect to the same backend server. This is used for "session stickiness" when supporting legacy applications.

**3. Health Checks**
An LB must know if a server is dead. It constantly sends "ping" requests (e.g., requesting the `/health` endpoint every 5 seconds). If a server fails to respond 3 times in a row, the LB marks it "Unhealthy" and stops sending it traffic.

### Theory Checkpoint
1. Why is Round Robin problematic if your servers are different sizes (e.g., one large server, one small server)?
2. What happens if a backend server fails a health check?

---

### Hands-On Lab
*This theory prepares you for Module 7 projects where you will provision real cloud load balancers.*

---

### Quiz
1. A video streaming service uses long-lived connections. Which load balancing algorithm prevents newly added servers from sitting idle?
2. If your load balancer fails, your entire application goes offline, making the LB a Single Point of Failure. How do cloud providers solve this?

### Key Takeaways
- Load balancers are the prerequisites for horizontal scaling.
- Algorithms dictate traffic flow: Round Robin for simple apps, Least Connections for long-lived apps.
- Health checks are the automated mechanism that provides high availability.

### Instructor Answer Key
1. Least Connections. Round Robin would just send the next request to the new server, but the old servers would still be bogged down by their existing, long video streams.
2. Cloud providers build their managed Load Balancers (like AWS ALB) as highly available, distributed systems themselves. Behind the scenes, the "single" load balancer you provision is actually a fleet of nodes spanning multiple data centers.

---

## Chapter 8: Caching — Why and Where It Matters

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Explain the speed hierarchy of computer memory and storage.
- Define Cache Hit and Cache Miss.
- Identify optimal use cases for caching in a web application.

---

### Spark — A Question Before the Answer
If a librarian is asked for the same popular book 50 times in one morning, does she walk to the back storage vault every single time? No—she leaves the book on the front desk where she can reach it in a second. In computer systems, that front desk is a cache.

### Why This Matters
Databases are fundamentally slow because they usually read from physical disks. Reading from memory (RAM) is orders of magnitude faster. By strategically placing a cache in front of your database, you can speed up page load times by 10x to 100x and save thousands of dollars on database scaling costs.

### Core Theory

**1. What is a Cache?**
A high-speed data storage layer (almost always in RAM) that stores a subset of transient data. Systems like Redis or Memcached are purpose-built in-memory caches.

**2. The Mechanics of Caching**
- **Cache Hit:** The application asks the cache for data (e.g., "Top 10 High Scores"). The data is there. The response is instantaneous.
- **Cache Miss:** The data is not in the cache. The application must query the slow database, wait for the result, return it to the user, and *then save a copy in the cache* for the next user.

**3. Cache Eviction Policies**
RAM is expensive, so caches are small. When the cache is full, it must delete old data to make room for new data. The most common policy is **LRU (Least Recently Used)**, which discards the data that hasn't been requested in the longest time.

*Real example:* X (formerly Twitter) generates millions of timeline reads per second. If every read queried a relational database, the platform would instantly crash. Instead, when a celebrity tweets, the tweet is immediately written into a Redis cache. Millions of followers read the tweet directly from RAM, completely bypassing the database.

### Theory Checkpoint
1. Why don't we just store all data in a cache instead of a database?
2. Explain the difference between a Cache Hit and a Cache Miss.

---

### Hands-On Lab
*No lab required.*

---

### Quiz
1. If a website's landing page is perfectly static and identical for all users, what type of caching is most effective?
2. Why is an LRU eviction policy effective for news websites?

### Key Takeaways
- Caching trades storage permanence for extreme read speed.
- A cache miss requires fetching from the database and populating the cache.
- Implementing caching is often the cheapest way to dramatically improve system performance without upgrading hardware.

### Instructor Answer Key
1. A Content Delivery Network (CDN), which caches the entire HTML page at edge locations geographically close to the users.
2. News is highly temporal. Yesterday's headline is rarely read today. LRU naturally evicts old news articles as space is needed for breaking news, without manual intervention.

---

## Chapter 9: Latency vs Throughput — The Real Difference

### Learning Objectives
**Estimated time:** 10 minutes theory

**Learning objectives:**
- Distinguish between latency (delay) and throughput (capacity).
- Evaluate system requirements to determine whether to optimize for latency or throughput.

---

### Spark — A Question Before the Answer
If a giant water pipe can transport 10,000 gallons of water per minute across the state, but it takes 3 hours for the first drop of water to travel from the reservoir to your tap, is the pipe fast or slow? It depends on how you measure: the rate of flow (throughput) is high, but the transit time (latency) is slow.

### Why This Matters
In systems design, confusing latency and throughput leads to bad architecture decisions. If you're building a live multiplayer game, you need low latency. If you're building a nightly data backup script, you need high throughput. You rarely get to maximize both.

### Core Theory

**1. Latency (The Delay)**
The time it takes for a single unit of data to travel from source to destination (measured in milliseconds). 
- *Analogy:* The speed of a sports car on an empty highway.
- *Use cases demanding low latency:* Voice over IP (VoIP), live chat, high-frequency stock trading.

**2. Throughput (The Volume)**
The amount of data or requests processed by the system within a given time period (e.g., requests per second, gigabits per second).
- *Analogy:* A massive cargo train. It takes a long time to arrive, but it brings thousands of tons of cargo when it does.
- *Use cases demanding high throughput:* Video streaming, big data analytics, database backups.

### Theory Checkpoint
1. If you zip a massive folder into an archive before sending it over the network, are you optimizing for latency or throughput?

---

### Hands-On Lab
*No lab required.*

---

### Quiz
1. A financial firm executes trades based on news events. Do they prioritize latency or throughput?
2. Netflix streaming a 4K movie to your TV prioritizes which metric?

### Key Takeaways
- Latency is transit time. Throughput is volume over time.
- Designing for one often requires sacrificing the other.

### Instructor Answer Key
1. Latency. Being 1 millisecond faster than a competitor wins the trade. The data size (a "buy" command) is tiny, so throughput doesn't matter.
2. Throughput. Once the movie starts buffering, a delay of 2 seconds doesn't matter, as long as a massive volume of data consistently arrives to maintain 4K quality.

---

## Chapter 10: Bottleneck Analysis — Finding the Weakest Link

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Identify the four primary system bottlenecks (CPU, Memory, I/O, Network).
- Explain the Theory of Constraints in a computing context.

---

### Spark — A Question Before the Answer
If you have a funnel with a wide mouth and a narrow neck, pouring water in faster only results in the water backing up and spilling over the sides. The speed at which the funnel drains is limited entirely by the width of the neck. In cloud systems, what is the "neck" of your funnel?

### Why This Matters
Your system is only as fast as its slowest component. If your database is pegged at 100% CPU, adding 50 more web servers will not make your website faster—it will actually overwhelm the database further, causing a total system crash.

### Core Theory

**1. The Theory of Constraints**
Any system has exactly one primary bottleneck at any given time. Improving any part of the system *other* than the bottleneck is a waste of time and money.

**2. The Four Common Bottlenecks**
- **CPU Bound:** The processor is at 100%. Usually caused by complex calculations, video encoding, or heavy encryption (SSL/TLS handshakes).
- **Memory Bound:** The system runs out of RAM. When this happens, the Operating System is forced to temporarily swap memory to the hard drive, destroying performance.
- **I/O Bound (Input/Output):** The CPU is idle, waiting for a slow physical disk to read data, or waiting for a slow external API to respond. Databases are famously I/O bound.
- **Network Bound:** The system has maxed out its bandwidth limits (e.g., trying to send 10 Gbps of data through a 1 Gbps network card).

### Theory Checkpoint
1. If a server's CPU is at 5% utilization, but requests take 5 seconds to complete, what kind of bottleneck is most likely occurring?

---

### Hands-On Lab
*Covered in Chapter 11.*

---

### Quiz
1. Why does adding more web servers sometimes cause an application to crash faster?
2. If your application compresses massive video files, what resource is likely to become the bottleneck?

### Key Takeaways
- A system is only as fast as its bottleneck.
- Throwing horizontal compute scale at an I/O bottleneck is a rookie mistake that causes outages.

### Instructor Answer Key
1. Because the web servers weren't the bottleneck—the database was (I/O bound). Adding more web servers just sends more concurrent queries to an already-failing database, accelerating the crash.
2. CPU. Video compression is highly computationally intensive.

---

## Chapter 11: Hands-On: Diagnosing a Slow System (Case Study)

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Synthesize knowledge of scaling, caching, and bottlenecks to diagnose a system failure.

---

### Spark — A Question Before the Answer
Theory is useless until applied. Can you take the concepts of Chapters 6-10 and prevent a catastrophic outage?

### Why This Matters
In system design interviews, the interviewer will describe a failing system and ask you to fix it. This case study simulates that exact scenario.

### Hands-On Lab
**Case Study:** You run a ticketing website. During a major concert release, the site slows down to a crawl. The web servers report 20% CPU utilization, but user requests are timing out (`504 Gateway Timeout`).
1. **Identify the Bottleneck:** Based on the low CPU on the web servers, what is the most likely bottleneck?
2. **Propose Mitigation:** If the database is I/O bound because millions of users are refreshing the page to see if tickets are available, what component from Chapter 8 would you introduce?
3. **Write the Solution:** Write a short paragraph explaining exactly where the cache sits in the architecture and what specific data it stores to relieve the database.

### Quiz
1. (Self-reflection) Did you successfully identify that the database was I/O bound? 

### Key Takeaways
- Diagnostic thinking requires eliminating what *isn't* broken (e.g., ruling out CPU bottlenecks) to find what is.

### Instructor Answer Key
1. The bottleneck is the database (I/O bound).
2. A Redis or Memcached in-memory cache.
3. The cache sits between the web servers and the database. It stores the "Ticket Availability Count." When millions of users refresh the page, the web servers query the cache (RAM) instead of the database. The database is only queried when a ticket is actually purchased, dropping database load by 99%.

---

## 📚 Learning Resources & Visual Masterclasses

**📹 YouTube Videos & Visuals**
* **Systems Architecture & Scaling**:
  * [Load Balancers Explained (Animated)](https://www.youtube.com/watch?v=28a745M9_bw)
  * [What is Caching? (Animated)](https://www.youtube.com/watch?v=U3RkDLt1b5g)
  * [Latency vs Throughput Explained Simply](https://www.youtube.com/watch?v=Vl3jP1oG7C8)

**📖 Articles & Documentation**
- *The System Design Primer (GitHub):* One of the most famous open-source guides to understanding scalability and bottlenecks. Highly recommended reading for aspiring architects.

---

## Practice Quiz

1. Review the chapters and write a summary paragraph of the main objective for this part.
2. Outline how the topics in this part build upon the preceding section's concepts.
