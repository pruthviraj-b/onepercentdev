# Module 1 — Python Foundations for Data Analysis
## Topic 4: `float` (Floating-Point Data Type)

---

## 0. Prerequisites

- Topic 1: **Variables**
- Topic 2: **Memory Concepts**
- Topic 3: **int** (division operators, type conversion)

---

## 1. Concept Overview

**Simple Definition**
`float` is Python's built-in data type used to represent **numbers with a decimal point** (e.g., `3.14`, `-0.5`, `100.0`), including numbers in scientific notation.

**Why This Topic Exists**
Real-world data is rarely made up of clean whole numbers — prices, percentages, averages, measurements, and statistical results almost always involve fractional values. Python needs a numeric type capable of representing these approximate real numbers efficiently.

**Why It Is Important**
- Nearly every statistical calculation in data analysis (mean, standard deviation, percentages, ratios) produces a `float`.
- Floats have a well-known **precision limitation** that causes confusing bugs if not understood — a frequent interview and real-world gotcha.
- Correct float handling is essential for **financial calculations, scientific data, and ML model outputs**, where tiny errors can compound.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Create and use floats correctly in Python.
2. Understand how floats are stored internally (IEEE 754 binary representation) and why this causes precision issues.
3. Perform accurate comparisons and rounding with floats.
4. Convert between `int`, `float`, and `str` correctly.
5. Apply floats safely in real pandas/NumPy-based numeric analysis.

**Where It Is Used in Real Projects**
- Prices, revenue, tax calculations
- Averages, percentages, growth rates
- Statistical outputs (mean, std deviation, correlation coefficients)
- Model prediction scores/probabilities in machine learning
- Sensor/measurement data (temperature, distance, weight)

---

## 2. In-Depth Explanation

### 2.1 Core Concept: What Is a `float`?

A `float` represents a **real number** with a fractional (decimal) component. Internally, Python's `float` follows the **IEEE 754 double-precision** standard — the same standard used by most programming languages — using 64 bits of memory per value.

```python
price = 19.99
temperature = -3.5
scientific = 2.5e3     # scientific notation → 2500.0
```

### 2.2 Internal Working: Why Floats Are "Approximate"

Unlike `int` (arbitrary precision, exact), `float` values are stored in **binary floating-point format**, which cannot represent most decimal fractions exactly — similar to how `1/3` cannot be written exactly in decimal (0.3333...), many decimal fractions cannot be written exactly in binary.

```python
print(0.1 + 0.2)          # 0.30000000000000004  — NOT exactly 0.3!
print(0.1 + 0.2 == 0.3)   # False
```

**Why this happens:** `0.1` and `0.2` cannot be represented exactly in binary floating-point (just like 1/3 can't be represented exactly in decimal). The computer stores the *closest possible* binary approximation, and small rounding errors appear when these approximations are added together.

This is **not a Python bug** — it's a universal characteristic of IEEE 754 floating-point, present in Java, C, JavaScript, and virtually every mainstream language.

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Float** | A number with a decimal component, stored in binary floating-point format |
| **IEEE 754** | The international standard defining how floating-point numbers are stored in binary (64-bit "double precision" in Python) |
| **Floating-Point Precision Error** | Small inaccuracies that occur because most decimal fractions can't be represented exactly in binary |
| **Scientific Notation** | A compact way to write very large/small floats, e.g., `1.5e10` = `15000000000.0` |
| **Rounding** | Adjusting a float to a specified number of decimal places |
| **Epsilon** | The smallest meaningful difference between two floats, used for "close enough" comparisons |
| **NaN (Not a Number)** | A special float value representing an undefined/missing numeric result |
| **Infinity (`inf`)** | A special float value representing an number larger than any finite float |

### 2.4 Key Rules & Behavior

**Rule 1 — Never use `==` to compare floats directly:**
```python
a = 0.1 + 0.2
b = 0.3
print(a == b)     # False — due to precision error

# Correct approach:
print(round(a, 5) == round(b, 5))    # True

import math
print(math.isclose(a, b))            # True — the proper way
```

**Rule 2 — Division between integers can produce a float:**
```python
print(7 / 2)      # 3.5 — '/' always returns float
```

**Rule 3 — Special float values: `NaN` and `inf`:**
```python
import math

x = float('nan')
y = float('inf')
z = float('-inf')

print(x == x)               # False! NaN is never equal to anything, even itself
print(math.isnan(x))        # True — correct way to check for NaN
print(y > 10**100)          # True
```

**Rule 4 — Rounding uses "banker's rounding" (round half to even):**
```python
print(round(2.5))    # 2  (rounds to nearest EVEN number, not always up)
print(round(3.5))    # 4
```
This surprises many beginners — Python's `round()` does not always round `.5` up; it rounds to the nearest even number to reduce cumulative statistical bias.

### 2.5 Why It Works This Way

Python (like almost every language) uses IEEE 754 because it offers a strong balance of **speed, standardization across hardware, and reasonable precision** for the vast majority of use cases. The tradeoff (imprecision in some decimal representations) is a known, accepted cost — which is why financial systems use `Decimal` instead of `float` when exact precision is legally required (covered in a later topic).

---

## 3. Syntax & Usage

### 3.1 Creating Floats

```python
price = 19.99
temperature = -3.5
big = 2.5e3          # scientific notation: 2500.0
small = 1.5e-3        # scientific notation: 0.0015
whole_as_float = 5.0  # explicitly a float, even though it's a whole number
```

### 3.2 Type Conversion

| Function | Purpose | Example | Result |
|---|---|---|---|
| `float(x)` | Converts int/string to float | `float(5)` | `5.0` |
| `float("3.14")` | Converts numeric string to float | `float("3.14")` | `3.14` |
| `float("abc")` | **Raises `ValueError`** | — | Error |
| `int(3.99)` | Converts float to int (truncates) | `int(3.99)` | `3` |

### 3.3 Rounding & Precision Functions

| Function | Purpose | Example | Result |
|---|---|---|---|
| `round(x, n)` | Rounds to `n` decimal places | `round(3.14159, 2)` | `3.14` |
| `math.floor(x)` | Rounds down to nearest integer | `math.floor(3.9)` | `3` |
| `math.ceil(x)` | Rounds up to nearest integer | `math.ceil(3.1)` | `4` |
| `math.isclose(a, b)` | Safely compares two floats accounting for precision error | `math.isclose(0.1+0.2, 0.3)` | `True` |
| `math.isnan(x)` | Checks if a value is `NaN` | `math.isnan(float('nan'))` | `True` |
| `abs(x)` | Absolute value | `abs(-3.5)` | `3.5` |

### 3.4 Formatting Floats for Display

```python
value = 3.14159265

print(f"{value:.2f}")     # 3.14 — formatted to 2 decimal places
print(f"{value:,.2f}")    # useful with large numbers: 1,234.57
print(format(value, ".3f"))  # 3.142
```

---

## 4. Practical Examples

### 4.1 Basic Example
```python
price = 49.99
tax_rate = 0.08

tax = price * tax_rate
total = price + tax

print(round(tax, 2))
print(round(total, 2))
```
**Line-by-line explanation:**
- `price * tax_rate` → computes the tax amount as a float.
- `price + tax` → computes the total.
- `round(x, 2)` → rounds each result to 2 decimal places for clean currency display.

**Expected Output:**
```
4.0
53.99
```
**Why:** `49.99 * 0.08 = 3.9992`, which rounds to `4.0`; adding to price and rounding gives a clean 2-decimal currency value — this is standard practice for displaying money, though `round()` alone isn't sufficient for exact financial accuracy (see Best Practices).

---

### 4.2 Intermediate Example — The Classic Precision Bug
```python
total = 0.0
for _ in range(10):
    total += 0.1

print(total)
print(total == 1.0)
print(round(total, 1) == 1.0)

import math
print(math.isclose(total, 1.0))
```
**Line-by-line explanation:**
- Adding `0.1` ten times accumulates tiny binary rounding errors.
- `total == 1.0` → likely `False` due to accumulated floating-point error.
- `round(total, 1) == 1.0` → `True`, since rounding masks the tiny error.
- `math.isclose()` → the professionally correct way to compare floats, designed specifically to handle this precision issue.

**Expected Output:**
```
0.9999999999999999
False
True
True
```
**Why:** This is the single most common "gotcha" with floats in any language — never compare floats with `==` directly; always use rounding or `math.isclose()`.

---

### 4.3 Advanced Example — NaN, Infinity, and Data Cleaning Relevance
```python
import math

values = [10.5, float('nan'), 20.3, float('inf'), 15.0]

clean_values = [v for v in values if not math.isnan(v) and not math.isinf(v)]

print(clean_values)
print(sum(clean_values) / len(clean_values))
```
**Line-by-line explanation:**
- `values` → simulates a real dataset containing missing (`nan`) and invalid (`inf`) numeric entries.
- The list comprehension filters out any value that is `NaN` or infinite, keeping only genuinely usable numbers.
- `sum(...) / len(...)` → computes a safe average from the cleaned list.

**Expected Output:**
```
[10.5, 20.3, 15.0]
15.266666666666667
```
**Why:** In real datasets (especially from pandas, which represents missing numeric values as `NaN`), filtering out `NaN`/`inf` before aggregation is essential — otherwise, calculations silently return `NaN` or `inf` themselves.

---

### 4.4 Real-World Project Example — Revenue Calculation with Safe Rounding
```python
import pandas as pd

df = pd.read_csv("sales_data.csv")

df['revenue'] = df['quantity'] * df['unit_price']
average_order_value = df['revenue'].mean()
total_revenue = df['revenue'].sum()

print(f"Total Revenue: ${total_revenue:,.2f}")
print(f"Average Order Value: ${average_order_value:,.2f}")
```
**Line-by-line explanation:**
- `df['quantity'] * df['unit_price']` → vectorized float multiplication across the entire column (pandas uses NumPy floats internally, `float64` by default).
- `.mean()` and `.sum()` → aggregate statistics, both returning `float64` values.
- `f"${value:,.2f}"` → formats the float as currency, with thousands separators and exactly 2 decimal places.

**Expected Output (example):**
```
Total Revenue: $128,450.75
Average Order Value: $42.83
```
**Why:** This is the standard real-world pattern for financial reporting — compute with floats, then format only at the display stage, never rounding intermediate calculations prematurely (which can compound errors across large datasets).

---

## 5. Real-World Applications

| Domain | How Floats Are Used |
|---|---|
| **Data Analysis** | Averages, percentages, ratios, statistical summaries |
| **Data Science** | Feature scaling, normalized values, correlation coefficients |
| **Machine Learning** | Model weights, prediction probabilities, loss values, learning rates |
| **Business Analytics** | Growth rates, KPIs like conversion rate, profit margin |
| **Finance** | Prices, interest calculations, exchange rates (though `Decimal` is preferred for exact accounting) |
| **Healthcare** | Vital sign measurements, dosage calculations, lab result values |
| **Marketing** | Click-through rates, cost-per-click, ROI percentages |
| **AI** | Neural network weights, activation values, confidence scores |
| **Automation** | Timing/delay calculations, sensor threshold checks |
| **Dashboards** | Displaying formatted percentages, currency, and averages |
| **ETL Pipelines** | Unit conversions, normalization, aggregation of numeric fields |

**How Big Tech Uses This Concept**
- **Google**: Search ranking and ad-auction systems use floating-point scoring internally, with careful precision handling for billions of daily computations.
- **Amazon**: Dynamic pricing algorithms compute float-based price adjustments in real time across millions of products.
- **Netflix**: Recommendation confidence scores and A/B test statistical results are float-based, using `math.isclose()`-style comparisons in testing frameworks.
- **Uber**: Surge multipliers (e.g., `1.8x`) and ETA calculations are float-based, computed continuously from live data.
- **Spotify**: Audio feature values (danceability, energy scores) used in recommendation models are floats, typically normalized between 0.0 and 1.0.
- **Microsoft**: Excel's numeric engine handles floats extensively, and famously documents its own floating-point precision limitations for financial spreadsheet users.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Never compare floats with `==`; use `round()` or `math.isclose()`.
- For **exact financial calculations** (currency, accounting), use Python's `decimal.Decimal` instead of `float`.
- Round only at the **final display stage**, not during intermediate calculations, to avoid compounding errors.
- Use `math.isnan()` / `math.isinf()` (or pandas' `.isna()`) to safely check for invalid numeric values rather than `== NaN`.

### Performance Tips
- Use vectorized pandas/NumPy float operations instead of Python loops for large datasets — significantly faster.
- Avoid unnecessary repeated string-float conversions inside loops over large data.

### Clean Code Recommendations
```python
# Bad — comparing floats directly
if total_price == 100.00:
    apply_discount()

# Good — safe comparison
import math
if math.isclose(total_price, 100.00, abs_tol=1e-9):
    apply_discount()
```

### Common Beginner Mistakes
1. Comparing floats with `==` and being confused when it fails (`0.1 + 0.2 != 0.3`).
2. Assuming `round(2.5)` always gives `3` — Python uses banker's rounding, so it may give `2`.
3. Using `float` for currency in production financial systems instead of `Decimal`.
4. Forgetting that `NaN != NaN`, breaking naive equality-based filtering logic.

### Common Interview Mistakes
- Not being able to explain *why* `0.1 + 0.2 != 0.3` (should reference binary floating-point representation, not just "Python has bugs").
- Confusing `NaN` handling — using `if x == float('nan')` (always `False`) instead of `math.isnan(x)`.
- Not knowing when to prefer `Decimal` over `float` (e.g., for money).

### Debugging Tips
- If aggregated totals look "almost right" but slightly off, suspect floating-point accumulation error.
- Use `Decimal` or scaled integers (e.g., store cents as `int` instead of dollars as `float`) in finance-critical code.
- Use `print(f"{value:.20f}")` to reveal the true underlying binary approximation of a float during debugging.

### Things to Avoid
- Avoid using `float` for money in production systems — use `decimal.Decimal`.
- Avoid `==` comparisons on any computed float value.
- Avoid assuming `round()` always rounds `.5` upward.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `ValueError: could not convert string to float: 'abc'` | Trying to convert a non-numeric string to float | Validate/clean the string first, or use `try/except` |
| Float comparison unexpectedly `False` | Floating-point precision error (e.g., `0.1 + 0.2 == 0.3`) | Use `math.isclose()` or round before comparing |
| `nan` appearing in calculations | Missing/invalid data propagated into arithmetic | Filter with `math.isnan()` / pandas `.dropna()` before aggregating |
| `OverflowError: (34, 'Numerical result out of range')` | Extremely large float operation exceeding representable range | Use appropriate scaling, or `Decimal`/`mpmath` for extreme precision needs |
| Rounding gives unexpected value (e.g., `round(2.5)` → `2`) | Python uses banker's rounding (round-half-to-even) | Use `decimal.Decimal` with explicit rounding mode if traditional rounding is required |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What is the difference between `int` and `float`?
2. What does `float("3.14")` return?
3. Why might `print(0.1 + 0.2)` not show exactly `0.3`?

### Intermediate Questions
4. How do you safely compare two floats for "equality" in Python?
5. What is `NaN`, and why does `NaN == NaN` return `False`?
6. What does `round(2.5)` return, and why might it surprise you?

### Advanced Questions
7. Explain how IEEE 754 double-precision floats are stored internally and why this causes precision errors.
8. Why should `Decimal` be preferred over `float` for financial applications?
9. How would you detect and clean `NaN`/`inf` values in a large numeric dataset efficiently?

### Scenario-Based Questions
10. A financial report shows a total that's off by $0.01 compared to the source system. What could be causing this, and how would you fix it?
11. You're aggregating a column that unexpectedly returns `nan` for the sum. What's the likely cause, and how do you resolve it?

### Coding Exercises
```python
# Exercise 1: Write a function that safely compares two floats using math.isclose()

# Exercise 2: Clean a list of floats by removing any NaN or infinite values, 
# then compute the mean of the remaining values.

# Exercise 3: Simulate a repeated 0.1 addition (10 times) and demonstrate 
# the precision error, then fix the comparison using rounding.
```

### Interview Q&A
**Q: Why does `0.1 + 0.2` not equal `0.3` in Python?**
A: Because `float` uses IEEE 754 binary floating-point representation, and most decimal fractions (like 0.1 and 0.2) cannot be represented exactly in binary — the computer stores the closest possible approximation, and tiny rounding errors appear when these approximations are combined. This is a universal characteristic of floating-point arithmetic, not a Python-specific bug.

**Q: How should you compare two floats for equality?**
A: Never use `==` directly. Use `math.isclose(a, b)` (with an appropriate tolerance) or round both values to a sensible number of decimal places before comparing.

**Q: Why is `Decimal` preferred over `float` for financial calculations?**
A: `Decimal` represents numbers in base-10 exactly (as they're written), avoiding the binary approximation errors inherent to `float`. This matters in finance/accounting, where even tiny rounding discrepancies are unacceptable and must reconcile exactly to the cent.

---

## 9. Mini Project / Assignment

**Task: "Safe Revenue Reconciliation Tool"**

1. Create a list of 15 sample transaction amounts (floats), including at least one `NaN` and one very large number.
2. Write a function that:
   - Filters out `NaN` values safely
   - Calculates total revenue and average transaction value
   - Formats both as currency strings with 2 decimal places and thousands separators
3. Demonstrate the floating-point precision issue by summing `0.1` twenty times and comparing the result to `2.0` using both `==` and `math.isclose()`.
4. Bonus: Rewrite the total calculation using `decimal.Decimal` and compare the result to the `float`-based version.

**Deliverable:** A `.py` script with comments explaining each precision-handling decision.

---

## 10. Quick Revision

### Key Points
- `float` represents decimal numbers using **IEEE 754 double-precision** binary format — approximate, not exact.
- Never compare floats with `==`; use `round()` or `math.isclose()`.
- `NaN` is never equal to anything, even itself — use `math.isnan()` to check for it.
- `round()` uses **banker's rounding** (round half to even), which can surprise beginners.
- Use `decimal.Decimal` instead of `float` for exact financial/accounting calculations.

### Important Syntax
```python
x = 3.14                     # float literal
float("3.14")                 # string to float
int(3.99)                     # float to int (truncates)
round(x, 2)                   # round to 2 decimal places
math.isclose(a, b)            # safe float comparison
math.isnan(x)                 # check for NaN
math.isinf(x)                 # check for infinity
f"{x:.2f}"                    # format to 2 decimal places
```

### Cheat Sheet / Summary Table

| Concept | Behavior |
|---|---|
| `0.1 + 0.2 == 0.3` | `False` (precision error) |
| `round(2.5)` | `2` (banker's rounding) |
| `NaN == NaN` | `False` |
| `float('inf') > any_number` | `True` |
| `/` operator | Always returns float |
| Exact decimal accuracy needed? | Use `decimal.Decimal`, not `float` |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `math.isclose()` for float comparisons | Use `==` to compare computed floats |
| Use `Decimal` for money/accounting | Use `float` for exact financial totals |
| Filter `NaN`/`inf` before aggregating | Assume aggregation functions ignore invalid values automatically |
| Round only at the display stage | Round intermediate calculation steps repeatedly |

---

## 11. Further Reading

- [Python Official Docs — Floating Point Arithmetic: Issues and Limitations](https://docs.python.org/3/tutorial/floatingpoint.html)
- [Python `math` module documentation](https://docs.python.org/3/library/math.html)
- [Python `decimal` module documentation](https://docs.python.org/3/library/decimal.html)
- [IEEE 754 Standard Overview](https://en.wikipedia.org/wiki/IEEE_754)
