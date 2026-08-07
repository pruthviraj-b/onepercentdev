# Module 1 — Python Foundations for Data Analysis
## Topic 3: `int` (Integer Data Type)

---

## 0. Prerequisites

- Topic 1: **Variables** (assignment, naming, reassignment)
- Topic 2: **Memory Concepts** (references, object identity, interning)

---

## 1. Concept Overview

**Simple Definition**
`int` is Python's built-in data type used to represent **whole numbers** — positive, negative, or zero — with **no decimal component** (e.g., `5`, `-42`, `0`, `1000000`).

**Why This Topic Exists**
Almost every computation in data analysis starts with counting or whole-number values — row counts, IDs, years, quantities, indexes. Python needs a dedicated, reliable numeric type to represent these values precisely, without rounding errors.

**Why It Is Important**
- Integers are the **most frequently used numeric type** in data analysis (counts, indices, IDs, loop counters).
- Unlike many languages, Python's `int` has **no fixed size limit** — it can represent arbitrarily large whole numbers, which matters in data science (e.g., large ID numbers, factorial computations, cumulative counts).
- Understanding `int` behavior (especially division, floor division, and type conversion) prevents subtle calculation bugs that are common in real projects and interviews.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Create and use integers correctly in Python.
2. Understand how Python's `int` differs from integers in other languages (arbitrary precision).
3. Use arithmetic, comparison, and conversion operations correctly with integers.
4. Understand internal behavior like interning and integer overflow-free arithmetic.
5. Apply integers correctly in real pandas/NumPy-based data analysis code.

**Where It Is Used in Real Projects**
- Row counts, column counts (`len(df)`, `df.shape[0]`)
- Customer IDs, transaction IDs, product SKUs
- Loop counters in ETL scripts
- Date components (year, month, day as integers)
- Aggregation results like `.count()`, `.sum()` on integer columns

---

## 2. In-Depth Explanation

### 2.1 Core Concept: What Is an `int` in Python?

An `int` object represents a whole number. In Python 3, there is only **one integer type** — unlike Python 2, which had separate `int` and `long` types. Python automatically handles arbitrarily large integers without any special syntax.

```python
a = 42
b = -17
c = 0
d = 123456789012345678901234567890   # Perfectly valid — no overflow
```

### 2.2 Internal Working: Arbitrary Precision

In languages like C or Java, integers are stored in a **fixed number of bits** (e.g., 32-bit or 64-bit), meaning they have a maximum and minimum value (overflow can occur). Python's `int`, however, is implemented as an **arbitrary-precision integer** — internally, CPython stores large integers as an array of "digits" (in a base close to 2^30), expanding dynamically as needed.

```python
big_number = 2 ** 1000    # a 302-digit number — computed instantly, no overflow
print(big_number)
```

This is why Python is popular in data science and cryptography — calculations on very large numbers "just work" without special handling.

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Integer (`int`)** | A whole number data type with no decimal component |
| **Arbitrary Precision** | Python's ability to represent integers of any size, limited only by available memory |
| **Literal** | A value written directly in code (e.g., `42` is an integer literal) |
| **Type Conversion / Casting** | Converting a value from one type to another (e.g., `int("5")`) |
| **Floor Division (`//`)** | Division that rounds down to the nearest whole number |
| **Modulo (`%`)** | Returns the remainder of a division |
| **Integer Overflow** | A limitation in fixed-size integer languages (NOT applicable to core Python `int`) |
| **Interning** | Python's caching of small integers (-5 to 256) so repeated values share the same object |

### 2.4 Key Rules & Behavior

**Rule 1 — Division always produces a float, even for whole-number results:**
```python
print(10 / 2)     # 5.0  (float, NOT int)
print(9 / 3)      # 3.0  (float)
```

**Rule 2 — Use floor division (`//`) to get an integer result:**
```python
print(10 // 3)    # 3   (rounds down)
print(-10 // 3)   # -4  (rounds toward negative infinity, NOT toward zero!)
```

**Rule 3 — Modulo (`%`) gives the remainder, following the sign of the divisor:**
```python
print(10 % 3)     # 1
print(-10 % 3)    # 2   (Python's modulo follows the divisor's sign)
```

**Rule 4 — Underscores can be used as visual separators in large literals (Python 3.6+):**
```python
population = 1_400_000_000    # same as 1400000000, easier to read
```

**Rule 5 — Booleans are technically a subclass of `int`:**
```python
print(True + True)    # 2  — True behaves as 1, False as 0
print(isinstance(True, int))   # True
```

### 2.5 Why It Works This Way

Python's arbitrary-precision integers exist because the language's designers prioritized **correctness and simplicity over raw performance** — a beginner or data analyst should never have to worry about "integer overflow" the way a C programmer must. This tradeoff costs a small amount of performance for very large numbers but eliminates an entire category of bugs.

---

## 3. Syntax & Usage

### 3.1 Creating Integers

```python
x = 10          # positive integer
y = -25         # negative integer
z = 0           # zero
big = 1_000_000 # underscore-separated literal
```

### 3.2 Type Conversion

| Function | Purpose | Example | Result |
|---|---|---|---|
| `int(x)` | Converts a value to an integer (truncates decimals, doesn't round) | `int(9.8)` | `9` |
| `int("42")` | Converts a numeric string to an integer | `int("42")` | `42` |
| `int("3.5")` | **Raises `ValueError`** — cannot convert a decimal-looking string directly | — | Error |
| `int(True)` | Converts boolean to integer | `int(True)` | `1` |

### 3.3 Arithmetic Operators with Integers

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `5 - 3` | `2` |
| `*` | Multiplication | `5 * 3` | `15` |
| `/` | True division (always returns float) | `5 / 2` | `2.5` |
| `//` | Floor division | `5 // 2` | `2` |
| `%` | Modulo (remainder) | `5 % 2` | `1` |
| `**` | Exponentiation | `5 ** 2` | `25` |

### 3.4 Common Built-in Functions Used with Integers

| Function | Purpose | Returns |
|---|---|---|
| `abs(x)` | Absolute value | int |
| `pow(x, y)` | x raised to power y (same as `x ** y`) | int |
| `divmod(x, y)` | Returns `(floor division, remainder)` as a tuple | tuple |
| `type(x)` | Returns the type of `x` | type object |
| `isinstance(x, int)` | Checks if `x` is an integer | bool |

---

## 4. Practical Examples

### 4.1 Basic Example
```python
a = 15
b = 4

print(a + b)
print(a - b)
print(a * b)
print(a / b)
print(a // b)
print(a % b)
```
**Line-by-line explanation:**
- `a + b` → simple addition → `19`
- `a - b` → subtraction → `11`
- `a * b` → multiplication → `60`
- `a / b` → true division, always returns float → `3.75`
- `a // b` → floor division, rounds down → `3`
- `a % b` → remainder of division → `3`

**Expected Output:**
```
19
11
60
3.75
3
3
```
**Why:** Python distinguishes true division (`/`, always float) from floor division (`//`, rounds toward negative infinity) — a very common point of confusion for beginners coming from other languages.

---

### 4.2 Intermediate Example — Type Conversion Pitfalls
```python
value = "42"
converted = int(value)
print(converted + 8)

decimal_str = "9.5"
# converted2 = int(decimal_str)   # Uncommenting this raises ValueError
converted2 = int(float(decimal_str))
print(converted2)
```
**Line-by-line explanation:**
- `int(value)` → successfully converts `"42"` (a clean numeric string) to integer `42`.
- `converted + 8` → integer arithmetic → `50`.
- `int("9.5")` would raise a `ValueError` because `int()` cannot parse a decimal point directly from a string.
- The fix: convert to `float` first, then to `int` — `int(float("9.5"))` → `9` (truncates, doesn't round).

**Expected Output:**
```
50
9
```
**Why:** `int()` only parses strings that look like clean integers. Any decimal-formatted string must go through `float()` first before converting to `int`.

---

### 4.3 Advanced Example — Arbitrary Precision & Interning
```python
import sys

big_number = 2 ** 100
print(big_number)
print(type(big_number))

a = 256
b = 256
print(a is b)     # True — interned

c = 257
d = 257
print(c is d)     # Likely False — not interned (implementation-dependent)
```
**Line-by-line explanation:**
- `2 ** 100` → Python computes this instantly and precisely, regardless of the number's size (no overflow).
- `a is b` → both `256` values reference the same cached object (within Python's small-int cache range of -5 to 256).
- `c is d` → `257` falls outside the cached range, so CPython may create two separate objects — `is` may return `False`, though this is an implementation detail and should never be relied upon.

**Expected Output:**
```
1267650600228229401496703205376
<class 'int'>
True
False
```
**Why:** This demonstrates Python's arbitrary-precision arithmetic and the internal caching optimization for small integers — both important internals for understanding `int` behavior deeply.

---

### 4.4 Real-World Project Example — Using Integers in Data Analysis
```python
import pandas as pd

df = pd.read_csv("sales_data.csv")

total_rows = len(df)                       # int — number of records
total_customers = df['customer_id'].nunique()   # int — unique customer count

pages_needed = -(-total_rows // 50)        # ceiling division using floor division trick

print(f"Total rows: {total_rows}")
print(f"Unique customers: {total_customers}")
print(f"Report pages needed (50 rows/page): {pages_needed}")
```
**Line-by-line explanation:**
- `len(df)` → returns an integer representing the row count.
- `df['customer_id'].nunique()` → returns an integer count of unique values.
- `-(-total_rows // 50)` → a classic trick to perform **ceiling division** using only integer floor division (since Python has no built-in ceiling-divide operator).
- f-strings insert these integer values directly into readable output.

**Expected Output (example):**
```
Total rows: 4823
Unique customers: 612
Report pages needed (50 rows/page): 97
```
**Why:** This shows integers being used for real reporting logic — counting records and calculating pagination, a common requirement in dashboards and reports.

---

## 5. Real-World Applications

| Domain | How Integers Are Used |
|---|---|
| **Data Analysis** | Row/column counts, unique value counts, index positions |
| **Data Science** | Class labels in classification (0/1), feature counts, iteration counts |
| **Machine Learning** | Epoch counts, batch sizes, number of estimators (`n_estimators=100`) |
| **Business Analytics** | Units sold, headcount, number of transactions |
| **Finance** | Number of shares, transaction counts, day counts for interest calculations |
| **Healthcare** | Patient counts, age (in years), dosage units |
| **Marketing** | Number of impressions, clicks, conversions |
| **AI** | Token counts, vocabulary size, layer counts in neural networks |
| **Automation** | Retry counts, loop iterations, file counts processed |
| **Dashboards** | KPI counters (e.g., "1,204 new signups this week") |
| **ETL Pipelines** | Batch sizes, row counts processed per run, partition counts |

**How Big Tech Uses This Concept**
- **Google**: Search ranking systems use massive integer counters (e.g., click counts, impression counts) across billions of queries — Python's arbitrary precision is valuable in internal analytics tools.
- **Amazon**: Inventory counts and order IDs are fundamentally integer-based, scaled across millions of SKUs.
- **Netflix**: View counts and content IDs are stored and aggregated as integers across their recommendation and analytics systems.
- **Uber**: Trip counts, driver IDs, and ETA calculations (in whole seconds/minutes) rely heavily on integer arithmetic.
- **Spotify**: Play counts, follower counts, and playlist lengths are all integer-based aggregate metrics.
- **Microsoft**: Excel and Power BI both rely on integer types for row counts, category counts, and ranking calculations in reports.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Use `//` when you explicitly need an integer result from division — never assume `/` will give you an int.
- Use underscores in long numeric literals for readability: `1_000_000` instead of `1000000`.
- Use `isinstance(x, int)` rather than `type(x) == int` for type checks (more Pythonic and handles subclasses correctly).
- When converting strings that might contain decimals, always go through `float()` first: `int(float(value))`.

### Performance Tips
- Avoid unnecessary type conversions in tight loops over large datasets — repeated `int()`/`str()` conversions add overhead.
- Prefer vectorized pandas/NumPy integer operations (`df['col'].sum()`) over manual Python loops for large datasets — far faster.

### Clean Code Recommendations
```python
# Bad
pages = total_rows / 50   # unclear this should be a whole number of pages

# Good
pages = -(-total_rows // 50)   # explicit ceiling division, clearly integer-based
```

### Common Beginner Mistakes
1. Assuming `/` returns an integer when both operands are whole numbers (`10 / 2` → `5.0`, not `5`).
2. Trying `int("9.5")` directly and getting a `ValueError`.
3. Misunderstanding floor division with negative numbers: `-7 // 2` is `-4`, not `-3` (rounds toward negative infinity, not toward zero).
4. Confusing `%` (modulo) behavior with negative numbers.

### Common Interview Mistakes
- Not knowing that Python's `int` has **no fixed size limit**, unlike Java/C's `int` (32-bit) or `long` (64-bit).
- Forgetting that `bool` is a subclass of `int` — this trips up candidates when asked "what does `True + True` return?"
- Confusing `/` and `//` when writing quick algorithms during a live coding round.

### Debugging Tips
- If a calculation returns unexpected decimals, check whether `/` was used instead of `//`.
- If a `ValueError` appears converting strings to `int`, check for hidden decimal points or whitespace in the string (`" 42 "` needs `.strip()` first in some cases, though `int()` does handle surrounding whitespace).
- Use `divmod(x, y)` to get both floor division and modulo in one call when debugging pagination/batching logic.

### Things to Avoid
- Avoid using `/` when you specifically need a whole-number result — always be explicit with `//`.
- Avoid assuming integer conversion behaves like rounding — `int()` **truncates** toward zero, it does not round.
- Avoid comparing integers with `is` for value equality — use `==`.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `ValueError: invalid literal for int() with base 10: '9.5'` | Trying to `int()` a string containing a decimal point | Convert via `int(float("9.5"))` |
| `ZeroDivisionError: division by zero` | Dividing by an integer `0` (with `/`, `//`, or `%`) | Add a check: `if divisor != 0:` before dividing |
| Unexpected float instead of int | Used `/` instead of `//` | Use `//` when an integer result is required |
| `TypeError: unsupported operand type(s) for +: 'int' and 'str'` | Mixing an integer with a string without conversion | Convert explicitly: `str(count) + " items"` or use an f-string |
| Wrong floor division result with negative numbers | Misunderstanding that `//` rounds toward negative infinity, not zero | Use `int(x / y)` if truncation toward zero is intended instead of flooring |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What is the difference between `/` and `//` in Python?
2. What data type does `10 / 2` return?
3. Convert the string `"25"` to an integer and add `5` to it.

### Intermediate Questions
4. Why does `int("9.5")` raise an error, and how do you fix it?
5. What is the result of `-7 // 2` and why?
6. What does `divmod(17, 5)` return?

### Advanced Questions
7. Explain how Python handles very large integers internally without overflow.
8. Why does `256 is 256` return `True` but `257 is 257` might return `False`?
9. Why is `bool` considered a subclass of `int` in Python, and what practical effect does this have?

### Scenario-Based Questions
10. You need to split 4,823 records into batches of 50 for processing. How would you calculate the number of batches needed, ensuring a partial last batch is counted?
11. A calculation in your pipeline is unexpectedly producing float results where integers were expected. What would you check first?

### Coding Exercises
```python
# Exercise 1: Write a function that returns True if a number is even, using modulo.

# Exercise 2: Given total_items and batch_size, calculate the number of 
# batches needed using ceiling division (without using math.ceil).

# Exercise 3: Convert a list of numeric strings (some with decimals) into 
# a list of integers safely, handling potential errors.
```

### Interview Q&A
**Q: Why does Python's `int` not have a maximum value like in Java or C?**
A: Python implements integers using an **arbitrary-precision** representation internally — it stores digits in a dynamically-sized array rather than a fixed number of bits, so integers can grow as large as available memory allows, without overflow.

**Q: What's the output of `True + True + False` and why?**
A: `2`. Because `bool` is a subclass of `int` in Python — `True` behaves as `1` and `False` as `0` in arithmetic contexts.

**Q: Why does `10 / 3` return `3.333...` but `10 // 3` returns `3`?**
A: `/` is **true division**, which always returns a float regardless of whether the operands are integers. `//` is **floor division**, which divides and then rounds the result down to the nearest whole number, returning an `int` when both operands are `int`.

---

## 9. Mini Project / Assignment

**Task: "Batch Processing Calculator"**

1. Given a variable `total_records = 12,347` and `batch_size = 250`, calculate:
   - The number of **full batches** (using `//`)
   - The number of **leftover records** in the final partial batch (using `%`)
   - The **total number of batches needed**, including the partial one (using the ceiling division trick)
2. Print all three results in a clearly formatted summary using an f-string.
3. Bonus: Write the same logic using `divmod()` in a single line and confirm it matches your manual calculation.

**Deliverable:** A `.py` script with comments explaining each integer operation used.

---

## 10. Quick Revision

### Key Points
- `int` represents whole numbers with **arbitrary precision** — no overflow limit in core Python.
- `/` always returns a `float`; `//` performs floor division and can return an `int`.
- `%` returns the remainder, following the sign of the divisor.
- `bool` is a subclass of `int` (`True` = 1, `False` = 0).
- Small integers (-5 to 256) are cached/interned by CPython — never rely on `is` for value comparisons.

### Important Syntax
```python
x = 10                 # integer literal
y = int("42")          # string to int
z = int(9.8)           # float to int (truncates, not rounds)
a // b                 # floor division
a % b                  # modulo
a ** b                 # exponentiation
divmod(a, b)           # (floor division, remainder) tuple
isinstance(x, int)     # type check
```

### Cheat Sheet / Summary Table

| Operation | Symbol | Example | Result |
|---|---|---|---|
| True division | `/` | `7 / 2` | `3.5` |
| Floor division | `//` | `7 // 2` | `3` |
| Modulo | `%` | `7 % 2` | `1` |
| Power | `**` | `2 ** 3` | `8` |
| String → int | `int(str)` | `int("7")` | `7` |
| Float → int | `int(float)` | `int(7.9)` | `7` |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `//` for guaranteed integer division results | Assume `/` returns an int |
| Convert decimal strings via `float()` then `int()` | Try `int("7.5")` directly |
| Use `==` for value comparison | Use `is` for value comparison |
| Use underscores for readability in large literals | Write unreadable long digit strings |

---

## 11. Further Reading

- [Python Official Docs — Numeric Types (int, float, complex)](https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex)
- [Python Official Docs — Built-in Functions (`int()`, `divmod()`, `abs()`)](https://docs.python.org/3/library/functions.html)
- [PEP 237 — Unifying Long Integers and Integers](https://peps.python.org/pep-0237/)
