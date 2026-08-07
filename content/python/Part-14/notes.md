# Module 2 — Type Casting
## Topic 4: `float()`

---

## 0. Prerequisites

- Module 1, Topic 4: **float**
- Module 2, Topic 2: **Explicit Conversion**
- Module 2, Topic 3: **int()** (contrasting truncation/parsing behavior)

---

## 1. Concept Overview

**Simple Definition**
`float()` is Python's built-in **constructor function** used to explicitly convert a compatible value — a string, integer, or boolean — into a floating-point (decimal) number. This topic goes in-depth into `float()`'s full parsing capabilities, special values, and edge cases.

**Why This Topic Exists**
Real-world numeric data — prices, measurements, percentages, scientific readings — is overwhelmingly decimal, not whole-number. `float()` is the primary tool for converting text-based decimal data (from CSVs, APIs, forms) into a usable numeric type for calculation.

**Why It Is Important**
- Used constantly to convert price, measurement, and statistical columns from text to usable decimals.
- `float()` can parse special values (`"inf"`, `"nan"`) and scientific notation — capabilities beyond what most learners expect, and useful in scientific/financial data contexts.
- Understanding exactly what `float()` accepts (and rejects) prevents a large share of real-world `ValueError` bugs during data cleaning.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Use `float()` correctly across all its valid input types (str, int, bool).
2. Understand what string formats `float()` can and cannot parse (decimals, scientific notation, special values).
3. Predict exactly when `float()` raises `ValueError` vs. `TypeError`.
4. Apply `float()` safely and defensively when cleaning messy real-world numeric text (currency symbols, commas, percent signs).
5. Understand the relationship between `float()`'s parsing and IEEE 754 precision (from Module 1).

**Where It Is Used in Real Projects**
- Converting price/currency columns from text to usable floats
- Parsing scientific measurement data, including exponential notation
- Converting percentage strings into decimal fractions
- Detecting and handling special numeric values (`inf`, `nan`) in scientific/statistical data

---

## 2. In-Depth Explanation

### 2.1 Core Concept: The Full Signature of `float()`

```python
float()          # no-argument form
float(x)          # converts x (str, int, or bool) to a float
```

Unlike `int()`, `float()` does **not** accept a `base` parameter — floating-point numbers are always expressed in base 10 (decimal), so the concept of "base" doesn't apply the same way.

```python
print(float())         # 0.0 — no-argument form returns 0.0
print(float("3.14"))    # 3.14
print(float(42))         # 42.0
print(float(True))        # 1.0
```

### 2.2 Internal Working: What `float()` Can Parse from Strings

`float()` is significantly more flexible than `int()` when parsing strings — it understands decimals, whole numbers, scientific notation, signs, whitespace, and even special IEEE 754 values.

```python
print(float("3.14"))        # 3.14   — standard decimal
print(float("42"))           # 42.0   — whole number string (no decimal point needed)
print(float("  3.14  "))     # 3.14   — whitespace stripped automatically
print(float("-2.5"))          # -2.5   — negative sign supported
print(float("+2.5"))           # 2.5    — explicit positive sign supported
print(float("1e3"))             # 1000.0 — scientific notation
print(float("2.5E-2"))           # 0.025  — scientific notation, negative exponent
print(float("inf"))               # inf    — special "infinity" value
print(float("-inf"))               # -inf   — negative infinity
print(float("nan"))                 # nan    — "Not a Number" special value
```

**What `float()` CANNOT parse:**
```python
# float("3,14")      # ValueError — comma not recognized as decimal separator
# float("$3.14")     # ValueError — currency symbols not stripped automatically
# float("3.14.5")    # ValueError — malformed number
# float("")          # ValueError — empty string
```

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Scientific Notation** | A compact numeric format like `1.5e3` (meaning 1.5 × 10³ = 1500.0) |
| **Exponent** | The power of 10 in scientific notation (the number after `e`/`E`) |
| **`inf` / `-inf`** | Special float values representing positive/negative infinity |
| **`nan`** | "Not a Number" — a special float representing an undefined/invalid numeric result |
| **Case-Insensitivity (special values)** | `float()` accepts `"inf"`, `"INF"`, `"Infinity"`, `"nan"`, `"NaN"`, etc. — case doesn't matter for these special keywords |
| **Malformed Number String** | A string that looks somewhat numeric but violates float format rules (e.g., two decimal points) |

### 2.4 Key Rules & Behavior

**Rule 1 — `float()` does NOT strip currency symbols, commas, or percent signs — these must be removed manually first:**
```python
# float("$1,200.50")   # ValueError

price_str = "$1,200.50"
clean = price_str.replace("$", "").replace(",", "")
print(float(clean))     # 1200.5
```

**Rule 2 — `float()` accepts whole-number-looking strings without requiring a decimal point:**
```python
print(float("100"))     # 100.0 — works fine, no decimal point required
```

**Rule 3 — `float()` understands scientific notation directly:**
```python
print(float("6.022e23"))    # 6.022e+23  — Avogadro's number, in scientific notation
```

**Rule 4 — Special values (`inf`, `nan`) are valid `float()` inputs and behave per IEEE 754 rules (Module 1, Topic 4):**
```python
x = float("nan")
print(x == x)              # False — NaN is never equal to itself
print(float("inf") > 10**100)   # True — infinity exceeds any finite number
```

**Rule 5 — `float()` from `int` or `bool` never fails and simply appends `.0` or converts to `1.0`/`0.0`:**
```python
print(float(100))     # 100.0
print(float(False))    # 0.0
```

### 2.5 Why It Works This Way

`float()` is intentionally permissive about **numeric formats it can unambiguously interpret** (scientific notation, signs, special IEEE 754 values) but strict about **formats requiring locale or domain-specific interpretation** (currency symbols, thousands separators) — since a comma could mean "thousands separator" in the US but "decimal point" in many European locales, Python leaves this ambiguous formatting entirely to the programmer to resolve explicitly, avoiding silent misinterpretation.

---

## 3. Syntax & Usage

### 3.1 Full Syntax

```python
float()          # returns 0.0
float(x)          # converts x (str, int, or bool) to a float
```

| Parameter | Type | Required? | Description |
|---|---|---|---|
| `x` | `str`, `int`, `bool`, or omitted | No (defaults meaningfully) | The value to convert |

Note: `float()` has **no `base` parameter** — unlike `int()`, since decimal numbers aren't naturally expressed in alternate integer bases the same way.

### 3.2 Common Variations

```python
float("3.14")         # 3.14
float("42")             # 42.0
float(42)                 # 42.0
float(True)                 # 1.0
float("1e3")                   # 1000.0
float("inf")                     # inf
float("nan")                       # nan
```

### 3.3 Common Cleaning Pattern for Real-World Strings

```python
def clean_and_convert(value):
    cleaned = value.replace("$", "").replace(",", "").replace("%", "").strip()
    return float(cleaned)

print(clean_and_convert("$1,200.50"))   # 1200.5
print(clean_and_convert("45.5%"))        # 45.5
```

---

## 4. Practical Examples

### 4.1 Basic Example
```python
price = float("49.99")
quantity = float(3)
is_discounted = float(True)

print(price, quantity, is_discounted)
```
**Line-by-line explanation:**
- `float("49.99")` → parses the clean decimal string.
- `float(3)` → converts an int to its float equivalent, `3.0`.
- `float(True)` → converts the boolean to `1.0`.

**Expected Output:**
```
49.99 3.0 1.0
```
**Why:** Demonstrates the three most common single-argument conversions to `float`.

---

### 4.2 Intermediate Example — Scientific Notation & Special Values
```python
values = ["6.022e23", "1.5E-3", "inf", "-inf", "nan"]

for v in values:
    parsed = float(v)
    print(f"{v:10} -> {parsed}")

import math
print(math.isnan(float("nan")))
print(math.isinf(float("inf")))
```
**Line-by-line explanation:**
- Each string is parsed directly by `float()`, including scientific notation and IEEE 754 special values.
- `math.isnan()` / `math.isinf()` are the correct, safe ways to check for these special values afterward (recall from Module 1, Topic 4 that `nan == nan` is `False`).

**Expected Output:**
```
6.022e23   -> 6.022e+23
1.5E-3     -> 0.0015
inf        -> inf
-inf       -> -inf
nan        -> nan
True
True
```
**Why:** This shows `float()`'s full parsing power, useful in scientific/statistical data contexts where exponential notation and special values are common.

---

### 4.3 Advanced Example — Cleaning Real-World Formatted Numbers
```python
raw_prices = ["$1,200.50", "45.5%", "  99.99  ", "€250,00", "invalid"]

def smart_float(value):
    cleaned = (value.replace("$", "")
                     .replace("€", "")
                     .replace(",", "")
                     .replace("%", "")
                     .strip())
    try:
        return float(cleaned)
    except ValueError:
        return None

results = [smart_float(v) for v in raw_prices]
print(results)
```
**Line-by-line explanation:**
- Each currency/percent symbol and comma is manually stripped before attempting `float()` conversion, since `float()` itself doesn't understand these formats.
- `try/except` catches any string that's still invalid after cleaning (e.g., `"invalid"`, and note `"€250,00"` becomes `"25000"` here since the European decimal-comma convention isn't distinguished from a thousands separator by this simple cleaning — a reminder that locale-aware parsing sometimes needs more sophisticated logic).

**Expected Output:**
```
[1200.5, 45.5, 99.99, 25000.0, None]
```
**Why:** This demonstrates why `float()` is deliberately "dumb" about symbols and locale — real-world formatted numbers require the programmer to explicitly decide how to interpret ambiguous formatting (like whether a comma means "thousands" or "decimal") before calling `float()`.

---

### 4.4 Real-World Project Example — Converting a Messy Price Column in pandas
```python
import pandas as pd

df = pd.DataFrame({
    'product': ['A', 'B', 'C', 'D'],
    'price_raw': ['$19.99', '$1,250.00', '45.50', 'contact us']
})

def clean_price(value):
    cleaned = value.replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None

df['price_clean'] = df['price_raw'].apply(clean_price)

print(df)
print(f"\nAverage price: {df['price_clean'].mean():.2f}")
print(f"Rows needing review: {df['price_clean'].isna().sum()}")
```
**Line-by-line explanation:**
- `clean_price()` strips currency formatting, then attempts `float()` conversion, returning `None` for genuinely non-numeric entries like `"contact us"`.
- `.apply()` runs this across the whole column.
- `.mean()` automatically ignores `NaN` values (pandas' default behavior for `None`/`NaN` in numeric columns) when calculating the average.

**Expected Output (example):**
```
  product   price_raw  price_clean
0       A      $19.99        19.99
1       B   $1,250.00      1250.00
2       C       45.50        45.50
3       D  contact us          NaN

Average price: 438.50
Rows needing review: 1
```
**Why:** This is the standard, professional real-world pattern for cleaning currency-formatted text columns — a task nearly every data analyst performs regularly when working with sales, pricing, or financial data.

---

## 5. Real-World Applications

| Domain | How `float()` Is Used |
|---|---|
| **Data Analysis** | Converting price, percentage, and measurement columns from text to decimals |
| **Data Science** | Parsing scientific notation values from sensor/experimental data |
| **Machine Learning** | Converting feature values from raw text/JSON into usable floats for models |
| **Business Analytics** | Cleaning currency-formatted revenue/cost figures from reports |
| **Finance** | Parsing interest rates, exchange rates, and transaction amounts from various formats |
| **Healthcare** | Converting lab measurement values (often in scientific notation) for analysis |
| **Marketing** | Parsing click-through rates and cost-per-click values from ad platform exports |
| **AI** | Parsing model confidence scores and probability outputs |
| **Automation** | Converting sensor threshold values from configuration files |
| **Dashboards** | Converting filter/input values into usable numeric ranges |
| **ETL Pipelines** | Standardizing numeric formats across multiple, differently-formatted data sources |

**How Big Tech Uses This Concept**
- **Google**: Ad-auction and analytics systems parse bid amounts and metrics that often arrive in varied text formats, requiring careful `float()`-based cleaning.
- **Amazon**: Third-party seller pricing data arrives in wildly inconsistent currency formats, requiring explicit cleaning before `float()` conversion, exactly as shown above.
- **Netflix**: Streaming quality/bitrate metrics are often logged with scientific notation, parsed with `float()` during analysis.
- **Uber**: Fare and distance calculations parse raw text values from multiple regional systems with different currency/decimal formatting conventions.
- **Spotify**: Audio feature scores (e.g., energy, danceability) are floats parsed from provider APIs, sometimes in scientific notation for very small values.
- **Microsoft**: Excel's `VALUE()` function and general numeric cell parsing mirror `float()`'s behavior — accepting scientific notation but not currency symbols without cleanup.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Always strip currency symbols, thousands separators, and percent signs **manually** before calling `float()` — it won't do this for you.
- Wrap `float()` calls on external/untrusted data in `try/except` to catch `ValueError`.
- Use `math.isnan()` / `math.isinf()` (or pandas' `.isna()`) to safely check for special values after parsing — never use `==`.
- For vectorized, safe conversion of an entire pandas column, prefer `pd.to_numeric(series, errors='coerce')` over row-by-row `.apply(float)`.

### Performance Tips
- `float()` on a single value is fast; avoid redundant repeated parsing of the same string in loops.
- For large-scale cleaning, combine string cleaning (`.str.replace()`) and numeric conversion (`pd.to_numeric()`) using pandas' vectorized string methods rather than Python-level loops.

### Clean Code Recommendations
```python
# Bad — will crash on the first currency-formatted or invalid string
values = [float(v) for v in raw_prices]

# Good — cleans and defends against invalid input
def safe_float(v):
    cleaned = v.replace("$", "").replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None

values = [safe_float(v) for v in raw_prices]
```

### Common Beginner Mistakes
1. Assuming `float()` can parse currency-formatted strings directly (`float("$19.99")` fails).
2. Not realizing `float()` accepts `"inf"` and `"nan"` as valid strings, and being confused when these appear unexpectedly in "cleaned" data.
3. Forgetting that European-style decimal commas (`"45,50"` meaning 45.50) will be misparsed if naively stripped as thousands separators.
4. Comparing parsed `nan` values with `==` and getting unexpected `False` results.

### Common Interview Mistakes
- Not knowing that `float()` understands scientific notation directly (`float("1e3")` → `1000.0`).
- Not being aware that `float()` accepts `"inf"`/`"nan"` as valid input strings.
- Forgetting that currency symbols and thousands separators must be stripped manually — `float()` does not handle locale-specific formatting.

### Debugging Tips
- If `float()` raises `ValueError` unexpectedly, use `repr(value)` to reveal hidden symbols, whitespace, or formatting characters.
- If a "cleaned" numeric column contains unexpected `inf` or `nan` values, check whether the raw source data literally contained the strings `"inf"` or `"nan"` (perhaps from a spreadsheet formula error) before your cleaning step ran.
- Use `pd.to_numeric(series, errors='coerce')` combined with `.isna()` to quickly locate which specific values failed conversion in a large column.

### Things to Avoid
- Avoid assuming `float()` will handle currency symbols, percent signs, or thousands separators automatically.
- Avoid using `==` to check for `nan` after parsing — always use `math.isnan()` or pandas' `.isna()`.
- Avoid naively stripping commas from all numeric strings without considering whether the source data might use European decimal-comma formatting.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `ValueError: could not convert string to float: '$19.99'` | Currency symbol not stripped before conversion | Manually `.replace("$", "")` before calling `float()` |
| `ValueError: could not convert string to float: '1,200.50'` | Thousands-separator comma not stripped | Manually `.replace(",", "")` before calling `float()` |
| `ValueError: could not convert string to float: ''` | Empty string passed to `float()` | Check for empty strings before conversion, or handle in `try/except` |
| Unexpected `nan`/`inf` appearing in "cleaned" data | Source data literally contained the text `"nan"`/`"inf"`, which `float()` parses successfully as special values | Investigate the source data; decide whether these should be treated as missing/invalid instead |
| `TypeError: float() argument must be a string or a real number, not 'NoneType'` | Trying to convert `None` directly | Check `if value is not None:` before converting, or catch `TypeError` |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What does `float("3.14")` return?
2. Does `float()` require a decimal point in the input string? Test with `float("42")`.
3. What does `float(True)` return?

### Intermediate Questions
4. Why does `float("$19.99")` raise a `ValueError`? How would you fix it?
5. What does `float("1e3")` return, and why?
6. What are `inf` and `nan`, and can `float()` parse them directly from strings?

### Advanced Questions
7. Why doesn't `float()` accept a `base` parameter the way `int()` does?
8. How would you safely parse a price column that mixes US-style (`"1,200.50"`) and possibly European-style (`"1.200,50"`) number formatting?
9. Why is comparing `float("nan") == float("nan")` always `False`, and how should you check for NaN instead?

### Scenario-Based Questions
10. A "revenue" column fails to convert with `float()` because some values are formatted as `"$45,000.00"`. Walk through your cleaning approach.
11. After cleaning a numeric column, you notice a few rows show `inf` instead of a normal number. What would you investigate first?

### Coding Exercises
```python
# Exercise 1: Write a function that safely converts a currency-formatted 
# string (e.g., "$1,234.56") to a clean float, handling invalid input.

# Exercise 2: Given a list of strings including some in scientific 
# notation (e.g., "2.5e4"), convert them all to floats and print the 
# results in standard decimal form using formatting.

# Exercise 3: Write a function that detects whether a string, once 
# converted with float(), represents inf, -inf, or nan, and returns a 
# descriptive label instead of the raw float.
```

### Interview Q&A
**Q: Why does `float("$19.99")` raise a `ValueError`?**
A: `float()` only parses strings that represent a valid, unambiguous numeric format in base 10 — digits, an optional sign, an optional decimal point, and optional scientific notation. Currency symbols like `$` are not part of any numeric format `float()` recognizes, so they must be manually stripped from the string before conversion.

**Q: Can `float()` parse scientific notation directly, and why is this useful?**
A: Yes — `float("1.5e3")` correctly parses to `1500.0`. This is especially useful in scientific and engineering data contexts, where extremely large or small numbers are naturally expressed in exponential notation (e.g., `"6.022e23"` for Avogadro's number), avoiding the need for manual parsing logic.

**Q: Why doesn't `float()` have a `base` parameter like `int()` does?**
A: The concept of an alternate "base" applies naturally to whole numbers (binary, octal, hex representations of integers), but floating-point numbers are conventionally always expressed and interpreted in base 10 — there isn't a standard, unambiguous way to express a fractional value in, say, base 16 the way there is for integers, so Python's `float()` simply doesn't offer this parameter.

---

## 9. Mini Project / Assignment

**Task: "Universal Price Cleaner"**

1. Create a list of at least 8 raw price/measurement strings covering: plain decimals, currency-formatted (`$`, `,`), percent-formatted, scientific notation, whitespace-padded, and at least one genuinely invalid entry.
2. Write a function `universal_float(value)` that:
   - Strips common symbols (`$`, `,`, `%`) and whitespace
   - Attempts `float()` conversion
   - Returns `None` for anything unconvertible
3. Apply this across your list and print a before/after report.
4. Bonus: Add handling so that if the cleaned value equals `"inf"`, `"-inf"`, or `"nan"` (i.e., the source data literally contained these words), the function returns `None` instead of a special float value, since these likely represent bad/error data rather than legitimate infinities.

**Deliverable:** A `.py` script with comments explaining each cleaning decision.

---

## 10. Quick Revision

### Key Points
- `float()` converts `str`, `int`, or `bool` to a floating-point number; with no arguments, it returns `0.0`.
- Unlike `int()`, `float()` has **no `base` parameter**.
- `float()` can parse scientific notation (`"1e3"`) and special IEEE 754 values (`"inf"`, `"nan"`) directly from strings.
- `float()` does **NOT** understand currency symbols, thousands separators, or percent signs — these must be stripped manually first.
- Always use `math.isnan()`/`math.isinf()` (or pandas' `.isna()`) to check for special values — never `==`.

### Important Syntax
```python
float()                  # 0.0
float("3.14")              # str -> float
float(42)                    # int -> float
float(True)                    # bool -> float
float("1e3")                     # scientific notation -> 1000.0
float("inf")                       # special value -> inf
float("nan")                         # special value -> nan
value.replace("$", "").replace(",", "")   # manual cleaning before float()
```

### Cheat Sheet / Summary Table

| Input | Example | Result |
|---|---|---|
| Clean decimal string | `float("3.14")` | `3.14` |
| Whole-number string | `float("42")` | `42.0` |
| Scientific notation | `float("1.5e3")` | `1500.0` |
| Currency-formatted | `float("$19.99")` | `ValueError` (must clean first) |
| Special value | `float("nan")` | `nan` |
| Boolean | `float(True)` | `1.0` |
| Empty string | `float("")` | `ValueError` |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Strip `$`, `,`, `%` manually before `float()` | Assume `float()` handles currency/percent formatting |
| Use `math.isnan()`/`.isna()` to check for NaN | Use `==` to compare NaN values |
| Use `try/except` for untrusted string input | Assume all "numeric-looking" strings will convert cleanly |
| Use `pd.to_numeric(errors='coerce')` for large columns | Loop with `.apply(float)` on large datasets when a vectorized option exists |

---

## 11. Further Reading

- [Python Official Docs — `float()` Built-in Function](https://docs.python.org/3/library/functions.html#float)
- [Python Official Docs — Floating Point Arithmetic: Issues and Limitations](https://docs.python.org/3/tutorial/floatingpoint.html)
- [Python `math` module documentation](https://docs.python.org/3/library/math.html)
- [Pandas Documentation — `pd.to_numeric()`](https://pandas.pydata.org/docs/reference/api/pandas.to_numeric.html)
