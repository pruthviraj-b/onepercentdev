# Module 1 — Python Foundations for Data Analysis
## Topic 7: `None` (NoneType)

---

## 0. Prerequisites

- Topic 1: **Variables**
- Topic 5: **bool** (truthy/falsy behavior, `is` vs `==`)
- Topic 2: **Memory Concepts** (object identity, singleton objects)

---

## 1. Concept Overview

**Simple Definition**
`None` is Python's built-in special value used to represent **the absence of a value** — "nothing," "no result," or "not yet set." It is the sole instance of the type `NoneType`.

**Why This Topic Exists**
Programs frequently need a way to represent "I don't have a value here" — a variable not yet assigned a real value, a function that intentionally returns nothing, or a missing entry in a dataset. Python needs a single, unambiguous placeholder for this concept, distinct from `0`, `False`, or an empty string, all of which represent *something*, not *nothing*.

**Why It Is Important**
- `None` is used **everywhere** in real Python code — default function arguments, missing/optional values, function return values, and as a signal in data cleaning pipelines.
- Many real-world bugs (`AttributeError: 'NoneType' object has no attribute ...`) stem from **not properly checking for `None`** before using a value.
- Understanding `None` correctly is essential to understanding **missing data (`NaN`) handling in pandas**, which is one of the most common tasks in data analysis.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Understand what `None` represents and how it differs from `0`, `False`, and `""`.
2. Correctly check for `None` using `is`/`is not` (not `==`).
3. Understand why `None` is a singleton object in Python.
4. Use `None` correctly as a default function argument and understand the "mutable default argument" pitfall.
5. Relate `None` to how pandas represents missing data (`NaN`, `NaT`, `None`).

**Where It Is Used in Real Projects**
- Representing missing/optional values before or during data cleaning
- Default parameter values in functions (`def foo(x=None):`)
- Function return values when no meaningful result exists
- Placeholder initial values for variables that will be set later
- Checking for missing configuration values before running a pipeline step

---

## 2. In-Depth Explanation

### 2.1 Core Concept: What Is `None`?

`None` is a **singleton** — meaning there is only ever **one** `None` object in an entire running Python program. Every time you write `None` in your code, you're referring to that same single object.

```python
result = None
config = None

print(result is config)   # True — both point to the exact same None object
print(type(None))         # <class 'NoneType'>
```

### 2.2 Internal Working: Why `None` Is a Singleton

Python creates the `None` object once, when the interpreter starts, and reuses it everywhere `None` is referenced. This is why comparing to `None` should always use `is`, not `==` — since there's only one `None` object in existence, identity comparison (`is`) is both correct and faster than value comparison (`==`), and it avoids issues where a custom class might override `__eq__` in a way that behaves unexpectedly with `==` comparisons to `None`.

```python
value = None

# Correct
if value is None:
    print("No value set")

# Also works, but not idiomatic / can be unreliable for custom objects
if value == None:
    print("No value set")
```

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **`None`** | The single instance representing "no value" in Python |
| **`NoneType`** | The type/class of the `None` object |
| **Singleton** | A design pattern ensuring only one instance of an object exists |
| **`is` / `is not`** | Identity comparison operators — the correct way to test for `None` |
| **Null-like value** | A general programming term for a value representing "nothing" (Python's equivalent is `None`; other languages use `null`, `nil`, `undefined`) |
| **Mutable Default Argument Trap** | A common Python bug caused by using a mutable object (like `[]`) instead of `None` as a default function argument |
| **`NaN`** | pandas/NumPy's special float value used for missing *numeric* data (different from `None`, though related conceptually) |
| **`NaT`** | pandas' special value for missing *datetime* data |

### 2.4 Key Rules & Behavior

**Rule 1 — `None` is falsy in boolean contexts:**
```python
value = None
if not value:
    print("value is falsy")   # this prints
```

**Rule 2 — `None` is NOT the same as `0`, `False`, or `""`, even though all are falsy:**
```python
print(None == 0)        # False
print(None == False)    # False
print(None == "")       # False
print(bool(None))       # False — falsy, but a distinct, separate value
```

**Rule 3 — Functions that don't explicitly `return` a value return `None` automatically:**
```python
def greet(name):
    print(f"Hello, {name}")
    # no return statement

result = greet("Pruthvi")   # prints "Hello, Pruthvi"
print(result)                # None
```

**Rule 4 — Never use a mutable object as a default function argument; use `None` instead:**
```python
# WRONG — dangerous mutable default
def add_item(item, my_list=[]):
    my_list.append(item)
    return my_list

print(add_item("a"))   # ['a']
print(add_item("b"))   # ['a', 'b']  <-- BUG! Same list reused across calls!

# CORRECT — use None and create the list inside the function
def add_item_safe(item, my_list=None):
    if my_list is None:
        my_list = []
    my_list.append(item)
    return my_list

print(add_item_safe("a"))   # ['a']
print(add_item_safe("b"))   # ['b']  — correct, independent list each time
```

### 2.5 Why It Works This Way

Python designed `None` as a distinct, singleton value to eliminate ambiguity: a value of `0` might genuinely mean "zero," while `None` unambiguously signals "no value was provided/computed at all." Keeping it as a single global object (rather than creating a new "empty" object each time) makes identity comparison (`is None`) both fast (O(1), just a memory address check) and completely unambiguous.

---

## 3. Syntax & Usage

### 3.1 Using `None`

```python
result = None                  # assigning "no value yet"

def find_user(user_id):
    # ... search logic ...
    return None                # explicit "not found" signal

def process():
    pass                       # returns None implicitly

x = process()
print(x)                        # None
```

### 3.2 Checking for `None`

| Syntax | Purpose | Recommended? |
|---|---|---|
| `if x is None:` | Correct identity check | ✅ Yes |
| `if x is not None:` | Correct negative identity check | ✅ Yes |
| `if x == None:` | Works, but not idiomatic | ⚠️ Avoid |
| `if not x:` | Checks falsiness (matches `None`, but ALSO `0`, `""`, `[]`, etc.) | ⚠️ Only if that broader check is truly intended |

### 3.3 `None` in Function Defaults

```python
def connect(timeout=None):
    if timeout is None:
        timeout = 30       # apply a sensible default inside the function
    print(f"Connecting with timeout={timeout}")
```

### 3.4 `None` vs Related "Missing Value" Representations

| Value | Used For | Library |
|---|---|---|
| `None` | General "no value" in plain Python | Core Python |
| `NaN` (`float('nan')`, `np.nan`) | Missing **numeric** data | NumPy / pandas |
| `NaT` | Missing **datetime** data | pandas |
| `pd.NA` | Newer, unified missing value marker (works across dtypes) | pandas (1.0+) |

---

## 4. Practical Examples

### 4.1 Basic Example
```python
user_email = None

if user_email is None:
    print("No email provided.")
else:
    print(f"Email: {user_email}")
```
**Line-by-line explanation:**
- `user_email = None` → explicitly signals "not yet set."
- `if user_email is None:` → the correct, idiomatic identity check.

**Expected Output:**
```
No email provided.
```
**Why:** Using `is None` (rather than `== None` or just `if not user_email`) makes the intent explicit and avoids any ambiguity with other falsy values.

---

### 4.2 Intermediate Example — Function Returning `None` Implicitly
```python
def calculate_discount(price, is_member):
    if is_member:
        return price * 0.9
    # no return for non-members — implicitly returns None

result1 = calculate_discount(100, True)
result2 = calculate_discount(100, False)

print(result1)
print(result2)

if result2 is None:
    print("No discount applied — using full price.")
```
**Line-by-line explanation:**
- When `is_member` is `True`, the function explicitly returns a discounted price.
- When `is_member` is `False`, there's no `return` statement, so Python implicitly returns `None`.
- Checking `result2 is None` catches this case safely to apply fallback logic.

**Expected Output:**
```
90.0
None
No discount applied — using full price.
```
**Why:** This is a very common real bug source — forgetting that a function without an explicit `return` in some branch silently returns `None`, which can cause downstream errors if not checked.

---

### 4.3 Advanced Example — The Mutable Default Argument Trap
```python
def add_record(record, records=None):
    if records is None:
        records = []
    records.append(record)
    return records

batch1 = add_record("Order1")
batch2 = add_record("Order2")

print(batch1)
print(batch2)
print(batch1 is batch2)
```
**Line-by-line explanation:**
- `records=None` → the safe default; a **new** list is created inside the function each time `records` is `None`.
- Each call to `add_record` without passing `records` gets its own independent list.
- `batch1 is batch2` → `False`, confirming they are separate list objects.

**Expected Output:**
```
['Order1']
['Order2']
False
```
**Why:** If `records=[]` had been used directly as the default (instead of `None`), Python creates that default list **once**, when the function is defined — and **reuses the same list object across every call** that doesn't pass its own list, silently accumulating unrelated data. Using `None` and creating the list inside the function avoids this classic bug.

---

### 4.4 Real-World Project Example — Handling Missing Data with `None` and `NaN`
```python
import pandas as pd
import numpy as np

data = {
    'customer_id': [1, 2, 3, 4],
    'email': ['a@x.com', None, 'c@x.com', None],
    'age': [25, np.nan, 30, 22]
}

df = pd.DataFrame(data)

print(df)
print(df['email'].isna())

df['email'] = df['email'].fillna("unknown@example.com")
print(df)
```
**Line-by-line explanation:**
- `None` values in the `email` list are automatically converted by pandas into missing-value markers when the DataFrame is constructed.
- `df['email'].isna()` → returns a boolean mask identifying missing entries (`True` where the value is missing).
- `.fillna(...)` → replaces missing values with a specified placeholder — a very common data cleaning step.

**Expected Output (example):**
```
   customer_id    email   age
0            1  a@x.com  25.0
1            2     None   NaN
2            3  c@x.com  30.0
3            4     None  22.0

0    False
1     True
2    False
3     True
Name: email, dtype: bool

   customer_id                 email   age
0            1               a@x.com  25.0
1            2  unknown@example.com   NaN
2            3               c@x.com  30.0
3            4  unknown@example.com  22.0
```
**Why:** This shows the direct real-world link between plain Python's `None` and pandas' missing-data ecosystem — `None` in Python often becomes `NaN` (for numeric columns) or stays as a missing marker in object columns, and `.isna()`/`.fillna()` are the standard tools for handling it.

---

## 5. Real-World Applications

| Domain | How `None` Is Used |
|---|---|
| **Data Analysis** | Representing missing/unset values before cleaning; results of failed lookups |
| **Data Science** | Optional function parameters (e.g., `random_state=None` in scikit-learn) |
| **Machine Learning** | Default hyperparameters (`max_depth=None` means "no limit" in many models) |
| **Business Analytics** | Missing survey responses, unset optional fields in reports |
| **Finance** | Missing transaction details, unset optional account fields |
| **Healthcare** | Missing patient data fields, optional test results not yet recorded |
| **Marketing** | Missing campaign attribution data, unset optional targeting parameters |
| **AI** | Default parameter values in model configuration functions |
| **Automation** | Signaling "no result found" from a search/lookup function |
| **Dashboards** | Displaying "N/A" or blank when the underlying value is `None`/missing |
| **ETL Pipelines** | Detecting and handling missing values during extraction and transformation steps |

**How Big Tech Uses This Concept**
- **Google**: APIs commonly use `None`/`null`-equivalent values to indicate optional fields not provided by the client (e.g., in REST API responses).
- **Amazon**: Product catalog fields (like `discount_price`) often default to `None` when no promotion is active, distinct from a `$0.00` price.
- **Netflix**: User profile fields (like `parental_rating_override`) may be `None` when not explicitly set, falling back to default account-level rules.
- **Uber**: Ride records may have `None` for `dropoff_time` while a ride is still in progress, distinct from `0` which would incorrectly imply a completed timestamp.
- **Spotify**: Song metadata fields (e.g., `explicit_flag`) may be `None` when the record hasn't been classified yet, distinct from `False`.
- **Microsoft**: Excel/Power BI's "blank" cell concept is conceptually similar to `None` — distinct from a `0` or empty string, and handled specially in formulas/aggregations.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Always use `is None` / `is not None` for checking — never `==`.
- Use `None` (not mutable objects like `[]` or `{}`) as default function argument values.
- Explicitly document what `None` means in a function's return value (e.g., "returns `None` if no match is found").
- In pandas, use `.isna()` / `.notna()` to detect missing values, since `None`/`NaN` behave inconsistently with direct `==` comparisons.

### Performance Tips
- `is None` checks are faster than `== None` because identity comparison (checking if it's the same object) is a simple, direct memory check — no need to invoke any custom `__eq__` logic.

### Clean Code Recommendations
```python
# Bad — mutable default argument
def add_to_cache(key, value, cache={}):
    cache[key] = value
    return cache

# Good — safe pattern using None
def add_to_cache_safe(key, value, cache=None):
    if cache is None:
        cache = {}
    cache[key] = value
    return cache
```

### Common Beginner Mistakes
1. Using `== None` instead of `is None`.
2. Forgetting that a function without an explicit `return` returns `None`, then getting confused by downstream `AttributeError`s.
3. Using a mutable default argument (`def f(x=[])`) instead of `None`, causing shared-state bugs across function calls.
4. Confusing `None` with `0`, `False`, or `""` — treating them as interchangeable when they represent fundamentally different things.

### Common Interview Mistakes
- Not being able to explain why `None` is a singleton and why that makes `is None` the correct comparison.
- Not knowing the mutable default argument trap — a very frequently asked Python interview/code-review question.
- Confusing `None` (Python's core "no value" marker) with `NaN` (a special float used specifically for missing numeric data in pandas/NumPy) — they are related but not identical.

### Debugging Tips
- If you see `AttributeError: 'NoneType' object has no attribute 'X'`, a function/variable you expected to hold a real object actually returned/holds `None` — trace back to where it was set or returned.
- Use `is None` checks defensively right after function calls that might return `None` (e.g., dictionary `.get()`, regex `.match()`, or custom lookup functions).
- When debugging pandas missing-data issues, use `.isna().sum()` to quickly count missing values per column.

### Things to Avoid
- Avoid comparing to `None` with `==`.
- Avoid using mutable objects as default function arguments.
- Avoid assuming `None`, `0`, `False`, and `""` are interchangeable just because they're all "falsy."

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `AttributeError: 'NoneType' object has no attribute 'X'` | Calling a method/attribute on a value that turned out to be `None` | Check `if value is not None:` before using it, or trace back why it wasn't set |
| Function silently returns unexpected `None` | Missing `return` statement in one code path | Add explicit `return` statements for every logical branch |
| Shared/leaking data across function calls | Mutable default argument (e.g., `def f(x=[])`) reused across calls | Use `None` as default, create the mutable object inside the function body |
| `TypeError: unsupported operand type(s)` involving `None` | Trying to perform arithmetic/string operations directly on `None` | Check for `None` and substitute a sensible default value before the operation |
| Pandas `==` comparison with `NaN`/`None` gives unexpected `False` | `NaN != NaN` (like `float('nan')`), and `None == None` behaves differently across contexts in DataFrames | Use `.isna()` / `.notna()` instead of `==` for missing-value checks in pandas |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What does `None` represent in Python?
2. Why should you use `is None` instead of `== None`?
3. What does a function return if it has no explicit `return` statement?

### Intermediate Questions
4. Why is `None` considered a singleton in Python?
5. Is `None == False`? Explain why or why not.
6. How would you safely provide a default value for a parameter that should default to an empty list?

### Advanced Questions
7. Explain the "mutable default argument" bug in detail, with an example.
8. What is the difference between `None`, `NaN`, and `NaT`, and when is each used?
9. Why does `is` work reliably for `None` comparisons but is discouraged for comparing, say, two integers or strings?

### Scenario-Based Questions
10. A function is supposed to return a discount percentage but sometimes silently returns `None`, causing a crash later in your pipeline. How would you debug and fix this defensively?
11. You're merging two DataFrames and results show unexpected `NaN` values in some rows. How does this relate to the concept of `None`, and how would you investigate?

### Coding Exercises
```python
# Exercise 1: Write a function get_user_age(user_dict) that returns the 
# 'age' key if present, or None if missing, using .get() safely.

# Exercise 2: Demonstrate the mutable default argument bug with a function 
# of your own, then fix it using the None pattern.

# Exercise 3: Given a pandas DataFrame with some None/NaN values, count 
# missing values per column and fill them with an appropriate default.
```

### Interview Q&A
**Q: Why is `None` a singleton, and why does that matter?**
A: Python creates exactly one `None` object when the interpreter starts, and every reference to `None` in your code points to that same object. This means checking `x is None` is a fast, unambiguous identity check — there's no risk of a "different" `None` object causing confusion, unlike value-based (`==`) comparisons which could theoretically be overridden by custom `__eq__` methods on other objects.

**Q: What is the mutable default argument bug, and how do you avoid it?**
A: When a mutable object (like `[]` or `{}`) is used as a default function argument, Python creates that default object **once**, at function definition time — not on every call. All calls that don't explicitly pass their own argument share and mutate that same default object, causing unexpected data to persist/accumulate across unrelated calls. The fix is to use `None` as the default and create a fresh mutable object inside the function body when needed.

**Q: What's the difference between `None` and `NaN`?**
A: `None` is Python's general-purpose "no value" object, usable with any data type. `NaN` (`Not a Number`) is a special **float** value specifically used to represent missing/undefined **numeric** data, primarily in NumPy/pandas contexts. Unlike `None`, `NaN` has the unusual property that `NaN != NaN`, and it requires functions like `math.isnan()` or pandas' `.isna()` to detect properly.

---

## 9. Mini Project / Assignment

**Task: "Safe Config Loader"**

1. Write a function `load_config(user_settings=None)` that:
   - Accepts an optional dictionary of user settings
   - If `user_settings` is `None`, initializes a default configuration dictionary inside the function (not as a default argument!)
   - Merges any provided settings into the defaults, overriding only the keys the user specified
   - Returns the final configuration dictionary
2. Call the function multiple times — once with no arguments, once with partial settings — and prove that each call produces an independent dictionary (no shared-state bug).
3. Bonus: Create a small DataFrame with some `None` values in a text column and some `NaN` values in a numeric column. Use `.isna()` to count missing values per column, then fill each column with an appropriate default value.

**Deliverable:** A `.py` script with comments explaining why `None` (not a mutable default) was used for the config parameter.

---

## 10. Quick Revision

### Key Points
- `None` represents the **absence of a value** — it is the single instance of `NoneType`, created once and reused everywhere.
- Always check for `None` using `is None` / `is not None`, never `==`.
- A function without an explicit `return` statement returns `None` automatically.
- Never use a mutable object (`[]`, `{}`) as a default function argument — use `None` and create the object inside the function.
- `None` is related to, but distinct from, pandas' `NaN` (missing numeric data) and `NaT` (missing datetime data).

### Important Syntax
```python
x = None                    # assign "no value"
if x is None:                # correct check
if x is not None:            # correct negative check
def f(x=None):                # safe default parameter pattern
    if x is None:
        x = []
df['col'].isna()             # detect missing values in pandas
df['col'].fillna(default)    # fill missing values
```

### Cheat Sheet / Summary Table

| Value | Meaning | Falsy? | Same as `None`? |
|---|---|---|---|
| `None` | No value / not set | Yes | — |
| `0` | The number zero | Yes | No |
| `False` | Boolean false | Yes | No |
| `""` | Empty string | Yes | No |
| `NaN` | Missing numeric data (float) | Depends on context | Related, not identical |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `is None` / `is not None` | Use `== None` |
| Use `None` as default, build mutables inside the function | Use `[]`/`{}` as a default function argument |
| Check for `None` before using a possibly-missing value | Assume a function call always returns a "real" value |
| Use `.isna()`/`.fillna()` for pandas missing data | Use `==` to check for `NaN` in pandas/NumPy |

---

## 11. Further Reading

- [Python Official Docs — The `None` Object](https://docs.python.org/3/library/constants.html#None)
- [Python Official Docs — Common Gotchas: Mutable Default Arguments](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects)
- [Pandas Documentation — Working with Missing Data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
