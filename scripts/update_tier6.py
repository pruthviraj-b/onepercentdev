import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 38: 1.5.1 INNER JOIN
# ---------------------------------------------------------
parts_data[38] = {
    "title": "1.5.1 INNER JOIN",
    "content": """# 1.5.1 INNER JOIN (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `INNER JOIN` combines rows from two tables where the specified join condition matches. It only returns rows with matching values in **both** tables (the mathematical intersection $A \\cap B$).

## 1. What is INNER JOIN?
Combines rows from two tables where the join condition matches.
- Only returns rows with matching values in both tables.  
- Think of it as the strict intersection of two datasets.  

## 2. Why use INNER JOIN?
- To enrich data by pulling related information from another table.  
- To answer questions that require combining multiple relational sources.  
- To avoid incomplete or unmatched records in reports.  

## 3. Real-world Analogy
Imagine two lists:
- **List A**: Employees.  
- **List B**: Departments.  

`INNER JOIN` = **“Show me employees with valid matching departments.”**  
Employees without a matching department, or empty departments without employees, are completely excluded.

## 4. Syntax
```sql
SELECT t1.col1, t2.col2
FROM table1 t1
INNER JOIN table2 t2
  ON t1.key = t2.key;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |
| **4** | David | 104 |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |

## 6. Basic Example
```sql
SELECT e.Name, d.DeptName
FROM Employees e
INNER JOIN Departments d
  ON e.DeptID = d.DeptID;
```
👉 **Returns**: Alice–HR, Bob–IT, Carol–Finance.  
David is excluded because `DeptID = 104` does not exist in the `Departments` table.

## 7. Multiple Joins (3-Table Join)
```sql
SELECT e.Name, d.DeptName, p.ProjectName
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID
INNER JOIN Projects p ON e.EmployeeID = p.EmployeeID;
```
👉 Combines three tables cleanly.

## 8. INNER JOIN vs Implicit WHERE Join
```sql
-- ANSI SQL Standard (Preferred)
SELECT e.Name, d.DeptName
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID;

-- Old Implicit Syntax (Avoid)
SELECT e.Name, d.DeptName
FROM Employees e, Departments d
WHERE e.DeptID = d.DeptID;
```
👉 Equivalent logic, but explicit `INNER JOIN` syntax is cleaner, safer, and preferred in industry practice.

## 9. Filtering with INNER JOIN
```sql
SELECT e.Name, d.DeptName
FROM Employees e
INNER JOIN Departments d ON e.DeptID = d.DeptID
WHERE d.DeptName = 'IT';
```
👉 Filters strictly for IT employees.

## 10. Real Analyst Scenarios
- **HR**: Match employees with official department master list.  
- **Finance**: Match transaction ledger entries with chart of accounts.  
- **Marketing**: Match campaign clicks with converted leads.  
- **Ecommerce**: Match order line items with product catalog items.  

## 11. Expected Output
Only rows with matching keys present in **both** left and right tables.

## 12. Visual Explanation
```text
Employees  ∩  Departments  =  INNER JOIN Result Set
```

## 13. Common Mistakes
> [!WARNING]
> - Forgetting the `ON` clause → produces an accidental **Cartesian Product** ($M \\times N$ rows).  
> - Misusing table aliases → causes ambiguous column error crashes.  
> - Expecting unmatched rows to appear → `INNER JOIN` discards non-matching rows.  

## 14. Interview Questions
- **Beginner**: What does `INNER JOIN` do?  
- **Intermediate**: Difference between `INNER JOIN` and `LEFT JOIN`?  
- **Advanced**: How does indexing foreign key columns affect `INNER JOIN` performance?  

## 15. Best Practices
- Always use explicit `INNER JOIN` syntax (avoid comma syntax in `FROM`).  
- Alias all tables for readability (`e`, `d`, `p`).  
- Ensure join key columns are indexed in both tables for speed.  

## 16. Join Comparison Table
| Join Type | Returned Rows |
| :--- | :--- |
| **INNER JOIN** | Matches only ($A \\cap B$) |
| **LEFT JOIN** | All left rows + matching right rows |
| **RIGHT JOIN** | All right rows + matching left rows |
| **FULL JOIN** | All rows from both tables |

## 17. Memory Trick
> [!TIP]
> **INNER JOIN = “Only Insiders.”**  
> It keeps only rows that belong to both tables.

## 18. Cheat Sheet
```sql
SELECT ...
FROM A
INNER JOIN B ON A.key = B.key;
```

## 19. Summary
`INNER JOIN` is the core join in SQL: it returns only matching rows. It’s the most common join, used for combining related tables cleanly.  
"""
}

# ---------------------------------------------------------
# Part 39: 1.5.2 LEFT JOIN
# ---------------------------------------------------------
parts_data[39] = {
    "title": "1.5.2 LEFT JOIN",
    "content": """# 1.5.2 LEFT JOIN (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LEFT JOIN` (or `LEFT OUTER JOIN`) returns **all rows** from the left table, along with matching rows from the right table. If no match exists, columns from the right table return `NULL`.

## 1. What is LEFT JOIN?
Combines rows from two tables.
- Returns all rows from the left table, and matching rows from the right table.  
- If no match exists, the right‑side columns show `NULL`.  

## 2. Why use LEFT JOIN?
- To keep all records from the main (left) table even if related data is missing.  
- To identify unmatched or incomplete relationships (auditing missing data).  
- To perform data completeness checks without dropping main table records.  

## 3. Real-world Analogy
Imagine:
- **Table A**: Students.  
- **Table B**: Library Borrowings.  

`LEFT JOIN` = **“Show all students, even those who haven’t borrowed any books.”**  
Students with no borrowings still appear, but borrowing details are populated as `NULL`.

## 4. Syntax
```sql
SELECT t1.col1, t2.col2
FROM table1 t1
LEFT JOIN table2 t2
  ON t1.key = t2.key;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |
| **4** | David | 104 |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |

## 6. Basic Example
```sql
SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d
  ON e.DeptID = d.DeptID;
```
👉 Returns all 4 employees. David appears with `NULL` for `DeptName` (no match in Departments).

## 7. Filtering Example (Left Anti Join Pattern)
```sql
SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.DeptName IS NULL;
```
👉 Finds employees without a matching department (David).

## 8. LEFT JOIN vs INNER JOIN Comparison

| Feature | INNER JOIN | LEFT JOIN |
| :--- | :--- | :--- |
| **Matching rows only** | ✅ | ✅ |
| **Unmatched left rows** | ❌ | ✅ |
| **NULLs for missing right data** | ❌ | ✅ |

## 9. Multiple LEFT JOINs
```sql
SELECT e.Name, d.DeptName, p.ProjectName
FROM Employees e
LEFT JOIN Departments d ON e.DeptID = d.DeptID
LEFT JOIN Projects p ON e.EmployeeID = p.EmployeeID;
```
👉 Keeps all employees, even if they have no department or assigned project.

## 10. Real Analyst Scenarios
- **HR**: Show all employees, even those not yet assigned to departments.  
- **Finance**: Show all bank accounts, even those with zero transaction activity.  
- **Marketing**: Show all marketing campaigns, even those with zero leads.  
- **Ecommerce**: Show all products, even those with zero sales.  

## 11. Expected Output
All rows from the left table, with `NULL`s for missing matches from the right table.

## 12. Visual Explanation
```text
LEFT JOIN = Left Table (All Rows) + Matching Right Rows + NULLs for missing right data
```

## 13. Common Mistakes
> [!WARNING]
> - Placing right-table filter conditions in `WHERE` instead of `ON` → accidentally converts `LEFT JOIN` into an `INNER JOIN`!  
> - Forgetting table aliases in multi-table queries.  

## 14. Interview Questions
- **Beginner**: What does `LEFT JOIN` do?  
- **Intermediate**: How does `LEFT JOIN` differ from `INNER JOIN`?  
- **Advanced**: How can `WHERE` conditions inadvertently turn a `LEFT JOIN` into an `INNER JOIN`?  

## 15. Best Practices
- Always alias tables for clarity (`e`, `d`).  
- Use `WHERE right_table.key IS NULL` to find unmatched rows.  
- Keep join filtering conditions in the `ON` clause to preserve outer join behavior.  

## 16. Performance Notes
> [!TIP]
> - `LEFT JOIN` can be slightly slower than `INNER JOIN` on massive tables because it cannot filter out left rows early.  
> - Index join key columns for maximum efficiency.  

## 17. Memory Trick
> [!TIP]
> **LEFT JOIN = “Keep everything from the left.”**  
> Think: Left table is the boss — its rows always appear!

## 18. Cheat Sheet
```sql
SELECT ...
FROM A
LEFT JOIN B ON A.key = B.key;
```
✅ Keeps all A rows, even if B has no match.  

## 19. Summary
`LEFT JOIN` ensures no data loss from the left table. It’s perfect for completeness checks, audits, and inclusive reporting.  
"""
}

# ---------------------------------------------------------
# Part 40: 1.5.3 RIGHT JOIN
# ---------------------------------------------------------
parts_data[40] = {
    "title": "1.5.3 RIGHT JOIN",
    "content": """# 1.5.3 RIGHT JOIN (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `RIGHT JOIN` (or `RIGHT OUTER JOIN`) returns **all rows** from the right table, along with matching rows from the left table. If no match exists, columns from the left table show `NULL`.

## 1. What is RIGHT JOIN?
Combines rows from two tables.
- Returns all rows from the right table, and matching rows from the left table.  
- If no match exists, the left‑side columns show `NULL`.  

## 2. Why use RIGHT JOIN?
- To ensure you keep all records from the right table.  
- To highlight missing matches from the left table.  
- Useful when the right table is treated as the primary dataset.  

## 3. Real-world Analogy
Imagine:
- **Table A**: Employees.  
- **Table B**: Departments.  

`RIGHT JOIN` = **“Show all departments, even those with zero assigned employees.”**  
Departments without employees still appear, but employee details are `NULL`.

## 4. Syntax
```sql
SELECT t1.col1, t2.col2
FROM table1 t1
RIGHT JOIN table2 t2
  ON t1.key = t2.key;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |
| **104** | Marketing |

## 6. Basic Example
```sql
SELECT e.Name, d.DeptName
FROM Employees e
RIGHT JOIN Departments d
  ON e.DeptID = d.DeptID;
```
👉 Returns HR, IT, Finance with employees, plus Marketing with `NULL` employee (no match).

## 7. Filtering Example (Right Anti Join Pattern)
```sql
SELECT d.DeptName
FROM Employees e
RIGHT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL;
```
👉 Finds departments with zero employees (Marketing).

## 8. RIGHT JOIN vs LEFT JOIN

| Feature | LEFT JOIN | RIGHT JOIN |
| :--- | :--- | :--- |
| **Keeps all rows from** | Left table | Right table |
| **NULLs appear in** | Right table | Left table |
| **Use case** | Primary table listed on left | Primary table listed on right |

## 9. Multiple RIGHT JOINs
```sql
SELECT e.Name, d.DeptName, p.ProjectName
FROM Employees e
RIGHT JOIN Departments d ON e.DeptID = d.DeptID
RIGHT JOIN Projects p ON d.DeptID = p.DeptID;
```
👉 Ensures all departments and projects appear, even if no employees match.

## 10. Real Analyst Scenarios
- **HR**: Show all departments, even empty ones.  
- **Finance**: Show all master chart accounts, even those with zero transactions.  
- **Marketing**: Show all campaign channels, even those with zero leads.  
- **Ecommerce**: Show all products, even those unsold.  

## 11. Expected Output
All rows from the right table, with `NULL`s for missing matches from the left table.

## 12. Visual Explanation
```text
RIGHT JOIN = Right Table (All Rows) + Matching Left Rows + NULLs for missing left data
```

## 13. Common Mistakes
> [!WARNING]
> - Forgetting `ON` clause → Cartesian product.  
> - Misplacing filters in `WHERE` → converts `RIGHT JOIN` into an `INNER JOIN`.  
> - Most team style guides prefer `LEFT JOIN` by swapping table order for consistency.  

## 14. Interview Questions
- **Beginner**: What does `RIGHT JOIN` do?  
- **Intermediate**: Difference between `LEFT JOIN` and `RIGHT JOIN`?  
- **Advanced**: When would you prefer `LEFT JOIN` (with table swap) over `RIGHT JOIN`?  

## 15. Best Practices
- Most database teams prefer using `LEFT JOIN` exclusively for readability (swapping `FROM A RIGHT JOIN B` to `FROM B LEFT JOIN A`).  
- Alias tables clearly.  
- Use `IS NULL` to find unmatched rows.  

## 16. Performance Notes
- `RIGHT JOIN` and `LEFT JOIN` perform identically under query optimizers.  
- Index join keys for efficiency.  

## 17. Memory Trick
> [!TIP]
> **RIGHT JOIN = “Keep everything from the right.”**  
> Think: Right table is the boss — its rows always appear!

## 18. Cheat Sheet
```sql
SELECT ...
FROM A
RIGHT JOIN B ON A.key = B.key;
```
✅ Keeps all B rows, even if A has no match.  

## 19. Summary
`RIGHT JOIN` ensures no data loss from the right table. It’s the mirror of `LEFT JOIN`, useful when the right table is the primary dataset.  
"""
}

# ---------------------------------------------------------
# Part 41: 1.5.4 FULL OUTER JOIN
# ---------------------------------------------------------
parts_data[41] = {
    "title": "1.5.4 FULL OUTER JOIN",
    "content": """# 1.5.4 FULL OUTER JOIN (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `FULL OUTER JOIN` returns **all rows** from both tables. Matches are linked, and non-matching rows on either side show `NULL` for missing columns ($A \\cup B$).

## 1. What is FULL OUTER JOIN?
Combines rows from two tables.
- Returns all rows from both tables, whether they match or not.  
- If no match exists, unmatched side columns show `NULL`.  

## 2. Why use FULL OUTER JOIN?
- To get a complete 360-degree view of data across two tables.  
- To identify matches, plus unmatched rows on both sides simultaneously.  
- Perfect for data reconciliation, financial audits, and completeness checks.  

## 3. Real-world Analogy
Imagine:
- **Table A**: Employees.  
- **Table B**: Departments.  

`FULL OUTER JOIN` = **“Show all employees and all departments, regardless of matches.”**  
Unassigned employees and empty departments both appear in the final output.

## 4. Syntax
```sql
SELECT t1.col1, t2.col2
FROM table1 t1
FULL OUTER JOIN table2 t2
  ON t1.key = t2.key;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |
| **4** | David | 105 |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |
| **104** | Marketing |

## 6. Basic Example
```sql
SELECT e.Name, d.DeptName
FROM Employees e
FULL OUTER JOIN Departments d
  ON e.DeptID = d.DeptID;
```

**Output:**
- Alice–HR, Bob–IT, Carol–Finance (Matched)
- David with `NULL` DeptName (Unmatched Employee)
- Marketing with `NULL` Name (Unmatched Department)

## 7. Filtering Example (Full Anti Join Pattern)
```sql
SELECT e.Name, d.DeptName
FROM Employees e
FULL OUTER JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL OR d.DeptID IS NULL;
```
👉 Finds all unmatched rows on both sides (David and Marketing).

## 8. FULL OUTER JOIN vs LEFT/RIGHT JOIN

| Feature | LEFT JOIN | RIGHT JOIN | FULL OUTER JOIN |
| :--- | :--- | :--- | :--- |
| **Keeps all rows from** | Left table | Right table | Both tables |
| **NULLs appear in** | Right table | Left table | Both sides |
| **Use case** | Primary left dataset | Primary right dataset | Complete reconciliation |

## 9. Real Analyst Scenarios
- **HR**: Show all employees and departments, identifying unassigned staff and empty teams.  
- **Finance**: Reconcile internal ledger transactions against bank statements.  
- **Marketing**: Show all campaigns and leads to spot orphan campaigns or unassigned leads.  
- **Ecommerce**: Compare product inventory list vs order history.  

## 10. Expected Output
All rows from both tables, matched or not, with `NULL`s filling gaps.

## 11. Visual Explanation
```text
FULL OUTER JOIN = Left Table + Right Table + Matches + NULLs for missing on both sides
```

## 12. Common Mistakes
> [!WARNING]
> - `FULL OUTER JOIN` is **not natively supported in MySQL** (must simulate using `LEFT JOIN` UNION `RIGHT JOIN`).  
> - Misplacing `WHERE` filters can accidentally convert a `FULL OUTER JOIN` into an `INNER JOIN`.  
> - Confusing `FULL OUTER JOIN` with `CROSS JOIN` (Cartesian product).  

## 13. Interview Questions
- **Beginner**: What does `FULL OUTER JOIN` do?  
- **Intermediate**: How do you simulate `FULL OUTER JOIN` in MySQL?  
- **Advanced**: How do `FULL OUTER JOIN`s affect execution plans on massive datasets?  

## 14. Best Practices
- Use `FULL OUTER JOIN` for data audit and reconciliation tasks.  
- In MySQL, simulate using `LEFT JOIN` `UNION` `RIGHT JOIN`.  
- Always alias tables clearly.  

## 15. MySQL Simulation Cheat Sheet
```sql
-- MySQL Simulation
SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d ON e.DeptID = d.DeptID
UNION
SELECT e.Name, d.DeptName
FROM Employees e
RIGHT JOIN Departments d ON e.DeptID = d.DeptID;
```

## 16. Memory Trick
> [!TIP]
> **FULL OUTER JOIN = “Everything from both sides.”**  
> Think: No row is left behind.

## 17. Summary
`FULL OUTER JOIN` = complete dataset. It ensures you don’t miss any rows from either table, making it ideal for reconciliation and completeness checks.  
"""
}

# ---------------------------------------------------------
# Part 42: 1.5.5 SELF JOIN
# ---------------------------------------------------------
parts_data[42] = {
    "title": "1.5.5 SELF JOIN",
    "content": """# 1.5.5 SELF JOIN (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A `SELF JOIN` is a regular join where a table is joined with itself. It is used to compare rows within the same table or analyze hierarchical structures (like Employee-Manager relationships).

## 1. What is SELF JOIN?
A `SELF JOIN` is a regular join where a table is joined to itself.
- Useful when rows in the same table need to be compared or related.  
- Requires distinct table aliases (`a`, `b` or `e`, `m`) to treat the single table as two separate virtual tables.  

## 2. Why use SELF JOIN?
- To compare rows within the same table.  
- To represent hierarchical relationships (e.g., employees and managers).  
- To find duplicate records in one dataset.  

## 3. Real-world Analogy
Imagine a family tree stored in one table.  
`SELF JOIN` = **“Match each child row with their parent row from the exact same table.”**

## 4. Syntax
```sql
SELECT a.col1, b.col2
FROM table_name a
JOIN table_name b
  ON a.key = b.related_key;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | ManagerID | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | `NULL` | `80000` |
| **2** | Bob | 1 | `60000` |
| **3** | Carol | 1 | `60000` |
| **4** | David | 2 | `50000` |

## 6. Basic Example (Employee – Manager Hierarchy)
```sql
SELECT e.Name AS Employee, m.Name AS Manager
FROM Employees e
LEFT JOIN Employees m
  ON e.ManagerID = m.EmployeeID;
```

**Output:**
- Bob → Alice
- Carol → Alice
- David → Bob
- Alice → `NULL` (Top boss)

## 7. Duplicate / Pair Finder Example
```sql
SELECT a.Name AS Emp1, b.Name AS Emp2, a.Salary
FROM Employees a
JOIN Employees b
  ON a.Salary = b.Salary
 AND a.EmployeeID <> b.EmployeeID;
```
👉 Finds pairs of employees with the exact same salary (Bob and Carol).

## 8. Multi-Level Hierarchical Example
```sql
SELECT e.Name AS Employee, m.Name AS Manager, gm.Name AS GrandManager
FROM Employees e
LEFT JOIN Employees m ON e.ManagerID = m.EmployeeID
LEFT JOIN Employees gm ON m.ManagerID = gm.EmployeeID;
```
👉 Builds a multi-tier management reporting chain.

## 9. Real Analyst Scenarios
- **HR**: Employee–Manager relationships and reporting lines.  
- **Finance**: Compare consecutive transactions within the same account.  
- **Marketing**: Find campaigns with identical budgets.  
- **Ecommerce**: Match orders with duplicate purchase amounts within 24 hours.  

## 10. Expected Output
Rows matched against other rows within the same physical table.

## 11. Visual Explanation
```text
Table A (Employees)  ← JOIN →  Table B (Managers)  [Same Physical Table]
```

## 12. Common Mistakes
> [!WARNING]
> - Forgetting table aliases (`e`, `m`) → causes invalid table references.  
> - Forgetting self-exclusion (`a.ID <> b.ID`) when finding pairs → matches every row to itself.  
> - Misinterpreting `NULL` values in top-level hierarchy nodes.  

## 13. Interview Questions
- **Beginner**: What is a `SELF JOIN`?  
- **Intermediate**: How do you find duplicate rows using a `SELF JOIN`?  
- **Advanced**: How do you construct a multi-level organizational hierarchy query using `SELF JOIN`s?  

## 14. Best Practices
- Always alias tables clearly (`e` for employee, `m` for manager).  
- Use `a.ID <> b.ID` or `a.ID < b.ID` to prevent self-matching and duplicate pair swapping.  
- Combine with `LEFT JOIN` to ensure top-level entities (e.g., CEO with `NULL` manager) are not dropped.  

## 15. Memory Trick
> [!TIP]
> **SELF JOIN = “Mirror Join.”**  
> Think: A table joining itself like looking in a mirror.

## 16. Cheat Sheet
```sql
SELECT e.Name AS Emp, m.Name AS Mgr
FROM Employees e
LEFT JOIN Employees m ON e.ManagerID = m.EmployeeID;
```

## 17. Summary
`SELF JOIN` lets you compare or relate rows within the same table. It’s essential for hierarchical data, duplicate detection, and intra‑table relationships.  
"""
}

# ---------------------------------------------------------
# Part 43: 1.5.6 CROSS JOIN
# ---------------------------------------------------------
parts_data[43] = {
    "title": "1.5.6 CROSS JOIN",
    "content": """# 1.5.6 CROSS JOIN (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A `CROSS JOIN` produces the Cartesian product of two tables. Every row from the first table is paired with every row from the second table ($M \\times N$ rows). No `ON` condition is used.

## 1. What is CROSS JOIN?
A `CROSS JOIN` returns the Cartesian product of two tables.
- Every row from the first table is paired with every row from the second table.  
- No `ON` condition is required.  

## 2. Why use CROSS JOIN?
- To generate all possible combinations between two sets.  
- To create test data or scenario modeling matrices.  
- To expand datasets for analysis (e.g., pairing calendar dates with product IDs).  

## 3. Real-world Analogy
Imagine:
- **Table A**: T-Shirts (`Red`, `Blue`).  
- **Table B**: Sizes (`S`, `M`, `L`).  

`CROSS JOIN` = **“List every t-shirt in every size.”**  
Result = Red-S, Red-M, Red-L, Blue-S, Blue-M, Blue-L ($2 \\times 3 = 6$ rows).

## 4. Syntax
```sql
SELECT t1.col1, t2.col2
FROM table1 t1
CROSS JOIN table2 t2;
```

## 5. Example Dataset
**Employees Table** (2 rows)

| EmployeeID | Name |
| :--- | :--- |
| **1** | Alice |
| **2** | Bob |

**Departments Table** (2 rows)

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |

## 6. Basic Example
```sql
SELECT e.Name, d.DeptName
FROM Employees e
CROSS JOIN Departments d;
```
👉 Returns $2 \\times 2 = 4$ rows: Alice–HR, Alice–IT, Bob–HR, Bob–IT.

## 7. CROSS JOIN with Filter
```sql
SELECT e.Name, d.DeptName
FROM Employees e
CROSS JOIN Departments d
WHERE d.DeptName = 'IT';
```
👉 Keeps only IT combinations.

## 8. CROSS JOIN vs INNER JOIN Comparison

| Feature | INNER JOIN | CROSS JOIN |
| :--- | :--- | :--- |
| **Requires ON condition** | ✅ | ❌ |
| **Returns** | Matching rows only | All combinations ($M \\times N$) |
| **Typical use** | Relational data query | Matrix & combination generation |

## 9. Advanced Example (Dates × Products Matrix)
```sql
SELECT p.ProductName, d.CalendarDate
FROM Products p
CROSS JOIN CalendarDates d;
```
👉 Generates every product for every date (essential for time-series forecasting and zero-sales padding).

## 10. Real Analyst Scenarios
- **HR**: Pair every employee with every mandatory training session.  
- **Finance**: Generate all account $\\times$ month combinations for budget reporting.  
- **Marketing**: Create campaign $\\times$ region combinations.  
- **Ecommerce**: Build product $\\times$ day grid for inventory demand modeling.  

## 11. Expected Output
Total output rows = $(\\text{Rows in Table A}) \\times (\\text{Rows in Table B})$.

## 12. Visual Explanation
```text
Table A (M rows)  ×  Table B (N rows)  =  Cartesian Matrix (M × N rows)
```

## 13. Common Mistakes
> [!WARNING]
> - Unintended `CROSS JOIN` on large tables causes **row explosion** (e.g., $10,000 \\times 10,000 = 100,000,000$ rows) and crashes memory.  
> - Forgetting `ON` clause in an intended `INNER JOIN`.  

## 14. Interview Questions
- **Beginner**: What does `CROSS JOIN` do?  
- **Intermediate**: Difference between `CROSS JOIN` and `INNER JOIN`?  
- **Advanced**: How do you prevent accidental memory crash during Cartesian queries?  

## 15. Best Practices
- Use `CROSS JOIN` intentionally for grid/matrix generation.  
- Apply tight `WHERE` filters to control output size.  
- Avoid running `CROSS JOIN` on large production tables without row limits.  

## 16. Performance Notes
> [!TIP]
> Indexes do not optimize `CROSS JOIN` because every single row combination must be paired.

## 17. Memory Trick
> [!TIP]
> **CROSS JOIN = “Cross Everything.”**  
> Think: Every row crosses paths with every other row.

## 18. Cheat Sheet
```sql
SELECT ...
FROM A
CROSS JOIN B;
```

## 19. Summary
`CROSS JOIN` = Cartesian product. It’s powerful for generating combinations but dangerous if misused. Always control output size with filters.  
"""
}

# ---------------------------------------------------------
# Part 44: 1.5.7 ANTI JOIN (LEFT ANTI, RIGHT ANTI, FULL ANTI)
# ---------------------------------------------------------
parts_data[44] = {
    "title": "1.5.7 ANTI JOIN (LEFT ANTI, RIGHT ANTI, FULL ANTI)",
    "content": """# 1.5.7 ANTI JOIN (LEFT ANTI, RIGHT ANTI, FULL ANTI) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: An `ANTI JOIN` returns rows from one table that have **no match** in another table. It is the logical opposite of a regular join.

## 1. What is an ANTI JOIN?
An `ANTI JOIN` returns rows from one table that do not have a match in another table.
- It’s the logical opposite of an `INNER JOIN`.  
- Implemented using `LEFT JOIN ... WHERE right.key IS NULL`, `NOT EXISTS`, or `NOT IN`.  

## 2. Why use ANTI JOIN?
- To find missing relationships across tables.  
- To identify orphan records and broken integrity.  
- To audit data completeness and spot missing entries.  

## 3. Real-world Analogy
Imagine:
- **Table A**: Students.  
- **Table B**: Library Borrowings.  

`LEFT ANTI JOIN` = **“Show me students who have NEVER borrowed a book.”**

## 4. Types of ANTI JOIN
- **LEFT ANTI JOIN** → Rows in left table with no match in right.  
- **RIGHT ANTI JOIN** → Rows in right table with no match in left.  
- **FULL ANTI JOIN** → Rows in either table with no match in the other.  

## 5. Syntax Patterns

### LEFT ANTI JOIN
```sql
SELECT e.*
FROM Employees e
LEFT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.DeptID IS NULL;
```

### RIGHT ANTI JOIN
```sql
SELECT d.*
FROM Employees e
RIGHT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL;
```

### FULL ANTI JOIN (Simulation)
```sql
SELECT e.EmployeeID, e.Name, d.DeptID, d.DeptName
FROM Employees e
FULL OUTER JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL OR d.DeptID IS NULL;
```

## 6. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |
| **4** | David | 105 |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |
| **104** | Marketing |

## 7. LEFT ANTI JOIN Example
```sql
SELECT e.Name
FROM Employees e
LEFT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.DeptID IS NULL;
```
👉 **Returns**: David (DeptID 105 not found in Departments).

## 8. RIGHT ANTI JOIN Example
```sql
SELECT d.DeptName
FROM Employees e
RIGHT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL;
```
👉 **Returns**: Marketing (DeptID 104 has zero assigned employees).

## 9. FULL ANTI JOIN Example
```sql
SELECT COALESCE(e.Name, 'No Employee') AS Employee,
       COALESCE(d.DeptName, 'No Department') AS Department
FROM Employees e
FULL OUTER JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL OR d.DeptID IS NULL;
```
👉 **Returns**: David (unmatched employee) and Marketing (unmatched department).

## 10. Real Analyst Scenarios
- **HR**: Employees without assigned departments (`LEFT ANTI`).  
- **Finance**: Accounts without transaction history (`LEFT ANTI`).  
- **Marketing**: Campaigns with zero generated leads (`LEFT ANTI`).  
- **Ecommerce**: Products without any customer orders (`RIGHT ANTI`).  
- **Data Auditing**: Any unmatched records across two legacy systems (`FULL ANTI`).  

## 11. Expected Output
Only rows that fail to match across tables.

## 12. Visual Explanation
```text
LEFT ANTI  → Left side unmatched only
RIGHT ANTI → Right side unmatched only
FULL ANTI  → Both sides unmatched
```

## 13. Common Mistakes
> [!WARNING]
> - Forgetting the `WHERE right.key IS NULL` condition (converts back to standard `LEFT JOIN`).  
> - Using `NOT IN` with subqueries containing `NULL` values (returns 0 rows!).  
> - Confusing `ANTI JOIN` with `OUTER JOIN` (ANTI returns ONLY unmatched rows).  

## 14. Interview Questions
- **Beginner**: What is an `ANTI JOIN`?  
- **Intermediate**: How do you implement a `LEFT ANTI JOIN` in SQL?  
- **Advanced**: How do you simulate `FULL ANTI JOIN` in MySQL?  

## 15. Best Practices
- Use `NOT EXISTS` for optimal safety against `NULL` values.  
- Use `LEFT JOIN ... WHERE right.key IS NULL` for maximum readability.  

## 16. Comparison Table
| Anti Join Type | Returned Rows |
| :--- | :--- |
| **LEFT ANTI** | Left rows with no right match |
| **RIGHT ANTI** | Right rows with no left match |
| **FULL ANTI** | All unmatched rows on either side |

## 17. Memory Trick
> [!TIP]
> **ANTI JOIN = “Anti‑match.”**  
> Think: Only the outsiders who don't fit in.

## 18. Cheat Sheet
```sql
-- LEFT ANTI
LEFT JOIN ... WHERE right_key IS NULL

-- RIGHT ANTI
RIGHT JOIN ... WHERE left_key IS NULL

-- FULL ANTI
FULL JOIN ... WHERE left_key IS NULL OR right_key IS NULL
```

## 19. Summary
`ANTI JOIN`s are negative joins — they return rows that don’t match.  
- `LEFT ANTI` → unmatched left rows.  
- `RIGHT ANTI` → unmatched right rows.  
- `FULL ANTI` → unmatched rows on both sides.  
"""
}

# ---------------------------------------------------------
# Part 45: 1.5.8 UNION / UNION ALL & INTERSECT / EXCEPT
# ---------------------------------------------------------
parts_data[45] = {
    "title": "1.5.8 UNION / UNION ALL & INTERSECT / EXCEPT",
    "content": """# 1.5.8 Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Set operations combine result sets from two or more queries vertically. `UNION` merges & deduplicates, `UNION ALL` merges keeping duplicates, `INTERSECT` returns overlap, and `EXCEPT` returns differences.

---

# SECTION 1: UNION vs UNION ALL

## 1. What are they?
- **UNION** → Combines results of two queries and automatically removes duplicate rows.  
- **UNION ALL** → Combines results of two queries and keeps all duplicate rows.  

## 2. Why use them?
- To merge data from multiple queries or separate tables into a single result set.  
- To control whether duplicate rows should be kept or removed.  

## 3. Real-world Analogy
- **UNION** → “Merge guest list A and guest list B, but deduplicate identical names.”  
- **UNION ALL** → “Merge guest list A and guest list B, keeping every entry even if a guest appears on both lists.”  

## 4. Syntax
```sql
-- UNION (Deduplicated)
SELECT col1, col2 FROM table1
UNION
SELECT col1, col2 FROM table2;

-- UNION ALL (Preserves Duplicates)
SELECT col1, col2 FROM table1
UNION ALL
SELECT col1, col2 FROM table2;
```

## 5. Example Dataset
**Employees_US Table**

| Name | Department |
| :--- | :--- |
| Alice | HR |
| Bob | IT |

**Employees_UK Table**

| Name | Department |
| :--- | :--- |
| Bob | IT |
| Carol | Finance |

## 6. UNION Example
```sql
SELECT Name, Department FROM Employees_US
UNION
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Alice–HR, Bob–IT, Carol–Finance (Duplicate Bob is removed).

## 7. UNION ALL Example
```sql
SELECT Name, Department FROM Employees_US
UNION ALL
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Alice–HR, Bob–IT, Bob–IT, Carol–Finance (Duplicates kept).

## 8. UNION vs UNION ALL Key Differences

| Feature | UNION | UNION ALL |
| :--- | :--- | :--- |
| **Duplicates** | Removed | Preserved |
| **Performance** | Slower (requires sorting & deduplication) | Faster (direct append) |
| **Use Case** | When uniqueness is mandatory | When performance matters or duplicates are valid |

---

# SECTION 2: INTERSECT vs EXCEPT

## 9. What are they?
- **INTERSECT** → Returns only rows that appear in **both** query result sets (the overlap $A \\cap B$).  
- **EXCEPT** (or `MINUS` in Oracle) → Returns rows from the first query that do **not** appear in the second query ($A - B$).  

## 10. Real-world Analogy
- **INTERSECT** → “Show me people who are on both the general guest list AND the VIP list.”  
- **EXCEPT** → “Show me people who are on the general guest list BUT NOT on the VIP list.”  

## 11. Syntax
```sql
-- INTERSECT
SELECT col1, col2 FROM table1
INTERSECT
SELECT col1, col2 FROM table2;

-- EXCEPT
SELECT col1, col2 FROM table1
EXCEPT
SELECT col1, col2 FROM table2;
```

## 12. INTERSECT Example
```sql
SELECT Name, Department FROM Employees_US
INTERSECT
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Bob–IT (the only row present in both tables).

## 13. EXCEPT Example
```sql
SELECT Name, Department FROM Employees_US
EXCEPT
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Alice–HR (present in US table, absent in UK table).

---

# SECTION 3: MASTER SET OPERATIONS COMPARISON

| Set Operator | Output Rows | Deduplication | Performance |
| :--- | :--- | :--- | :--- |
| **UNION** | Combined distinct rows | Yes | Slower |
| **UNION ALL** | Combined all rows | No | **Fastest** |
| **INTERSECT** | Common rows in both | Yes | Slower |
| **EXCEPT** | Rows in first query missing from second | Yes | Slower |

---

## 14. Common Rules for All Set Operations
> [!WARNING]
> - Both `SELECT` queries must have the **exact same number of columns**.  
> - Corresponding columns must have **compatible data types**.  
> - `ORDER BY` can only be placed at the **very end** of the combined query.  

## 15. Memory Trick
> [!TIP]
> - **UNION** = Combine + Unique  
> - **UNION ALL** = Combine + All  
> - **INTERSECT** = Intersection (overlap)  
> - **EXCEPT** = Exclusive to Query 1  

## 16. Summary
Set operations combine queries vertically.  
- `UNION` deduplicates results.  
- `UNION ALL` is fastest and keeps duplicates.  
- `INTERSECT` finds common ground.  
- `EXCEPT` finds differences.  
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
            "importance": "high" if part_num in [38, 39, 41, 45] else "medium",
            "module": "1.5 TIER 6: JOINS & SET OPERATIONS",
            "module_id": 6,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Tier 6 (Parts 38 through 45) successfully saved and compiled into static API JSON!")
