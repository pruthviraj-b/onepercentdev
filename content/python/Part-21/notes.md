# Part 21 — Dictionaries Part 1 (Foundation)

## Connecting to Parts 17–20: The Core Question

We have learned three collections so far, and they all answer different questions:


| Container | Main Question It Answers                   | How It Finds Things | Real-World Developer Example                                                              |
| --------- | ------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------- |
| **List**  | "What is at position `i`?"                 | By index / scanning | Sending a list of recent transactions to a mobile app: `[tx1, tx2, tx3]`                  |
| **Tuple** | "What is at position `i` in a locked row?" | By index            | Returning multiple values safely from a function: `success, data = fetch_api()`           |
| **Set**   | "Does this value exist?"                   | Hash + Jump         | Checking permissions instantly without scanning: `if "DELETE_USER" in admin_permissions:` |
| **Dict**  | "What value belongs to this key?"          | Hash + Jump         | Fast lookup of a user profile by ID: `user = user_cache["user_101"]`                      |


Dictionaries are different from lists. They store **pairs** — a **key** and a **value**. You ask **“what is the value for this exact key?”**, not “what is at index 0?”. 

In the **Part 9** overview, dicts are **mutable** — add, change, remove pairs — and the dict’s `**id()`** usually **stays the same** (same object, updated in place).

### The In-Memory Database Analogy

A dictionary is essentially an **in-memory database table** where the "key" is the Primary Key.

When you ask a SQL Database:
`SELECT * FROM users WHERE user_id = 101;`

In Python, that exact same logic is just:
`user = users_dict[101]`

Because `dict` and `set` are siblings in the **Hash-Table Family** (Part 20), dictionaries use the exact same hash-jumping engine as sets. This makes finding the value for a key incredibly fast (`O(1)`), regardless of whether your dictionary has 10 items or 10 million items!

**Links to what you already know**

- **Keys must be hashable** (immutable in practice): `**str`**, `**int**`, `**tuple**` (if its contents are hashable) — you used **tuple keys** on a map in **Part 19**. **Lists and dicts cannot be keys** (they can change). **Sets** cannot be keys either; `**frozenset`** can (**Part 20**).
- **Fast lookup by key** uses **hashing**, the same big idea as `**x in big_set`** being fast (**Part 20**).

---

## What Is a Dictionary?

A dictionary stores data as **key-value pairs**. Every value is accessed through its key.

```python
person = {
    "name": "Dev",
    "age": 28,
    "city": "Bangalore"
}
```

Same idea with **DMart-style** data — **item name → price in rupees**:

```python
prices = {
    "Rice": 450,
    "Dal": 120,
    "Oil": 210,
}
print(prices["Dal"])   # 120
```

Key properties:


| Property        | Meaning                                    |
| --------------- | ------------------------------------------ |
| Key-value pairs | Each item has a key and a value            |
| Keys are unique | No two items can have the same key         |
| Mutable         | You can add, change, and remove pairs      |
| Ordered         | Insertion order is preserved (Python 3.7+) |


Dictionaries are the **most used data structure** in professional Python. Every JSON response, every config file, every API payload — dictionaries.

---

## Creating Dictionaries

```python
# Curly braces with key: value pairs
student = {"name": "Alice", "grade": "A", "score": 95}

# dict() constructor — keyword arguments become key-value pairs
student = dict(name="Alice", grade="A", score=95)

# From a list of tuples — each tuple is a (key, value) pair
pairs = [("name", "Alice"), ("grade", "A"), ("score", 95)]
student = dict(pairs)

# Empty dictionary
empty = {}
```

Why does `dict()` accept a **list of tuples**? Because many operations *produce* paired data. `zip()` gives you paired tuples, `.items()` gives you `(key, value)` tuples, and database drivers return rows as tuples. Converting them into a dictionary with `dict(list_of_tuples)` is a one-liner instead of writing a loop. This ties directly to **tuple unpacking** from **Part 19**.

```python
keys = ["name", "city", "role"]
values = ["Dev", "Bangalore", "backend"]

profile = dict(zip(keys, values))
print(profile)   # {'name': 'Dev', 'city': 'Bangalore', 'role': 'backend'}
```

Keys are usually **strings**. They can be any **hashable** type — `int`, `float`, `str`, `tuple` (with only hashable items inside), `frozenset`, etc. `**list`**, `**dict**`, and `**set**` are **not** allowed as keys because they are mutable (or not hashable).

Values can be **anything** — strings, numbers, lists, other dictionaries.

---

## Accessing Values

### Bracket Notation

```python
person = {"name": "Dev", "age": 28, "city": "Bangalore"}

print(person["name"])   # Dev
print(person["age"])    # 28
```

If the key does not exist, you get an error:

```python
print(person["salary"])   # KeyError: 'salary'
```

### .get() — Safe Access

```python
print(person.get("name"))       # Dev
print(person.get("salary"))     # None (no error)
print(person.get("salary", 0))  # 0 (custom default)
```

`.get()` returns `None` (or a default you provide) instead of crashing.

**Rule:** Use `.get()` when a key might not exist. Use brackets when you are certain the key exists and want an error if it does not.

---

## Adding and Updating

```python
person = {"name": "Dev", "age": 28}

# Add a new key
person["city"] = "Bangalore"
print(person)   # {'name': 'Dev', 'age': 28, 'city': 'Bangalore'}

# Update an existing key
person["age"] = 29
print(person)   # {'name': 'Dev', 'age': 29, 'city': 'Bangalore'}
```

If the key exists, the value is replaced. If it does not exist, a new pair is added.

---

## Removing Items

### del — Delete a Key

```python
person = {"name": "Dev", "age": 28, "city": "Bangalore"}
del person["city"]
print(person)   # {'name': 'Dev', 'age': 28}
```

But `del` has no safety net — if the key does not exist, it crashes:

```python
del person["salary"]   # KeyError: 'salary'
```

There is no way to give `del` a default. It either deletes the key or blows up. This is *why* `.pop()` exists.

### .pop() — Remove and Return (the safe alternative)

`.pop()` was introduced because developers kept writing this pattern over and over:

```python
if "city" in person:
    city = person["city"]
    del person["city"]
```

That is three lines to do one thing: remove a key and get its value. `.pop()` does it in one call — and you can give it a default so it never crashes:

```python
person = {"name": "Dev", "age": 28, "city": "Bangalore"}

city = person.pop("city")
print(city)     # Bangalore
print(person)   # {'name': 'Dev', 'age': 28}

# Safe pop with default — no KeyError, no crash
salary = person.pop("salary", "not found")
print(salary)   # not found
```

**When to use which:**

- Use `del` when you are **certain** the key exists and don't need the value back.
- Use `.pop()` when you want the **value back**, or the key **might not exist**.

---

## Checking If a Key Exists

```python
person = {"name": "Dev", "age": 28}

print("name" in person)     # True
print("salary" in person)   # False
print("Dev" in person)    # False — 'in' checks KEYS, not values
```

The `in` operator checks **keys only**, not values.

---

## Iterating Over Dictionaries

### Keys Only (Default)

```python
person = {"name": "Dev", "age": 28, "city": "Bangalore"}

for key in person:
    print(key)
```

Output:

```
name
age
city
```

### Keys and Values Together

```python
for key, value in person.items():
    print(f"{key}: {value}")
```

Output:

```
name: Dev
age: 28
city: Bangalore
```

`.items()` returns pairs of (key, value) — tuple unpacking from Part 19.

### Values Only

```python
for value in person.values():
    print(value)
```

Output:

```
Dev
28
Bangalore
```

### Summary


| Method             | Returns                |
| ------------------ | ---------------------- |
| `for key in dict:` | Keys                   |
| `dict.keys()`      | All keys               |
| `dict.values()`    | All values             |
| `dict.items()`     | All (key, value) pairs |


---

## len() on Dictionaries

```python
person = {"name": "Dev", "age": 28, "city": "Bangalore"}
print(len(person))   # 3 (three key-value pairs)
```

---

## Proving Mutability with id()

```python
person = {"name": "Dev"}
print(id(person))   # e.g., 140234866357520

person["age"] = 28
print(id(person))   # same ID — same object, modified in place

person["name"] = "Kumar"
print(id(person))   # still the same ID
```

Adding keys and updating values do not create a new dictionary. The same object is modified.

---

## Dictionaries Are Mutable — Reference Behavior

Same as lists (Part 17):

```python
original = {"a": 1, "b": 2}
copy_ref = original

copy_ref["c"] = 3

print(original)    # {'a': 1, 'b': 2, 'c': 3} — both changed
print(copy_ref)    # {'a': 1, 'b': 2, 'c': 3}
```

To create an independent copy:

```python
original = {"a": 1, "b": 2}
independent = original.copy()

independent["c"] = 3

print(original)      # {'a': 1, 'b': 2} — unchanged
print(independent)   # {'a': 1, 'b': 2, 'c': 3}
```

`.copy()` is a **shallow** copy — fine for flat dicts like above. If **values** are themselves **mutable** (e.g. nested dicts or lists), inner objects are still **shared** — **Part 22** goes deeper on nesting and when you need a full duplicate.

---

## Building Dictionaries Dynamically

```python
word = "banana"
frequency = {}

for letter in word:
    if letter in frequency:
        frequency[letter] += 1
    else:
        frequency[letter] = 1

print(frequency)   # {'b': 1, 'a': 3, 'n': 2}
```

This pattern — building a dictionary from data — is one of the most common operations in Python. You will see it in text processing, log analysis, data aggregation, and analytics.

---

## Dict vs List — When to Choose Which


| Feature         | List                           | Dict                       |
| --------------- | ------------------------------ | -------------------------- |
| Access pattern  | By position (index 0, 1, 2...) | By key (`"name"`, `"age"`) |
| Ordered         | Yes                            | Yes (Python 3.7+)          |
| Duplicates      | Allowed                        | Keys must be unique        |
| Lookup by value | O(n) — slow                    | O(1) by key — instant      |
| Use case        | Sequence of similar items      | Named/labeled data         |


**The decision rule:**

- Have a sequence of similar items (list of users, list of scores)? Use a **list**.
- Have data where each piece has a name/label (user profile, config settings)? Use a **dict**.

Real example: a list of users is a list of dicts. Each user (dict) has named fields. The collection of users (list) is ordered and iterable.

```python
users = [
    {"name": "Alice", "role": "admin"},
    {"name": "Bob", "role": "user"},
]
```

---

## Complete Dictionary Methods Reference


| Method                       | What It Does                                                                   | Returns            |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------ |
| `.get(key, default)`         | Returns value for key, or default if missing                                   | Value or default   |
| `.keys()`                    | All keys                                                                       | `dict_keys` view   |
| `.values()`                  | All values                                                                     | `dict_values` view |
| `.items()`                   | All (key, value) pairs                                                         | `dict_items` view  |
| `.pop(key, default)`         | Removes key and returns its value                                              | Value or default   |
| `.popitem()`                 | Removes and returns last inserted (key, value) pair                            | `tuple`            |
| `.update(other)`             | Adds/overwrites keys from another dict or key-value pairs                      | `None`             |
| `.setdefault(key, default)`  | Returns value if key exists; otherwise inserts key with default and returns it | Value              |
| `.copy()`                    | Returns a shallow copy                                                         | New `dict`         |
| `.clear()`                   | Removes all items                                                              | `None`             |
| `dict.fromkeys(keys, value)` | Creates a new dict with given keys, all set to value                           | New `dict`         |


### .popitem() — Remove the Last Inserted Pair

```python
tasks = {"morning": "standup", "noon": "code review", "evening": "deploy"}

last = tasks.popitem()
print(last)    # ('evening', 'deploy')
print(tasks)   # {'morning': 'standup', 'noon': 'code review'}
```

`.popitem()` removes and returns the **last inserted** key-value pair as a tuple. Useful when you are processing items one at a time from the end.

On an empty dict, it crashes — there is nothing to pop:

```python
empty = {}
empty.popitem()   # KeyError: 'popitem(): dictionary is empty'
```

So always check `if tasks:` or `while tasks:` before calling `.popitem()` in a loop.

### .update() — Merge Another Dict Into This One

```python
defaults = {"theme": "light", "language": "en", "font_size": 14}
user_prefs = {"theme": "dark", "font_size": 18}

defaults.update(user_prefs)
print(defaults)
# {'theme': 'dark', 'language': 'en', 'font_size': 18}
```

`.update()` adds all key-value pairs from the other dict. If a key already exists, its value is **overwritten**. Keys that don't exist are **added**. This is a very common pattern for merging config/settings — start with defaults, then apply user overrides.

You can also pass keyword arguments directly:

```python
person = {"name": "Dev"}
person.update(age=28, city="Bangalore")
print(person)   # {'name': 'Dev', 'age': 28, 'city': 'Bangalore'}
```

### .setdefault() — Useful Pattern

```python
word_groups = {}
words = ["apple", "banana", "avocado", "blueberry"]

for word in words:
    first_letter = word[0]
    word_groups.setdefault(first_letter, []).append(word)

print(word_groups)
# {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry']}
```

`.setdefault()` checks if the key exists. If not, it inserts it with the default value. Either way, it returns the value — so you can chain `.append()` on it. This replaces the `if key in dict` pattern from earlier.

### .clear() — Remove Everything

```python
session = {"user": "Dev", "token": "abc123", "role": "admin"}
print(len(session))   # 3

session.clear()
print(session)        # {}
print(len(session))   # 0
```

`.clear()` empties the dictionary completely. The object itself stays the same (`id()` does not change), but all key-value pairs are gone. Useful for resetting state — like clearing a cache or ending a session.

### dict.fromkeys() — Create a Dict with Preset Keys

```python
subjects = ["math", "science", "english"]
scores = dict.fromkeys(subjects, 0)
print(scores)   # {'math': 0, 'science': 0, 'english': 0}
```

`dict.fromkeys()` is a **class method** — you call it on `dict` itself, not on an existing dictionary. It creates a new dict where every key from the iterable gets the same initial value. Handy for initializing a template or setting all counters to zero.

**Watch out** — if the default value is mutable (like a list), all keys share the **same** object:

```python
bad = dict.fromkeys(["a", "b"], [])
bad["a"].append(1)
print(bad)   # {'a': [1], 'b': [1]} — both changed!
```

Use a loop or dict comprehension instead when you need independent mutable values per key.

---

## Time and Space Complexity


| Operation                            | Time Complexity | Notes                     |
| ------------------------------------ | --------------- | ------------------------- |
| Access `dict[key]`                   | O(1)            | Instant — uses hashing    |
| Insert `dict[key] = value`           | O(1)            | Instant                   |
| Delete `del dict[key]`               | O(1)            | Instant                   |
| Search `key in dict`                 | O(1)            | Checks keys only, instant |
| Search values `val in dict.values()` | O(n)            | Must check every value    |
| Length `len(dict)`                   | O(1)            | Tracked internally        |
| Iteration `for k in dict`            | O(n)            | Visits every key          |


Dictionaries are among the fastest data structures in Python. Key-based operations are O(1) because of hashing — the same technique that makes sets fast. The trade-off: dictionaries use more memory than lists to maintain the hash table.

---

## What Matters Most (remember this)

1. **Lookup by key** — `dict[key]`, `**.get()`** when the key might be missing.
2. **Keys unique and hashable** — no lists/dicts/sets as keys; ties to **Parts 19–20**.
3. `**items()` / `keys()` / `values()`** — how you loop; `**.items()**` + unpacking (**Part 19**).
4. **Mutation in place** — same `**id()`**; **alias vs `.copy()`** (shallow), like lists (**Part 17**).
5. **Real data shape** — often a **list of dicts** (many records), each dict one row — **Part 22**.

---

## Where This Applies in Real Work

- **JSON and APIs:** JSON maps naturally to a Python **dict**. API responses and request bodies are parsed or built as dictionaries constantly in backend work.

```python
api_response = {
    "status": "success",
    "data": {
        "user_id": 42,
        "name": "Dev"
    }
}
```

- **Configuration:** Application settings — database URLs, API keys, feature flags — are stored as key-value pairs, typically in dictionaries loaded from config files.
- **Data records:** Each row from a database can be represented as a dictionary: `{"id": 1, "name": "Alice", "email": "alice@example.com"}`.
- **Caching:** Storing computed results for quick lookup. `cache = {}; cache[input_key] = computed_result`.
- **Counting and grouping:** Frequency analysis, categorization, tallying votes — all dictionary patterns.

---

## Practice Assignment

Build a contact book:

1. Start with an empty dictionary
2. Use a `while True` loop with actions: `add`, `search`, `list`, `delete`, `quit`
3. `add` — ask for a name and phone number, add to the dictionary (name is key, phone is value)
4. `search` — ask for a name, print the phone number if found, or "Contact not found"
5. `list` — print all contacts in `name: phone` format
6. `delete` — ask for a name, remove the contact if found, handle missing contact
7. `quit` — print total contacts and exit

Example session:

```
Action (add/search/list/delete/quit): add
Name: Alice
Phone: 9876543210
Added: Alice — 9876543210

Action (add/search/list/delete/quit): add
Name: Bob
Phone: 1234567890
Added: Bob — 1234567890

Action (add/search/list/delete/quit): search
Name: Alice
Alice: 9876543210

Action (add/search/list/delete/quit): list
Alice: 9876543210
Bob: 1234567890

Action (add/search/list/delete/quit): delete
Name: Alice
Deleted: Alice

Action (add/search/list/delete/quit): quit
Total contacts: 1
```

Save as `src/contact_book.py`.

---

> **Next:** Part 22 — Dictionaries Part 2. Nested dictionaries, JSON, Counter, merging, and the patterns that make dictionaries the backbone of every Python application.

