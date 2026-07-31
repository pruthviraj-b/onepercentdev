# Part 1 — Variables, Names, and Objects

## Connecting to the Course

Data analysis is a chain of decisions. A file is read, values are cleaned, metrics are calculated, and a conclusion is communicated. Every stage needs names:

```python
raw_orders = read_orders("orders.csv")
clean_orders = remove_invalid_rows(raw_orders)
revenue = clean_orders["amount"].sum()
```

The names `raw_orders`, `clean_orders`, and `revenue` are not decoration. They preserve the meaning of each stage and make the work auditable. If a result is wrong, good names help you locate the first incorrect assumption.

This lesson builds the mental model behind assignment. We will move from the beginner-friendly idea of a label pointing to a value to Python's precise terms: **name**, **object**, **reference**, **type**, **value**, **identity**, **binding**, **rebinding**, **mutability**, and **aliasing**.

> **Learning goal:** After this lesson, you should be able to explain what Python does when it executes `sales = 100`, predict what happens after `b = a`, distinguish `==` from `is`, and diagnose accidental sharing of mutable data.

---

## The Three Parts of Every Python Object

Python does not store a bare value in isolation. At runtime, a value is represented by an object. For practical reasoning, an object has three important properties:

| Property | Question it answers | Example check |
|---|---|---|
| **Type** | What kind of object is this? | `type(order_count)` |
| **Value** | What data does it represent? | `print(order_count)` |
| **Identity** | Which exact object is this? | `id(order_count)` |

```python
order_count = 42

print(type(order_count))  # <class 'int'>
print(order_count)        # 42
print(id(order_count))    # implementation-dependent integer
```

The exact number returned by `id()` is not portable and should not be used as a business value. It is useful while debugging object identity. In CPython, it commonly corresponds to the object's address during its lifetime, but the Python language specification only promises that it is a unique, stable identity for that object while the object exists.

### A useful visual model

The following model is a teaching aid, not a promise about the physical layout of every Python implementation:

```text
CURRENT FRAME / NAMESPACE              OBJECT SPACE
┌──────────────────────┐              ┌────────────────────────┐
│ order_count ─────────┼─────────────▶│ type: int              │
└──────────────────────┘              │ value: 42              │
       name                            │ identity: unique       │
                                       └────────────────────────┘
```

Python's precise language is that `order_count` is a **name bound to an object**. Saying “the variable stores 42” is convenient shorthand, but “the name refers to an integer object whose value is 42” gives you a stronger model for later topics.

---

## Name, Variable, Reference, and Object

These words are related but not interchangeable:

| Term | Meaning in this course |
|---|---|
| **Name** | An identifier used to refer to an object, such as `revenue`. |
| **Variable** | Common shorthand for a name whose binding may change. |
| **Object** | A runtime entity with a type, value, and identity. |
| **Reference** | The relationship by which a name or container points to an object. |
| **Binding** | The association between a name and an object. |
| **Rebinding** | Changing a name so it refers to another object. |
| **Alias** | A second name referring to the same object. |

Python variables are therefore closer to **name tags** than sealed boxes. A box model is harmless for simple arithmetic, but it becomes misleading when two names refer to one list or when an object is mutable.

---

## Assignment Is Binding, Not Copying

Consider:

```python
sales = 100
```

At a conceptual level, Python performs these steps:

1. It obtains or creates an integer object representing `100`.
2. It binds the name `sales` to that object.
3. Future uses of `sales` look up the object currently bound to that name.

Now consider:

```python
sales = 100
reported_sales = sales
```

The second assignment does not mean “make a second independent copy of everything.” It binds another name to the object found through `sales`:

```text
NAMESPACE                         OBJECT
┌──────────────────────┐         ┌───────────────┐
│ sales ────────────────┼────────▶│ int: 100       │
│ reported_sales ───────┼────────▶│ immutable      │
└──────────────────────┘         └───────────────┘
```

For an integer, this distinction is usually invisible because integers are immutable. It becomes important with lists, dictionaries, sets, and custom objects.

### Proving the relationship

```python
sales = 100
reported_sales = sales

print(sales == reported_sales)  # True: equal values
print(sales is reported_sales)  # Often True for this example
print(id(sales) == id(reported_sales))  # Same identity in this moment
```

Do not use this example to learn a rule that all equal values have the same identity. Identity is a separate property and implementation optimisations can make small immutable objects appear shared.

---

## Reassignment: The Name Moves

```python
sales = 100
reported_sales = sales

sales = 125

print(sales)           # 125
print(reported_sales)  # 100
```

The name `sales` was rebound. The name `reported_sales` was not changed, so it still refers to the object representing `100`.

```text
BEFORE                                  AFTER
┌──────────────┐       ┌────────┐       ┌──────────────┐       ┌────────┐
│ sales ───────┼──────▶│ int 100│       │ sales ───────┼──────▶│ int 125│
│ reported ────┼──────▶│        │       │ reported ────┼──────▶│ int 100│
└──────────────┘       └────────┘       └──────────────┘       └────────┘
```

The old integer object is not edited from `100` into `125`. Integers are immutable. Python creates or obtains an object for `125` and changes the binding of `sales`. If no reference remains to the old object, it eventually becomes eligible for cleanup.

---

## Dynamic Typing

Python associates type information with objects, not permanently with names:

```python
metric = 42
print(type(metric).__name__)  # int

metric = "forty-two"
print(type(metric).__name__)  # str

metric = 42.0
print(type(metric).__name__)  # float
```

The name `metric` was rebound three times. Nothing about the name itself forces it to remain an integer.

Dynamic typing makes experimentation productive, but it does not remove the need for discipline. This common bug runs until the final expression:

```python
count = 10
count = input("Enter another count: ")  # input() always returns str
print(count + 1)                         # TypeError
```

The fix is to make the conversion explicit:

```python
count = int(input("Enter another count: "))
print(count + 1)
```

In data analysis, the equivalent problem occurs when a numeric CSV column is read as text because one row contains a symbol such as `"N/A"`. Always inspect types before calculating totals, averages, or rates.

---

## Equality Versus Identity: `==` and `is`

These operators answer different questions:

| Operator | Question | Typical use |
|---|---|---|
| `==` | Do the objects represent equal values? | Compare amounts, labels, and dates. |
| `is` | Are these references to the exact same object? | Test a singleton such as `None`. |

```python
first_total = 1_000
second_total = 1_000

print(first_total == second_total)  # True: same value
print(first_total is second_total)  # Do not rely on this for value comparison
```

The correct production rule is simple:

```python
if status == "paid":
    print("Include in revenue")

if optional_value is None:
    print("No value was supplied")
```

Use `is None`, not `== None`, because `None` is a singleton sentinel and identity communicates the intent precisely. Use `==` for ordinary value comparisons.

### Why `is` sometimes appears to work

CPython may reuse some immutable objects, and a compiler may reuse identical constants in one code object. This is an optimisation detail, not a correctness rule. Code that relies on `a is b` for equal integers or strings can behave differently when the values come from an API, a file, a calculation, or another interpreter.

```python
from_user = int("1000")
literal = 1000

print(from_user == literal)  # True
# Do not use identity to decide whether the numbers are equal.
```

---

## Naming Rules

Python enforces these rules:

- Names may contain letters, digits, and underscores.
- A name cannot begin with a digit.
- Names are case-sensitive: `amount`, `Amount`, and `AMOUNT` differ.
- Reserved keywords such as `if`, `for`, `class`, and `return` cannot be used as ordinary names.

```python
customer_name = "Asha"  # valid
order_2_total = 125.50  # valid

# 2nd_order = 10        # SyntaxError: cannot start with a digit
# order-total = 10      # parsed as subtraction, not a name
# class = "gold"        # SyntaxError: reserved keyword
```

### Naming conventions

| Object | Recommended style | Example |
|---|---|---|
| Variable | `snake_case` | `average_order_value` |
| Function | `snake_case` | `calculate_margin()` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Class | `PascalCase` | `SalesReport` |
| Internal implementation name | Leading underscore | `_normalise_date()` |

Choose names that describe the data's meaning and grain. `revenue` is better than `x`; `monthly_revenue_by_region` is better than `result` when the additional detail prevents ambiguity.

---

## Constants and Intent

Python does not enforce constants, but uppercase communicates that a name should not be rebound:

```python
TAX_RATE = 0.18
REPORT_CURRENCY = "INR"

gross = 10_000
tax = gross * TAX_RATE
```

This is a convention, not a lock. A reviewer should be able to understand which values are configuration, which are raw inputs, and which are derived metrics.

---

## Mutability Preview

An immutable object cannot be changed after creation. A mutable object can be changed in place.

| Usually immutable | Usually mutable |
|---|---|
| `int`, `float`, `bool` | `list` |
| `str`, `tuple` | `dict` |
| `None`, `range` | `set` |
| `frozenset` | Most user-defined objects, depending on design |

With an immutable value, an apparent change is a rebinding:

```python
label = "raw"
label = "clean"  # new string object or reused immutable object; name is rebound
```

With a mutable list, two names can observe an in-place change:

```python
raw_orders = [100, 200]
shared_orders = raw_orders

shared_orders.append(300)

print(raw_orders)     # [100, 200, 300]
print(shared_orders)  # [100, 200, 300]
```

Both names refer to the same list. If the second name was intended to be an independent working copy, copy it explicitly:

```python
raw_orders = [100, 200]
working_orders = raw_orders.copy()
working_orders.append(300)

print(raw_orders)      # [100, 200]
print(working_orders)  # [100, 200, 300]
```

For nested lists or dictionaries, a shallow copy duplicates only the outer container. Use `copy.deepcopy()` only when the full nested structure must be independent, and understand its cost.

---

## A Data Analysis Example: Raw Versus Derived Data

Keep the original input intact and give derived data a new name:

```python
raw_amounts = [120, 80, None, 200]

clean_amounts = [amount for amount in raw_amounts if amount is not None]
total_amount = sum(clean_amounts)
average_amount = total_amount / len(clean_amounts)

print(clean_amounts)            # [120, 80, 200]
print(total_amount)             # 400
print(round(average_amount, 2))  # 133.33
```

The names document the pipeline:

```text
raw_amounts → clean_amounts → total_amount → average_amount
```

This style is more verbose than reusing `data` four times, but it is safer. A reviewer can see what changed, and you can compare the row count and totals at every stage.

---

## Common Errors and How to Debug Them

### `NameError`

Python cannot find a binding for the name in the current scope or any enclosing scope:

```python
print(revenue)
```

Debugging questions:

1. Was the assignment executed?
2. Is the spelling and capitalisation identical?
3. Is the name inside a function or notebook cell that has not run?

### `TypeError`

The object exists, but the operation is incompatible with its type:

```python
amount = "100"
print(amount + 20)  # TypeError
```

Inspect the object before changing the code:

```python
print(repr(amount), type(amount).__name__)
amount = int(amount)
```

### `UnboundLocalError`

Inside a function, assigning to a name makes it local unless declared otherwise. A read before that local assignment can fail. Prefer passing values into functions and returning results rather than relying on global state.

---

## Execution Trace

Trace this code line by line:

```python
orders = [100, 200]
backup = orders
orders = orders + [300]
```

| Line | `orders` refers to | `backup` refers to | What happened |
|---|---|---|---|
| 1 | list `[100, 200]` | not bound | A list object is created and named. |
| 2 | list `[100, 200]` | same list | `backup` becomes an alias. |
| 3 | new list `[100, 200, 300]` | old list `[100, 200]` | `+` creates a new list, then `orders` is rebound. |

Contrast that with:

```python
orders = [100, 200]
backup = orders
orders.append(300)
```

Here `append()` mutates the existing list, so both names observe `[100, 200, 300]`.

---

## Practice Tasks

### Task 1: Object inspection

Create a name called `score` and inspect its type, value, and identity. Explain which result is stable across machines and which result is not.

### Task 2: Rebinding

```python
name = "Python"
alias = name
name = "Data Analysis"
```

Predict the value of `alias` before running the code. Explain your prediction using binding and immutability.

### Task 3: Aliasing

Create a list named `raw_values`, bind `working_values = raw_values`, mutate the working list, and explain why the raw list changed. Then repeat using `.copy()` and explain the difference.

### Task 4: Type safety

Write a function that accepts a list of numbers, ignores `None`, rejects an empty cleaned list with a helpful `ValueError`, and returns the average.

### Task 5: Data analyst check

Given a list of transaction records, calculate the total only for records whose status is `"paid"`. Use names that communicate the grain and business meaning of each intermediate result.

---

## Interview Questions

1. What is the difference between a variable and an object in Python?
2. What happens conceptually when Python executes `a = b`?
3. Explain rebinding with an example.
4. Why can two names refer to the same list?
5. What is the difference between `==` and `is`?
6. Why should `is None` be used for checking `None`?
7. What does dynamic typing mean, and what risk does it create in data analysis?
8. What is the difference between mutating a list and rebinding a list name?
9. Why is `id()` useful during debugging but unsuitable as a persistent identifier?
10. How would you preserve raw data while creating a cleaned dataset?

### Strong answer pattern

Start with the rule, show a minimal example, name the edge case, and connect it to production. For example: “`==` compares values, while `is` compares identity. I use `==` for business values and reserve `is` mainly for sentinels such as `None`, because implementation optimisations can make identity appear equal by accident.”

---

## Professional Tips

- Name transformations after what they mean, not after the operation used to create them.
- Treat raw input as evidence. Do not overwrite it while exploring.
- Use `repr()` and `type()` when a value looks correct but behaves incorrectly.
- Make copies intentionally; do not copy every object automatically.
- Do not use `is` for strings, numbers, or ordinary business values.
- In notebooks, restart and run all cells when a result depends on hidden execution order.
- When passing mutable objects into functions, document whether mutation is expected.
- Prefer a returned value over a global variable so the data flow is visible.

---

## Cheat Sheet

| Need | Use | Remember |
|---|---|---|
| Bind a name | `name = object` | Assignment creates or changes a binding. |
| Inspect type | `type(value)` | Type belongs to the object. |
| Inspect identity | `id(value)` | Identity is runtime-specific. |
| Compare values | `a == b` | Correct for ordinary data. |
| Check sentinel | `value is None` | Identity comparison is intentional. |
| Copy a flat list | `items.copy()` | Nested objects may still be shared. |
| Inspect a suspicious value | `repr(value)` | Shows quotes and escape characters. |
| Use a constant convention | `MAX_ROWS = 10_000` | Uppercase communicates intent. |

---

## Summary

Python names refer to objects. An object has a type, value, and identity. Assignment binds or rebinds a name; it does not put a permanent value inside a box. Reassignment changes which object a name refers to, while mutation changes a mutable object that may be visible through several aliases.

The most important rules are:

1. Use descriptive names to make data flow readable.
2. Use `==` for value comparison and `is None` for the `None` sentinel.
3. Expect dynamic typing, but validate types at system boundaries.
4. Preserve raw data and create clearly named derived values.
5. Understand aliasing before mutating lists or dictionaries.

---

## Revision Checklist

- [ ] I can define name, object, reference, binding, and rebinding.
- [ ] I can inspect an object's type, value, and identity.
- [ ] I can explain why `a = b` does not automatically create a copy.
- [ ] I can distinguish reassignment from mutation.
- [ ] I use `==` for values and `is None` for the `None` sentinel.
- [ ] I can explain one aliasing bug and fix it with `.copy()`.
- [ ] I can describe how this model helps me debug a data pipeline.

## References

- Python Language Reference — Assignment statements: https://docs.python.org/3/reference/simple_stmts.html#assignment-statements
- Python Data Model: https://docs.python.org/3/reference/datamodel.html
- Built-in functions (`type`, `id`, `repr`): https://docs.python.org/3/library/functions.html
- Python glossary: https://docs.python.org/3/glossary.html

> **Next:** Part 2 — Data Types. Now that names and objects are clear, we can study the families of objects used to represent numbers, text, truth values, and missing values.
