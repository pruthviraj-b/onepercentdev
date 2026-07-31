import json
import os

OUTPUT_DIR = os.path.join("frontend", "public", "api")
MODULES_FILE = os.path.join(OUTPUT_DIR, "modules-sql.json")

with open(MODULES_FILE, "r", encoding="utf-8") as f:
    modules_data = json.load(f)

def save_part(part_num, title, content):
    part_dir = os.path.join("content", "sql", f"Part-{part_num}")
    os.makedirs(part_dir, exist_ok=True)
    with open(os.path.join(part_dir, "notes.md"), "w", encoding="utf-8") as f:
        f.write(content)
    sql_notes_dir = os.path.join(OUTPUT_DIR, "notes", "sql")
    os.makedirs(sql_notes_dir, exist_ok=True)
    wc = len(content.split())
    with open(os.path.join(sql_notes_dir, f"{part_num}.json"), "w", encoding="utf-8") as f:
        json.dump({"part": part_num, "title": title, "notes": content, "files": [], "importance": "high"}, f, indent=2, ensure_ascii=False)
    for m in modules_data:
        for n in m.get("notes", []):
            if n["part"] == part_num:
                n["wordCount"] = wc
    print(f"  Part {part_num} saved ({wc} words)")

# ─────────────────────────────────────────────────────────────────────────
# PART 7 — Logical Operators (AND, OR, NOT)
# ─────────────────────────────────────────────────────────────────────────
part7 = """# 1.0.7 Logical Operators (AND, OR, NOT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Logical operators combine multiple Boolean expressions in a `WHERE` clause. `AND` requires all conditions to be true, `OR` requires at least one, and `NOT` negates a condition.

## 1. What is it?
Logical operators in SQL (`AND`, `OR`, `NOT`) allow you to connect multiple filtering conditions together to form complex, precise query criteria.

## 2. Definition
Logical operators evaluate combinations of Boolean conditions and return `TRUE` or `FALSE`, determining which rows are included in query results.

## 3. Why do we need them?
- Filter data using multiple criteria simultaneously.
- Build complex, business-logic-driven queries.
- Eliminate noise by narrowing or broadening row selection.

## 4. Real-world Analogy
- **AND** → A job posting that requires *both* a degree **and** 3 years of experience.
- **OR** → A bank alert triggered if balance drops below ₹1,000 **or** if location is unusual.
- **NOT** → A filter showing all cities **except** Mumbai.

## 5. Truth Tables

| Condition A | Condition B | A AND B | A OR B |
| :--- | :--- | :--- | :--- |
| `TRUE` | `TRUE` | **TRUE** | **TRUE** |
| `TRUE` | `FALSE` | **FALSE** | **TRUE** |
| `FALSE` | `TRUE` | **FALSE** | **TRUE** |
| `FALSE` | `FALSE` | **FALSE** | **FALSE** |

---

## 6. Operator Precedence
SQL evaluates logical operators in this strict order:
1. `NOT` (highest priority)
2. `AND`
3. `OR` (lowest priority)

> [!TIP]
> Always use parentheses `()` to explicitly define execution order and prevent unexpected filtering bugs!

---

## 7. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Chicago |
| **5** | Emma | HR | `52000` | New York |

---

## 8. AND Example
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE Department = 'IT'
  AND Salary >= 60000;
```
👉 Returns employees who are BOTH in IT AND earn 60k or more: Bob, David.

---

## 9. OR Example
```sql
SELECT Name, Department
FROM Employees
WHERE Department = 'HR'
   OR Department = 'Finance';
```
👉 Returns employees in HR OR Finance: Alice, Carol, Emma.

---

## 10. NOT Example
```sql
SELECT Name, City
FROM Employees
WHERE NOT City = 'Chicago';
```
👉 Returns all employees NOT in Chicago: Alice, Carol, Emma.

---

## 11. Combining AND + OR (with Parentheses)
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE (Department = 'IT' OR Department = 'HR')
  AND Salary >= 52000;
```
👉 Returns IT or HR employees earning at least 52k. Parentheses ensure `OR` is evaluated first.

> [!WARNING]
> **Without parentheses**, `AND` binds tighter than `OR`:
> ```sql
> WHERE Department = 'IT' OR Department = 'HR' AND Salary >= 52000
> ```
> This would be interpreted as: `IT` OR (`HR` AND Salary >= 52000) — a different result!

---

## 12. NOT with Other Operators
```sql
-- NOT IN
SELECT Name FROM Employees WHERE Department NOT IN ('HR', 'Finance');

-- NOT BETWEEN
SELECT Name FROM Employees WHERE Salary NOT BETWEEN 50000 AND 60000;

-- NOT LIKE
SELECT Name FROM Employees WHERE Name NOT LIKE 'A%';
```

---

## 13. Real Data Analyst Scenarios
- **Marketing**: Filter customers who opted in AND are from target cities.
- **Finance**: Flag transactions NOT matching standard patterns.
- **HR**: Pull employees in IT OR Finance with salary above threshold.

---

## 14. Common Mistakes
> [!WARNING]
> - Forgetting parentheses when mixing `AND` and `OR`.
> - Using `NOT NULL` instead of `IS NOT NULL`.
> - Over-filtering with too many `AND` conditions returning zero rows.

---

## 15. Key Takeaways
- **AND** → narrows results (more restrictive).
- **OR** → broadens results (more permissive).
- **NOT** → excludes matching rows.
- Always use parentheses `()` when combining `AND` and `OR` to control precedence.
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 8 — BETWEEN Operator
# ─────────────────────────────────────────────────────────────────────────
part8 = """# 1.0.8 BETWEEN Operator (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `BETWEEN` tests whether a value falls within an inclusive range — both the lower AND upper boundary values are included.

## 1. What is it?
The `BETWEEN` operator filters rows where a column value falls within a specified minimum and maximum range (inclusive on both ends).

## 2. Definition
`BETWEEN low AND high` is syntactic shorthand for `column >= low AND column <= high`.

## 3. Why do we need it?
- Cleaner than writing two separate `>=` and `<=` conditions.
- Works on numbers, dates, and text strings.
- Makes queries more readable for range-based filtering.

## 4. Real-world Analogy
Like checking if a flight is scheduled **between** 6 AM and 9 AM — both 6 AM and 9 AM flights are included.

---

## 5. Syntax
```sql
SELECT column_name
FROM table_name
WHERE column_name BETWEEN low_value AND high_value;
```

> [!NOTE]
> `BETWEEN` is **100% inclusive**. It includes both the `low_value` and `high_value` boundary points.
>
> `Salary BETWEEN 50000 AND 60000` is identical to `Salary >= 50000 AND Salary <= 60000`.

---

## 6. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | HireDate |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | 2020-01-15 |
| **2** | Bob | IT | `60000` | 2019-06-01 |
| **3** | Carol | Finance | `70000` | 2021-03-10 |
| **4** | David | IT | `65000` | 2018-11-20 |
| **5** | Emma | HR | `52000` | 2022-07-05 |

---

## 7. Numeric BETWEEN
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary BETWEEN 50000 AND 60000;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Alice | `50000` |
| Bob | `60000` |
| Emma | `52000` |

👉 50000 and 60000 are both included in the result.

---

## 8. Date BETWEEN
```sql
SELECT Name, HireDate
FROM Employees
WHERE HireDate BETWEEN '2019-01-01' AND '2021-12-31';
```
👉 Returns employees hired between Jan 2019 and Dec 2021 — inclusive.

---

## 9. Text BETWEEN
```sql
SELECT Name
FROM Employees
WHERE Name BETWEEN 'Alice' AND 'David';
```
👉 Returns names alphabetically between Alice and David (inclusive): Alice, Bob, Carol, David.

---

## 10. NOT BETWEEN
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary NOT BETWEEN 50000 AND 60000;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |

👉 Returns employees earning outside the 50k–60k range.

---

## 11. BETWEEN vs >= and <=

| Style | Readability | Result |
| :--- | :--- | :--- |
| `BETWEEN 50000 AND 60000` | Clean ✅ | Inclusive |
| `>= 50000 AND <= 60000` | Verbose | Identical |

---

## 12. Real Data Analyst Scenarios
- **Finance**: Pull transactions within a specific amount range.
- **HR**: Find employees hired in a particular year range.
- **Sales**: Filter products priced within a customer's budget band.

---

## 13. Common Mistakes
> [!WARNING]
> - Writing the range backwards: `BETWEEN 60000 AND 50000` returns **zero rows**.
> - Confusing `BETWEEN` as exclusive — it is **inclusive** of both boundaries.
> - For time ranges, be careful: `BETWEEN '2021-01-01' AND '2021-12-31'` may miss events on Dec 31 if timestamps include time components. Use `< '2022-01-01'` for safety.

---

## 14. Key Takeaways
- `BETWEEN` works on numbers, dates, and text.
- Always **inclusive** of start and end limits.
- `NOT BETWEEN` excludes the range.
- Write ranges in **ascending order** (low → high).
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 9 — IN Operator
# ─────────────────────────────────────────────────────────────────────────
part9 = """# 1.0.9 IN Operator (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `IN` checks whether a value matches any member of a specified list or subquery result — a clean alternative to chaining multiple `OR` conditions.

## 1. What is it?
The `IN` operator lets you match a column value against a set of predefined values in a single, readable expression.

## 2. Definition
`IN (val1, val2, val3, ...)` is equivalent to `= val1 OR = val2 OR = val3` but is far more concise and readable.

## 3. Why do we need it?
- Replace long chains of `OR` conditions with a single clean clause.
- Dynamically filter using subquery results.
- Improve query readability, especially when checking 5+ values.

## 4. Real-world Analogy
Like a bouncer at a club with a guest list:
- `IN` = "Is this person's name on the list?"
- If yes → let them in. If no → exclude.

---

## 5. Syntax

**Static list:**
```sql
SELECT column_name
FROM table_name
WHERE column_name IN ('Value1', 'Value2', 'Value3');
```

**Subquery:**
```sql
SELECT column_name
FROM table_name
WHERE column_name IN (SELECT col FROM other_table WHERE condition);
```

---

## 6. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Chicago |
| **5** | Emma | HR | `52000` | New York |

---

## 7. IN vs OR Comparison
```sql
-- Using IN (Clean & Preferred)
SELECT Name, City
FROM Employees
WHERE City IN ('New York', 'Boston');

-- Equivalent OR chain (Verbose)
SELECT Name, City
FROM Employees
WHERE City = 'New York' OR City = 'Boston';
```
Both return the same result — `IN` is easier to read and maintain.

**Output:**

| Name | City |
| :--- | :--- |
| Alice | New York |
| Carol | Boston |
| Emma | New York |

---

## 8. NOT IN
```sql
SELECT Name, Department
FROM Employees
WHERE Department NOT IN ('HR', 'Finance');
```
👉 Returns only IT employees: Bob, David.

---

## 9. IN with Subquery
```sql
SELECT Name, Salary
FROM Employees
WHERE EmployeeID IN (
    SELECT EmployeeID FROM HighPerformers WHERE Rating = 'A'
);
```
👉 Filters employees whose IDs are returned by the subquery — powerful dynamic filtering.

---

## 10. IN with Numbers
```sql
SELECT Name, EmployeeID
FROM Employees
WHERE EmployeeID IN (1, 3, 5);
```
👉 Returns Alice (1), Carol (3), Emma (5).

---

## 11. IN vs EXISTS

| Operator | Best For | NULL Handling |
| :--- | :--- | :--- |
| **IN** | Static lists, small subqueries | Caution with NULLs in list |
| **EXISTS** | Large subqueries, correlated checks | More robust with NULLs |

> [!WARNING]
> If the `IN` list contains `NULL`, queries may return unexpected results.
> `WHERE col IN (1, NULL, 3)` will NOT return rows where col IS NULL — NULL comparisons are always `UNKNOWN` in SQL.

---

## 12. Real Data Analyst Scenarios
- **HR**: Pull employees from specific departments.
- **Marketing**: Filter customers from target cities.
- **Finance**: Select transactions of specific types or categories.
- **Sales**: Find orders from a list of priority customers.

---

## 13. Common Mistakes
> [!WARNING]
> - Putting `NULL` inside an `IN` list without expecting it to match `NULL` rows.
> - Using `NOT IN` with a subquery that might return `NULL` — use `NOT EXISTS` instead for safety.
> - Forgetting quotes around text values inside `IN`.

---

## 14. Key Takeaways
- `IN` replaces long chains of `OR` conditions cleanly.
- Accepts both static value lists and dynamic subqueries.
- `NOT IN` excludes listed values.
- Be cautious with `NULLs` when using `NOT IN` with subqueries.
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 10 — LIKE & Wildcards
# ─────────────────────────────────────────────────────────────────────────
part10 = """# 1.0.10 LIKE & Wildcards (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LIKE` searches for a specified pattern inside string columns using wildcards (`%` for any sequence of characters, `_` for exactly one character).

## 1. What is it?
The `LIKE` operator performs pattern-matching searches on text columns using wildcard symbols to represent unknown or variable characters.

## 2. Definition
`LIKE` compares a column's string value to a pattern that can include literal characters and wildcard placeholders.

## 3. Why do we need it?
- Search for names/emails/descriptions that partially match a pattern.
- Filter rows where exact values are unknown.
- Build flexible text-based search criteria.

## 4. Real-world Analogy
Think of Google Search's autocomplete — typing "data" matches "data analyst," "data engineer," "database," etc. `LIKE` does the same inside SQL.

---

## 5. Wildcard Symbols

| Wildcard | Meaning | Example Pattern | Matches |
| :--- | :--- | :--- | :--- |
| `%` | Zero, one, or many characters | `'A%'` | Alice, Amber, A, Abc123 |
| `_` | Exactly one single character | `'B_b'` | Bob, Bab, Bcb |

---

## 6. Common Patterns Cheat Sheet

| Pattern | What it Matches |
| :--- | :--- |
| `'A%'` | Starts with "A" |
| `'%son'` | Ends with "son" |
| `'%data%'` | Contains "data" anywhere |
| `'A_'` | 2 characters, starts with "A" |
| `'_o_'` | 3-letter word with "o" in middle |
| `'__r%'` | Third character is "r" |

---

## 7. Example Dataset
**Employees Table**

| EmployeeID | Name | Email | Department |
| :--- | :--- | :--- | :--- |
| **1** | Alice | alice@company.com | HR |
| **2** | Bob | bob@company.com | IT |
| **3** | Carol | carol@company.com | Finance |
| **4** | David | david@external.org | IT |
| **5** | Emma | emma@company.com | HR |

---

## 8. Starts With — LIKE 'A%'
```sql
SELECT Name
FROM Employees
WHERE Name LIKE 'A%';
```

**Output:**

| Name |
| :--- |
| Alice |

👉 Only names beginning with "A".

---

## 9. Ends With — LIKE '%l'
```sql
SELECT Name
FROM Employees
WHERE Name LIKE '%l';
```

**Output:**

| Name |
| :--- |
| Carol |

👉 Only names ending in "l".

---

## 10. Contains — LIKE '%@company%'
```sql
SELECT Name, Email
FROM Employees
WHERE Email LIKE '%@company%';
```
👉 Finds employees with company domain email addresses.

---

## 11. Single Character Wildcard — LIKE '_o_'
```sql
SELECT Name
FROM Employees
WHERE Name LIKE '_o_';
```

**Output:**

| Name |
| :--- |
| Bob |

👉 Matches exactly 3-character names with "o" in the middle.

---

## 12. NOT LIKE
```sql
SELECT Name, Email
FROM Employees
WHERE Email NOT LIKE '%@company.com';
```
👉 Returns employees with non-company email domains: David.

---

## 13. Case Sensitivity

| Database | LIKE Case Sensitive? | Case-Insensitive Option |
| :--- | :--- | :--- |
| **MySQL** | No (default) | Use `LIKE BINARY` for sensitive |
| **PostgreSQL** | Yes | Use `ILIKE` for insensitive |
| **SQL Server** | Depends on collation | Use `COLLATE` clause |

> [!TIP]
> In PostgreSQL, use `ILIKE` instead of `LIKE` for case-insensitive pattern matching:
> ```sql
> WHERE Name ILIKE 'alice%';
> ```

---

## 14. Escaping Wildcards
If you want to search for a literal `%` or `_` character, use the `ESCAPE` clause:
```sql
SELECT * FROM Products WHERE Name LIKE '100\%' ESCAPE '\';
```
👉 Searches for names literally containing "100%".

---

## 15. Real Data Analyst Scenarios
- **HR**: Find all employees with names starting with a specific letter.
- **Marketing**: Filter email lists by domain pattern.
- **Finance**: Find invoice numbers matching a prefix pattern.
- **Customer Service**: Search order notes containing specific keywords.

---

## 16. Common Mistakes
> [!WARNING]
> - Using `LIKE` without wildcards (e.g., `LIKE 'Alice'`) is the same as `= 'Alice'` — pointless but valid.
> - Placing `%` at the start (`'%Alice'`) forces a full-table scan and is slow on large tables.
> - Forgetting that `_` matches **exactly one** character (not zero or multiple).

---

## 17. Key Takeaways
- `%` matches any number of characters (including zero).
- `_` matches exactly one character.
- `NOT LIKE` excludes pattern matches.
- Use `ILIKE` in PostgreSQL for case-insensitive matching.
- Leading wildcards (`'%value'`) are slow — avoid on large datasets without indexes.
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 51 — PARTITION BY
# ─────────────────────────────────────────────────────────────────────────
part51 = """# 1.6.6 PARTITION BY (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `PARTITION BY` divides a query's result set into separate logical windows (groups). Window functions reset their calculations at each partition boundary while **preserving every individual output row** — unlike `GROUP BY` which collapses rows.

## 1. What is PARTITION BY?
`PARTITION BY` is a clause used inside window functions' `OVER()` definition. It splits the dataset into independent groups ("windows") for calculation purposes without removing any rows from the output.

## 2. Definition
`PARTITION BY col` tells a window function to treat each unique value of `col` as a separate calculation group, similar to `GROUP BY` but row-preserving.

## 3. Why use it?
- Rank employees **within** each department independently.
- Calculate running totals that reset per category.
- Compare each row against its own group's aggregate.
- Assign sequential row numbers within each partition.

## 4. Real-world Analogy
Like running a class leaderboard **per subject**:
- Maths class has its own rank 1, 2, 3...
- Science class independently has rank 1, 2, 3...
- All students still appear in the final report — no rows removed.

---

## 5. Syntax
```sql
<window_function>() OVER (
    PARTITION BY partition_column
    ORDER BY sort_column DESC
)
```

---

## 6. Example Dataset
**Sales Table**

| SaleID | Employee | DeptID | Amount |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `500` |
| **2** | Bob | 102 | `700` |
| **3** | Carol | 102 | `650` |
| **4** | David | 101 | `800` |
| **5** | Emma | 101 | `550` |

---

## 7. ROW_NUMBER with PARTITION BY
```sql
SELECT Employee, DeptID, Amount,
       ROW_NUMBER() OVER (PARTITION BY DeptID ORDER BY Amount DESC) AS DeptRank
FROM Sales;
```

**Output:**

| Employee | DeptID | Amount | DeptRank |
| :--- | :--- | :--- | :--- |
| David | 101 | `800` | 1 |
| Emma | 101 | `550` | 2 |
| Alice | 101 | `500` | 3 |
| Bob | 102 | `700` | 1 |
| Carol | 102 | `650` | 2 |

👉 Rankings reset to 1 for each department — Alice, Emma, David are ranked within Dept 101; Bob and Carol within Dept 102.

---

## 8. SUM with PARTITION BY (Department Totals)
```sql
SELECT Employee, DeptID, Amount,
       SUM(Amount) OVER (PARTITION BY DeptID) AS DeptTotal
FROM Sales;
```

**Output:**

| Employee | DeptID | Amount | DeptTotal |
| :--- | :--- | :--- | :--- |
| Alice | 101 | `500` | `1850` |
| David | 101 | `800` | `1850` |
| Emma | 101 | `550` | `1850` |
| Bob | 102 | `700` | `1350` |
| Carol | 102 | `650` | `1350` |

👉 Each row still shows, but `DeptTotal` reflects the whole department's sum — not just that row.

---

## 9. Running Total with PARTITION BY + ORDER BY
```sql
SELECT Employee, DeptID, Amount,
       SUM(Amount) OVER (PARTITION BY DeptID ORDER BY SaleID) AS RunningTotal
FROM Sales;
```
👉 Running total resets at each department boundary, accumulating within each partition.

---

## 10. AVG with PARTITION BY (Compare vs Group Average)
```sql
SELECT Employee, DeptID, Amount,
       AVG(Amount) OVER (PARTITION BY DeptID) AS DeptAvg,
       Amount - AVG(Amount) OVER (PARTITION BY DeptID) AS DiffFromAvg
FROM Sales;
```
👉 Each employee's salary compared against their own department's average — in a single query.

---

## 11. PARTITION BY vs GROUP BY Comparison

| Clause | Collapses Rows? | Returns All Rows? | Purpose |
| :--- | :--- | :--- | :--- |
| **GROUP BY** | Yes ✅ | No (Summary only) | Aggregate reporting |
| **PARTITION BY** | No ❌ | Yes (All rows preserved) | Window analytics & ranking |

---

## 12. Multiple PARTITION BY Columns
```sql
SELECT Employee, DeptID, Region, Amount,
       RANK() OVER (PARTITION BY DeptID, Region ORDER BY Amount DESC) AS RegionalRank
FROM Sales;
```
👉 Rank within each unique DeptID + Region combination.

---

## 13. Real Data Analyst Scenarios
- **HR**: Rank employees within their department by salary.
- **Finance**: Running revenue totals per business unit per quarter.
- **Sales**: Compare each rep's performance vs team average.
- **E-commerce**: Top N products per category.

---

## 14. Common Mistakes
> [!WARNING]
> - Using `PARTITION BY` without `ORDER BY` in ranking functions — results may be non-deterministic.
> - Confusing `PARTITION BY` with `GROUP BY` — the key difference is row preservation.
> - Forgetting that `PARTITION BY` is inside `OVER()` — it is not a standalone clause.

---

## 15. Memory Trick
> [!TIP]
> **PARTITION BY** = Divide into buckets, compute inside each bucket, keep **ALL rows** in the output.

---

## 16. Key Takeaways
- `PARTITION BY` = `GROUP BY` for window functions but **without** collapsing rows.
- Calculations reset at each partition boundary.
- Works with any window function: `ROW_NUMBER`, `RANK`, `SUM`, `AVG`, `LEAD`, `LAG`, etc.
- Can partition by multiple columns for finer grouping.
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 52 — PIVOT / UNPIVOT
# ─────────────────────────────────────────────────────────────────────────
part52 = """# 1.6.7 PIVOT / UNPIVOT in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `PIVOT` rotates row values into column headers (wide format). `UNPIVOT` rotates column headers back into row values (long/normalized format). These are essential for data reshaping in analytics and reporting.

## 1. What are PIVOT and UNPIVOT?
- **PIVOT**: Transforms unique row values of one column into separate column headers, with aggregated values filling each cell.
- **UNPIVOT**: The reverse — takes multiple columns and "stacks" their headers and values into two columns (key-value pairs).

## 2. Definition
- `PIVOT` → Converts a **long** table to a **wide** table.
- `UNPIVOT` → Converts a **wide** table to a **long** (normalized) table.

## 3. Why do we need them?
- **PIVOT**: Generate cross-tab reports (monthly sales per product).
- **UNPIVOT**: Normalize wide survey/spreadsheet data before loading into a database.
- Reshape data for dashboards and BI tools.

## 4. Real-world Analogy
- **PIVOT**: Like a spreadsheet's "pivot table" — turning months (rows) into columns so each column shows a month's total.
- **UNPIVOT**: Like "melting" a wide spreadsheet into a tidy database table with one value per row.

---

## 5. Example Dataset (Before PIVOT)
**Sales Table (Long Format)**

| Employee | Month | Amount |
| :--- | :--- | :--- |
| Alice | Jan | `500` |
| Alice | Feb | `600` |
| Bob | Jan | `700` |
| Bob | Feb | `750` |

---

## 6. PIVOT — Rows to Columns

### SQL Server Syntax
```sql
SELECT Employee, [Jan], [Feb]
FROM Sales
PIVOT (
    SUM(Amount) FOR Month IN ([Jan], [Feb])
) AS PivotTable;
```

**Output (Wide Format):**

| Employee | Jan | Feb |
| :--- | :--- | :--- |
| Alice | `500` | `600` |
| Bob | `700` | `750` |

👉 Month values became columns. Each cell holds the aggregated `SUM(Amount)`.

---

## 7. PIVOT using CASE (Cross-database compatible)
```sql
SELECT Employee,
       SUM(CASE WHEN Month = 'Jan' THEN Amount ELSE 0 END) AS Jan,
       SUM(CASE WHEN Month = 'Feb' THEN Amount ELSE 0 END) AS Feb
FROM Sales
GROUP BY Employee;
```
👉 Works in MySQL, PostgreSQL, SQLite — not just SQL Server. **Preferred for portability.**

---

## 8. UNPIVOT — Columns to Rows

### SQL Server Syntax
```sql
SELECT Employee, Month, Amount
FROM PivotTable
UNPIVOT (
    Amount FOR Month IN ([Jan], [Feb])
) AS UnpivotTable;
```

**Output (Long Format):**

| Employee | Month | Amount |
| :--- | :--- | :--- |
| Alice | Jan | `500` |
| Alice | Feb | `600` |
| Bob | Jan | `700` |
| Bob | Feb | `750` |

👉 Column headers (Jan, Feb) became row values in the Month column.

---

## 9. UNPIVOT using UNION ALL (Cross-database compatible)
```sql
SELECT Employee, 'Jan' AS Month, Jan AS Amount FROM PivotTable
UNION ALL
SELECT Employee, 'Feb' AS Month, Feb AS Amount FROM PivotTable;
```
👉 Works across MySQL, PostgreSQL, SQLite. **Preferred for portability.**

---

## 10. PIVOT in PostgreSQL (using crosstab)
```sql
SELECT * FROM crosstab(
  'SELECT Employee, Month, SUM(Amount) FROM Sales GROUP BY 1,2 ORDER BY 1,2'
) AS PivotResult(Employee TEXT, Jan NUMERIC, Feb NUMERIC);
```
> [!NOTE]
> PostgreSQL requires the `tablefunc` extension: `CREATE EXTENSION IF NOT EXISTS tablefunc;`

---

## 11. When to Use Each

| Operation | Input Format | Output Format | Use Case |
| :--- | :--- | :--- | :--- |
| **PIVOT** | Long (rows) | Wide (columns) | Monthly reports, cross-tabs |
| **UNPIVOT** | Wide (columns) | Long (rows) | Database normalization, tidy data |

---

## 12. Real Data Analyst Scenarios
- **Finance**: Monthly revenue by product — PIVOT to show Jan, Feb, Mar as columns.
- **HR**: Quarterly headcount per department in one row per team.
- **Survey Analysis**: UNPIVOT wide responses (Q1, Q2, Q3 columns) into long format for analysis.
- **BI Tools**: Many BI tools require long format — UNPIVOT before loading.

---

## 13. Common Mistakes
> [!WARNING]
> - Native `PIVOT`/`UNPIVOT` syntax only works in **SQL Server** and **Oracle** — use `CASE` + `GROUP BY` or `UNION ALL` for portability.
> - Forgetting to handle `NULL` values in PIVOT cells (use `COALESCE` or `ISNULL`).
> - PIVOTing too many columns dynamically — requires dynamic SQL for large sets of categories.

---

## 14. Dynamic PIVOT (SQL Server)
When pivot column values are unknown at query time, use dynamic SQL:
```sql
DECLARE @cols NVARCHAR(MAX), @query NVARCHAR(MAX);
SELECT @cols = STRING_AGG(QUOTENAME(Month), ',') FROM (SELECT DISTINCT Month FROM Sales) t;
SET @query = 'SELECT Employee, ' + @cols + ' FROM Sales PIVOT (SUM(Amount) FOR Month IN (' + @cols + ')) p';
EXEC sp_executesql @query;
```

---

## 15. Key Takeaways
- **PIVOT**: Long → Wide. Rows become columns. Great for reports.
- **UNPIVOT**: Wide → Long. Columns become rows. Great for normalization.
- Use `CASE + GROUP BY` for PIVOT portability across all databases.
- Use `UNION ALL` for UNPIVOT portability across all databases.
- Native `PIVOT`/`UNPIVOT` = SQL Server / Oracle only.
"""

# ─────────────────────────────────────────────────────────────────────────
# Save all parts
# ─────────────────────────────────────────────────────────────────────────
parts = [
    (7,  "1.0.7 Logical Operators (AND, OR, NOT) (Data Analyst Edition)", part7),
    (8,  "1.0.8 BETWEEN Operator (Data Analyst Edition)", part8),
    (9,  "1.0.9 IN Operator (Data Analyst Edition)", part9),
    (10, "1.0.10 LIKE & Wildcards (Data Analyst Edition)", part10),
    (51, "1.6.6 PARTITION BY (Master Module - Data Analyst Edition)", part51),
    (52, "1.6.7 PIVOT / UNPIVOT in SQL (Data Analyst Edition)", part52),
]

print("Saving enriched parts...")
for part_num, title, content in parts:
    save_part(part_num, title, content)

with open(MODULES_FILE, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("\nAll 6 thin parts enriched and saved successfully!")
