import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 46: 1.6.1 CTE (basic + chained)
# ---------------------------------------------------------
parts_data[46] = {
    "title": "1.6.1 CTE (basic + chained)",
    "content": """# 1.6.1 Common Table Expressions (CTE Basic + Chained) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A Common Table Expression (CTE) is a temporary, named result set defined using the `WITH` clause. It lives only during the execution of a single statement, improving modularity and readability over nested subqueries.

## 1. What is a CTE?
A CTE is a temporary result set defined within a query.
- Declared using `WITH cte_name AS (...)`, then referenced like a standard table.  
- Improves readability, modularity, and query structure.  

## 2. Why use CTEs?
- Break complex multi-step queries into smaller, readable building blocks.  
- Reuse intermediate calculated results multiple times.  
- Make queries significantly easier to debug and maintain.  

## 3. Real-world Analogy
Think of a CTE as a **scratchpad**:  
You write down intermediate steps and totals on a scratchpad before solving the final complex calculation.

## 4. Syntax (Basic CTE)
```sql
WITH cte_name AS (
    SELECT col1, col2
    FROM table_name
    WHERE condition
)
SELECT *
FROM cte_name;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `50000` |
| **2** | Bob | 102 | `60000` |
| **3** | Carol | 103 | `70000` |
| **4** | David | 101 | `52000` |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |

## 6. Basic CTE Example
```sql
WITH HighEarners AS (
    SELECT Name, Salary
    FROM Employees
    WHERE Salary > 60000
)
SELECT *
FROM HighEarners;
```
👉 **Returns**: Carol (`70000`).

## 7. Chained (Multiple) CTEs
```sql
WITH HighEarners AS (
    SELECT EmployeeID, Name, Salary
    FROM Employees
    WHERE Salary > 60000
),
DeptInfo AS (
    SELECT DeptID, DeptName
    FROM Departments
)
SELECT h.Name, h.Salary, d.DeptName
FROM HighEarners h
JOIN Employees e ON h.EmployeeID = e.EmployeeID
JOIN DeptInfo d ON e.DeptID = d.DeptID;
```
👉 Combines multiple CTE scratchpads cleanly separated by commas.

## 8. Real Analyst Scenarios
- **HR**: Filter active high-performing employees, then join with department info.  
- **Finance**: Precalculate transaction metrics per account, then aggregate monthly totals.  
- **Marketing**: Segment high-value leads in CTE 1, then analyze campaign conversion in CTE 2.  
- **Ecommerce**: Identify top products, then join with warehouse inventory.  

## 9. Expected Output
- **Basic CTE**: One temporary result set.  
- **Chained CTEs**: Multiple sequential scratchpads feeding into a clean final query.  

## 10. Visual Explanation
```text
WITH CTE1 AS (...)
  ,  CTE2 AS (...)
SELECT ... FROM CTE1 JOIN CTE2
```

## 11. Common Mistakes
> [!WARNING]
> - Forgetting to reference the CTE in the main query immediately following `WITH`.  
> - Assuming CTEs persist like permanent tables or temp tables `#temp` (they exist only during query execution).  
> - Forgetting commas between chained CTE blocks.  

## 12. Interview Questions
- **Beginner**: What is a CTE and how is it declared?  
- **Intermediate**: Difference between a CTE, a subquery, and a temporary table?  
- **Advanced**: When does the query optimizer materialize a CTE vs inline it?  

## 13. Best Practices
- Give CTEs clear, descriptive business names (`HighEarners`, `MonthlyTotals`).  
- Break complex 100-line queries into 3-4 simple CTEs.  
- Prefer CTEs over deeply nested derived subqueries for readability.  

## 14. Comparison Table
| Feature | Subquery | CTE | Temp Table (`#temp`) |
| :--- | :--- | :--- | :--- |
| **Readability** | Hard (nested) | High (top-down) | High |
| **Scope** | Single clause | Single query | Entire session |
| **Reusability** | Once per placement | Multiple times in query | Multiple queries |

## 15. Memory Trick
> [!TIP]
> **CTE = Clear Temporary Expression.**  
> Think: `WITH` scratchpad $\\rightarrow$ final query.

## 16. Summary
CTEs make SQL modular, readable, and powerful.  
- Basic $\\rightarrow$ single scratchpad.  
- Chained $\\rightarrow$ multiple sequential scratchpads.  
"""
}

# ---------------------------------------------------------
# Part 47: 1.6.2 Recursive CTE
# ---------------------------------------------------------
parts_data[47] = {
    "title": "1.6.2 Recursive CTE",
    "content": """# 1.6.2 Recursive CTE (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A Recursive CTE is a CTE that references itself in its own definition. It repeatedly executes until a termination condition is reached, making it essential for processing organizational hierarchies, family trees, and bill of materials.

## 1. What is a Recursive CTE?
A Recursive CTE is a CTE that references itself.
- Repeatedly evaluates data in iterations until a stop condition is met.  
- Perfect for hierarchical structures (org charts, categories) or sequence generation.  

## 2. Why use Recursive CTEs?
- Traverse hierarchical parent-child relationships (e.g., Employees $\\rightarrow$ Managers).  
- Generate missing date/number sequences dynamically without lookup tables.  
- Perform iterative calculations (such as interest compounding or path finding).  

## 3. Real-world Analogy
Think of climbing a family tree:
1. Start at the root ancestor (**Anchor**).  
2. Step-by-step find all children (**Recursive step**).  
3. Stop when no more children exist (**Termination**).  

## 4. Syntax
```sql
WITH RECURSIVE cte_name AS (
    -- 1. Anchor Member (Base starting query)
    SELECT col1, col2, 1 AS Level
    FROM table_name
    WHERE parent_id IS NULL

    UNION ALL

    -- 2. Recursive Member (Joins back to cte_name)
    SELECT t.col1, t.col2, c.Level + 1
    FROM table_name t
    JOIN cte_name c ON t.parent_id = c.id
)
SELECT * FROM cte_name;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | ManagerID |
| :--- | :--- | :--- |
| **1** | Alice | `NULL` |
| **2** | Bob | 1 |
| **3** | Carol | 1 |
| **4** | David | 2 |
| **5** | Emma | 2 |

## 6. Basic Recursive Example (Org Hierarchy)
```sql
WITH RECURSIVE EmployeeHierarchy AS (
    -- Anchor: Top-level CEO / Manager
    SELECT EmployeeID, Name, ManagerID, 1 AS Level
    FROM Employees
    WHERE ManagerID IS NULL

    UNION ALL

    -- Recursive: Employees reporting to previous level
    SELECT e.EmployeeID, e.Name, e.ManagerID, eh.Level + 1
    FROM Employees e
    JOIN EmployeeHierarchy eh ON e.ManagerID = eh.EmployeeID
)
SELECT * FROM EmployeeHierarchy;
```
👉 **Output**: Builds level-by-level hierarchy tree (Level 1: Alice, Level 2: Bob/Carol, Level 3: David/Emma).

## 7. Sequence Generator Example (1 to 10)
```sql
WITH RECURSIVE Numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1
    FROM Numbers
    WHERE n < 10
)
SELECT * FROM Numbers;
```
👉 Generates numbers 1 through 10.

## 8. Real Analyst Scenarios
- **HR**: Build complete multi-level org chart hierarchies with reporting levels.  
- **Finance**: Trace multi-tier transaction fee structures.  
- **Marketing**: Expand referral chain trees (User $\\rightarrow$ Referred User).  
- **Ecommerce**: Fill missing calendar date gaps in daily sales reports.  

## 9. Common Mistakes
> [!WARNING]
> - Forgetting the termination condition (`WHERE n < 10`) $\\rightarrow$ causes an infinite loop crash!  
> - Using `UNION` instead of `UNION ALL` inside recursion.  
> - Forgetting the `RECURSIVE` keyword in PostgreSQL / MySQL (SQL Server omits `RECURSIVE`).  

## 10. Best Practices
- Always include a strict termination condition.  
- Use `UNION ALL` for performance and proper recursion behavior.  
- In SQL Server, use `OPTION (MAXRECURSION 100)` to guard against infinite loops.  

## 11. Memory Trick
> [!TIP]
> **Recursive CTE = Anchor + Recursive + Stop.**  
> Start at base $\\rightarrow$ repeat step $\\rightarrow$ stop when done.
"""
}

# ---------------------------------------------------------
# Part 48: 1.6.3 Window Functions (ROW_NUMBER, RANK, DENSE_RANK)
# ---------------------------------------------------------
parts_data[48] = {
    "title": "1.6.3 Window Functions (ROW_NUMBER, RANK, DENSE_RANK)",
    "content": """# 1.6.3 Window Functions (ROW_NUMBER, RANK, DENSE_RANK) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Window functions perform calculations across a set of table rows related to the current row without collapsing rows into a single summary output (unlike `GROUP BY`).

## 1. What are Window Functions?
Operate over a window of rows defined by `OVER()`.
- Unlike `GROUP BY`, they retain all individual detail rows while appending computed ranking metrics.  
- Essential for top-N analysis, deduplication, and ordered ranking.  

## 2. Syntax
```sql
ROW_NUMBER() OVER (PARTITION BY col ORDER BY col DESC)
RANK()       OVER (PARTITION BY col ORDER BY col DESC)
DENSE_RANK() OVER (PARTITION BY col ORDER BY col DESC)
```

## 3. Example Dataset
**Sales Table**

| SaleID | Employee | Amount |
| :--- | :--- | :--- |
| **1** | Alice | `500` |
| **2** | Bob | `700` |
| **3** | Carol | `700` |
| **4** | David | `600` |

## 4. ROW_NUMBER Example
```sql
SELECT Employee, Amount,
       ROW_NUMBER() OVER (ORDER BY Amount DESC) AS RowNum
FROM Sales;
```
👉 **Output**: Bob (1), Carol (2), David (3), Alice (4).  
*No ties: every single row gets a unique sequential integer.*

## 5. RANK Example
```sql
SELECT Employee, Amount,
       RANK() OVER (ORDER BY Amount DESC) AS RankNum
FROM Sales;
```
👉 **Output**: Bob (1), Carol (1), David (3), Alice (4).  
*Ties share rank (1), but the next rank skips (skips 2 $\\rightarrow$ 3).*

## 6. DENSE_RANK Example
```sql
SELECT Employee, Amount,
       DENSE_RANK() OVER (ORDER BY Amount DESC) AS DenseRankNum
FROM Sales;
```
👉 **Output**: Bob (1), Carol (1), David (2), Alice (3).  
*Ties share rank (1), but the next rank does NOT skip (1 $\\rightarrow$ 2).*

## 7. Key Comparison Table

| Function | Handles Ties? | Next Rank Behavior | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **ROW_NUMBER** | No | Increments by 1 strictly | Deduplication (`rn = 1`) |
| **RANK** | Yes | Skips ranks after ties | Olympics medals style |
| **DENSE_RANK** | Yes | Does NOT skip ranks | Dense leaderboard ranking |

## 8. Real Analyst Scenarios
- **HR**: Find top 2 highest paid employees per department using `ROW_NUMBER()`.  
- **Finance**: Rank sales representatives by quarterly performance using `DENSE_RANK()`.  
- **Ecommerce**: Identify top customers per region using `RANK()`.  

## 9. Memory Trick
> [!TIP]
> - **ROW_NUMBER**: 1, 2, 3, 4 (Strict counting)  
> - **RANK**: 1, 1, 3, 4 (Skips after tie)  
> - **DENSE_RANK**: 1, 1, 2, 3 (Dense, no gaps)  
"""
}

# ---------------------------------------------------------
# Part 49: 1.6.4 Window Functions (LEAD, LAG)
# ---------------------------------------------------------
parts_data[49] = {
    "title": "1.6.4 Window Functions (LEAD, LAG)",
    "content": """# 1.6.4 Window Functions (LEAD, LAG) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LAG` accesses data from a previous row, and `LEAD` accesses data from a subsequent row without requiring self-joins. Essential for time-series and trend calculations.

## 1. What are LEAD and LAG?
- **LAG** $\\rightarrow$ Looks backward into preceding rows.  
- **LEAD** $\\rightarrow$ Looks forward into succeeding rows.  

## 2. Syntax
```sql
LAG(column, offset, default_value)  OVER (ORDER BY col)
LEAD(column, offset, default_value) OVER (ORDER BY col)
```
- `offset`: number of rows back/forward (default = 1).  
- `default_value`: fallback value if boundary is reached (default = `NULL`).  

## 3. Example Dataset
**MonthlySales Table**

| Month | Sales |
| :--- | :--- |
| Jan | `100` |
| Feb | `120` |
| Mar | `150` |
| Apr | `130` |

## 4. LAG & Growth Calculation Example
```sql
SELECT Month, Sales,
       LAG(Sales, 1) OVER (ORDER BY Month) AS PrevSales,
       Sales - LAG(Sales, 1) OVER (ORDER BY Month) AS Growth
FROM MonthlySales;
```

**Output:**
- **Jan**: Sales = `100`, PrevSales = `NULL`, Growth = `NULL`
- **Feb**: Sales = `120`, PrevSales = `100`, Growth = `+20`
- **Mar**: Sales = `150`, PrevSales = `120`, Growth = `+30`
- **Apr**: Sales = `130`, PrevSales = `150`, Growth = `-20`

## 5. LEAD Example
```sql
SELECT Month, Sales,
       LEAD(Sales, 1) OVER (ORDER BY Month) AS NextMonthSales
FROM MonthlySales;
```

## 6. Real Analyst Scenarios
- **Finance**: Compute MoM (Month-over-Month) and YoY (Year-over-Year) revenue growth.  
- **Marketing**: Measure session-to-session conversion time.  
- **Operations**: Detect stock price percentage shifts.  

## 7. Memory Trick
> [!TIP]
> - **LAG** = Look Behind (Past)  
> - **LEAD** = Look Ahead (Future)  
"""
}

# ---------------------------------------------------------
# Part 50: 1.6.5 Window Functions (SUM/AVG/COUNT OVER running totals)
# ---------------------------------------------------------
parts_data[50] = {
    "title": "1.6.5 Window Functions (SUM/AVG/COUNT OVER running totals)",
    "content": """# 1.6.5 Window Functions (SUM/AVG/COUNT OVER Running Totals) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aggregate window functions (`SUM() OVER`, `AVG() OVER`, `COUNT() OVER`) compute cumulative running totals and moving averages across ordered rows.

## 1. What are Running Totals?
Running totals accumulate values row-by-row in chronological order without collapsing individual transaction detail lines.

## 2. Syntax
```sql
SUM(col)   OVER (PARTITION BY dept ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
AVG(col)   OVER (PARTITION BY dept ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
COUNT(col) OVER (PARTITION BY dept ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

## 3. Example Dataset
**DailySales Table**

| Month | Sales |
| :--- | :--- |
| Jan | `100` |
| Feb | `120` |
| Mar | `150` |
| Apr | `130` |

## 4. Running Total & Moving Average Example
```sql
SELECT Month, Sales,
       SUM(Sales) OVER (ORDER BY Month) AS RunningTotal,
       AVG(Sales) OVER (ORDER BY Month) AS RunningAvg
FROM DailySales;
```

**Output:**
- **Jan**: Sales = `100` $\\rightarrow$ RunningTotal = `100`, RunningAvg = `100.0`
- **Feb**: Sales = `120` $\\rightarrow$ RunningTotal = `220`, RunningAvg = `110.0`
- **Mar**: Sales = `150` $\\rightarrow$ RunningTotal = `370`, RunningAvg = `123.3`
- **Apr**: Sales = `130` $\\rightarrow$ RunningTotal = `500`, RunningAvg = `125.0`

## 5. Real Analyst Scenarios
- **Finance**: Running balance calculations for bank customer statements.  
- **Sales**: Year-to-Date (YTD) cumulative revenue tracking.  
- **Operations**: 7-day moving average calculation for demand smoothing.  
"""
}

# ---------------------------------------------------------
# Part 51: 1.6.6 PARTITION BY
# ---------------------------------------------------------
parts_data[51] = {
    "title": "1.6.6 PARTITION BY",
    "content": """# 1.6.6 PARTITION BY (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `PARTITION BY` divides query result sets into separate logical windows. Calculations reset at each partition boundary while preserving every individual output row.

## 1. What is PARTITION BY?
`PARTITION BY` acts like `GROUP BY` for window functions, but **without collapsing rows**.

## 2. Syntax
```sql
<window_function>() OVER (PARTITION BY category_col ORDER BY metric_col DESC)
```

## 3. Example Code
```sql
SELECT Employee, DeptID, Amount,
       ROW_NUMBER() OVER (PARTITION BY DeptID ORDER BY Amount DESC) AS DeptRank,
       SUM(Amount)  OVER (PARTITION BY DeptID) AS DeptTotal
FROM Sales;
```

## 4. Comparison: GROUP BY vs PARTITION BY

| Clause | Collapses Rows? | Returns Detail Rows? | Purpose |
| :--- | :--- | :--- | :--- |
| **GROUP BY** | Yes | No (Summary only) | Aggregate reporting |
| **PARTITION BY** | No | Yes (All original rows preserved) | Window analytics & ranking |

## 5. Memory Trick
> [!TIP]
> **PARTITION BY** = Divide into buckets, compute inside each bucket, keep all rows.
"""
}

# ---------------------------------------------------------
# Part 52: 1.6.7 PIVOT / UNPIVOT
# ---------------------------------------------------------
parts_data[52] = {
    "title": "1.6.7 PIVOT / UNPIVOT",
    "content": """# 1.6.7 PIVOT / UNPIVOT in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `PIVOT` rotates row values into columns (creating cross-tab summary reports). `UNPIVOT` rotates columns back into rows (normalizing wide datasets).

## 1. PIVOT (Rows to Columns)
Converts vertical row values into horizontal column headers.

### Syntax (SQL Server Style)
```sql
SELECT Employee, [Jan], [Feb]
FROM Sales
PIVOT (
    SUM(Amount) FOR Month IN ([Jan], [Feb])
) AS PivotTable;
```

## 2. UNPIVOT (Columns to Rows)
Converts wide horizontal columns into vertical key-value row pairs.

### Syntax
```sql
SELECT Employee, Month, Amount
FROM PivotTable
UNPIVOT (
    Amount FOR Month IN ([Jan], [Feb])
) AS UnpivotTable;
```

## 3. Real Analyst Scenarios
- **Dashboards**: Pivoting monthly sales metrics across product categories.  
- **Data Normalization**: Unpivoting wide survey data into structured database rows.  
"""
}

# ---------------------------------------------------------
# Part 53: 1.6.8 Order of query execution
# ---------------------------------------------------------
parts_data[53] = {
    "title": "1.6.8 Order of query execution",
    "content": """# 1.6.8 SQL Query Execution Order (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: SQL is a declarative language. The logical execution sequence of clauses is completely different from the order in which you write them.

## 1. Logical Execution Sequence

```text
1. FROM        → Identify source tables & execute JOINs
2. WHERE       → Filter raw individual rows
3. GROUP BY    → Group rows into summary buckets
4. HAVING      → Filter aggregated summary groups
5. SELECT      → Evaluate column expressions & aliases
6. DISTINCT    → Deduplicate result set rows
7. ORDER BY    → Sort final result rows
8. LIMIT / TOP → Truncate output rows
```

## 2. Why Execution Order Matters
> [!WARNING]
> You **cannot** use a `SELECT` column alias inside a `WHERE` clause because `WHERE` (Step 2) executes **before** `SELECT` (Step 5)!

```sql
-- WRONG (Causes runtime error)
SELECT Salary * 12 AS AnnualSalary
FROM Employees
WHERE AnnualSalary > 60000; 

-- CORRECT
SELECT Salary * 12 AS AnnualSalary
FROM Employees
WHERE Salary * 12 > 60000;
```

## 3. Real-world Analogy
Think of cooking:
1. `FROM` = Gather ingredients from pantry.  
2. `WHERE` = Throw away rotten ingredients.  
3. `GROUP BY` = Sort ingredients into cooking bowls.  
4. `HAVING` = Discard bowls that don't meet recipe rules.  
5. `SELECT` = Cook and plate the food.  
6. `ORDER BY` = Arrange plates on table nicely.  
7. `LIMIT` = Serve only top 3 plates.  
"""
}

# ---------------------------------------------------------
# Part 54: 1.6.9 Handling messy data
# ---------------------------------------------------------
parts_data[54] = {
    "title": "1.6.9 Handling messy data",
    "content": """# 1.6.9 Handling Messy Data in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Real-world data is dirty. Analysts spend 80% of their time detecting, cleaning, deduplicating, and standardizing messy data in SQL.

## 1. Common Messy Data Problems & Solutions

### A. Missing Values (NULL Handling)
```sql
SELECT COALESCE(Salary, 0) AS CleanSalary
FROM Employees;
```

### B. Removing Duplicates (Using ROW_NUMBER)
```sql
WITH Deduplicated AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CreatedDate DESC) AS rn
    FROM Customers
)
SELECT * FROM Deduplicated WHERE rn = 1;
```

### C. Standardizing Text Inconsistencies & Spaces
```sql
SELECT UPPER(TRIM(Department)) AS CleanDept
FROM Employees;
```

### D. Format Standardization & Type Casting
```sql
SELECT CAST(HireDate AS DATE) AS StandardDate
FROM Employees;
```

### E. Detecting Outliers & Anomalies
```sql
SELECT *
FROM Transactions
WHERE Amount < 0 OR Amount > 1000000;
```

## 2. Data Cleaning Workflow Checklist
1. **Profile Data**: Use `COUNT()`, `MIN()`, `MAX()`, `DISTINCT` to inspect values.  
2. **Deduplicate**: Remove duplicate rows via `ROW_NUMBER()`.  
3. **Impute / Replace**: Handle `NULL`s with `COALESCE()`.  
4. **Normalize**: Fix text casing and trailing spaces with `TRIM()` and `UPPER()`.  
5. **Validate**: Verify cleaned data against business domain logic.  
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
            "importance": "high" if part_num in [46, 47, 48, 53] else "medium",
            "module": "1.6 TIER 7: ADVANCED — CTEs & WINDOW FUNCTIONS",
            "module_id": 7,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Tier 7 (Parts 46 through 54) successfully saved and compiled into static API JSON!")
