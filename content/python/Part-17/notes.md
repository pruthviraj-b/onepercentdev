# Module 2 — Type Casting
## Topic 7: Common Conversion Errors

---

## 0. Prerequisites

- Module 2, Topic 1: **Implicit Conversion**
- Module 2, Topic 2: **Explicit Conversion**
- Module 2, Topics 3–6: **int(), float(), str(), bool()**

---

## 1. Concept Overview

**Simple Definition**
**Common conversion errors** are the recurring, predictable ways type-casting operations fail in Python — primarily `ValueError` and `TypeError` — along with the specific messy real-world data patterns (currency symbols, mixed types, missing values) that cause them. This topic consolidates and systematizes everything learned across Topics 1–6 into a single diagnostic reference.

**Why This Topic Exists**
Every topic so far has shown individual conversion pitfalls in isolation. In real data analysis work, these errors show up **mixed together, unpredictably, across thousands of rows** — a single messy CSV column might contain currency strings, missing values, decimal-formatted text, and outright garbage all at once. This topic exists to build a **systematic, professional approach** to anticipating, diagnosing, and fixing conversion errors at scale.

**Why It Is Important**
- Type conversion errors are, by a wide margin, the **most common category of bugs** encountered when first loading and cleaning real-world data.
- Knowing the exact error type (`ValueError` vs `TypeError`) and its precise cause dramatically speeds up debugging.
- This is a heavily tested interview area — being able to reason clearly about *why* a conversion fails (not just *that* it fails) signals real proficiency.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Recognize and correctly diagnose the most common conversion-related exceptions.
2. Understand the typical messy real-world data patterns that trigger each error.
3. Apply a consistent, professional strategy for defensive conversion at scale (single values and vectorized pandas columns).
4. Build reusable, safe conversion utility functions for a data analysis codebase.
5. Debug conversion errors efficiently using systematic diagnostic techniques.

**Where It Is Used in Real Projects**
- The very first stage of nearly every data analysis project: loading and cleaning raw source data
- Building shared, reusable "safe conversion" utility functions for a team's codebase
- Diagnosing why a pandas pipeline crashes partway through processing
- Writing data validation layers for ETL pipelines that must fail gracefully, not catastrophically

---

## 2. In-Depth Explanation

### 2.1 Core Concept: The Two Main Exception Types

Nearly all conversion errors in Python fall into one of two categories:

| Exception | Meaning | Typical Cause |
|---|---|---|
| **`ValueError`** | The type is *compatible*, but the *content* can't be parsed | `int("abc")`, `float("$5")` |
| **`TypeError`** | The type itself is *fundamentally incompatible* for the conversion | `int(None)`, `int([1,2])` |

This distinction, first introduced across Topics 3–6, is the foundation of efficient debugging: **`ValueError` means "fix the string's content"; `TypeError` means "this value's type doesn't belong here at all."**

```python
try:
    int("abc")
except ValueError as e:
    print(f"ValueError: {e}")     # content problem — "abc" isn't a valid number

try:
    int(None)
except TypeError as e:
    print(f"TypeError: {e}")       # type problem — None can't be interpreted as a number at all
```

### 2.2 Internal Working: A Taxonomy of Real-World Conversion Error Sources

Based on everything covered in Topics 1–6, real-world conversion errors almost always trace back to one of these patterns:

**Pattern 1 — Formatting characters `float()`/`int()` don't understand:**
```python
# float("$1,200.50")   # currency symbol + thousands separator
# float("45.5%")         # percent sign
```

**Pattern 2 — Decimal points passed to `int()`:**
```python
# int("42.0")   # int() cannot parse a decimal point directly
```

**Pattern 3 — Missing/null values reaching a conversion function:**
```python
# int(None)      # TypeError
# float(None)     # TypeError
```

**Pattern 4 — Genuinely invalid/non-numeric text:**
```python
# int("contact us")   # ValueError
```

**Pattern 5 — Whitespace or hidden characters (usually handled automatically, but not always):**
```python
print(int("  42  "))     # OK — int()/float() strip normal whitespace
# int("42\t\n extra")     # may still fail if there's trailing non-whitespace content
```

**Pattern 6 — The `bool(string)` trap (a "silent" error — no exception, just wrong logic):**
```python
print(bool("False"))    # True — no exception raised, but logically incorrect!
```
This last pattern is uniquely dangerous because it **doesn't raise an error at all** — it just silently produces the wrong result, making it harder to detect than the exception-raising patterns above.

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Exception** | An object Python raises to signal that something went wrong during execution |
| **`ValueError`** | Raised when a function receives an argument of the correct type but an inappropriate value |
| **`TypeError`** | Raised when an operation is applied to an object of an inappropriate type |
| **Silent Failure** | A bug that produces a wrong result without raising any error (e.g., the `bool()` trap) |
| **Fail Fast** | A design principle: prefer raising a clear, immediate error over silently continuing with bad data |
| **`errors='coerce'`** | pandas' pattern for converting problematic values to `NaN`/`NaT` instead of raising an exception |
| **Data Validation Layer** | A dedicated step in a pipeline whose sole purpose is catching and handling conversion issues before they propagate |

### 2.4 Key Rules & Behavior

**Rule 1 — Always distinguish `ValueError` from `TypeError` when catching exceptions, since they often require different fixes:**
```python
def safe_convert(value):
    try:
        return float(value)
    except ValueError:
        return None                # bad content — genuinely invalid number
    except TypeError:
        return None                # bad type — e.g., None, a list, etc.
```
(Here both are handled the same way for simplicity, but in more advanced code, you might log them differently, since they indicate different root causes.)

**Rule 2 — Catch multiple exception types together when the handling is identical:**
```python
try:
    result = int(value)
except (ValueError, TypeError):
    result = None
```

**Rule 3 — In pandas, prefer `errors='coerce'` over `.astype()` for any column sourced from messy external data:**
```python
df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
```

**Rule 4 — Always clean formatting characters (currency, percent, thousands separators) BEFORE attempting numeric conversion:**
```python
def clean_numeric_string(s):
    return s.replace("$", "").replace(",", "").replace("%", "").strip()
```

**Rule 5 — Never assume a "successful" conversion is also a *correct* one — always sanity-check for silent logic errors like the `bool()` string trap:**
```python
# This "succeeds" but is WRONG:
is_active = bool(row['status_text'])   # any non-empty string is True!

# This is CORRECT:
is_active = row['status_text'].strip().lower() == 'active'
```

### 2.5 Why It Works This Way

Python's exception system is designed around the principle of **failing loudly and specifically** rather than failing silently or vaguely — a `ValueError` vs. `TypeError` distinction gives the developer immediate, actionable information about *what kind* of problem occurred. This philosophy shapes how professional data cleaning code is written: rather than wrapping everything in a single broad `except:`, skilled developers catch specific exceptions deliberately, understanding exactly which real-world data patterns trigger each one.

---

## 3. Syntax & Usage

### 3.1 The Standard Defensive Conversion Pattern

```python
def safe_convert(value, target_type=float, default=None):
    try:
        return target_type(value)
    except (ValueError, TypeError):
        return default
```

### 3.2 Diagnostic Pattern — Finding All Problem Values in a Column

```python
import pandas as pd

def find_conversion_failures(series, target_type='numeric'):
    if target_type == 'numeric':
        converted = pd.to_numeric(series, errors='coerce')
    elif target_type == 'datetime':
        converted = pd.to_datetime(series, errors='coerce')
    
    failed_mask = converted.isna() & series.notna()   # failed conversion, but wasn't originally missing
    return series[failed_mask]
```

### 3.3 Full Exception Hierarchy Reference (Relevant Subset)

| Exception | When Raised in Conversion Context |
|---|---|
| `ValueError` | Invalid string content (`int("abc")`, `float("$5")`) |
| `TypeError` | Incompatible type (`int(None)`, `float([1,2])`) |
| `OverflowError` | Extremely rare — result too large to represent (mostly a `float`-to-C-type edge case) |
| `AttributeError` | Calling a string method on a non-string during pre-cleaning (e.g., `.strip()` on `None`) |

---

## 4. Practical Examples

### 4.1 Basic Example — Diagnosing `ValueError` vs `TypeError`
```python
test_values = ["42", "abc", None, 3.14, [1, 2]]

for v in test_values:
    try:
        result = int(v)
        print(f"{v!r:10} -> Success: {result}")
    except ValueError:
        print(f"{v!r:10} -> ValueError (bad content)")
    except TypeError:
        print(f"{v!r:10} -> TypeError (bad type)")
```
**Line-by-line explanation:**
- Each value is tested against `int()`, and the specific exception type is caught and reported separately.
- `"42"` and `3.14` succeed; `"abc"` fails with `ValueError` (wrong content); `None` and `[1, 2]` fail with `TypeError` (wrong type entirely).

**Expected Output:**
```
'42'       -> Success: 42
'abc'      -> ValueError (bad content)
None       -> TypeError (bad type)
3.14       -> Success: 3
[1, 2]     -> TypeError (bad type)
```
**Why:** This is the foundational diagnostic skill for this topic — quickly distinguishing "the type is wrong" from "the content is wrong" dramatically speeds up real debugging.

---

### 4.2 Intermediate Example — Building a Reusable Safe Conversion Utility
```python
def safe_numeric(value, default=None):
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace("$", "").replace(",", "").replace("%", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return default
    return default

test_data = [100, "1,250.50", "$45.00", "12%", None, "invalid", True]
results = [safe_numeric(v) for v in test_data]
print(results)
```
**Line-by-line explanation:**
- Handles `None` explicitly first (avoiding a `TypeError`).
- Handles already-numeric types directly (including `bool`, since `isinstance(True, int)` is `True` — from Module 1).
- For strings, cleans common formatting characters before attempting `float()`, catching `ValueError` for anything still invalid.

**Expected Output:**
```
[100.0, 1250.5, 45.0, 12.0, None, None, 1.0]
```
**Why:** This is a genuinely reusable, professional-grade utility function combining everything learned across Topics 1–6 — type checking, cleaning, safe conversion, and sensible defaults, all in one place.

---

### 4.3 Advanced Example — The Silent `bool()` Trap in a Larger Pipeline
```python
records = [
    {"name": "Alice", "active": "True"},
    {"name": "Bob", "active": "False"},
    {"name": "Carol", "active": ""},
]

# WRONG — silent logic error, no exception raised
for r in records:
    r["active_flag_wrong"] = bool(r["active"])

# CORRECT
for r in records:
    r["active_flag_correct"] = r["active"].strip().lower() == "true"

for r in records:
    print(r["name"], "-> wrong:", r["active_flag_wrong"], "| correct:", r["active_flag_correct"])
```
**Line-by-line explanation:**
- The "wrong" loop runs without any error at all — this is exactly why the `bool()` string trap is so dangerous: nothing alerts you that anything is wrong.
- Bob's `"active": "False"` incorrectly becomes `True` in the wrong version, but correctly becomes `False` in the fixed version.

**Expected Output:**
```
Alice -> wrong: True | correct: True
Bob -> wrong: True | correct: False
Carol -> wrong: False | correct: False
```
**Why:** This example is deliberately included to emphasize that **not all conversion errors raise exceptions** — some, like the `bool()` string trap, are silent logic bugs that require careful code review and testing to catch, since Python gives you no error message to work from.

---

### 4.4 Real-World Project Example — A Complete Data Validation Layer
```python
import pandas as pd

df = pd.DataFrame({
    'id': ['1', '2', '3', 'x', '5'],
    'price': ['$19.99', '45.00', 'call us', '12,500', None],
    'in_stock': ['yes', 'no', 'YES', '', 'no'],
})

# Step 1: Convert ID (should always be clean — use astype with error awareness)
df['id_clean'] = pd.to_numeric(df['id'], errors='coerce')

# Step 2: Convert price (expect messy formatting)
df['price_clean'] = (
    df['price']
    .astype(str)
    .str.replace('$', '', regex=False)
    .str.replace(',', '', regex=False)
)
df['price_clean'] = pd.to_numeric(df['price_clean'], errors='coerce')

# Step 3: Convert in_stock (avoid the bool() trap entirely)
df['in_stock_clean'] = df['in_stock'].str.strip().str.lower() == 'yes'

# Step 4: Validation report
print(df)
print("\n--- Validation Report ---")
print(f"Invalid IDs: {df['id_clean'].isna().sum()}")
print(f"Invalid prices: {df['price_clean'].isna().sum()}")
```
**Line-by-line explanation:**
- Each column gets a **dedicated, appropriate** conversion strategy based on its expected messiness.
- `id` uses `pd.to_numeric(errors='coerce')` for safety, even though it's "supposed" to be clean.
- `price` is explicitly cleaned of currency symbols and separators before numeric conversion.
- `in_stock` deliberately avoids `bool()` entirely, using content-based comparison instead.
- A final validation report summarizes exactly how many values failed conversion in each column — essential for real-world data quality tracking.

**Expected Output (example):**
```
  id     price in_stock  id_clean  price_clean  in_stock_clean
0  1    $19.99      yes       1.0        19.99            True
1  2     45.00       no       2.0        45.00           False
2  3   call us      YES       3.0          NaN            True
3  x    12,500                NaN     12500.00           False
4  5      None       no       5.0          NaN           False

--- Validation Report ---
Invalid IDs: 1
Invalid prices: 2
```
**Why:** This is the professional, end-to-end pattern for building a **data validation layer** — the first, essential step of nearly any real data analysis project, combining every conversion technique and error-avoidance strategy from this entire module.

---

## 5. Real-World Applications

| Domain | How Conversion Error Handling Is Used |
|---|---|
| **Data Analysis** | Building the first "data cleaning" stage of every analysis project |
| **Data Science** | Validating feature columns before model training to avoid silent garbage-in-garbage-out errors |
| **Machine Learning** | Data validation pipelines that reject or flag malformed training examples |
| **Business Analytics** | Producing data quality reports alongside every analysis (X% of rows had issues) |
| **Finance** | Rigorously validating monetary values, given the cost of silent errors in financial data |
| **Healthcare** | Extremely strict validation of clinical data, where silent conversion errors could have serious consequences |
| **Marketing** | Cleaning multi-source campaign data with wildly inconsistent formatting conventions |
| **AI** | Validating input data pipelines before it reaches model inference |
| **Automation** | Building robust scripts that don't crash on the first malformed input |
| **Dashboards** | Ensuring backend data feeding a dashboard doesn't silently break visualizations |
| **ETL Pipelines** | Comprehensive validation layers that log and quarantine bad records rather than crashing entire pipeline runs |

**How Big Tech Uses This Concept**
- **Google**: Large-scale data pipelines (e.g., BigQuery ingestion) include explicit schema validation and error-quarantine steps for malformed records, rather than failing entire batch jobs.
- **Amazon**: Seller-submitted product data goes through extensive validation layers, given the huge variety of formatting inconsistencies across millions of listings.
- **Netflix**: Data engineering pipelines log and monitor conversion failure rates as a first-class data quality metric, alerting engineers when failure rates spike unexpectedly.
- **Uber**: Real-time data pipelines must gracefully handle malformed sensor/GPS data without crashing critical, latency-sensitive systems.
- **Spotify**: Metadata ingestion from many content partners includes dedicated validation stages to catch and quarantine malformed entries before they reach the main catalog.
- **Microsoft**: Excel/Power Query's "Error" cells and error-handling steps in query pipelines directly mirror the `errors='coerce'` pattern — flagging problems without halting the entire process.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Always distinguish and handle `ValueError` and `TypeError` deliberately, rather than using a bare `except:`.
- Build a small library of reusable "safe conversion" utility functions for your team, rather than re-writing ad hoc try/except logic in every script.
- Prefer pandas' `errors='coerce'` pattern for any column sourced from external/messy data.
- Always produce a **validation report** (counts of failed conversions per column) as a standard part of any data cleaning pipeline — never clean data silently without visibility into what was lost or flagged.
- Specifically test for the `bool()` string trap in code review — it's silent and easy to miss.

### Performance Tips
- Use vectorized pandas methods (`pd.to_numeric`, `.str.replace`) for cleaning large columns instead of `.apply()` with Python-level loops.
- Batch-clean formatting characters (`$`, `,`, `%`) using chained `.str.replace()` calls before the final numeric conversion, rather than converting and re-converting repeatedly.

### Clean Code Recommendations
```python
# Bad — bare except hides the real problem and makes debugging harder
try:
    value = int(raw)
except:
    value = None

# Good — specific, informative exception handling
try:
    value = int(raw)
except (ValueError, TypeError) as e:
    value = None
    # optionally: log the failure with context, e.g. logging.warning(f"Failed to convert {raw!r}: {e}")
```

### Common Beginner Mistakes
1. Using a bare `except:` that silently swallows all errors, including unrelated bugs, making debugging much harder.
2. Not distinguishing `ValueError` from `TypeError`, missing valuable diagnostic information.
3. Assuming a successful conversion (no exception raised) automatically means the result is *logically correct* — missing the `bool()` string trap entirely.
4. Cleaning and converting the same column multiple times in different parts of a script instead of doing it once, early, and reusing the result.

### Common Interview Mistakes
- Not being able to give a clear, systematic answer to "how would you clean a messy numeric column?" — a very common interview question.
- Using a bare `except:` in live coding exercises, which experienced interviewers often flag as a red flag for production code quality.
- Not mentioning `errors='coerce'` when discussing pandas-based data cleaning at scale.

### Debugging Tips
- When a pipeline crashes on `.astype()`, immediately switch to `pd.to_numeric(errors='coerce')` temporarily to identify exactly which rows are problematic (`df[df['col'].isna()]` after coercion, filtered to rows that weren't originally missing).
- Build the habit of running `df['col'].apply(type).value_counts()` on any suspicious "object" dtype column early in a cleaning process (Module 1, Topic 9).
- For silent logic bugs like the `bool()` trap, write small unit tests with known inputs/expected outputs for any conversion function before trusting it on a full dataset.

### Things to Avoid
- Avoid bare `except:` clauses — always catch specific exceptions.
- Avoid assuming any single conversion function will handle all messy real-world formatting automatically — cleaning and conversion are usually separate, sequential steps.
- Avoid skipping a validation/reporting step after cleaning — always know how many values failed, and why, before proceeding with analysis.

---

## 7. Common Errors & Fixes

| Error / Symptom | Cause | Fix |
|---|---|---|
| `ValueError: could not convert string to float: '$19.99'` | Currency symbol not stripped before conversion | Clean formatting characters (`$`, `,`, `%`) before calling `float()` |
| `ValueError: invalid literal for int() with base 10: '9.5'` | Decimal-point string passed to `int()` | Use `int(float(value))` |
| `TypeError: int() argument must be a string...not 'NoneType'` | `None` passed directly into `int()`/`float()` | Check `if value is not None:` first, or catch `TypeError` |
| Data "converts successfully" but logic is wrong downstream | The `bool()` string trap — no exception, silent wrong result | Replace `bool(string)` with explicit content comparison |
| Entire pandas pipeline halts partway through | Used `.astype()` on a column with even one bad value | Switch to `pd.to_numeric(errors='coerce')` / `pd.to_datetime(errors='coerce')` |
| Bare `except:` masks the true source of a bug | Overly broad exception handling | Catch specific exceptions (`ValueError`, `TypeError`) only |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What is the difference between `ValueError` and `TypeError` in the context of type conversion?
2. What causes `int("42.5")` to fail?
3. Why is a bare `except:` generally considered bad practice?

### Intermediate Questions
4. How would you safely convert a messy numeric column in pandas without crashing on the first invalid value?
5. What is the `bool()` string trap, and why is it more dangerous than a normal exception-raising error?
6. Write a reusable function that safely converts a value to `float`, returning `None` on any failure.

### Advanced Questions
7. Design a complete data validation strategy for a DataFrame with three columns of varying messiness (a clean ID column, a currency-formatted price column, and a yes/no text column).
8. Why might `.astype()` be preferable to `pd.to_numeric(errors='coerce')` in some cases, despite the latter being "safer"?
9. How would you build a validation report that summarizes conversion failure rates across an entire messy dataset?

### Scenario-Based Questions
10. A colleague's script crashes with `TypeError: int() argument must be a string...not 'NoneType'` when processing a CSV. Walk through your diagnostic process.
11. After a "successful" data cleaning run with no errors, a downstream report shows implausibly high "active user" counts. What conversion issue would you suspect first, and how would you confirm it?

### Coding Exercises
```python
# Exercise 1: Write a robust safe_convert(value, target_type, default) 
# function that handles both ValueError and TypeError gracefully for 
# any target_type (int, float, or bool).

# Exercise 2: Given a messy DataFrame with a currency column and a 
# yes/no text column, build a complete cleaning pipeline plus a 
# validation report summarizing failure counts per column.

# Exercise 3: Write unit-test-style assertions that would have caught 
# the bool() string trap bug in the Advanced Example (4.3) before it 
# reached production.
```

### Interview Q&A
**Q: What's the difference between `ValueError` and `TypeError`, and why does distinguishing them matter in practice?**
A: `ValueError` means the input is the *correct type* but has *invalid content* (e.g., `int("abc")` — a string, but not a valid number). `TypeError` means the input is *fundamentally the wrong type altogether* (e.g., `int(None)` — `None` can never be meaningfully converted). Distinguishing them matters because the fix differs: a `ValueError` usually means "clean or validate the string content," while a `TypeError` usually means "check for `None`/wrong type earlier in the pipeline, before conversion is even attempted."

**Q: Why is a bare `except:` considered bad practice in conversion code?**
A: A bare `except:` catches **every** exception, including ones unrelated to the conversion itself (like a genuine bug, a `KeyboardInterrupt`, or a `MemoryError`), silently hiding real problems and making debugging significantly harder. Catching specific exceptions (`except (ValueError, TypeError):`) ensures you only suppress the errors you actually anticipated and understand, letting unexpected errors surface normally.

**Q: What is the "silent" conversion error discussed in this topic, and why is it more dangerous than errors that raise exceptions?**
A: It refers to the `bool()` string trap — calling `bool()` directly on a string like `"False"` returns `True` (since it only checks emptiness, not content), and this happens **without raising any exception at all**. It's more dangerous than exception-raising errors because there's no immediate signal that something went wrong — the bug can silently corrupt downstream logic (like flag columns or filters) and go undetected until someone notices implausible results much later.

---

## 9. Mini Project / Assignment

**Task: "Production-Grade Data Validation Layer"**

1. Create a DataFrame simulating a realistically messy dataset with at least 4 columns: a numeric ID column (mostly clean, a few bad values), a currency-formatted price column, a percentage-formatted column, and a yes/no text flag column.
2. Build a complete cleaning pipeline that:
   - Uses `pd.to_numeric(errors='coerce')` appropriately for numeric columns
   - Strips formatting characters before converting the price and percentage columns
   - Avoids the `bool()` trap entirely for the flag column, using explicit content comparison
3. Generate a **validation report** printed at the end, showing the count and percentage of failed conversions per column.
4. Bonus: Write a reusable `safe_convert()` utility function used consistently across the pipeline, demonstrating DRY (Don't Repeat Yourself) principles.

**Deliverable:** A `.py` script with comments explaining the validation strategy for each column.

---

## 10. Quick Revision

### Key Points
- Conversion errors fall into two main categories: **`ValueError`** (bad content, right type) and **`TypeError`** (wrong type entirely).
- Most real-world conversion failures trace back to: formatting characters, decimal points passed to `int()`, missing/`None` values, or genuinely invalid text.
- The **`bool()` string trap** is a uniquely dangerous **silent** logic error — it never raises an exception, so it requires deliberate testing/code review to catch.
- In pandas, prefer `errors='coerce'` for any column from messy external data, and always follow cleaning with a **validation report**.
- Never use a bare `except:` — always catch specific exceptions for clear, actionable debugging.

### Important Syntax
```python
try:
    value = int(raw)
except ValueError:
    ...   # bad content
except TypeError:
    ...   # bad type

def safe_convert(value, target_type=float, default=None):
    try:
        return target_type(value)
    except (ValueError, TypeError):
        return default

pd.to_numeric(series, errors='coerce')     # vectorized safe numeric conversion
pd.to_datetime(series, errors='coerce')    # vectorized safe datetime conversion
series.isna().sum()                          # count conversion failures
```

### Cheat Sheet / Summary Table

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ValueError` on numeric string | Formatting characters or decimal point | Clean string, or use `int(float(x))` |
| `TypeError` on numeric conversion | `None` or wrong type passed in | Check for `None`/type before converting |
| Pipeline halts mid-run | `.astype()` on messy column | Switch to `errors='coerce'` |
| No error, but flag logic is wrong | `bool()` string trap | Use explicit content comparison |
| Silent, hard-to-trace bug | Bare `except:` swallowing real errors | Catch specific exceptions only |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Catch specific exceptions (`ValueError`, `TypeError`) | Use a bare `except:` |
| Use `errors='coerce'` for messy pandas columns | Use `.astype()` blindly on untrusted data |
| Build a validation report after cleaning | Assume "no exception" means "correct result" |
| Test conversion functions against known edge cases | Trust a conversion function without testing the `bool()` trap and similar silent issues |

---

## 11. Further Reading

- [Python Official Docs — Built-in Exceptions](https://docs.python.org/3/library/exceptions.html)
- [Python Official Docs — Errors and Exceptions Tutorial](https://docs.python.org/3/tutorial/errors.html)
- [Pandas Documentation — `pd.to_numeric()`](https://pandas.pydata.org/docs/reference/api/pandas.to_numeric.html)
- [Pandas Documentation — Working with Missing Data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
