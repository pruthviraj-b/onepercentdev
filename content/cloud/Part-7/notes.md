# Part 7 — Project Strategy

Technical skills alone don't get you hired. The interview moment that separates candidates isn't the algorithm question — it's when the interviewer asks "walk me through a project you built" and the candidate either lights up with a real story about solving a real problem, or stumbles through a description of a tutorial they followed. This part is about the difference between those two candidates. We cover portfolio strategy, project selection, scoping like a professional, and writing proposals that demonstrate you think like an engineer, not a student.

---

## Chapter 1: Why Portfolio Projects Matter More Than Certificates

### Learning Objectives

**Estimated time:** 20 minutes theory + 15 minutes lab = 35 minutes  
**Prerequisites:** Module 6, Part E — Production-Grade DevOps (Chapter 25: Capstone)

**Learning objectives:**
- By the end of this chapter, you will be able to explain why portfolio projects provide stronger hiring signals than certifications alone
- By the end of this chapter, you will be able to identify what hiring managers actually look for in a portfolio project
- By the end of this chapter, you will be able to distinguish between tutorial projects (low signal) and original projects (high signal)

**Chapter bridge:** This chapter establishes the philosophy behind Module 7's project track. Chapters 2 and 3 build on it with project selection and scoping frameworks. By Chapter 5, you'll be building your first project with deliberate signal-to-noise optimization.

---

### Spark — A Question Before the Answer

Two candidates apply for the same junior cloud engineer role. Candidate A has three cloud certifications (AWS Solutions Architect, Terraform Associate, CKA), zero public projects, and a GitHub profile showing forked repositories and tutorial code. Candidate B has one certification (AWS CCP), and three GitHub repositories: a deployed web app with a CI/CD pipeline and documented architecture, an automated data pipeline with Terraform-provisioned infrastructure, and a write-up of a chaos engineering experiment they ran on a personal server.

Which candidate gets the interview callback? And if your answer is Candidate B — why do most people spend the majority of their learning time on certifications, not projects?

---

### Why This Matters

In a market where cloud certifications have become commoditized (millions of people hold AWS certifications), the portfolio is the differentiator. Certifications prove you can pass a multiple-choice exam about a topic. Projects prove you can use the topic to build something that works. Hiring managers — especially at engineering-focused companies — have developed clear mental models for filtering candidates based on projects. Understanding their mental model is what lets you build projects that pass the filter, not just projects that look impressive to yourself.

---

### Core Theory

**1. What Certifications Prove vs. What Projects Prove**

Certifications prove: you understand the vocabulary, you can identify the right service for a described scenario, you can recall limits and best practices. These are genuinely valuable signals — they prove minimum viable understanding.

Projects prove: you can go from a problem statement to a working system, you handle the gaps between documentation and reality, you make architectural decisions and live with the consequences, you debug something that's only broken in production at 2am. These are senior signals — they prove operational judgment.

The honest assessment: in 2024, a certification takes weeks of study. Tens of thousands of people get certified every month. Supply has outpaced demand for "certified cloud professional" as a hiring signal. Projects, by contrast, are still rare enough to differentiate. Building three solid projects takes longer than getting certified — which is exactly why the signal remains strong.

> **Real example:** Cloudflare's hiring process (documented in engineering blog posts). Cloudflare explicitly weights demonstrated projects over certifications in engineering hires. Their engineering blog features candidates who joined after building open-source tools that Cloudflare engineers noticed. This is hiring signal arbitrage: the candidate built something real, which attracted attention, which created an inbound opportunity. Certifications, by contrast, require the candidate to push into a competitive funnel.

**2. What Hiring Managers Actually See in a Portfolio**

When an engineering hiring manager opens your GitHub profile, they're running a quick mental checklist:

**Does it build?** If I clone this and follow the README, will it work? (Many tutorial projects fail this test — they have hard-coded credentials, missing environment variables, or broken dependencies.)

**Does it do something real?** Is this a solution to an actual problem, or is it a tutorial with your name on it? A "Deploy a web app to AWS" tutorial repo tells them nothing. A "Load balancer stress tester that generates reports comparing ALB vs. NLB latency at 10K concurrent connections" tells them you understand the domain.

**Is there evidence of decision-making?** An architecture decision record (ADR), a ARCHITECTURE.md, or a documented tradeoff discussion in the README shows you don't just build things — you think about why you built them a certain way.

**Is the infrastructure code present?** For a cloud engineering role, if the app is deployed but there's no Terraform or CloudFormation, the hiring manager assumes you clicked through the console. Code the infrastructure.

**3. The Tutorial Project Problem — Why Following Guides Doesn't Signal Well**

Tutorial projects are recognizable to experienced engineers because they make the same architectural choices, use the same naming conventions, hit the same common paths, and stop at the same point (getting the app to "hello world"). They don't show judgment — they show instruction-following, which is table stakes, not a differentiator.

What makes a project original:
- It solves a problem you actually had
- The architecture reflects a decision you made (not the tutorial's author)
- It hit a real error and you have documented how you debugged it
- It connects two things tutorials don't typically connect (e.g., Terraform provisioning + Ansible configuration + GitHub Actions CI/CD, end to end)

Ask yourself: "If I removed my name from this GitHub repo and it appeared on the internet, would it look like 1,000 other repos I could find with a search, or would it be distinctive?"

> **Real example:** Kelsey Hightower (formerly of Google) famously teaches cloud and DevOps concepts through open-source projects that are themselves instructional tools — kubernetes-the-hard-way being the most famous. This project (installing Kubernetes manually, without automation) exists as a learning tool but also demonstrates deep systems understanding. It's been starred 35,000+ times on GitHub and is referenced in conference talks. This is the opposite of a tutorial clone — it's an original project that teaches while demonstrating mastery.

---

### Theory Checkpoint

1. What are the two specific things that portfolio projects prove that certifications cannot?
2. What is the first thing a hiring manager checks when evaluating a project repository?
3. What makes a project "recognizable as a tutorial project" to experienced engineers?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Audit Your Current Portfolio**  
**Platform:** Browser  
**Tools needed:** Web browser, GitHub account  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** An honest assessment of your current portfolio's signal strength.

**Step 1:** Open your GitHub profile (or create one if you don't have one at github.com).

**Step 2:** For each repository, answer the hiring manager's checklist:
```
Repository: [name]
1. Does it build from the README? Yes / No / Unknown
2. Does it solve a real problem or follow a tutorial? Original / Tutorial / Mixed
3. Is there architecture documentation? Yes / No
4. Is infrastructure code present? Yes / No / Not applicable
5. Is there evidence of a real debugging session (commit history, issue trackers)? Yes / No
Signal strength: Strong / Moderate / Weak
```

**Step 3:** Identify the ONE repository that scores highest on signal strength. If none score well — that's valuable information.

**Step 4:** Identify what ONE change to your strongest repository would increase its signal most.

**Lab reflection:** If a hiring manager at your dream company spent 5 minutes on your GitHub profile right now — what would they conclude? Write one sentence describing their conclusion. Is that the conclusion you want them to reach?

---

### Quiz

**Quiz — Chapter 1**

1. What specific evidence in a portfolio repository tells a hiring manager that you understand cloud infrastructure, vs. the evidence that tells them you only followed a tutorial?

2. In the Cloudflare example, what is "hiring signal arbitrage" and how does building distinctive projects create inbound opportunity vs. competing in outbound application funnels?

3. Explain why tutorial projects are "recognizable" to experienced engineers — what specific patterns give them away?

4. You have 100 hours to spend on career development. Using the framework from this chapter, how would you allocate those hours between certifications and project work for a junior cloud engineer role, and why?

5. True/False: A detailed, well-structured README with an architecture diagram adds no technical signal — it only helps non-technical recruiters. Explain your answer.

---

### Key Takeaways

- **Certifications prove vocabulary and scenario recognition.** Projects prove operational judgment, architectural decision-making, and ability to build through gaps in documentation.
- **The hiring manager's checklist:** Does it build? Does it solve a real problem? Is there evidence of decision-making? Is infrastructure code present? Every project should pass all four.
- **Tutorial projects signal instruction-following, not engineering.** Original projects — solving a problem you had, with documented architectural decisions — signal the judgment that differentiates candidates.
- **Every portfolio decision is a tradeoff (certification breadth vs. project depth)** — but in 2024's market, the supply of certified engineers has outpaced demand; project depth creates durable signal.
- Real hiring patterns (Cloudflare, engineering-focused companies) trace their best hires to demonstrated project work, not certification counts — not mysterious luck, just signal arbitrage.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Evidence of infrastructure code: If the app is deployed on AWS but there's no Terraform, CloudFormation, or CDK, the manager assumes console clicks (not code). Evidence of original problem-solving: custom architecture, documented tradeoffs, evidence of debugging (commit messages, issues closed). Tutorial evidence: generic naming (my-react-app, aws-tutorial), identical structure to known tutorials, stopping at hello-world, no IaC, no CI/CD.

**Q2:** Signal arbitrage: certifications require the candidate to compete in a buyer's market (thousands of certified candidates). Distinctive projects create inbound attention — the project gets discovered, starred, referenced, which brings the employer to the candidate. This inverts the power dynamic. Cloudflare engineers noticed open-source tools; developers didn't need to apply through standard channels.

**Q3:** Tutorial projects are recognizable because: identical architecture (same naming, same stack choices, same progression), stopping at the tutorial's endpoint (no extensions, no real deployment), common paths only (no evidence of hitting edge cases or errors), no infrastructure code (tutorials often skip IaC), no commit history showing iteration (often one large commit of finished tutorial code).

**Q4:** Suggested allocation for a junior cloud engineer with 100 hours: 20 hours on one certification (minimum credentialing signal, shows commitment), 80 hours on 2–3 projects (primary differentiator). Rationale: one certification proves baseline knowledge to pass ATS screening; 2–3 projects demonstrate operational judgment and fill the interviews with real stories. Without certifications, ATS filtering can remove candidates. Without projects, interviews stall at "tell me about a time you..." with no concrete stories.

**Q5:** False — a detailed README with architecture diagram adds significant technical signal. Engineers evaluate whether the architecture diagram is correct and well-reasoned (demonstrates understanding). A written explanation of why you chose service A over service B shows decision-making ability. A "Known Limitations" section shows intellectual honesty and operational awareness. Technical recruiters look for README quality as a proxy for documentation skills — critical in professional engineering environments.

---

### Learning Resources

**📹 Video Resources**
- *How to Make Your GitHub Portfolio Stand Out* — multiple career-focused engineering channels
- *Kelsey Hightower: kubernetes-the-hard-way walkthrough* — watch how a world-class engineer teaches through building
- *What Engineering Hiring Managers Actually Look For* — conference talks from engineering hiring panels

**📖 Articles & Documentation**
- **Kelsey Hightower: kubernetes-the-hard-way** — https://github.com/kelseyhightower/kubernetes-the-hard-way — study the README and project structure as an example of instructional project design
- **GitHub: Creating a Profile README** — https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile
- **Write the Docs: Documentation Best Practices** — useful for project READMEs

**🔗 Interactive Practice**
- **GitHub Profile README Generator:** https://rahuldkjain.github.io/gh-profile-readme-generator — quick way to create a professional profile README as a starting point

---

## Chapter 2: Choosing Projects That Signal Real Skill — Not Tutorial Clones

### Learning Objectives

**Estimated time:** 20 minutes theory + 15 minutes lab = 35 minutes  
**Prerequisites:** Chapter 1 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to apply a project selection framework to evaluate project ideas
- By the end of this chapter, you will be able to identify the three project archetypes that best signal cloud/DevOps skill
- By the end of this chapter, you will be able to generate original project ideas from your own problems and interests

---

### Spark — A Question Before the Answer

When you finish this module, you'll have built three projects. Those three projects will be on your resume, in your GitHub, and the subject of half your interview conversations. Which three projects they are — and why you built them — will define how technical interviewers perceive you. A wrong choice (a tutorial clone, an oversimplified app, a project unrelated to cloud/DevOps) wastes months of work. A right choice (a genuinely original project that exercises the exact skills the role requires) can convert an interview into an offer.

So: how do you choose?

---

### Why This Matters

Project selection is a strategic decision, not just an engineering one. The best projects are not the most technically impressive in isolation — they're the ones that demonstrate the specific skills your target employer values, are original enough to be memorable, and have enough complexity to generate real interview stories (debugging sessions, architectural decisions, operational tradeoffs).

---

### Core Theory

**1. The Three Project Archetypes for Cloud/DevOps Roles**

Three project types consistently signal cloud/DevOps skill in hiring conversations:

**Archetype 1 — The Deployed, Production-Like Application**
A web application or API that is publicly accessible, backed by IaC-provisioned infrastructure, with a working CI/CD pipeline. This proves you can take an app from code to production using professional tools. Key requirement: it must be live (or provably deployable from your IaC). A deployed app at a real URL is more credible than a repo alone.

**Archetype 2 — The Automated Data or Operations Pipeline**
A system that takes data from one place, processes it, and stores or presents it somewhere else — fully automated. Examples: a system that pulls data from a public API (weather, stock prices, GitHub events), processes it with a Lambda function or Python script, and stores results in S3 or a database. Shows scheduling, automation, and cloud service integration.

**Archetype 3 — The Resilient, Multi-Tier Infrastructure**
An infrastructure design project: build a multi-AZ deployment with load balancing and auto-scaling, deliberately stress-test it, document what failed and how it recovered. Shows systems thinking and operational maturity — the skills that separate junior from senior cloud engineers.

**2. The Problem-First Selection Method**

The best project ideas come from problems you've actually experienced:
- A task you do manually that you wish was automated
- A question you've had that existing tools don't easily answer
- A system you use daily whose internals you don't understand
- A real-world incident you read about that you want to simulate and solve

This matters because: when you talk about a problem-first project in an interview, you have a story. "I was frustrated that I couldn't get weather-based alerts for my outdoor activities, so I built a serverless system that pulls weather API data hourly, runs my filtering logic in Lambda, and sends me a text via SNS." That's memorable. "I followed a tutorial to deploy a Flask app on AWS" is not.

> **Real example:** Julia Evans (jvns.ca) has built her engineering reputation largely through projects that start with "I was confused about X" — zines, small tools, and blog posts that explain things she wanted to understand. Her project on "How DNS works" (an interactive website) came from being genuinely confused about DNS. The authenticity of starting from a real problem produced work that resonated with thousands of engineers who had the same confusion.

**3. The Interview Fitness Test**

Before committing to a project, run it through the Interview Fitness Test:

1. **Can I explain why I built it in one sentence?** (The "real problem" test)
2. **Can I describe 3 architectural decisions I made and why?** (The "judgment" test)
3. **Can I describe one thing that didn't work and how I fixed it?** (The "debugging" test)
4. **Can I quantify something about it?** (Latency, throughput, cost savings, uptime — numbers add credibility)
5. **Does it use skills relevant to the role I'm targeting?** (Alignment test)

If you can answer all five before building, the project will produce usable interview material.

---

### Theory Checkpoint

1. What are the three project archetypes for cloud/DevOps roles?
2. Why do problem-first projects produce better interview stories than tutorial-first projects?
3. What are the five questions in the Interview Fitness Test?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Generate and Evaluate 3 Project Ideas**  
**Platform:** All platforms  
**Tools needed:** Text editor  
**Estimated time:** 15 minutes  
**What you'll demonstrate:** Three original project ideas evaluated against the Interview Fitness Test.

**Step 1:** Brainstorm 3 project ideas using the Problem-First method. Start from one of these prompts:
- "I wish there was a tool that..."
- "I manually do [X] every week and it's annoying"
- "I read about [cloud incident] and want to simulate/understand how it happened"
- "I use [service/tool] daily but don't understand how it works internally"

Write 3 ideas (1 sentence each).

**Step 2:** For each idea, run the Interview Fitness Test:
```
Project Idea: [description]
1. Why I'd build it: [1 sentence]
2. 3 architectural decisions: [list]
3. Something that might not work: [hypothesis]
4. Quantifiable outcome: [e.g., "reduce X from Y to Z"]
5. Relevant to [target role]: Yes / No / Partially
Score: [1-5 out of 5 answers]
```

**Step 3:** Select the idea that scores highest and has the strongest "why I'd build it" story.

**Lab reflection:** The idea you selected — what would you need to learn to build it that you don't already know? Is the learning required appropriate for a junior engineer, or would it require senior-level expertise you'd be faking? Finding that line is part of scoping, which we cover in Chapter 3.

---

### Quiz

**Quiz — Chapter 2**

1. Describe Archetype 2 (the automated data or operations pipeline) in your own words and give one original example project idea that fits this archetype.

2. In Julia Evans's example, what makes her projects succeed as public-facing technical work despite not being large, complex applications?

3. A candidate's strongest project is: "I deployed the official React tutorial app to an S3 bucket and set up CloudFront." Run this through the Interview Fitness Test. How many tests does it pass?

4. You want to target a DevOps engineer role at a company that uses Kubernetes heavily. Which project archetype would provide the most relevant signal, and what specific Kubernetes components would you incorporate?

5. True/False: A project doesn't need to be original if it's complex and technically impressive. Explain your answer.

---

### Key Takeaways

- **Three archetypes:** Deployed production-like app (Archetype 1), automated data/ops pipeline (Archetype 2), resilient multi-tier infrastructure (Archetype 3). Each signals a different cluster of cloud/DevOps skills.
- **Problem-first projects** produce interview stories; tutorial-first projects produce descriptions. The "real problem" is what makes a project memorable and defensible in an interview.
- **The Interview Fitness Test (5 questions)** evaluates project interview usability before you build it — saving months of work on low-signal projects.
- **Project selection is a strategic tradeoff (broad skill demonstration vs. depth in specific areas)** — three projects covering different archetypes provides the best overall portfolio signal.
- Engineers who build problem-first projects (Julia Evans, Kelsey Hightower) create lasting impact and career opportunities through the authenticity and distinctiveness of their work.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Archetype 2 description: an automated system that ingests data from a source, processes it, and outputs it to a destination — fully automated on a schedule or trigger, with no manual steps. Original example: a GitHub Actions workflow monitor that fetches daily run data from the GitHub API via Lambda, calculates success rates and average duration per workflow, stores results in DynamoDB, and serves a dashboard via CloudFront+S3. Demonstrates: Lambda, DynamoDB, S3/CloudFront, event-driven scheduling, API integration — all relevant cloud/DevOps skills.

**Q2:** Julia Evans's projects succeed because: (a) they start from genuine confusion — readers recognize the same confusion in themselves, creating immediate engagement; (b) they're complete (explain something fully, not partially); (c) they demonstrate deep understanding despite simple presentation; (d) they produce lasting reference value — people bookmark and share them. Complexity is not the signal; depth of understanding communicated clearly is the signal.

**Q3:** Interview Fitness Test for the React/S3/CloudFront project:
1. "Why I built it" — weak/none: it's a tutorial app on a tutorial deployment path. Score: FAIL
2. "3 architectural decisions" — almost none: S3+CloudFront is the default tutorial stack; no real decisions made. Score: FAIL
3. "Something that didn't work" — probably nothing memorable; tutorial path is well-worn. Score: FAIL
4. "Quantifiable outcome" — none beyond "it loads in X ms". Score: FAIL
5. "Relevant to target role" — marginally (S3, CloudFront are real services). Score: PARTIAL
Total: 0–1 out of 5. Low signal.

**Q4:** Archetype 3 (resilient multi-tier infrastructure) — specifically: provision a multi-node Kubernetes cluster (using EKS or kind locally), deploy a multi-service application, implement Kubernetes-native load balancing (Service + Ingress), configure HPA (horizontal pod autoscaling), test failure scenarios (kill a node, observe pod rescheduling), document what Kubernetes's control plane does in each failure scenario. This directly demonstrates the operational Kubernetes knowledge that differentiates DevOps candidates for Kubernetes-heavy roles.

**Q5:** False. Complexity and technical impressiveness can create tutorial-detection issues even for non-tutorials. More importantly: if the project doesn't answer "why did you build this?", it fails the first Interview Fitness Test, making it hard to present in interviews regardless of technical impressiveness. "I implemented a distributed consensus algorithm from scratch" is impressive, but if you can't connect it to a real problem or role-relevant skill, it reads as academic exercise, not operational judgment. Originality (addressing a real problem with a clear "why") plus appropriate complexity is the target combination.

---

### Learning Resources

**📹 Video Resources**
- *Cloud Projects to Add to Your Resume* — A Cloud Guru, TechWorld with Nana, and CloudWithRaj have current recommendations
- *How I Got My First DevOps Job* — multiple career stories on YouTube; look for the common thread of project-driven hiring
- *Julia Evans: How to Learn Hard Things* — talks on learning and teaching through building

**📖 Articles & Documentation**
- **CloudResumeChallenge.dev** — https://cloudresumechallenge.dev — the canonical "first cloud project" framework, but use it as a starting point, not an endpoint
- **jvns.ca** — Julia Evans's blog — study project selection and presentation strategy
- **The Pragmatic Programmer (Thomas & Hunt)** — especially the "build your knowledge portfolio" chapter

**🔗 Interactive Practice**
- **GitHub Explore:** https://github.com/explore — browse trending repos in your domain; identify what makes them popular; use these as project inspiration, not templates

---

## Chapter 3: Scoping a Project Like a Professional

### Learning Objectives

**Estimated time:** 20 minutes theory + 20 minutes lab = 40 minutes  
**Prerequisites:** Chapters 1–2 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to apply professional scoping techniques to define project boundaries before building
- By the end of this chapter, you will be able to distinguish a Minimum Viable Project (MVP) from a complete feature set
- By the end of this chapter, you will be able to write a project scope document that guides building and prevents scope creep

---

### Spark — A Question Before the Answer

Every abandoned side project in history started with a developer who underestimated scope. Week 1: excitement, fast progress. Week 3: the "simple" thing has 15 more moving parts than expected. Week 6: the project is 40% done and momentum has collapsed. The project joins the graveyard of `~/projects/unfinished/`.

The difference between projects that get finished and projects that get abandoned is rarely skill level or motivation — it's usually scope management. Professional engineers don't build until they understand exactly what they're building. What is in scope, what is explicitly out of scope, and what is the smallest version that still proves the concept?

---

### Why This Matters

Scoping is one of the most undervalued engineering skills. Junior engineers scope too broadly (want to build everything) or too narrowly (build something so minimal it doesn't demonstrate real capability). Professional scoping finds the minimum viable project that provides maximum portfolio signal. This is what lets you finish projects and move on, building three solid portfolio pieces instead of one ambitious, unfinished one.

---

### Core Theory

**1. The MVP Mindset — What's the Minimum That Proves the Concept?**

Minimum Viable Project (MVP) for portfolio purposes: the smallest version of the project that still passes the Interview Fitness Test (Chapter 2). Not the smallest version that could theoretically exist — the smallest version that demonstrates the skills you're targeting.

Example: You want to build an "automated infrastructure monitoring dashboard."

- **Too broad:** Full observability platform with distributed tracing, log aggregation, cost analysis, and auto-remediation. (Years of work)
- **Too narrow:** A cron job that pings a server and emails you if it's down. (No cloud architecture, no IaC, no CI/CD — minimal signal)
- **Right scope:** CloudWatch metrics collected from a deployed application, displayed in a Grafana dashboard, provisioned with Terraform, deployed via GitHub Actions CI. (Demonstrates: IaC, CI/CD, monitoring, cloud services — all relevant. Buildable in 2–3 weeks.)

**2. The Scope Document — What's In, What's Out, What's Later**

Before writing a line of code, write a scope document with three sections:

**In Scope (MVP):** Features/components that must exist for the project to pass the Interview Fitness Test. These are non-negotiable. Start with these.

**Out of Scope (V2):** Features you want but that aren't needed for the MVP. Write these down explicitly — this is what prevents scope creep. When the temptation to add "just one more feature" strikes, you read this section and move the idea to V2.

**Known Risks:** Technical unknowns that could block the project. "I've never used the X API" is a known risk — spike it in day 1. Unknown risks (things you don't know you don't know) are why MVP scope should be conservative.

> **Real example:** AWS Lambda was originally scoped to be a "simple event-triggered function execution service" — no persistent storage, no long-running processes, short timeout limits. These constraints were explicit out-of-scope decisions, not limitations. The scoping created the Lambda model: stateless, short-lived, event-driven. Every constraint was a deliberate scope choice that shaped the product's architecture. This is professional scoping applied to a product at Amazon scale.

**3. Time-Boxing — The Forcing Function**

Professional projects have deadlines. Portfolio projects should too — not because someone is waiting, but because open-ended projects expand to fill available time and never reach "done." Time-box your portfolio projects: 3 weeks for Archetype 1 (deployed app), 2 weeks for Archetype 2 (data pipeline), 4 weeks for Archetype 3 (resilient infrastructure).

Within that time box, the MVP must be complete and deployed. Additional features can be added after, but the project is "done" when the MVP is live and documented.

---

### Theory Checkpoint

1. What is a Minimum Viable Project for portfolio purposes, and how does it differ from "the smallest thing that could exist"?
2. What are the three sections of a scope document?
3. Why should portfolio projects have time-box deadlines even when nobody is waiting for them?

*(Answers in Key Takeaways)*

---

### Hands-On Lab

**Lab: Write a Scope Document for Your Selected Project**  
**Platform:** All platforms  
**Tools needed:** Text editor  
**Estimated time:** 20 minutes  
**What you'll demonstrate:** A professional scope document for the project idea you selected in Chapter 2.

**Step 1:** Open the project idea you selected in Chapter 2's lab.

**Step 2:** Write a scope document using this template:
```
Project: [name]
Target role: [e.g., junior cloud/DevOps engineer]
Time box: [e.g., 3 weeks]
Interview Fitness Test score target: 5/5

IN SCOPE (MVP):
- [ ] Component 1: [description]
- [ ] Component 2: [description]
- [ ] Component 3: [description]
... (list every component needed for MVP)

OUT OF SCOPE (V2):
- Feature A (reason: not needed to pass Interview Fitness Test)
- Feature B (reason: too complex for time box)

KNOWN RISKS:
- [Technology/API/service I haven't used before] → Spike: [what to test first]
- [Dependency on external service/API] → Mitigation: [fallback if unavailable]

DEFINITION OF DONE:
The project is done when:
1. All IN SCOPE components are deployed and accessible
2. The README answers all 5 Interview Fitness Test questions
3. Infrastructure is provisioned by IaC (Terraform or CDK)
4. At least one automated test or CI pipeline exists
```

**Step 3:** Review: Is the IN SCOPE list achievable in your time box? Be honest. Remove anything that's truly V2, not MVP.

**Lab reflection:** Looking at your Known Risks — which one would, if it became a blocker, completely stop the project? What's your plan if that risk materializes in week 2 instead of week 3?

---

### Quiz

**Quiz — Chapter 3**

1. What is the difference between "minimum viable project" for portfolio purposes and "minimum viable product" in a startup context?

2. In the AWS Lambda scoping example, what were the explicit out-of-scope decisions, and how did those constraints shape Lambda's eventual product architecture?

3. A developer's project scope document has 23 items in the IN SCOPE section for a 3-week time box. What problem does this suggest, and what's the fix?

4. How does writing "Out of Scope (V2)" items explicitly prevent scope creep during development?

5. True/False: Adding more features to a portfolio project always increases its signal strength to hiring managers. Explain your answer.

---

### Key Takeaways

- **MVP for portfolio = smallest version that passes the Interview Fitness Test**, not smallest thing that technically exists. The Interview Fitness Test defines the minimum, not laziness.
- **Scope documents have three sections:** In Scope (MVP, non-negotiable), Out of Scope V2 (explicitly named to prevent creep), Known Risks (spiked on day 1).
- **Time-boxing is a forcing function** — open-ended projects expand endlessly and never reach "done." Three portfolio projects completed > one ambitious project unfinished.
- **Professional scoping is a tradeoff (ambition vs. completion)** — the most important engineering skill that junior engineers underestimate is the ability to draw a firm boundary around MVP and defend it.
- Real product scoping (AWS Lambda's original constraints) shows that explicit out-of-scope decisions shape architecture — constraints are design, not limitation.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** MVP for portfolio: minimum features needed to pass the Interview Fitness Test — driven by "what signals skill to a hiring manager." MVP in a startup context: minimum features needed to test a business hypothesis with real users — driven by "what generates user feedback or revenue validation." Both concepts are about minimizing work to achieve a specific goal, but the goal and success criteria differ. Portfolio MVP is evaluated by hiring managers; product MVP is evaluated by market response.

**Q2:** Lambda's explicit out-of-scope: persistent in-process state (stateless required), long-running processes (15-minute max timeout), and complex dependency management (lightweight runtimes only). These constraints shaped the architecture: statelessness made Lambda horizontally scalable without coordination; short timeout made pricing per-100ms practical and created the "serverless" billing model; lightweight runtimes kept cold start times acceptable. Every "limitation" was a deliberate constraint that enabled the product's defining properties.

**Q3:** 23 in-scope items for 3 weeks suggests scope creep in planning — before any code is written. Fix: prioritize strictly. For each item, ask: "If I remove this, does the project fail the Interview Fitness Test?" If no → move to V2. Keep only items where the answer is yes. Realistically, a 3-week project should have 5–9 in-scope items at most.

**Q4:** Explicitly naming V2 items externalizes the "I'll add this later" impulse from your working memory into a document. When the impulse strikes mid-project ("I should add user authentication"), you don't fight it — you write it in V2 and continue with MVP. Without the V2 list, every "one more feature" idea competes for attention, stalls progress, and expands scope indefinitely. The list transforms scope creep from a willpower problem into a documentation exercise.

**Q5:** False. More features can reduce signal in two ways: (1) a complex project that's 60% done and publicly broken is worse than a simple project that's 100% complete and working — completeness and operational quality matter more than feature count; (2) features added to a project without clear purpose dilute the signal by making the project's narrative unclear. Hiring managers want to see depth in a few areas, not a mile-wide shallow demo. Three well-scoped, complete features outperform six half-implemented ones.

---

### Learning Resources

**📹 Video Resources**
- *How to Scope Projects as a Software Engineer* — engineering career channels on YouTube
- *Minimum Viable Product vs. Minimum Viable Architecture* — conference talks on product thinking for engineers

**📖 Articles & Documentation**
- **The Cloud Resume Challenge** — a pre-scoped project with defined MVP: https://cloudresumechallenge.dev — good template to understand scope, then extend it
- **basecamp: Shape Up (free book)** — https://basecamp.com/shapeup — their product methodology is directly applicable to project scoping

**🔗 Interactive Practice**
- **GitHub Projects:** Create a GitHub Project board for your selected project — move your IN SCOPE items to "To Do" and V2 items to "Backlog"

---

## Chapter 4: Hands-On — Writing Your First Project Proposal

### Learning Objectives

**Estimated time:** 10 minutes theory + 30 minutes lab = 40 minutes  
**Prerequisites:** Chapters 1–3 of this Part

**Learning objectives:**
- By the end of this chapter, you will be able to write a professional project proposal that includes architecture decisions, scope, and timeline
- By the end of this chapter, you will be able to draw a simple architecture diagram for your project
- By the end of this chapter, you will be able to justify architectural choices in writing at a level appropriate for a job interview

**Chapter bridge:** The proposal you write today is the foundation for Module 7, Part B (Project 1 build). Chapter 5 starts with architecture planning — your proposal becomes the input to that chapter.

---

### Spark — A Question Before the Answer

Professional engineers don't start building without a plan. In companies, this plan has different names: technical design document, architecture decision record, RFC (Request for Comments). The format varies; the purpose is the same: write down what you're going to build, why you're building it this way, what alternatives you considered, and what the known risks are — before you write any code. This serves two purposes: it forces clear thinking, and it creates a document that others can review and improve. For your portfolio, it serves a third purpose: it becomes part of your documentation, proving you think before you build.

---

### Why This Matters

Writing a project proposal before building is the single highest-ROI habit a junior engineer can develop. It surfaces architectural misunderstandings before they become structural problems, documents the "why" that is otherwise lost, and produces a README-ready artifact that demonstrates professional engineering practice to hiring managers.

---

### Hands-On Lab

**Lab: Write a Project Proposal**  
**Platform:** All platforms  
**Tools needed:** Text editor, draw.io or excalidraw.com (free, browser-based)  
**Estimated time:** 30 minutes  
**What you'll demonstrate:** A complete project proposal with architecture diagram.

**Step 1:** Create a file called `PROJECT_PROPOSAL.md` in your project's future directory.

**Step 2:** Fill in this template:
```markdown
# Project Proposal: [Project Name]

## Problem Statement
[1-2 sentences: what problem does this solve? Who has this problem?]

## Solution Overview
[2-3 sentences: what does the project do? What's the core mechanism?]

## Architecture

[Insert diagram here — use excalidraw.com, draw it, screenshot it]

### Components
| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | S3 + CloudFront | Static web hosting |
| Backend | Lambda | Serverless compute |
| Database | DynamoDB | Key-value storage |
| Infrastructure | Terraform | IaC provisioning |
| CI/CD | GitHub Actions | Automated deployment |

### Architectural Decisions
**Decision 1:** [e.g., "Why Lambda instead of EC2"]
- Options considered: Lambda, EC2, ECS
- Chosen: Lambda
- Reason: Event-driven workload with infrequent invocations — Lambda's per-invocation pricing is significantly cheaper than a constantly-running EC2 instance for this use case.

**Decision 2:** [another decision]

## Scope
### In Scope (MVP)
- [ ] Component A
- [ ] Component B

### Out of Scope (V2)
- Feature X
- Feature Y

## Timeline
| Week | Milestones |
|------|------------|
| Week 1 | Infrastructure provisioned (Terraform), basic app deployed |
| Week 2 | Core feature working end-to-end |
| Week 3 | CI/CD pipeline, documentation, cleanup |

## Known Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| [Risk 1] | Medium | [Plan] |

## Definition of Done
- [ ] All MVP components deployed and accessible
- [ ] README answers all 5 Interview Fitness Test questions
- [ ] Infrastructure 100% provisioned by Terraform
- [ ] CI/CD pipeline deploys on push to main
```

**Step 3:** Draw a simple architecture diagram using https://excalidraw.com (free, no account needed). Include boxes for each component and arrows showing data flow. Export as PNG and embed in your proposal.

**What success looks like:** A complete PROJECT_PROPOSAL.md with all sections filled in, at least two documented architectural decisions, and an architecture diagram.

**Lab reflection:** In your "Architectural Decisions" section, you justified a technology choice. What would you say to an interviewer who pushed back on that choice? Prepare a one-sentence defense of each decision — because that's exactly what a technical interview will do.

---

### Quiz

**Quiz — Chapter 4**

1. What is the purpose of an Architectural Decision Record (ADR), and what three things does it document?

2. In your project proposal template, why is the "Options considered" field important — not just the "Chosen" and "Reason" fields?

3. A project proposal has this architectural decision: "Used S3 for file storage because it's popular." Rewrite this decision entry to demonstrate engineering judgment.

4. What does a timeline with weekly milestones provide that a simple task list doesn't?

5. True/False: A project proposal that changes significantly during building is a sign of poor planning. Explain your answer.

---

### Key Takeaways

- **A project proposal surfaces architectural problems before they become structural** — it's cheap to change direction in a document; expensive to change it in deployed infrastructure.
- **Architecture diagrams** communicate system design to reviewers (and interviewers) in seconds — what text takes pages to explain, a diagram explains in one glance.
- **Documenting "options considered" in architectural decisions** proves you evaluated alternatives — a key signal of engineering judgment vs. "I used the first thing I thought of."
- **The proposal's tradeoff is time invested upfront vs. time saved during building** — professionals who write proposals consistently build faster and with fewer false starts than those who "just start coding."
- Professional engineering culture values written proposals and ADRs as core engineering practice — your proposal is not just a planning tool, it's evidence of professional engineering habits.

---

### Quiz Answer Key — INSTRUCTOR ONLY / LMS BACKEND

**Q1:** Architectural Decision Record (ADR): documents (1) the context/problem that required a decision, (2) the options that were considered (with tradeoffs), and (3) the decision made and the reasoning. ADRs are valuable because they capture the "why" behind decisions — which is typically lost over time as team members change. Six months later, when someone asks "why did we use DynamoDB instead of RDS?", the ADR answers the question without requiring archaeology through commit history or old Slack messages.

**Q2:** "Options considered" is important because it proves evaluation happened — not just default to the most familiar technology. If you document "Considered: Lambda, EC2, ECS. Lambda chosen because event-driven, infrequent invocations, minimal operational overhead" — a reviewer can evaluate whether the comparison was appropriate. If you only document "Lambda, because serverless" — you're not showing judgment, you're showing a conclusion. In interviews, "what alternatives did you consider?" is a standard question; the "options considered" field is the answer.

**Q3:** Original: "Used S3 for file storage because it's popular." Improved version: "Options considered: S3, EFS, EBS, local instance storage. Chosen: S3. Reason: Files are static assets accessed randomly by many concurrent users — S3's eventual-consistency, highly-available object storage model matches this access pattern at low cost ($0.023/GB/month vs. EFS at $0.30/GB/month). EBS was ruled out (single AZ, block storage — not appropriate for distributed access). EFS was ruled out (10x cost for a use case that doesn't require POSIX file system semantics). Local storage was ruled out (not durable across instance replacement)."

**Q4:** A weekly milestone timeline provides: (1) forcing function — if week 1's milestone isn't met, you know immediately something is wrong, not at week 3 when it's too late to adjust scope; (2) natural review points — end of each week, evaluate progress against plan; (3) dependency mapping — "CI/CD in week 3" assumes "core feature working by week 2" — milestones reveal sequencing dependencies. A task list doesn't have time bounds, so you can't tell if you're on track until the deadline has passed.

**Q5:** False. A project proposal that changes significantly during building is often a sign of good planning — it means the plan was specific enough to identify when reality diverged, and flexible enough to update rather than ignore the divergence. Bad planning is a proposal that never changes because it was so vague it could accommodate any outcome, OR a proposal that doesn't change because the engineer ignores divergence rather than updating the plan. The goal is not a static document — it's a living record of how understanding evolves.

---

### Learning Resources

**📹 Video Resources**
- *Architecture Diagrams: How to Draw Them Like a Pro* — AWS and Google Cloud have official diagram standards on YouTube
- *Technical Design Documents at Google* — engineering culture talks covering ADR practices

**📖 Articles & Documentation**
- **AWS Architecture Center:** https://aws.amazon.com/architecture/ — browse reference architectures for inspiration and diagram standards
- **ADR GitHub Template:** https://github.com/joelparkerhenderson/architecture-decision-record — standard ADR templates
- **Excalidraw Documentation:** https://excalidraw.com — free, browser-based diagramming

**🔗 Interactive Practice**
- **AWS Architecture Diagrams (draw.io template):** draw.io has built-in AWS icon libraries — create your architecture diagram using official AWS icons for a professional result

---

## 📚 Additional Resources for This Part

### Essential Pre-Module Reading
1. **The Cloud Resume Challenge:** https://cloudresumechallenge.dev — a structured first project with defined MVP; use it as a foundation, then extend it with original elements
2. **"How to Build a Portfolio" (levelup.gitconnected.com)** — engineering-specific portfolio advice
3. **ARCHITECTURE.md templates** — search GitHub for repositories with ARCHITECTURE.md files to see how professionals document project design

### Portfolio Platform Setup
Before Module 7, Part B begins:
1. Create a GitHub profile README (instructions at docs.github.com)
2. Pin 3 placeholder repositories for your 3 projects (you'll fill them in Parts B–D)
3. Follow the engineers you admire — GitHub shows followers/following, which signals community participation
