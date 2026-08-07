# Module 1 — Python Foundations for Data Analysis
## Topic 1: Variables

---

## 0. Prerequisites

- Python installed (any version 3.8+) and ability to run a `.py` file or Jupyter Notebook cell
- No prior programming knowledge required — this is the true starting point

---

## 1. Concept Overview

**Simple Definition**
A **variable** is a named location in a computer's memory used to store a value so that it can be used, changed, or referred to later in a program.

Think of a variable as a **labeled box**. You put something inside the box (a number, a name, a dataset reference), and you use the label (the variable name) whenever you want to access what's inside — without needing to know exactly where in memory it physically lives.

**Why This Topic Exists**
Every program needs to *remember* things — a customer's age, a sales total, a file path, a DataFrame of transactions. Without variables, a program could only work with fixed, literal values typed directly into the code, which would make it impossible to write reusable, dynamic, or data-driven programs.

**Why It Is Important**
- Variables are the **very first building block** of programming — every single line of data analysis code depends on them.
- In data analysis, variables hold datasets, column names, calculated metrics, filters, model parameters, and more.
- Poor variable usage (bad names, wrong types, overwriting values) is one of the most common sources of bugs in real projects.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Create and assign variables correctly in Python.
2. Understand how Python stores and manages variable data internally.
3. Follow professional naming conventions used in real companies.
4. Avoid the most common variable-related bugs in data analysis code.
5. Use variables confidently inside pandas/NumPy-based workflows.

**Where It Is Used in Real Projects**
- Storing raw and cleaned datasets (`df`, `raw_data`, `cleaned_sales`)
- Holding configuration values (`FILE_PATH`, `API_KEY`, `THRESHOLD`)
- Storing calculated business metrics (`total_revenue`, `avg_churn_rate`)
- Loop counters and temporary values during data transformation
- Storing model hyperparameters in ML pipelines (`learning_rate`, `n_estimators`)

---

## 2. In-Depth Explanation

### 2.1 Core Concept: What Really Happens When You Create a Variable

In Python, a variable is **not a box that holds a value directly** (unlike some other languages such as C). Instead:

- Python creates an **object** in memory (e.g., the integer `25`).
- The variable name acts as a **reference (label/pointer)** that points to that object.
- This is why Python is described as having **"names bound to objects"** rather than "variables holding values."

```python
age = 25
```

Here's what happens internally:
1. Python creates an integer object with value `25` somewhere in memory.
2. The name `age` is bound to that object.
3. `age` now refers to that memory location.

This matters because:

```python
a = [1, 2, 3]
b = a          # b now points to the SAME list object as a
b.append(4)
print(a)       # [1, 2, 3, 4]  -- a changed too!
```

Both `a` and `b` are names pointing to the **same object**, so modifying the object through `b` affects what `a` sees too. This is a critical concept for data analysts, because it directly explains a very common pandas bug (covered in Best Practices).

### 2.2 Dynamic Typing

Python is **dynamically typed**, meaning:
- You do **not** need to declare a variable's type in advance.
- The type is determined automatically based on the value assigned.
- A variable can be **reassigned to a different type** at any time.

```python
x = 10        # x is an integer
x = "hello"   # now x is a string — completely legal
```

This is different from **statically typed languages** (like Java or C++), where you must declare `int x = 10;` and `x` can never hold a string afterward.

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Variable** | A name bound to a value/object in memory |
| **Assignment** | The act of binding a name to a value using `=` |
| **Identifier** | The name given to a variable (must follow naming rules) |
| **Object** | The actual data stored in memory (int, string, list, etc.) |
| **Reference/Binding** | The connection between a variable name and an object |
| **Dynamic Typing** | Type is inferred at runtime, not fixed in advance |
| **Mutability** | Whether an object's value can change after creation (lists = mutable, integers/strings = immutable) |
| **Namespace** | A container that holds a set of variable names and their bindings (e.g., global namespace, function-local namespace) |
| **Garbage Collection** | Python's automatic process of freeing memory when no variable references an object anymore |

### 2.4 Key Rules for Naming Variables

1. Must start with a **letter (a–z, A–Z)** or an **underscore (_)** — never a number.
2. Can contain letters, numbers, and underscores only (`age_2024` ✅, `age-2024` ❌).
3. Case-sensitive: `Age`, `age`, and `AGE` are three different variables.
4. Cannot be a Python **reserved keyword** (`for`, `class`, `if`, `return`, etc.).
5. No spaces allowed (`total sales` ❌ → `total_sales` ✅).

```python
# Valid
total_sales = 5000
_temp = 10
customer2024 = "Aditi"

# Invalid
2024customer = "Aditi"     # SyntaxError — starts with a number
total-sales = 5000         # SyntaxError — hyphen not allowed
class = "Economy"          # SyntaxError — 'class' is a reserved keyword
```

### 2.5 How Variables Behave — Reassignment & Multiple Assignment

```python
# Reassignment
score = 90
score = 95     # score now refers to a new object (95); old object (90) may get garbage collected

# Multiple assignment (same value)
x = y = z = 0

# Multiple assignment (different values)
name, age, city = "Pruthvi", 24, "Karnataka"
```

### 2.6 Why It Works This Way (Design Philosophy)

Python's creators designed variables this way to prioritize **simplicity, flexibility, and readability** — core to Python's philosophy ("The Zen of Python"). This makes Python ideal for **data analysis**, where analysts constantly reassign variables to different datasets, filtered subsets, or transformed types without friction.

---

## 3. Syntax & Usage

### 3.1 Basic Syntax

```python
variable_name = value
```

| Component | Explanation |
|---|---|
| `variable_name` | The identifier you choose (must follow naming rules) |
| `=` | The **assignment operator** — binds the name to the value on the right |
| `value` | Any valid Python object: number, string, list, DataFrame, etc. |

### 3.2 Common Variations

**a) Multiple assignment in one line**
```python
a, b, c = 1, 2, 3
```

**b) Same value to multiple variables**
```python
x = y = z = 100
```

**c) Swapping variables (Pythonic way)**
```python
a, b = 5, 10
a, b = b, a     # a=10, b=5 — no temp variable needed
```

**d) Augmented assignment (update in place)**
```python
total = 100
total += 50     # same as total = total + 50 → 150
total -= 20     # 130
total *= 2      # 260
total /= 2      # 130.0
```

**e) Type checking a variable**
```python
type(total)     # <class 'float'>
```
- `type()` — built-in function; **Parameter:** the variable/value to check; **Returns:** the data type class of that object.

**f) Deleting a variable**
```python
del total       # removes the binding; using 'total' afterward raises NameError
```

### 3.3 Constants (Convention, Not Enforced)

Python has no true constants, but by convention, variables meant to stay unchanged are written in **UPPERCASE**:
```python
PI = 3.14159
MAX_RETRIES = 5
```
This doesn't prevent reassignment — it's a signal to other developers: "don't change this."

---

## 4. Practical Examples

### 4.1 Basic Example
```python
name = "Pruthvi"
age = 24
is_student = False

print(name, age, is_student)
```
**Line-by-line explanation:**
- `name = "Pruthvi"` → creates a string object and binds `name` to it.
- `age = 24` → creates an integer object and binds `age` to it.
- `is_student = False` → creates a boolean object and binds `is_student` to it.
- `print(...)` → displays all three values separated by spaces.

**Expected Output:**
```
Pruthvi 24 False
```
**Why:** `print()` converts each argument to its string form and joins them with a single space by default.

---

### 4.2 Intermediate Example — Reassignment & Type Change
```python
value = 10
print(type(value))

value = "ten"
print(type(value))
```
**Line-by-line explanation:**
- `value = 10` → binds `value` to an integer object.
- `type(value)` → checks and prints the current type.
- `value = "ten"` → rebinds `value` to a completely new string object (Python allows type change on reassignment).

**Expected Output:**
```
<class 'int'>
<class 'str'>
```
**Why:** Python is dynamically typed — the same variable name can be reassigned to a different object type at any time.

---

### 4.3 Advanced Example — Mutability & Shared References
```python
sales_q1 = [100, 200, 300]
sales_q2 = sales_q1        # both point to the SAME list

sales_q2.append(400)

print("Q1:", sales_q1)
print("Q2:", sales_q2)
```
**Line-by-line explanation:**
- `sales_q1 = [100, 200, 300]` → creates a list object; `sales_q1` points to it.
- `sales_q2 = sales_q1` → does NOT copy the list; `sales_q2` now points to the **same object**.
- `sales_q2.append(400)` → modifies the shared list object directly.

**Expected Output:**
```
Q1: [100, 200, 300, 400]
Q2: [100, 200, 300, 400]
```
**Why:** Lists are **mutable**, and both variable names reference the exact same object in memory — a change through one name is visible through the other. (To avoid this, use `sales_q1.copy()` or `list(sales_q1)`.)

---

### 4.4 Real-World Project Example — Sales Data Variables
```python
import pandas as pd

# Variables commonly used in a real analysis pipeline
FILE_PATH = "sales_data.csv"
TARGET_COLUMN = "revenue"
THRESHOLD = 10000

df = pd.read_csv(FILE_PATH)
high_value_sales = df[df[TARGET_COLUMN] > THRESHOLD]

total_high_value = high_value_sales[TARGET_COLUMN].sum()
print(f"Total high-value revenue: {total_high_value}")
```
**Line-by-line explanation:**
- `FILE_PATH`, `TARGET_COLUMN`, `THRESHOLD` → constant-style variables holding configuration, making the code reusable and easy to update.
- `df = pd.read_csv(FILE_PATH)` → variable `df` holds the entire loaded dataset (a DataFrame object).
- `high_value_sales = ...` → a new variable stores the filtered subset — `df` itself is untouched.
- `total_high_value = ...sum()` → stores a single computed number (a business metric).
- `f"..."` (f-string) → inserts the variable's value directly into the printed message.

**Expected Output (example):**
```
Total high-value revenue: 452300
```
**Why:** This illustrates the real pattern used in analyst workflows — configuration variables at the top, then a chain of variables each representing a transformation step, keeping the pipeline traceable and readable.

---

## 5. Real-World Applications

| Domain | How Variables Are Used |
|---|---|
| **Data Analysis** | Storing datasets (`df`), filters, subsets, computed columns |
| **Data Science** | Holding feature sets, target variables, train/test splits |
| **Machine Learning** | Hyperparameters (`learning_rate`, `epochs`), model objects |
| **Business Analytics** | KPIs like `total_revenue`, `churn_rate`, `conversion_rate` |
| **Finance** | Interest rates, portfolio values, risk thresholds |
| **Healthcare** | Patient IDs, vitals, diagnostic thresholds in analysis scripts |
| **Marketing** | Campaign budgets, click-through rates, audience segments |
| **AI** | Storing embeddings, token counts, model configuration |
| **Automation** | File paths, credentials (via env variables), loop counters |
| **Dashboards** | Variables feeding into chart values (e.g., `monthly_sales`) |
| **ETL Pipelines** | Source paths, staging table names, row counts, batch IDs |

**How Big Tech Uses This Concept**
- **Google**: Internal data pipelines use thousands of named configuration variables to control which datasets, models, and thresholds are used in production (e.g., in BigQuery pipeline scripts).
- **Amazon**: Inventory and pricing systems use variables to hold real-time stock counts and price thresholds that feed recommendation and repricing algorithms.
- **Netflix**: Uses variables to store user-segment IDs and A/B test flags that determine which UI or recommendation logic a user sees.
- **Uber**: Surge pricing scripts store variables like `demand_ratio` and `base_fare` that are recalculated every few seconds.
- **Spotify**: Variables hold user listening metrics (`skip_rate`, `session_length`) used to feed personalization models.
- **Microsoft**: Excel/Power BI's DAX and Power Query use "measures" and "parameters" — conceptually identical to variables — to drive dashboards.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Use **descriptive names**: `customer_revenue` instead of `x` or `data1`.
- Use **snake_case** for variable names (Python/PEP 8 standard): `total_sales`, not `TotalSales` or `totalSales`.
- Use **UPPERCASE** for constants: `MAX_LIMIT = 100`.
- Keep variable scope as narrow as possible — don't reuse the same variable name for unrelated things.
- Use `.copy()` when you need an independent copy of a mutable object (list, DataFrame) instead of direct assignment.

### Performance Tips
- Avoid creating unnecessary intermediate variables in large loops over big datasets — it adds memory overhead.
- Reassigning a variable to a smaller/no-longer-needed object allows Python's garbage collector to free memory sooner.

### Clean Code Recommendations
```python
# Bad
x = pd.read_csv("data.csv")
y = x[x['a'] > 10]

# Good
raw_sales_df = pd.read_csv("sales.csv")
high_value_df = raw_sales_df[raw_sales_df['amount'] > 10]
```

### Common Beginner Mistakes
1. **Using vague names** (`data`, `temp`, `df2`) — makes code unreadable months later.
2. **Confusing assignment (`=`) with equality (`==`)**:
   ```python
   if age = 18:   # SyntaxError — should be ==
   ```
3. **Overwriting the original dataset variable** and losing the raw data:
   ```python
   df = pd.read_csv("data.csv")
   df = df.dropna()   # original df is now gone — no way to go back
   ```
4. **Assuming assignment copies mutable objects** (see Example 4.3) — leads to silent, hard-to-find bugs.

### Common Interview Mistakes
- Saying "variables store values" without understanding Python's **name-binding/reference model** — interviewers at product-based companies often probe this.
- Not being able to explain the difference between **mutable vs immutable** objects and how it affects variable behavior.
- Forgetting that Python has **no block scope** (only function/module scope) — a variable created inside an `if` block is still accessible outside it.

### Debugging Tips
- If a variable "changes unexpectedly" elsewhere in your code, suspect **shared references** to a mutable object.
- Use `id(variable)` to check if two variables point to the same object in memory:
  ```python
  print(id(a), id(b))   # same ID = same object
  ```
- Use `type(variable)` whenever you're unsure what a variable currently holds — especially after multiple transformations.

### Things to Avoid
- Avoid single-letter names except for short-lived loop counters (`i`, `j`).
- Avoid reusing one variable name for entirely different types/purposes in the same script.
- Avoid relying on variable reassignment instead of creating new, clearly named variables for each pipeline stage.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `NameError: name 'x' is not defined` | Using a variable before assigning it, or a typo in the name | Ensure the variable is assigned before use; check spelling/case |
| `SyntaxError: invalid syntax` (on `class = "A"`) | Using a reserved keyword as a variable name | Rename to something like `class_name` |
| `SyntaxError: invalid syntax` (on `2data = 5`) | Variable name starts with a digit | Start the name with a letter/underscore: `data2` |
| `TypeError: unsupported operand type(s)` | Trying to operate on incompatible types (e.g., `"5" + 5`) | Convert types explicitly: `int("5") + 5` |
| Unexpected shared mutation (no error, wrong output) | Two variables referencing the same mutable object | Use `.copy()` or `list()`/`dict()` to create an independent copy |
| `UnboundLocalError` (inside functions) | Referencing a variable before it's assigned inside a function where it's also assigned later | Assign a default value first, or use `global`/pass as a parameter |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What is a variable in Python?
2. Write code to store your name, age, and city in three variables and print them.
3. Is Python statically or dynamically typed? Explain briefly.

### Intermediate Questions
4. What will be the output of the following code, and why?
   ```python
   a = [1, 2, 3]
   b = a
   b.append(4)
   print(a)
   ```
5. What is the difference between `=` and `==`?
6. Explain the difference between mutable and immutable objects with one example each.

### Advanced Questions
7. Explain what happens internally in memory when you write `x = 10` and then `x = 20`.
8. Why does `list2 = list1.copy()` behave differently from `list2 = list1`?
9. What is a namespace in Python, and how does it relate to variables?

### Scenario-Based Questions
10. You load a dataset into `df`, then accidentally run `df = df.dropna()` and now need the original rows with missing values. How would you have prevented this?
11. In a loop processing 1 million rows, you notice memory usage keeps growing. Could variable usage be a factor? How would you investigate?

### Coding Exercises
```python
# Exercise 1: Swap two variables without a temporary variable
a = 5
b = 10
# your code here

# Exercise 2: Create a DataFrame variable, then create a filtered copy 
# that does NOT affect the original when modified.

# Exercise 3: Write code that demonstrates a NameError and then fix it.
```

### Interview Q&A
**Q: In Python, are variables containers that store values directly?**
A: No. Python variables are **names bound to objects** in memory. The variable doesn't "contain" the value directly — it references an object, which is why behaviors like shared mutation occur with mutable types like lists.

**Q: What's the risk of writing `df = df.dropna()`?**
A: It permanently discards the original DataFrame reference (assuming no other variable holds it), making the original data with missing values unrecoverable unless it was saved elsewhere or reloaded from source.

**Q: How do you check if two variables reference the same object?**
A: Use the `id()` function or the `is` operator: `a is b` returns `True` if both point to the same object in memory.

---

## 9. Mini Project / Assignment

**Task: "Employee Record Tracker"**

Create variables to store the following employee details, then print a formatted summary:
- Employee name, ID, department, monthly salary, years of experience
- Calculate and store `annual_salary` using the monthly salary variable
- Create a copy of a list of the employee's last 3 project names such that modifying the copy does **not** affect the original list
- Demonstrate (with `id()`) that your copy is a different object from the original

**Deliverable:** A single `.py` script with clear, professional variable names and comments explaining each step.

---

## 10. Quick Revision

### Key Points
- A variable is a **name bound to an object**, not a container holding a value directly.
- Python is **dynamically typed** — no need to declare types; types can change on reassignment.
- Assignment (`=`) creates or updates a binding; it does not always copy the data (especially for mutable objects).
- Variable names must start with a letter/underscore, contain only letters/digits/underscores, and are case-sensitive.

### Important Syntax
```python
x = 10                    # basic assignment
a, b, c = 1, 2, 3          # multiple assignment
x = y = 0                  # same value, multiple variables
a, b = b, a                # swap
x += 5                     # augmented assignment
del x                      # delete a variable
type(x)                    # check type
id(x)                      # check memory reference
```

### Cheat Sheet / Summary Table

| Concept | Rule/Behavior |
|---|---|
| Naming | Letters, digits, underscore only; can't start with digit |
| Case sensitivity | `Age` ≠ `age` |
| Typing | Dynamic — type inferred at runtime |
| Reassignment | Allowed to any type |
| Mutable objects (list, dict) | Assignment shares reference — changes reflect both variables |
| Immutable objects (int, str, tuple) | Reassignment creates a new object, no shared mutation risk |
| Constants | Convention only — `UPPERCASE`, not enforced by Python |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use descriptive, snake_case names | Use vague names like `x`, `data`, `temp1` |
| Use `.copy()` for independent copies of mutable data | Assume `b = a` creates a copy |
| Use UPPERCASE for constants | Rely on Python to enforce constants (it won't) |
| Check `type()`/`id()` when debugging | Overwrite your raw dataset variable without backup |

---

## 11. Further Reading

- [Python Official Docs — Data Model (Objects, Values, Types)](https://docs.python.org/3/reference/datamodel.html)
- [Python Official Tutorial — Introduction to Variables](https://docs.python.org/3/tutorial/introduction.html)
- [PEP 8 — Style Guide for Python Code (Naming Conventions)](https://peps.python.org/pep-0008/)
