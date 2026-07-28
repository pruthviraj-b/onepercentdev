# Module 2 — Cloud Platforms: AWS, Azure, GCP
## Chapter 24: AWS Core Services Deep Dive
### (EC2, S3, VPC, IAM — The Four Pillars)

---

## SECTION 1 — LEARNING OBJECTIVES

```
Chapter:          [Module 2] [Part A] — Chapter 24: AWS Core Services Deep Dive
Estimated time:   45 minutes theory + 30 minutes hands-on = 75 minutes
Prerequisites:    Chapter 23: Cloud Computing Models
```

**Learning Objectives:**
- Describe the purpose, configuration options, and pricing model of EC2, S3, VPC, and IAM
- Explain how the four pillars interrelate to form a complete cloud architecture
- Configure an S3 bucket with appropriate access controls
- Create an IAM role and policy following the principle of least privilege

**Chapter bridge:** This chapter covers AWS's four foundational services — the building blocks used in virtually every AWS deployment. It leads into Chapter 25 (Azure Core Services) for direct comparison, and the VPC and IAM concepts introduced here are deepened in Chapters 35-36 and 41 respectively.

---

## SECTION 2 — SPARK

AWS launched in 2006 with three services: S3 (object storage), SQS (message queuing), and EC2 (virtual machines). Thirteen years later they had 175 services. Today: over 200. The breadth of AWS is overwhelming — but here's the dirty secret that experienced AWS architects know: 80% of real workloads use the same 10 services. And four of those services are the foundation under everything else.

EC2 provides the compute. S3 provides the storage. VPC provides the network isolation. IAM provides the security boundary. Every other AWS service either uses these or provides an abstraction on top of them. Master these four and you can learn any other AWS service quickly, because you'll understand the substrate they're built on.

---

## SECTION 3 — WHY THIS MATTERS

AWS holds 31% of the global cloud market (2024), making it the most likely platform you'll work on. EC2, S3, VPC, and IAM appear in virtually every AWS architecture — from a simple static website (S3 + CloudFront) to a complex microservices deployment (EC2 + VPC + IAM + dozens of other services). Module 5 (Terraform) provisions all four of these services via code. Module 6 (DevOps) deploys applications to EC2 within VPCs secured by IAM roles. Understanding the four pillars makes those modules learnable in days instead of weeks.

---

## SECTION 4 — CORE THEORY

---

### 1. EC2 — Elastic Compute Cloud — The Compute Pillar

EC2 is AWS's virtual machine service (IaaS). You select:
- **Instance type** (CPU/RAM/network specs — covered in Ch 15)
- **AMI** (OS image — Amazon Linux, Ubuntu, Windows)
- **VPC and subnet** (where in the network it lives)
- **Security Group** (firewall rules)
- **Key Pair** (SSH authentication)
- **Storage** (EBS volumes — root + additional)

**EC2 Purchasing Models:**

| Model | Price | Commitment | Best For |
|-------|-------|-----------|---------|
| **On-Demand** | Highest | None | Unpredictable workloads, dev/test |
| **Reserved (1-3yr)** | 30-60% savings | 1-3 year term | Steady-state production workloads |
| **Savings Plans** | Similar to Reserved | 1-3 year compute spend | Flexible across instance types |
| **Spot** | 70-90% savings | None (can be interrupted 2-min notice) | Fault-tolerant batch, ML training |
| **Dedicated Hosts** | Highest | By hour or 1-3yr | Compliance, licensing requirements |

**Auto Scaling:** Define a minimum, desired, and maximum number of instances. Auto Scaling adds instances when CPU > 70%, removes when CPU < 30%. Requires a **Launch Template** (describes how to configure new instances) and an **Auto Scaling Group** (manages the fleet).

**EC2 Instance Metadata Service (IMDS):** Every EC2 instance can query its own metadata at `http://169.254.169.254/latest/meta-data/`. Returns: instance ID, instance type, public IP, IAM role credentials. This was the endpoint exploited in the Capital One breach (a web app was tricked into fetching credentials from IMDS on behalf of an attacker).

> **Real example: Lyft's Spot Instance Strategy.** Lyft runs ~70% of their EC2 compute on Spot Instances, saving tens of millions of dollars annually. Their architecture is designed for Spot interruption: stateless services that can be shut down with 2 minutes' notice and restarted on new Spot capacity. They use mixed fleets (On-Demand + Spot) to ensure minimum capacity. This demonstrates that Spot's risk (interruption) is manageable with good architecture — the savings are not theoretical.

---

### 2. S3 — Simple Storage Service — The Storage Pillar

S3 is AWS's object storage service — not a filesystem, but an HTTP-accessible key-value store for arbitrary data (files, images, videos, backups, static websites, ML datasets).

**Core concepts:**
- **Bucket:** A container for objects. Globally unique name across all AWS accounts.
- **Object:** A file + its metadata. Max object size: 5TB (multipart upload for >5GB).
- **Key:** The object's name (path). `images/user-123/profile.jpg` is a key, not a directory.
- **URL:** `https://bucket-name.s3.amazonaws.com/key` or `https://bucket-name.s3.region.amazonaws.com/key`

**S3 Storage Classes:**

| Class | Access Pattern | Retrieval | Price (approx) |
|-------|---------------|---------|----------------|
| Standard | Frequent | Immediate | $0.023/GB/mo |
| Standard-IA | Infrequent | Immediate | $0.0125/GB/mo |
| One Zone-IA | Infrequent, 1 AZ | Immediate | $0.01/GB/mo |
| Glacier Instant | Archive, occasional | Immediate | $0.004/GB/mo |
| Glacier Flexible | Archive, rare | 3-5 hours | $0.0036/GB/mo |
| Glacier Deep | Long-term archive | 12 hours | $0.00099/GB/mo |

**S3 Lifecycle Rules:** Automatically transition objects between storage classes based on age. Example: move to Standard-IA after 30 days, to Glacier after 90 days, delete after 365 days.

**S3 Security:**
- **Block Public Access:** Setting that prevents any public access regardless of bucket policy — always enable this on private buckets
- **Bucket Policy:** JSON document attached to bucket specifying who can do what
- **ACLs (deprecated):** Legacy per-object access control — disable in favor of policies
- **Presigned URLs:** Temporary signed URL for accessing private objects — used to give time-limited access without credentials

> **Real example: Capital One S3 Data Exfiltration, 2019.** The attacker used IAM credentials obtained via SSRF to access approximately 30 S3 buckets containing sensitive financial data. The S3 buckets weren't public — they were accessed via legitimate (but stolen) IAM credentials. The failure was at the IAM layer (over-privileged role), not the S3 layer. This shows that S3's security depends entirely on IAM policy correctness — S3 itself has no concept of "is this the right application making this request."

---

### 3. VPC — Virtual Private Cloud — The Network Pillar

A VPC is an isolated virtual network in AWS. It defines your private IP space and controls all traffic routing.

**VPC components:**
- **CIDR Block:** The IP range for the entire VPC (e.g., `10.0.0.0/16`)
- **Subnets:** Subdivisions of the VPC, each in one Availability Zone
  - **Public subnet:** Has route to Internet Gateway (internet-accessible)
  - **Private subnet:** No direct internet route (uses NAT Gateway for outbound)
- **Internet Gateway (IGW):** Allows traffic in/out of the VPC to the internet
- **NAT Gateway:** Allows private subnet instances to reach the internet (outbound only)
- **Route Tables:** Define where traffic is routed (local, internet, peered VPCs)
- **Security Groups:** Stateful per-instance firewalls
- **Network ACLs:** Stateless subnet-level firewalls

**Standard 3-tier VPC architecture:**
```
VPC: 10.0.0.0/16
  ├── Public Subnet (10.0.0.0/24, AZ-1)    → Load Balancer
  ├── Public Subnet (10.0.1.0/24, AZ-2)    → Load Balancer
  ├── Private Subnet (10.0.2.0/24, AZ-1)   → Application Servers
  ├── Private Subnet (10.0.3.0/24, AZ-2)   → Application Servers
  ├── Private Subnet (10.0.4.0/24, AZ-1)   → Databases (RDS)
  └── Private Subnet (10.0.5.0/24, AZ-2)   → Databases (RDS)
  
Internet Gateway → attached to VPC
NAT Gateway → in public subnet, routes private subnet outbound traffic
```

This architecture: public subnets accept internet traffic (load balancer), private subnets run application logic and databases (no direct internet access).

---

### 4. IAM — Identity and Access Management — The Security Pillar

IAM controls WHO can do WHAT to WHICH AWS resources. Zero-trust by default: no entity has access to anything unless explicitly granted.

**IAM components:**

**Users:** Long-lived identity for a human or machine. Has permanent credentials (password + access key). Best practice: only for humans needing console access. For machines: use roles.

**Groups:** Collections of users. Attach policies to groups to manage permissions at scale.

**Roles:** Temporary credentials assumed by AWS services, EC2 instances, Lambda functions, or cross-account entities. When an EC2 instance needs S3 access, attach an IAM role — the instance gets auto-rotating temporary credentials. No hardcoded access keys needed.

**Policies:** JSON documents defining permissions. Attached to users, groups, or roles.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

**Principle of Least Privilege:** Grant only the minimum permissions needed. An EC2 instance running a web app that reads from S3 should have a role with only `s3:GetObject` on the specific bucket — not `s3:*` on all buckets, not admin access.

**IAM Best Practices:**
- Never use root account for daily operations
- Enable MFA on root and all human users
- Use roles for EC2/Lambda/containers — never hardcode access keys
- Rotate access keys regularly for service accounts
- Use AWS Organizations for multi-account management (separate accounts for dev/staging/prod)

---

## SECTION 5 — THEORY CHECKPOINT

```
Quick Check:

1. Your application on EC2 needs to write to S3. Should you 
   create an IAM user and hardcode the access key in the app, 
   or use an IAM role? Why?

2. What is the difference between a Security Group and a NACL? 
   Which is stateful and which is stateless?

3. In the Capital One breach, the attacker accessed S3 buckets 
   using stolen IAM credentials. If the IAM role had followed 
   the principle of least privilege, what specifically would 
   have been different about the blast radius?

(Answers in Key Takeaways)
```

---

## SECTION 6 — HANDS-ON LAB

```
Lab: Configure S3 and IAM Together
Platform:         AWS Free Tier Account
Tools needed:     AWS Console, AWS CLI (optional)
Estimated time:   30 minutes
What you'll build: A private S3 bucket with an IAM role granting 
                  specific access — the pattern used in every 
                  production AWS deployment.
```

**Step 1: Create an S3 bucket**

1. Go to S3 → Create Bucket
2. **Name:** `onepercentdev-lab-[your-name]` (must be globally unique)
3. **Region:** us-east-1 (or your nearest region)
4. **Block all public access:** ✅ (all four checkboxes checked)
5. **Versioning:** Enable (optional but recommended)
6. Click Create

**Step 2: Upload a test file**

```bash
# Using AWS CLI (install: pip install awscli)
aws s3 cp /etc/os-release s3://onepercentdev-lab-[your-name]/test/os-release.txt

# Or use the Console: S3 → Your bucket → Upload
```

**Step 3: Create an IAM policy (read-only access to your bucket)**

IAM → Policies → Create Policy → JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::onepercentdev-lab-YOUR_NAME",
        "arn:aws:s3:::onepercentdev-lab-YOUR_NAME/*"
      ]
    }
  ]
}
```

Name it: `OnePercentS3ReadOnly`

**Step 4: Create an IAM role for EC2**

IAM → Roles → Create Role:
- Trusted entity type: **AWS Service**
- Use case: **EC2**
- Attach policy: `OnePercentS3ReadOnly`
- Role name: `OnePercentEC2S3Role`

**Step 5: Test (if you have an EC2 instance running)**

```bash
# On your EC2 instance (from Chapter 20 lab, if still running):
# First, attach the role: EC2 → Instance → Actions → Security → Modify IAM Role

# Test S3 access from the instance
aws s3 ls s3://onepercentdev-lab-YOUR_NAME/
aws s3 cp s3://onepercentdev-lab-YOUR_NAME/test/os-release.txt /tmp/

# Verify the credentials are coming from the role, not hardcoded keys
aws sts get-caller-identity
# Shows the role ARN — confirming role-based auth
```

**Step 6: Verify Block Public Access**

```bash
# Try to access the object publicly (should fail — 403)
curl https://onepercentdev-lab-YOUR_NAME.s3.amazonaws.com/test/os-release.txt
# Should return: 403 Forbidden
```

```
Lab reflection:
You've created the most common AWS security pattern: 
  EC2 instance + IAM role → access to specific S3 bucket

This pattern appears in every real deployment:
- Lambda function needs DynamoDB access? → IAM role
- ECS container needs ECR (container registry)? → IAM role
- Terraform running in CI/CD needs EC2 access? → IAM role

Notice what you did NOT do: create an IAM user, generate an 
access key, or put any credentials in your application code. 
This is the correct pattern. Credentials in code = security incident waiting to happen.

How does AWS know the EC2 instance has permission to access S3? 
Trace the flow from instance → IMDS → credentials → S3 API call.
```

---

## SECTION 7 — QUIZ

```
Quiz — Chapter 24

1. What is the difference between EC2 On-Demand and Spot pricing? 
   For which type of workload is each appropriate?

2. An S3 bucket has Block Public Access disabled and a bucket 
   policy that allows `s3:GetObject` from `"*"` (all principals). 
   What is the security implication, and what command would verify 
   an object is publicly accessible?

3. In the standard 3-tier VPC architecture, why are the database 
   subnets in private subnets with no internet route? What specific 
   attack does this prevent?

4. Your CI/CD pipeline on GitHub Actions needs to deploy to EC2 
   and upload artifacts to S3. What is the most secure way to 
   grant these permissions without using a permanent IAM user?

5. True/False: "IAM roles are more secure than IAM user access 
   keys for granting EC2 instances AWS service access."
   Explain your answer.
```

---

## SECTION 8 — KEY TAKEAWAYS

- **EC2 = compute (VMs). S3 = object storage. VPC = network isolation. IAM = identity/access.** These four services appear in 80%+ of real AWS architectures. Every other service builds on them.
- **Always use IAM roles for compute resources — never hardcoded keys.** Roles provide auto-rotating temporary credentials via IMDS. Hardcoded keys are permanent vulnerabilities waiting to be committed to git.
- **S3 Block Public Access is the safety net — never disable it on private data.** Bucket policies control fine-grained access; Block Public Access is the emergency brake that prevents accidental public exposure.
- **VPC defines your security perimeter.** Public subnets for load balancers; private subnets for application servers and databases. No database should have a route to the internet.
- **Least privilege + roles + no public access = the three IAM/S3 security commandments.** The Capital One breach violated all three. Following them dramatically reduces blast radius even when other controls fail.

---

## SECTION 9 — ANSWER KEY (INSTRUCTOR ONLY)

**Q1:** On-Demand: pay per second, no commitment, can stop anytime. Best for: unpredictable workloads, development, applications where interruption is unacceptable. Spot: up to 90% discount, but AWS can reclaim the instance with 2-minute notice. Best for: fault-tolerant, stateless, or checkpointed workloads — batch processing, CI/CD build agents, ML training jobs, video transcoding. Anything that can be interrupted and resumed.

**Q2:** Security implication: the object is publicly readable by anyone on the internet without authentication. This is how sensitive data breaches via S3 happen (thousands have occurred). Verification: `curl https://bucket-name.s3.amazonaws.com/object-key` — if it returns the object, it's public. Or: AWS Console → S3 → Object → Object URL. The correct fix: enable Block Public Access, remove the wildcard public bucket policy, use presigned URLs for legitimate temporary access.

**Q3:** Databases in private subnets have no internet route, so no traffic from the internet can initiate a connection to them directly. Even if an attacker knows the private IP and database port, there is no path from the internet to reach it (no Internet Gateway route in the subnet's route table). This prevents direct database attacks: port scanning, brute force login attempts, SQL injection via direct DB connection. The only way to reach the DB is through the application server in the private subnet — which is the intended access path.

**Q4:** Use OpenID Connect (OIDC) identity federation — GitHub Actions supports it natively. Configure an IAM Identity Provider for GitHub Actions, create an IAM role with a trust policy allowing GitHub Actions to assume it (based on repository name, branch, etc.), and attach the minimum required policies (EC2 deploy + S3 upload). In the GitHub workflow, use `aws-actions/configure-aws-credentials` with the role ARN. No long-lived credentials ever stored in GitHub Secrets — credentials are generated per-workflow-run.

**Q5:** True. IAM role credentials on EC2 instances are: (1) Automatically rotated by AWS (typically every hour) — access keys never expire unless manually rotated. (2) Not stored anywhere — they're dynamically fetched from IMDS and exist only in memory. (3) Cannot be accidentally committed to code repositories — there's no credential file to leak. (4) Scoped to the instance's IAM role — stolen credentials from IMDS work only until the next rotation. IAM user access keys: permanent until manually rotated, must be stored somewhere (environment variable, file, secrets manager), can be leaked via git commits, environment variable dumps, or log files.

---

## SECTION 10 — LEARNING RESOURCES

**📹 Videos**
- **"AWS IAM Tutorial for Beginners" — TechWorld with Nana** — Comprehensive IAM walkthrough with hands-on
- **"Amazon S3 Tutorial for Beginners" — Stephane Maarek** — S3 deep dive covering all storage classes
- **"AWS VPC — A Practical Introduction" — Be A Better Dev** — Best VPC visual walkthrough

**📖 Articles**
- **AWS Well-Architected Framework — Security Pillar** — Official guidance on IAM and security best practices
- **AWS IAM Best Practices (official documentation)** — The definitive reference for IAM configuration
- **AWS S3 Security Best Practices (official)** — Bucket policies, Block Public Access, encryption

**🔗 Practice**
- **AWS Skill Builder (free)** — Official AWS training including hands-on labs for EC2, S3, VPC, IAM
- **CloudGoat (Rhino Security Labs)** — Intentionally vulnerable AWS environment for practicing security concepts — excellent for understanding what bad IAM looks like
