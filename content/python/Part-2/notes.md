# Module 1 — Python Foundations for Data Analysis
## Topic 2: Memory Concepts

---

## 0. Prerequisites

- Topic 1: **Variables** (name-binding, mutability basics, `id()`, `type()`)
- Basic comfort running Python code (script or notebook)

---

## 1. Concept Overview

**Simple Definition**
**Memory concepts** in Python describe *how and where* data is actually stored when you create variables and objects — including how Python allocates memory, how it decides whether to create a new object or reuse an existing one, and how it cleans up memory that is no longer needed.

**Why This Topic Exists**
Every variable you create must physically live somewhere in your computer's RAM. Python abstracts this away so beginners don't need to manage memory manually (unlike C/C++), but **understanding what happens underneath** is essential for writing correct, efficient, bug-free code — especially when working with large datasets.

**Why It Is Important**
- Explains **why some bugs happen** (e.g., two variables unexpectedly changing together).
- Directly affects **performance** when working with large pandas DataFrames or NumPy arrays.
- A frequently tested concept in **technical interviews** for data roles.
- Helps you write **memory-efficient code** when processing millions of rows — critical in real analytics jobs.

**Learning Objectives**
By the end of this topic, you will be able to:
1. Explain how Python allocates memory for variables and objects.
2. Understand reference counting and garbage collection.
3. Use `id()`, `is`, and `sys.getsizeof()` to inspect memory behavior.
4. Understand object interning and why small integers/strings behave specially.
5. Apply this knowledge to write memory-efficient data analysis code.

**Where It Is Used in Real Projects**
- Optimizing memory usage when loading large CSV/Excel files into pandas.
- Debugging unexpected shared-mutation bugs in ETL scripts.
- Choosing between copying vs. referencing large datasets during transformation steps.
- Managing memory in long-running data pipelines or Jupyter sessions that process large data repeatedly.

---

## 2. In-Depth Explanation

### 2.1 Core Concept: Names, Objects, and the Heap

In Python, all data (integers, strings, lists, DataFrames, everything) is stored as an **object** in a region of memory called the **heap**. A variable name is just a **reference** — like a sticky note — pointing to an object's location on the heap.

```python
x = 1000
```
- Python creates an integer object `1000` on the heap.
- `x` becomes a reference pointing to that object's memory address.

This is why Python is often described as using a **"names and objects"** model rather than a "variables and values" model.

### 2.2 Reference Counting

Python's primary memory management technique is **reference counting**. Every object keeps an internal counter tracking how many variable names (or other references) currently point to it.

```python
import sys

a = [1, 2, 3]
print(sys.getrefcount(a))   # counts references (includes a temporary one from the function call itself)

b = a
print(sys.getrefcount(a))   # count increases — now 'a' and 'b' both reference it
```

- When a new reference is made (`b = a`), the reference count **increases**.
- When a reference is removed (`del b`, or `b` reassigned to something else, or the variable goes out of scope), the count **decreases**.
- When the reference count reaches **zero**, Python automatically **deallocates** the object, freeing that memory.

### 2.3 Garbage Collection (Handling Circular References)

Reference counting alone cannot handle **circular references** — where two objects reference each other but nothing external references either:

```python
a = {}
b = {}
a['other'] = b
b['other'] = a

del a
del b
# a and b still reference each other internally — refcount never hits 0 through simple counting
```

To solve this, Python has a secondary system: the **cyclic garbage collector** (module: `gc`), which periodically scans for groups of objects that only reference each other and cleans them up, even though their individual reference counts never dropped to zero through normal deletion.

```python
import gc
gc.collect()   # manually triggers garbage collection
```

### 2.4 Important Terminology

| Term | Meaning |
|---|---|
| **Heap** | The region of memory where all Python objects are stored |
| **Reference** | A variable name (or container slot) pointing to an object |
| **Reference Count** | Number of references currently pointing to an object |
| **Garbage Collection (GC)** | Automatic process of freeing memory for unreachable objects |
| **Circular Reference** | Two or more objects referencing each other, preventing refcount from reaching zero |
| **Interning** | Python's optimization of reusing existing immutable objects (small ints, some strings) instead of creating duplicates |
| **Stack vs Heap** | Stack stores function call frames and local variable references; heap stores the actual objects |
| **Shallow Copy** | A copy of a container where inner nested objects are still shared references |
| **Deep Copy** | A full, independent copy where nested objects are also duplicated |

### 2.5 Key Rules & Behavior

**Rule 1 — Immutable objects create new memory on change:**
```python
x = 10
y = x
x = x + 5     # creates a NEW object (15); x now points to it; y still points to 10
print(x, y)   # 15 10
```

**Rule 2 — Mutable objects share memory until explicitly copied:**
```python
list1 = [1, 2, 3]
list2 = list1
list2.append(4)
print(list1)   # [1, 2, 3, 4] — same object, so list1 sees the change too
```

**Rule 3 — Small integers and short strings are "interned" (cached and reused):**
```python
a = 100
b = 100
print(a is b)     # True — small ints (-5 to 256) are cached by Python; both point to the SAME object

x = 1000
y = 1000
print(x is y)     # False (in most implementations) — large ints are NOT cached; separate objects
```
This is a well-known "gotcha" — always use `==` to compare **values**, and reserve `is` for checking whether two names point to the **exact same object** (commonly used with `None`: `if x is None`).

### 2.6 Why It Works This Way

Python's automatic memory management (reference counting + garbage collection) exists to let developers focus on **logic, not manual memory allocation/deallocation** (unlike C, where you must `malloc()`/`free()` memory yourself). This tradeoff favors **productivity and safety** over raw control — a perfect fit for data analysis, where the priority is fast iteration on data, not low-level memory management.

---

## 3. Syntax & Usage

### 3.1 Key Functions & Tools for Inspecting Memory

| Function/Operator | Purpose | Returns |
|---|---|---|
| `id(obj)` | Returns the unique memory identity of an object | Integer (memory address, implementation-dependent) |
| `is` | Checks if two variables reference the **same object** | Boolean |
| `sys.getsizeof(obj)` | Returns the memory size of an object in bytes | Integer |
| `sys.getrefcount(obj)` | Returns the number of references to an object | Integer |
| `gc.collect()` | Manually triggers garbage collection | Integer (number of objects collected) |
| `copy.copy(obj)` | Creates a **shallow copy** | New object (top-level only) |
| `copy.deepcopy(obj)` | Creates a **deep copy** | New object (fully independent) |
| `del variable` | Removes a reference to an object (may trigger deallocation) | None |

### 3.2 Usage Examples

```python
import sys
import copy

x = [1, 2, 3]

print(id(x))                # memory address of x
print(sys.getsizeof(x))     # size in bytes

y = copy.copy(x)            # shallow copy — new outer list, same inner elements (fine here, since ints are immutable)
z = copy.deepcopy(x)        # deep copy — fully independent structure (matters for nested lists/dicts)

print(x is y)                # False — different objects
print(x == y)                # True — same values
```

**Parameter/Return Notes:**
- `id()` — **Parameter:** any object. **Returns:** an integer unique to that object during its lifetime.
- `sys.getsizeof()` — **Parameter:** any object. **Returns:** size in bytes (does not include sizes of nested/referenced objects for containers).
- `copy.copy()` / `copy.deepcopy()` — **Parameter:** the object to duplicate. **Returns:** a new object; `deepcopy` recursively duplicates nested mutable objects too.

---

## 4. Practical Examples

### 4.1 Basic Example — Checking Identity
```python
a = 10
b = 10
print(a is b)       # True
print(id(a), id(b)) # same address
```
**Line-by-line explanation:**
- `a = 10` and `b = 10` → both reference the same cached small-integer object (Python interns integers from -5 to 256).
- `a is b` → checks if both point to the same object.
- `id()` calls confirm identical memory addresses.

**Expected Output:**
```
True
140704625930032 140704625930032   # (exact numbers vary by system)
```
**Why:** Python's small-integer caching means both variables reference one shared object rather than creating two separate ones.

---

### 4.2 Intermediate Example — Reference Counting in Action
```python
import sys

data = [10, 20, 30]
print(sys.getrefcount(data))   # baseline count

more_refs = data
print(sys.getrefcount(data))   # count increased by 1

del more_refs
print(sys.getrefcount(data))   # count decreased back
```
**Line-by-line explanation:**
- `data = [...]` → creates a list object; one reference (`data`) plus the temporary one from passing it into `getrefcount()`.
- `more_refs = data` → adds a second reference to the same object, increasing the count.
- `del more_refs` → removes that reference, decreasing the count.

**Expected Output (approximate — exact numbers vary):**
```
2
3
2
```
**Why:** Each new variable name pointing to the object increases its reference count; deleting a reference decreases it. When the count hits zero, the object becomes eligible for garbage collection.

---

### 4.3 Advanced Example — Shallow vs Deep Copy with Nested Data
```python
import copy

original = [[1, 2], [3, 4]]

shallow = copy.copy(original)
deep = copy.deepcopy(original)

original[0].append(99)

print("Original:", original)
print("Shallow: ", shallow)
print("Deep:    ", deep)
```
**Line-by-line explanation:**
- `original` → a list containing two nested lists (mutable objects inside a mutable object).
- `shallow = copy.copy(original)` → creates a new outer list, but the **inner lists are still shared references** with `original`.
- `deep = copy.deepcopy(original)` → creates a fully independent copy, including new inner lists.
- `original[0].append(99)` → modifies the first nested list in `original`.

**Expected Output:**
```
Original: [[1, 2, 99], [3, 4]]
Shallow:  [[1, 2, 99], [3, 4]]
Deep:     [[1, 2], [3, 4]]
```
**Why:** `shallow` shares the same nested list objects as `original`, so the `.append(99)` change is visible in both. `deep` has completely separate nested objects, so it remains unaffected.

---

### 4.4 Real-World Project Example — Memory-Safe DataFrame Handling
```python
import pandas as pd

raw_df = pd.read_csv("sales_data.csv")

# WRONG (memory-unsafe) approach — this does NOT create an independent copy in older pandas patterns
# working_df = raw_df
# working_df.drop(columns=['unused_col'], inplace=True)  # would silently affect raw_df too in some cases

# CORRECT (memory-safe) approach
working_df = raw_df.copy()
working_df.drop(columns=['unused_col'], inplace=True)

print("Raw columns:", list(raw_df.columns))
print("Working columns:", list(working_df.columns))
```
**Line-by-line explanation:**
- `raw_df = pd.read_csv(...)` → loads the full dataset once; this should be treated as the untouched "source of truth."
- `working_df = raw_df.copy()` → explicitly creates an independent DataFrame object so transformations don't corrupt the original.
- `.drop(..., inplace=True)` → modifies `working_df` directly, without affecting `raw_df`.

**Expected Output (example):**
```
Raw columns: ['date', 'region', 'unused_col', 'revenue']
Working columns: ['date', 'region', 'revenue']
```
**Why:** Using `.copy()` explicitly breaks the shared reference, which is essential in real pipelines to preserve an untouched original dataset for validation, rollback, or comparison at later pipeline stages.

---

## 5. Real-World Applications

| Domain | How Memory Concepts Are Used |
|---|---|
| **Data Analysis** | Deciding when to `.copy()` a DataFrame vs. work on it directly, to avoid corrupting raw data |
| **Data Science** | Managing memory usage when processing large training datasets in-memory |
| **Machine Learning** | Efficient handling of large tensors/arrays without unnecessary duplication (critical in GPU memory-constrained settings) |
| **Business Analytics** | Preventing accidental overwrites of master reporting datasets during exploratory analysis |
| **Finance** | Ensuring calculations on live trading data don't mutate shared reference data used elsewhere |
| **Healthcare** | Avoiding shared-reference bugs when handling sensitive patient datasets across multiple analysis steps |
| **Marketing** | Managing memory efficiently when processing large customer segmentation datasets |
| **AI** | Efficient memory reuse for embeddings and large model weight objects |
| **Automation** | Avoiding memory leaks in long-running scheduled scripts that repeatedly process data |
| **Dashboards** | Ensuring cached data used by a dashboard isn't accidentally mutated by a background refresh process |
| **ETL Pipelines** | Explicit copying at each transformation stage to keep raw, staged, and final data independently traceable |

**How Big Tech Uses This Concept**
- **Google**: Systems like Pandas-on-Spark and BigQuery internally optimize memory by avoiding unnecessary data duplication across distributed nodes.
- **Microsoft**: Power BI's in-memory (VertiPaq) engine uses compression and reference-sharing techniques conceptually related to avoiding duplicate memory use.
- **Amazon**: Large-scale inventory/recommendation systems use careful memory reference management to process petabytes of data efficiently on limited-memory clusters.
- **Netflix**: Streaming analytics pipelines are memory-optimized to process billions of viewing events without redundant copies.
- **Uber**: Real-time pricing/ETA systems avoid unnecessary object duplication to keep computations fast at massive scale.
- **Spotify**: Recommendation engines manage large in-memory embeddings carefully to avoid memory bloat across millions of users/songs.

---

## 6. Best Practices & Common Mistakes

### Best Practices
- Always use `.copy()` (or `copy.deepcopy()` for nested structures) when you need an independent version of mutable data.
- Use `is` only for identity checks (especially `is None`), never for value comparison — use `==` for values.
- Delete large, no-longer-needed variables (`del big_df`) in long-running scripts/notebooks to free memory sooner.
- Use `sys.getsizeof()` or `df.memory_usage(deep=True)` (pandas-specific) to monitor memory usage on large datasets.

### Performance Tips
- Avoid unnecessary deep copies of huge datasets — deep copies are slow and memory-intensive; only use them when nested mutability is actually a risk.
- Process large datasets in **chunks** (e.g., `pd.read_csv(..., chunksize=100000)`) instead of loading everything into memory at once.
- Reassign variables to `None` or `del` them to release memory for very large intermediate objects in long pipelines.

### Clean Code Recommendations
```python
# Bad — ambiguous whether working_df is independent
working_df = raw_df
working_df['new_col'] = working_df['a'] + working_df['b']

# Good — explicit and safe
working_df = raw_df.copy()
working_df['new_col'] = working_df['a'] + working_df['b']
```

### Common Beginner Mistakes
1. Assuming `df2 = df1` creates a separate copy (it does not — same object reference).
2. Using `is` to compare values: `if x is 5` instead of `if x == 5` (can behave inconsistently due to integer caching).
3. Not realizing that `inplace=True` operations still modify the shared object if no `.copy()` was made earlier.
4. Ignoring memory usage until a script crashes on a large dataset (`MemoryError`).

### Common Interview Mistakes
- Confusing **reference counting** with **garbage collection** — they are related but distinct: refcounting handles simple cases immediately; the cyclic GC handles circular reference edge cases.
- Being unable to explain why `a = 256; b = 256; a is b` is `True`, but `a = 257; b = 257; a is b` may be `False` (small integer caching range).
- Saying Python "copies" values on assignment — incorrect; Python binds names to objects (see Topic 1).

### Debugging Tips
- If a bug shows unexpected shared changes, check with `id(var1) == id(var2)` or `var1 is var2`.
- Use `df.memory_usage(deep=True).sum()` to check actual memory consumption of a pandas DataFrame.
- If memory keeps growing in a loop, check for accidental accumulation of references (e.g., appending large objects to a list that's never cleared).

### Things to Avoid
- Avoid relying on `is` for equality checks on anything other than `None`, `True`, `False`.
- Avoid deep-copying entire large DataFrames when a shallow `.copy()` (or no copy at all) would suffice.
- Avoid keeping unused large variables alive in notebooks across many cells — restart kernels periodically during heavy analysis.

---

## 7. Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `MemoryError` | Trying to load a dataset too large for available RAM | Use chunked reading (`chunksize`), reduce dtypes, or use Dask/Polars for out-of-core processing |
| Unexpected shared mutation (no error thrown) | Assignment created a reference, not a copy | Use `.copy()` or `copy.deepcopy()` |
| `RecursionError` during deep copy of self-referencing objects | Circular references not handled properly by custom copy logic | Use Python's built-in `copy.deepcopy()`, which handles circular references safely |
| `x is 5` gives inconsistent results across Python versions/builds | Relying on CPython's integer caching implementation detail | Never use `is` for value comparisons — use `==` |
| High memory usage with no visible cause | Old large variables never deleted/dereferenced | Use `del`, reassign to `None`, or restart the session; inspect with `sys.getsizeof()` |

---

## 8. Practice & Interview Preparation

### Beginner Questions
1. What does it mean when we say a Python variable is a "reference" to an object?
2. What is the difference between `is` and `==`?
3. What does `id()` return?

### Intermediate Questions
4. Explain reference counting with a simple example.
5. What is the difference between a shallow copy and a deep copy?
6. Why does `a = 100; b = 100; a is b` return `True`, while large integers may not behave the same way?

### Advanced Questions
7. How does Python's garbage collector handle circular references that reference counting cannot resolve?
8. Why is `sys.getsizeof()` sometimes misleading for containers like lists of lists?
9. In what scenarios would `copy.deepcopy()` cause performance issues, and how would you avoid them?

### Scenario-Based Questions
10. You're processing a 5 GB CSV file and your script crashes with `MemoryError`. What memory concepts would you apply to fix this?
11. Two DataFrames in your pipeline are showing identical unexpected changes. How would you diagnose whether this is a shared-reference issue?

### Coding Exercises
```python
# Exercise 1: Demonstrate that list assignment shares a reference (no copy)

# Exercise 2: Fix Exercise 1 using .copy() so the original list is unaffected

# Exercise 3: Create a nested list, make a shallow copy, modify a nested 
# element, and show that the shallow copy is still affected. Then fix it 
# using deepcopy.
```

### Interview Q&A
**Q: Does Python copy an object when you do `b = a`?**
A: No. It creates a new **reference** (`b`) pointing to the same object `a` already points to. No new object is created — this is why mutable object changes through `b` are visible through `a`.

**Q: What triggers garbage collection in Python?**
A: Primarily, an object's reference count dropping to zero (immediate deallocation). For circular references that reference counting can't resolve, Python's cyclic garbage collector periodically scans and cleans up unreachable reference cycles.

**Q: Why shouldn't you use `is` to compare integers or strings for equality?**
A: Because `is` checks object identity, not value equality. Due to CPython's internal caching/interning of small integers and some strings, `is` may accidentally return `True` or unpredictably `False` depending on implementation details — `==` is the correct, reliable operator for value comparison.

---

## 9. Mini Project / Assignment

**Task: "Memory-Safe Data Pipeline Audit"**

1. Load any CSV dataset into a DataFrame called `raw_df`.
2. Create `working_df` using `.copy()` and perform at least two transformations (drop a column, filter rows).
3. Print `raw_df.columns` and `working_df.columns` to prove the original is untouched.
4. Use `sys.getsizeof()` or `working_df.memory_usage(deep=True).sum()` to report memory usage before and after dropping a column.
5. Demonstrate one shallow copy vs deep copy example using a nested list of your choice, showing the behavioral difference clearly with printed output.

**Deliverable:** A single `.py` script with comments explaining each memory concept applied.

---

## 10. Quick Revision

### Key Points
- Variables are references to objects stored on the **heap**; Python manages memory automatically.
- **Reference counting** deallocates objects immediately when their count hits zero.
- The **cyclic garbage collector** cleans up circular references that reference counting can't resolve.
- Small integers (-5 to 256) and some strings are **interned/cached** — `is` may return `True` for equal values in these cases, but this should never be relied upon.
- **Shallow copies** duplicate only the outer container; **deep copies** duplicate everything, including nested objects.

### Important Syntax
```python
id(obj)                     # memory address / identity
obj1 is obj2                # identity check
obj1 == obj2                 # value equality check
sys.getsizeof(obj)          # size in bytes
sys.getrefcount(obj)        # number of references
copy.copy(obj)              # shallow copy
copy.deepcopy(obj)          # deep copy
del obj                     # remove a reference
gc.collect()                # manual garbage collection
```

### Cheat Sheet / Summary Table

| Concept | Behavior |
|---|---|
| Assignment (`b = a`) | Creates a new reference, NOT a copy |
| `is` | Identity check (same object in memory) |
| `==` | Value equality check |
| Shallow copy | New outer container, shared inner references |
| Deep copy | Fully independent copy, including nested objects |
| Reference count = 0 | Object is deallocated immediately |
| Circular references | Handled by the cyclic garbage collector, not simple refcounting |

### Do's and Don'ts

| Do's | Don'ts |
|---|---|
| Use `.copy()`/`deepcopy()` for independent data | Assume `b = a` copies data |
| Use `==` for value comparison | Use `is` for value comparison (except `None`, `True`, `False`) |
| Monitor memory on large datasets | Load massive files entirely into memory without checking size first |
| Delete/clear unused large variables | Let large unused DataFrames sit in memory across long notebook sessions |

---

## 11. Further Reading

- [Python Official Docs — Data Model & Garbage Collection](https://docs.python.org/3/reference/datamodel.html)
- [Python `gc` module documentation](https://docs.python.org/3/library/gc.html)
- [Python `copy` module documentation](https://docs.python.org/3/library/copy.html)
- [Pandas — Memory Usage documentation](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.memory_usage.html)
