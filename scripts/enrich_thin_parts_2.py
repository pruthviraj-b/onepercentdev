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
# PART 49 — LEAD / LAG
# ─────────────────────────────────────────────────────────────────────────
part49 = """# 1.6.4 Window Functions (LEAD, LAG) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LAG` accesses a value from a **previous** row; `LEAD` accesses a value from a **future** row — without needing self-joins. They are the go-to tools for time-series analysis and period-over-period comparisons.

## 1. What are LEAD and LAG?
- **LAG** → Looks *backward* — returns a value from a preceding row in the ordered window.
- **LEAD** → Looks *forward* — returns a value from a succeeding row in the ordered window.

Both functions are window functions used inside `OVER()` clauses.

## 2. Definition
`LAG(column, offset, default)` and `LEAD(column, offset, default)` let you reference adjacent rows by their ordered position, enabling row-to-row difference calculations in a single query pass.

## 3. Why use them?
- Calculate Month-over-Month (MoM) or Year-over-Year (YoY) growth.
- Compare today's metric against yesterday's without a self-join.
- Detect increases, decreases, or status changes between consecutive records.

## 4. Real-world Analogy
Like looking at a marathon leaderboard:
- **LAG** = Who was ahead of you in the last checkpoint?
- **LEAD** = Who will be ahead in the next checkpoint?

---

## 5. Syntax
```sql
LAG(column, offset, default_value)  OVER (PARTITION BY col ORDER BY sort_col)
LEAD(column, offset, default_value) OVER (PARTITION BY col ORDER BY sort_col)
```

| Parameter | Description | Default |
| :--- | :--- | :--- |
| `column` | The column to look up | Required |
| `offset` | Number of rows back/forward | `1` |
| `default_value` | Value returned when boundary is hit | `NULL` |

---

## 6. Example Dataset
**MonthlySales Table**

| SaleID | Month | Sales |
| :--- | :--- | :--- |
| **1** | Jan | `100` |
| **2** | Feb | `120` |
| **3** | Mar | `150` |
| **4** | Apr | `130` |
| **5** | May | `180` |

---

## 7. LAG — Month-over-Month Growth
```sql
SELECT Month, Sales,
       LAG(Sales, 1, 0) OVER (ORDER BY SaleID) AS PrevMonthSales,
       Sales - LAG(Sales, 1, 0) OVER (ORDER BY SaleID) AS MoMGrowth
FROM MonthlySales;
```

**Output:**

| Month | Sales | PrevMonthSales | MoMGrowth |
| :--- | :--- | :--- | :--- |
| Jan | `100` | `0` | `100` |
| Feb | `120` | `100` | `+20` |
| Mar | `150` | `120` | `+30` |
| Apr | `130` | `150` | `-20` |
| May | `180` | `130` | `+50` |

👉 The `default_value` of `0` replaces `NULL` for the first row.

---

## 8. LEAD — Preview Next Month Sales
```sql
SELECT Month, Sales,
       LEAD(Sales, 1) OVER (ORDER BY SaleID) AS NextMonthSales
FROM MonthlySales;
```

**Output:**

| Month | Sales | NextMonthSales |
| :--- | :--- | :--- |
| Jan | `100` | `120` |
| Feb | `120` | `150` |
| Mar | `150` | `130` |
| Apr | `130` | `180` |
| May | `180` | `NULL` |

👉 May has `NULL` for `NextMonthSales` — no future row exists.

---

## 9. LAG with Offset > 1
```sql
SELECT Month, Sales,
       LAG(Sales, 2) OVER (ORDER BY SaleID) AS TwoMonthsAgo
FROM MonthlySales;
```
👉 Compares each month against the sales figure from 2 months prior.

---

## 10. LAG with PARTITION BY (Per Department)
```sql
SELECT Employee, DeptID, Month, Sales,
       LAG(Sales, 1) OVER (PARTITION BY DeptID ORDER BY Month) AS PrevMonthDeptSales
FROM DeptSales;
```
👉 Each department's LAG resets independently — comparisons stay within the same department.

---

## 11. Percentage Change with LAG
```sql
SELECT Month, Sales,
       LAG(Sales) OVER (ORDER BY SaleID) AS PrevSales,
       ROUND(100.0 * (Sales - LAG(Sales) OVER (ORDER BY SaleID))
             / NULLIF(LAG(Sales) OVER (ORDER BY SaleID), 0), 2) AS PctChange
FROM MonthlySales;
```
👉 Calculates percentage growth between months. `NULLIF` prevents division-by-zero errors.

---

## 12. LAG vs LEAD Comparison

| Function | Direction | Returns | Primary Use |
| :--- | :--- | :--- | :--- |
| **LAG** | Backward | Previous row value | MoM/YoY comparisons, trailing data |
| **LEAD** | Forward | Next row value | Forecasting, look-ahead scheduling |

---

## 13. Real Data Analyst Scenarios
- **Finance**: Month-over-Month and Year-over-Year revenue growth analysis.
- **Marketing**: Campaign-to-campaign conversion rate delta.
- **Operations**: Stock level changes between inventory snapshots.
- **HR**: Salary change tracking between performance review periods.

---

## 14. Common Mistakes
> [!WARNING]
> - Forgetting `ORDER BY` inside `OVER()` — without it, results are non-deterministic.
> - Not handling the first/last `NULL` row that occurs at boundaries — use the `default_value` parameter.
> - Confusing `offset` direction: `LAG` goes back, `LEAD` goes forward.

---

## 15. Memory Trick
> [!TIP]
> - **LAG** = Look **A**t **G**one (past)
> - **LEAD** = Look **E**xpecting **A** **D**irection (future)
>
> Or simply: **LAG looks back, LEAD looks forward.**

---

## 16. Key Takeaways
- `LAG` and `LEAD` eliminate the need for self-joins when comparing adjacent rows.
- Always specify `ORDER BY` inside `OVER()`.
- Use the `default_value` parameter to handle boundary `NULL`s gracefully.
- Combine with `PARTITION BY` for group-level row comparisons.
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 50 — Running Totals (SUM/AVG/COUNT OVER)
# ─────────────────────────────────────────────────────────────────────────
part50 = """# 1.6.5 Window Functions (SUM/AVG/COUNT OVER Running Totals) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aggregate window functions — `SUM() OVER`, `AVG() OVER`, `COUNT() OVER` — compute cumulative totals, running averages, and row counts across ordered rows, while preserving every individual transaction row in the output.

## 1. What are Running Totals?
Running totals (also called cumulative aggregates) accumulate a value row-by-row in chronological order without collapsing individual transaction lines into a single summary row.

## 2. Definition
`SUM(col) OVER (ORDER BY date)` tells SQL to sum values from the first row up to and including the current row — updating the total with each new row processed.

## 3. Why use them?
- Track cumulative revenue month-by-month.
- Calculate Year-to-Date (YTD) totals in financial reports.
- Compute moving averages to smooth noisy time-series data.
- Show a running count of events over time.

## 4. Real-world Analogy
Like a bank account statement:
- Each transaction row shows its own amount.
- But there's also a "Running Balance" column that accumulates every transaction.
That running balance = `SUM(Amount) OVER (ORDER BY TransactionDate)`.

---

## 5. Core Syntax
```sql
SUM(col)   OVER (PARTITION BY dept ORDER BY date)
AVG(col)   OVER (PARTITION BY dept ORDER BY date)
COUNT(col) OVER (PARTITION BY dept ORDER BY date)
```

### With explicit frame clause:
```sql
SUM(col) OVER (
    PARTITION BY dept
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

> [!NOTE]
> `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` is the default frame when `ORDER BY` is present — it means "from the very first row of the partition up to the current row."

---

## 6. Example Dataset
**DailySales Table**

| SaleID | Month | Department | Sales |
| :--- | :--- | :--- | :--- |
| **1** | Jan | IT | `100` |
| **2** | Feb | IT | `120` |
| **3** | Mar | IT | `150` |
| **4** | Apr | IT | `130` |

---

## 7. Running Total (SUM OVER)
```sql
SELECT Month, Sales,
       SUM(Sales) OVER (ORDER BY SaleID) AS RunningTotal
FROM DailySales;
```

**Output:**

| Month | Sales | RunningTotal |
| :--- | :--- | :--- |
| Jan | `100` | `100` |
| Feb | `120` | `220` |
| Mar | `150` | `370` |
| Apr | `130` | `500` |

👉 Each row accumulates the previous total — all rows preserved.

---

## 8. Running Average (AVG OVER)
```sql
SELECT Month, Sales,
       AVG(Sales) OVER (ORDER BY SaleID) AS RunningAvg
FROM DailySales;
```

**Output:**

| Month | Sales | RunningAvg |
| :--- | :--- | :--- |
| Jan | `100` | `100.0` |
| Feb | `120` | `110.0` |
| Mar | `150` | `123.3` |
| Apr | `130` | `125.0` |

---

## 9. Running Count (COUNT OVER)
```sql
SELECT Month, Sales,
       COUNT(*) OVER (ORDER BY SaleID) AS RunningCount
FROM DailySales;
```

**Output:**

| Month | Sales | RunningCount |
| :--- | :--- | :--- |
| Jan | `100` | `1` |
| Feb | `120` | `2` |
| Mar | `150` | `3` |
| Apr | `130` | `4` |

---

## 10. Running Total Per Department (with PARTITION BY)
```sql
SELECT Employee, DeptID, Month, Sales,
       SUM(Sales) OVER (PARTITION BY DeptID ORDER BY Month) AS DeptRunningTotal
FROM DeptSales;
```
👉 Running totals reset at each department boundary — each department tracks its own cumulative sum independently.

---

## 11. Moving Average (N-Row Window Frame)
```sql
SELECT Month, Sales,
       AVG(Sales) OVER (
           ORDER BY SaleID
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS MovingAvg3
FROM DailySales;
```
👉 A 3-row moving average — averages the current row and the two rows preceding it. Great for smoothing volatile time-series data.

---

## 12. Window Frame Options

| Frame Clause | What it covers |
| :--- | :--- |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | All rows from start to current (cumulative) |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Current row + 2 prior rows (3-row moving window) |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | Current row to end (reverse cumulative) |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` | All rows in partition (grand total per row) |

---

## 13. Running Total vs GROUP BY Comparison

| Approach | Rows Preserved? | Individual Detail? | Use Case |
| :--- | :--- | :--- | :--- |
| `GROUP BY` + `SUM` | No (collapsed) | No | Summary totals only |
| `SUM() OVER` | Yes | Yes | Running totals with detail |

---

## 14. Real Data Analyst Scenarios
- **Finance**: Bank statement running balance; YTD cumulative revenue.
- **Sales**: Cumulative monthly revenue toward annual quota.
- **Operations**: 7-day moving average for daily demand smoothing.
- **Marketing**: Running count of campaign sign-ups over time.

---

## 15. Common Mistakes
> [!WARNING]
> - Forgetting `ORDER BY` inside `OVER()` — without it, the window aggregates the entire partition at once (grand total per row), not a running total.
> - Confusing `ROWS` vs `RANGE` frame modes — they differ in how they handle ties.
> - Using `GROUP BY` when you need running totals — it collapses rows and loses detail.

---

## 16. Key Takeaways
- `SUM() OVER (ORDER BY date)` = cumulative running total.
- `AVG() OVER (ORDER BY date)` = running (expanding) average.
- `PARTITION BY` resets the running total per group.
- `ROWS BETWEEN` frame clause controls the window size for moving aggregates.
- Running totals preserve all individual rows — unlike `GROUP BY`.
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 53 — SQL Query Execution Order
# ─────────────────────────────────────────────────────────────────────────
part53 = """# 1.6.8 SQL Query Execution Order (Data Analyst Edition)

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
"""

# ─────────────────────────────────────────────────────────────────────────
# PART 54 — Handling Messy Data in SQL
# ─────────────────────────────────────────────────────────────────────────
part54 = """# 1.6.9 Handling Messy Data in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Real-world data is almost always dirty. Analysts typically spend 60–80% of their project time on data cleaning. SQL provides a powerful toolkit for detecting, cleaning, standardizing, and validating messy data.

## 1. What is Messy Data?
Messy data is raw data that contains errors, inconsistencies, missing values, duplicates, or formatting irregularities that prevent accurate analysis.

## 2. Why does it happen?
- Multiple data entry operators with different conventions.
- System migrations and schema changes over time.
- API integrations with inconsistent formats.
- Manual data imports from spreadsheets.
- NULL values from optional form fields.

## 3. Real-world Analogy
Like a raw ingredient order from a supplier:
- Some weights are in kg, others in pounds.
- Some product names are uppercase, others lowercase.
- Some quantities are blank.
- A few records are duplicated.
You must clean and standardize everything before cooking — same applies to SQL data cleaning.

---

## 4. Common Messy Data Problems & SQL Solutions

### A. Missing Values (NULLs)
```sql
-- Replace NULL salary with 0
SELECT Name, COALESCE(Salary, 0) AS CleanSalary
FROM Employees;

-- Find all rows with missing emails
SELECT * FROM Customers WHERE Email IS NULL;

-- Replace NULL with a meaningful default
SELECT Name, ISNULL(Phone, 'Not Provided') AS Phone
FROM Customers;  -- SQL Server
```

---

### B. Duplicate Rows — Detection
```sql
-- Find duplicates by email
SELECT Email, COUNT(*) AS DuplicateCount
FROM Customers
GROUP BY Email
HAVING COUNT(*) > 1;
```

---

### C. Duplicate Rows — Removal (Keep Latest)
```sql
WITH Deduplicated AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email
               ORDER BY CreatedDate DESC
           ) AS rn
    FROM Customers
)
SELECT * FROM Deduplicated WHERE rn = 1;
```
👉 Keeps only the most recent record per email, removes all older duplicates.

---

### D. Inconsistent Text Casing & Trailing Spaces
```sql
-- Standardize: UPPER + TRIM
SELECT UPPER(TRIM(Department)) AS CleanDept
FROM Employees;

-- Clean both leading and trailing spaces
SELECT LTRIM(RTRIM(Name)) AS CleanName
FROM Employees;  -- SQL Server

-- PostgreSQL / MySQL
SELECT TRIM(Name) AS CleanName FROM Employees;
```

---

### E. Type Conversion & Format Standardization
```sql
-- Convert string to date
SELECT CAST('2024-01-15' AS DATE) AS CleanDate;

-- Convert string to integer
SELECT CAST(Revenue AS INT) AS CleanRevenue;

-- Convert string to decimal
SELECT CONVERT(DECIMAL(10,2), Price) AS CleanPrice;  -- SQL Server
```

---

### F. Detecting Outliers & Anomalies
```sql
-- Find transactions with suspicious amounts
SELECT *
FROM Transactions
WHERE Amount < 0 OR Amount > 1000000;

-- Find employees with unrealistic ages
SELECT * FROM Employees WHERE Age < 18 OR Age > 80;
```

---

### G. Standardizing Categories
```sql
-- Normalize inconsistent department names
UPDATE Employees
SET Department = CASE
    WHEN UPPER(TRIM(Department)) LIKE '%IT%' THEN 'IT'
    WHEN UPPER(TRIM(Department)) LIKE '%HUMAN%' THEN 'HR'
    WHEN UPPER(TRIM(Department)) LIKE '%FIN%' THEN 'Finance'
    ELSE Department
END;
```

---

### H. Handling Empty Strings vs NULL
```sql
-- Convert empty strings to NULL
UPDATE Employees
SET Email = NULL
WHERE TRIM(Email) = '';

-- Find rows with either NULL or empty phone
SELECT * FROM Customers
WHERE Phone IS NULL OR TRIM(Phone) = '';
```

---

## 5. Data Profiling — Know Your Data Before Cleaning
```sql
-- Quick profile: total rows, NULLs, distinct values, min/max
SELECT
    COUNT(*)                          AS TotalRows,
    COUNT(Salary)                     AS NonNullSalary,
    COUNT(*) - COUNT(Salary)          AS NullSalaryCount,
    COUNT(DISTINCT Department)        AS UniqueDepts,
    MIN(Salary)                       AS MinSalary,
    MAX(Salary)                       AS MaxSalary,
    AVG(Salary)                       AS AvgSalary
FROM Employees;
```

---

## 6. Data Cleaning Workflow Checklist

| Step | Action | SQL Tools |
| :--- | :--- | :--- |
| **1. Profile** | Understand shape, types, NULLs | `COUNT`, `MIN`, `MAX`, `DISTINCT` |
| **2. Deduplicate** | Remove duplicate rows | `ROW_NUMBER() OVER PARTITION BY` |
| **3. Handle NULLs** | Replace or flag missing values | `COALESCE`, `ISNULL`, `IS NULL` |
| **4. Standardize Text** | Fix casing, trim spaces | `UPPER`, `LOWER`, `TRIM`, `REPLACE` |
| **5. Fix Types** | Convert string to date/int/decimal | `CAST`, `CONVERT`, `TRY_CAST` |
| **6. Remove Outliers** | Flag or remove anomalous values | `WHERE`, `BETWEEN`, `CASE` |
| **7. Validate** | Check cleaned data against rules | `HAVING COUNT(*) > 0`, assertions |

---

## 7. Safe Cleaning with TRY_CAST (SQL Server)
```sql
-- Safely attempt type conversion — returns NULL instead of error
SELECT TRY_CAST(Revenue AS DECIMAL(10,2)) AS SafeRevenue
FROM RawData;
```
👉 If conversion fails, returns `NULL` instead of throwing an error. Safe for batch processing.

---

## 8. Real Data Analyst Scenarios
- **E-commerce**: Clean product price fields imported from multiple CSV sources with mixed formats.
- **Finance**: Deduplicate transaction logs from two merged banking systems.
- **HR**: Standardize department name inconsistencies across 5 years of records.
- **Marketing**: Fix email case inconsistencies before email campaign list building.

---

## 9. Common Mistakes
> [!WARNING]
> - Deleting rows without first auditing what you're removing — always `SELECT` before `DELETE`.
> - Using `= NULL` instead of `IS NULL` — NULL comparisons must use `IS NULL`.
> - Forgetting to handle empty strings (`''`) separately from `NULL`.
> - Running `UPDATE` / `DELETE` without a `WHERE` clause — affects every row!

---

## 10. Key Takeaways
- Data cleaning is 60–80% of a real analyst's job — master it in SQL.
- **Profile first**: always audit data before modifying it.
- **Deduplicate** with `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)`.
- **Replace NULLs** with `COALESCE` or `ISNULL`.
- **Standardize** with `UPPER()`, `LOWER()`, `TRIM()`, `REPLACE()`.
- **Convert types** safely with `TRY_CAST` (SQL Server) or `CAST`.
- Always `SELECT` first — then `UPDATE` or `DELETE`.
"""

# ─────────────────────────────────────────────────────────────────────────
# Save all parts
# ─────────────────────────────────────────────────────────────────────────
parts = [
    (49, "1.6.4 Window Functions (LEAD, LAG) (Data Analyst Edition)", part49),
    (50, "1.6.5 Window Functions (SUM/AVG/COUNT OVER Running Totals) (Data Analyst Edition)", part50),
    (53, "1.6.8 SQL Query Execution Order (Data Analyst Edition)", part53),
    (54, "1.6.9 Handling Messy Data in SQL (Data Analyst Edition)", part54),
]

print("Saving enriched parts...")
for part_num, title, content in parts:
    save_part(part_num, title, content)

with open(MODULES_FILE, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("\nAll 4 thin parts enriched and saved successfully!")
