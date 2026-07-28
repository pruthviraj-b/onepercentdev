# Module 2 — Cloud Platforms: AWS, Azure, GCP
## Chapter 23: Cloud Computing Models
### (IaaS, PaaS, SaaS — and the Shared Responsibility Model)

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 2] [Part A] — Chapter 23: Cloud Computing Models
Estimated time:   35 minutes theory + 15 minutes hands-on = 50 minutes
Prerequisites:    Module 1 Complete (Chapters 1–22)
```

**Learning Objectives:**
- Define IaaS, PaaS, and SaaS and describe the trade-offs of each
- Apply the AWS Shared Responsibility Model to understand who secures what in cloud deployments
- Map common cloud services (EC2, Elastic Beanstalk, S3, Gmail) to their correct model
- Make informed decisions about which abstraction layer fits a given engineering problem

**Chapter bridge:** This chapter opens Module 2 with the conceptual framework for all cloud computing. It leads into Chapter 24 (AWS Core Services Deep Dive) where the IaaS/PaaS taxonomy is applied concretely to AWS services.

---

## SECTION 2 — SPARK

Before cloud computing, there were two ways to run software: build a data center (buy everything, own everything, manage everything) or hire a managed hosting company (they own the hardware, you own the software). Both models put the operational burden — hardware failures, network maintenance, physical security, power backup — on someone who'd rather be writing code.

Cloud computing introduced a spectrum of delegation. At one end: you own everything down to the virtual machine and manage it yourself (IaaS). In the middle: the cloud provider manages the runtime, OS, and middleware; you manage only your application code and data (PaaS). At the far end: the provider manages everything and you just use a finished product as a subscriber (SaaS). The question every engineering team answers — often without explicitly realizing it — is: *how much do we want to manage?* More management = more control + more burden. Less management = less control + less work. This chapter makes that tradeoff explicit so you can make it deliberately.

---

## SECTION 3 — WHY THIS MATTERS

Every cloud architecture decision is implicitly an IaaS vs PaaS vs SaaS decision. When your team debates "should we use EC2 with custom AMIs" vs "should we use Elastic Beanstalk" vs "should we use a managed SaaS database" — that's a cloud model discussion. Getting this wrong costs both time and money: over-managing (choosing IaaS when PaaS would work) means your team spends hours patching OS vulnerabilities instead of building features. Under-managing (choosing SaaS when you need customization) means you hit platform limitations mid-project. The Shared Responsibility Model tells you who's legally responsible for what — critical for compliance and security audits.

---

## SECTION 4 — CORE THEORY

---

### 1. On-Premises vs Cloud — The Baseline Comparison

**On-premises (on-prem):** Everything in your own data center. You own and manage: physical hardware, network switches, power, cooling, operating system, runtime, middleware, application, and data. Full control, full responsibility, high capital expenditure.

**Cloud computing:** A third party owns and operates the physical infrastructure. You rent compute, storage, and networking on-demand. Pay-per-use, elastic scaling, no upfront hardware purchase.

Cloud computing delivers three key value propositions:
1. **Elasticity:** Scale resources up or down in seconds (not weeks of hardware provisioning)
2. **Pay-as-you-go:** Pay only for what you use — no idle server costs
3. **Reduced operational burden:** No hardware maintenance, power, cooling, or physical security

But cloud doesn't eliminate operational responsibility — it *redefines* it. This is the crux of IaaS vs PaaS vs SaaS.

---

### 2. The Three Models — What You Manage vs What They Manage

Imagine building a pizza restaurant as a metaphor:

| Layer | Managed By | On-Prem (Build It All) | IaaS | PaaS | SaaS |
|-------|-----------|----------------------|------|------|------|
| **Data** | You | You | You | You | Provider |
| **Application** | You | You | You | You | Provider |
| **Runtime** | Varies | You | You | Provider | Provider |
| **Middleware** | Varies | You | You | Provider | Provider |
| **OS** | Varies | You | You | Provider | Provider |
| **Virtualization** | Provider | You | Provider | Provider | Provider |
| **Servers** | Provider | You | Provider | Provider | Provider |
| **Storage** | Provider | You | Provider | Provider | Provider |
| **Networking** | Provider | You | Provider | Provider | Provider |

---

**IaaS (Infrastructure as a Service):**
The provider gives you virtual machines, storage, and networking. You manage everything above the hypervisor: OS, runtime, middleware, application, data.

- **AWS examples:** EC2, EBS, VPC, S3
- **Azure examples:** Azure Virtual Machines, Azure Disk Storage
- **GCP examples:** Compute Engine, Persistent Disk

Best for: Full control requirements, legacy app migration, custom OS configurations, specific compliance requirements, teams with strong Linux/Windows administration skills.

Worst for: Small teams without ops expertise, fast-moving startups that can't dedicate resources to OS management.

**PaaS (Platform as a Service):**
The provider manages OS, runtime, middleware, scaling, and infrastructure. You deploy only your application code and manage your data.

- **AWS examples:** Elastic Beanstalk, Lambda (serverless), RDS (managed database), ECS/Fargate (managed containers)
- **Azure examples:** Azure App Service, Azure Functions, Azure SQL Database
- **GCP examples:** App Engine, Cloud Run, Cloud SQL

Best for: Rapid development, small teams, standard runtime environments, when infrastructure management is not the core competency.

Worst for: Applications requiring non-standard OS configurations, performance-critical workloads needing fine-tuned environments, regulated workloads needing exact control of the OS layer.

**SaaS (Software as a Service):**
The provider manages everything. You use the software through a browser or API. No infrastructure decisions at all.

- **Examples:** Gmail, Salesforce, Slack, Dropbox, GitHub, Datadog, PagerDuty

Best for: Standard business workflows (email, CRM, monitoring), where build vs buy clearly favors buy.

Worst for: Unique requirements that no existing SaaS product fits, data residency requirements in countries where the SaaS provider doesn't have servers.

> **Real example: Dropbox's "Reverse Cloud Migration," 2016.** Dropbox had been running on AWS (IaaS) for years. In 2016, they moved 90% of their data off AWS onto their own custom hardware — saving an estimated $74.6 million over two years. Their workload was so specific (petabytes of cold object storage) that building custom hardware optimized for their exact use case was cheaper at their scale. This is the IaaS vs on-prem decision at extreme scale: Dropbox got large enough that managing their own hardware became economically superior to paying AWS for generic infrastructure. Most companies never reach this scale — but it illustrates that the IaaS choice always has an associated cost-at-scale curve.

---

### 3. The Shared Responsibility Model — Who Secures What

AWS defines a **Shared Responsibility Model** that specifies the boundary between AWS's security responsibilities and the customer's:

**AWS is responsible for:**
- Physical security of data centers
- Hardware maintenance and replacement
- Hypervisor security and patching
- Network infrastructure security
- Managed service security (e.g., RDS patch management, Lambda runtime)

**Customer is responsible for:**
- OS security and patching (for IaaS — EC2)
- Network configuration (security groups, NACLs, VPC)
- IAM — who can access what
- Data encryption (at rest and in transit)
- Application-level security
- Firewall rules
- Detecting and responding to incidents in their application

**The line shifts based on service level:**

| Service | AWS Responsible | Customer Responsible |
|---------|----------------|---------------------|
| **EC2 (IaaS)** | Hypervisor, hardware, network | OS patches, app, data, firewalls |
| **RDS (Managed DB)** | OS patches, DB engine, hardware | DB config, schemas, access control, data |
| **Lambda (Serverless)** | Runtime, OS, hardware, scaling | Function code, IAM, data |
| **S3** | Durability, hardware, replication | Access policies, encryption, public/private settings |

**Common customer failures (not AWS's fault):**
- EC2 instance with unpatched OS (customer's job to patch)
- S3 bucket left public (customer's misconfiguration)
- Weak IAM permissions (customer's responsibility)
- Unencrypted sensitive data (customer's choice)

The Capital One breach (Chapter 11) is an example of customer responsibility failure: misconfigured IAM permissions allowed SSRF to access metadata credentials. AWS's infrastructure was secure — the customer's configuration was not.

> **Real example: Tesla Kubernetes Dashboard Breach, 2018.** Security researchers discovered that Tesla's Kubernetes dashboard was exposed to the public internet without authentication. Attackers installed cryptocurrency mining software inside Tesla's cloud. Was this AWS's fault? No. AWS's infrastructure was functioning normally. The misconfiguration (exposing the management dashboard publicly) was entirely the customer's responsibility. The shared responsibility model is not just a legal document — it's a security architecture principle: knowing which half is yours tells you what to audit.

---

### 4. Cloud Deployment Models — Not All Cloud Is Public Cloud

Beyond service models (IaaS/PaaS/SaaS), cloud deployments have structural models:

**Public Cloud:** AWS, Azure, GCP — infrastructure shared among many customers, accessed over the internet. Most common. Elastic, pay-per-use.

**Private Cloud:** Cloud infrastructure dedicated exclusively to one organization. Runs in their own data center. More control, less elasticity. Example: VMware vSphere + vCloud, OpenStack.

**Hybrid Cloud:** Combination of on-premises/private cloud and public cloud, connected via VPN or Direct Connect. Example: financial data stays on-premises (compliance), customer-facing web app on AWS.

**Multi-Cloud:** Using multiple public cloud providers simultaneously. Example: primary workload on AWS, ML workloads on GCP (for TPUs), data backup on Azure. Reduces vendor lock-in, increases complexity.

**Ask yourself:** A healthcare company has a legacy electronic health record (EHR) system that runs only on Windows Server 2012 and cannot be migrated. They want to modernize their patient portal (a web app). What deployment model makes sense, and which services would you use?

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. A startup team of 4 engineers wants to deploy a Python web 
   app quickly without managing servers. Which cloud model 
   (IaaS/PaaS/SaaS) fits best, and name one specific AWS service?

2. Your company's security audit asks: "Who is responsible for 
   patching the OS on your EC2 instances?" What is the correct 
   answer, and which document defines this?

3. In the Dropbox reverse migration, they moved from IaaS to 
   on-premises. What specific economic condition made this 
   rational — and why doesn't this apply to most companies?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Explore AWS Service Models
Platform:         AWS Free Tier account
Tools needed:     AWS Console, AWS CLI (optional)
Estimated time:   15 minutes
What you'll demonstrate: You can identify and categorize AWS services 
                  by their cloud model and understand what you manage.
```

**Step 1: Navigate the AWS console and categorize services**

Go to the AWS Console (console.aws.amazon.com) and find these services. For each, identify: IaaS, PaaS, or SaaS?

```
EC2         → ______
RDS         → ______
Lambda      → ______
Elastic Beanstalk → ______
S3          → ______
CloudFront  → ______
EKS         → ______
Fargate     → ______
SageMaker   → ______
```

**Step 2: Read the Shared Responsibility Model page**

Go to: aws.amazon.com/compliance/shared-responsibility-model/

Read the diagram. Then answer:
- Who patches the RDS database engine?
- Who controls which IPs can connect to your EC2 instance?
- If an EC2 instance is compromised via an unpatched Apache vulnerability, whose fault is it?

**Step 3: Compare pricing at different abstraction levels**

Use AWS Pricing Calculator (calculator.aws):

Configure these equivalent scenarios (1 web server, 1 database):
1. **IaaS:** EC2 t3.small + RDS t3.micro MySQL
2. **PaaS:** Elastic Beanstalk (uses EC2 underneath, similar price) + RDS
3. **Serverless PaaS:** Lambda + RDS (or DynamoDB)

Compare: the raw price is similar but the *management overhead* differs dramatically.

**Step 4: Identify your current SaaS tools**

List all SaaS tools your team or you personally use:
- Email: _____ (Gmail, Outlook)
- Code hosting: _____ (GitHub, GitLab)
- Communication: _____ (Slack, Teams)
- Monitoring: _____ (Datadog, New Relic, PagerDuty)
- CI/CD: _____ (GitHub Actions, CircleCI)

For each: what would it cost in engineering time if you had to build it yourself? This is the make-vs-buy calculation behind every SaaS decision.

```
Lab reflection:
You categorized AWS services and compared the cost of IaaS vs 
PaaS vs SaaS.

Here's the key insight: the *price* of IaaS and PaaS often looks 
similar. The real difference is engineering time.

A team choosing EC2 + manual configuration needs someone who 
can patch Linux, configure nginx, manage SSL certificates, 
monitor disk usage, and handle security updates.

A team choosing Elastic Beanstalk gets all of that handled 
automatically — they deploy a zip file and AWS manages the rest.

For a 2-person startup: which would you choose, and why?
For a regulated enterprise with specific compliance requirements: 
which might be necessary?

This is not a hypothetical — you'll revisit this decision 
in Module 7 when you design the architecture for the capstone project.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 23

1. A company uses AWS Lambda for their API and AWS RDS for their 
   database. Who is responsible for patching the Lambda runtime? 
   Who is responsible for patching the database OS? 
   Who is responsible for the SQL queries in the application?

2. The Tesla Kubernetes dashboard breach in 2018 exposed mining 
   software in Tesla's cloud. Was this AWS's security failure, 
   Tesla's security failure, or both? Explain using the 
   Shared Responsibility Model.

3. A startup CTO argues: "We should use EC2 instead of Elastic 
   Beanstalk because we have more control." List two situations 
   where this is a good argument and two where it's a poor argument.

4. Explain the economic logic behind Dropbox's reverse migration 
   from AWS to custom hardware. At what scale does this typically 
   become rational?

5. True/False: "A multi-cloud strategy always reduces risk compared 
   to single-cloud deployment."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **IaaS = you manage OS up. PaaS = you manage app up. SaaS = you use it.** The more abstraction, the less control, the less burden. Choose based on team capability and control requirements, not trend.
- **The Shared Responsibility Model is a contract.** AWS secures the infrastructure. You secure your configuration, code, data, and access controls. Misconfigurations (public S3, wide IAM, exposed admin panels) are always the customer's fault.
- **Public → Private → Hybrid → Multi-cloud: increasing complexity.** Public cloud wins on elasticity and cost for most workloads. Private cloud wins on control and compliance isolation. Hybrid covers existing investments. Multi-cloud reduces lock-in but doubles operational complexity.
- **Make vs buy is always a time + control tradeoff.** Building your own email server (IaaS) gives full control but costs months of engineering. Gmail (SaaS) works in minutes. The right answer depends on whether the activity is core to your business value.
- **Real incidents (Dropbox migration, Tesla breach) trace to these fundamentals** — cloud model choice affects both cost at scale and the security responsibility allocation that determines who's liable when things go wrong.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** Lambda runtime patching: AWS (they manage the Lambda execution environment, runtime versions, and underlying OS). RDS database OS patching: AWS (RDS is a managed service — AWS patches the OS and database engine, not you). SQL queries in the application: Customer (the application code and database schema are always the customer's responsibility regardless of managed service level).

**Q2:** Tesla's security failure, not AWS. AWS's infrastructure was functioning normally and was not breached. Tesla misconfigured their Kubernetes deployment by exposing the management dashboard publicly without authentication. Under the Shared Responsibility Model, network configuration (which services are publicly accessible), access control (requiring authentication), and application security are all customer responsibilities. AWS provides tools to prevent this (Security Groups, VPC, IAM) — Tesla chose not to use them correctly.

**Q3:** Good arguments for EC2 over EB: (1) Non-standard runtime requirements (Elastic Beanstalk has limited platform support — if you need a specific OS version, kernel module, or niche runtime, EC2 is necessary). (2) Specific performance tuning requirements (CPU affinity, NUMA configuration, huge pages for databases). Poor arguments for EC2 over EB: (1) Small team without dedicated ops — EB automates patching, scaling, and deployment that EC2 requires manual work for. (2) Fast iteration/MVP stage — EB deploys in one command; EC2 requires setting up nginx, systemd services, deployment scripts.

**Q4:** Dropbox's economic logic: at their scale (petabytes of cold storage), AWS's general-purpose storage pricing was significantly higher than the cost of custom hardware built specifically for dense cold storage. Custom hardware optimized for their exact use case (very low write frequency, very high storage density, no need for compute features they weren't using) cost significantly less per TB than AWS S3. This becomes rational when: (1) workload is highly predictable (no elasticity needed), (2) engineering team has hardware expertise, (3) scale is large enough (typically $1B+ revenue companies) that the upfront capital is justified. Most companies reach this never or at extremely large scale.

**Q5:** False. Multi-cloud reduces some risks while introducing others. Risks reduced: vendor lock-in, single cloud provider outage affecting all workloads. Risks introduced: (1) dramatically increased operational complexity (two sets of tools, services, and expertise), (2) potential for misconfigurations at integration points, (3) higher personnel cost (engineers with multi-cloud expertise are rarer and more expensive), (4) data transfer costs (moving data between clouds is expensive). For most organizations, a well-architected single-cloud deployment with multi-AZ and multi-region architecture provides better resilience than a multi-cloud deployment that's harder to operate correctly.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"IaaS vs PaaS vs SaaS" — IBM Technology** — Clear animated explanation of all three models
- **"AWS Shared Responsibility Model" — AWS re:Invent** — Official AWS explanation with real compliance examples
- **"Cloud Computing Models Explained" — TechWorld with Nana** — Practical comparison with cloud-native context

**📖 Articles**
- **AWS Shared Responsibility Model (official)** — aws.amazon.com/compliance/shared-responsibility-model
- **"IaaS, PaaS, or SaaS — What's the Difference?" — Salesforce Blog** — The SaaS company's perspective on all three
- **Dropbox Tech Blog: "Magic Pocket Infrastructure"** — Dropbox's own explanation of their infrastructure decision

**🔗 Practice**
- **AWS Well-Architected Framework (free)** — AWS's official guidance on making cloud architecture decisions including service model selection
- **AWS Free Tier** — Explore EC2, Elastic Beanstalk, Lambda, and RDS side by side — the hands-on comparison is the best teacher
