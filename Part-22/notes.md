# Part 22 — Dictionaries Part 2 (Advanced Patterns)

## Connecting to Part 21

**Part 21** gave you the core dictionary operations: **key → value**, `**get` vs `[]`**, **add/update/remove**, `**in` on keys**, and `**.items()`**.

But to make the connection to the real world crystal clear: **If Part 21 was how we represent one database row (one dictionary), Part 22 is about how we represent an entire database table (a list of dictionaries) and how we ship that data across the internet (JSON).**

This part adds exactly what you see in production backends every day: **nested** dicts (dicts inside dicts), **lists of dicts** (API/DB shape), `**Counter`** and `**defaultdict**`, **merging** dicts, and the all-important `**json`** module.

---

## Nested Dictionaries

Dictionaries can contain other dictionaries as values. If a flat dictionary is a single row in a database, a nested dictionary is a row that contains an entire sub-document (like a NoSQL / MongoDB document).

```python
user = {
    "name": "Dev",
    "age": 28,
    "address": {
        "city": "Bangalore",
        "state": "Karnataka",
        "pin": "560001"
    },
    "skills": ["Python", "Django", "FastAPI"]
}
```

### Accessing Nested Values

```python
print(user["address"]["city"])       # Bangalore
print(user["address"]["state"])      # Karnataka
print(user["skills"][0])             # Python
```

Each level is accessed with another bracket.

### Modifying Nested Values

```python
user["address"]["city"] = "Mysore"
user["skills"].append("React")

print(user["address"]["city"])   # Mysore
print(user["skills"])            # ['Python', 'Django', 'FastAPI', 'React']
```

### Safe Nested Access

When accessing nested data, any missing key in the chain causes a `KeyError`:

```python
print(user["address"]["country"])   # KeyError: 'country'
```

Use `.get()` at each level:

```python
country = user.get("address", {}).get("country", "Not specified")
print(country)   # Not specified
```

The first `.get("address", {})` returns the address dict or an empty dict if missing. The second `.get("country", "Not specified")` safely accesses within that result.

**Shallow copy reminder:** If you `copy()` a dict that **holds nested dicts**, the **outer** dict is copied but the **inner** dicts are still **shared** — same issue as shallow copies of lists with nested lists (**Part 17**).

```python
import copy

original = {
    "name": "Dev",
    "address": {"city": "Bangalore", "pin": "560001"}
}

shallow = original.copy()
shallow["address"]["city"] = "Mysore"
print(original["address"]["city"])   # Mysore — original changed too!

deep = copy.deepcopy(original)
deep["address"]["city"] = "Chennai"
print(original["address"]["city"])   # Mysore — original is safe this time
```

`.copy()` only duplicates the **top-level** dictionary. The nested `"address"` dict inside is still the **same object** in both `original` and `shallow`. `copy.deepcopy()` recursively copies **every level** — so changes to `deep` never affect `original`. Use `deepcopy` when your dict contains nested mutable objects (dicts, lists) and you need a truly independent copy.

---

## Working with a List of Dictionaries

Real data often arrives as a list of dictionaries — each dictionary is one record:

```python
students = [
    {"name": "Alice", "score": 85, "grade": "B"},
    {"name": "Bob", "score": 92, "grade": "A"},
    {"name": "Charlie", "score": 78, "grade": "C"}
]

for student in students:
    print(f"{student['name']}: {student['score']}")
```

Output:

```
Alice: 85
Bob: 92
Charlie: 78
```

This structure is exactly what you get from a database query or an API response.

**DMart-style** — many products, each described by one dict:

```python
products = [
    {"name": "Rice", "price": 450, "qty": 120},
    {"name": "Dal", "price": 120, "qty": 80},
    {"name": "Oil", "price": 210, "qty": 45},
]

for p in products:
    print(f"{p['name']}: ₹{p['price']}")
```

---

## collections.Counter — Frequency Counting

In Part 21, we built a letter frequency counter manually. Python has a built-in tool for this:

```python
from collections import Counter

text = "banana"
letter_count = Counter(text)
print(letter_count)   # Counter({'a': 3, 'n': 2, 'b': 1})
```

`Counter` is a dictionary subclass that counts occurrences automatically.

### Most Common Items

```python
words = ["python", "java", "python", "go", "python", "java", "rust"]
word_count = Counter(words)

print(word_count.most_common(2))   # [('python', 3), ('java', 2)]
```

`.most_common(n)` returns the `n` most frequent items as a list of tuples.

### Counter on Any Iterable

```python
votes = ["Alice", "Bob", "Alice", "Charlie", "Alice", "Bob"]
results = Counter(votes)
print(results)   # Counter({'Alice': 3, 'Bob': 2, 'Charlie': 1})

winner = results.most_common(1)[0][0]
print(f"Winner: {winner}")   # Winner: Alice
```

---

## collections.defaultdict

### The Evolution of Handling Missing Keys

Think about how far we have come with one problem: **what happens when a key does not exist?**

In **Part 21**, you wrote the manual pattern — check first, then create:

```python
word_groups = {}
for word in words:
    letter = word[0]
    if letter not in word_groups:    # Step 1: check
        word_groups[letter] = []     # Step 2: create
    word_groups[letter].append(word) # Step 3: use
```

Three steps, every time. Then you learned `**.setdefault()**` — it combines the check and the create into one call:

```python
word_groups.setdefault(letter, []).append(word)
```

Better. But notice — you still write `[]` on **every single access**. If you call `.setdefault()` 10,000 times, you are writing `[]` 10,000 times, even though the answer is always the same: "if the key is missing, I want an empty list."

`**defaultdict` is the final step.** You declare the default **once** at creation, and never think about it again:

```python
from collections import defaultdict

word_groups = defaultdict(list)

words = ["apple", "banana", "avocado", "blueberry", "cherry", "apricot"]

for word in words:
    first_letter = word[0]
    word_groups[first_letter].append(word)

print(dict(word_groups))
# {'a': ['apple', 'avocado', 'apricot'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
```

No `if` check. No `.setdefault()`. Just access the key, and if it does not exist, `defaultdict` creates it with an empty list automatically.

**The progression:**


| Approach                    | Lines of code per access | When to use                                                               |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `if key not in dict`        | 3 lines                  | When you need custom logic per key                                        |
| `.setdefault(key, default)` | 1 line                   | When the default varies or you use it only in a few places                |
| `defaultdict(factory)`      | 0 extra lines            | When every missing key should get the same default — the cleanest pattern |


Each step exists because developers got tired of repeating the previous pattern. That is how Python evolves — common pain points become built-in solutions.

Common defaults:


| `defaultdict(list)` | Missing key → empty list `[]`   |
| ------------------- | ------------------------------- |
| `defaultdict(int)`  | Missing key → `0`               |
| `defaultdict(set)`  | Missing key → empty set `set()` |


---

## Dictionary Merging

### Unpacking Operator **

```python
defaults = {"theme": "dark", "language": "en", "font_size": 14}
user_prefs = {"theme": "light", "font_size": 16}

merged = {**defaults, **user_prefs}
print(merged)   # {'theme': 'light', 'language': 'en', 'font_size': 16}
```

Values from the second dictionary override the first when keys overlap.

### Merge Operator | (Python 3.9+)

```python
merged = defaults | user_prefs
print(merged)   # {'theme': 'light', 'language': 'en', 'font_size': 16}
```

Cleaner syntax, same result. The right-side dictionary wins on conflicts.

### In-Place Merge with |=

```python
defaults |= user_prefs
print(defaults)   # {'theme': 'light', 'language': 'en', 'font_size': 16}
```

This modifies `defaults` directly, similar to `+=` for numbers.

### A Preview — Where Merging Meets Comprehensions (Part 23)

In Part 21, you built a frequency dictionary with a `for` loop, an `if` check, and multiple lines. In Part 23, you will see how Python lets you build entire dictionaries in a **single line**:

```python
students = [
    {"name": "Alice", "score": 85},
    {"name": "Bob", "score": 92},
]

# Dict comprehension — one line to build a name → score mapping
score_map = {s["name"]: s["score"] for s in students}
print(score_map)   # {'Alice': 85, 'Bob': 92}
```

This is called a **dictionary comprehension**. It combines everything from this batch — looping, key-value pairs, and list-of-dicts — into the most Pythonic pattern possible. Part 23 covers this in full.

---

## The json Module — Dicts and JSON

### But Wait — Why Do We Even Need JSON? We Already Have Dictionaries!

This is the question every sharp student asks, and the answer reveals how developers think about **real problems**.

A Python dictionary lives **inside your Python program's memory**. It exists only while your program is running. The moment your program stops, that dictionary is gone — vanished from RAM.

Now think about what happens in the real world:

1. **Your Python backend needs to send data to a React frontend** — but React runs JavaScript, not Python. JavaScript has no idea what a Python `dict` is.
2. **Your backend needs to send data to a mobile app** — written in Swift or Kotlin. They don't know Python either.
3. **You need to save user data to a file** and load it back tomorrow — you can't just dump Python's raw memory to a file and hope it works.
4. **Microservice A (Python) needs to talk to Microservice B (Go)** — two completely different languages on two different servers.

The core problem: **Python objects are trapped inside Python.** They cannot cross language boundaries, network boundaries, or even survive your program shutting down.

**This is the problem JSON solves.** JSON is a **universal text format** that every programming language on Earth can read and write. It is the **common language** that lets systems talk to each other.

Think of it like this:


| Analogy        | Meaning                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Python `dict`  | A thought in your head — only you understand it                                   |
| JSON string    | That thought written down in English — anyone who reads English can understand it |
| `json.dumps()` | Writing your thought down (Python → text)                                         |
| `json.loads()` | Reading someone's written thought back into your head (text → Python)             |


**The dictionary is the data. JSON is the packaging to ship that data.**

Without JSON (or something like it), every app would be an island — unable to communicate with anything else. This is why `json` is one of the most-used modules in all of Python.

### Dict to JSON String — json.dumps()

```python
import json

user = {
    "name": "Dev",
    "age": 28,
    "skills": ["Python", "Django"]
}

json_string = json.dumps(user)
print(json_string)
# {"name": "Dev", "age": 28, "skills": ["Python", "Django"]}

print(type(json_string))   # <class 'str'>
```

### Pretty Printing

```python
print(json.dumps(user, indent=2))
```

Output:

```json
{
  "name": "Dev",
  "age": 28,
  "skills": [
    "Python",
    "Django"
  ]
}
```

### JSON String to Dict — json.loads()

```python
json_text = '{"name": "Alice", "score": 95}'
data = json.loads(json_text)

print(data["name"])    # Alice
print(type(data))      # <class 'dict'>
```

### Key Differences Between Python Dicts and JSON


| Python Dict             | JSON                                |
| ----------------------- | ----------------------------------- |
| `True` / `False`        | `true` / `false`                    |
| `None`                  | `null`                              |
| Single or double quotes | Double quotes only                  |
| Tuple keys allowed      | JSON object keys are always strings |


`json.dumps()` and `json.loads()` handle these conversions automatically.

### But What About Files? — json.dump() and json.load()

Notice the pattern: `dumps` has an **"s"** at the end, `loads` has an **"s"** at the end. The "s" stands for **string** — these work with strings in memory.

The versions **without** the "s" — `json.dump()` and `json.load()` — work directly with **files**. In real work, you use these *more often* because config files, cached data, and saved state all live on disk.

**Writing a dict to a JSON file:**

```python
import json

config = {
    "db_host": "localhost",
    "db_port": 5432,
    "debug": True,
    "allowed_origins": ["http://localhost:3000"]
}

with open("config.json", "w") as f:
    json.dump(config, f, indent=2)
```

This creates a `config.json` file on disk. Your app can read it back even after restarting.

**Reading a JSON file back into a dict:**

```python
with open("config.json", "r") as f:
    loaded_config = json.load(f)

print(loaded_config["db_host"])   # localhost
print(type(loaded_config))        # <class 'dict'>
```

**The naming trick to never forget:**


| Function       | Works With | Memory Aid                       |
| -------------- | ---------- | -------------------------------- |
| `json.dumps()` | **s**tring | dump**s** → dump to **s**tring   |
| `json.loads()` | **s**tring | load**s** → load from **s**tring |
| `json.dump()`  | **f**ile   | no "s" → goes to **f**ile        |
| `json.load()`  | **f**ile   | no "s" → comes from **f**ile     |


This is one of those details that trips up even experienced developers. Now you won't forget it.

---

## What Matters Most in Part 22

1. **Nested access** — `d["outer"]["inner"]`; chain `**.get(..., {})`** when something might be missing.
2. **List of dicts** — the default shape for “many records” from APIs and databases.
3. `**json.loads` / `json.dumps`** — dict ↔ JSON string; know `**true`/`false`/`null**` vs Python `**True`/`False`/`None**`.
4. `**Counter**` — quick frequencies; `**.most_common()**`.
5. `**defaultdict**` — less boilerplate when **grouping** into lists (or counts with `int`).
6. **Merge** — `{**a, **b}` or `a | b` (3.9+); right-hand wins on same key.

---

## Where This Applies in Real Work

- **API development:** Every request body and response body in REST APIs is JSON — which means dictionaries. Parsing incoming requests, building responses, validating data — all dictionary operations.
- **Nested data:** User profiles with addresses, order details with line items, organization charts — all nested dictionaries.
- **Counter for analytics:** Word frequency in NLP, vote counting, error frequency in log analysis, feature usage tracking — `Counter` handles all of these.
- **Config merging:** Application defaults merged with user preferences, environment-specific settings overriding base configs — dictionary merging with `*`* or `|`.
- **defaultdict for grouping:** Categorizing data records by a field (group users by city, group transactions by date) — `defaultdict(list)` is the standard pattern.

---

## Practice Assignment

Create a student database:

1. Define a list of nested dictionaries:

```python
students = [
    {
        "name": "Alice",
        "age": 20,
        "subjects": ["Math", "Physics", "Chemistry"]
    },
    {
        "name": "Bob",
        "age": 21,
        "subjects": ["Biology", "Chemistry", "English"]
    },
    {
        "name": "Charlie",
        "age": 19,
        "subjects": ["Math", "English", "History"]
    }
]
```

1. Print each student's name and their subjects (loop over the list; use each dict's keys, e.g. `student["name"]`)
2. Use `Counter` to count how many times each subject appears across all students
3. Print the most popular subject
4. Use `json.dumps()` with `indent=2` to pretty-print the entire `students` list
5. Create a dictionary mapping each student name to their number of subjects
6. Use `.update()` to add a `"status": "active"` field to every student dict in the list
7. Use `.setdefault()` to add a `"grade"` key only to students who don't already have one — default it to `"Pending"`
8. Save the final `students` list to a file called `students.json` using `json.dump()`, then read it back with `json.load()` and print it

Save as `src/student_db.py`.

---

> **Next:** Part 23 — Comprehensions. The Pythonic way to build lists, dictionaries, and sets in a single, elegant line. Everything from this batch comes together.

