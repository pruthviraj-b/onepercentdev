# Part 23 — Comprehensions

## Connecting to Parts 15–22

You know the main collections — **lists** and **tuples** (**Parts 17–19**), **sets** (**Part 20**), **dictionaries** (**Parts 21–22**) — and how to loop (**Parts 15–16**). You often built data by **empty list + loop + `.append()`**, or by walking **`dict.items()`** and **`zip(...)`** (**Part 18**).

Comprehensions are the **short form** of that same idea: **one expression** builds a new **list**, **dict**, or **set**. They pair naturally with **`zip`** and **`enumerate`** from **Part 18** and with the **list-of-dicts** shape from **Part 22**. In many cases, a comprehension can replace the manual `for` loops you wrote with `Counter` and `defaultdict` (**Part 22**) — though those tools still win when the logic gets complex. Same logic as a loop — often **faster** and very common in real Python.

---

## What Is a Comprehension?

A comprehension is a concise, single-line syntax to create a new list (or dict, or set) by iterating over an existing iterable (list, tuple, string, range, dict, set) — optionally applying a transformation or a filter. It is a more readable and efficient alternative to traditional `for` loops and `map()`/`filter()`.

Before comprehensions, Python gave you two ways to build a new list from an existing one:

```python
items = [1, 2, 3, 4, 5]

# Option 1: loop + append — works, but 3 lines for a simple job
result = []
for x in items:
    result.append(x + 1)
print(result)   # [2, 3, 4, 5, 6]

# Option 2: map + lambda — one line, but hard to read
result = list(map(lambda x: x + 1, items))
print(result)   # [2, 3, 4, 5, 6]

# Option 3: list comprehension — one line, easy to read
result = [x + 1 for x in items]
print(result)   # [2, 3, 4, 5, 6]
```

All three produce the same output. The comprehension is **concise like `map`** but **readable like a loop**. That is why it was introduced.

---

## List Comprehension

### Examples

```python
# Syntax: [expression for item in iterable]

doubles = [n * 2 for n in range(1, 6)]
print(doubles)   # [2, 4, 6, 8, 10]

clean = [name.title() for name in ["rice", "dal", "oil"]]
print(clean)   # ['Rice', 'Dal', 'Oil']
```

The pattern: *what you want* first, then `for`, then *where items come from*.

---

## List Comprehension with Condition

```python
# Syntax: [expression for item in iterable if condition]

evens = [n for n in range(1, 11) if n % 2 == 0]
print(evens)   # [2, 4, 6, 8, 10]

prices = [50, 120, 200, 90]
high = [p for p in prices if p >= 100]
print(high)   # [120, 200]
```

### With if-else (Transformation, Not Filtering)

When **every** item becomes one of two values, put `if-else` **before** `for` (this is **not** filtering):

```python
# Syntax: [value_if_true if condition else value_if_false for item in iterable]

labels = ["even" if n % 2 == 0 else "odd" for n in range(1, 6)]
print(labels)   # ['odd', 'even', 'odd', 'even', 'odd']

marks = [40, 55, 30]
out = ["pass" if m >= 50 else "fail" for m in marks]
print(out)   # ['fail', 'pass', 'fail']
```

Note the difference:

| Syntax | Purpose | Position |
|--------|---------|----------|
| `[x for x in items if condition]` | **Filter** — include only matching items | `if` after `for` |
| `[a if condition else b for x in items]` | **Transform** — produce different values | `if-else` before `for` |

---

## Dictionary Comprehension

```python
# Syntax: {key_expr: value_expr for item in iterable}

squares = {n: n ** 2 for n in range(1, 6)}
print(squares)   # {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}

# With zip — from two lists (same pattern as Part 18 receipt / Part 21 prices)
items = ["Rice", "Dal", "Oil"]
prices = [450, 120, 210]

price_map = {item: price for item, price in zip(items, prices)}
print(price_map)   # {'Rice': 450, 'Dal': 120, 'Oil': 210}

# With filtering — keep only items above ₹150
premium = {item: price for item, price in zip(items, prices) if price > 150}
print(premium)   # {'Rice': 450, 'Oil': 210}
```

### With if-else (Transform the value)

```python
# Syntax: {key_expr: value_if_true if condition else value_if_false for item in iterable}

marks = {"Alice": 82, "Bob": 45, "Charlie": 91, "Dev": 38}
result = {name: "pass" if score >= 50 else "fail" for name, score in marks.items()}
print(result)   # {'Alice': 'pass', 'Bob': 'fail', 'Charlie': 'pass', 'Dev': 'fail'}
```

### With enumerate — index-based dict

In Part 18 you learned `enumerate()` gives you `(index, item)` pairs. It works inside comprehensions too:

```python
fruits = ["Apple", "Banana", "Cherry"]
index_map = {i: fruit for i, fruit in enumerate(fruits)}
print(index_map)   # {0: 'Apple', 1: 'Banana', 2: 'Cherry'}
```

### Inverting a Dictionary

```python
original = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in original.items()}
print(inverted)   # {1: 'a', 2: 'b', 3: 'c'}
```

**Caution:** If **two keys** had the **same value**, the inverted dict would **keep only one** of those keys (last one wins). Here every value is unique, so it is safe.

---

## Set Comprehension

```python
# Syntax: {expression for item in iterable}

names = ["Rice", "Dal", "Rava", "Oil", "Ragi"]
first_letters = {name[0] for name in names}
print(first_letters)   # {'R', 'D', 'O'}  (only one 'R' in the set)
```

Duplicates are automatically removed because it is a set.

### With if (Filter)

```python
# Syntax: {expression for item in iterable if condition}

numbers = [1, 2, 2, 3, 4, 4, 5, 6, 6]
even_unique = {n for n in numbers if n % 2 == 0}
print(even_unique)   # {2, 4, 6}
```

### With if-else (Transform)

```python
# Syntax: {value_if_true if condition else value_if_false for item in iterable}

scores = [82, 45, 91, 38, 67]
labels = {"pass" if s >= 50 else "fail" for s in scores}
print(labels)   # {'pass', 'fail'}
```

Only two unique labels exist, so the set has just two items.

---

## Nested Comprehension

A **flatten** example shows “two `for`s in one comprehension”:

```python
# Syntax: [expression for outer in iterable for inner in outer]

rows = [[1, 2], [3, 4]]
flat = [n for row in rows for n in row]
print(flat)   # [1, 2, 3, 4]
```

Read it left to right: *for each row, for each n in that row, keep n.*

If this feels hard to read, use a normal nested loop instead — same result, easier to follow.

### Deeper Nesting (e.g. multiplication table)

```python
table = [[i * j for j in range(1, 4)] for i in range(1, 4)]
print(table)   # [[1, 2, 3], [2, 4, 6], [3, 6, 9]]
```

---

## Readability Rule

Comprehensions are powerful, but readability always wins.

**Good — clear and concise:**

```python
evens = [n for n in range(10) if n % 2 == 0]
```

**Too complex — use a regular loop instead:**

```python
result = [transform(x) for group in data for x in group if validate(x) and x.active]
```

Better as a loop:

```python
result = []
for group in data:
    for x in group:
        if validate(x) and x.active:
            result.append(transform(x))
```

The rule: if a comprehension takes more than a few seconds to understand, rewrite it as a loop. Readable code is professional code.

---

## Why Comprehensions Are Faster

Comprehensions are not just cleaner — they are usually faster than equivalent loops with `.append()`.

```python
import time

size = 1_000_000

start = time.time()
squares_loop = []
for n in range(size):
    squares_loop.append(n ** 2)
loop_time = time.time() - start

start = time.time()
squares_comp = [n ** 2 for n in range(size)]
comp_time = time.time() - start

print(f"Loop: {loop_time:.4f}s")
print(f"Comprehension: {comp_time:.4f}s")
```

Comprehensions are faster because Python optimizes the internal loop — it avoids the overhead of calling `.append()` on every iteration and uses a dedicated bytecode instruction. For small lists the difference is negligible, but for large data it adds up.

---

## Real-World Example — Cleaning Catalog Data (DMart-style)

Same shape as **Part 22** — a **list of dictionaries** — but names and fields match your running story:

```python
raw_rows = [
    {"name": "  Rice ", "price": 450, "on_shelf": True},
    {"name": "Dal", "price": 120, "on_shelf": False},
    {"name": " Oil  ", "price": 210, "on_shelf": True},
    {"name": "Sugar", "price": 50, "on_shelf": True},
]

# Names of products that are on shelf, with whitespace fixed
on_shelf_names = [
    row["name"].strip().title()
    for row in raw_rows
    if row["on_shelf"]
]
print(on_shelf_names)
# ['Rice', 'Oil', 'Sugar']

# Lookup: clean name -> price (every row contributes)
price_by_name = {
    row["name"].strip().title(): row["price"]
    for row in raw_rows
}
print(price_by_name)
# {'Rice': 450, 'Dal': 120, 'Oil': 210, 'Sugar': 50}
```

Filtering rows, normalizing strings, building a **lookup dict** — same patterns you use for APIs and configs (**Part 22**), just with shop data.

---

## When to Use Comprehensions vs Loops

| Use Comprehensions When | Use Loops When |
|------------------------|----------------|
| Transforming data (mapping) | Complex multi-step logic |
| Filtering items | Side effects (printing, writing to files) |
| Building a new collection from existing data | Multiple conditions with different actions |
| The logic fits in one readable line | The body is more than a single expression |

---

## Where This Applies in Real Work

- **Data transformation:** `[row["price"] for row in products]` or `[user["name"] for user in api_response["users"]]` — same idea as the catalog example above.
- **Filtering records:** `[p for p in products if p["on_shelf"]]` or `active_users = [u for u in users if u["status"] == "active"]`.
- **Building lookup dictionaries:** `{p["sku"]: p["price"] for p in products}` or `user_by_id = {u["id"]: u for u in users}` — **Part 21–22** patterns, one line.
- **Data cleaning:** `[s.strip().title() for s in names if s.strip()]` — strip, normalize case, skip blanks.
- **AI/ML pipelines:** Feature extraction and preprocessing often use the same comprehension style.

---

## Practice Assignment

Given a list of numbers:

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20]
```

Use comprehensions to:

1. Create a list of squares: `[1, 4, 9, 16, ...]`
2. Filter only even numbers: `[2, 4, 6, 8, ...]`
3. Create a dict mapping each number to its square: `{1: 1, 2: 4, 3: 9, ...}`
4. Create a set of unique last digits: `{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}` (use `n % 10`)
5. Create a list of labels: `"even"` or `"odd"` for each number
6. Filter the dict to include only numbers whose square is greater than 50

Bonus: flatten this nested list into a single list using a comprehension:

```python
nested = [[1, 2], [3, 4, 5], [6], [7, 8, 9, 10]]
```

Save as `src/comprehensions.py`.

---

> **Next:** Part 24 — Functions. You now have all the data structures and tools. Next, we introduce the two ways to organize code in Python — procedural programming and OOP — and then dive into the first branch: functions.
