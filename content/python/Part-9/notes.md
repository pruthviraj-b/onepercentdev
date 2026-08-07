# Module 1 — Python Foundations for Data Analysis
## Topic 9: Type Checking

---

## 0. Prerequisites

- Topic 1: **Variables**
- Topics 3–7: **int, float, bool, str, None**
- Topic 8: **Dynamic Typing** (essential — type checking exists precisely because Python doesn't enforce types automatically)

---

## 1. Concept Overview

**Simple Definition**
**Type checking** is the process of verifying what data type a value actually is — either while the program is running (**runtime type checking**, using `type()`/`isinstance()`) or before running, using external tools that analyze **type hints** (**static type checking**, e.g., `mypy`).

**Why This Topic Exists**
Because Python is dynamically typed (Topic 8), a variable can hold any type, and nothing stops the "wrong" type from being passed into a function or stored in a data structure. Type checking exists to **catch these mismatches deliberately** — either defensively at runtime, or proactively before the code even runs.

**Why It Is Important**
- Real-world data is messy — a column expected to be numeric may secretly contain strings, `None`, or mixed types. Type checking is the first line of defense.
- Prevents entire categories of bugs (`TypeError`, `AttributeError`) from reaching production or corrupting an analysis.
- A core skill tested in interviews: "How would you validate that this function receives the right type of input?"

**Learning Objectives**
By the end of this topic, you will be able to:
1. Use `type()` and `isinstance()` correctly, and know when to prefer one over the other.
2. Understand the difference between runtime type checking and static type checking (type hints + `mypy`).
3. Write defensive functions that validate input types and raise clear errors.
4. Apply type checking to detect and clean mixed-type columns in real pandas datasets.
5. Avoid common type-checking anti-patterns (over-checking, brittle exact-type checks).

**Where It Is Used in Real Projects**
- Validating function inputs in shared/reusable data analysis utilities
- Detecting and cleaning mixed-type columns after loading real-world CSV/Excel files
- Writing defensive ETL code that fails fast with clear errors instead of silently producing wrong results
- Adding type hints + `mypy` checks in production-grade data pipelines/codebases

---

## 2. In-Depth Explanation

### 2.1 Core Concept: Two Kinds of Type Checking

| | Runtime Type Checking | Static Type Checking |
|---|---|---|
| **When it happens** | While the program is running | Before running, via a separate tool |
| **Tools** | `type()`, `isinstance()` | Type hints + `mypy`, `pyright` |
| **Enforced by Python itself?** | Yes (you write the check, and Python executes it) | No — Python ignores hints at runtime |
| **Best for** | Validating messy real-world data, defensive coding | Catching type bugs early in development, large codebases |

### 2.2 Internal Working: `type()` vs `isinstance()`

```python
class Animal:
    pass

class Dog(Animal):
    pass

d = Dog()

print(type(d) == Dog)          # True
print(type(d) == Animal)       # False — exact type only, ignores inheritance
print(isinstance(d, Dog))      # True
print(isinstance(d, Animal))   # True — isinstance() understands inheritance!
```

**Why this matters:** `type(x) == SomeType` checks for an **exact** type match only. `isinstance(x, SomeType)` also returns `True` for any **subclass** of `SomeType`. Since `bool` is a subclass of `int` (Topic 5), and custom classes often inherit from base classes, `isinstance()` is almost always the safer, more Pythonic choice.

```python
print(isinstance(True, int))      # True — bool IS a subtype of int
print(type(True) == int)          # False — exact type is bool, not int
```

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Runtime Type Checking** | Verifying a value's type while the program executes, using `type()`/`isinstance()` |
| **Static Type Checking** | Verifying type correctness before execution, using type hints and external tools |
| **Type Hint / Annotation** | Optional syntax (`x: int`) documenting expected types, not enforced by Python itself |
| **`mypy`** | A popular static type checker that analyzes Python code against its type hints |
| **Duck Typing** | Judging an object by what it *can do*, not its declared type (related, sometimes an alternative to strict type checking) |
| **`EAFP`** | "Easier to Ask Forgiveness than Permission" — a Python idiom preferring `try/except` over upfront type checks in some cases |
| **`LBYL`** | "Look Before You Leap" — the alternative idiom of checking conditions (including types) before acting |
| **Abstract Base Class (ABC)** | A class used to define a common interface; `isinstance()` checks against ABCs allow flexible type checking (e.g., checking for "any list-like" object) |

### 2.4 Key Rules & Behavior

**Rule 1 — Prefer `isinstance()` over `type() ==` for most checks:**
```python
def process(value):
    if isinstance(value, (int, float)):    # handles bool subclass, custom numeric subclasses, etc.
        return value * 2
    raise TypeError("Expected a number")
```

**Rule 2 — `isinstance()` accepts a tuple to check multiple types at once:**
```python
if isinstance(x, (int, float, complex)):
    print("x is numeric")
```

**Rule 3 — Type hints require no runtime check by default — they need a separate tool (`mypy`) or manual validation:**
```python
def add(a: int, b: int) -> int:
    return a + b

add("2", "3")   # runs fine at runtime! Only mypy (run separately) would flag this as wrong.
```

**Rule 4 — EAFP vs LBYL: two valid Python styles for handling type uncertainty:**
```python
# LBYL (Look Before You Leap) — check type first
if isinstance(value, str):
    result = int(value)
else:
    result = None

# EAFP (Easier to Ask Forgiveness than Permission) — try, handle failure
try:
    result = int(value)
except (TypeError, ValueError):
    result = None
```
Python culture generally favors **EAFP** for many cases (it's often faster and more readable), but **LBYL with `isinstance()`** is still the right choice when you need to branch logic based on type *before* attempting an operation (as in the pandas cleaning examples below).

**Rule 5 — Checking for `None` should use `is`, not `isinstance()`, since `None` is a singleton value, not really a "type category" you branch on:**
```python
if value is None:      # preferred
    ...
if isinstance(value, type(None)):   # works, but unusual and less readable
    ...
```

### 2.5 Why It Works This Way

Type checking exists as an **opt-in safety net** rather than a mandatory language feature, staying true to Python's philosophy of flexibility. This means the responsibility for correctness shifts to the developer — Python trusts you to add type checks exactly where they matter (public APIs, data ingestion boundaries) without forcing overhead everywhere, unlike statically typed languages where every single variable is checked automatically.

---

## 3. Syntax & Usage

### 3.1 Core Runtime Type-Checking Tools

| Tool | Purpose | Example | Result |
|---|---|---|---|
| `type(x)` | Returns exact type | `type(5)` | `<class 'int'>` |
| `type(x) == T` | Exact type match (no subclasses) | `type(True) == int` | `False` |
| `isinstance(x, T)` | Type match including subclasses | `isinstance(True, int)` | `True` |
| `isinstance(x, (T1, T2))` | Match against multiple types | `isinstance(5, (int, float))` | `True` |
| `callable(x)` | Checks if `x` can be called like a function | `callable(print)` | `True` |
| `hasattr(x, 'attr')` | Checks if an object has a given attribute/method (duck-typing style) | `hasattr("hi", "upper")` | `True` |

### 3.2 Static Type Checking Setup (Type Hints + mypy)

```python
def calculate_discount(price: float, percent: float) -> float:
    return price - (price * percent / 100)

# Run separately in terminal (not part of normal execution):
# $ pip install mypy
# $ mypy your_script.py
```
- `mypy` analyzes the script's type hints and reports mismatches **without running the code** — useful in CI/CD pipelines for data engineering teams.

### 3.3 Defensive Validation Pattern

```python
def safe_average(numbers):
    if not isinstance(numbers, (list, tuple)):
        raise TypeError(f"Expected list or tuple, got {type(numbers).__name__}")
    
    numeric_values = [n for n in numbers if isinstance(n, (int, float))]
    
    if not numeric_values:
        raise ValueError("No numeric values found")
    
    return sum(numeric_values) / len(numeric_values)
```

---

## 4. Practical Examples

### 4.1 Basic Example
```python
value = 42

print(type(value))
print(type(value) == int)
print(isinstance(value, int))
print(isinstance(value, (int, float)))
```
**Line-by-line explanation:**
- `type(value)` → returns the exact class, `<class 'int'>`.
- `type(value) == int` → exact match, `True`.
- `isinstance(value, int)` → also `True`, but more flexible (handles subclasses).
- `isinstance(value, (int, float))` → checks against multiple types in one call.

**Expected Output:**
```
<class 'int'>
True
True
True
```
**Why:** All checks agree here since `42` is a plain `int` — the difference between `type() ==` and `isinstance()` only becomes visible with subclasses (see next example).

---

### 4.2 Intermediate Example — Why `isinstance()` Beats `type() ==`
```python
flag = True

print(type(flag) == int)          # False — exact type is bool
print(isinstance(flag, int))      # True  — bool IS a subclass of int
print(isinstance(flag, bool))     # True  — also matches directly
```
**Line-by-line explanation:**
- `type(flag) == int` → `False`, because the exact type of `flag` is `bool`, not `int`.
- `isinstance(flag, int)` → `True`, because `bool` is a subclass of `int` — `isinstance()` walks up the inheritance chain.

**Expected Output:**
```
False
True
True
```
**Why:** This is a classic interview trap — using `type() ==` for numeric checks can incorrectly exclude booleans, while `isinstance()` handles the class hierarchy correctly (which matters if, say, you want to treat `True`/`False` as valid numeric inputs, or conversely, deliberately exclude them).

---

### 4.3 Advanced Example — EAFP vs LBYL in Practice
```python
def to_int_lbyl(value):
    # LBYL: check type/validity before acting
    if isinstance(value, str) and value.strip().lstrip('-').isdigit():
        return int(value)
    return None

def to_int_eafp(value):
    # EAFP: try the operation, handle failure
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

test_values = ["42", "abc", 3.9, None, "-7"]

print([to_int_lbyl(v) for v in test_values])
print([to_int_eafp(v) for v in test_values])
```
**Line-by-line explanation:**
- `to_int_lbyl` → explicitly checks the type and validity of the string before converting — more verbose but avoids relying on exceptions for control flow.
- `to_int_eafp` → simply attempts the conversion and catches failure — more concise, and handles more input types generically (e.g., floats) without extra logic.

**Expected Output:**
```
[42, None, None, None, -7]
[42, None, 3, None, -7]
```
**Why:** Notice the difference on `3.9` — the LBYL version rejects it (since it only explicitly handles strings), while the EAFP version successfully converts it via `int(3.9)` → `3`. This illustrates that **type-checking strategy affects behavior**, not just style — choose deliberately based on what inputs you intend to support.

---

### 4.4 Real-World Project Example — Detecting Mixed Types in a pandas Column
```python
import pandas as pd

data = {'quantity': [5, "10", 3.5, None, "twelve"]}
df = pd.DataFrame(data)

type_report = df['quantity'].apply(lambda x: type(x).__name__).value_counts()
print(type_report)

def safe_to_numeric(value):
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, str) and value.strip().isdigit():
        return int(value)
    return None

df['quantity_clean'] = df['quantity'].apply(safe_to_numeric)
print(df)
```
**Line-by-line explanation:**
- `.apply(lambda x: type(x).__name__)` → reveals the actual Python type of every individual value in the column — essential for diagnosing a suspicious `dtype: object` column.
- `.value_counts()` → summarizes how many of each type are present.
- `safe_to_numeric()` → uses `isinstance()` checks to safely convert valid entries and mark unconvertible ones as `None`.

**Expected Output (example):**
```
int        1
str        2
float      1
NoneType   1
Name: quantity, dtype: int64

  quantity  quantity_clean
0        5             5.0
1       10             10.0
2      3.5              3.5
3     None             NaN
4   twelve             NaN
```
**Why:** This is the standard professional workflow for diagnosing and fixing a real "object" column that secretly contains multiple types — a very common first step in cleaning messy data before analysis.

---

## 5. Real-World Applications

| Domain | How Type Checking Is Used |
|---|---|
| **Data Analysis** | Diagnosing mixed-type ("object") columns before cleaning |
| **Data Science** | Validating function inputs across a shared analysis codebase |
| **Machine Learning** | Validating feature types before feeding data into a model (e.g., ensuring no strings in a numeric feature matrix) |
| **Business Analytics** | Defensive checks in report-generation functions used by non-technical stakeholders |
| **Finance** | Validating transaction data types before running financial calculations |
| **Healthcare** | Validating patient data fields conform to expected types before analysis (critical given the stakes of errors) |
| **Marketing** | Validating campaign data from multiple ad platforms with inconsistent formats |
| **AI** | Validating tensor/array shapes and types before passing into models |
| **Automation** | Validating configuration file values before running automated scripts |
| **Dashboards** | Validating filter/parameter inputs from UI components before querying data |
| **ETL Pipelines** | Type validation at every ingestion boundary to fail fast on bad source data |

**How Big Tech Uses This Concept**
- **Google**: Uses `mypy`-style static type checking extensively in large internal Python codebases to catch bugs before deployment.
- **Amazon**: Data validation layers in ingestion pipelines type-check incoming seller/product data before it enters core systems.
- **Netflix**: Uses type hints and validation libraries (e.g., Pydantic) extensively in data engineering services to enforce schema correctness.
- **Uber**: Real-time data pipelines validate incoming event types before processing, given the high volume and diversity of data sources.
- **Spotify**: Backend services use type checking to validate metadata from many different content partners before it enters recommendation systems.
- **Microsoft**: Python-based Azure tooling uses type hints extensively, paired with static analysis in CI/CD pipelines, to maintain code quality at scale.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Prefer `isinstance()` over `type() ==` for almost all type checks — it correctly handles inheritance.
- Add type hints to public functions for documentation, even if you don't run `mypy` yet — it helps other developers and IDEs.
- Validate types explicitly at "boundaries" — where external data enters your system (file reads, API responses, user input) — rather than everywhere internally.
- Use `isinstance(x, (int, float))` (a tuple) rather than writing two separate `if` checks.

### Performance Tips
- Avoid excessive `isinstance()` checks inside performance-critical, tightly-looped code — validate once at the boundary rather than repeatedly inside a hot loop.
- For large-scale data validation, use vectorized pandas methods (`pd.to_numeric(errors='coerce')`) instead of manual per-row `isinstance()` checks where possible.

### Clean Code Recommendations
```python
# Bad — checks type but with a fragile exact match
if type(value) == int:
    ...

# Good — flexible, handles subclasses (e.g., bool)
if isinstance(value, int):
    ...

# Even better when multiple types are valid
if isinstance(value, (int, float)):
    ...
```

### Common Beginner Mistakes
1. Using `type(x) == SomeType` instead of `isinstance(x, SomeType)`, missing valid subclass cases.
2. Assuming type hints (`def f(x: int)`) will stop the wrong type from being passed — they don't, without a separate tool like `mypy`.
3. Over-checking types everywhere in the code, adding unnecessary verbosity and performance overhead instead of validating once at the data boundary.
4. Forgetting that `bool` is a subclass of `int`, causing unexpected results in numeric type checks (`isinstance(True, int)` is `True`).

### Common Interview Mistakes
- Not knowing the difference between `type() ==` and `isinstance()`, and when each is appropriate.
- Not being able to explain EAFP vs LBYL, or when to prefer one over the other.
- Claiming type hints "enforce" types — a common and important misconception to correct.

### Debugging Tips
- Use `df['col'].apply(type).value_counts()` as the go-to diagnostic for suspicious `dtype: object` columns in pandas.
- When a function fails unexpectedly, add a quick `print(type(x))` right before the failing line to confirm assumptions about incoming data.
- Use `pd.to_numeric(series, errors='coerce')` as a fast, vectorized alternative to manual type-checking loops when cleaning numeric columns at scale.

### Things to Avoid
- Avoid relying on type hints alone for runtime safety — pair them with actual validation or a static checker like `mypy` in CI/CD.
- Avoid using `type() ==` for checks involving numeric types, given the `bool`/`int` subclass relationship.
- Avoid scattering type checks everywhere without a clear boundary strategy — this adds noise without meaningfully improving safety.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `isinstance(True, int)` unexpectedly returns `True` in a numeric-only check | Not accounting for `bool` being a subclass of `int` | Explicitly exclude booleans if needed: `isinstance(x, int) and not isinstance(x, bool)` |
| Type hint mismatch not caught at runtime | Type hints aren't enforced by the Python interpreter | Run `mypy` separately, or add explicit `isinstance()` validation inside the function |
| `TypeError` deep inside a pipeline instead of at the point of bad input | No validation at the data entry boundary | Add `isinstance()` checks (or `pd.to_numeric(errors='coerce')`) immediately after loading external data |
| `AttributeError` when duck-typing assumption fails | Assumed an object had a method/attribute without checking | Use `hasattr(obj, 'method_name')` before calling, or wrap in `try/except AttributeError` |
| Overly strict `type() ==` check rejects valid subclass input | Exact type match used where flexible matching was intended | Switch to `isinstance()` |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What is the difference between `type(x)` and `isinstance(x, T)`?
2. Why might `type(x) == int` give a different result than `isinstance(x, int)` for a boolean value?
3. Do type hints prevent the wrong type from being passed into a function at runtime?

### Intermediate Questions
4. What is EAFP, and how does it differ from LBYL? Give an example of each.
5. Write an `isinstance()` check that accepts both `int` and `float` in one line.
6. Why is `isinstance()` generally preferred over `type() ==` for type validation?

### Advanced Questions
7. How would you set up static type checking with `mypy` for a small Python script, and what does it actually check?
8. Explain how you would diagnose and fix a pandas column showing `dtype: object` when it "should" be numeric.
9. When would EAFP be a better choice than LBYL for type-related validation, and vice versa?

### Scenario-Based Questions
10. A shared utility function in your team's codebase is crashing intermittently in production due to unexpected input types. How would you add defensive type checking without over-engineering the function?
11. You suspect a "numeric" column loaded from a CSV actually contains hidden string values. Walk through how you'd confirm this and fix it.

### Coding Exercises
```python
# Exercise 1: Write a function that validates its single argument is either 
# int or float (excluding bool) and raises a clear TypeError otherwise.

# Exercise 2: Given a pandas Series with mixed types, write code to report 
# the count of each Python type present.

# Exercise 3: Implement the same "safe string-to-int" logic twice — once 
# using LBYL (isinstance + validation) and once using EAFP (try/except) — 
# and compare their behavior on a list of varied test inputs.
```

### Interview Q&A
**Q: When should you use `isinstance()` instead of `type() ==`?**
A: Almost always prefer `isinstance()` — it correctly accounts for inheritance, so subclasses of the expected type are still recognized as valid (e.g., `isinstance(True, int)` is `True` since `bool` is a subclass of `int`). `type() ==` only matches the exact class, which can incorrectly reject valid subclass instances.

**Q: Do Python type hints get checked when the code runs?**
A: No. Type hints (e.g., `def f(x: int) -> int:`) are purely for documentation and are used by external static analysis tools like `mypy` or IDEs for warnings — the Python interpreter itself does not validate or enforce them during execution. If runtime enforcement is needed, you must add explicit `isinstance()` checks or use a validation library.

**Q: What is EAFP, and when would you use it over explicit type checking?**
A: EAFP ("Easier to Ask Forgiveness than Permission") means attempting an operation directly and handling any resulting exception, rather than checking conditions upfront. It's often preferred in Python for concise code and can naturally handle more input variety (e.g., `int(value)` inside a `try` will happily convert floats, clean numeric strings, etc., without needing to separately check for each case) — but explicit `isinstance()` checks (LBYL) are better when you need to branch logic clearly based on type *before* deciding what operation to even attempt.

---

## 9. Mini Project / Assignment

**Task: "Data Validation Layer"**

1. Create a list simulating a messy real-world "age" column: valid ints, valid numeric strings, floats, `None`, booleans, and invalid strings.
2. Write a function `validate_age(value)` that:
   - Uses `isinstance()` to correctly identify valid numeric types (explicitly excluding `bool`, since `True`/`False` shouldn't count as valid ages)
   - Converts valid numeric strings to `int`
   - Returns `None` for anything invalid
3. Apply this across the whole list and print a before/after comparison.
4. Bonus: Add type hints to your function, then explain in a comment what running `mypy` on it would (and wouldn't) verify.
5. Bonus: Rewrite the core conversion logic using EAFP (`try/except`) instead of `isinstance()`, and compare the results on the same test list.

**Deliverable:** A `.py` script with comments explaining each type-checking decision.

---

## 10. Quick Revision

### Key Points
- **Runtime type checking** uses `type()`/`isinstance()`; **static type checking** uses type hints + external tools like `mypy`.
- Prefer `isinstance()` over `type() ==` — it correctly handles subclasses (e.g., `bool` as a subclass of `int`).
- Type hints are **not enforced** by Python at runtime — they require a separate static checker or manual validation to have real effect.
- **EAFP** (try/except) and **LBYL** (check-then-act) are two valid Python styles for handling type uncertainty — choose based on context.
- Validate types at **data entry boundaries** (file loads, API responses) rather than scattering checks everywhere.

### Important Syntax
```python
type(x)                          # exact type
type(x) == SomeType               # exact match (no subclasses)
isinstance(x, SomeType)           # match including subclasses
isinstance(x, (T1, T2))           # match against multiple types
hasattr(x, 'method_name')         # duck-typing style check
def f(x: int) -> int: ...          # type hint (not enforced)
df['col'].apply(type).value_counts()   # diagnose mixed types in pandas
```

### Cheat Sheet / Summary Table

| Check | Handles Subclasses? | Enforced by Python at Runtime? |
|---|---|---|
| `type(x) == T` | No | Yes (you wrote the check) |
| `isinstance(x, T)` | Yes | Yes (you wrote the check) |
| Type hints (`x: int`) | N/A | No — documentation only |
| `mypy` static check | N/A | No — separate tool, run before execution |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `isinstance()` for type checks | Use `type() ==` for numeric/general type checks |
| Add type hints for documentation | Assume type hints prevent wrong types at runtime |
| Validate at data entry boundaries | Scatter redundant type checks throughout internal code |
| Explicitly exclude `bool` when checking for "true" numeric types, if relevant | Forget that `bool` is a subclass of `int` |

---

## 11. Further Reading

- [Python Official Docs — `isinstance()` Built-in Function](https://docs.python.org/3/library/functions.html#isinstance)
- [Python Official Docs — `typing` module](https://docs.python.org/3/library/typing.html)
- [mypy Documentation](https://mypy.readthedocs.io/)
- [Python Glossary — EAFP](https://docs.python.org/3/glossary.html#term-eafp)
