import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 21: 1.2.1 Aggregate functions (COUNT, SUM, AVG, MIN, MAX)
# ---------------------------------------------------------
parts_data[21] = {
    "title": "1.2.1 Aggregate functions (COUNT, SUM, AVG, MIN, MAX)",
    "content": """# 1.2.1 Aggregate Functions (COUNT, SUM, AVG, MIN, MAX) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aggregate functions in SQL — `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` — collapse multiple rows of data into a single summary value for quick reporting and decision-making.

Aggregate functions answer questions like:
- “How many employees are in total?” (`COUNT`)
- “What is the total company salary payout?” (`SUM`)
- “What is the mean salary?” (`AVG`)
- “Who earns the most or least?” (`MAX` / `MIN`)

---

## 🔑 Core Aggregate Functions

| Function | Purpose | Example | Output Description |
| :--- | :--- | :--- | :--- |
| **COUNT** | Counts rows | `SELECT COUNT(*) FROM Employees;` | Total number of employees |
| **SUM** | Totals numeric column | `SELECT SUM(Salary) FROM Employees;` | Total salary payout |
| **AVG** | Average of numeric column | `SELECT AVG(Salary) FROM Employees;` | Mean salary |
| **MIN** | Smallest value | `SELECT MIN(Salary) FROM Employees;` | Lowest salary |
| **MAX** | Largest value | `SELECT MAX(Salary) FROM Employees;` | Highest salary |

---

## 📊 Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |
| **3** | Carol | Finance | `70000` |
| **4** | David | IT | `65000` |
| **5** | Emma | HR | `52000` |

---

## 🧩 Basic Examples

### COUNT
```sql
SELECT COUNT(*) AS TotalEmployees FROM Employees;
```
👉 **Returns**: `5`

### SUM
```sql
SELECT SUM(Salary) AS TotalSalary FROM Employees;
```
👉 **Returns**: `297,000`

### AVG
```sql
SELECT AVG(Salary) AS AvgSalary FROM Employees;
```
👉 **Returns**: `59,400`

### MIN / MAX
```sql
SELECT MIN(Salary) AS Lowest, MAX(Salary) AS Highest FROM Employees;
```
👉 **Returns**: Lowest = `50,000`, Highest = `70,000`

---

## 🎯 Real-world Analogies
- **COUNT** → Counting students in a classroom.  
- **SUM** → Adding up items on a grocery bill.  
- **AVG** → Calculating average marks in an exam.  
- **MIN** → Finding the cheapest product in a shop.  
- **MAX** → Identifying the tallest building in a city.  

---

## ⚙️ Advanced Usage

### GROUP BY Integration
```sql
SELECT Department, AVG(Salary) AS AvgDeptSalary
FROM Employees
GROUP BY Department;
```
👉 Returns the average salary per department.

### HAVING Clause Integration
```sql
SELECT Department, SUM(Salary) AS DeptTotal
FROM Employees
GROUP BY Department
HAVING SUM(Salary) > 100000;
```
👉 Filters departments where total salary payout exceeds 100k.

---

## ⚠️ Key Notes
> [!WARNING]
> - `NULL` values are automatically ignored in `SUM`, `AVG`, `MIN`, and `MAX`.  
> - `COUNT(*)` counts all rows including `NULL` values.  
> - `COUNT(column)` counts only non‑`NULL` values.  
> - `COUNT(DISTINCT column)` counts unique non‑`NULL` values.  

---

## ✅ Key Takeaways
- Aggregate functions summarize row data instantly.  
- Combine with `GROUP BY` for category summaries.  
- Use `HAVING` to filter aggregated results.  
- Backbone of all BI reporting and dashboards.  
"""
}

# ---------------------------------------------------------
# Part 22: 1.2.2 GROUP BY (single + multiple columns)
# ---------------------------------------------------------
parts_data[22] = {
    "title": "1.2.2 GROUP BY (single + multiple columns)",
    "content": """# 1.2.2 Aggregate Functions + GROUP BY (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aggregate functions summarize data across rows. `GROUP BY` organizes rows into categories so aggregate functions compute per group.

## 1. What are they?
Aggregate functions summarize data across rows. `GROUP BY` organizes rows into groups so aggregates apply per group.

## 2. Definition
```sql
SELECT column, AGG_FUNC(column)
FROM table
GROUP BY column;
```

## 3. Why do we need them?
Analysts rarely care about raw rows — they want summaries: totals, averages, counts, min/max. `GROUP BY` makes those summaries meaningful per category.

## 4. Real-world Analogy
- **COUNT** → Counting students in each class.  
- **SUM** → Adding grocery bills per customer.  
- **AVG** → Average marks per subject.  
- **MIN/MAX** → Lowest/highest score per team.  
- **GROUP BY** → Sorting exam papers into folders by subject before calculating averages.  

## 5. Mental Model
Think of a filing cabinet: `GROUP BY` = labeled folders, Aggregate = summary note placed inside each folder.

---

## 6. Syntax
```sql
SELECT Department, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Department;
```

---

## 7. Anatomy of the Syntax
- **Aggregate Function** → `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.  
- **GROUP BY** → defines grouping columns.  
- **HAVING** → filters groups after aggregation.  

---

## 8. Rules
- Non‑aggregated columns in `SELECT` must appear in the `GROUP BY` clause.  
- Aggregates ignore `NULL`s (except `COUNT(*)`).  
- `HAVING` filters groups, `WHERE` filters rows.  

---

## 9. Common Variations
- Single column `GROUP BY`.  
- Multiple column `GROUP BY`.  
- `GROUP BY` with `HAVING`.  
- `GROUP BY` with `ORDER BY`.  

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

---

## 11. Basic Example (Single Column GROUP BY)
```sql
SELECT Department, COUNT(*) AS EmpCount
FROM Employees
GROUP BY Department;
```

**Output:**

| Department | EmpCount |
| :--- | :--- |
| HR | 2 |
| IT | 2 |
| Finance | 1 |

---

## 12. Intermediate Example (SUM + GROUP BY)
```sql
SELECT Department, SUM(Salary) AS TotalSalary
FROM Employees
GROUP BY Department;
```

**Output:**

| Department | TotalSalary |
| :--- | :--- |
| HR | `102000` |
| IT | `125000` |
| Finance | `70000` |

---

## 13. Advanced Example (Multiple Columns GROUP BY)
```sql
SELECT Department, City, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Department, City;
```

**Output:**

| Department | City | AvgSalary |
| :--- | :--- | :--- |
| HR | New York | `51000` |
| IT | Chicago | `60000` |
| IT | Seattle | `65000` |
| Finance | Boston | `70000` |

---

## 14. Real Analyst Scenarios
- **HR**: Average salary per department.  
- **Finance**: Total revenue per region.  
- **Marketing**: Customer count per city.  
- **Ecommerce**: Sales per product category.  

---

## 15. Expected Output
Summarized tables containing one row per distinct group combination.

---

## 16. Visual Explanation
```text
Rows → GROUP BY Department → Aggregates applied → Summary per Department
```

---

## 17. Behind the Scenes
Database engine partitions rows into bucket groups, then applies aggregate functions to each bucket.

---

## 18. Common Mistakes
> [!WARNING]
> - Selecting non‑grouped columns without an aggregate function.  
> - Confusing `WHERE` vs `HAVING`.  
> - Forgetting `ORDER BY` for clean output.  

---

## 19. Interview Questions
- **Beginner**: What does `GROUP BY` do?  
- **Intermediate**: Difference between `WHERE` and `HAVING`?  
- **Advanced**: How does `GROUP BY` handle `NULL` values?  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can you use column aliases in the `GROUP BY` clause?  
> **A**: Not in all SQL dialects (ANSI standard prefers column names or ordinal numbers).  

---

## 21. Performance Notes
> [!TIP]
> - `GROUP BY` can be heavy on large datasets because it requires sorting or hashing.  
> - Indexes on grouping columns significantly improve speed.  

---

## 22. Best Practices
- Always alias aggregate functions.  
- Use `HAVING` for group filters.  
- Keep `GROUP BY` columns minimal.  

---

## 23. Common Business Use Cases
- HR: Employee count per department.  
- Finance: Revenue per quarter.  
- Marketing: Customers per region.  
- Ecommerce: Orders per product.  

---

## 24. Comparison Table
| Clause | Purpose | Execution Timing |
| :--- | :--- | :--- |
| **WHERE** | Filters rows | Before grouping |
| **GROUP BY** | Groups rows | During aggregation |
| **HAVING** | Filters groups | After aggregation |

---

## 25. Memory Trick
> [!TIP]
> Think of GROUP BY as **“Group papers before marking.”**

---

## 26. Cheat Sheet
```sql
COUNT(*)    → Row count
SUM(col)    → Total
AVG(col)    → Average
MIN(col)    → Lowest
MAX(col)    → Highest
GROUP BY    → Category summary
```

---

## 27. Summary
- Aggregates summarize rows.  
- `GROUP BY` organizes into groups.  
- `HAVING` filters groups.  

---

## 28. Practice Questions
- **Easy**: Count employees per department.  
- **Medium**: Average salary per city.  
- **Hard**: Departments with total salary > 100k.  

---

## 29. Interview Practice Queries
- Write query to find max salary per department.  
- Explain difference between `WHERE` and `HAVING`.  

---

## 30. Hands-on Exercises
- Group employees by department.  
- Group by department + city.  

---

## 31. Mini Project Usage
Build a **Salary Report**:
- Count employees per department.  
- Average salary per department.  
- Filter departments with total > 100k.  

---

## 32. Key Takeaways
- Aggregate functions = summary tools.  
- `GROUP BY` = category grouping.  
- Single column → simple summaries.  
- Multiple columns → hierarchical summaries.  
- `HAVING` filters aggregated results.  
"""
}

# ---------------------------------------------------------
# Part 23: 1.2.3 HAVING vs WHERE
# ---------------------------------------------------------
parts_data[23] = {
    "title": "1.2.3 HAVING vs WHERE",
    "content": """# 1.2.3 HAVING vs WHERE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `WHERE` filters individual rows *before* grouping; `HAVING` filters aggregated groups *after* `GROUP BY` execution.

## 1. What are they?
- **WHERE** → filters rows before grouping.  
- **HAVING** → filters groups after aggregation.  

## 2. Definition
```sql
-- WHERE filters raw rows
SELECT column, AGG_FUNC(column)
FROM table
WHERE condition
GROUP BY column;

-- HAVING filters aggregated groups
SELECT column, AGG_FUNC(column)
FROM table
GROUP BY column
HAVING aggregate_condition;
```

## 3. Why do we need them?
Analysts must distinguish between filtering raw data vs filtering summarized groups. Misusing them leads to wrong results.

## 4. Real-world Analogy
- **WHERE** = “Check each student’s paper before grouping by class.”  
- **HAVING** = “After grouping by class, keep only classes with average marks above 50.”  

## 5. Mental Model
Think of a factory line:
- **WHERE** = quality check before packaging.  
- **HAVING** = quality check after packaging.  

---

## 6. Syntax
### WHERE:
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary > 50000;
```

### HAVING:
```sql
SELECT Department, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Department
HAVING AVG(Salary) > 60000;
```

---

## 7. Rules
- `WHERE` cannot use aggregate functions.  
- `HAVING` can use aggregate functions.  
- `WHERE` runs before `GROUP BY`.  
- `HAVING` runs after `GROUP BY`.  

---

## 8. Example Dataset
**Orders Table**

| OrderID | UserID | Status | Total |
| :--- | :--- | :--- | :--- |
| **1** | 101 | Completed | `500` |
| **2** | 102 | Cancelled | `200` |
| **3** | 101 | Completed | `300` |
| **4** | 103 | Completed | `700` |
| **5** | 102 | Completed | `400` |

---

## 9. Basic Example (WHERE)
```sql
SELECT UserID, COUNT(*) AS OrderCount
FROM Orders
WHERE Status = 'Completed'
GROUP BY UserID;
```
👉 Filters rows first → only completed orders grouped.

---

## 10. Intermediate Example (HAVING)
```sql
SELECT UserID, COUNT(*) AS OrderCount
FROM Orders
GROUP BY UserID
HAVING COUNT(*) > 1;
```
👉 Groups first → then keeps only users with >1 orders.

---

## 11. Advanced Example (WHERE + HAVING)
```sql
SELECT UserID, SUM(Total) AS LifetimeValue
FROM Orders
WHERE Status = 'Completed'
GROUP BY UserID
HAVING SUM(Total) > 600;
```
👉 Filters rows (completed only), then filters groups (total > 600).

---

## 12. Real Analyst Scenarios
- **HR**: `WHERE Salary > 50k`, `HAVING AVG(Salary) > 60k`.  
- **Finance**: `WHERE TransactionType = 'Credit'`, `HAVING SUM(Amount) > 1M`.  
- **Marketing**: `WHERE Region = 'Asia'`, `HAVING COUNT(CustomerID) > 1000`.  

---

## 13. Expected Output
- **WHERE** → fewer rows before grouping.  
- **HAVING** → fewer groups after grouping.  

---

## 14. Visual Explanation
```text
Rows → WHERE filter → GROUP BY → HAVING filter → Final result
```

---

## 15. Behind the Scenes
Execution order:
1. `FROM`
2. `WHERE`
3. `GROUP BY`
4. `HAVING`
5. `SELECT`
6. `ORDER BY`

---

## 16. Common Mistakes
> [!WARNING]
> - Using aggregate functions inside `WHERE` (e.g., `WHERE SUM(Salary) > 5000` ❌).  
> - Using `HAVING` instead of `WHERE` for raw row filters (much slower).  
> - Forgetting query execution order.  

---

## 17. Interview Questions
- **Beginner**: Difference between `WHERE` and `HAVING`?  
- **Intermediate**: Why can’t aggregates be used in `WHERE`?  
- **Advanced**: Explain execution order with `GROUP BY`.  

---

## 18. Interview Traps
> [!IMPORTANT]
> **Q**: Can `HAVING` be used without `GROUP BY`?  
> **A**: Yes, but rare — it treats the entire table output as one group.  

---

## 19. Performance Notes
> [!TIP]
> - `WHERE` is faster (filters early and reduces rows before grouping).  
> - `HAVING` is heavier (filters after grouping).  

---

## 20. Best Practices
- Use `WHERE` for raw filters.  
- Use `HAVING` for aggregate filters.  
- Combine both for efficiency.  

---

## 21. Common Business Use Cases
- **HR**: Filter employees by salary (`WHERE`), then departments by avg salary (`HAVING`).  
- **Finance**: Filter transactions by type (`WHERE`), then accounts by total (`HAVING`).  
- **Ecommerce**: Filter orders by status (`WHERE`), then customers by spend (`HAVING`).  

---

## 22. Comparison Table
| Clause | Filters | Execution Stage | Aggregates Allowed? |
| :--- | :--- | :--- | :--- |
| **WHERE** | Rows | Before GROUP BY | No |
| **HAVING** | Groups | After GROUP BY | Yes |

---

## 23. Memory Trick
> [!TIP]
> - **WHERE** = Row filter.  
> - **HAVING** = Group filter.  

---

## 24. Cheat Sheet
```sql
WHERE  → Raw rows
HAVING → Grouped results
```

---

## 25. Summary
- `WHERE` filters rows.  
- `HAVING` filters groups.  
- Use both together for precise queries.  

---

## 26. Practice Questions
- **Easy**: Count completed orders per user (`WHERE`).  
- **Medium**: Keep only users with >1 orders (`HAVING`).  
- **Hard**: Completed orders only, then `HAVING SUM(Total) > 600`.  

---

## 27. Interview Practice Queries
- Difference between `WHERE` and `HAVING` with examples.  
- Query to find departments with avg salary > 60k.  

---

## 28. Hands-on Exercises
- Filter employees by `salary > 50k` (`WHERE`).  
- Filter departments with `total salary > 100k` (`HAVING`).  

---

## 29. Mini Project Usage
Build **Customer Spend Report**:
- `WHERE Status = 'Completed'`
- `GROUP BY CustomerID`
- `HAVING SUM(Spend) > 1000`

---

## 30. Key Takeaways
- `WHERE` = row filter.  
- `HAVING` = group filter.  
- Execution order matters.  

---

## 31. Real-world Visualization
- **WHERE** = “Check each item before packing.”  
- **HAVING** = “After packing, keep only boxes with >10 items.”  

---

## 32. Final Note
Mastering `WHERE` vs `HAVING` is essential for analysts — it’s the difference between filtering raw data and filtering summarized insights.  
"""
}

# ---------------------------------------------------------
# Part 24: 1.2.4 CASE
# ---------------------------------------------------------
parts_data[24] = {
    "title": "1.2.4 CASE",
    "content": """# 1.2.4 CASE Statement (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: The `CASE` statement adds conditional logic (`IF-THEN-ELSE`) directly inside SQL queries to transform, categorize, or calculate values.

## 🔑 Two Types of CASE

| Type | Syntax | Best For | Example |
| :--- | :--- | :--- | :--- |
| **Simple CASE** | `CASE expr WHEN val1 THEN res1 ELSE res END` | Comparing one column to fixed values | Classify status codes |
| **Searched CASE** | `CASE WHEN cond1 THEN res1 ELSE res END` | Complex conditions, ranges, multiple columns | Risk levels, salary bands |

---

## 📊 Examples

### 1. Simple CASE
```sql
SELECT EmployeeID, Name,
       CASE Department
            WHEN 'HR' THEN 'Human Resources'
            WHEN 'IT' THEN 'Technology'
            ELSE 'Other'
       END AS DeptFullName
FROM Employees;
```
👉 Maps department codes to readable names.

### 2. Searched CASE
```sql
SELECT Name, Salary,
       CASE
            WHEN Salary > 65000 THEN 'High Earner'
            WHEN Salary BETWEEN 50000 AND 65000 THEN 'Mid Earner'
            ELSE 'Low Earner'
       END AS SalaryBand
FROM Employees;
```
👉 Categorizes employees into salary bands.

### 3. CASE in ORDER BY
```sql
SELECT CustomerName, Country
FROM Customers
ORDER BY CASE WHEN Country = 'India' THEN 0 ELSE 1 END, Country;
```
👉 Prioritizes Indian customers first, then sorts others alphabetically.

### 4. CASE with Aggregates
```sql
SELECT Department,
       SUM(CASE WHEN Salary > 60000 THEN 1 ELSE 0 END) AS HighEarners
FROM Employees
GROUP BY Department;
```
👉 Counts how many employees earn above 60k per department.

---

## 🎯 Real-world Analogies
- **Simple CASE** → Like a menu board: if you order “Tea,” you get “Hot Beverage.”  
- **Searched CASE** → Like a traffic signal: if speed > 80 → “Overspeeding,” if 40–80 → “Normal,” else → “Slow.”  

---

## ⚠️ Key Notes
> [!WARNING]
> - `CASE` evaluates top-to-bottom and stops at the **first** matching condition.  
> - Always include an `ELSE` clause to handle unmatched cases (otherwise returns `NULL`).  
> - Works seamlessly inside `SELECT`, `WHERE`, `ORDER BY`, `UPDATE`, and aggregate functions.  

---

## ✅ Key Takeaways
- `CASE` = conditional decision-maker in SQL.  
- Simple CASE compares one value; Searched CASE checks complex expressions.  
- Essential for data transformation and custom reporting.  
"""
}

# ---------------------------------------------------------
# Part 25: 1.2.5 NULL handling (IS NULL/IS NOT NULL, COALESCE, NULLIF)
# ---------------------------------------------------------
parts_data[25] = {
    "title": "1.2.5 NULL handling (IS NULL/IS NOT NULL, COALESCE, NULLIF)",
    "content": """# 1.2.5 NULL Handling (IS NULL, IS NOT NULL, COALESCE, NULLIF) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `NULL` represents missing or unknown data in SQL. Standard equality operators (`=`, `!=`) do not work with `NULL`; you must use specialized NULL functions.

## 1. What is NULL?
`NULL` represents missing, unknown, or undefined data in SQL. It is not zero, not an empty string `""`, not false — it’s “no value.”

## 2. Why do we need to handle NULL?
Analysts must deal with incomplete data:
- Missing salaries.  
- Unknown customer emails.  
- Optional fields left blank.  

## 3. Real-world Analogy
- **NULL** = unanswered question on a form.  
- **IS NULL** = “Did they leave it blank?”  
- **COALESCE** = “If blank, fill with default fallback.”  
- **NULLIF** = “If two answers are the same, treat as blank.”  

## 4. Core Syntax
### IS NULL / IS NOT NULL
```sql
SELECT Name
FROM Employees
WHERE Email IS NULL;
```

### COALESCE
```sql
SELECT Name, COALESCE(Email, 'No Email') AS ContactEmail
FROM Employees;
```

### NULLIF
```sql
SELECT NULLIF(Discount, 0) AS EffectiveDiscount
FROM Orders;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Email | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | `alice@company.com` | `50000` |
| **2** | Bob | `NULL` | `60000` |
| **3** | Carol | `carol@company.com` | `NULL` |

## 6. IS NULL / IS NOT NULL Example
```sql
SELECT Name
FROM Employees
WHERE Email IS NULL;
```
👉 Finds employees without email (Bob).

## 7. COALESCE Example
```sql
SELECT Name, COALESCE(Salary, 0) AS SafeSalary
FROM Employees;
```
👉 Replaces `NULL` salary with 0.

**Output:**
- Alice → `50000`
- Bob → `60000`
- Carol → `0`

## 8. NULLIF Example
```sql
SELECT Name, NULLIF(Salary, 0) AS AdjustedSalary
FROM Employees;
```
👉 If `Salary = 0`, returns `NULL`. Prevents division by zero errors.

## 9. Daily Life Examples
- **IS NULL** → “Who didn’t write their phone number?”  
- **IS NOT NULL** → “Who provided their email address?”  
- **COALESCE** → “If no mobile phone, use home address.”  
- **NULLIF** → “If answer equals default, treat as blank.”  

## 10. Advanced Example (Aggregates)
```sql
SELECT Department,
       AVG(COALESCE(Salary,0)) AS AvgSalary
FROM Employees
GROUP BY Department;
```
👉 Ensures missing salaries don’t break averages.

## 11. Common Mistakes
> [!WARNING]
> - Thinking `NULL = 0` (it is not).  
> - Using `= NULL` instead of `IS NULL`.  
> - Forgetting `COALESCE` in reports → blank values confuse stakeholders.  

## 12. Interview Questions
- **Beginner**: What does `IS NULL` do?  
- **Intermediate**: Difference between `COALESCE` and `ISNULL`?  
- **Advanced**: How does `NULLIF` help avoid divide‑by‑zero errors?  

## 13. Best Practices
- Always check for `NULL`s in critical fields.  
- Use `COALESCE` for default fallback values in reports.  
- Use `NULLIF` for safe division calculations.  

## 14. Comparison Table
| Function | Purpose | Example | Result |
| :--- | :--- | :--- | :--- |
| **IS NULL** | Check missing | `Email IS NULL` | True if blank |
| **IS NOT NULL** | Check present | `Email IS NOT NULL` | True if filled |
| **COALESCE** | Replace NULL | `COALESCE(Salary,0)` | 0 if NULL |
| **NULLIF** | Return NULL if equal | `NULLIF(Discount,0)` | NULL if 0 |

## 15. Memory Tricks
> [!TIP]
> - **IS NULL** = “Is it blank?”  
> - **COALESCE** = “Cover the blank.”  
> - **NULLIF** = “Null if same.”  

## 16. Cheat Sheet
```sql
IS NULL     → Check missing
IS NOT NULL → Check present
COALESCE    → Replace with default
NULLIF      → NULL if equal
```

## 17. Summary
- `NULL` = missing data.  
- `IS NULL` / `IS NOT NULL` → check presence.  
- `COALESCE` → replace with fallback.  
- `NULLIF` → avoid divide‑by‑zero.  
"""
}

# ---------------------------------------------------------
# Part 26: 1.2.6 CAST / CONVERT
# ---------------------------------------------------------
parts_data[26] = {
    "title": "1.2.6 CAST / CONVERT",
    "content": """# 1.2.6 CAST / CONVERT (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `CAST` (ANSI SQL standard) and `CONVERT` (SQL Server) explicitly convert values from one data type to another to align types, format dates, and prevent query errors.

## 1. What are they?
- **CAST** → Standard ANSI SQL function to convert one data type into another.  
- **CONVERT** → SQL Server–specific function that also allows style/format options.  

## 2. Why do we need them?
- To ensure numeric calculations on text fields.  
- To format dates for reporting.  
- To unify data types when joining tables.  

## 3. Syntax
### CAST (Universal)
```sql
CAST(expression AS target_type)
```

### CONVERT (SQL Server)
```sql
CONVERT(target_type, expression, style)
```

## 4. Example Dataset
**Orders Table**

| OrderID | OrderDate | Amount |
| :--- | :--- | :--- |
| **1** | `2026-07-01` | `500.75` |
| **2** | `2026-07-02` | `300.00` |
| **3** | `2026-07-03` | `200.25` |

## 5. Basic Example (CAST)
```sql
SELECT CAST(Amount AS INT) AS RoundedAmount
FROM Orders;
```
👉 Converts decimal to integer (`500.75` → `500`).

## 6. Intermediate Example (CONVERT with Date)
```sql
SELECT CONVERT(VARCHAR, OrderDate, 103) AS UKDateFormat
FROM Orders;
```
👉 Converts date to string in UK format (`dd/mm/yyyy`).

## 7. Advanced Example (JOIN with CAST)
```sql
SELECT o.OrderID, c.CustomerName
FROM Orders o
JOIN Customers c
ON CAST(o.CustomerID AS VARCHAR) = c.CustomerCode;
```
👉 Ensures join works when IDs are stored in mismatched types.

## 8. Real-world Analogies
- **CAST** → Like pouring water into a new shaped glass (same liquid, new container).  
- **CONVERT** → Like changing both the container and the presentation style (wine glass vs coffee mug).  

## 9. Common Use Cases
- Convert string to number for calculations.  
- Convert date to string for reporting.  
- Convert NULLs safely with `COALESCE` + `CAST`.  
- Format currency or percentages.  

## 10. Rules
- `CAST` is ANSI SQL compliant (portable across PostgreSQL, MySQL, SQL Server, Snowflake).  
- `CONVERT` is SQL Server–specific.  
- Style codes in `CONVERT` define date/time formats.  

## 11. Common Mistakes
> [!WARNING]
> - Forgetting `CAST` before math → calculation errors on text fields.  
> - Using `CONVERT` in non–SQL Server systems.  
> - Assuming `CAST` changes stored disk schema (it only changes output).  

## 12. Interview Questions
- **Beginner**: What does `CAST` do?  
- **Intermediate**: Difference between `CAST` and `CONVERT`?  
- **Advanced**: How do style codes in `CONVERT` work?  

## 13. Best Practices
- Use `CAST` for portability.  
- Use `CONVERT` only when formatting is needed in SQL Server.  
- Always alias converted columns.  

## 14. Comparison Table
| Feature | CAST | CONVERT |
| :--- | :--- | :--- |
| **Standard** | ANSI SQL | SQL Server only |
| **Syntax** | `CAST(expr AS type)` | `CONVERT(type, expr, style)` |
| **Formatting** | No | Yes (style codes) |
| **Portability** | High | Low |

## 15. Memory Trick
> [!TIP]
> - **CAST** = “Change Shape.”  
> - **CONVERT** = “Change Shape + Style.”  

## 16. Cheat Sheet
```sql
CAST('123' AS INT)                  → 123
CONVERT(VARCHAR, GETDATE(), 101)     → 07/24/2026
```

## 17. Summary
- `CAST` → universal type conversion.  
- `CONVERT` → SQL Server with formatting.  
- Essential for clean joins, calculations, and reporting.  
"""
}

# ---------------------------------------------------------
# Part 27: 1.2.7 String functions (CONCAT, SUBSTRING, TRIM, UPPER, LOWER, REPLACE, LENGTH, LEFT, RIGHT)
# ---------------------------------------------------------
parts_data[27] = {
    "title": "1.2.7 String functions (CONCAT, SUBSTRING, TRIM, UPPER, LOWER, REPLACE, LENGTH, LEFT, RIGHT)",
    "content": """# 1.2.7 String Functions (CONCAT, SUBSTRING, TRIM, UPPER, LOWER, REPLACE, LENGTH, LEFT, RIGHT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: String functions manipulate text values to format names, clean messy data, extract substrings, and prepare raw data for joins and reporting.

## 1. What are they?
String functions manipulate text values in SQL. They help format names, clean messy data, and extract useful substrings.

## 2. Why do we need them?
- Data often comes messy (extra spaces, mixed case, partial codes).  
- Reports need clean, consistent text.  
- Analysts must extract or transform text for joins, grouping, or dashboards.  

## 3. Real-world Analogy
- **CONCAT** → Joining first name + last name.  
- **SUBSTRING** → Cutting a slice of text.  
- **TRIM** → Removing extra wrapping spaces.  
- **UPPER/LOWER** → Changing case (shouting vs whispering).  
- **REPLACE** → Find & replace text.  
- **LENGTH** → Counting letters in a word.  
- **LEFT/RIGHT** → Taking first or last few characters.  

## 4. Example Dataset
**Employees Table**

| EmployeeID | FirstName | LastName | Email |
| :--- | :--- | :--- | :--- |
| **1** | Alice | Smith | `alice@company.com` |
| **2** | Bob | Brown | `bob@company.com` |
| **3** | Carol | Jones | `NULL` |

## 5. CONCAT
```sql
SELECT CONCAT(FirstName, ' ', LastName) AS FullName
FROM Employees;
```
👉 Alice Smith, Bob Brown, Carol Jones.

## 6. SUBSTRING
```sql
SELECT SUBSTRING(Email, 1, 5) AS Prefix
FROM Employees;
```
👉 alice, bob@c, carol.

## 7. TRIM
```sql
SELECT TRIM('   SQL   ') AS CleanText;
```
👉 Returns `SQL`.

## 8. UPPER / LOWER
```sql
SELECT UPPER(FirstName) AS ShoutName,
       LOWER(LastName) AS WhisperName
FROM Employees;
```
👉 ALICE / smith.

## 9. REPLACE
```sql
SELECT REPLACE(Email, 'company.com', 'org.com') AS NewEmail
FROM Employees;
```
👉 `alice@org.com`, `bob@org.com`.

## 10. LENGTH
```sql
SELECT FirstName, LENGTH(FirstName) AS NameLength
FROM Employees;
```
👉 Alice → 5, Bob → 3.

## 11. LEFT
```sql
SELECT LEFT(LastName, 2) AS Initials
FROM Employees;
```
👉 Sm, Br, Jo.

## 12. RIGHT
```sql
SELECT RIGHT(Email, 3) AS DomainSuffix
FROM Employees;
```
👉 com.

## 13. Advanced Example (Combined)
```sql
SELECT CONCAT(UPPER(LEFT(FirstName,1)), LOWER(SUBSTRING(FirstName,2))) AS ProperCase
FROM Employees;
```
👉 Converts names to proper case (Alice, Bob, Carol).

## 14. Real Analyst Scenarios
- **HR**: Standardize employee names.  
- **Finance**: Extract codes from transaction IDs.  
- **Marketing**: Clean customer emails.  
- **Ecommerce**: Format product SKUs.  

## 15. Expected Output
Clean, formatted text ready for reporting.

## 16. Visual Explanation
```text
CONCAT      → Join
SUBSTRING   → Slice
TRIM        → Clean edges
UPPER/LOWER → Case change
REPLACE     → Swap text
LENGTH      → Count characters
LEFT/RIGHT  → Extract ends
```

## 17. Behind the Scenes
Database engine manipulates text at character level, often using memory buffers.

## 18. Common Mistakes
> [!WARNING]
> - Forgetting `TRIM` → mismatched joins due to trailing spaces.  
> - Using wrong start index in `SUBSTRING`.  
> - Assuming `LENGTH` counts bytes vs characters.  

## 19. Interview Questions
- **Beginner**: What does `CONCAT` do?  
- **Intermediate**: Difference between `SUBSTRING` and `LEFT`/`RIGHT`?  
- **Advanced**: How does `LENGTH` behave with Unicode?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `TRIM` remove spaces inside the string?  
> **A**: No, `TRIM` only removes leading and trailing spaces. Use `REPLACE(str, ' ', '')` for internal spaces.  

## 21. Performance Notes
> [!TIP]
> - String functions can slow queries if applied to large text columns inside `WHERE`.  
> - Wrapping indexed columns in string functions disables index usage.  

## 22. Best Practices
- Clean data at ETL stage when possible.  
- Use aliases for readability.  
- Avoid excessive nesting of string functions.  

## 23. Common Business Use Cases
- HR: Proper case names.  
- Finance: Extract year from transaction code.  
- Marketing: Replace old domain in emails.  
- Ecommerce: Count SKU length.  

## 24. Comparison Table
| Function | Purpose | Example |
| :--- | :--- | :--- |
| **CONCAT** | Join strings | First + Last name |
| **SUBSTRING** | Slice text | First 5 chars |
| **TRIM** | Remove spaces | Clean input |
| **UPPER/LOWER** | Case change | ALICE / alice |
| **REPLACE** | Swap text | Change domain |
| **LENGTH** | Count chars | Name length |
| **LEFT/RIGHT** | Extract ends | Initials, suffix |

## 25. Memory Tricks
> [!TIP]
> - **CONCAT** = “Connect.”  
> - **SUBSTRING** = “Sub‑slice.”  
> - **TRIM** = “Trim edges.”  
> - **UPPER/LOWER** = “Shout/Whisper.”  
> - **REPLACE** = “Find & Replace.”  
> - **LENGTH** = “Count letters.”  
> - **LEFT/RIGHT** = “Take ends.”  

## 26. Cheat Sheet
```sql
CONCAT(a,b)               → Join
SUBSTRING(str, start, len)→ Slice
TRIM(str)                 → Clean
UPPER(str)                → CAPS
LOWER(str)                → small
REPLACE(str, old, new)    → Swap
LENGTH(str)               → Count
LEFT(str,n)               → First n chars
RIGHT(str,n)              → Last n chars
```

## 27. Summary
String functions clean, transform, and format text. They’re essential for analysts working with messy or inconsistent data.  
"""
}

# ---------------------------------------------------------
# Part 28: 1.2.8 Date functions (DATEDIFF, DATE_TRUNC, EXTRACT, DATEADD, CURRENT_DATE)
# ---------------------------------------------------------
parts_data[28] = {
    "title": "1.2.8 Date functions (DATEDIFF, DATE_TRUNC, EXTRACT, DATEADD, CURRENT_DATE)",
    "content": """# 1.2.8 Date Functions (DATEDIFF, DATE_TRUNC, EXTRACT, DATEADD, CURRENT_DATE) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Date functions let analysts measure durations, truncate timestamps for period grouping, extract date parts (year/month/day), and add/subtract time intervals.

## 1. What are they?
Functions that operate on date/time values to calculate differences, adjust dates, or extract components.

## 2. Why do we need them?
- To measure durations (days between orders).  
- To group by time periods (monthly sales).  
- To extract parts of dates (year, month).  
- To add/subtract intervals (next payment date).  

## 3. Real-world Analogy
- **DATEDIFF** → Counting days between two birthdays.  
- **DATE_TRUNC** → Rounding a clock to the nearest hour/month.  
- **EXTRACT** → Picking out the month from a calendar.  
- **DATEADD** → Adding 30 days to a due date.  
- **CURRENT_DATE** → Today’s date.  

## 4. Example Dataset
**Orders Table**

| OrderID | OrderDate | DeliveryDate | Amount |
| :--- | :--- | :--- | :--- |
| **1** | `2026-07-01` | `2026-07-05` | `500` |
| **2** | `2026-07-02` | `2026-07-04` | `300` |
| **3** | `2026-07-03` | `2026-07-10` | `200` |

## 5. DATEDIFF
```sql
SELECT OrderID, DATEDIFF(day, OrderDate, DeliveryDate) AS DaysToDeliver
FROM Orders;
```
👉 Calculates days between order and delivery.

## 6. DATE_TRUNC (PostgreSQL)
```sql
SELECT DATE_TRUNC('month', OrderDate) AS OrderMonth, SUM(Amount)
FROM Orders
GROUP BY DATE_TRUNC('month', OrderDate);
```
👉 Groups sales by month.

## 7. EXTRACT
```sql
SELECT OrderID, EXTRACT(YEAR FROM OrderDate) AS OrderYear
FROM Orders;
```
👉 Extracts year from order date.

## 8. DATEADD
```sql
SELECT OrderID, DATEADD(day, 30, OrderDate) AS PaymentDue
FROM Orders;
```
👉 Adds 30 days to order date.

## 9. CURRENT_DATE
```sql
SELECT OrderID
FROM Orders
WHERE DeliveryDate < CURRENT_DATE;
```
👉 Finds orders already delivered before today.

## 10. Advanced Example (Combined)
```sql
SELECT EXTRACT(MONTH FROM OrderDate) AS Month,
       COUNT(*) AS Orders,
       AVG(DATEDIFF(day, OrderDate, DeliveryDate)) AS AvgDeliveryDays
FROM Orders
GROUP BY EXTRACT(MONTH FROM OrderDate);
```
👉 Monthly order count + average delivery time.

## 11. Real Analyst Scenarios
- **HR**: Calculate tenure (`DATEDIFF` hire vs today).  
- **Finance**: Add 30 days to invoice date (`DATEADD`).  
- **Marketing**: Group campaigns by month (`DATE_TRUNC`).  
- **Ecommerce**: Extract year for annual sales (`EXTRACT`).  

## 12. Expected Output
Summarized tables with durations, grouped periods, and extracted date parts.

## 13. Visual Explanation
```text
DATEDIFF     → Duration between dates
DATE_TRUNC   → Round timestamp to period
EXTRACT      → Pull specific date part
DATEADD      → Add interval to date
CURRENT_DATE → Today's calendar date
```

## 14. Common Mistakes
> [!WARNING]
> - Mixing up the argument order in `DATEDIFF(start, end)` vs `DATEDIFF(unit, start, end)`.  
> - Forgetting `DATE_TRUNC` is PostgreSQL/Snowflake specific.  
> - Using `EXTRACT` incorrectly on text strings.  

## 15. Interview Questions
- **Beginner**: What does `DATEDIFF` do?  
- **Intermediate**: Difference between `DATE_TRUNC` and `EXTRACT`?  
- **Advanced**: How does `DATEADD` differ across SQL dialects?  

## 16. Best Practices
- Always alias calculated date columns.  
- Use `DATE_TRUNC` for grouping, `EXTRACT` for filtering.  
- Use `CURRENT_DATE` for dynamic time-series queries.  

## 17. Comparison Table
| Function | Purpose | Example |
| :--- | :--- | :--- |
| **DATEDIFF** | Difference | Days between order & delivery |
| **DATE_TRUNC** | Round | Group by month |
| **EXTRACT** | Pull part | Year from date |
| **DATEADD** | Add interval | Add 30 days |
| **CURRENT_DATE** | Today | Filter past orders |

## 18. Memory Tricks
> [!TIP]
> - **DATEDIFF** = “Date Difference.”  
> - **DATE_TRUNC** = “Truncate to period.”  
> - **EXTRACT** = “Extract part.”  
> - **DATEADD** = “Add interval.”  
> - **CURRENT_DATE** = “Today.”  

## 19. Cheat Sheet
```sql
DATEDIFF(day, start, end)
DATE_TRUNC('month', date)
EXTRACT(YEAR FROM date)
DATEADD(day, n, date)
CURRENT_DATE
```

## 20. Summary
Date functions let analysts measure, group, extract, and adjust time values — essential for reporting and trend analysis.  
"""
}

# ---------------------------------------------------------
# Part 29: 1.2.9 Numeric functions (ROUND, CEIL, FLOOR, ABS, MOD)
# ---------------------------------------------------------
parts_data[29] = {
    "title": "1.2.9 Numeric functions (ROUND, CEIL, FLOOR, ABS, MOD)",
    "content": """# 1.2.9 Numeric Functions (ROUND, CEIL, FLOOR, ABS, MOD) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Numeric functions perform mathematical transformations on number values for rounding, absolute values, and modular arithmetic.

## 1. What are they?
Functions that manipulate numeric values for rounding, absolute values, and modular arithmetic.

## 2. Why do we need them?
- To format numbers for reports.  
- To handle negative values safely.  
- To calculate remainders (e.g., cycle counts).  
- To ensure consistent numeric precision.  

## 3. Real-world Analogy
- **ROUND** → Rounding bill amount at a shop.  
- **CEIL** → Always round up (bus fare).  
- **FLOOR** → Always round down (discount calculation).  
- **ABS** → Distance (always positive).  
- **MOD** → Clock arithmetic (hours wrap around).  

## 4. Example Dataset
**Sales Table**

| SaleID | Amount |
| :--- | :--- |
| **1** | `123.456` |
| **2** | `-45.67` |
| **3** | `200.00` |

## 5. ROUND
```sql
SELECT ROUND(Amount, 2) AS RoundedAmount
FROM Sales;
```
👉 `123.46`, `-45.67`, `200.00`.

## 6. CEIL (CEILING)
```sql
SELECT CEIL(Amount) AS CeilAmount
FROM Sales;
```
👉 `124`, `-45`, `200`.

## 7. FLOOR
```sql
SELECT FLOOR(Amount) AS FloorAmount
FROM Sales;
```
👉 `123`, `-46`, `200`.

## 8. ABS
```sql
SELECT ABS(Amount) AS AbsoluteAmount
FROM Sales;
```
👉 `123.456`, `45.67`, `200`.

## 9. MOD
```sql
SELECT MOD(Amount, 7) AS Remainder
FROM Sales;
```
👉 Remainder when divided by 7.

## 10. Advanced Example (Combined)
```sql
SELECT SaleID,
       ROUND(Amount,0) AS Rounded,
       CEIL(Amount) AS CeilVal,
       FLOOR(Amount) AS FloorVal,
       ABS(Amount) AS AbsVal,
       MOD(CAST(Amount AS INT), 5) AS ModVal
FROM Sales;
```

## 11. Real Analyst Scenarios
- **Finance**: Round currency values.  
- **HR**: Calculate full years of service (`FLOOR`).  
- **Marketing**: Absolute difference in campaign spend (`ABS`).  
- **Ecommerce**: Cycle through product IDs with `MOD`.  

## 12. Expected Output
Clean, precise numbers ready for reporting.

## 13. Visual Explanation
```text
ROUND → Nearest
CEIL  → Up
FLOOR → Down
ABS   → Positive
MOD   → Remainder
```

## 14. Common Mistakes
> [!WARNING]
> - Forgetting `ROUND` precision decimal argument.  
> - Confusing `CEIL` vs `FLOOR` on negative numbers (`CEIL(-45.67) = -45`, `FLOOR(-45.67) = -46`).  
> - Misusing `MOD` with decimal numbers.  

## 15. Interview Questions
- **Beginner**: What does `ABS` do?  
- **Intermediate**: Difference between `CEIL` and `FLOOR`?  
- **Advanced**: How is `MOD` used in cyclic calculations?  

## 16. Best Practices
- Always specify precision in `ROUND`.  
- Use `ABS` for variance and differences.  
- Use `MOD` for periodic grouping.  

## 17. Comparison Table
| Function | Purpose | Example | Result |
| :--- | :--- | :--- | :--- |
| **ROUND** | Nearest value | `ROUND(123.456,2)` | `123.46` |
| **CEIL** | Round up | `CEIL(123.456)` | `124` |
| **FLOOR** | Round down | `FLOOR(123.456)` | `123` |
| **ABS** | Positive value | `ABS(-45.67)` | `45.67` |
| **MOD** | Remainder | `MOD(10,3)` | `1` |

## 18. Memory Tricks
> [!TIP]
> - **ROUND** = “Nearest.”  
> - **CEIL** = “Ceiling (up).”  
> - **FLOOR** = “Floor (down).”  
> - **ABS** = “Absolute positive.”  
> - **MOD** = “Modulo remainder.”  

## 19. Cheat Sheet
```sql
ROUND(num, decimals)
CEIL(num)
FLOOR(num)
ABS(num)
MOD(num, divisor)
```

## 20. Summary
Numeric functions clean and control numbers. They’re essential for precise calculations, reporting, and handling edge cases.  
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
            "importance": "high" if part_num in [21, 22, 23, 24] else "medium",
            "module": "1.2 TIER 3: INTERMEDIATE — QUERYING & FILTERING",
            "module_id": 3,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Tier 3 (Parts 21 through 29) successfully saved and compiled into static API JSON!")
