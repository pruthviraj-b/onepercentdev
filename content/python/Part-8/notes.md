# Module 1 — Python Foundations for Data Analysis
## Topic 8: Dynamic Typing

---

## 0. Prerequisites

- Topic 1: **Variables**
- Topic 2: **Memory Concepts**
- Topics 3–7: **int, float, bool, str, None** (needed to see dynamic typing across types)

---

## 1. Concept Overview

**Simple Definition**
**Dynamic typing** means Python determines a variable's type **automatically, at runtime**, based on the value assigned to it — you never have to declare a type in advance, and a variable can be reassigned to a completely different type at any point.

**Why This Topic Exists**
Different programming languages take different approaches to typing. Some (like C, Java) require you to declare a variable's type upfront and never change it (**static typing**). Python was designed for flexibility and rapid iteration, so it determines types automatically and allows them to change — a deliberate design choice that shapes almost everything about how Python code is written.

**Why It Is Important**
- Dynamic typing is *the* defining characteristic that makes Python fast to write and iterate with — critical for exploratory data analysis, where you're constantly reshaping data.
- It also introduces **risks**: type-related bugs that a compiler would catch in a statically typed language only surface at runtime in Python.
- Understanding this concept deeply is essential for writing **robust, defensive code** and for explaining Python's design tradeoffs in interviews.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Explain what dynamic typing means and how it differs from static typing.
2. Understand how Python determines and tracks a variable's type internally.
3. Recognize the practical risks dynamic typing introduces in real data pipelines.
4. Use type-checking tools (`type()`, `isinstance()`) and optional type hints defensively.
5. Apply dynamic typing correctly and safely in pandas/NumPy-based analysis code.

**Where It Is Used in Real Projects**
- Rapid, exploratory data analysis in Jupyter notebooks (reassigning variables to different types as you explore)
- Functions that must handle multiple input types gracefully (e.g., accepting both `int` and `float` prices)
- Type validation logic in data cleaning pipelines
- Writing flexible utility functions used across a data team's shared codebase

---

## 2. In-Depth Explanation

### 2.1 Core Concept: Dynamic Typing vs Static Typing

| | Static Typing (e.g., Java, C++) | Dynamic Typing (Python) |
|---|---|---|
| Type declared? | Yes, explicitly, before use | No — inferred automatically from the value |
| Type checked | At **compile time** | At **runtime** |
| Can a variable change type? | No (in most cases) | Yes, freely |
| Example | `int x = 5;` (fixed as int forever) | `x = 5` then `x = "five"` (fully legal) |

```python
# Python — dynamic typing
x = 5          # x is currently an int
x = "five"     # now x is a string — completely legal, no error
x = [1, 2, 3]  # now x is a list — also legal
```

```java
// Java — static typing (for contrast, NOT valid Python)
int x = 5;
x = "five";    // COMPILE ERROR — type mismatch
```

### 2.2 Internal Working: How Python Tracks Types

Recall from **Memory Concepts** (Topic 2) that a Python variable is a **name bound to an object**, not a typed memory slot. The **type information lives with the object itself**, not the variable name.

```python
x = 5
print(type(x))     # <class 'int'>  — type belongs to the OBJECT 5

x = "hello"
print(type(x))     # <class 'str'>  — x now points to a completely different object
```

Because the variable is just a label, reassigning it to point to a different object (of a different type) requires no special syntax — Python simply updates the reference. This is precisely *why* dynamic typing is possible: the "type" was never attached to the variable name in the first place.

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Dynamic Typing** | Type is determined automatically at runtime, based on the object a variable currently references |
| **Static Typing** | Type is fixed and checked at compile time (used by languages like Java, C++) |
| **Strong Typing** | Python does NOT implicitly convert incompatible types in operations (e.g., `"5" + 5` raises an error) — this is separate from dynamic vs static |
| **Weak Typing** | Some languages (e.g., JavaScript) silently coerce types in mixed operations — Python does NOT do this |
| **Duck Typing** | "If it walks like a duck and quacks like a duck, treat it as a duck" — Python cares about what an object *can do*, not its declared type |
| **Type Inference** | The process of automatically determining a value's type without explicit declaration |
| **Type Hints** | Optional annotations (Python 3.5+) that document expected types without enforcing them at runtime |

### 2.4 Key Rules & Behavior

**Rule 1 — Python is dynamically typed AND strongly typed (these are two separate concepts):**
```python
# Dynamic: no type declaration needed, and type can change
x = 5
x = "five"    # fine

# Strong: Python does NOT silently convert types in mixed operations
result = "5" + 5   # TypeError: can only concatenate str (not "int") to str
```
This is a key distinction that surprises many learners — "dynamic" and "weak" typing are NOT the same thing. Python is dynamic but strict about not silently mixing incompatible types.

**Rule 2 — A function parameter has no fixed type — it accepts whatever is passed:**
```python
def double(x):
    return x * 2

print(double(5))          # 10       (int)
print(double(5.5))        # 11.0     (float)
print(double("ab"))       # "abab"   (str — '*' repeats strings!)
print(double([1, 2]))     # [1, 2, 1, 2]   (list — '*' repeats lists!)
```
This demonstrates **duck typing** — the function doesn't care what type `x` is, only that `x` supports the `*` operation.

**Rule 3 — Type hints document intent but do NOT enforce types at runtime:**
```python
def add(a: int, b: int) -> int:
    return a + b

print(add(2, 3))         # 5 — works as expected
print(add("2", "3"))     # "23" — ALSO runs! Python does not enforce the hint at runtime
```
Type hints are purely for **documentation and static analysis tools** (like `mypy`) — Python itself ignores them during execution.

**Rule 4 — Reassigning a variable to a new type does not affect the old object (if still referenced elsewhere):**
```python
a = 5
b = a
a = "hello"     # 'a' now points to a new string object; 'b' still points to the original int 5
print(b)         # 5
```

### 2.5 Why It Works This Way

Python's designers prioritized **developer productivity, readability, and flexibility** over the compile-time safety guarantees of static typing. This tradeoff makes Python exceptionally well-suited to **exploratory workflows** like data analysis, where the shape and type of data is often unknown or evolving — but it shifts the burden of catching type errors to **runtime testing, defensive coding, and tools like type hints + linters**, rather than the compiler.

---

## 3. Syntax & Usage

### 3.1 Checking Types at Runtime

| Function | Purpose | Example | Result |
|---|---|---|---|
| `type(x)` | Returns the exact type of `x` | `type(5)` | `<class 'int'>` |
| `isinstance(x, T)` | Checks if `x` is an instance of type `T` (or subclass) | `isinstance(5, int)` | `True` |
| `isinstance(x, (T1, T2))` | Checks against multiple types at once | `isinstance(5, (int, float))` | `True` |

```python
value = 42

if isinstance(value, int):
    print("It's an integer")

if type(value) == int:      # works, but isinstance() is generally preferred
    print("Also an integer")
```

**Why `isinstance()` is generally preferred over `type() ==`:** `isinstance()` correctly handles inheritance (subclasses), while `type() ==` only matches the exact type.

### 3.2 Optional Type Hints (Python 3.5+)

```python
def calculate_total(price: float, quantity: int) -> float:
    return price * quantity

name: str = "Pruthvi"
scores: list[int] = [90, 85, 88]     # Python 3.9+ syntax
```
- Type hints are **not enforced** by the interpreter — they exist purely to improve readability and to enable static type-checking tools (`mypy`, IDE warnings).

### 3.3 Runtime Type Validation Pattern (Defensive Coding)

```python
def safe_divide(a, b):
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("Both arguments must be numeric")
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
```

---

## 4. Practical Examples

### 4.1 Basic Example
```python
value = 10
print(type(value))

value = "ten"
print(type(value))

value = [1, 2, 3]
print(type(value))
```
**Line-by-line explanation:**
- Each reassignment binds `value` to a completely different type of object — int, then str, then list.
- `type()` confirms the type changes each time, with zero errors.

**Expected Output:**
```
<class 'int'>
<class 'str'>
<class 'list'>
```
**Why:** This is dynamic typing in its purest form — the same variable name can reference objects of entirely different types over its lifetime.

---

### 4.2 Intermediate Example — Duck Typing in a Function
```python
def describe(x):
    print(f"Value: {x}, Type: {type(x).__name__}")

items = [42, 3.14, "hello", [1, 2], True, None]

for item in items:
    describe(item)
```
**Line-by-line explanation:**
- `describe()` accepts **any** type — it makes no type declaration or restriction.
- The loop passes six completely different types through the same function, and it works for all of them without modification.

**Expected Output:**
```
Value: 42, Type: int
Value: 3.14, Type: float
Value: hello, Type: str
Value: [1, 2], Type: list
Value: True, Type: bool
Value: None, Type: NoneType
```
**Why:** This demonstrates duck typing — Python functions generally don't care about the exact type of their arguments, only whether the operations performed inside the function are valid for whatever type is passed in.

---

### 4.3 Advanced Example — Strong Typing Still Applies (No Silent Coercion)
```python
def combine(a, b):
    return a + b

print(combine(5, 10))          # 15
print(combine("a", "b"))       # "ab"
print(combine([1], [2]))       # [1, 2]

try:
    print(combine("5", 10))    # raises TypeError
except TypeError as e:
    print(f"Error: {e}")
```
**Line-by-line explanation:**
- `combine()` works generically for ints, strings, and lists because `+` is defined (differently) for all of them — duck typing in action.
- `combine("5", 10)` fails because Python is **strongly typed** — it will not silently convert `"5"` to `5` or `10` to `"10"`; the programmer must do this explicitly.

**Expected Output:**
```
15
ab
[1, 2]
Error: can only concatenate str (not "int") to str
```
**Why:** This example proves that "dynamically typed" does NOT mean "no type rules" — Python still enforces strict rules about which types can interact directly, distinguishing it clearly from weakly typed languages like JavaScript.

---

### 4.4 Real-World Project Example — Defensive Type Handling in a Data Pipeline
```python
import pandas as pd

def clean_price_column(df, column):
    def convert_price(value):
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            cleaned = value.replace("$", "").replace(",", "").strip()
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None

    df[column] = df[column].apply(convert_price)
    return df

data = {'price': [19.99, "$25.50", "1,200", "invalid", None]}
df = pd.DataFrame(data)

df = clean_price_column(df, 'price')
print(df)
```
**Line-by-line explanation:**
- The raw `price` column contains **mixed types** — floats, dollar-formatted strings, comma-formatted strings, invalid text, and `None` — a realistic scenario when ingesting messy real-world data.
- `convert_price()` uses `isinstance()` checks to handle each type appropriately, converting everything to a clean `float` or `None` if conversion fails.
- `.apply()` runs this function across every row in the column.

**Expected Output:**
```
     price
0    19.99
1    25.50
2  1200.00
3      NaN
4      NaN
```
**Why:** This is a realistic, professional pattern for handling dynamically-typed, messy input data — using `isinstance()` checks to safely normalize a column that may contain multiple types, which is extremely common when reading real-world CSV/Excel files.

---

## 5. Real-World Applications

| Domain | How Dynamic Typing Is Used |
|---|---|
| **Data Analysis** | Handling columns with mixed types during cleaning (e.g., prices as strings and numbers) |
| **Data Science** | Writing flexible functions that accept various numeric/array-like inputs |
| **Machine Learning** | Model APIs (like scikit-learn) accept lists, NumPy arrays, or pandas DataFrames interchangeably via duck typing |
| **Business Analytics** | Quick, flexible exploratory scripts that reassign variables as analysis evolves |
| **Finance** | Parsing inconsistent numeric formats from different data sources (strings, floats, ints) |
| **Healthcare** | Handling varied data entry formats for the same field across different hospital systems |
| **Marketing** | Flexible utility functions used across many campaigns with varying data shapes |
| **AI** | Frameworks like PyTorch/TensorFlow use duck typing so functions work across different tensor-like objects |
| **Automation** | Scripts that must gracefully handle varying input types from different automated sources |
| **Dashboards** | Backend functions that must handle whatever type a filter widget passes (string, number, list) |
| **ETL Pipelines** | Type validation/conversion logic to standardize inconsistent source data before loading |

**How Big Tech Uses This Concept**
- **Google**: Internal Python tooling (and public libraries like TensorFlow) rely on duck typing so the same functions can operate on NumPy arrays, lists, or custom tensor objects interchangeably.
- **Amazon**: Data ingestion pipelines handling third-party seller data must gracefully process wildly inconsistent types for the same logical field (e.g., price as string vs. number).
- **Netflix**: Data engineering pipelines use dynamic typing with runtime validation to handle evolving event schemas across microservices.
- **Uber**: Real-time data pipelines must gracefully handle type variability from many different device/sensor sources feeding location and trip data.
- **Spotify**: Metadata ingestion from multiple content providers requires flexible type handling since providers don't always agree on formats.
- **Microsoft**: Excel formulas are dynamically typed by nature (a cell can hold a number, text, or formula result), conceptually paralleling Python's approach.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Use `isinstance()` checks defensively in functions that accept data from external, less-trusted sources (files, APIs, user input).
- Use type hints (`def f(x: int) -> str:`) to document intent for other developers, even though Python won't enforce them.
- Validate and standardize types explicitly during data cleaning — don't assume a column is "all numbers" just because most values are.
- Use tools like `mypy` in larger production codebases to catch type-related bugs before runtime, compensating for the lack of compile-time checks.

### Performance Tips
- Excessive `isinstance()` checks in extremely hot loops can add overhead — prefer vectorized pandas/NumPy operations (which handle type consistency internally) over manual row-by-row type-checking wherever possible.

### Clean Code Recommendations
```python
# Bad — assumes type without checking, will crash on mixed data
def total_price(prices):
    return sum(prices)

# Good — defensive, handles mixed/messy input types
def total_price_safe(prices):
    numeric_prices = [p for p in prices if isinstance(p, (int, float))]
    return sum(numeric_prices)
```

### Common Beginner Mistakes
1. Assuming Python will automatically convert types in mixed operations (`"5" + 5` raises an error, unlike JavaScript).
2. Confusing "dynamic typing" with "no typing rules at all" — Python is dynamic but still strongly typed.
3. Relying on type hints to actually *prevent* wrong types being passed — they don't, at runtime.
4. Not validating column types after reading messy real-world files, leading to crashes deep inside a pipeline.

### Common Interview Mistakes
- Confusing **dynamic vs static typing** with **strong vs weak typing** — these are two separate axes, and Python is dynamically AND strongly typed.
- Not being able to give a clear example of **duck typing**.
- Claiming Python "has no type safety" — inaccurate; Python enforces strict rules about type-mixing in operations, it just doesn't check types at compile time.

### Debugging Tips
- If a function behaves unexpectedly with different inputs, add `print(type(x))` at the start to confirm what type is actually being received.
- Use `isinstance()` checks with clear `raise TypeError(...)` messages early in a function to fail fast with clear errors, rather than deep inside complex logic.
- When reading files with `pandas`, always check `df.dtypes` after loading to catch unexpected mixed-type ("object") columns early.

### Things to Avoid
- Avoid assuming a data column is uniformly typed just because it "looks numeric" — always verify with `.dtypes` or explicit checks after loading real data.
- Avoid relying on type hints as a runtime safety net — they are documentation only, unless paired with a separate static type-checking tool.
- Avoid writing functions that silently fail or produce wrong results on unexpected types — validate and raise clear errors instead.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `TypeError: unsupported operand type(s) for +: 'int' and 'str'` | Attempting an operation between incompatible types (Python won't auto-convert) | Explicitly convert with `str()`/`int()`/`float()` as appropriate |
| Function works fine in testing but crashes on real data | Real data contains mixed/unexpected types not covered during testing | Add `isinstance()` validation and handle/convert unexpected types gracefully |
| Type hint violated but no error raised | Type hints are not enforced at runtime | Use a static type checker like `mypy`, or add explicit `isinstance()` validation inside the function |
| pandas column shows `dtype: object` unexpectedly | Column contains mixed types (e.g., numbers and strings together) | Inspect with `df['col'].apply(type).value_counts()`, then clean/convert explicitly |
| Silent wrong result instead of an error | Operation "worked" on the wrong type due to duck typing (e.g., `"3" * 2` gives `"33"`, not `6`) | Add explicit type checks/conversions where the intended type matters |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What does "dynamic typing" mean in Python?
2. Can a Python variable change its type after being assigned? Give an example.
3. What does `type(x)` return?

### Intermediate Questions
4. What is the difference between dynamic typing and static typing?
5. Why does `"5" + 5` raise a `TypeError` in Python, even though Python is dynamically typed?
6. What is duck typing, and how does it relate to dynamic typing?

### Advanced Questions
7. Explain the difference between "dynamic vs static" typing and "strong vs weak" typing, with Python and JavaScript as contrasting examples.
8. Do Python type hints get enforced at runtime? If not, what are they actually useful for?
9. Why might a pandas column show `dtype: object` even though it looks like it "should" be numeric?

### Scenario-Based Questions
10. A function that works perfectly in testing starts crashing in production when given real user data. Dynamic typing is a likely factor — how would you defensively rewrite the function?
11. You import a CSV and a numeric-looking column shows `dtype: object` in pandas. What steps would you take to investigate and fix this?

### Coding Exercises
```python
# Exercise 1: Write a function that accepts a value of ANY type and 
# safely returns its float value if convertible, or None otherwise.

# Exercise 2: Demonstrate duck typing by writing a single function that 
# works correctly with an int, a string, and a list as input.

# Exercise 3: Given a messy list of mixed-type "numbers" (ints, floats, 
# numeric strings, invalid strings), clean it into a list of valid floats only.
```

### Interview Q&A
**Q: What is dynamic typing, and how does Python implement it internally?**
A: Dynamic typing means a variable's type is determined at runtime based on the object it currently references, rather than being declared in advance. Python implements this because a variable is simply a **name bound to an object** — the type information lives with the object itself, not the variable name — so reassigning a name to point to a different type of object requires no special handling.

**Q: Is Python's dynamic typing the same as "weak typing"? Why or why not?**
A: No — these are different concepts. Dynamic vs. static typing is about *when* types are checked (runtime vs. compile time). Strong vs. weak typing is about whether a language *silently converts* between incompatible types in operations. Python is dynamically typed AND strongly typed — it determines types at runtime, but it will not silently coerce, e.g., a string and an integer together in a `+` operation, unlike weakly typed languages such as JavaScript.

**Q: Do Python type hints prevent type errors at runtime?**
A: No. Type hints (e.g., `def f(x: int) -> int:`) are purely for documentation and can be checked by external static analysis tools like `mypy`, but the Python interpreter itself does not enforce them — passing a string where an `int` hint is declared will not raise any error at runtime unless explicit validation is added.

---

## 9. Mini Project / Assignment

**Task: "Type-Safe Data Ingestion Function"**

1. Create a list simulating a messy real-world numeric column: mix of `int`, `float`, numeric strings (`"42"`), dollar-formatted strings (`"$19.99"`), invalid entries (`"n/a"`), and `None`.
2. Write a function `to_float(value)` that uses `isinstance()` checks to safely convert each type to a clean `float`, returning `None` for anything unconvertible.
3. Apply this function across the whole list and print the cleaned result.
4. Write a second function `describe_types(data_list)` that prints the type of every element in a list (demonstrating dynamic typing across mixed data).
5. Bonus: Add type hints to both functions, and briefly comment on what they do (and don't) guarantee.

**Deliverable:** A `.py` script with comments explaining each type-safety decision.

---

## 10. Quick Revision

### Key Points
- **Dynamic typing** = type is determined at runtime from the object a variable references; no advance declaration needed.
- A variable can be **freely reassigned** to a completely different type.
- Python is dynamic AND **strongly typed** — it will not silently convert incompatible types in operations.
- **Duck typing**: Python functions generally work with any type that supports the required operations, regardless of declared type.
- **Type hints** document intent but are **not enforced** by the interpreter at runtime.

### Important Syntax
```python
x = 5                       # inferred as int
x = "five"                  # reassigned as str — perfectly legal
type(x)                     # get exact type
isinstance(x, int)          # type-check, handles subclasses
isinstance(x, (int, float)) # check against multiple types
def f(x: int) -> str:        # type hint (not enforced)
    ...
```

### Cheat Sheet / Summary Table

| Concept | Python's Behavior |
|---|---|
| Type declared in advance? | No |
| Type can change on reassignment? | Yes |
| Type checked at compile time? | No — only at runtime |
| Silent type coercion in operations? | No (strongly typed) |
| Type hints enforced at runtime? | No — documentation only |
| Function type requirements? | Based on required operations (duck typing), not declared types |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `isinstance()` for defensive type checks | Assume input data is always the expected type |
| Use type hints for documentation/tooling | Rely on type hints to prevent runtime errors |
| Validate/convert messy real-world data explicitly | Assume Python will auto-convert incompatible types |
| Check `df.dtypes` after loading real data | Assume a "numeric-looking" column is actually numeric |

---

## 11. Further Reading

- [Python Official Docs — Data Model (Objects, Values, and Types)](https://docs.python.org/3/reference/datamodel.html)
- [Python Official Docs — Type Hints (PEP 484 overview)](https://docs.python.org/3/library/typing.html)
- [mypy Documentation — Static Type Checking for Python](https://mypy.readthedocs.io/)
- [Real Python — Duck Typing in Python](https://docs.python.org/3/glossary.html#term-duck-typing)
