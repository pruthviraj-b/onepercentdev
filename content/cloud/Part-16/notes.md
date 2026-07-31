# Part 16 — Committing & Getting Set Up

Setting up your cloud account securely is non-negotiable. We go through establishing secure account defaults (IAM roles, MFA), learning to navigate cloud console dashboards, and detailing your platform learning roadmap.

---

## Chapter 23: Setting Up Your Primary Cloud Account Properly (Security Basics from Day One)

### Learning Objectives
**Estimated time:** 20 minutes theory + 15 minutes lab = 35 minutes
**Prerequisites:** Module 2, Part D

**Learning objectives:**
- Identify the extreme risks associated with root account compromise.
- Explain the principle of least privilege.
- Configure Multi-Factor Authentication (MFA) and billing alerts on a new cloud account.

---

### Spark — A Question Before the Answer
In 2014, a developer accidentally committed their AWS credentials to a public GitHub repository. Within 5 minutes, automated bots scraped the keys and spun up dozens of massive servers to mine cryptocurrency. By the time the developer woke up, their AWS bill was $50,000. How do you ensure this never, ever happens to you on your first day of learning?

### Why This Matters
When you create a cloud account, you are handing the provider a credit card with theoretically infinite limits. Security is not an "advanced topic" you learn later; it is the absolute prerequisite to clicking a single button in a cloud console. If you compromise your account, you are financially liable. 

### Core Theory

**1. The Root Account (The Keys to the Kingdom)**
When you sign up for AWS, Azure, or GCP with an email address, you create the **Root User**. This user can do *anything* — delete the entire account, change billing details, spin up $100,000 worth of servers.
- **The Golden Rule:** You should NEVER use the root account for daily tasks. You use it exactly once: to create an admin user for yourself, and then you lock the root account away.

**2. IAM (Identity and Access Management)**
IAM is how you control who can do what in your cloud. 
- **Users:** Real people or applications.
- **Policies:** JSON documents that explicitly state what is allowed (e.g., "Allow creating EC2 instances, but Deny deleting S3 buckets").
- **Roles:** Temporary permissions assumed by a user or a service. (e.g., giving a virtual machine a role so it can read an S3 bucket without needing hardcoded passwords).
- **The Principle of Least Privilege:** You give a user the exact minimum permissions required to do their job, and nothing more.

**3. Multi-Factor Authentication (MFA)**
Passwords are fundamentally broken; they are easily guessed, reused, or stolen in breaches. MFA requires a second piece of evidence (like a code from your phone's Authenticator app) to log in. In the cloud, MFA on your Root account is mandatory.

*Real example:* The infamous **Capital One breach** in 2019 (exposing 100 million credit card applications) happened partly because a web firewall was compromised, and that firewall had been granted an IAM role with far too many permissions. The attacker used the firewall's excessive IAM permissions to read sensitive S3 buckets. IAM misconfiguration is the #1 cause of cloud breaches.

### Theory Checkpoint
1. Why must you never use the root account for daily engineering tasks?
2. What is the Principle of Least Privilege?

---

### Hands-On Lab
**Lab: Securing the Vault**
*(Note: These instructions are generalized; follow your specific provider's current UI)*
1. **Create the Account:** Sign up for an AWS Free Tier (or Azure/GCP) account.
2. **Lock the Root:** Immediately go to the IAM dashboard. Find "Add MFA" for the root user. Scan the QR code with Google Authenticator or Authy.
3. **Create an Admin User:** Create a new IAM User for yourself. Give it "AdministratorAccess" (or equivalent). Enable MFA on this user too.
4. **Log Out:** Log out of the root account and log back in using your new Admin User credentials.
5. **Set a Billing Alarm:** Go to the Billing Dashboard. Create an alert that emails you instantly if your estimated charges exceed $5.00 for the month. (This is your safety net against cryptocurrency mining bots).

---

### Quiz
1. What is the difference between an IAM User and an IAM Role?
2. How does a billing alert protect you from compromised credentials?
3. True/False: An Admin IAM user is just as dangerous as the Root user if compromised.

### Key Takeaways
- The Root account is for account creation and billing emergencies only. Lock it with MFA.
- IAM (Identity and Access Management) controls every single action in the cloud.
- Setting a $5 billing alert on day one is mandatory insurance against mistakes or hacks.

### Instructor Answer Key
1. A user represents a permanent entity (person or app) with long-term credentials. A role represents temporary permissions that can be assumed for a short time.
2. If your keys are stolen and hackers spin up massive servers, the billing alert notifies you immediately when the cost crosses a tiny threshold, allowing you to shut it down before the bill reaches tens of thousands of dollars.
3. Mostly True. An Admin user can destroy your infrastructure, but unlike the Root user, it usually cannot close the account entirely or change fundamental billing contracts. Regardless, both must be fiercely protected with MFA.

---

## Chapter 24: Hands-On: Navigating the Console Like a Pro

### Learning Objectives
**Estimated time:** 15 minutes lab

**Learning objectives:**
- Decipher the layout of a major cloud provider console.
- Identify where global vs. regional settings are applied.

---

### Spark — A Question Before the Answer
You log into AWS for the first time, click "Services", and are hit with a wall of over 200 randomly named products — Macie, SageMaker, Fargate, Glue. It is overwhelmingly complex. How do senior engineers actually navigate this without memorizing all 200 services?

### Why This Matters
Cloud consoles are famously terrible. They change UI layouts constantly. If you try to memorize where a button is, you will be lost when they redesign it next month. You must learn the *logic* of the console, not the layout.

### Core Theory

**1. The Search Bar is Your Best Friend**
Senior engineers do not navigate through nested menus. They use the search bar at the top of the screen. Want EC2? Type EC2. Want billing? Type Billing. 

**2. Global vs. Regional Context**
This is the most common beginner mistake. Cloud consoles operate in a specific context. 
- If you are in the **N. Virginia (us-east-1)** region and you spin up a server, that server lives in Virginia.
- If you accidentally switch the console dropdown to **London (eu-west-2)**, your server will completely disappear from the screen.
- *Panic moment:* Beginners often think their server was deleted. It wasn't. They are just looking at the wrong map. Always check your Region dropdown in the top right corner.

**3. Global Services**
A few services do not have a region because they govern the whole account. IAM (Identity) and Billing are global. When you click into IAM, you'll notice the Region dropdown disappears or grays out.

### Hands-On Lab
**Lab: Console Reconnaissance**
1. Log into your new cloud account.
2. Find the Region dropdown (usually top right). Switch to a region far away from you (e.g., Tokyo).
3. Use the Search bar to navigate to the Compute service (EC2 / Virtual Machines).
4. Use the Search bar to navigate to IAM. Notice what happened to the Region dropdown.
5. Bookmark the Billing Dashboard. You will visit it often.

---

### Quiz
1. You spun up a database yesterday, but today when you log in, the database dashboard says "0 instances running." What is the most likely mistake you made?
2. Name one service that is "Global" and does not belong to a specific region.

### Key Takeaways
- Ignore the menus; use the search bar.
- Always be acutely aware of which Region your console is currently focused on.
- Don't memorize UIs; UIs change. Memorize concepts.

### Instructor Answer Key
1. You are looking at the wrong region in the console dropdown.
2. IAM (Identity and Access Management) or Billing.

---

## Chapter 25: Building Your Learning Roadmap for Your Chosen Platform

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Establish a structured, milestone-based approach to learning cloud infrastructure.
- Avoid the "tutorial hell" trap.

---

### Spark — A Question Before the Answer
Why do thousands of people pass the AWS Solutions Architect exam every year, but fail technical interviews for Junior Cloud roles? What is the missing link between knowing the theory of a cloud service and being employable?

### Why This Matters
Certifications provide structured theory, but theory without application is useless in a technical interview. Your roadmap must balance studying for the exam with building things that break.

### Core Theory

**The 3-Pillar Roadmap Strategy**

**Pillar 1: The Core Services (Theory)**
You must learn the "Big 4" before touching anything else:
1. **Compute:** EC2 / VMs
2. **Networking:** VPC (Subnets, Routing, Firewalls)
3. **Storage:** S3 / Blob Storage
4. **Identity:** IAM

**Pillar 2: The Practical Application (Projects)**
Do not wait until you finish a certification course to build something.
- Build a static website hosted on S3.
- Build a WordPress site on an EC2 instance, connected to a separate RDS database.
- *Crucially:* Do not just follow tutorials. Follow a tutorial, delete the infrastructure, and then try to build it again from memory. When it breaks, reading the logs to fix it is where actual learning happens. (This is escaping "tutorial hell").

**Pillar 3: The Automation Layer (Next Level)**
Once you can build things by clicking in the console, you must immediately stop clicking in the console. The rest of your journey (Module 4 onwards in this course) is about learning to deploy those exact same services using Infrastructure as Code (Terraform) and CI/CD pipelines.

### Hands-On Lab
**Lab: Declare Your Path**
Write down your personal roadmap in a text file:
- **Target Certification:** (e.g., AWS SAA-C03)
- **First Project Goal:** (e.g., Host my resume as a static website on S3 by [Date])
- **Study Schedule:** (e.g., 1 hour theory daily, 3 hours lab on Saturdays)

---

## 📚 Learning Resources & Visual Masterclasses

**📖 Articles & Documentation**
- *AWS Security Best Practices:* Read the official documentation on IAM best practices.
- *The Cloud Resume Challenge (by Forrest Brazeal):* An incredible, industry-recognized project roadmap that takes you from beginner to highly employable by building a serverless resume.

**🔗 Interactive Practice**
- Explore the **AWS IAM Policy Simulator** to see how JSON policies actually evaluate permissions in real-time.

---

## Practice Quiz

1. Review the chapters and write a summary paragraph of the main objective for this part.
2. Outline how the topics in this part build upon the preceding section's concepts.
