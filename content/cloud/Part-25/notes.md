# Part 25 — Terraform Fundamentals

Terraform is the industry-standard tool for declarative infrastructure. We cover providers, resources, tracking system state in the state file, variables, outputs, and modularizing configurations.

---

## Chapter 6: Terraform Core Concepts (Providers, Resources, State)

### Learning Objectives
**Estimated time:** 20 minutes theory

**Learning objectives:**
- Define Infrastructure as Code (IaC) in the context of infrastructure provisioning.
- Explain the role of Providers and Resources in HashiCorp Configuration Language (HCL).
- Understand the critical function of the Terraform State file.

---

### Spark — A Question Before the Answer
If your company is launching a new application, you need 50 web servers, 3 load balancers, 2 databases, and a massive firewall ruleset. You could spend three days clicking through the AWS Console to build this. But what happens if you accidentally check the wrong box on firewall rule #47? What happens if you need to build the exact same environment in Europe next week? Why trust a human with a mouse when you can trust code?

### Why This Matters
In earlier modules, you learned Ansible, which is used to configure *software* inside an existing server (like installing Nginx). Terraform is used to provision the *hardware* itself (like telling AWS to create the server in the first place). Terraform is the undisputed king of cloud provisioning. If you know Terraform, you are employable at almost any modern tech company.

### Core Theory

**1. HashiCorp Configuration Language (HCL)**
Terraform uses its own declarative language called HCL. It looks similar to JSON but is designed to be highly readable by humans. You don't write "how" to build the infrastructure; you just declare "what" you want, and Terraform figures out the API calls to make it happen.

**2. The Provider**
Terraform itself doesn't know how to talk to AWS, Azure, or GCP. A **Provider** is a plugin that translates your HCL code into the specific API calls required by a cloud platform. You must declare a provider at the top of your code.
```hcl
provider "aws" {
  region = "us-east-1"
}
```

**3. The Resource Block**
This is the heart of Terraform. A `resource` block declares a specific piece of infrastructure you want to exist.
```hcl
resource "aws_instance" "my_web_server" {
  ami           = "ami-123456"
  instance_type = "t2.micro"
}
```
* `aws_instance`: The resource type (defined by the provider).
* `my_web_server`: The local name you use to reference it in your code.

**4. The State File (`terraform.tfstate`)**
This is the most critical concept in Terraform. How does Terraform know if it needs to create a server, or if the server already exists? It tracks reality using a State file (a massive JSON file). 
When you run Terraform, it compares your HCL code (Desired State) to the State file (Current Reality). If they match, it does nothing. If your code asks for 3 servers and the State file only shows 2, Terraform creates exactly 1 more.

### Theory Checkpoint
1. What is the difference between an Ansible module and a Terraform provider?
2. If you delete a resource block from your HCL code, what will Terraform do on its next run?

---

### Hands-On Lab
*Covered in Chapter 7.*

---

### Quiz
1. Why does Terraform need a State file to function?
2. True/False: You write Terraform code by specifying the exact order of API calls AWS should execute.

### Key Takeaways
- Terraform provisions infrastructure; Ansible configures the OS inside it.
- Providers act as translators between HCL and Cloud APIs.
- The State file is the source of truth that enables idempotency.

### Instructor Answer Key
1. Without the state file, Terraform wouldn't know what already exists. It would just blindly try to create brand new servers every single time you ran it, throwing errors when names collided.
2. False. Terraform is declarative. You write the final state, and Terraform calculates the required API calls and the order in which to execute them.

---

## Chapter 7: Hands-On: Writing Your First Terraform Configuration

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Write a basic `main.tf` file.
- Understand HCL syntax and formatting.

---

### Spark — A Question Before the Answer
Reading HCL is easy, but how strict is the syntax when you actually sit down to write it?

### Why This Matters
Muscle memory in HCL is essential. It is a highly structured language, and small syntax errors (like a missing curly brace) will stop your deployment dead in its tracks.

### Hands-On Lab
**Lab: The Local File Provisioner**
While Terraform is mostly used for the cloud, it has a `local` provider that can manage files on your own laptop. This is the safest way to learn Terraform without needing AWS credentials.
1. Create an empty directory: `mkdir tf-demo && cd tf-demo`
2. Create a file named `main.tf`: `nano main.tf`
3. Write the following HCL:
   ```hcl
   provider "local" {}

   resource "local_file" "my_greeting" {
     filename = "${path.module}/hello.txt"
     content  = "Hello, Terraform is awesome!"
   }
   ```
4. Save and exit. 
5. Run the formatter to automatically fix your indentation: `terraform fmt`
*(If you don't have Terraform installed, just analyze the code block above).*

### Quiz
1. (Self-reflection) In the `local_file` resource, what do `filename` and `content` represent? (Hint: They are arguments specific to the `local_file` resource type).

### Key Takeaways
- Every Terraform project starts with a `.tf` file (usually `main.tf`).
- `terraform fmt` is a built-in tool that beautifully formats your code to standard conventions.

### Instructor Answer Key
1. They are arguments. The `local_file` resource requires you to tell it where to save the file (`filename`) and what text to put inside it (`content`).

---

## Chapter 8: Understanding the Terraform State File

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Analyze the contents of the `terraform.tfstate` file.
- Identify the security risks of committing the state file to version control.

---

### Spark — A Question Before the Answer
If Terraform is so secure and robust, why is the `terraform.tfstate` file considered the most dangerous file in a DevOps repository? Why do security teams panic if they find it in GitHub?

### Why This Matters
The state file is the brain of Terraform, but it has a massive design flaw: it stores everything in plain text. Understanding how to handle the state file safely is the difference between a secure infrastructure and a catastrophic data breach.

### Core Theory

**1. The Anatomy of State**
When Terraform creates resources, it logs every single detail about that resource in the JSON state file. If you create an AWS server, the state file records the server's public IP, its internal ID, its MAC address, and exactly when it was created.

**2. The Danger: Plain Text Secrets**
If you use Terraform to create a database, you must supply a database password in your HCL code. Terraform will pass that password to AWS to create the database. **Terraform will then record that password in plain text inside the `terraform.tfstate` file.**
- If you commit `terraform.tfstate` to GitHub, anyone who can read your repository can read your database passwords.

**3. State File Management**
By default, Terraform creates the state file locally on your laptop. In a professional environment, this is unacceptable (what if your laptop breaks, or your coworker needs to run the code?).
- *The Solution:* **Remote State**. You configure Terraform to save the state file securely in an encrypted cloud bucket (like AWS S3) instead of on your laptop. (We will cover this deeply in Chapter 17).

### Theory Checkpoint
1. Why must you immediately add `terraform.tfstate` to your `.gitignore` file when starting a project?
2. How does the state file help Terraform run faster? (Hint: Think about large infrastructures).

---

### Hands-On Lab
*No lab required.*

---

### Quiz
1. True/False: Terraform automatically encrypts the state file locally to protect passwords.
2. If Developer A runs Terraform on their laptop, and Developer B runs the same code on their laptop without using Remote State, what will happen?

### Key Takeaways
- The state file is a massive JSON map of your infrastructure.
- It contains highly sensitive secrets in plain text.
- Never commit it to a git repository.

### Instructor Answer Key
1. False. It is stored in plain text JSON.
2. Developer B's Terraform will not know about the resources Developer A created, because Developer B has an empty local state file. Developer B's Terraform will try to create a duplicate infrastructure, causing massive errors.

---

## Chapter 9: Hands-On: Plan, Apply, Destroy — The Core Workflow

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Execute the three foundational Terraform commands.
- Interpret a Terraform execution plan.

---

### Spark — A Question Before the Answer
When you have 5,000 servers managed by Terraform, how do you verify that your tiny code tweak won't accidentally delete all 5,000 servers?

### Why This Matters
You never fly blind with Terraform. The workflow is designed to show you exactly what it intends to do *before* it actually touches your infrastructure. 

### Hands-On Lab
**Lab: The Core Commands**
Assuming you created the `main.tf` from Chapter 7:
1. **Initialize:** `terraform init`
   - This command reads your code, sees you want the "local" provider, and downloads the necessary plugins from HashiCorp. You must run this once per project.
2. **Plan (The Safety Net):** `terraform plan`
   - Terraform compares your code to reality. It prints a plan. 
   - `+` means "create", `-` means "destroy", `~` means "update in place". 
   - It will say: `Plan: 1 to add, 0 to change, 0 to destroy.`
3. **Apply:** `terraform apply`
   - It shows the plan again and asks `Do you want to perform these actions?`. Type `yes`. It creates the file.
4. **Verify:** Check your directory. You should see `hello.txt` and `terraform.tfstate`.
5. **Destroy:** `terraform destroy`
   - Terraform reads the state file, sees what it created, and deletes it. Type `yes`. `hello.txt` is now gone.

### Quiz
1. (Self-reflection) Look at the `terraform plan` output. What color and symbol does Terraform use to indicate a resource will be deleted? 

### Key Takeaways
- `init`: Downloads provider plugins.
- `plan`: Shows you what will happen (dry run).
- `apply`: Executes the plan.
- `destroy`: Tears down everything managed by the state file.

### Instructor Answer Key
1. Red text, with a `-` (minus) sign.

---

## Chapter 10: Variables & Outputs in Terraform

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Define Input Variables to make Terraform code reusable.
- Define Outputs to extract dynamic data from created infrastructure.

---

### Spark — A Question Before the Answer
You wrote an amazing `main.tf` file that builds a web server named "Prod-Web". Your boss says, "Great, now use that exact same code to build a server named 'Test-Web'." If you have to manually edit the `main.tf` file and change the name, your code isn't reusable. How do you make the code flexible?

### Why This Matters
Hardcoding values (like server names, instance sizes, or IP addresses) is an anti-pattern. You want one generic set of Terraform code that can be deployed to Development (small servers) and Production (massive servers) simply by passing in different variables.

### Core Theory

**1. Input Variables (`variables.tf`)**
You define variables to allow users to inject data into your code at runtime.
```hcl
variable "server_size" {
  description = "The size of the VM"
  type        = string
  default     = "t2.micro"
}
```
In your `main.tf`, you reference it like this: `instance_type = var.server_size`.

**2. Providing Variable Values**
You can pass variables when running the command:
`terraform apply -var="server_size=m5.large"`
Or, more commonly, you use a `terraform.tfvars` file, which is just a list of values:
```hcl
server_size = "m5.large"
```

**3. Outputs (`outputs.tf`)**
When Terraform creates a server, AWS assigns it a random Public IP address. How do you know what it is? You use an Output block to tell Terraform to print that specific piece of data to the terminal when it finishes.
```hcl
output "server_ip" {
  value = aws_instance.my_web_server.public_ip
}
```

### Theory Checkpoint
1. Why is it best practice to keep variables in `variables.tf` instead of inside `main.tf`?
2. What happens if you define a variable but don't provide a `default` value, and you don't use a `.tfvars` file?

---

### Hands-On Lab
*Covered in Chapter 11.*

---

### Quiz
1. Which of the following is used to *extract* information out of Terraform after it runs: a Variable or an Output?
2. If you want to deploy a "Dev" environment and a "Prod" environment using the exact same `main.tf` code, what files would you create to manage the different settings?

### Key Takeaways
- Variables (`var.NAME`) make code dynamic and reusable.
- Outputs print useful information (like generated IPs or passwords) to the console.
- `.tfvars` files are used to inject values into variables automatically.

### Instructor Answer Key
1. An Output.
2. You would create a `dev.tfvars` file (with small instance sizes) and a `prod.tfvars` file (with large instance sizes), and apply the same `main.tf` using different var files.

---

## Chapter 11: Hands-On: Parameterizing a Terraform Configuration

### Learning Objectives
**Estimated time:** 15 minutes lab

**Learning objectives:**
- Implement variables to dynamically alter resource creation.

---

### Spark — A Question Before the Answer
Can you modify your basic `main.tf` so that it doesn't hardcode the file content, but instead asks the user what to write?

### Why This Matters
This lab demonstrates how to break monolithic code into modular, flexible components.

### Hands-On Lab
**Lab: Dynamic Files**
1. In your `tf-demo` folder, create `variables.tf`:
   ```hcl
   variable "file_content" {
     type    = string
     default = "Hello from the default variable!"
   }
   ```
2. Update `main.tf`:
   ```hcl
   resource "local_file" "my_greeting" {
     filename = "${path.module}/hello.txt"
     content  = var.file_content
   }
   ```
3. Run `terraform plan`. You will see it plans to create a file with the default text.
4. Run `terraform apply -var="file_content=I am dynamically injected!" -auto-approve`.
5. Check `hello.txt`. It contains your custom text!

### Quiz
1. (Self-reflection) In step 4, we used the `-auto-approve` flag. What step of the core workflow did this skip? Why is this highly dangerous in production?

### Key Takeaways
- Use `var.variable_name` to reference variables inside resources.
- The command line `-var` flag overrides the default value.

### Instructor Answer Key
1. It skipped the manual confirmation prompt where you review the plan and type `yes`. In production, `-auto-approve` can instantly destroy your infrastructure without giving you a chance to catch a mistake in the plan. (It is usually only used in automated CI/CD pipelines).

---

## Chapter 12: Terraform Modules Explained

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Define a Terraform Module.
- Explain how modules enforce organizational standards and reduce code duplication.

---

### Spark — A Question Before the Answer
To build a secure web server in AWS, you have to write 200 lines of HCL to define the server, the hard drive, the security groups, the SSH keys, and the IAM roles. If your company has 50 developers building 50 different apps, do you want all 50 developers copying and pasting those 200 lines of complex code?

### Why This Matters
Copy-pasting infrastructure code leads to massive security vulnerabilities (Developer B forgets the security group rules). Modules allow the Senior Architect to write those 200 lines perfectly *once*, package it up, and let junior developers use it with just 5 lines of code.

### Core Theory

**1. What is a Module?**
A module is simply a folder containing Terraform files (`.tf`). In fact, the folder you have been working in (`tf-demo`) is technically a module (the "Root Module").

**2. Calling a Child Module**
You can call another module from within your code. Think of it like a function in programming.
```hcl
module "secure_web_server" {
  source      = "./modules/web-server"
  server_size = "t3.medium"
  environment = "Production"
}
```
When Terraform sees the `module` block, it goes into the `./modules/web-server` folder, runs all the 200 lines of complex code in there, and passes in your specific variables (`t3.medium`).

**3. The Terraform Registry**
You don't even have to write the modules yourself. HashiCorp hosts the Terraform Registry, an open-source library of thousands of pre-built modules for complex tasks (like building a full AWS VPC network). You just point your `source` to the registry URL, and Terraform downloads the module automatically.

### Theory Checkpoint
1. How does using a module enforce security standards across a large company?
2. What argument must be present in every `module` block to tell Terraform where to find the code?

---

### Hands-On Lab
*Covered in Chapter 13.*

---

### Quiz
1. True/False: A module can contain its own variables and outputs.
2. If you use a community module from the Terraform Registry, do you need to manually download the code files to your laptop?

### Key Takeaways
- Modules are folders of reusable Terraform code.
- They abstract complexity, allowing developers to provision secure infrastructure using just a few variables.
- The Terraform Registry is the open-source hub for community modules.

### Instructor Answer Key
1. True. Modules use variables to accept inputs from the Root module, and outputs to pass data back to the Root module.
2. No. When you run `terraform init`, Terraform automatically reaches out to the registry and downloads the module into a hidden `.terraform` folder for you.

---

## Chapter 13: Hands-On: Building Your First Reusable Module

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Structure a directory for module usage.
- Call a child module from the root configuration.

---

### Spark — A Question Before the Answer
Can you wrap your local file creation logic into a module, so you can stamp out 10 different files using 10 lines of code?

### Why This Matters
Building your own module solidifies your understanding of how variables act as the "input doors" to your reusable code block.

### Hands-On Lab
**Lab: The Local Module**
1. Inside your `tf-demo` folder, create a subfolder: `mkdir -p modules/file-maker`
2. Move your `main.tf` and `variables.tf` into `modules/file-maker/`.
   - Update `main.tf` in the module: change `filename = "${path.module}/hello.txt"` to `filename = "${path.root}/${var.file_name}.txt"`.
   - Update `variables.tf` in the module to add a new variable: `variable "file_name" { type = string }`.
3. Now, in your main `tf-demo` folder, create a brand new `main.tf`:
   ```hcl
   module "file_one" {
     source       = "./modules/file-maker"
     file_name    = "greetings"
     file_content = "Module power!"
   }
   
   module "file_two" {
     source       = "./modules/file-maker"
     file_name    = "farewell"
     file_content = "Goodbye!"
   }
   ```
4. Run `terraform init` (You must re-initialize because you added modules).
5. Run `terraform apply -auto-approve`.
6. You will see two new files created: `greetings.txt` and `farewell.txt`.

### Quiz
1. (Self-reflection) Why did we have to run `terraform init` again in step 4?

### Key Takeaways
- Creating a module is as simple as putting `.tf` files in a subfolder.
- The `source` path tells the root module where to look.
- You can call the same module multiple times with different names to stamp out identical, standardized infrastructure.

### Instructor Answer Key
1. Because `terraform init` is responsible for building the dependency tree. When you added new `module` blocks, Terraform had to scan the subfolders and "link" them into the internal `.terraform` directory before it could plan or apply.

---

## 📚 Learning Resources & Visual Masterclasses

**📖 Articles & Documentation**
- *Terraform Registry:* Browse registry.terraform.io. Search for "VPC" and look at the official AWS VPC module to see how complex infrastructure is abstracted.
- *HashiCorp Learn:* The official Terraform tutorials are exceptional. Work through the "Terraform Foundations" path.

---

## Practice Quiz

1. Review the chapters and write a summary paragraph of the main objective for this part.
2. Outline how the topics in this part build upon the preceding section's concepts.
