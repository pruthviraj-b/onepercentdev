# 1.6.8 SQL Query Execution Order (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: SQL is a declarative language. The **logical execution order** of clauses is completely different from the order in which you *write* them. Understanding this order prevents common query errors and helps you write optimized, correct SQL.

## 1. What is it?
The SQL Query Execution Order (also called the Logical Processing Order) defines the sequence in which the database engine processes each clause of a `SELECT` statement — regardless of how the query is written.

## 2. Definition
SQL queries are processed in a specific internal order that differs from the written order. The database reads `FROM` before `SELECT`, even though `SELECT` is written first.

## 3. Why does it matter?
- Explains why `WHERE` cannot reference `SELECT` column aliases.
- Explains why `HAVING` filters aggregated groups but `WHERE` cannot.
- Helps write correct queries the first time — no trial-and-error debugging.
- Essential knowledge for query optimization and troubleshooting.

## 4. Real-world Analogy
Like cooking a meal:
1. **FROM** = Gather ingredients (identify your data source).
2. **WHERE** = Throw away bad ingredients (filter raw rows).
3. **GROUP BY** = Sort ingredients into bowls (bucket rows into groups).
4. **HAVING** = Discard bowls that don't meet recipe standards (filter groups).
5. **SELECT** = Cook and plate the food (choose which columns to show).
6. **DISTINCT** = Remove duplicate plates (deduplicate result).
7. **ORDER BY** = Arrange plates nicely on the table (sort).
8. **LIMIT/TOP** = Serve only the top 3 dishes (truncate output).

---

## 5. The 8-Step Logical Execution Sequence

```text
1. FROM        → Identify source tables & execute JOINs
2. WHERE       → Filter raw individual rows (before grouping)
3. GROUP BY    → Group filtered rows into summary buckets
4. HAVING      → Filter aggregated groups (after grouping)
5. SELECT      → Evaluate column expressions & assign aliases
6. DISTINCT    → Deduplicate result set rows
7. ORDER BY    → Sort final result rows
8. LIMIT / TOP → Truncate output to N rows
```

---

## 6. Visual Execution Order Table

| Step | Clause | What Happens | Can Use Aliases? |
| :--- | :--- | :--- | :--- |
| 1 | `FROM` / `JOIN` | Tables resolved, JOINs applied | No |
| 2 | `WHERE` | Individual row filtering | No |
| 3 | `GROUP BY` | Rows grouped into buckets | No |
| 4 | `HAVING` | Group-level filtering | No (aggregates only) |
| 5 | `SELECT` | Columns chosen, aliases created | Aliases born here |
| 6 | `DISTINCT` | Duplicates removed | Yes |
| 7 | `ORDER BY` | Results sorted | Yes |
| 8 | `LIMIT`/`TOP` | Rows truncated | Yes |

---

## 7. The Classic "Alias in WHERE" Error

```sql
-- ❌ WRONG — AnnualSalary alias doesn't exist yet at WHERE step
SELECT Salary * 12 AS AnnualSalary
FROM Employees
WHERE AnnualSalary > 60000;

-- ✅ CORRECT — Repeat the expression in WHERE
SELECT Salary * 12 AS AnnualSalary
FROM Employees
WHERE Salary * 12 > 60000;
```

> [!WARNING]
> `WHERE` executes at Step 2, but `SELECT` aliases are only created at Step 5. That's why you cannot reference a `SELECT` alias inside `WHERE`.

---

## 8. WHERE vs HAVING — The Right Filter for the Right Stage

```sql
-- WHERE: filters BEFORE grouping (individual rows)
SELECT Department, AVG(Salary) AS AvgSalary
FROM Employees
WHERE Salary > 40000       -- Filter individual rows first
GROUP BY Department
HAVING AVG(Salary) > 55000; -- Then filter aggregated groups
```

| Clause | Filters | Stage | Can Use Aggregates? |
| :--- | :--- | :--- | :--- |
| **WHERE** | Individual rows | Before GROUP BY | ❌ No |
| **HAVING** | Aggregated groups | After GROUP BY | ✅ Yes |

---

## 9. ORDER BY Can Use SELECT Aliases

```sql
SELECT Name, Salary * 12 AS AnnualSalary
FROM Employees
ORDER BY AnnualSalary DESC;  -- ✅ Valid! ORDER BY runs after SELECT
```
👉 `ORDER BY` (Step 7) executes after `SELECT` (Step 5), so aliases are visible.

---

## 10. Written Order vs Execution Order

| Written Order | Execution Order |
| :--- | :--- |
| `SELECT` | `FROM` |
| `FROM` | `WHERE` |
| `WHERE` | `GROUP BY` |
| `GROUP BY` | `HAVING` |
| `HAVING` | `SELECT` |
| `ORDER BY` | `DISTINCT` |
| `LIMIT` | `ORDER BY` |
| | `LIMIT` |

---

## 11. Full Query Example Annotated
```sql
SELECT Department, COUNT(*) AS HeadCount, AVG(Salary) AS AvgSal  -- Step 5
FROM Employees                                                      -- Step 1
WHERE City IN ('New York', 'Chicago')                              -- Step 2
GROUP BY Department                                                 -- Step 3
HAVING AVG(Salary) > 55000                                         -- Step 4
ORDER BY AvgSal DESC                                               -- Step 7
LIMIT 5;                                                           -- Step 8
```

---

## 12. Real Data Analyst Impact
- Prevents wasted debugging time on alias-in-WHERE errors.
- Helps choose between `WHERE` and `HAVING` correctly.
- Essential for understanding query optimization — database engines use this order to choose indexes.

---

## 13. Key Takeaways
- SQL execution order ≠ written order.
- `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`.
- `WHERE` cannot use `SELECT` aliases — they don't exist yet at that step.
- `HAVING` filters groups; `WHERE` filters rows.
- `ORDER BY` CAN use `SELECT` aliases — it runs after `SELECT`.
