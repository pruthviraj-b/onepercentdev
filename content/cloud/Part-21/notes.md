# Part 21 — Scripting Fundamentals

Automation starts with scripting. We cover Bash syntax, variables, loops, command pipelines, Python scripting for automation, querying APIs, file manipulation, and building task utilities.

---

## Chapter 5: Introduction to Bash Scripting

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Define what a shell script is and why it's the foundation of automation.
- Identify the structural components of a basic Bash script (shebang, execution permissions).

---

### Spark — A Question Before the Answer
If you have to type the exact same five Linux commands to deploy your application every single morning, how long until you make a typo that crashes production? Why rely on human memory when you can save those commands in a text file and execute them all with a single keystroke?

### Why This Matters
The Command Line Interface (CLI) is powerful, but typing commands manually is unscalable and error-prone. Bash scripting is the absolute foundational skill of DevOps. Before you can use advanced tools like Jenkins or GitHub Actions, you must know how to write a script, because those advanced tools are mostly just running your scripts in the cloud.

### Core Theory

**1. What is a Shell Script?**
A shell script is simply a plain text file containing a sequence of commands that you would otherwise type manually into the terminal. When you execute the file, the shell reads it from top to bottom and runs each command.

**2. The Shebang (`#!`)**
Every bash script should start with a special first line called a "shebang" (hash-bang).
`#!/bin/bash`
This tells the operating system: "Do not try to run this file as Python or Ruby. Use the Bash interpreter located at `/bin/bash`."

**3. Execution Permissions**
By default, Linux protects you from yourself. If you create a new text file called `deploy.sh`, you cannot run it immediately. The file lacks "execute" permissions. You must explicitly grant permission using the `chmod` command (Change Mode):
`chmod +x deploy.sh`
Once executable, you run the script by pointing to its path in the current directory:
`./deploy.sh`

### Theory Checkpoint
1. What does `#!/bin/bash` do at the top of a script?
2. Why must you run `chmod +x` before running a new script?

---

### Hands-On Lab
*Covered in Chapter 6.*

---

### Quiz
1. If you forget to add `./` before the script name (e.g., you type `deploy.sh` instead of `./deploy.sh`), what will Linux do?
2. True/False: A shell script can run commands that you normally couldn't run manually in the terminal.

### Key Takeaways
- A script is just a text file full of manual commands.
- The shebang defines the interpreter.
- Execution requires explicit `+x` permissions.

### Instructor Answer Key
1. Linux will search your `$PATH` (global directories like `/bin` and `/usr/bin`) for a program named `deploy.sh`. It will not look in your current directory, and it will return a "command not found" error.
2. False. A script is constrained by the exact same permissions and capabilities as a manual terminal session.

---

## Chapter 6: Hands-On: Writing Your First Bash Script

### Learning Objectives
**Estimated time:** 15 minutes lab

**Learning objectives:**
- Create, modify, make executable, and run a Bash script.

---

### Spark — A Question Before the Answer
Reading about a hammer doesn't build a house. Can you actually write the file, set the permissions, and execute the code?

### Why This Matters
Muscle memory is critical in DevOps. The workflow of `nano` -> `write` -> `chmod` -> `execute` should become second nature.

### Hands-On Lab
**Lab: The Backup Script**
1. Open your terminal (or a Linux environment like WSL/Cloud Shell).
2. Create a new file using nano: `nano backup.sh`
3. Type the following exactly:
   ```bash
   #!/bin/bash
   echo "Starting backup process..."
   mkdir -p /tmp/my_backups
   tar -czf /tmp/my_backups/home_backup.tar.gz ~
   echo "Backup complete! File saved to /tmp/my_backups/"
   ```
4. Save and exit (Ctrl+O, Enter, Ctrl+X).
5. Try to run it: `./backup.sh` (You will get a "Permission denied" error).
6. Fix the permissions: `chmod +x backup.sh`
7. Run it again: `./backup.sh`

### Quiz
1. (Self-reflection) Did your script successfully compress your home directory into a `.tar.gz` archive?

### Key Takeaways
- The terminal workflow for scripting is: Write, Grant Permission, Execute.
- Scripts can output text (`echo`) to tell the user what is happening.

### Instructor Answer Key
*(Self-reflection based on the lab).*

---

## Chapter 7: Variables, Loops & Conditionals in Bash

### Learning Objectives
**Estimated time:** 20 minutes theory

**Learning objectives:**
- Utilize variables to make scripts dynamic.
- Write `if/then` statements to add logic to scripts.
- Write `for` loops to automate repetitive tasks across multiple items.

---

### Spark — A Question Before the Answer
A script that hardcodes "deploy server 1" is useful once. But what if you need to deploy 50 servers? Are you going to copy and paste the code 50 times, or are you going to use a loop to do it in three lines of code?

### Why This Matters
Sequential commands are just a macro. True automation requires logic. The script must be able to ask questions ("Did this command succeed? If yes, continue. If no, exit.") and repeat actions ("For every file in this folder, do X").

### Core Theory

**1. Variables**
Variables store data so you don't have to hardcode it. 
- *Declaration:* `USER_NAME="Alice"` (Note: NO spaces around the equals sign in Bash!)
- *Usage:* `echo "Hello, $USER_NAME"` (Use the `$` to reference the variable).

**2. Conditionals (If/Then)**
Logic gates for your script.
```bash
if [ -d "/tmp/my_backups" ]; then
    echo "Directory exists, proceeding..."
else
    echo "Directory not found, creating it..."
    mkdir /tmp/my_backups
fi
```
*(Note: The spaces inside the `[ ]` brackets are mandatory in Bash).*

**3. Loops (For/While)**
Repeating actions.
```bash
for SERVER in web1 web2 web3; do
    echo "Restarting $SERVER..."
    # ssh $SERVER "sudo systemctl restart nginx"
done
```

### Theory Checkpoint
1. Why will `MY_VAR = "Hello"` fail in a Bash script?
2. What symbol is used to read the value inside a variable?

---

### Hands-On Lab
*No lab required.*

---

### Quiz
1. In the loop example, what does the variable `$SERVER` represent on the second iteration of the loop?
2. What does `fi` mean at the end of a conditional block?

### Key Takeaways
- Variables make scripts reusable. No spaces around `=`.
- Conditionals (`if`) allow scripts to react to different environments.
- Loops (`for`) allow massive scale with minimal code.

### Instructor Answer Key
1. The string "web2".
2. It signifies the end of the `if` block (it is "if" spelled backwards).

---

## Chapter 8: Introduction to Python for Automation

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Compare Bash scripting with Python scripting.
- Identify scenarios where Python is vastly superior to Bash.

---

### Spark — A Question Before the Answer
If Bash is so powerful, why do Cloud Engineers also need to learn Python? If you need to read a complex JSON response from a cloud API, filter it by an ID, and send an alert to a Slack channel, would you rather write 50 lines of unreadable Bash text-parsing, or 5 lines of elegant Python?

### Why This Matters
Bash is excellent for gluing Linux commands together. But Bash is terrible at parsing complex data (like JSON or APIs) and lacks robust error handling. Python is the lingua franca of the cloud. It bridges the gap between infrastructure automation and actual software engineering.

### Core Theory

**1. Bash vs Python**
- **Use Bash when:** You are moving files, installing packages, interacting heavily with the local Linux OS, or writing a script under 50 lines.
- **Use Python when:** You are interacting with REST APIs, parsing JSON/XML data, writing a script over 100 lines, or doing complex math/string manipulation.

**2. The Python Ecosystem**
Python's power comes from its libraries. You don't have to write code to connect to AWS—you just import the `boto3` library, which Amazon wrote for you. You don't have to write code to make HTTP requests—you just import the `requests` library.

**3. Readability Counts**
Python enforces indentation (whitespace). This makes the code naturally readable. In DevOps, where scripts are shared across massive teams, readable Python code is infinitely easier to maintain than cryptic Bash one-liners.

### Theory Checkpoint
1. If you need to write a script that queries the weather via an HTTP API and parses the JSON response, which language should you choose?
2. If you need to write a script that creates a Linux user and sets their home directory permissions, which language should you choose?

---

### Hands-On Lab
*Covered in Chapter 9.*

---

### Quiz
1. Why is Python heavily preferred over Bash for interacting with modern Cloud Provider APIs?
2. What enforces structural readability in Python code?

### Key Takeaways
- Bash is for OS-level manipulation and simple tasks.
- Python is for API interaction, complex logic, and robust data handling.
- Python's massive library ecosystem does most of the heavy lifting for you.

### Instructor Answer Key
1. Cloud APIs return complex JSON data structures. Parsing JSON in Bash (using tools like `jq`) is notoriously difficult and brittle, whereas Python natively converts JSON into easy-to-use dictionaries.
2. Mandatory whitespace indentation (instead of brackets or braces).

---

## Chapter 9: Hands-On: Writing Your First Python Automation Script

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Write and execute a basic Python script.
- Utilize variables and standard output in Python.

---

### Spark — A Question Before the Answer
Are you ready to write code in the language that powers Pinterest, Instagram, and the AWS CLI?

### Why This Matters
Transitioning from terminal commands to a high-level programming language is the single biggest leap in an engineer's career. Python is the easiest language to make that leap.

### Hands-On Lab
**Lab: The Python Greeter**
1. Ensure Python 3 is installed: `python3 --version`
2. Create a new file: `nano hello.py`
3. Write the script:
   ```python
   #!/usr/bin/env python3
   
   def greet_server(server_name):
       print(f"Connecting to {server_name}...")
       print(f"[{server_name}] is online and healthy.\n")

   servers = ["Web-01", "DB-01", "Cache-01"]
   
   for s in servers:
       greet_server(s)
   ```
4. Save and exit.
5. Make it executable: `chmod +x hello.py`
6. Run it: `./hello.py` (or `python3 hello.py`)

### Quiz
1. (Self-reflection) Did the script loop through all three servers and print their status? Notice how much cleaner the `for` loop looks compared to Bash.

### Key Takeaways
- Python scripts also use a shebang (usually `#!/usr/bin/env python3`) to tell the OS how to execute them.
- Functions (`def`) allow you to write a block of code once and reuse it cleanly.

### Instructor Answer Key
*(Self-reflection based on the lab).*

---

## Chapter 10: Working with Files & APIs Programmatically

### Learning Objectives
**Estimated time:** 15 minutes theory

**Learning objectives:**
- Explain how Python interacts with the local file system.
- Understand the basics of HTTP Requests in Python to interact with external APIs.

---

### Spark — A Question Before the Answer
If your boss asks you to check the status of 5,000 GitHub repositories to see which ones have outdated security dependencies, you could spend a month clicking through the GitHub website. Or, you could write a Python script that asks the GitHub API 5,000 times in 10 seconds. Which engineer gets promoted?

### Why This Matters
The true power of cloud automation is the API (Application Programming Interface). Every cloud service, SaaS tool, and platform can be controlled via API. Learning to talk to APIs using Python gives you programmatic control over the entire internet.

### Core Theory

**1. File I/O (Input/Output)**
Python can easily open files, read them, and write to them. This is crucial for parsing log files or generating reports.
```python
with open("server_logs.txt", "r") as file:
    for line in file:
        if "ERROR" in line:
            print(line)
```

**2. The `requests` Library**
The most famous third-party Python library. It makes interacting with APIs incredibly simple.
- **GET Request:** Asking the API for information (e.g., "Get user details").
- **POST Request:** Sending the API new information (e.g., "Create a new server").

**3. JSON and Dictionaries**
APIs communicate using JSON (JavaScript Object Notation). Python seamlessly converts JSON into a "Dictionary" (key-value pairs), allowing you to extract exactly what you need.
```python
import requests
response = requests.get("https://api.github.com")
data = response.json()
print(data["current_user_url"])
```

### Theory Checkpoint
1. What does the `requests.get()` function do in Python?
2. Why is Python's ability to handle JSON natively so important for cloud automation?

---

### Hands-On Lab
*Covered in Chapter 11.*

---

### Quiz
1. In the file reading example, what does the `if "ERROR" in line:` code accomplish?
2. If you want to create a new virtual machine via the provider's API, which HTTP method would you likely use: GET or POST?

### Key Takeaways
- Python handles file manipulation cleanly.
- The `requests` library is the standard for API interaction.
- APIs return JSON, which Python easily parses.

### Instructor Answer Key
1. It acts as a filter, ensuring the script only prints lines from the log file that contain the word "ERROR", ignoring all the healthy log lines.
2. POST. GET is for retrieving data; POST is for creating or submitting data.

---

## Chapter 11: Hands-On: Automating a Repetitive Task End-to-End

### Learning Objectives
**Estimated time:** 20 minutes lab

**Learning objectives:**
- Synthesize Python file reading and API calling into a single automated tool.

---

### Spark — A Question Before the Answer
Can you put it all together? Can you write a tool that pulls real data from the internet and processes it automatically?

### Why This Matters
This is what Cloud Engineers do daily: tie different systems together.

### Hands-On Lab
**Lab: The Public API Fetcher**
In this lab, we will use Python to ask a public API for data, and then write that data to a local file.
1. Create a file: `nano fetch_joke.py`
2. Write the script:
   ```python
   import requests
   
   # 1. Ask the API for a random programming joke
   url = "https://official-joke-api.appspot.com/random_joke"
   response = requests.get(url)
   joke_data = response.json()
   
   # 2. Format the joke
   setup = joke_data["setup"]
   punchline = joke_data["punchline"]
   formatted_joke = f"{setup}\n... {punchline}\n"
   
   print(formatted_joke)
   
   # 3. Save it to a file
   with open("jokes.txt", "a") as file:
       file.write(formatted_joke)
       print("Saved to jokes.txt")
   ```
3. Run it: `python3 fetch_joke.py`
4. Verify the file was created: `cat jokes.txt`
5. Run it 3 more times, and view the file again to see the jokes accumulating.

### Quiz
1. (Self-reflection) In the lab script, we used `"a"` in the `open()` function instead of `"w"`. Why did we do this, and what happened when you ran the script multiple times?

### Key Takeaways
- Real automation is just combining basic concepts: API GET requests + JSON parsing + File I/O.

### Instructor Answer Key
1. `"a"` stands for append mode. It adds new text to the end of the file. If we used `"w"` (write mode), it would have deleted the file's previous contents and overwritten it with only the newest joke every time it ran.

---

## 📚 Learning Resources & Visual Masterclasses

**📖 Articles & Documentation**
- *Automate the Boring Stuff with Python (Al Sweigart):* This is widely considered the greatest beginner book for Python automation. You can read it for free online.
- *Bash Scripting Guide (Linux Command Line):* The definitive reference for Bash syntax.

---

## Practice Quiz

1. Review the chapters and write a summary paragraph of the main objective for this part.
2. Outline how the topics in this part build upon the preceding section's concepts.
