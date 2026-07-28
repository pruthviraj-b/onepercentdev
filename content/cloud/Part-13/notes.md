# Part 13 — Core Services Compared

After selecting your cloud platform (Module 2, Part A), the next step is understanding how each cloud provider implements the same fundamental building blocks differently. This part provides a side-by-side comparison of compute, storage, database, networking, identity, and serverless services across AWS, Azure, and GCP — so you can read any cloud architecture discussion and understand the equivalent service on your platform.

---

## Chapter 6: Compute Services Compared — EC2 vs. Azure VMs vs. Compute Engine

### Learning Objectives

**Estimated time:** 25 minutes theory + 15 minutes lab = 40 minutes  
**Prerequisites:** Module 2, Part A — Chapter 5: Market Share & Industry Trends (where to find jobs)

**Learning objectives:**
- By the end of this chapter, you will be able to compare EC2, Azure VMs, and Compute Engine across instance naming, pricing models, and operational concepts
- By the end of this chapter, you will be able to select the appropriate compute instance type for a given workload description
- By the end of this chapter, you will be able to explain why the differences in naming conventions across providers don't indicate fundamental differences in capability

**Chapter bridge:** This chapter gives you the cross-provider vocabulary for compute, which directly enables Chapter 9 (Networking Services — VPC across providers) and Module 3 (Systems Thinking), where you'll design architectures that span these services.

---

### Spark — A Question Before the Answer

If you've already learned that AWS EC2 can run a web server, why would you need to learn what an "Azure D-series VM" is, or what a "Google n2-standard-8 instance" does? They all run virtual machines — they're the same thing, right?

Almost. The underlying technology is indeed the same: hypervisor-based virtual machines running on physical hardware in a data center. But the instance naming conventions, billing granularities, default network configurations, lifecycle management options, and integrated services around compute differ enough that a job listing for "Azure cloud engineer" and one for "AWS cloud engineer" are describing meaningfully different skill sets. Understanding the differences — and more importantly, understanding that they're surface differences over a shared architecture — is what makes you portable across the cloud market.

---

### Why This Matters

In a cloud engineering or DevOps role, you will encounter architecture discussions that reference services from all three major providers. If your client's legacy infrastructure is on Azure but your new project is on AWS, you need to translate between them fluently. If a team lead says "we're moving from D4s_v3 to m6i.2xlarge," you need to know they're discussing equivalent-class VMs on Azure and AWS respectively. This translation literacy is what makes a senior cloud professional vs. a single-cloud specialist.

---

### Core Theory

**1. The Shared Architecture — Virtual Machines Everywhere**

All three providers deliver the same fundamental unit: a virtual machine running on a physical server in their data center, partitioned by a hypervisor. AWS uses a custom hypervisor (the Nitro System, derived from Xen/KVM). Azure uses Hyper-V (Microsoft's hypervisor). GCP uses KVM. The technology differences matter for performance tuning at senior levels — for most workloads, the operational concepts are identical.

What you configure in all three: CPU cores (vCPUs), RAM (GB), storage (attached or local), network bandwidth, and OS image.

**2. AWS EC2 — The Naming System**

EC2 instance types follow the pattern: `[family][generation].[size]`

- `t3.micro` — T family (burstable, cheap), generation 3, micro size
- `m6i.2xlarge` — M family (general purpose), generation 6, Intel, 2xlarge (8 vCPU, 32 GB RAM)
- `c7g.4xlarge` — C family (compute optimized), generation 7, Graviton (ARM), 4xlarge

Key families: T (burstable, cheapest), M (general purpose, balanced), C (compute optimized), R (memory optimized), G (GPU), I (storage optimized), P (ML/accelerated).

> **Real example:** Netflix moved significant workloads from Intel-based EC2 instances to Graviton (ARM-based) instances in 2021–2022, achieving 20–40% cost savings for comparable performance on their video encoding workloads. This is the kind of instance family decision that requires understanding AWS's compute naming system.

**3. Azure VMs — The Naming System**

Azure VM sizes follow the pattern: `[family][sub-family][vCPUs]_[version][feature]`

- `B2s` — B series (burstable), 2 vCPUs, small
- `D4s_v5` — D series (general purpose), 4 vCPUs, premium storage capable, version 5
- `F8s_v2` — F series (compute optimized), 8 vCPUs, premium storage, version 2

Key families: B (burstable), D (general purpose), F (compute optimized), E (memory optimized), N (GPU), L (storage optimized).

**4. GCP Compute Engine — The Naming System**

GCP uses a different model: **machine types** with more explicit naming:

- `e2-micro` — E2 family (cost-optimized), micro
- `n2-standard-8` — N2 family (general purpose), standard performance profile, 8 vCPUs
- `c2-standard-60` — C2 family (compute optimized), 60 vCPUs

GCP also offers **custom machine types** — you specify the exact vCPU count and RAM you need, rather than choosing from a fixed list. This is a significant differentiator: `custom-6-23552` = 6 vCPUs, 23 GB RAM. No equivalent flexibility exists in EC2 or Azure VM sizes (though their spot/preemptible pricing is similar).

**5. Cross-Provider Equivalents**

| Workload Type | AWS EC2 | Azure VM | GCP Compute Engine |
|--------------|---------|----------|-------------------|
| Cheap testing | t3.micro | B1s | e2-micro |
| General purpose | m6i.large | D2s_v5 | n2-standard-2 |
| Compute optimized | c7g.large | F2s_v2 | c2-standard-4 |
| Memory optimized | r6i.large | E4s_v5 | m2-ultramem-208 |
| GPU | p3.2xlarge | NC6s_v3 | a2-highgpu-1g |

---

### Theory Checkpoint

1. What is the instance naming pattern for EC2, and what does each component mean?
2. What is GCP's unique differentiator in compute sizing that AWS and Azure don't offer?
3. What does the 't' in t3.micro indicate about its performance model?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Compare Instance Pricing Across Providers**  
**Platform:** Browser  
**Tools needed:** Web browser  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** Side-by-side pricing comparison for equivalent general-purpose instances.

**Step 1:** Open three browser tabs:
- AWS: https://aws.amazon.com/ec2/pricing/on-demand/
- Azure: https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/
- GCP: https://cloud.google.com/compute/vm-instance-pricing

**Step 2:** Find the on-demand hourly price for a general-purpose instance in the US East region (closest equivalent):
- AWS: `m6i.xlarge` (4 vCPU, 16 GB RAM)
- Azure: `D4s v5` (4 vCPU, 16 GB RAM)
- GCP: `n2-standard-4` (4 vCPU, 16 GB RAM)

**Step 3:** Calculate the monthly cost (720 hours) for each.

**Step 4:** Check the 1-year reserved/committed use discount for each provider and recalculate.

**What success looks like:** A table with on-demand and reserved prices for all three providers. Note which provider is cheapest for on-demand vs. reserved — the answer may surprise you.

**Lab reflection:** On-demand prices are relatively similar across providers. Why would an organization choose AWS over GCP or Azure if the compute price is nearly equivalent? What factors beyond raw compute pricing drive cloud vendor selection?

---

### Quiz

**Quiz — Chapter 6**

1. What does `c7g.4xlarge` decode to in EC2 naming, and what does each component tell you about the instance?

2. Why does AWS's Graviton (ARM-based) family often provide cost advantages over Intel-equivalent instances, and what workloads benefit most from this?

3. In the Netflix Graviton migration example, what was the specific metric that justified the migration effort, and how does this illustrate the business case for instance selection optimization?

4. A DevOps engineer needs to provision 10 VMs with exactly 6 vCPUs and 22 GB RAM. Which provider's compute offering handles this most naturally, and why?

5. True/False: Azure D4s_v5 and AWS m6i.xlarge are identical in performance because they have the same vCPU and RAM specifications. Explain your answer.

---

### Key Takeaways

- **EC2, Azure VMs, and GCP Compute Engine all implement the same hypervisor VM model** — the differences are naming conventions, billing granularity, ecosystem integration, and specific performance characteristics, not fundamentally different technology.
- **EC2 naming:** `[family][generation].[size]` — T(burstable), M(general), C(compute), R(memory), G(GPU). GCP custom machine types offer unique workload-specific sizing flexibility.
- **Instance selection is a tradeoff (cost vs. performance vs. portability)** — understanding the naming systems across providers is what allows you to make this tradeoff fluently in multi-cloud discussions.
- **Reserved/committed use pricing** reduces costs 30–60% vs. on-demand — every production workload with predictable compute needs should use reserved pricing.
- Real optimization decisions (Netflix Graviton migration, 20–40% savings) trace to understanding instance families deeply, not just picking the cheapest option — compute optimization is an ongoing engineering practice, not a one-time configuration.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** `c7g.4xlarge` decodes: c = compute-optimized family (high vCPU:RAM ratio for compute-intensive workloads), 7 = generation 7 (newer = better price/performance), g = Graviton (AWS ARM processor, not Intel), 4xlarge = size tier (16 vCPUs, 32 GB RAM for c-family 4xlarge). Complete decode: 7th-generation compute-optimized ARM instance, 16 vCPUs, 32 GB RAM.

**Q2:** Graviton (ARM) provides cost advantage because: AWS designs its own ARM chips optimized for cloud workloads (no Intel licensing cost), ARM architecture is more power-efficient per compute unit (lower operational cost for AWS = lower price for customers), and AWS passes ~20-40% savings to customers. Workloads that benefit most: containerized microservices (easily recompiled for ARM), web servers, databases with ARM-native builds, video encoding and media processing (Netflix's use case).

**Q3:** Netflix's specific metric: 20–40% cost reduction for "comparable performance" on video encoding workloads. This illustrates the business case because: video encoding is compute-intensive (C family candidate), runs continuously (high utilization justifies investigation), and is latency-tolerant (migration risk is manageable). The business case = (compute cost savings × fleet size) > (migration engineering effort cost). At Netflix's scale, 20% savings on a large EC2 fleet is millions of dollars annually.

**Q4:** GCP handles this most naturally through custom machine types: `custom-6-22528` (6 vCPUs, 22 GB RAM — GCP allows any RAM in 256 MB increments above minimum). AWS and Azure only offer fixed instance sizes — you'd have to provision `m6i.xlarge` (4 vCPUs, 16 GB) or `m6i.2xlarge` (8 vCPUs, 32 GB), both of which are wrong-sized for this exact requirement, wasting either compute capacity or paying for excess RAM.

**Q5:** False. Same vCPU and RAM specs do not guarantee identical performance because: (a) underlying processor family differs (Intel Xeon on AWS, AMD EPYC or Intel on Azure — different clock speeds, cache sizes, instruction extensions), (b) hypervisor overhead differs (Nitro vs. Hyper-V), (c) network bandwidth allocation differs, (d) local storage I/O characteristics differ, (e) the "v5" designation on Azure indicates enhanced networking capabilities not present in older Azure generations. For most workloads the difference is small; for performance-sensitive applications (databases, HFT, video processing), benchmark testing on the actual instance type is essential before committing to production sizing.

---

### Learning Resources

**📹 Video Resources**
- *AWS EC2 Instance Types Explained* — AWS official YouTube channel — clear breakdown of family naming
- *Azure VM Size Naming Conventions* — Microsoft Azure Docs team video
- *GCP Custom Machine Types* — Google Cloud Tech YouTube

**📖 Articles & Documentation**
- **AWS EC2 Instance Types:** https://aws.amazon.com/ec2/instance-types/
- **Azure VM Sizes:** https://docs.microsoft.com/en-us/azure/virtual-machines/sizes
- **GCP Machine Types:** https://cloud.google.com/compute/docs/machine-resource

**🔗 Interactive Practice**
- **EC2Instances.info:** https://instances.vantage.sh — compare EC2 instance types and prices side-by-side

---

## Chapter 7: Storage Services Compared — S3 vs. Blob Storage vs. Cloud Storage

### Learning Objectives

**Estimated time:** 25 minutes theory + 15 minutes lab = 40 minutes  
**Prerequisites:** Chapter 6 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to explain object storage concepts and compare S3, Azure Blob Storage, and GCP Cloud Storage
- By the end of this chapter, you will be able to match storage tiers (hot, cool, archive) across providers
- By the end of this chapter, you will be able to explain why object storage pricing has three separate components

---

### Spark — A Question Before the Answer

In 2017, a security researcher discovered that 198 million US voter records were stored in an exposed AWS S3 bucket — publicly accessible to anyone who knew the URL. No password required. The organization (Deep Root Analytics) had no idea. The S3 bucket was configured with default public access settings that had seemed appropriate when set but were never reviewed as the sensitivity of the data it contained increased.

How does a bucket of 198 million voter records end up publicly accessible on the internet? And what does this tell you about the difference between "storing" data and "securing" data — a distinction that S3, Blob Storage, and Cloud Storage all require you to understand separately?

---

### Why This Matters

Object storage is the most widely used cloud storage pattern — static websites, backup archives, data lakes, application assets, log storage. Every cloud application you build in Module 7 will use object storage in some form. Understanding not just how to put files in a bucket, but how access controls, storage classes, lifecycle policies, and pricing work — is the difference between a junior engineer who can follow a tutorial and a cloud engineer who can design and audit a storage architecture.

---

### Core Theory

**1. Object Storage — The Model**

Object storage is fundamentally different from file systems and block storage. It stores data as *objects* — arbitrary files with metadata — in flat namespaces called *buckets* (S3/GCS) or *containers* (Azure Blob). There is no folder hierarchy — what looks like a folder path (`photos/2024/january/`) is just a prefix in the object's key. This flat model is what enables object storage to scale to billions of objects without the performance degradation a file system would experience.

| Concept | AWS S3 | Azure Blob | GCP Cloud Storage |
|---------|--------|------------|-------------------|
| Namespace | Bucket | Container | Bucket |
| Object path | Key | Blob name | Object name |
| Max object size | 5 TB | 200 GB (block) | 5 TB |

**2. Storage Tiers — Hot/Cool/Archive**

All three providers offer tiered storage pricing: pay more for data you access frequently, pay less for data you access rarely. The tier names differ:

| Tier | AWS S3 | Azure Blob | GCP Cloud Storage |
|------|--------|------------|-------------------|
| Frequent access | S3 Standard | Hot | Standard |
| Infrequent access | S3 Standard-IA | Cool | Nearline |
| Rare access | S3 Glacier | Archive | Coldline |
| Deep archive | S3 Glacier Deep Archive | — | Archive |

The tradeoff: lower storage cost → higher retrieval cost + retrieval delay. S3 Glacier Deep Archive: $0.00099/GB/month storage, but retrieval takes 12 hours. Perfect for compliance backups you hope you never need. Wrong for your application's images.

> **Real example:** Capital One's data platform stores petabytes of financial transaction data. Active data (recent transactions) in S3 Standard for fast query access; 1-year-old data in S3 Standard-IA (accessed occasionally for audits); 7+ year data in Glacier (compliance retention requirement — must keep, rarely need). The tiered model reduced their storage costs by ~60% compared to keeping everything in Standard — at zero loss of data access when needed.

**3. Access Control — The Most Important Concept**

All three providers have layered access control — and the 2017 voter records breach traces specifically to this layer. Object storage has two distinct access models:

**Private (default):** Only authenticated and authorized identities can access. This requires explicit permission grants (IAM roles, bucket policies, ACLs).

**Public:** Any internet user can access without authentication. Useful for public website assets. Catastrophic for sensitive data.

AWS added "S3 Block Public Access" as a global setting in 2018, after the voter records incident and dozens of similar breaches, to allow accounts to block all public access regardless of individual bucket settings. Azure and GCP have equivalent account-level controls.

The lesson: understand your access model. "It's in a bucket" is not the same as "it's secured."

---

### Theory Checkpoint

1. What is the fundamental difference between object storage and a file system?
2. What is the tradeoff between S3 Standard and S3 Glacier Deep Archive?
3. In the 2017 voter records breach, what specific configuration error created the public exposure?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Compare S3, Blob Storage, and GCS Pricing**  
**Platform:** Browser  
**Tools needed:** Web browser  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** A cost model for a typical application's storage across all three providers.

**Step 1:** Open pricing pages:
- AWS S3: https://aws.amazon.com/s3/pricing/
- Azure Blob: https://azure.microsoft.com/en-us/pricing/details/storage/blobs/
- GCS: https://cloud.google.com/storage/pricing

**Step 2:** Calculate the monthly cost for this storage scenario:
- 100 GB of data stored (standard/hot tier)
- 10 GB of data written per month (PUT operations)
- 50 GB of data retrieved per month (GET operations)
- Region: US East

**Step 3:** Note which provider has the lowest egress (data transfer out) cost — this is often the hidden cost that makes cloud storage more expensive than the storage price suggests.

**Lab reflection:** If you stored your application's static assets in object storage and served them to users directly, the egress cost would be charged for EVERY user download. How would this affect your architecture decision about whether to serve assets directly from S3/Blob/GCS vs. through a CDN?

---

### Quiz

**Quiz — Chapter 7**

1. What does "flat namespace" mean in object storage, and how does it differ from a traditional file system hierarchy?

2. An application stores user profile photos (accessed on every login), archived user activity logs from 3 years ago (accessed once per year for audits), and current month's transaction records (accessed daily). Which storage tier should each use, and why?

3. In the 2017 Deep Root Analytics voter records breach (198M records on S3), what specific access control mistake was made, and what feature did AWS subsequently create to prevent this class of error at the account level?

4. You're designing storage for a media company that generates 10 TB of raw footage daily but accesses old footage rarely (less than 5% per year). Using the tier comparison table, which tiers would you use and how would you configure the lifecycle transition?

5. True/False: Object storage (S3, Blob Storage, GCS) is a suitable replacement for a relational database for application data. Explain your answer.

---

### Key Takeaways

- **Object storage = flat-namespace blob storage** in buckets/containers. Scales to billions of objects without file system performance degradation. Foundation of cloud data architectures.
- **Tiered storage** (Standard/Hot → IA/Cool → Glacier/Archive) trades retrieval cost and latency for storage cost. Match tier to access frequency — capital one saves 60% by tiering properly.
- **Access control is the most critical concept** — "stored in a bucket" ≠ "secured." Default to private, grant access explicitly, enable account-level Block Public Access settings.
- **Storage pricing has three components** (storage/month, operations, egress) — egress is often the dominant cost for high-traffic applications, which is why CDNs (CloudFront, Azure CDN, Cloud CDN) exist.
- Real breaches (2017 voter records, numerous similar incidents) trace to misconfigured object storage access — not to technical failures, but to access model misunderstanding.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Flat namespace: all objects exist at the same level in a bucket, identified only by their key (e.g., `photos/2024/jan/image.jpg`). The `/` in the key looks like a folder path but is just a convention in the object name — there is no actual folder hierarchy. Traditional file system: hierarchical directory structure with actual folders/directories as distinct entities that can have metadata, permissions, and quotas independently from the files they contain. Practical implication: you can't have an "empty folder" in object storage (there are no folders), and you can't set permissions on a "folder" — only on individual objects or using prefix-based policies.

**Q2:** Profile photos (accessed every login) → S3 Standard / Hot — frequent access, latency-sensitive for user experience. Activity logs from 3 years ago (accessed once/year for audits) → S3 Glacier or Azure Archive / GCS Coldline — rare access, latency tolerable (audit requests can wait hours), minimal storage cost required for cost efficiency. Current month transaction records (accessed daily) → S3 Standard / Hot — frequent access, possibly latency-sensitive for operational reporting.

**Q3:** Access control mistake: the S3 bucket's access policy allowed public read access — any unauthenticated HTTP request to the bucket URL returned the data. This was likely set intentionally for some data and then the data classification changed (or new sensitive data was added to the same bucket) without updating permissions. AWS subsequently created "S3 Block Public Access" — an account-level and bucket-level setting that blocks ALL forms of public access (bucket policies, ACLs) regardless of individual object settings. This prevents the scenario where "just this once" public access settings persist past their intended use.

**Q4:** Storage design: raw footage ingested to S3 Standard (active production, accessible immediately for editing). After 30 days (post-production complete), lifecycle policy transitions to S3 Standard-IA (occasional retrieval for additional edits or delivery). After 1 year, lifecycle policy transitions to S3 Glacier (long-term archive, retrieval takes hours but acceptable for archive access). After 10 years, S3 Glacier Deep Archive (compliance retention, cheapest possible storage, 12-hour retrieval). Lifecycle configuration uses S3 Lifecycle Rules: `transition after 30 days → Standard-IA`, `transition after 365 days → Glacier`, `transition after 3650 days → Glacier Deep Archive`.

**Q5:** False for application data — with important nuances. Object storage is inappropriate as a database replacement because: (a) no query language — you can't SELECT * WHERE status=active; (b) no transactions — operations are not atomic across multiple objects; (c) no indexing — finding specific records requires listing all objects or maintaining a separate index; (d) no strong consistency for updates in all configurations. Where object storage IS appropriate: storing binary data (files, images, videos) referenced by ID stored in a database; data lake storage for batch analytics (not transactional queries); application configuration files and deployment artifacts. The database stores the metadata and references; object storage stores the binary content.

---

### Learning Resources

**📹 Video Resources**
- *AWS S3 Explained* — AWS official channel — comprehensive S3 overview
- *Azure Blob Storage vs S3 Comparison* — community comparison videos on YouTube
- *S3 Security Best Practices* — AWS re:Invent security tracks

**📖 Articles & Documentation**
- **AWS S3 Security Best Practices:** https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
- **2017 S3 breach postmortem:** UpGuard's original research is available via web search
- **GCS Storage Classes:** https://cloud.google.com/storage/docs/storage-classes

**🔗 Interactive Practice**
- **AWS Free Tier:** Create an S3 bucket, upload a file, make it public, then enable Block Public Access and observe the effect — direct demonstration of the access control concepts.

---

## Chapter 8: Database Services Compared — RDS vs. Azure SQL vs. Cloud SQL

### Learning Objectives

**Estimated time:** 25 minutes theory + 10 minutes lab = 35 minutes  
**Prerequisites:** Chapter 7 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to compare managed database services across AWS, Azure, and GCP for relational and NoSQL workloads
- By the end of this chapter, you will be able to explain what "managed" means in a managed database service and what the customer still remains responsible for
- By the end of this chapter, you will be able to identify the proprietary managed databases each provider offers and the tradeoffs of adopting them

---

### Spark — A Question Before the Answer

Before managed database services existed, running a production database in the cloud meant: provisioning a VM, installing the database software, configuring replication, setting up automated backups, monitoring disk space, applying security patches, managing connection pooling, and being on-call for all of the above. A DBA (Database Administrator) role was a separate, specialized, high-demand career. Today, AWS RDS can provision a fully replicated, automatically backed-up, automatically patched PostgreSQL database in 10 minutes with a console click or a Terraform resource block.

What exactly did "managed" take over — and what's left for the engineer to worry about?

---

### Why This Matters

Every application stores data. The database choice and configuration are among the highest-consequence infrastructure decisions in any cloud architecture. Managed database services have radically changed what engineers need to know — you no longer need to be a DBA to run a production database. But you do need to understand the tradeoffs between provider-specific managed services (Amazon Aurora, Azure Cosmos DB, GCP Spanner) and portable managed services (RDS PostgreSQL, Azure Database for PostgreSQL, Cloud SQL PostgreSQL) to make architecture decisions that don't create excessive vendor lock-in.

---

### Core Theory

**1. Managed vs. Self-Managed — What "Managed" Covers**

In a managed database service, the cloud provider handles:
- Infrastructure provisioning (VM, storage, network)
- Database software installation and updates
- Automated backups and point-in-time recovery
- High availability (multi-AZ replication for AWS RDS, geo-replication for Azure)
- Performance monitoring and alerting
- Storage auto-scaling

What you still own:
- Data model and schema design
- Query optimization and index design
- Application-level connection management
- Access control (which users/roles can access which tables)
- Backup retention policy configuration (the default may not meet your compliance requirements)
- Cost optimization (instance sizing, reserved capacity)

> **Real example:** Dropbox (2015–2016). Dropbox built their own MySQL-based storage system ("Edgestore") rather than using AWS RDS, because they needed more control over their data model and required performance characteristics that the managed service couldn't deliver at their scale. The key lesson: managed services handle operational concerns but don't replace architectural thinking. For most organizations at <10TB scale, managed services are the right choice. At Dropbox's multi-petabyte scale, the tradeoffs shifted.

**2. Provider-Portable vs. Provider-Proprietary Services**

A critical architectural decision: use a portable database engine (PostgreSQL, MySQL, SQL Server) via the managed service, or use a provider-proprietary engine with enhanced capabilities?

| Type | AWS | Azure | GCP |
|------|-----|-------|-----|
| Portable (PostgreSQL) | RDS PostgreSQL | Azure Database for PostgreSQL | Cloud SQL PostgreSQL |
| Portable (MySQL) | RDS MySQL | Azure Database for MySQL | Cloud SQL MySQL |
| Proprietary relational | Amazon Aurora | Azure SQL (SQL Server) | Cloud Spanner |
| Proprietary NoSQL | DynamoDB | Cosmos DB | Firestore/Bigtable |

The tradeoff: proprietary services (Aurora, Cosmos DB, Spanner) offer enhanced capabilities (higher performance, global distribution, specific scaling models) in exchange for vendor lock-in. If you use Aurora's MySQL-compatible API, you can theoretically migrate — but Aurora-specific features (Aurora Serverless, Aurora Global Database) have no direct equivalent elsewhere. Choosing portable PostgreSQL preserves migration optionality.

**3. NoSQL Managed Services**

All three providers offer NoSQL managed services for non-relational data patterns:

- **AWS DynamoDB:** Key-value and document store. Highly scalable, serverless pricing model (pay per request). Strong for high-throughput, predictable access patterns.
- **Azure Cosmos DB:** Multi-model (document, key-value, graph, column-family). Global distribution with configurable consistency levels. More flexible but more expensive than DynamoDB for simple use cases.
- **GCP Firestore/Bigtable:** Firestore for document storage (similar to Cosmos DB); Bigtable for high-performance wide-column store (HBase-compatible, used internally by Google for Search and Gmail).

---

### Theory Checkpoint

1. What are three things a managed database service handles that you would otherwise do yourself?
2. What is the specific risk of choosing a provider-proprietary database engine over a portable one?
3. In the Dropbox example, what was the specific condition that made self-managed better than managed service?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Compare Database Services in the Free Tier**  
**Platform:** Browser  
**Tools needed:** Web browser, cloud account (any provider)  
**Estimated time:** 10 minutes  
**What you'll demonstrate:** Understanding of what "managed" means by reading the creation options for a managed database.

**Step 1:** Navigate to your primary cloud provider's database creation console:
- AWS: RDS → Create database
- Azure: Azure Database for PostgreSQL → Create
- GCP: Cloud SQL → Create instance

**Step 2:** Walk through (but don't create) the database creation wizard. Note every option you're asked to configure:
- Engine and version
- Instance size
- Storage type and size
- Backup retention period
- High availability (Multi-AZ or similar)
- Encryption at rest
- Network/VPC placement
- Authentication method

**Step 3:** For each option, classify: Is this something the managed service handles automatically, or is this something I'm configuring myself? Mark your list.

**Lab reflection:** The backup retention period is typically configurable from 1 to 35 days. If a compliance regulation requires you to keep backups for 7 years (84 months), what does this reveal about the limits of what "managed" means? Where does the cloud provider's responsibility end and yours begin?

---

### Quiz

**Quiz — Chapter 8**

1. List three operational tasks that managed database services (RDS, Azure SQL, Cloud SQL) take over from engineers, and one task they explicitly do NOT handle.

2. What is the specific tradeoff when choosing Amazon Aurora over RDS PostgreSQL for a new application?

3. In the Dropbox "Edgestore" decision, what was the specific condition that made self-managed MySQL preferable to AWS RDS — and what does this reveal about when managed services are NOT the right choice?

4. A startup is building an application and debating between RDS PostgreSQL and DynamoDB. What question would help them decide which is appropriate?

5. True/False: AWS RDS automatically handles all database performance optimization, eliminating the need for query tuning and indexing. Explain your answer.

---

### Key Takeaways

- **"Managed" covers operations, not architecture** — provisioning, patching, backups, HA replication are automated. Schema design, query optimization, access control, and backup retention policy remain your responsibility.
- **Portable vs. proprietary database choice** is a lock-in decision — PostgreSQL on RDS/Azure DB/Cloud SQL preserves migration optionality. Aurora, Cosmos DB, and Spanner offer enhanced capabilities at the cost of increased provider dependency.
- **NoSQL managed services** (DynamoDB, Cosmos DB, Firestore/Bigtable) serve non-relational access patterns — high-throughput key-value, document storage, wide-column. Choose based on access patterns, not just familiarity.
- **Every managed database choice is a tradeoff (operational simplicity vs. control vs. portability)** — at most scales, managed wins; at extreme scale (Dropbox, Google-internal), self-managed provides the necessary control.
- Real architectural decisions trace to understanding this tradeoff — not choosing the cheapest database, but choosing the one whose management model matches your team's operational capabilities and portability requirements.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Managed tasks: (1) OS and database software patching/updates, (2) automated daily backups and point-in-time recovery capability, (3) multi-AZ replication for high availability. NOT handled: application-level schema design, query optimization and index creation, row-level access control policies (you configure these in the database, not the managed service), and backup retention period beyond the configured window (by default, RDS keeps backups for 7 days — if you need 7 years, you build a separate archival process).

**Q2:** Aurora vs. RDS PostgreSQL tradeoff: Aurora offers 3-5x the throughput of standard RDS PostgreSQL, up to 128 TB auto-scaling storage, Aurora Serverless (capacity scales automatically), Aurora Global Database (multi-region replication with <1s cross-region lag). The cost: Aurora is 2-3x the price of equivalent RDS, and while Aurora uses PostgreSQL/MySQL-compatible protocols, Aurora-specific features (Serverless, Global Database, Aurora machine learning integration) have no equivalents in other providers — increasing switching cost significantly.

**Q3:** Dropbox's specific condition: multi-petabyte scale with unique data model requirements. At that scale: (a) RDS performance tuning options weren't sufficient — Dropbox needed specific storage engine modifications impossible in managed service, (b) the cost of RDS at petabyte scale exceeded the engineering cost of maintaining their own system, (c) their access patterns were so specific that the general-purpose optimizations in RDS were sometimes counterproductive. This reveals: managed services are optimized for the 80% case. When your workload is in the 20% — unusual scale, unusual access patterns, or requiring database internals access — self-managed may be justified.

**Q4:** The deciding question: "What is the query pattern?" If the application accesses data primarily by a known key (user ID, transaction ID, session token) with high throughput → DynamoDB is ideal (designed for key-based access at scale). If the application runs complex queries (JOINs, aggregations, flexible WHERE clauses, ORDER BY) or has unpredictable access patterns → RDS PostgreSQL is appropriate (full SQL, flexible querying). Secondary questions: Does the team know SQL better than DynamoDB's query model? What's the expected scale? At small scale, RDS PostgreSQL is almost always the right default — it's familiar, flexible, and easy to reason about.

**Q5:** False. RDS handles infrastructure performance — preventing disk I/O bottlenecks, providing adequate network bandwidth, ensuring the database engine version is current. But query performance is determined by: (a) query design (are you selecting only needed columns?), (b) indexes (does the right index exist for your WHERE clauses?), (c) schema design (is the data model appropriate for the access patterns?), (d) connection management (are you using connection pooling?). RDS provides Performance Insights (a monitoring tool) to help you find slow queries — but it cannot fix them. Query tuning and indexing remain entirely the responsibility of the application team.

---

### Learning Resources

**📹 Video Resources**
- *AWS RDS vs Aurora vs DynamoDB* — AWS official YouTube — when to use each
- *Azure Database Services Overview* — Microsoft Azure YouTube
- *Database Design for Cloud* — Architecture-focused talks from AWS re:Invent

**📖 Articles & Documentation**
- **AWS: Choosing Between RDS and Aurora** — https://aws.amazon.com/rds/aurora/faqs/
- **Dropbox: Building Edgestore** — engineering blog post documenting their self-managed database decision
- **GCP: Choosing a Database** — https://cloud.google.com/products/databases — Google's own decision guide

**🔗 Interactive Practice**
- **AWS RDS Free Tier:** Create a db.t3.micro RDS PostgreSQL instance (free tier eligible) and connect to it with a PostgreSQL client — practice the creation options from the lab

---

## Chapter 9: Networking Services Compared — VPC Across Providers

### Learning Objectives

**Estimated time:** 25 minutes theory + 15 minutes lab = 40 minutes  
**Prerequisites:** Chapters 6–8 of this Part; Module 1, Part B — Networking Essentials

**Learning objectives:**
- By the end of this chapter, you will be able to explain VPC concepts across AWS, Azure, and GCP and identify the equivalent service on each platform
- By the end of this chapter, you will be able to compare subnet design and security group concepts across providers
- By the end of this chapter, you will be able to explain how VPC peering and private connectivity work in each provider's model

---

### Spark — A Question Before the Answer

When you provision an EC2 instance in AWS, it doesn't automatically exist "on the internet." It exists inside a Virtual Private Cloud — a logically isolated network that you control. AWS, Azure, and GCP all implement this concept, but with different default behaviors. AWS VPCs have no internet connectivity by default — you add an Internet Gateway explicitly. GCP, by contrast, provides a single global VPC that spans all regions by default, with very different subnet design implications.

Why does the default matter? Because security is defined by defaults. An organization that provisions infrastructure assuming "private by default" designs very differently from one that assumes "internet-accessible by default."

---

### Why This Matters

VPC design is one of the most security-critical decisions in cloud architecture. A misconfigured VPC is the reason databases end up internet-accessible, the reason internal services get exposed, and the reason lateral movement is possible after an initial compromise. Understanding VPC concepts across providers — not just AWS — is what makes you valuable in multi-cloud environments and what distinguishes you from engineers who can only configure networks by following a tutorial.

---

### Core Theory

**1. VPC Concepts — The Shared Model**

All three providers implement network isolation using the VPC (Virtual Private Cloud) model — a software-defined network that provides an isolated network environment for your cloud resources. The core concepts map across providers:

| Concept | AWS | Azure | GCP |
|---------|-----|-------|-----|
| Private network | VPC | Virtual Network (VNet) | VPC Network |
| Address space | CIDR block | Address space | IP range |
| Subdivision | Subnet | Subnet | Subnet |
| Firewall (instance-level) | Security Group | Network Security Group (NSG) | Firewall Rules |
| Firewall (subnet-level) | Network ACL | NSG on subnet | VPC Firewall Rules |
| Internet access | Internet Gateway | Internet Gateway | Cloud Router / NAT |
| Private interconnect | VPC Peering / Transit Gateway | VNet Peering | VPC Peering |

**2. Key Differences Between Providers**

**AWS VPC:** Created per-region, spans all availability zones in that region. Subnets are per-AZ. Security Groups are stateful (return traffic allowed automatically). Network ACLs are stateless (must allow traffic in both directions). Default VPC exists in every region with public subnets — good for getting started, bad for production security.

**Azure VNet:** Created per-region (single-region), spans all availability zones. Subnets span the VNet. NSGs can be applied at subnet or NIC level. No "default VNet" — you create explicitly. Hub-and-spoke network topology is the recommended pattern for enterprise Azure networking.

**GCP VPC:** Global — a single VPC spans all regions. Subnets are regional. Firewall rules apply globally by default, can be scoped to specific subnets. This global model is a significant architectural difference — GCP resources in different regions can communicate over Google's private network without VPC peering, which AWS and Azure require for multi-region private connectivity.

> **Real example:** Capital One (documented re:Invent talks). Capital One designed their AWS VPC architecture with zero-trust principles: no direct internet access to any compute resource, all traffic through inspection layers, strict security group rules allowing only explicitly needed ports. Their "Security Monkey" and later "Cloud Custodian" tools continuously audited their VPC configurations to detect drift from the security baseline. This represents mature VPC security: not just "configure it right once" but "continuously verify it remains right."

**3. Subnet Design — Public vs. Private**

The most fundamental network architecture decision: which subnets should be internet-accessible (public) and which should be internal only (private)?

Standard pattern (all providers): Public subnets for load balancers and NAT gateways (need internet access). Private subnets for compute (EC2, VMs) and databases (RDS). No direct internet path to databases or application servers — all internet traffic enters through a controlled load balancer layer.

This pattern is called the "three-tier network architecture": public (load balancer), private (application), database (most private). You'll implement this with Terraform in Module 5, Part C, Chapter 16.

---

### Theory Checkpoint

1. What is the fundamental difference in VPC scope between AWS (per-region) and GCP (global)?
2. What is the difference between a Security Group (AWS) and a Network ACL, specifically regarding statefulness?
3. In the three-tier network architecture, why should databases never be in a public subnet?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Map the Default VPC**  
**Platform:** Browser / cloud console  
**Tools needed:** Cloud account, web browser  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** Understanding of default network configuration and its security implications.

**Step 1:** Navigate to your primary provider's VPC console:
- AWS: VPC → Your VPCs
- Azure: Virtual Networks
- GCP: VPC Network → VPC Networks

**Step 2:** Examine the default VPC/VNet/Network that exists:
- What is the CIDR block?
- How many subnets exist?
- Which subnets are public (route to Internet Gateway)?
- What is the default security configuration?

**Step 3:** Note: In AWS, the default VPC has public subnets with routes to an Internet Gateway. This means any EC2 instance launched in the default VPC is internet-accessible by default (if it has a public IP). Document this security implication.

**Step 4:** Find the Internet Gateway (AWS) or equivalent. Examine what routes lead traffic to it.

**Lab reflection:** The default VPC is designed for easy getting-started, not production security. What would you need to create to build a production-ready three-tier network instead? Write the list of components you'd need to provision.

---

### Quiz

**Quiz — Chapter 9**

1. Explain the difference between a Security Group and a Network ACL in AWS, specifically around stateful vs. stateless traffic filtering.

2. GCP's VPC is global, while AWS VPCs are per-region. What are the operational advantages of GCP's global model for multi-region architectures?

3. In the Capital One VPC architecture example, what specific security principle did they implement by routing all traffic through inspection layers and using continuous auditing tools?

4. A database instance is accidentally provisioned in a public subnet with a public IP address. What is the minimum set of changes required to move it to a private subnet safely?

5. True/False: If a Security Group allows no inbound rules, all traffic to the instance is blocked, making it safe to place in a public subnet. Explain your answer.

---

### Key Takeaways

- **VPC = software-defined isolated network.** AWS (per-region), Azure (per-region), GCP (global) all implement the same concept with important architectural differences, especially in multi-region scenarios.
- **Security Groups (stateful) vs. Network ACLs (stateless)** — Security Groups automatically allow return traffic; ACLs require explicit rules in both directions. Most production security is implemented in Security Groups.
- **Three-tier network architecture** (public → private → database subnets) is the standard production pattern across all providers — default VPCs are for learning, not production.
- **VPC security is a tradeoff (access vs. isolation)** — the more permissive you are for operational convenience, the larger the blast radius of a compromise. Zero-trust network design reduces blast radius at the cost of operational complexity.
- Real security failures (countless cloud breaches) trace to VPC misconfiguration — databases in public subnets, security groups with 0.0.0.0/0 inbound rules — not to sophisticated attacks, but to misunderstood network defaults.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Security Group: stateful — when you allow inbound traffic on port 443, the response traffic (outbound on the ephemeral port) is automatically allowed without needing an explicit outbound rule. Network ACL: stateless — you must explicitly allow traffic in both directions. If you allow inbound TCP 443 on the ACL, you must also allow outbound TCP 1024-65535 (ephemeral ports) for responses to be returned. In practice: Security Groups handle instance-level traffic (stateful, simpler to configure). NACLs are used for broad subnet-level deny rules and defense-in-depth layering.

**Q2:** GCP global VPC advantages: (1) resources in different regions communicate over Google's private backbone without VPC peering — zero peering configuration for multi-region apps; (2) firewall rules can be applied globally rather than per-region; (3) subnet CIDRs don't overlap across regions by design; (4) global load balancing is naturally integrated. AWS equivalent requires: VPC peering or Transit Gateway between regional VPCs, route table configuration, security group updates. For organizations operating in many regions, GCP's global model significantly reduces network configuration complexity.

**Q3:** Capital One implemented zero-trust networking: (a) deny-by-default — no resource has internet access unless explicitly granted, (b) defense-in-depth — multiple inspection layers before any traffic reaches compute, (c) continuous compliance — auditing tools detect and alert on any deviation from the security baseline (configuration drift). This combines network design (private subnets, no direct internet paths) with operational practice (continuous auditing) — the same IaC + continuous compliance model that prevents configuration drift in other domains.

**Q4:** Safe migration steps: (1) Create a snapshot/backup of the database (before any change); (2) Provision a private subnet (if one doesn't exist) in the same AZ; (3) Create a new database instance in the private subnet from the snapshot; (4) Update the application's database connection string to point to the new endpoint; (5) Verify application connectivity through the private path; (6) Terminate the old database instance with the public IP; (7) Remove the public subnet route for the old database from route tables. Note: depending on the database engine, "move to private subnet" may require provisioning a new instance rather than relocating the existing one.

**Q5:** False — insecure despite no inbound rules. An EC2 instance with a public IP in a public subnet (route to Internet Gateway) with no Security Group inbound rules is secure from unauthorized INBOUND connections. However: (a) the instance itself can make outbound connections (to download malware if compromised through another vector), (b) any outbound connection responses can return inbound on ephemeral ports (Security Group is stateful), (c) the public IP is still discoverable and scannable, making it a target. The correct security posture is: private subnet (no public IP, no route to Internet Gateway) + no inbound rules — not public subnet + no inbound rules. Defense-in-depth means not relying on a single security control.

---

### Learning Resources

**📹 Video Resources**
- *AWS VPC Deep Dive* — AWS re:Invent networking sessions on YouTube — best technical depth
- *VPC Design Best Practices* — AWS Well-Architected Framework talks
- *Azure VNet vs AWS VPC* — comparison videos from Azure architects

**📖 Articles & Documentation**
- **AWS VPC Documentation:** https://docs.aws.amazon.com/vpc/
- **GCP VPC Overview:** https://cloud.google.com/vpc/docs/overview
- **AWS: VPC Security Best Practices** — https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html

**🔗 Interactive Practice**
- **AWS VPC Reachability Analyzer:** Free tool in the AWS console that traces network paths and identifies why traffic is/isn't reaching a destination — essential for debugging VPC configurations

---

## Chapter 10: Identity & Access Management Across Providers

### Learning Objectives

**Estimated time:** 25 minutes theory + 15 minutes lab = 40 minutes  
**Prerequisites:** Chapter 9 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to explain the core IAM model (identities, policies, permissions) across AWS, Azure, and GCP
- By the end of this chapter, you will be able to apply the principle of least privilege to IAM policy design
- By the end of this chapter, you will be able to identify the provider-specific IAM concepts that differ between platforms

---

### Spark — A Question Before the Answer

In 2019, Capital One suffered a breach where a former AWS employee exploited a misconfigured Web Application Firewall to access S3 buckets containing 106 million customer records. The attacker didn't need to crack a password or exploit a software vulnerability. The EC2 instance running the WAF had an IAM role with excessive permissions — it could list and read S3 buckets it had no business reason to access. One misconfigured role permission was the entire attack surface.

This is the IAM failure mode that haunts cloud security: not password theft, but excessive permissions granted to identities that get compromised.

---

### Why This Matters

IAM is the authorization layer for every cloud operation. In your first cloud engineering role, you will create IAM policies, assign roles, and make permissions decisions constantly. Getting these wrong has the Capital One consequence. Understanding the IAM model — not just the syntax, but the principle behind it — is what separates engineers who grant `*:*` to everything "just to make it work" from those who design least-privilege access architectures.

---

### Core Theory

**1. The IAM Model — Three Components Everywhere**

All three providers implement IAM using the same three-component model: Identity, Policy, Permission.

**Identity:** WHO is making the request? Can be a human user, a machine (service account/IAM role), or a group of humans.

**Policy:** A document that defines what permissions are granted. Attached to identities or resources.

**Permission:** The specific action being allowed or denied. Typically in `service:action` format.

| Component | AWS | Azure | GCP |
|-----------|-----|-------|-----|
| Human user | IAM User | Azure AD User | Cloud Identity User |
| Group | IAM Group | Azure AD Group | Google Group |
| Machine identity | IAM Role (assumed) | Managed Identity | Service Account |
| Permission policy | IAM Policy (JSON) | Azure Policy / Role Definition | IAM Policy (role binding) |
| Permission model | Policy attached to identity OR resource | RBAC role assigned to identity at scope | Role + binding + resource |

**2. Least Privilege — The Governing Principle**

Least privilege: grant every identity only the minimum permissions required to perform its function, nothing more.

Why this is hard in practice:
- "Minimum permissions" is hard to know without testing
- Developers add broad permissions to unblock themselves quickly and never narrow them
- Service account permissions accumulate as applications grow
- Periodic permission audits are tedious and often skipped

Why it matters: a compromised identity (stolen credentials, exploited application) can only do what its permissions allow. An identity with `S3:*` (all S3 actions) is far more dangerous than one with `S3:GetObject` on specific buckets.

> **Real example:** Capital One breach, 2019. A Web Application Firewall EC2 instance had an IAM role with `s3:ListBuckets` and `s3:GetObject` permissions — far beyond what a WAF needs operationally. The attacker exploited a SSRF vulnerability in the WAF to make AWS metadata service requests, retrieved the IAM role credentials, and used them to enumerate and download S3 bucket data. The WAF's role should have had zero S3 permissions. This is the "least privilege" failure — not a hack, just an excessive IAM role.

**3. AWS vs. Azure vs. GCP IAM — Key Differences**

**AWS IAM:** Identity-centric (policies attached to users/roles/groups) AND resource-centric (resource policies on S3 buckets, Lambda functions — who can access this resource). Policies are JSON documents evaluated with an explicit allow-deny logic.

**Azure RBAC:** Scope-based. Permissions are granted by assigning roles (built-in or custom) to identities at a scope: subscription, resource group, or individual resource. An Azure "Owner" at subscription scope has full control over everything in the subscription.

**GCP IAM:** Binding-based. You bind a role to a member on a resource. The binding `roles/storage.objectViewer → serviceAccount@project.iam.gserviceaccount.com → bucket:my-bucket` is the complete permission statement.

---

### Theory Checkpoint

1. What are the three components of the IAM model shared across all providers?
2. In the Capital One breach, what specific IAM misconfiguration was the root cause?
3. What is the difference between identity-centric and resource-centric access control in AWS IAM?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Audit IAM Permissions for Over-Privilege**  
**Platform:** Cloud console  
**Tools needed:** Cloud account, web browser  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** Identifying overly-permissive IAM configurations.

**Step 1:** Navigate to your primary provider's IAM console:
- AWS: IAM → Users → [your user] → Permissions tab
- Azure: Azure AD → [your account] → Assigned roles
- GCP: IAM & Admin → [your service account] → Permissions

**Step 2:** List every permission or role assigned to your account.

**Step 3:** For each permission/role, ask:
- Does my account ACTUALLY need this?
- What is the minimum permission that would still let me do my work?
- Is this permission scoped to specific resources or is it account-wide?

**Step 4:** Identify at least one permission that could be narrowed.

**Lab reflection:** AWS CloudTrail logs every API call made in your account. If you looked at your last 30 days of CloudTrail logs and compared them to your current IAM permissions — what permissions would you never find used? Those unused permissions are pure attack surface with no operational benefit. How would you use this data to implement least privilege systematically?

---

### Quiz

**Quiz — Chapter 10**

1. What is the principle of least privilege, and what two organizational behaviors commonly undermine it in practice?

2. In the Capital One 2019 breach, the attacker used SSRF to retrieve IAM role credentials. Explain what SSRF is, and why having IAM role credentials was sufficient to access the data without any password.

3. What is the difference between AWS's identity-centric and resource-centric IAM models — give one example of where you'd use each?

4. A developer asks for `S3:*` permissions on all buckets to "make it easy to test." Explain why this is wrong, and what the correct approach is.

5. True/False: Using IAM Groups in AWS to assign permissions to users is a security best practice. Explain your answer.

---

### Key Takeaways

- **Three IAM components everywhere:** Identity (who), Policy (what's allowed), Permission (which action). All three providers implement these with different syntax but identical conceptual model.
- **Least privilege = minimum permissions required for each identity's function.** Unused permissions = attack surface with no operational benefit.
- **IAM misconfiguration is the #1 cause of cloud data breaches** — not sophisticated exploits, but excessive permissions granted to identities that get compromised.
- **AWS has dual IAM model** (identity-centric AND resource-centric); Azure uses scope-based RBAC; GCP uses binding-based IAM. Knowing these differences is what makes you effective across providers.
- Real breaches (Capital One 2019, countless others) trace to excessive IAM permissions — not password theft, but compromised identities with permissions they never needed.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Least privilege = grant each identity only the permissions required for its specific function. Two behaviors that undermine it: (1) "works now" permissions — developers add `*` policies to unblock themselves quickly, intending to narrow them later, and never do; (2) accumulated permissions — service accounts gain new permissions as features are added and old permissions are never removed (permission sprawl). Both result in identities with far more access than their current function requires.

**Q2:** SSRF (Server-Side Request Forgery): an attack where an attacker tricks a server into making HTTP requests to locations the attacker specifies — often used to access internal metadata services. The AWS EC2 metadata service (`http://169.254.169.254/latest/meta-data/iam/security-credentials/`) returns temporary IAM role credentials without authentication. Once retrieved, these credentials behave exactly like real credentials — they can be used with the AWS CLI or API to perform any action the role permits. No password needed because the IAM role is an identity that authenticates through its signature (AWS SigV4), not a password — and the stolen credentials include the signing keys.

**Q3:** Identity-centric example: an IAM policy attached to an IAM user (or role) saying "this identity can read from any S3 bucket." Use this when you're managing what AN IDENTITY can do across multiple resources. Resource-centric example: an S3 bucket policy saying "only this specific IAM role can access this bucket." Use this when you're managing who can access A SPECIFIC RESOURCE, especially when the resource needs to be accessible to identities from other AWS accounts (cross-account access requires resource policies, not just identity policies).

**Q4:** Why wrong: `S3:*` allows all S3 actions on all buckets — list buckets, read objects, write objects, delete objects, modify bucket policies, delete the bucket itself. If this developer account is compromised (phishing, credential leak), the attacker can exfiltrate all S3 data AND delete all S3 data. Correct approach: identify which specific buckets the developer needs to access for testing → grant `s3:GetObject` and `s3:PutObject` on those specific buckets only → add `s3:ListBucket` on those specific buckets → if they need to create test buckets, grant `s3:CreateBucket` with a name prefix condition (e.g., `arn:aws:s3:::dev-*`). Test with specific permissions, not wildcard.

**Q5:** True — with an important nuance. IAM Groups are a best practice for human user permissions because: (1) one policy change affects all group members simultaneously; (2) adding/removing users from groups is simpler than attaching/detaching policies individually; (3) group membership makes permission auditing clearer ("what can this person do?" = "what groups are they in?"). However: IAM Groups do NOT work with IAM Roles (EC2, Lambda service accounts use roles, not groups). Groups are for human users only. The best practice is: users in groups for human access; IAM roles with specific policies for machine/service access.

---

### Learning Resources

**📹 Video Resources**
- *AWS IAM Explained* — AWS official YouTube — comprehensive 30-minute overview
- *Capital One Breach Technical Analysis* — cloud security YouTube channels cover this in detail
- *Principle of Least Privilege in AWS* — AWS re:Invent security tracks

**📖 Articles & Documentation**
- **AWS IAM Best Practices:** https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- **Capital One Breach Analysis (technical):** multiple security research publications are available
- **OWASP: SSRF Prevention** — https://owasp.org/www-community/attacks/Server_Side_Request_Forgery

**🔗 Interactive Practice**
- **AWS IAM Policy Simulator:** https://policysim.aws.amazon.com — test what specific IAM policies allow or deny without actually running the operations

---

## Chapter 11: Serverless Offerings Compared — Lambda vs. Functions vs. Cloud Functions

### Learning Objectives

**Estimated time:** 25 minutes theory + 15 minutes lab = 40 minutes  
**Prerequisites:** Chapter 10 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to explain the serverless model and what "serverless" actually means technically
- By the end of this chapter, you will be able to compare Lambda, Azure Functions, and GCP Cloud Functions across triggers, runtime support, and pricing
- By the end of this chapter, you will be able to identify workloads suited and unsuited for serverless execution

---

### Spark — A Question Before the Answer

"Serverless" is one of the most misleadingly named concepts in cloud computing. There are absolutely servers — they're just someone else's. What "serverless" actually means is: you don't manage the servers. You write a function, upload it, define what triggers it, and the cloud provider handles everything else — provisioning the server, scaling it, keeping it healthy, and charging you only for the exact milliseconds your code runs. No idle cost. No maintenance window. No capacity planning.

If you run code for 0.000001% of the time, why would you pay for a server running 100% of the time?

---

### Why This Matters

Serverless is not a niche pattern — it's the dominant execution model for event-driven workloads, API backends for mobile apps, data processing pipelines, and automation tasks at every scale. Understanding when and why to use serverless (and when not to) is a core cloud engineering competency. And since Lambda, Azure Functions, and GCP Cloud Functions all implement the same model, understanding the concept deeply means you can use any of them.

---

### Core Theory

**1. The Serverless Model — Function as a Service (FaaS)**

Serverless Function-as-a-Service (FaaS) has four defining characteristics:

**Event-triggered:** Functions execute in response to events — HTTP requests, file uploads, database changes, scheduled timers, queue messages. No event, no execution.

**Ephemeral:** Each invocation creates a new execution context (or reuses a warm one briefly). Don't rely on local state persisting between invocations.

**Automatic scaling:** The cloud scales from 0 to thousands of concurrent executions automatically. No capacity planning.

**Per-invocation pricing:** You pay only for actual execution time (milliseconds) and number of invocations. Zero cost when idle.

**2. Provider Comparison**

| Feature | AWS Lambda | Azure Functions | GCP Cloud Functions |
|---------|-----------|-----------------|-------------------|
| Timeout limit | 15 minutes | 230 seconds (consumption) | 60 min (2nd gen) |
| Max memory | 10,240 MB | 1.5 GB (consumption) | 32 GB (2nd gen) |
| Cold start | Varies by runtime | Varies | Varies |
| Supported runtimes | Node.js, Python, Java, Go, Ruby, .NET, custom | .NET, Node.js, Python, Java, PowerShell | Node.js, Python, Go, Java, Ruby, PHP |
| Free tier (monthly) | 1M requests, 400,000 GB-seconds | 1M requests, 400,000 GB-seconds | 2M requests, 400,000 GB-seconds |
| Deployment | ZIP, container image | ZIP, container | ZIP, container |

**3. The Cold Start Problem — The Key Tradeoff**

When a function hasn't been invoked recently, the cloud provider needs to provision a new execution environment — load the runtime, import your dependencies, initialize your code. This is a "cold start" — it adds 100ms to several seconds of latency depending on runtime and code size.

For high-traffic APIs, cold starts are not a problem (frequent invocations keep environments "warm"). For rarely-triggered functions, cold starts are unavoidable. For latency-sensitive workloads (like real-time payment processing), cold start latency may be unacceptable.

Cold start mitigation: Keep functions small (less to load), use lightweight runtimes (Node.js cold starts < Python < Java), use provisioned concurrency (AWS Lambda option — keep N environments always warm at a cost).

> **Real example:** Coca-Cola's vending machine payment processing (documented AWS blog). Coca-Cola replaced their vending machine payment backend with AWS Lambda, processing millions of transactions per day. The event-driven, per-invocation pricing model made economic sense: most vending machines are idle most of the time. A traditional server would be paying for idle time 90%+ of the day. Lambda only charges during actual transactions. Estimated cost savings: >70% vs. traditional server-based approach.

---

### Theory Checkpoint

1. What does "serverless" actually mean technically — what does the cloud provider handle vs. what do you handle?
2. What is a cold start and which workloads are most affected by it?
3. In the Coca-Cola example, why was Lambda economically superior to a traditional server — what was the specific cost driver?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Write and Deploy Your First Lambda Function**  
**Platform:** Browser (AWS Console) / AWS Free Tier  
**Tools needed:** AWS account (free tier), web browser  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** A working Lambda function triggered by an HTTP request.

**Step 1:** In AWS Console → Lambda → Create function → Author from scratch
- Function name: `my-first-function`
- Runtime: Python 3.12
- Architecture: x86_64

**Step 2:** Replace the default code with:
```python
import json

def lambda_handler(event, context):
    name = event.get('queryStringParameters', {}) or {}
    name = name.get('name', 'World')
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': f'Hello, {name}!',
            'function_name': context.function_name,
            'request_id': context.aws_request_id
        })
    }
```

**Step 3:** Deploy the function → Test with the default test event. See the response.

**Step 4:** Add a Function URL (Configuration → Function URL → Create) with auth type NONE. Copy the URL. Open it in a browser, then try adding `?name=YourName` to the URL.

**What success looks like:** A working HTTP endpoint that returns `{"message": "Hello, YourName!"}` when you visit the URL.

**Lab reflection:** Every time you hit the Lambda URL, a new execution context might spin up — or reuse a warm one. How would you determine if a response came from a cold start vs. a warm invocation? What metric would you monitor in CloudWatch to understand your function's cold start frequency?

---

### Quiz

**Quiz — Chapter 11**

1. What are the four defining characteristics of the serverless FaaS model?

2. In what specific scenarios is serverless a poor choice compared to a traditional always-on server?

3. In the Coca-Cola vending machine example, what was the economic argument for Lambda — walk through the cost comparison logic.

4. You're building a real-time trading platform API that needs sub-100ms response times at all times. Should you use Lambda? What specific serverless characteristic makes this problematic?

5. True/False: "Serverless" means there are no servers involved — the code runs on distributed network resources without any centralized server. Explain your answer.

---

### Key Takeaways

- **Serverless FaaS = event-triggered, ephemeral, auto-scaling, per-invocation pricing.** You manage code; the provider manages execution infrastructure.
- **Cold starts** are the key operational tradeoff — latency during first invocation or after idle periods. Mitigate with small functions, lightweight runtimes, or provisioned concurrency.
- **Lambda, Azure Functions, GCP Cloud Functions** implement the same model with different timeout limits, memory ceilings, and ecosystem integrations. Lambda has the most mature trigger ecosystem for AWS services.
- **Serverless is a tradeoff (zero idle cost vs. cold start latency vs. execution time limits)** — ideal for event-driven, sporadic, or highly variable workloads; less ideal for latency-sensitive or long-running workloads.
- Real serverless wins (Coca-Cola: 70%+ cost reduction) trace to matching pricing model to usage pattern — not serverless for everything, but serverless where the economics clearly favor it.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Four characteristics: (1) Event-triggered — executes only in response to defined events (HTTP, queue, file upload, timer); (2) Ephemeral — each invocation creates/reuses temporary execution context, local state doesn't persist; (3) Automatic scaling — cloud scales from 0 to thousands of concurrent executions; (4) Per-invocation pricing — charged for execution duration (ms) and invocation count only, zero cost at idle.

**Q2:** Poor serverless scenarios: (a) sustained high throughput (always-on EC2 is cheaper when utilization is consistently high — serverless pricing per-invocation becomes expensive at volume); (b) latency-sensitive workloads requiring consistent sub-100ms response (cold starts are unpredictable); (c) long-running processes exceeding timeout limits (Lambda max 15 minutes, Azure Consumption max 230 seconds); (d) workloads requiring local persistent state (databases, file system operations needing persistence across invocations); (e) workloads with complex dependency graphs that inflate cold start times (large Java applications, heavy ML models).

**Q3:** Coca-Cola cost comparison logic: (1) Traditional server: runs 24/7/365, charges for all hours regardless of transactions. Vending machine usage pattern: peak during lunch/breaks, nearly zero 10pm–6am. Paying for 100% uptime when using <30% is wasteful. (2) Lambda: charges only during actual transaction processing (milliseconds per payment). If 1 million transactions occur per month, each taking 200ms, total compute time = 200,000 seconds ≈ 55 hours. You pay for 55 hours of compute, not 720 hours of server uptime. Economic result: ~70% cost reduction by matching cost model to actual usage pattern.

**Q4:** Should not use Lambda for sub-100ms real-time trading requirements. Problematic characteristics: cold start latency — a Lambda function invoked after even brief idle period can add 200ms–2s of cold start time, far exceeding the 100ms requirement. Even with provisioned concurrency (which eliminates cold starts at additional cost), Lambda invocation overhead adds 1–10ms per call compared to an in-process function call. For sub-100ms consistent latency at scale, always-on compute (EC2, containers on ECS/EKS) with warm connection pools is the appropriate architecture. Lambda's economic and operational advantages don't outweigh the latency requirement violation.

**Q5:** False — "serverless" is a marketing term meaning "you don't manage servers," not "no servers exist." Your Lambda function runs on physical AWS servers in AWS data centers, on virtual machines managed by AWS, using a microVM technology (Firecracker) that creates an isolated execution environment for each function. The servers are very much there — they're just abstracted away from the developer's responsibility. You don't provision them, patch them, scale them, or pay for their idle time. But claiming no servers exist is technically incorrect and conceptually misleading.

---

### Learning Resources

**📹 Video Resources**
- *AWS Lambda in 15 Minutes* — AWS official YouTube
- *Serverless vs. Traditional Server: When to Use Each* — multiple architecture talks from AWS re:Invent
- *Cold Starts in AWS Lambda* — Lumigo and similar serverless monitoring companies have detailed analyses

**📖 Articles & Documentation**
- **AWS Lambda Developer Guide:** https://docs.aws.amazon.com/lambda/
- **Coca-Cola Lambda case study:** AWS case studies — https://aws.amazon.com/solutions/case-studies/coca-cola/
- **Azure Functions vs Lambda comparison:** Microsoft Docs and AWS have both published their perspectives

**🔗 Interactive Practice**
- **AWS Lambda Free Tier:** 1 million invocations free per month — build the function from today's lab and trigger it 100 times; check CloudWatch for cold start patterns

---

## Chapter 12: Hands-On — Creating Your First Free-Tier Accounts

### Learning Objectives

**Estimated time:** 10 minutes theory + 45 minutes lab = 55 minutes  
**Prerequisites:** All chapters in this Part

**Learning objectives:**
- By the end of this chapter, you will be able to create properly secured free-tier accounts on AWS, Azure, and GCP
- By the end of this chapter, you will be able to configure billing alerts to prevent unexpected charges on all three platforms
- By the end of this chapter, you will be able to enable MFA on root/admin accounts across all providers

**Chapter bridge:** This chapter produces the accounts you'll use throughout the rest of the course. Module 5 (IaC) and Module 6 (DevOps) labs require active cloud accounts — set them up now, configured correctly, and you'll never need to revisit account security settings.

---

### Hands-On Lab

**Lab: Create and Secure Three Cloud Free-Tier Accounts**  
**Platform:** Browser  
**Tools needed:** Email address, credit card (for verification — no charges on free tier), mobile phone (for MFA)  
**Estimated time:** 45 minutes (15 min per provider)  
**What you'll demonstrate:** Three secured, billing-protected cloud accounts ready for course labs.

**AWS Free Tier Account:**

**Step 1:** Navigate to https://aws.amazon.com/free → Create Free Account
- Use a personal email (not work email — keeps control if you leave)
- Note: credit card required for verification, no charges for free tier usage

**Step 2 (CRITICAL — Secure Root Account):**
- Sign in → top-right menu → Security credentials
- Enable MFA on root account: Virtual MFA device → scan with Google Authenticator or Authy
- Root account: use ONLY for account-level settings, NEVER for daily work

**Step 3 (Create Admin IAM User — for daily work):**
- IAM → Users → Create user → `admin-user`
- Attach policy: `AdministratorAccess`
- Enable console access → save credentials
- Enable MFA on this user too
- **Sign out of root, sign in with admin-user for all future work**

**Step 4 (Billing Alert):**
- Root account → Billing & Cost Management → Budgets → Create Budget
- Budget type: Cost budget → Monthly cost budget → $5 threshold
- Email notification at 80% ($4) and 100% ($5)

**GCP Free Tier:**

**Step 5:** Navigate to https://cloud.google.com/free → Get started for free
- 90-day trial includes $300 credit
- Create a project: `learning-cloud-[yourname]`
- Enable billing alerts: Billing → Budgets & alerts → Create Budget → $10/month → email notification

**Azure Free Account:**

**Step 6:** Navigate to https://azure.microsoft.com/en-us/free → Start free
- 12 months free services + $200 credit for 30 days
- Set up billing alert: Cost Management + Billing → Budgets → Add → $5 monthly

**What success looks like:**
- Three accounts created
- MFA enabled on all accounts
- Billing alerts configured on all three
- AWS has a non-root IAM user for daily work

**Lab reflection:** You now have access to three of the world's most powerful computing platforms for free. What's the smallest thing you could build this week on each platform that would teach you something new about that platform's specific character? Pick one idea for each provider and write it down.

---

### Quiz

**Quiz — Chapter 12**

1. Why should you never use the AWS root account for daily work, and what is the correct alternative?

2. What is MFA and why is it the single most important security control for cloud accounts?

3. A billing alert set at $5/month won't prevent charges if something goes terribly wrong (e.g., a forgotten GPU instance). What is the complete set of controls that together prevent unexpected bills?

4. You accidentally leave an EC2 instance running for a week. Using AWS free tier limits, when would you start being charged?

5. True/False: Free-tier accounts are suitable for production workloads because they provide real cloud services at no cost. Explain your answer.

---

### Key Takeaways

- **Root account = account recovery only.** Never use for daily work. Create an IAM admin user immediately and use it for everything.
- **MFA is the minimum viable security** for any cloud account. A compromised cloud account without MFA = immediate, catastrophic access to all your resources.
- **Billing alerts ≠ billing prevention** — alerts notify you; they don't stop charges. Defense-in-depth: billing alert + Service Quotas limits + regular cost review.
- **Free tier has specific limits** — EC2 t2/t3.micro hours, S3 5GB, Lambda 1M requests. Exceeding any limit starts billing. Know the limits for every service you use.
- Real cloud bills are full of "I forgot about that instance" stories — billing hygiene (alerts, budget checks, instance tagging) is an operational skill, not just a first-day setup.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Root account has unrestricted access to everything in the AWS account including billing, account deletion, and cancellation — it cannot be restricted by IAM policies. If root account credentials are compromised, the attacker has complete, unrestricted control. Correct alternative: IAM admin user with `AdministratorAccess` policy and MFA — this user has broad access but can be: restricted by specific policies, monitored by CloudTrail, temporarily revoked, and doesn't have account-level privileges (can't close the account, can't modify root). Root should only be used for tasks requiring root specifically (closing the account, enabling certain account features).

**Q2:** MFA (Multi-Factor Authentication) requires two factors to authenticate: something you know (password) and something you have (TOTP code from phone, hardware key). If your password is phished, leaked in a data breach, or guessed — an attacker still cannot log in without the second factor (your phone/device). Cloud accounts without MFA are vulnerable to credential stuffing attacks (automated testing of leaked passwords from other breaches), phishing, and password reuse exploitation. MFA is the single most impactful security control because: (a) it mitigates the most common attack vector (credential theft) and (b) it's free and fast to configure.

**Q3:** Complete billing protection stack: (1) Billing alert (notification — tells you something is wrong); (2) Service Quotas / Limits — request low quotas for expensive services you don't need (e.g., GPU instance quota of 0 prevents any GPU instance from being created); (3) AWS Budgets with budget action — automatically restrict IAM permissions when a budget threshold is hit; (4) Regular AWS Cost Explorer review (weekly during learning); (5) Instance/resource tagging with billing allocation — know what's running and why; (6) Terminate all resources after labs using `terraform destroy` or manual deletion.

**Q4:** AWS Free Tier EC2: 750 hours/month of t2.micro or t3.micro across all instances. One instance running continuously = ~744 hours/month (within free tier). BUT: if the instance has an Elastic IP address not attached to a running instance, or if data transfer exceeds free tier limits (15 GB/month outbound), charges begin. One t3.micro running alone for a week = ~168 hours → no charge (within 750-hour monthly limit). Two instances running simultaneously = 336 hours after one week → still within 750-hour limit. Charges begin only when total t2/t3.micro hours across all instances exceed 750 in a month.

**Q5:** False. Free-tier accounts are unsuitable for production workloads because: (a) free-tier instances (t2/t3.micro) have minimal compute resources — insufficient for real production load; (b) free-tier S3 (5 GB) is far smaller than production storage needs; (c) free tier expires — AWS free tier is 12 months for most services, 1 month for $200 GCP/Azure credits; (d) free-tier accounts lack production-grade SLA commitments; (e) free-tier resources are the same infrastructure but without reserved capacity guarantees that production workloads may need; (f) billing alerts won't prevent charges if production load suddenly spikes. Free tier = learning environment. Production requires production accounts with proper billing management and appropriately-sized resources.

---

### Learning Resources

**📹 Video Resources**
- *AWS Free Tier Setup — Complete Guide* — multiple up-to-date YouTube walkthroughs
- *How to Never Get an Unexpected AWS Bill* — cloud cost optimization channels
- *Azure Free Account Setup* — Microsoft Learn YouTube

**📖 Articles & Documentation**
- **AWS Free Tier Details:** https://aws.amazon.com/free/
- **GCP Free Tier:** https://cloud.google.com/free/docs/free-cloud-features
- **Azure Free Account:** https://azure.microsoft.com/en-us/free/

**🔗 Interactive Practice**
- **AWS Cost Explorer:** After setting up your account, explore the Cost Explorer immediately — even with $0 charges, understanding the interface now means you'll recognize anomalies faster when charges do occur

---

## 📚 Additional Resources for This Part

### Cross-Provider Service Mapping
A quick reference cheat sheet for translating services across providers:

| Capability | AWS | Azure | GCP |
|-----------|-----|-------|-----|
| Virtual machines | EC2 | Azure VMs | Compute Engine |
| Object storage | S3 | Blob Storage | Cloud Storage |
| Managed Kubernetes | EKS | AKS | GKE |
| Serverless compute | Lambda | Functions | Cloud Functions |
| Managed PostgreSQL | RDS | Azure DB for PostgreSQL | Cloud SQL |
| CDN | CloudFront | Azure CDN | Cloud CDN |
| DNS | Route 53 | Azure DNS | Cloud DNS |
| Load balancer | ALB/NLB | Azure Load Balancer | Cloud Load Balancing |
| Message queue | SQS | Service Bus | Pub/Sub |
| Container registry | ECR | ACR | Artifact Registry |

### Recommended Learning Path After This Part
- AWS: Cloud Practitioner certification → Solutions Architect Associate
- Azure: AZ-900 certification → AZ-104 (Administrator)
- GCP: Cloud Digital Leader → Associate Cloud Engineer
