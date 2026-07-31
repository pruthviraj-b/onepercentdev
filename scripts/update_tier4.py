import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 30: 1.3.1 Scalar subqueries
# ---------------------------------------------------------
parts_data[30] = {
    "title": "1.3.1 Scalar subqueries",
    "content": """# 1.3.1 Scalar Subqueries (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A scalar subquery returns exactly one single value (one row, one column). That single value acts like a literal constant in the outer query's `SELECT`, `WHERE`, or `HAVING` clause.

## 1. What are they?
A scalar subquery is a subquery that returns exactly one value (one row, one column). That value can be used like a constant in the outer query.

## 2. Why do we need them?
- To dynamically calculate values instead of hardcoding static constants.  
- To compare each row against a computed metric (like average or total).  
- To enrich queries with single-value context from other tables.  

## 3. Real-world Analogy
Imagine asking:
> **“What’s my score compared to the class average?”**  

The class average is a scalar subquery — one single number calculated from all students and dropped into your comparison.

## 4. Syntax
```sql
SELECT column1,
       (SELECT AVG(Salary) FROM Employees) AS AvgSalary
FROM Employees;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |
| **3** | Carol | Finance | `70000` |

## 6. Basic Example
```sql
SELECT Name, Salary,
       (SELECT AVG(Salary) FROM Employees) AS CompanyAvg
FROM Employees;
```
👉 Each output row shows individual employee salary alongside the company-wide average.

## 7. In WHERE Clause
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary > (SELECT AVG(Salary) FROM Employees);
```
👉 Finds employees earning strictly above average.

## 8. In HAVING Clause
```sql
SELECT Department, AVG(Salary) AS DeptAvg
FROM Employees
GROUP BY Department
HAVING AVG(Salary) > (SELECT AVG(Salary) FROM Employees);
```
👉 Keeps only departments whose average salary exceeds the overall company average.

## 9. In SELECT with Another Table
```sql
SELECT Name,
       (SELECT DeptName FROM Departments d WHERE d.DeptID = e.DeptID) AS DepartmentName
FROM Employees e;
```
👉 Pulls department name via scalar subquery lookup.

## 10. Real Analyst Scenarios
- **HR**: Compare individual employee salary vs company average.  
- **Finance**: Compare transaction amount vs overall monthly mean spend.  
- **Marketing**: Compare campaign spend vs global average spend.  

## 11. Expected Output
Scalar subqueries return one value per query execution.

> [!WARNING]
> If a scalar subquery returns more than one row or column, the database engine will throw a runtime execution error: `Subquery returned more than 1 row`.

## 12. Visual Explanation
```text
Outer Query  → Processes rows
Scalar Subquery → Computes single value
Combine      → Compare row against single value
```

## 13. Common Mistakes
- Subquery returns multiple rows → runtime crash.  
- Forgetting table aliases in correlated context.  
- Overusing scalar subqueries in `SELECT` lists instead of `JOIN`s (causes severe performance lag).  

## 14. Interview Questions
- **Beginner**: What is a scalar subquery?  
- **Intermediate**: Difference between scalar subquery and `JOIN`?  
- **Advanced**: How do correlated scalar subqueries execute under the hood?  

## 15. Best Practices
- Ensure subquery strictly returns one value using aggregates (`AVG`, `MAX`, `MIN`) or `LIMIT 1`.  
- Use joins if multiple values are needed.  
- Alias subquery results clearly.  

## 16. Comparison Table
| Type | Returns | Primary Use Case |
| :--- | :--- | :--- |
| **Scalar Subquery** | One value | Compare against single aggregate metric |
| **Table Subquery** | Multiple rows | Derived tables, inline views |
| **Correlated Subquery** | Depends on outer row | Row‑by‑row dynamic comparison |

## 17. Memory Trick
> [!TIP]
> **Scalar = Single**.  
> Think of a scalar subquery as a single number dropped directly into your query.

## 18. Cheat Sheet
```sql
-- In SELECT
SELECT Name, (SELECT AVG(Salary) FROM Employees) AS AvgSalary;

-- In WHERE
WHERE Salary > (SELECT AVG(Salary) FROM Employees);
```

## 19. Summary
Scalar subqueries are mini queries that return one value. They’re perfect for comparisons, enrichment, and dynamic calculations.  
"""
}

# ---------------------------------------------------------
# Part 31: 1.3.2 Correlated subqueries
# ---------------------------------------------------------
parts_data[31] = {
    "title": "1.3.2 Correlated subqueries",
    "content": """# 1.3.2 Correlated Subqueries (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A correlated subquery references columns from the outer query. Because it relies on outer values, the subquery executes once for **every single row** evaluated by the outer query.

## 1. What are they?
A correlated subquery is a subquery that references columns from the outer query. It runs once for each row of the outer query.

## 2. Why do we need them?
- To compare each row against a row-specific related set of values.  
- To check existence or conditions dynamically row‑by‑row.  
- To build dynamic filters without complex join logic.  

## 3. Real-world Analogy
Imagine checking:
> **“Is this student’s exam score higher than the average score of their own specific class section?”**  

Each student’s class average must be recalculated per row based on their class ID → correlated subquery.

## 4. Syntax
```sql
SELECT column1
FROM table1 t1
WHERE column1 > (
    SELECT AVG(column2)
    FROM table2 t2
    WHERE t2.related_id = t1.related_id
);
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |
| **3** | Carol | Finance | `70000` |
| **4** | David | IT | `65000` |
| **5** | Emma | HR | `52000` |

## 6. Basic Example
```sql
SELECT Name, Salary
FROM Employees e
WHERE Salary > (
    SELECT AVG(Salary)
    FROM Employees
    WHERE Department = e.Department
);
```
👉 Finds employees earning above their own department’s average salary.

## 7. EXISTS Example
```sql
SELECT Name
FROM Employees e
WHERE EXISTS (
    SELECT 1
    FROM Departments d
    WHERE d.DeptID = e.Department
);
```
👉 Checks if employee’s department ID exists in the master Departments catalog.

## 8. NOT EXISTS Example
```sql
SELECT Name
FROM Employees e
WHERE NOT EXISTS (
    SELECT 1
    FROM Projects p
    WHERE p.EmployeeID = e.EmployeeID
);
```
👉 Finds employees not currently assigned to any active project.

## 9. Real Analyst Scenarios
- **HR**: Employees earning above department average.  
- **Finance**: Transactions larger than that specific customer’s average spend.  
- **Marketing**: Campaigns with higher reach than competitor’s average reach.  
- **Ecommerce**: Orders above product’s historical average price.  

## 10. Expected Output
Row‑specific comparisons, dynamic filtering, and existence checks.

## 11. Visual Explanation
```text
Outer Row → Subquery executes with outer row ID → Result compared → Row kept or dropped
```

## 12. Common Mistakes
> [!WARNING]
> - Forgetting the correlation link (`WHERE t2.id = t1.id`) → converts query into a global scalar subquery.  
> - Severe performance lag on massive tables (subquery executes $N$ times for $N$ outer rows).  
> - Using correlated subqueries where an `INNER JOIN` or window function is significantly faster.  

## 13. Interview Questions
- **Beginner**: What is a correlated subquery?  
- **Intermediate**: Difference between scalar subquery and correlated subquery?  
- **Advanced**: How do correlated subqueries affect query execution plans and performance?  

## 14. Best Practices
- Use correlated subqueries when row‑specific evaluation logic is required.  
- Prefer `JOIN`s or Window Functions (`AVG() OVER(PARTITION BY...)`) on large production tables for performance.  
- Always alias outer and inner tables clearly (`e`, `d`, `p`).  

## 15. Comparison Table
| Type | Execution Frequency | Returns | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Scalar Subquery** | Runs once | Single global value | Compare against global metric |
| **Correlated Subquery**| Runs per outer row | Row-dependent value | Compare against row-specific group metric |

## 16. Memory Trick
> [!TIP]
> **Correlated = Connected**.  
> Think of it as a subquery tied directly to each individual row of the outer table.

## 17. Cheat Sheet
```sql
-- Find salaries above department average
WHERE Salary > (
    SELECT AVG(Salary)
    FROM Employees
    WHERE Department = e.Department
);
```

## 18. Summary
Correlated subqueries are row‑aware mini queries. They run per row, making them powerful but potentially slower. Analysts use them for comparisons, existence checks, and dynamic filtering.  
"""
}

# ---------------------------------------------------------
# Part 32: 1.3.3 EXISTS / NOT EXISTS
# ---------------------------------------------------------
parts_data[32] = {
    "title": "1.3.3 EXISTS / NOT EXISTS",
    "content": """# 1.3.3 EXISTS / NOT EXISTS (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `EXISTS` and `NOT EXISTS` are logical boolean operators used in subqueries to test row presence or absence without returning actual columns.

## 1. What are they?
- **EXISTS** → Returns `TRUE` if the subquery finds at least one matching row.  
- **NOT EXISTS** → Returns `TRUE` if the subquery finds zero matching rows.  

## 2. Why do we need them?
- To check presence or absence of related data across tables.  
- To filter rows based on existence of relationships.  
- To avoid duplicate rows caused by standard `JOIN`s.  

## 3. Real-world Analogy
- **EXISTS** → “Does this student have at least one book borrowed from the library?”  
- **NOT EXISTS** → “Which students have borrowed no books at all?”  

## 4. Syntax
### EXISTS:
```sql
SELECT column1
FROM table1 t1
WHERE EXISTS (
    SELECT 1
    FROM table2 t2
    WHERE t2.related_id = t1.related_id
);
```

### NOT EXISTS:
```sql
SELECT column1
FROM table1 t1
WHERE NOT EXISTS (
    SELECT 1
    FROM table2 t2
    WHERE t2.related_id = t1.related_id
);
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Department |
| :--- | :--- | :--- |
| **1** | Alice | HR |
| **2** | Bob | IT |
| **3** | Carol | Finance |

**Projects Table**

| ProjectID | EmployeeID | ProjectName |
| :--- | :--- | :--- |
| **101** | 1 | HR System |
| **102** | 2 | IT Upgrade |

## 6. EXISTS Example
```sql
SELECT Name
FROM Employees e
WHERE EXISTS (
    SELECT 1
    FROM Projects p
    WHERE p.EmployeeID = e.EmployeeID
);
```
👉 Returns Alice and Bob (they are assigned to projects).

## 7. NOT EXISTS Example
```sql
SELECT Name
FROM Employees e
WHERE NOT EXISTS (
    SELECT 1
    FROM Projects p
    WHERE p.EmployeeID = e.EmployeeID
);
```
👉 Returns Carol (no active project assigned).

## 8. Advanced Example (Correlated)
```sql
SELECT Department
FROM Departments d
WHERE EXISTS (
    SELECT 1
    FROM Employees e
    WHERE e.DeptID = d.DeptID
);
```
👉 Keeps only departments that have at least one assigned employee.

## 9. Real Analyst Scenarios
- **HR**: Find employees without active projects (`NOT EXISTS`).  
- **Finance**: Find bank accounts with at least one transaction (`EXISTS`).  
- **Marketing**: Find marketing campaigns with zero generated leads (`NOT EXISTS`).  
- **Ecommerce**: Find customers who placed orders in 2026 (`EXISTS`).  

## 10. Expected Output
Boolean filtering: rows are kept if the existence condition evaluates to `TRUE`.

## 11. Visual Explanation
```text
EXISTS     → Keep outer rows with ≥1 matching subquery row
NOT EXISTS → Keep outer rows with 0 matching subquery rows
```

## 12. Common Mistakes
> [!WARNING]
> - Using `IN` instead of `EXISTS` when `NULL` values are present in subqueries.  
> - Forgetting the correlation link inside the subquery `WHERE` clause.  
> - Expecting `EXISTS` to return data columns (it only returns `TRUE` or `FALSE`).  

## 13. Interview Questions
- **Beginner**: What does `EXISTS` do?  
- **Intermediate**: Difference between `EXISTS` and `IN`?  
- **Advanced**: How does `NOT EXISTS` handle `NULL` values compared to `NOT IN`?  

## 14. Best Practices
- Use `EXISTS` for presence checks.  
- Use `NOT EXISTS` for absence checks.  
- Use `SELECT 1` inside `EXISTS` subqueries for maximum readability and engine optimization.  

## 15. Comparison Table
| Operator | Returns TRUE when... | Use Case |
| :--- | :--- | :--- |
| **EXISTS** | Subquery returns $\ge 1$ row | Presence validation |
| **NOT EXISTS** | Subquery returns 0 rows | Absence validation |

## 16. Memory Trick
> [!TIP]
> - **EXISTS** = “Yes, it’s there.”  
> - **NOT EXISTS** = “No, it’s missing.”  

## 17. Cheat Sheet
```sql
EXISTS     (SELECT 1 FROM table WHERE condition)
NOT EXISTS (SELECT 1 FROM table WHERE condition)
```

## 18. Summary
`EXISTS` / `NOT EXISTS` are row presence checks. They’re essential for filtering based on relationships, especially when joins aren’t ideal.  
"""
}

# ---------------------------------------------------------
# Part 33: 1.3.4 IN vs EXISTS
# ---------------------------------------------------------
parts_data[33] = {
    "title": "1.3.4 IN vs EXISTS",
    "content": """# 1.3.4 IN vs EXISTS (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `IN` tests value membership against a list or subquery result; `EXISTS` tests boolean row presence via a correlated subquery.

## 1. What are they?
- **IN** → Checks if a column value matches any value in a list or subquery result.  
- **EXISTS** → Checks if a subquery returns at least one matching row.  

## 2. Why do we need them?
- To filter rows based on related data.  
- To decide between simple membership checks (`IN`) vs existence checks (`EXISTS`).  
- To optimize queries depending on dataset size and `NULL` handling.  

## 3. Real-world Analogy
- **IN** → “Is your name in the printed guest list?”  
- **EXISTS** → “Does the guest list have at least one entry for you?”  

## 4. Syntax
### IN
```sql
SELECT Name
FROM Employees
WHERE DepartmentID IN (
    SELECT DeptID
    FROM Departments
    WHERE Location = 'New York'
);
```

### EXISTS
```sql
SELECT Name
FROM Employees e
WHERE EXISTS (
    SELECT 1
    FROM Departments d
    WHERE d.DeptID = e.DepartmentID
      AND d.Location = 'New York'
);
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DepartmentID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |

**Departments Table**

| DeptID | DeptName | Location |
| :--- | :--- | :--- |
| **101** | HR | New York |
| **102** | IT | Chicago |
| **103** | Finance | New York |

## 6. IN Example
```sql
SELECT Name
FROM Employees
WHERE DepartmentID IN (
    SELECT DeptID
    FROM Departments
    WHERE Location = 'New York'
);
```
👉 Returns Alice and Carol.

## 7. EXISTS Example
```sql
SELECT Name
FROM Employees e
WHERE EXISTS (
    SELECT 1
    FROM Departments d
    WHERE d.DeptID = e.DepartmentID
      AND d.Location = 'New York'
);
```
👉 Also returns Alice and Carol.

## 8. Key Differences

| Feature | IN | EXISTS |
| :--- | :--- | :--- |
| **Check Type** | Compares column value to list | Checks row existence |
| **NULL Handling** | `NOT IN` fails completely if `NULL` is present | 100% safe with `NULL`s |
| **Performance** | Better for small static lists | Better for large tables with indexes |
| **Use Case** | Value membership | Relationship existence |

## 9. Advanced Example (Performance & NULL Safety)
> [!WARNING]
> If a subquery returns even a single `NULL` value, `NOT IN` returns **0 rows**!
> Always use `NOT EXISTS` when subqueries might contain `NULL`s.

## 10. Real Analyst Scenarios
- **HR**: Employees in specific department list (`IN`).  
- **Finance**: Accounts with at least one transaction (`EXISTS`).  
- **Marketing**: Campaigns linked to leads (`EXISTS`).  
- **Ecommerce**: Orders in specific product categories (`IN`).  

## 11. Expected Output
Both filter rows, but `EXISTS` is more robust with `NULL`s and large datasets.

## 12. Visual Explanation
```text
IN     → Compares value against subquery list
EXISTS → Checks if correlated subquery returns ≥1 row
```

## 13. Common Mistakes
- Using `NOT IN` when subqueries can contain `NULL` values.  
- Assuming `IN` and `EXISTS` are always performance identical.  
- Using `IN` on massive subquery tables instead of `EXISTS`.  

## 14. Interview Questions
- **Beginner**: Difference between `IN` and `EXISTS`?  
- **Intermediate**: How does `NULL` affect `NOT IN` vs `NOT EXISTS`?  
- **Advanced**: Which is faster for large indexed tables?  

## 15. Best Practices
- Use `IN` for small, static lists (e.g., `IN ('NY', 'LA')`).  
- Use `EXISTS` for large, dynamic subqueries involving joined tables.  
- Always prefer `NOT EXISTS` over `NOT IN` for NULL safety.  

## 16. Memory Trick
> [!TIP]
> - **IN** = “Is it in the list?”  
> - **EXISTS** = “Does a match exist?”  

## 17. Cheat Sheet
```sql
-- IN
WHERE col IN (SELECT col FROM table)

-- EXISTS
WHERE EXISTS (SELECT 1 FROM table WHERE condition)
```

## 18. Summary
- `IN` → membership check, can be tripped up by `NULL`s.  
- `EXISTS` → existence check, safer and often faster for large datasets.  
- Analysts choose based on data size and query context.  
"""
}

# ---------------------------------------------------------
# Part 34: 1.3.5 ANY / ALL
# ---------------------------------------------------------
parts_data[34] = {
    "title": "1.3.5 ANY / ALL",
    "content": """# 1.3.5 ANY / ALL Operators (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `ANY` returns `TRUE` if a comparison holds for at least one value in a subquery; `ALL` returns `TRUE` only if a comparison holds for every value in a subquery.

## 1. What are they?
- **ANY** → Returns `TRUE` if the comparison condition is satisfied by at least one value in the subquery result.  
- **ALL** → Returns `TRUE` if the comparison condition is satisfied by every value in the subquery result.  

## 2. Why do we need them?
- To compare a single value against an entire set of subquery values.  
- To check if a metric is greater than *at least one* benchmark (`ANY`).  
- To check if a metric is greater than *all* benchmarks (`ALL`).  

## 3. Real-world Analogy
- **ANY** → “Is my exam score higher than at least one student’s score in HR?”  
- **ALL** → “Is my exam score higher than every student’s score in HR?”  

## 4. Syntax
```sql
-- ANY
SELECT Name
FROM Employees
WHERE Salary > ANY (SELECT Salary FROM Employees WHERE Department = 'HR');

-- ALL
SELECT Name
FROM Employees
WHERE Salary > ALL (SELECT Salary FROM Employees WHERE Department = 'HR');
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |
| **3** | Carol | Finance | `70000` |
| **4** | David | HR | `52000` |

## 6. ANY Example
```sql
SELECT Name
FROM Employees
WHERE Salary > ANY (SELECT Salary FROM Employees WHERE Department = 'HR');
```
👉 Returns Bob (`60000`) and Carol (`70000`), because their salaries are higher than at least one HR salary (`50000` or `52000`).

## 7. ALL Example
```sql
SELECT Name
FROM Employees
WHERE Salary > ALL (SELECT Salary FROM Employees WHERE Department = 'HR');
```
👉 Returns Carol (`70000`), because her salary is strictly higher than every HR salary (`50000` AND `52000`).

## 8. Advanced Example
```sql
SELECT Name
FROM Employees
WHERE Salary < ALL (SELECT Salary FROM Employees WHERE Department = 'Finance');
```
👉 Finds employees earning less than every Finance salary.

## 9. Real Analyst Scenarios
- **HR**: Find employees earning more than all HR staff (`ALL`).  
- **Finance**: Find transactions larger than any competitor’s transaction (`ANY`).  
- **Marketing**: Find campaigns with reach greater than all others (`ALL`).  
- **Ecommerce**: Find products cheaper than any competitor product (`ANY`).  

## 10. Expected Output
- **ANY** → `TRUE` if condition matches at least one subquery value.  
- **ALL** → `TRUE` if condition matches all subquery values.  

## 11. Visual Explanation
```text
> ANY  → Greater than the MINIMUM subquery value
> ALL  → Greater than the MAXIMUM subquery value
```

## 12. Common Mistakes
> [!WARNING]
> - Confusing `ANY` with `ALL`.  
> - Forgetting `NULL` values in subqueries will cause `ALL` comparisons to evaluate to `UNKNOWN`.  
> - Using `ANY`/`ALL` when a simple `MIN()` or `MAX()` scalar subquery is clearer.  

## 13. Interview Questions
- **Beginner**: What’s the difference between `ANY` and `ALL`?  
- **Intermediate**: How does `> ANY` differ from `IN`?  
- **Advanced**: How do `NULL` values affect `ANY` and `ALL` subqueries?  

## 14. Best Practices
- Use `ANY` for “at least one” condition checks.  
- Use `ALL` for “every single one” condition checks.  
- Prefer `> MIN()` or `> MAX()` scalar subqueries when simpler and clearer.  

## 15. Comparison Table
| Operator | Condition Rule | Meaning |
| :--- | :--- | :--- |
| **ANY** | $\ge 1$ match | At least one value satisfies comparison |
| **ALL** | $100\%$ match | Every single value satisfies comparison |

## 16. Memory Trick
> [!TIP]
> - **ANY** = “At least one.”  
> - **ALL** = “Every single one.”  

## 17. Cheat Sheet
```sql
> ANY (subquery) → Greater than at least one value (greater than MIN)
> ALL (subquery) → Greater than every value (greater than MAX)
```

## 18. Summary
- `ANY` checks if a condition holds for at least one value.  
- `ALL` checks if a condition holds for every single value.  
- Essential for benchmark comparisons across data sets.  
"""
}

# ---------------------------------------------------------
# Save all parts and update API JSON files
# ---------------------------------------------------------
output_dir = os.path.join("frontend", "public", "api")
modules_file = os.path.join(output_dir, "modules-sql.json")

with open(modules_file, "r", encoding="utf-8") as f:
    modules_data = json.load(f)

for part_num, pinfo in parts_data.items():
    # 1. Save content/sql/Part-X/notes.md
    part_dir = os.path.join("content", "sql", f"Part-{part_num}")
    os.makedirs(part_dir, exist_ok=True)
    notes_file = os.path.join(part_dir, "notes.md")
    with open(notes_file, "w", encoding="utf-8") as f:
        f.write(pinfo["content"])

    # 2. Update modules-sql.json
    word_count = len(pinfo["content"].split())
    for m in modules_data:
        for n in m.get("notes", []):
            if n["part"] == part_num:
                n["wordCount"] = word_count
                n["title"] = pinfo["title"]

    # 3. Save notes/sql/X.json
    sql_notes_dir = os.path.join(output_dir, "notes", "sql")
    os.makedirs(sql_notes_dir, exist_ok=True)
    with open(os.path.join(sql_notes_dir, f"{part_num}.json"), "w", encoding="utf-8") as f:
        json.dump({
            "part": part_num,
            "title": pinfo["title"],
            "notes": pinfo["content"],
            "files": [],
            "importance": "high" if part_num in [30, 31, 33] else "medium",
            "module": "1.3 TIER 4: SUBQUERIES",
            "module_id": 4,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Tier 4 (Parts 30 through 34) successfully saved and compiled into static API JSON!")
