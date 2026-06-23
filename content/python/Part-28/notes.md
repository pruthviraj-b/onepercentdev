# Part 28 — Lambda + Functional Helpers

So far you've written functions with `def` — give them a name, write a body, call them later. But sometimes you need a tiny throwaway function — used once, does one thing, and giving it a name feels like overkill. That's what `lambda` is for.

Python also has three functional helpers — `map()`, `filter()`, and `reduce()`. They take a function and apply it to data. The function can be any callable — a `def` function, a built-in like `len`, or a lambda. But since these helpers often need a small one-off function, lambda is the most common pairing you'll see.

---

## What Is Lambda?

A `lambda` is an **anonymous (unnamed) function** that contains only a single expression. It's an expression itself (not a statement like `def`), which means it produces a value and can be used inline — inside another function call, inside a variable assignment, anywhere a value is expected.

- `def` is a keyword. A `def` block (e.g. `def square(x): ...`) is a **statement** — it creates a named function.
- `lambda` is a keyword. A `lambda` usage (e.g. `lambda x: x ** 2`) is an **expression** — it creates an unnamed function and produces a value on the spot.

---

## Why Lambda?

You want to sort employees by salary:

```python
employees = [
    {"name": "Charlie", "salary": 80000},
    {"name": "Alice", "salary": 95000},
    {"name": "Bob", "salary": 72000}
]
```

Without lambda — you write a whole function used only once:

```python
def get_salary(e):
    return e["salary"]

by_salary = sorted(employees, key=get_salary)
print(by_salary)
# [{'name': 'Bob', 'salary': 72000}, {'name': 'Charlie', 'salary': 80000}, {'name': 'Alice', 'salary': 95000}]
```

With lambda — inline, right where it's needed:

```python
by_salary = sorted(employees, key=lambda e: e["salary"])
print(by_salary)
# [{'name': 'Bob', 'salary': 72000}, {'name': 'Charlie', 'salary': 80000}, {'name': 'Alice', 'salary': 95000}]
```

**Lambda = unnamed, one-time-use, single-expression function.**

---

## Syntax

```
lambda parameters: expression
```

```python
square = lambda x: x ** 2
print(square(5))   # 25

# Same as:
def square(x):
    return x ** 2

print(square(5))   # 25
```

- No `def`, no name, no `return`
- Single expression only — no loops, no assignments, no multiple statements
- Ternary works: `lambda x: "even" if x % 2 == 0 else "odd"`

---

## Lambda with sorted(), min(), max()

```python
students = [("Alice", 85), ("Bob", 92), ("Charlie", 78)]

by_score = sorted(students, key=lambda s: s[1])
print(by_score)   # [('Charlie', 78), ('Alice', 85), ('Bob', 92)]

cheapest = min(employees, key=lambda e: e["salary"])
print(cheapest)   # {'name': 'Bob', 'salary': 72000}

highest = max(employees, key=lambda e: e["salary"])
print(highest)    # {'name': 'Alice', 'salary': 95000}
```

---

## map() — Transform Every Item

`map(function, iterable)` — takes a function and an iterable, applies the function to every item, and returns a new iterable with the transformed values. The output has the same number of items as the input.

**Without map (loop):**

```python
numbers = [1, 2, 3, 4, 5]
squared = []
for x in numbers:
    squared.append(x ** 2)
print(squared)   # [1, 4, 9, 16, 25]
```

**With map:**

```python
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
print(squared)   # [1, 4, 9, 16, 25]
```

`map()` returns a lazy object (not a list directly) — wrap with `list()` to see results.

**So why not just use a for loop always?** You can. A for loop can do everything `map()` does. But `map()` cannot do everything a for loop does:

```python
numbers = [1, 2, 3, 4, 5]

# for loop can break midway — map can't
for x in numbers:
    if x == 3:
        break
    print(x)   # 1, 2

# for loop can do multiple things per item — map can't
total = 0
for x in numbers:
    total += x
    print(f"Running total: {total}")
```

`map()` = one job only: take each item, apply one function, return new list. If you need anything beyond that (break, multiple steps, conditions) → use a for loop.

---

## filter() — Keep What Matches

`filter(function, iterable)` — takes a function and an iterable, tests each item with the function. If the function returns `True`, the item is kept. If `False`, it's removed. Output can be smaller than input. Also returns a lazy object — wrap with `list()`.

**Without filter (loop):**

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = []
for x in numbers:
    if x % 2 == 0:
        evens.append(x)
print(evens)   # [2, 4, 6, 8, 10]
```

**With filter:**

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)   # [2, 4, 6, 8, 10]
```

**Same idea as map:** `filter()` = one job only: test each item, keep or reject. A for loop can do more — like collect the rejected items separately, or stop early:

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# for loop can separate into two groups — filter can't
evens = []
odds = []
for x in numbers:
    if x % 2 == 0:
        evens.append(x)
    else:
        odds.append(x)
print(evens)   # [2, 4, 6, 8, 10]
print(odds)    # [1, 3, 5, 7, 9]
```

---

## reduce() — Collapse Into One Value

`reduce(function, iterable)` — takes a function (that accepts two arguments) and an iterable. It combines the first two items using the function, then takes that result and combines it with the next item, repeating until only one value remains.

**Without reduce (loop):**

```python
numbers = [1, 2, 3, 4, 5]
total = 0
for x in numbers:
    total += x
print(total)   # 15
```

**With reduce:**

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5]
total = reduce(lambda a, b: a + b, numbers)
print(total)   # 15
```

Must import from `functools`. For summing, use `sum()`. For finding largest/smallest, use `max()`/`min()`. Use `reduce()` only when no built-in does what you need.

---

## Quick Comparison

| | `map()` | `filter()` | `reduce()` |
|---|---------|------------|------------|
| **Does** | Transform each | Select matching | Combine all into one |
| **Output** | N items | ≤ N items | 1 value |
| **Import?** | No | No | Yes (`functools`) |

Pipeline example:

```python
from functools import reduce

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

evens = filter(lambda x: x % 2 == 0, numbers)
squared = map(lambda x: x ** 2, evens)
total = reduce(lambda a, b: a + b, squared)
print(total)   # 220
```

---

## Comprehensions vs map/filter

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8]

# map + filter approach
result = list(map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, numbers)))
print(result)   # [4, 16, 36, 64]

# Comprehension — same result, cleaner
result = [x ** 2 for x in numbers if x % 2 == 0]
print(result)   # [4, 16, 36, 64]
```

**When to use what:**
- Lambda shines with `key=` in `sorted()`, `min()`, `max()`
- Comprehensions are cleaner for transforming/filtering lists
- `map()`/`filter()` make sense when you already have a named function (like `str.upper`)

---

## Practice

```python
students = [
    {"name": "Alice", "score": 85, "grade": "B"},
    {"name": "Bob", "score": 92, "grade": "A"},
    {"name": "Charlie", "score": 45, "grade": "F"},
    {"name": "Diana", "score": 78, "grade": "C"},
    {"name": "Eve", "score": 95, "grade": "A"},
    {"name": "Frank", "score": 62, "grade": "D"}
]
```

1. `sorted()` + `lambda` — sort by score (highest first)
2. `sorted()` + `lambda` — sort alphabetically by name
3. `filter()` — students with score >= 70
4. `map()` — extract just the names
5. Rewrite 3 and 4 using list comprehensions

---

> **Next:** Part 29 — Modules and Imports.
