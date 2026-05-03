# Part 25 — Functions Part 2 (Advanced Control)

## Connecting to Part 24

Part 24 gave you the foundation: `def`, parameters, `return`, scope (LEGB), docstrings, and the idea that functions are first-class objects. You can now write a function, call it, and get a result back.

But real-world functions need more flexibility. Think about the functions you already use — `print()` accepts any number of arguments: `print("a")`, `print("a", "b", "c")`. `.get()` works with or without a default: `d.get("key")` or `d.get("key", 0)`. How do they do that? How does one function handle different numbers of inputs?

This part answers that question. You will learn **default parameters**, `***args`**, `****kwargs`**, and **keyword-only parameters** — the tools that make functions truly flexible. These are the same tools that power every Python framework you will use.

---

## Default Parameters

A parameter can have a default value. If the caller does not provide an argument, the default is used:

```python
def greet(name="Guest"):
    return f"Hello, {name}!"

print(greet("Shyam"))   # Hello, Shyam!
print(greet())           # Hello, Guest!
```

Default parameters make functions flexible — the same function handles both cases.

### Rules

- Parameters with defaults must come **after** parameters without defaults:

```python
def create_user(name, role="member"):   # Correct
    return {"name": name, "role": role}

def create_user(role="member", name):   # SyntaxError
    pass
```

---

## The Mutable Default Argument Pitfall

This is one of the most important lessons in this entire series.

```python
def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item("apple"))    # ['apple']
print(add_item("banana"))   # ['apple', 'banana']  — Wait, what?
```

The second call shows both items. The list was not reset.

### ßWhy This Happens

Default arguments are evaluated **once** — when the function is defined, not each time it is called. The empty list `[]` is created once and shared across all calls. Every call appends to the same list object.

We can prove this. In Part 24, you learned that functions are objects. Like any object, they have attributes. One of them is `__defaults__` — a tuple where Python stores the default values for your parameters:

```python
print(type(add_item))              # <class 'function'>
print(add_item.__defaults__)       # (['apple', 'banana'],)
```

That `['apple', 'banana']` is your "empty" list default — it was mutated by the previous calls. This proves there is only one list object shared across all calls. You will see more function attributes like `__name__` and `__doc__` in Part 45 when we learn decorators.

### The Correct Pattern

Use `None` as the default and create a new list inside the function:

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

print(add_item("apple"))    # ['apple']
print(add_item("banana"))   # ['banana']  — Correct!
```

Now each call gets its own fresh list.

This pattern applies to any mutable default — lists, dictionaries, sets. Never use a mutable object as a default parameter value.

---

## *args — Variable Positional Arguments

Sometimes you do not know how many arguments a function will receive:

```python
def total(*numbers):
    return sum(numbers)

print(total(1, 2, 3))         # 6
print(total(10, 20, 30, 40))  # 100
print(total(5))                # 5
```

`*numbers` collects all positional arguments into a **tuple**.

```python
def show_args(*args):
    print(type(args))   # <class 'tuple'>
    for arg in args:
        print(arg)

show_args("a", "b", "c")
```

### Combining Regular Parameters with *args

```python
def log_message(level, *messages):
    for msg in messages:
        print(f"[{level}] {msg}")

log_message("INFO", "Server started", "Listening on port 8000")
```

Output:

```
[INFO] Server started
[INFO] Listening on port 8000
```

The first argument goes to `level`. Everything else is collected by `*messages`.

---

## **kwargs — Variable Keyword Arguments

`**kwargs` collects all keyword arguments into a **dictionary**:

```python
def create_profile(**details):
    print(type(details))   # <class 'dict'>
    for key, value in details.items():
        print(f"{key}: {value}")

create_profile(name="Shyam", age=28, city="Bangalore")
```

Output:

```
<class 'dict'>
name: Shyam
age: 28
city: Bangalore
```

Notice something? `***args` gives you a tuple (Part 19). `**kwargs` gives you a dictionary (Part 21).** Python chose the two most useful data structures to collect your arguments — a tuple for unnamed values (ordered, immutable), a dictionary for named values (key-value pairs). This is why we learned data structures first. Everything connects.

That is also why you can call `.items()` on `details` above — it is literally a `dict`, with all the methods you already know from Parts 21–22.

### Combining Regular Parameters with **kwargs

```python
def register_user(username, **extras):
    print(f"User: {username}")
    for key, value in extras.items():
        print(f"  {key}: {value}")

register_user("shyam_dev", role="admin", team="backend")
```

Output:

```
User: shyam_dev
  role: admin
  team: backend
```

---

## Keyword-Only Parameters

Adding `*` in the parameter list forces all following parameters to be passed by name:

```python
def connect(host, port, *, timeout=30, retries=3):
    print(f"Connecting to {host}:{port}")
    print(f"Timeout: {timeout}, Retries: {retries}")

connect("localhost", 8080, timeout=10, retries=5)   # Works
connect("localhost", 8080, 10, 5)                    # TypeError
```

The second call fails because `timeout` and `retries` must be passed as keyword arguments.

### Why This Matters

Keyword-only parameters prevent ambiguity. When a function has many options, forcing keyword arguments makes calls self-documenting:

```python
# Unclear — what do 30 and 5 mean?
connect("localhost", 8080, 30, 5)

# Clear — every argument is labeled
connect("localhost", 8080, timeout=30, retries=5)
```

---

## The Full Parameter Order

When combining all parameter types, they must follow this order:

```python
def func(positional, default="value", *args, keyword_only, **kwargs):
    pass
```

1. Regular positional parameters
2. Parameters with defaults
3. `*args`
4. Keyword-only parameters (after `*` or `*args`)
5. `**kwargs`

### A Realistic Example

```python
def api_call(endpoint, method="GET", *path_params, timeout=30, **headers):
    print(f"{method} {endpoint}")
    if path_params:
        print(f"  Path: {path_params}")
    print(f"  Timeout: {timeout}")
    for key, value in headers.items():
        print(f"  {key}: {value}")

api_call("/users", "POST", "v2", timeout=10, Authorization="Bearer abc123")
```

Output:

```
POST /users
  Path: ('v2',)
  Timeout: 10
  Authorization: Bearer abc123
```

---

## Type Hints (Brief Introduction)

Python allows you to annotate parameter types and return types:

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

def add(a: int, b: int) -> int:
    return a + b

def divide(a: float, b: float) -> float | None:
    if b == 0:
        return None
    return a / b
```

Type hints do **not** enforce types at runtime — Python will not raise an error if you pass the wrong type. They serve as documentation and enable tools like `mypy` to catch type errors before running the code.

We will cover type hints in depth later. For now, know they exist and start reading them in other people's code.

---

## Where This Applies in Real Work

- **Default parameters:** Every framework uses them. `requests.get(url, timeout=30)` — the timeout has a sensible default but can be overridden.
- **Mutable default pitfall:** This appears in interviews regularly. Senior developers who do not know this pattern introduce bugs that are extremely hard to track down.
- ***args:** Used when building functions that accept a variable number of inputs — logging functions, mathematical operations, print-like utilities.
- ****kwargs:** The backbone of Python frameworks. Django views, FastAPI dependencies, AI model configurations — all accept `**kwargs` for flexibility.
- **Keyword-only parameters:** Used in APIs and libraries to make function calls readable and prevent accidental argument swapping.
- **Type hints:** Standard in modern Python codebases. FastAPI uses them to auto-generate API documentation and validate request data.

---

## Practice Assignment

Build a profile card generator:

1. Create a function `create_profile(name, age, **extras)`:
  - Print the name and age on separate lines
  - Print each extra detail from `**extras`
  - Return a dictionary containing all the information
2. Create a function `print_separator(char="-", length=40)`:
  - Print a line of `char` repeated `length` times
3. Create a function `display_profiles(*profiles)`:
  - Accept any number of profile dictionaries
  - Print each one with a separator between them
4. Call `create_profile` for at least 3 people with different extra fields (city, job, hobby, etc.)
5. Pass all profiles to `display_profiles`

Example output:

```
----------------------------------------
Name: Shyam
Age: 28
city: Bangalore
job: AI Developer
----------------------------------------
Name: Alice
Age: 25
hobby: Photography
language: Kannada
----------------------------------------
```

Save as `src/profile_cards.py`.

---

> **Next:** Part 26 — Recursion Part 1. A function calling itself. This is where you start thinking like an algorithm designer — breaking big problems into smaller identical problems.

