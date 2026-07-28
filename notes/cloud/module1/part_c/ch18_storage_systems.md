# Module 1 — Part C: Systems & Servers
## Chapter 18: Storage Systems Explained
### (HDD vs SSD, RAID, Storage Types)

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 1] [Part C] — Chapter 18: Storage Systems Explained
Estimated time:   40 minutes theory + 20 minutes hands-on lab = 60 minutes
Prerequisites:    Chapter 17: Hands-On: Linux Essentials
```

**Learning Objectives:**
- Compare HDD and SSD at the architectural level and select appropriately for cloud workloads
- Explain RAID levels (0, 1, 5, 10) and the protection vs. performance tradeoffs each provides
- Describe the cloud storage taxonomy: block, object, file, and archive storage
- Use Linux storage commands (fdisk, lsblk, mount, df) for disk management

**Chapter bridge:** This chapter closes Part C (Systems & Servers) and directly leads into Part D (Virtualization, Chapter 19) — because virtual machines abstract storage as "virtual disks" that sit on top of the physical storage systems explained here. Understanding physical storage makes virtual disk configuration meaningful rather than arbitrary.

---

## SECTION 2 — SPARK

In 1956, IBM shipped the 305 RAMAC — the first hard disk drive. It weighed over 900 kg, required its own air conditioning unit, stored 5 megabytes of data across 50 spinning disks each the size of a pizza, and rented for $3,200/month. Today, a 5-terabyte drive (1 million times more storage) fits in your palm and costs $100.

But here's what's interesting: the fundamental mechanism of that 1956 drive — magnetic material arranged on a spinning platter, with a read/write head that physically moves to the data — is still the mechanism inside many of today's hard drives. The platters are smaller and spin faster, the heads are more precise, but the basic physics haven't changed in 70 years.

Meanwhile, a completely different approach — solid-state storage with no moving parts — has taken over laptops, phones, and increasingly cloud infrastructure. Understanding why both exist, and when each is appropriate, is a cloud engineering skill that directly translates to real infrastructure cost and performance decisions.

---

## SECTION 3 — WHY THIS MATTERS

When you provision storage in the cloud — EBS volumes in AWS, Persistent Disks in GCP, Managed Disks in Azure — you're choosing between storage tiers that correspond directly to the physical storage types explained here. `gp3` (general purpose SSD) vs `st1` (throughput-optimized HDD) vs `io2` (high-performance SSD) maps directly to the performance and cost tradeoffs in this chapter. Understanding RAID explains why cloud providers offer "replicated" and "non-replicated" storage. Understanding block vs object storage explains when to use EBS vs S3. This chapter makes cloud storage selection a reasoned choice, not a guess.

---

## SECTION 4 — CORE THEORY

---

### 1. HDD vs SSD — Mechanics and Tradeoffs

**HDD (Hard Disk Drive):**
One or more magnetic platters spin at 5,400–15,000 RPM. A read/write head on a mechanical arm moves across the platter surface to read/write data. The time for the head to move to the right track is called **seek time** (~5–15ms). The time for the right sector to rotate under the head is **rotational latency** (~2–8ms). Combined: **10–20ms average access time** for random reads.

For sequential reads (reading data in order, like streaming a large file), HDDs are fast — the head doesn't need to move much, and data flows at 100–200 MB/s. For random reads (database queries jumping between different rows), HDDs are painfully slow — the head moves constantly.

**SSD (Solid-State Drive):**
Flash memory cells store data as electrical charge. No moving parts. Access time: **0.01–0.1ms** (100–1000x faster than HDD). Random I/O: tens to hundreds of thousands of IOPS (Input/Output Operations Per Second). Sequential: 500 MB/s to 7+ GB/s for NVMe.

**The SSD tradeoff:** Flash memory cells wear out after a finite number of write cycles (~3,000–100,000 writes per cell). SSDs use **wear leveling** to distribute writes evenly and **overprovisioning** (extra hidden capacity used for wear leveling). High-write workloads (databases with constant writes) must account for SSD wear — cloud providers specify "drive writes per day" (DWPD) for their SSD-backed volumes.

| Metric | HDD | SSD (SATA) | SSD (NVMe) |
|--------|-----|-----------|-----------|
| Sequential Read | ~150 MB/s | ~550 MB/s | 3-7 GB/s |
| Random Read IOPS | ~100-200 | ~80,000 | ~500,000+ |
| Latency | 10-20ms | 0.05-0.1ms | 0.01-0.05ms |
| $/GB | $0.02-0.03 | $0.08-0.15 | $0.20-0.40 |
| Durability | Moving parts fail | No moving parts | No moving parts |

> **Real example: Netflix SSD Migration, 2012.** Netflix migrated their streaming infrastructure from HDD to SSD. Their workload — serving streaming data to millions of concurrent users — required extremely high random IOPS (different users watching different points in different movies). HDD latency was creating buffering. After SSD migration, streaming start times improved dramatically and buffering events dropped by 60%. The direct business impact: subscriber retention and satisfaction. SSD's cost premium was justified by measurable user experience improvement.

---

### 2. RAID — When One Drive Isn't Enough

RAID (Redundant Array of Independent Disks) combines multiple physical disks to provide either performance, redundancy (fault tolerance), or both. Understanding RAID explains why cloud storage can survive individual disk failures without data loss.

**RAID 0 — Striping (Performance, No Redundancy):**
Data is split ("striped") across multiple disks. Reading and writing happens in parallel — 2 disks give 2x the throughput of one disk. ZERO redundancy: if one disk fails, ALL data is lost.
- Use case: temporary data, video rendering scratch space, workloads where speed > data safety
- Not recommended for anything important

**RAID 1 — Mirroring (Redundancy, No Performance Gain):**
Every write is duplicated to two (or more) disks simultaneously. If one disk fails, the other has identical data — transparent recovery. Read performance can improve (read from either disk). Write performance is same as one disk. Storage efficiency: 50% (two 1TB drives = 1TB usable).
- Use case: OS drive, critical single-server data

**RAID 5 — Striping with Distributed Parity:**
Data and parity (error-correction) information is striped across 3+ disks. If one disk fails, data is reconstructed from parity. Minimum 3 disks; can lose 1 disk without data loss. Storage efficiency: ~66-80% depending on drive count. Read performance: excellent. Write: parity calculation adds overhead.
- Use case: NAS (Network Attached Storage), general-purpose server storage

**RAID 10 — Mirroring + Striping (Best of Both):**
Combines RAID 1 (mirroring) and RAID 0 (striping). Requires minimum 4 disks. Can lose one disk from each mirror pair. Performance: excellent (striped reads/writes). Redundancy: good. Cost: expensive (50% efficiency).
- Use case: high-performance databases, applications requiring both speed and durability

**Cloud RAID equivalent:** AWS EBS volumes are automatically replicated within an Availability Zone — effectively RAID 1 at the cloud infrastructure level. This is why individual EBS volumes have high durability without you configuring RAID. Multi-AZ database replication (RDS Multi-AZ) is conceptually RAID 1 across data centers.

> **Real example: GitLab Database RAID Failure, 2017.** (Related to the deletion incident from Chapter 4.) GitLab's post-mortem revealed that one of their backup strategies failed because the server's RAID array was in a degraded state — one of the mirrored disks had failed, and no one had noticed the alert. The backup ran from this single-disk array, making it potentially unreliable. The RAID was supposed to provide redundancy; the degraded array provided none. Monitoring RAID health (`mdadm --detail /dev/md0` on Linux software RAID) is as important as having RAID configured.

---

### 3. Cloud Storage Types — The Four-Tier Model

Cloud providers offer four fundamental storage types, each for different access patterns:

**Block Storage (EBS, Azure Managed Disk, GCP Persistent Disk):**
- Acts like a raw physical disk attached to a VM
- Must be formatted and mounted before use
- Attached to one VM at a time (usually)
- Low latency (microseconds), high IOPS
- **Use case:** OS disks, databases, any workload requiring POSIX filesystem semantics
- **AWS example:** `gp3` SSD ($0.08/GB/month), `io2` high-perf SSD ($0.125/GB/month), `st1` HDD ($0.045/GB/month)

**Object Storage (S3, Azure Blob, GCS):**
- Stores files as objects with metadata and a unique URL
- No filesystem — access via REST API (GET, PUT, DELETE)
- Near-infinite scalability, extremely durable (11 nines)
- Higher latency (~10-50ms per operation) vs block storage
- Extremely cheap ($0.023/GB/month for S3 Standard)
- **Use case:** static files, backups, archives, ML datasets, media, logs, website assets
- **Cannot be mounted as a filesystem and used as a database storage** (wrong tool for the job — common mistake)

**File Storage (EFS, Azure Files, GCP Filestore):**
- Shared filesystem accessible by multiple VMs simultaneously (via NFS or SMB)
- Scales automatically
- Higher cost than object storage, lower latency
- **Use case:** shared application state, home directories, CMS media libraries, applications that need a shared filesystem

**Archive Storage (S3 Glacier, Azure Archive):**
- Designed for long-term retention of rarely accessed data
- Very cheap ($0.004/GB/month)
- Very slow to retrieve (minutes to hours)
- **Use case:** compliance archives, disaster recovery copies, historical logs

**Ask yourself:** Your company needs to store 10TB of customer profile photos. Users request photos frequently. You also have 500TB of old log files that might be needed for audits but are rarely accessed. Which storage type for each, and why?

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. Why are SSDs preferred over HDDs for database workloads 
   specifically (not just for general performance)?

2. A server runs RAID 5 with 4 disks (each 1TB). 
   How many disks can fail without data loss, and how much 
   usable storage is available?

3. In the GitLab 2017 incident, a degraded RAID array contributed 
   to backup unreliability. What monitoring should have been in 
   place to catch the failed disk earlier?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Inspect and Manage Storage From the Linux Terminal
Platform:         Linux (or WSL on Windows)
Tools needed:     Terminal only (lsblk, df, du built-in)
Estimated time:   20 minutes
What you'll demonstrate: Storage inspection and management from 
                  CLI — the same commands used when managing 
                  cloud instance storage volumes.
```

**Step 1: List block devices**

```bash
# See all storage devices
lsblk

# Detailed version with filesystem info
lsblk -f

# On a typical Linux VM you'll see:
# sda      (primary disk)
# ├─sda1   (boot partition)
# ├─sda2   (EFI or swap)
# └─sda3   (root filesystem)
```

**Step 2: Check disk usage**

```bash
# Overall disk space
df -h

# Inode usage
df -i

# Which directory is consuming the most space?
du -sh /* 2>/dev/null | sort -hr | head -15

# Find the top 10 largest files on the system
sudo find / -type f -size +100M 2>/dev/null | xargs du -sh | sort -hr | head -10
```

**Step 3: Create and use a virtual disk (disk image)**

```bash
# Create a 50MB file to simulate a disk
dd if=/dev/zero of=/tmp/virtual_disk.img bs=1M count=50

# Format it as ext4
mkfs.ext4 /tmp/virtual_disk.img

# Mount it
mkdir -p /tmp/virtual_mount
sudo mount -o loop /tmp/virtual_disk.img /tmp/virtual_mount

# Verify it's mounted
df -h /tmp/virtual_mount
lsblk | grep loop

# Use it
echo "Hello from virtual disk!" | sudo tee /tmp/virtual_mount/test.txt
ls -la /tmp/virtual_mount/

# Unmount
sudo umount /tmp/virtual_mount
```

This simulates exactly what happens when you attach an EBS volume to an EC2 instance — it appears as a block device, you format it, you mount it.

**Step 4: Check disk I/O performance**

```bash
# Install iostat (part of sysstat)
sudo apt install sysstat -y 2>/dev/null || sudo dnf install sysstat -y 2>/dev/null

# Monitor disk I/O in real time
iostat -x 1 5   # Extended stats, 1-second intervals, 5 samples

# Look for:
# %util: disk utilization (>80% = potentially saturated)
# await: average I/O wait time in ms (HDD: 10-20ms normal, SSD: <1ms normal)
# r/s, w/s: reads and writes per second (IOPS)
```

**Step 5: Simulate the disk I/O comparison (sequential vs random)**

```bash
# Sequential write test
dd if=/dev/zero of=/tmp/seq_test bs=1M count=200 oflag=direct 2>&1 | grep copied

# Sequential read test
dd if=/tmp/seq_test of=/dev/null bs=1M 2>&1 | grep copied

# Clean up
rm /tmp/seq_test /tmp/virtual_disk.img
```

```
Lab reflection:
You've mounted a virtual disk — the same operation you perform 
when you attach a new EBS volume to an EC2 instance.

Here's what to think about: when you create a new EBS volume 
in AWS and attach it to an EC2 instance, it appears as /dev/xvdf 
(or similar). At this point, can you immediately use it to store files?

What two steps do you need to perform first, and which commands 
from this lab would you use?

(You'll do this exact process in Module 5, Chapter 14, 
when you provision compute resources with Terraform.)
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 18

1. A database administrator is choosing between HDD (st1) and 
   SSD (gp3) EBS volumes for a PostgreSQL database. 
   The database does mostly sequential scans (data warehouse) 
   vs. a database doing mostly random row lookups (OLTP system). 
   Which storage type is appropriate for each, and why?

2. You configure RAID 10 with 4 disks of 2TB each. 
   How much usable storage do you have? 
   How many disks can fail without data loss?

3. In the GitLab degraded RAID scenario, the backup that ran 
   from a single-disk RAID-1 array was "potentially unreliable." 
   Why — what does a degraded RAID-1 actually mean in terms 
   of data integrity guarantees?

4. A developer wants to use S3 (object storage) as the filesystem 
   for their PostgreSQL database files (replacing an EBS volume). 
   What specific technical problem will they encounter?

5. True/False: "EBS gp3 volumes are always the best choice for 
   any EC2 workload because they're SSD-based."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **HDD = sequential speed, low cost. SSD = random I/O speed, higher cost.** Databases need random IOPS (SSD). Large sequential reads (video, archives) can use HDD. Choose based on I/O pattern, not just "bigger = better."
- **RAID: 0=speed-only, 1=mirror, 5=distributed parity, 10=mirror+stripe.** Cloud EBS is RAID 1 equivalent within an AZ. RAID health monitoring is as important as RAID configuration.
- **Cloud storage taxonomy: Block (databases), Object (files/backups), File (shared filesystems), Archive (long-term).** Each type has a fundamentally different access model. Mismatching workload to storage type is a common and expensive architectural mistake.
- **`lsblk`, `df`, `du`, `mount`, `iostat` are your storage diagnostic toolkit.** Used identically on laptops and cloud servers. `iostat %util` and `await` reveal whether storage is the bottleneck.
- **Real incidents (Netflix buffering, GitLab RAID degradation) trace to these fundamentals** — storage type mismatches and unmonitored RAID failures are operational disasters waiting to happen.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** Data warehouse (sequential scans): HDD `st1` is appropriate. Sequential throughput is the bottleneck, not random IOPS. `st1` offers high sequential throughput at lower cost. OLTP (random row lookups): SSD `gp3` is required. Each query jumps to specific rows by index — random I/O. On HDD, each random read adds 10-20ms seek time, catastrophically limiting query performance under any load. SSD provides microsecond random access.

**Q2:** RAID 10 with 4 × 2TB disks: usable storage = (4 × 2TB) / 2 = 4TB (50% efficiency due to mirroring). Failure tolerance: can lose one disk from each mirror pair. Best case: 2 disks can fail if one from each mirror pair. Worst case: if both disks in one mirror pair fail, all data is lost. Realistic answer: up to 2 disk failures (one per mirror pair).

**Q3:** A degraded RAID-1 means one disk has failed and the array is operating from a single disk without redundancy. This means: (1) No protection against a second disk failure — if the surviving disk fails during a backup, all data is lost. (2) Read performance degradation (can no longer read from two disks). (3) The backup taken from this state is as reliable as the single remaining disk — which, being in a degraded array, may itself be under additional stress (serving all I/O alone). The backup is not "corrupt" but the reliability guarantee of RAID-1 is gone while degraded.

**Q4:** S3 is object storage — it provides a REST API (PUT, GET, DELETE) not a POSIX filesystem interface. PostgreSQL requires: (1) random read/write access to specific byte offsets within files, (2) file locking for crash recovery, (3) fsync() to guarantee writes are durable. S3 provides none of these. PostgreSQL cannot write its data files to S3 directly without a compatibility layer (like s3fs which is not suitable for databases due to latency and locking). The result: PostgreSQL would fail to operate, crash on startup, or corrupt data.

**Q5:** False. gp3 is appropriate for most general workloads but not all. Workloads where HDD is better: (1) Large sequential throughput with massive datasets (data warehouses, log processing) — `st1` HDD provides 250-500 MB/s throughput at ~$0.045/GB vs gp3 at $0.08/GB. (2) Archives and backups — `sc1` cold HDD at $0.015/GB. Workloads where gp3 is insufficient: very high IOPS databases requiring `io2` with 64,000+ IOPS. gp3 caps at 16,000 IOPS. The right storage choice depends on the workload's I/O pattern, size, and performance requirements.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"RAID Explained in 5 Minutes" — PowerCert Animated Videos** — Best visual RAID explainer available
- **"HDD vs SSD - As Fast As Possible" — Techquickie** — Quick mechanical vs electronic comparison
- **"AWS Storage Options Explained" — Be A Better Dev** — Practical comparison of EBS, S3, EFS, Glacier

**📖 Articles**
- **AWS Documentation: "Amazon EBS volume types"** — Complete reference for gp3, io2, st1, sc1 specifications and pricing
- **"Understanding RAID levels" — NetApp** — Thorough technical reference for RAID configurations
- **"Choosing the right S3 storage class" — AWS Blog** — When to use Standard, Infrequent Access, Glacier

**🔗 Practice**
- **AWS Free Tier:** Attach a gp3 EBS volume to your EC2 instance, format it, mount it, and run `iostat -x` to observe I/O patterns — identical to what production teams do when evaluating storage performance.

---

*End of Module 1, Part C — Systems & Servers*
*Part C Complete: Chapters 14–18*
*Next: Part D — Virtualization: The Bridge to Cloud (Chapters 19–22)*
