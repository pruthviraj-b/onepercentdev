# Part 26 — Managing Real Infrastructure

We use Terraform to provision production architecture. We build cloud compute services, VPC networks, subnets, and configure remote state backends with state locking.

---

## Chapter 14: Provisioning Compute Resources With Terraform

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Map GUI-based cloud concepts (Virtual Machines, SSH Keys, Security Groups) to HCL resources.
- Explain how Terraform infers creation order via dependency mapping.

---

### Spark — A Question Before the Answer
If a web server requires a specific Security Group (firewall) to exist before it can boot up, how do you ensure Terraform creates the firewall *first*, and the server *second*? Do you have to carefully order your code from top to bottom like a Bash script?

### Why This Matters
In the cloud, resources are deeply entangled. A server depends on a firewall, which depends on a network, which depends on a route table. If you had to manually figure out the dependency order, provisioning infrastructure would be a nightmare. Terraform's greatest feature is its mathematical ability to solve this puzzle for you automatically.

### Core Theory

**1. Declarative, Not Procedural**
In HCL, the order of the code does *not* matter. You can put the web server resource at the top of the file, and the firewall resource at the bottom. 

**2. Implicit Dependencies**
Terraform builds a "Directed Acyclic Graph" (DAG) in the background. It looks at how resources reference each other.
```hcl
resource "aws_security_group" "web_sg" {
  name = "web_firewall"
}

resource "aws_instance" "web" {
  ami             = "ami-12345"
  instance_type   = "t2.micro"
  security_groups = [aws_security_group.web_sg.name]
}
```
*How it works:* Because the `aws_instance` references `aws_security_group.web_sg.name`, Terraform mathematically proves that the firewall MUST be created first. It handles the order automatically.

**3. Explicit Dependencies (`depends_on`)**
Rarely, two resources might rely on each other without directly referencing variables (e.g., an application won't start until a specific S3 bucket exists, but the server code doesn't explicitly link to the bucket code). You can force Terraform to wait using the `depends_on` meta-argument.

### Theory Checkpoint
1. If Resource A is listed below Resource B in the `main.tf` file, does Terraform create Resource A last?
2. What is an Implicit Dependency in Terraform?

---

### Hands-On Lab
*No lab required. (Compute provisioning requires cloud credentials).*

---

### Quiz
1. Why does Terraform build a Directed Acyclic Graph (DAG) before applying changes?
2. If two virtual machines are defined in Terraform, and neither references the other, how does Terraform deploy them?

### Key Takeaways
- HCL is not read top-to-bottom for execution.
- Terraform automatically calculates the correct creation order by mapping implicit dependencies between resources.
- `depends_on` is used as a last resort for explicit ordering.

### Instructor Answer Key
1. To map out the dependencies between all resources so it knows exactly what order to create, update, or destroy them in.
2. In parallel. If there is no dependency between them, Terraform optimizes for speed by creating them simultaneously.

---

## Chapter 15: Provisioning Networking (VPCs, Subnets) With Terraform

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Identify the foundational network resources required to host a server in the cloud (VPC, Subnet, Internet Gateway).
- Explain why network infrastructure code changes infrequently compared to application code.

---

### Spark — A Question Before the Answer
A junior developer writes code to spin up an EC2 instance. They hit `apply`. The server boots up successfully. However, they can't access it via SSH, and the website won't load. The server is completely isolated in the dark. What massive invisible layer did they forget to build?

### Why This Matters
Compute resources (servers) are useless without a network. The network layer (VPC) is the bedrock of your cloud. In production, a mistake in your network Terraform code doesn't just take down one server—it isolates the entire company from the internet.

### Core Theory

**The Network Hierarchy**
To make a server accessible to the internet, Terraform must create several entangled resources:
1. **The VPC (Virtual Private Cloud):** The overarching logical network boundary. It defines the massive block of IP addresses you own.
2. **The Subnets:** Smaller slices of the VPC. 
   - *Public Subnets* have a path to the internet.
   - *Private Subnets* do not. (Databases go here).
3. **The Internet Gateway (IGW):** The actual "door" that attaches your VPC to the public internet.
4. **The Route Table:** The map that tells traffic in your Public Subnet how to find the Internet Gateway.

**The Foundational Split**
Because network infrastructure is so critical and rarely changes (you don't build a new VPC every week), Senior Architects usually split network Terraform code into a completely separate repository from the application (server) Terraform code. The network is deployed once; the application is deployed daily.

### Theory Checkpoint
1. Why do we put databases in Private Subnets?
2. What resource acts as the "door" connecting a VPC to the outside world?

---

### Hands-On Lab
*Covered in Chapter 16.*

---

### Quiz
1. If your Terraform code creates a VPC and a Subnet, but forgets the Route Table, what will happen to a web server placed in that subnet?
2. Why is it a best practice to keep VPC Terraform code in a separate folder/state file from application Terraform code?

### Key Takeaways
- A server is just a box; the VPC is the roads connecting the box to the world.
- You must chain together VPCs, Subnets, IGWs, and Route Tables for internet access.
- Network infrastructure is the foundation and should be managed carefully.

### Instructor Answer Key
1. The server will deploy successfully, but it will have absolutely no way to communicate with the internet (or be reached from the internet) because traffic won't know how to route out of the subnet.
2. Blast radius reduction. If an application developer makes a mistake in their `main.tf` and accidentally types `terraform destroy`, you want them to only destroy their web server, not the entire company's underlying network. Separating the state files prevents catastrophic accidents.

---

## Chapter 16: Hands-On: Building a Full VPC With Terraform

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Analyze the HCL structure required to build a foundational cloud network.

---

### Spark — A Question Before the Answer
Writing raw network code from scratch is tedious. How do professionals build a 50-resource VPC in 10 lines of code?

### Why This Matters
You will rarely build a VPC using raw `aws_vpc` and `aws_subnet` resources in production. You will use the Terraform Registry Modules. This lab demonstrates the immense power of abstraction.

### Hands-On Lab
**Lab: Mental Sandbox - The VPC Module**
Instead of writing 15 different resources, modern engineers use the official AWS VPC module.
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
}
```
**Analysis:**
1. This single block of code tells Terraform to go to the Registry (`terraform-aws-modules`).
2. It generates a massively complex, Highly Available network.
3. It spans two Availability Zones (`us-east-1a` and `1b`).
4. It creates private subnets for databases and public subnets for web servers.
5. It automatically builds the Internet Gateways, Route Tables, and NAT Gateways.

### Quiz
1. (Self-reflection) In the code above, if you wanted to expand this network to survive a fire in two separate datacenters, how many strings would you need to add to the `azs` list?

### Key Takeaways
- The Terraform Registry contains official, battle-tested modules for complex tasks like VPCs.
- Modules abstract away dozens of interconnected resources into a few simple variables.

### Instructor Answer Key
1. Just add a third AZ string (e.g., `"us-east-1c"`) to the `azs` list, and add one more IP range to the public and private subnet lists. The module handles all the complex routing logic automatically.

---

## Chapter 17: Remote State & Team Collaboration

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Define Remote State and its role in team collaboration.
- Explain the concept of State Locking and how it prevents data corruption.

---

### Spark — A Question Before the Answer
Developer A and Developer B are both working on the same Terraform project. Developer A runs `terraform apply` to add a new server. Five seconds later, Developer B runs `terraform apply` to add a database. If the state file is stored locally on their laptops, what happens? Total infrastructure corruption. How do teams of 100 engineers use Terraform at the same time?

### Why This Matters
Local state (storing `terraform.tfstate` on your hard drive) is only for solo learners. The moment you join a company, you will use Remote State. Understanding how Remote State protects the state file from race conditions is a frequent interview question.

### Core Theory

**1. Remote State Backends**
Instead of saving the state locally, you configure Terraform to save the state in the cloud (usually an AWS S3 Bucket, Azure Blob Storage, or Terraform Cloud).
- **Security:** The bucket can be heavily encrypted and access-restricted (solving the "plain text secrets" problem from Chapter 8).
- **Collaboration:** When Developer A runs `terraform plan`, Terraform downloads the latest state from the S3 bucket, ensuring they have the most accurate, up-to-date picture of the infrastructure.

**2. The Race Condition Problem**
Even with the state in a central S3 bucket, what if Developer A and Developer B hit `terraform apply` at the exact same millisecond? Both of their laptops would try to write to the S3 bucket simultaneously, corrupting the JSON file forever.

**3. State Locking**
To solve this, Remote State requires a "Locking" mechanism (in AWS, this is typically an Amazon DynamoDB table).
- Developer A hits `apply`. Terraform instantly writes a "Lock" to DynamoDB.
- Developer B hits `apply` one second later. Terraform checks DynamoDB, sees the Lock, and instantly rejects Developer B's command with an error: `Error acquiring the state lock`.
- Once Developer A's run finishes, Terraform releases the lock, allowing Developer B to proceed safely.

### Theory Checkpoint
1. What two cloud services are required to build a standard AWS Remote State backend?
2. How does a Remote State backend improve security regarding sensitive passwords?

---

### Hands-On Lab
*Covered in Chapter 18.*

---

### Quiz
1. If your CI/CD pipeline crashes abruptly in the middle of a `terraform apply` and fails to release the DynamoDB lock, what happens to your team?
2. True/False: If you use Remote State, you no longer need to run `terraform init`.

### Key Takeaways
- Remote State centralizes the `terraform.tfstate` file in the cloud.
- S3 (Storage) holds the file; DynamoDB (Database) holds the Lock.
- State Locking prevents corruption when multiple users run Terraform simultaneously.

### Instructor Answer Key
1. The entire team is locked out of making infrastructure changes. An administrator will have to manually go into DynamoDB and delete the stale lock (a process called "Force Unlocking") before anyone can run Terraform again.
2. False. You absolutely must run `terraform init` to initialize the connection to the Remote Backend and download the state.

---

## Chapter 18: Hands-On: Setting Up Remote State With Locking

### Learning Objectives
**Estimated time:** 15 minutes lab

**Learning objectives:**
- Identify the HCL configuration required to activate an S3/DynamoDB remote backend.

---

### Spark — A Question Before the Answer
How do you actually tell Terraform to stop saving the state file on your laptop and start saving it in AWS?

### Why This Matters
You configure the backend in the `terraform` block. This block is usually the very first thing written in a new production repository.

### Hands-On Lab
**Lab: Mental Sandbox - The Backend Block**
To configure an AWS backend, you add this block to your code (usually in a file named `backend.tf` or at the top of `main.tf`):

```hcl
terraform {
  backend "s3" {
    bucket         = "my-company-terraform-states"
    key            = "prod/vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```
**Analysis:**
- `bucket`: The S3 bucket where the file lives. (You must create this bucket manually *before* running Terraform!).
- `key`: The "folder path" inside the bucket. This is brilliant because it allows you to store the state for the Network (`prod/vpc/`) in the same bucket as the state for the App (`prod/app/`), keeping them safely separated.
- `dynamodb_table`: The database table used for locking.
- `encrypt`: Ensures AWS encrypts the state file at rest, protecting those plaintext passwords.

### Quiz
1. (Self-reflection) In the "Chicken and Egg" scenario of Terraform, why must you create the S3 Bucket and DynamoDB table *manually* (or in a separate "bootstrap" project) before you can write the `backend` block?

### Key Takeaways
- The `backend` configuration is placed inside the `terraform {}` block.
- The `key` defines the exact filename and path in the storage bucket, allowing multiple projects to share one bucket safely.

### Instructor Answer Key
1. Because Terraform needs the bucket to exist in order to store its state file. If you wrote Terraform code to create the bucket, where would it store the state file indicating that it created the bucket? You cannot store the state of the bucket *inside* the bucket you are trying to create. The backend infrastructure must be bootstrapped first.

---

## 📚 Learning Resources & Visual Masterclasses

**📖 Articles & Documentation**
- *Terraform State Documentation:* Read the official HashiCorp docs on "State Locking" and "Remote State".
- *Terraform Up & Running (by Yevgeniy Brikman):* The definitive book on Terraform. Chapter 3 ("How to Manage Terraform State") is a masterclass in these concepts.

---

## Practice Quiz

1. Review the chapters and write a summary paragraph of the main objective for this part.
2. Outline how the topics in this part build upon the preceding section's concepts.
