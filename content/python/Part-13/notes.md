# Module 2 — Type Casting
## Topic 3: `int()`

---

## 0. Prerequisites

- Module 1, Topic 3: **int**
- Module 2, Topic 1: **Implicit Conversion**
- Module 2, Topic 2: **Explicit Conversion** (this topic is a deep dive into one specific conversion function introduced there)

---

## 1. Concept Overview

**Simple Definition**
`int()` is Python's built-in **constructor function** used to explicitly convert a compatible value — a string, float, or boolean — into an integer. This topic goes beyond the basic usage shown in Topic 2 to cover `int()`'s full parameter set, edge cases, and number-base conversion capabilities in depth.

**Why This Topic Exists**
`int()` is one of the most frequently called conversion functions in data analysis — nearly every dataset loaded from a file arrives with numeric-looking values stored as text, and `int()` is the primary tool to convert them into usable whole numbers. It also has lesser-known but powerful capabilities (base conversion) that are frequently tested in interviews.

**Why It Is Important**
- Used constantly to convert IDs, counts, years, and other whole-number fields from raw text data.
- Has specific, sometimes surprising behavior (truncation vs. rounding, base conversion, whitespace handling) that must be understood precisely to avoid subtle bugs.
- A very common interview topic — especially the `base` parameter and the float-truncation behavior.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Use `int()` correctly across all its valid input types (str, float, bool).
2. Understand and use the `base` parameter to parse numbers in binary, octal, hexadecimal, and other bases.
3. Predict exactly when `int()` will succeed, when it will raise `ValueError`, and when it will raise `TypeError`.
4. Apply `int()` safely and defensively in real data-cleaning code.
5. Distinguish `int()`'s truncation behavior from rounding, and know when each is appropriate.

**Where It Is Used in Real Projects**
- Converting ID/count columns from CSV text to usable integers
- Parsing hexadecimal color codes or binary flags from configuration/log data
- Converting user-entered form values (always strings) into integers for calculations
- Truncating float results to whole numbers for display or indexing purposes

---

## 2. In-Depth Explanation

### 2.1 Core Concept: The Full Signature of `int()`

```python
int(x=0)                  # no-argument or single-argument form
int(x, base=10)            # two-argument form — ONLY valid when x is a string
```

`int()` has two distinct usage patterns:
1. **Single argument** (`int(x)`) — converts a number or numeric string using base 10 by default.
2. **Two arguments** (`int(x, base)`) — parses a **string** representing a number in a specified base (binary, octal, hex, or any base from 2 to 36).

```python
print(int())          # 0 — calling with no arguments returns 0
print(int("42"))      # 42
print(int(9.7))        # 9
print(int("1010", 2))  # 10 — parses "1010" as binary, returns decimal equivalent
```

### 2.2 Internal Working: How `int()` Handles Each Input Type

**From `str` (base 10, default):**
- Strips leading/trailing whitespace automatically.
- Accepts an optional leading `+` or `-` sign.
- Does NOT accept a decimal point, commas, or any non-digit characters.
- Accepts underscores as digit separators (Python 3.6+, matching numeric literal syntax).

```python
print(int(" 42 "))      # 42 — whitespace stripped
print(int("-15"))       # -15
print(int("1_000"))     # 1000 — underscore separator allowed
# print(int("42.0"))    # ValueError — decimal point not allowed
# print(int("42,000"))  # ValueError — comma not allowed
```

**From `float`:**
- Always **truncates toward zero** — removes the decimal part without rounding.

```python
print(int(9.99))     # 9
print(int(-9.99))    # -9  (NOT -10 — truncates toward zero, not "floor")
```

**From `bool`:**
- `True` → `1`, `False` → `0` (since `bool` is a subclass of `int`).

```python
print(int(True))     # 1
print(int(False))    # 0
```

**From `str` with a specified `base`:**
- Parses the string as a number in that base and returns its base-10 (decimal) equivalent.
- Valid bases: `2` to `36`, plus `0` (which tells Python to auto-detect the base from a prefix like `0x`, `0o`, `0b`).

```python
print(int("1010", 2))     # 10   — binary "1010" = decimal 10
print(int("17", 8))       # 15   — octal "17" = decimal 15
print(int("1A", 16))      # 26   — hexadecimal "1A" = decimal 26
print(int("0x1A", 0))     # 26   — base=0 auto-detects the "0x" hex prefix
print(int("ZZ", 36))      # 1295 — base 36 uses digits 0-9 and letters a-z
```

### 2.3 Important Terminology

| Term | Meaning |
|---|---|
| **Base (Radix)** | The number system a numeric string is expressed in (e.g., base 2 = binary, base 16 = hexadecimal) |
| **Truncation** | Discarding the fractional part of a number toward zero, without rounding |
| **Whitespace Tolerance** | `int()`'s automatic stripping of leading/trailing spaces from string input |
| **Digit Separator** | The underscore (`_`) used to visually group digits in numeric literals/strings (e.g., `"1_000"`) |
| **Auto-Detection (`base=0`)** | Letting `int()` infer the base from a string's prefix (`0x`, `0o`, `0b`) |
| **`ValueError`** | Raised when `int()` cannot parse the given string as a valid integer |
| **`TypeError`** | Raised when `int()` is given an incompatible type (e.g., `None`, a `list`) |

### 2.4 Key Rules & Behavior

**Rule 1 — The `base` parameter is ONLY valid when the first argument is a string:**
```python
print(int("10", 2))     # 10 -> works, "10" is a string
# print(int(10.5, 2))    # TypeError — base only works with string input
```

**Rule 2 — `int()` never rounds a float — it always truncates toward zero:**
```python
print(int(4.9))     # 4   (not 5)
print(int(-4.9))    # -4  (not -5, and not -4.9 floored to -5)
```
Compare this to `//` (floor division, Module 1, Topic 3), which rounds toward **negative infinity** — a subtly different behavior that trips up many learners.

**Rule 3 — Common bases have dedicated prefixes recognized when `base=0`:**

| Prefix | Base | Example |
|---|---|---|
| `0b` | Binary (2) | `int("0b101", 0)` → `5` |
| `0o` | Octal (8) | `int("0o17", 0)` → `15` |
| `0x` | Hexadecimal (16) | `int("0x1A", 0)` → `26` |

**Rule 4 — `int()` with no arguments returns `0`:**
```python
print(int())     # 0
```

**Rule 5 — `int()` raises `TypeError` (not `ValueError`) for fundamentally incompatible types:**
```python
# int(None)        # TypeError: int() argument must be a string, a bytes-like object or a real number, not 'NoneType'
# int([1, 2, 3])   # TypeError
```

### 2.5 Why It Works This Way

`int()`'s base-conversion capability exists because whole numbers are frequently represented in non-decimal systems in computing contexts — binary for bitwise flags, hexadecimal for colors/memory addresses, octal for file permissions. Rather than requiring a separate function for each base, Python's designers built a single, flexible `int()` constructor that generalizes across any base from 2 to 36, following the same logic humans use when reading numbers in any positional numeral system.

---

## 3. Syntax & Usage

### 3.1 Full Syntax

```python
int()                    # returns 0
int(x)                   # converts x (str, float, or bool) using base 10
int(x, base)              # parses string x as a number in the given base
```

| Parameter | Type | Required? | Description |
|---|---|---|---|
| `x` | `str`, `float`, `bool`, or omitted | No (defaults meaningfully) | The value to convert |
| `base` | `int` (2–36, or 0) | No — only valid when `x` is a `str` | The numeral system `x` is expressed in |

### 3.2 Common Variations

```python
int("42")            # 42          — basic string conversion
int(42.9)              # 42          — float truncation
int(True)              # 1           — bool conversion
int("42", 10)          # 42          — explicit base 10 (same as default)
int("2A", 16)           # 42          — hex string to decimal
int("0x2A", 0)          # 42          — auto-detected hex prefix
```

### 3.3 Common Errors from Misuse

```python
# int("42.0")        # ValueError — decimal point not allowed in base-10 string parsing
# int("abc")         # ValueError — not a valid number
# int(None)          # TypeError  — None is not convertible
# int("10", 2.5)     # TypeError  — base must be an int
```

---

## 4. Practical Examples

### 4.1 Basic Example
```python
age_str = "28"
age = int(age_str)

price = int(49.99)

is_member = int(True)

print(age, price, is_member)
```
**Line-by-line explanation:**
- `int("28")` → parses the clean numeric string into `28`.
- `int(49.99)` → truncates the float, discarding `.99`, giving `49`.
- `int(True)` → converts the boolean to its integer equivalent, `1`.

**Expected Output:**
```
28 49 1
```
**Why:** Demonstrates the three most common single-argument uses of `int()` — string parsing, float truncation, and boolean conversion.

---

### 4.2 Intermediate Example — Base Conversion
```python
binary_flag = "1101"
octal_permission = "755"
hex_color = "FF5733"

print(int(binary_flag, 2))
print(int(octal_permission, 8))
print(int(hex_color, 16))
```
**Line-by-line explanation:**
- `int("1101", 2)` → interprets `"1101"` as a binary number, converting it to its decimal equivalent.
- `int("755", 8)` → interprets `"755"` as an octal number (common in Unix file permission notation).
- `int("FF5733", 16)` → interprets the hex color code as a decimal integer.

**Expected Output:**
```
13
493
16733491
```
**Why:** This shows `int()`'s base-conversion capability, which is genuinely useful when working with binary flags, Unix permissions, or hex color/memory values commonly found in logs, configs, and low-level data.

---

### 4.3 Advanced Example — Truncation vs. Floor Division vs. Rounding
```python
value = -7.8

truncated = int(value)          # int() truncation
floored = value // 1             # floor division
rounded = round(value)           # standard rounding

print(f"int():    {truncated}")
print(f"floor //: {floored}")
print(f"round():  {rounded}")
```
**Line-by-line explanation:**
- `int(-7.8)` → truncates toward zero → `-7`.
- `-7.8 // 1` → floor division rounds toward **negative infinity** → `-8.0`.
- `round(-7.8)` → standard rounding to the nearest whole number → `-8`.

**Expected Output:**
```
int():    -7
floor //: -8.0
round():  -8
```
**Why:** This is a classic point of confusion — `int()`, `//`, and `round()` all produce **different** results for negative non-integer values, because they follow fundamentally different rules (truncate-toward-zero vs. floor-toward-negative-infinity vs. nearest-with-banker's-rounding). Choosing the wrong one silently introduces off-by-one bugs.

---

### 4.4 Real-World Project Example — Safely Parsing Mixed-Format ID Column
```python
import pandas as pd

df = pd.DataFrame({
    'raw_id': [' 1001 ', '1_002', '0x3E8', 'invalid', '1005.0']
})

def parse_id(value):
    value = value.strip()
    try:
        if value.lower().startswith('0x'):
            return int(value, 16)
        return int(value)
    except ValueError:
        try:
            return int(float(value))   # fallback for "1005.0"-style strings
        except ValueError:
            return None

df['clean_id'] = df['raw_id'].apply(parse_id)
print(df)
```
**Line-by-line explanation:**
- `parse_id()` first strips whitespace, then checks for a hex prefix (`0x`) and parses accordingly using `int(value, 16)`.
- If plain `int()` parsing fails (e.g., `"1005.0"` has a decimal point), it falls back to `int(float(value))` — the standard two-step approach for decimal-formatted numeric strings.
- Truly invalid entries (`"invalid"`) return `None` after both attempts fail.

**Expected Output (example):**
```
   raw_id  clean_id
0   1001       1001
1    1_002      1002
2    0x3E8      1000
3  invalid       NaN
4  1005.0       1005
```
**Why:** This demonstrates a realistic, defensive parsing function that handles the many "shapes" a numeric ID might take when arriving from inconsistent real-world sources — whitespace, underscores, hex notation, and decimal-formatted strings — using `int()`'s full range of capabilities plus a `float()` fallback.

---

## 5. Real-World Applications

| Domain | How `int()` Is Used |
|---|---|
| **Data Analysis** | Converting ID, count, and year columns from text to whole numbers |
| **Data Science** | Converting encoded categorical labels (as strings) into integer class indices |
| **Machine Learning** | Converting hyperparameter strings from config files into usable integers |
| **Business Analytics** | Parsing quantity/unit fields from raw exported reports |
| **Finance** | Converting whole-share counts, day counts for interest calculations |
| **Healthcare** | Parsing patient age, dosage unit counts from records |
| **Marketing** | Converting impression/click counts from raw log/report exports |
| **AI** | Parsing token IDs, converting binary/hex-encoded feature flags |
| **Automation** | Parsing configuration values (retry counts, timeouts) from text config files |
| **Dashboards** | Converting filter parameter strings from UI widgets into usable integers |
| **ETL Pipelines** | Standardizing ID fields across differently-formatted source systems (hex vs. decimal IDs) |

**How Big Tech Uses This Concept**
- **Google**: Log analysis pipelines frequently parse hexadecimal request IDs or binary flag fields using `int()` with a specified base.
- **Amazon**: Product/order ID fields arriving from different regional systems in different formats are normalized using `int()`-based parsing logic.
- **Netflix**: Video encoding metadata sometimes includes hex-encoded values (e.g., color profiles) parsed with `int(value, 16)`.
- **Uber**: Device/sensor logs may encode flags in binary or hex, requiring `int()` base conversion during processing.
- **Spotify**: Color codes for playlist art/theming (hex format) are parsed using `int(hex_str, 16)` in backend processing.
- **Microsoft**: Excel's `HEX2DEC()`, `BIN2DEC()`, `OCT2DEC()` functions are direct spreadsheet parallels to Python's `int(x, base)` base conversion.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Always wrap `int()` calls on external/untrusted data in `try/except` to catch `ValueError`/`TypeError`.
- Use `int(float(value))` as the standard two-step pattern for converting decimal-formatted strings.
- Use the `base` parameter explicitly and clearly when parsing non-decimal numeric strings — don't manually implement base conversion logic.
- Prefer `pd.to_numeric()` (Topic 2) for vectorized, safe conversion of entire pandas columns rather than looping with `int()`.

### Performance Tips
- `int()` on a single value is very fast; avoid unnecessary repeated conversions of the same value inside loops.
- For large-scale numeric parsing in pandas, vectorized functions (`pd.to_numeric()`) significantly outperform applying `int()` row-by-row via `.apply()`.

### Clean Code Recommendations
```python
# Bad — will crash on the first invalid or decimal-formatted string
values = [int(v) for v in raw_list]

# Good — defensive, handles both decimal-formatted and invalid strings
def safe_int(v):
    try:
        return int(v)
    except ValueError:
        try:
            return int(float(v))
        except (ValueError, TypeError):
            return None

values = [safe_int(v) for v in raw_list]
```

### Common Beginner Mistakes
1. Trying `int("42.0")` directly and being surprised by the `ValueError`.
2. Assuming `int(-7.8)` rounds to `-8` — it actually truncates to `-7`.
3. Passing a `base` argument when `x` is not a string (`int(10.5, 2)` → `TypeError`).
4. Forgetting that `int()` strips whitespace automatically, then adding unnecessary manual `.strip()` calls (harmless, but redundant).

### Common Interview Mistakes
- Not knowing that `int()` truncates toward zero, not toward negative infinity (confusing it with floor division).
- Not being aware of the `base` parameter and its use cases (binary/hex/octal parsing).
- Forgetting that `base=0` enables auto-detection of `0x`/`0o`/`0b` prefixes.

### Debugging Tips
- If `int()` raises `ValueError` unexpectedly, use `repr(value)` to check for hidden decimal points, whitespace, or non-numeric characters.
- If working with a column of IDs that mixes formats (decimal, hex), inspect a sample of unique values first (`df['col'].unique()`) before writing a single parsing strategy.
- Remember that `TypeError` (not `ValueError`) means the input type itself is fundamentally wrong (e.g., `None`, `list`) — check the type first with `type(value)`.

### Things to Avoid
- Avoid using `int()` directly on unvalidated external data without error handling.
- Avoid confusing `int()`'s truncation behavior with rounding — use `round()` explicitly if rounding is intended.
- Avoid manually writing custom base-conversion logic — `int(x, base)` already handles bases 2 through 36 robustly.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `ValueError: invalid literal for int() with base 10: '9.5'` | String contains a decimal point | Use `int(float("9.5"))` |
| `ValueError: invalid literal for int() with base 10: 'abc'` | String isn't a valid number at all | Use `try/except` and handle the failure explicitly |
| `TypeError: int() can't convert non-string with explicit base` | Passed a `base` argument with a non-string first argument | Only use `base` when `x` is a `str` |
| `TypeError: int() argument must be a string, a bytes-like object or a real number, not 'NoneType'` | Trying to convert `None` | Check `if value is not None:` before converting |
| Unexpected truncation instead of rounding | Assumed `int()` rounds; it actually truncates | Use `round()` explicitly if rounding (not truncation) is intended |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What does `int("42")` return?
2. What does `int(9.9)` return — does it round or truncate?
3. What does `int(True)` return?

### Intermediate Questions
4. How would you convert the binary string `"1010"` to its decimal equivalent using `int()`?
5. Why does `int("42.0")` raise a `ValueError`, and how would you fix it?
6. What is the difference between `int(-7.8)` and `-7.8 // 1`?

### Advanced Questions
7. Explain what `base=0` does when passed to `int()`, and give an example.
8. Why does `int()` raise `TypeError` for `None` but `ValueError` for `"abc"`? What's the practical difference?
9. How would you safely parse a column of IDs that mixes plain decimal strings and hex-prefixed strings (`"0x..."`)?

### Scenario-Based Questions
10. You're parsing a log file where flags are stored as binary strings (e.g., `"1011"`). How would you convert these to integers, and what would you watch out for regarding invalid entries?
11. A numeric ID column fails to convert with plain `int()` because some values are formatted like `"1005.0"`. How would you handle this without losing valid data?

### Coding Exercises
```python
# Exercise 1: Write a function that safely converts a string to an int, 
# falling back through: int() -> int(float()) -> None if both fail.

# Exercise 2: Given a list of hex color strings (e.g., "FF5733"), convert 
# each to its decimal integer equivalent using int() with base 16.

# Exercise 3: Write a function that takes a numeral-system prefix 
# ("0b", "0o", "0x") and a string, and returns the parsed integer using 
# int() with base=0.
```

### Interview Q&A
**Q: Does `int()` round or truncate when converting a float?**
A: It always **truncates toward zero** — it discards the decimal portion entirely without rounding. `int(9.9)` gives `9`, and `int(-9.9)` gives `-9` (not `-10`). If rounding is the intended behavior, `round()` must be used explicitly instead.

**Q: What does the `base` parameter of `int()` do, and what are its constraints?**
A: The `base` parameter tells `int()` to interpret its **string** argument as a number expressed in that numeral system (valid bases: 2 to 36, or 0 for auto-detection based on prefix). It is only valid when the first argument is a string — passing `base` alongside a `float` or other non-string argument raises a `TypeError`.

**Q: What's the difference between the `ValueError` and `TypeError` that `int()` can raise?**
A: `ValueError` occurs when the input is the *right type* (usually a string) but its *content* can't be parsed as a valid number (e.g., `int("abc")`). `TypeError` occurs when the input is fundamentally the *wrong type* for conversion altogether (e.g., `int(None)` or `int([1, 2])`) — no amount of "valid content" would fix a `TypeError`, since the type itself isn't convertible.

---

## 9. Mini Project / Assignment

**Task: "Multi-Format Numeric Parser"**

1. Create a list of raw string values simulating a messy real-world ID/flag column, including: a clean decimal string, a string with underscores (`"1_500"`), a hex-prefixed string (`"0x2A"`), a binary string with an explicit `base=2` use case, a decimal-formatted string (`"42.0"`), and an invalid string.
2. Write a function `parse_flexible_int(value)` that attempts, in order: plain `int()`, then `int(value, 16)` if it starts with `0x`, then `int(float(value))`, returning `None` if all attempts fail.
3. Apply this function across your list and print a before/after report.
4. Bonus: Add a short explanation (as a comment) of why `int()` truncates rather than rounds, and demonstrate the difference with one example using a negative float.

**Deliverable:** A `.py` script with comments explaining each parsing branch.

---

## 10. Quick Revision

### Key Points
- `int()` converts `str`, `float`, or `bool` to an integer; called with no arguments, it returns `0`.
- From a `float`, `int()` **truncates toward zero** — it never rounds.
- The optional `base` parameter (only valid for string input) parses numbers in any base from 2 to 36; `base=0` auto-detects `0x`/`0o`/`0b` prefixes.
- `int()` strips leading/trailing whitespace from strings automatically but does **not** accept decimal points, commas, or other non-digit characters (aside from underscores as separators).
- Raises `ValueError` for unparseable strings, and `TypeError` for fundamentally incompatible types like `None`.

### Important Syntax
```python
int()                  # 0
int("42")               # str -> int (base 10)
int(9.9)                 # float -> int (truncates) -> 9
int(True)                 # bool -> int -> 1
int("1010", 2)             # binary string -> decimal int
int("FF", 16)               # hex string -> decimal int
int("0x1A", 0)                # auto-detect base from prefix
```

### Cheat Sheet / Summary Table

| Input | Example | Result |
|---|---|---|
| Clean decimal string | `int("42")` | `42` |
| String with whitespace | `int(" 42 ")` | `42` |
| String with decimal point | `int("42.0")` | `ValueError` |
| Float | `int(9.9)` | `9` (truncated) |
| Negative float | `int(-9.9)` | `-9` (truncated toward zero) |
| Boolean | `int(True)` | `1` |
| Binary string, base=2 | `int("101", 2)` | `5` |
| Hex string, base=16 | `int("FF", 16)` | `255` |
| `None` | `int(None)` | `TypeError` |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `int(float(x))` for decimal-formatted strings | Try `int(x)` directly on strings with decimal points |
| Use the `base` parameter for non-decimal number strings | Manually implement custom base-conversion logic |
| Wrap `int()` in `try/except` for untrusted data | Assume all real-world "numeric" strings will convert cleanly |
| Use `round()` when rounding (not truncation) is intended | Assume `int()` rounds a float |

---

## 11. Further Reading

- [Python Official Docs — `int()` Built-in Function](https://docs.python.org/3/library/functions.html#int)
- [Python Official Docs — Numeric Literals (underscores, base prefixes)](https://docs.python.org/3/reference/lexical_analysis.html#numeric-literals)
- [Python Official Docs — Built-in Exceptions (`ValueError`, `TypeError`)](https://docs.python.org/3/library/exceptions.html)
