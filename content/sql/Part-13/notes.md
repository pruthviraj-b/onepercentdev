# 1.0.13 LIMIT / TOP (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LIMIT` (PostgreSQL/MySQL) and `TOP` (SQL Server) restrict the maximum number of rows returned by a query.

## 1. What is it?
`LIMIT` (PostgreSQL, MySQL) and `TOP` (SQL Server) are SQL clauses used to restrict the number of rows returned by a query.

## 2. Definition
- **LIMIT**: Specifies the maximum number of rows to return.  
- **TOP**: Specifies the number of rows to return from the beginning of the result set.

## 3. Why do we need it?
Analysts often don’t need the entire dataset:
- Previewing data samples  
- Showing top performers  
- Limiting rows for dashboards  

## 4. Real-world Analogy
Think of **Netflix Top 10**: you don’t see all movies, only the top 10. That’s LIMIT/TOP in action.

## 5. Mental Model
Visualize a long list. LIMIT/TOP is like saying: “Just give me the first N items.”

## 6. Syntax
**PostgreSQL/MySQL:**
```sql
SELECT column_name(s)
FROM table_name
ORDER BY column_name DESC
LIMIT n;
```

**SQL Server:**
```sql
SELECT TOP n column_name(s)
FROM table_name
ORDER BY column_name DESC;
```

## 7. Anatomy of the Syntax
- **LIMIT n** → maximum rows returned  
- **TOP n** → first n rows returned  
- **ORDER BY** → defines which rows are considered “top”  

## 8. Rules
- `LIMIT` is supported in PostgreSQL/MySQL.  
- `TOP` is supported in SQL Server.  
- Always combine with `ORDER BY` for deterministic results.  

## 9. Common Variations
- `LIMIT n` → first n rows  
- `LIMIT n OFFSET m` → skip m rows, then return n rows  
- `TOP n PERCENT` → return percentage of rows (SQL Server)  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name, Salary
FROM Employees
ORDER BY Salary DESC
LIMIT 3;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |
| Bob | `60000` |

## 12. Intermediate Example
```sql
SELECT Name, Department
FROM Employees
ORDER BY EmployeeID ASC
LIMIT 2 OFFSET 2;
```

**Output:**

| Name | Department |
| :--- | :--- |
| Carol | Finance |
| David | IT |

## 13. Advanced Example (SQL Server)
```sql
SELECT TOP 2 Name, Salary
FROM Employees
ORDER BY Salary DESC;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |

## 14. Real Data Analyst Scenarios
- **HR**: Show top 5 highest-paid employees.  
- **Finance**: Preview first 10 transactions.  
- **Marketing**: List top 20 customers by spend.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Full Result Set → ORDER BY → LIMIT/TOP → Final Subset
```

## 17. Behind the Scenes
Database engine sorts rows (if ORDER BY used), then truncates to the specified number.

## 18. Common Mistakes
> [!WARNING]
> - Using `LIMIT` without `ORDER BY` (results can be non-deterministic).  
> - Confusing `LIMIT` with `WHERE` (`LIMIT` truncates result set, `WHERE` filters rows).  

## 19. Interview Questions
- **Beginner**: What does `LIMIT` do?  
- **Intermediate**: Difference between `LIMIT` and `OFFSET`?  
- **Advanced**: How does `TOP PERCENT` work in SQL Server?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `LIMIT` guarantee consistent results without `ORDER BY`?  
> **A**: No, row order is undefined unless `ORDER BY` is specified.  

## 21. Performance Notes
> [!TIP]
> - `LIMIT` is efficient for sampling.  
> - `OFFSET` can be slow on large datasets (requires scanning & skipping rows).  

## 22. Best Practices
- Always use `ORDER BY` with `LIMIT`/`TOP`.  
- Use `OFFSET` carefully for pagination.  

## 23. Common Business Use Cases
- HR: Top 10 salaries.  
- Finance: First 100 transactions.  
- Ecommerce: Top 5 selling products.  

## 24. Comparison
- **LIMIT vs TOP**: `LIMIT` = PostgreSQL/MySQL; `TOP` = SQL Server.  
- **LIMIT vs WHERE**: `LIMIT` truncates; `WHERE` filters.  

## 25. Memory Tricks
> [!TIP]
> Think of LIMIT as **“Limit the list”** and TOP as **“Top rows only.”**

## 26. Cheat Sheet
- `LIMIT n` → First n rows  
- `LIMIT n OFFSET m` → Skip m, then n rows  
- `TOP n` → First n rows (SQL Server)  
- `TOP n PERCENT` → Percentage of rows  

## 27. Summary
- `LIMIT`/`TOP` restricts rows.  
- `ORDER BY` defines which rows are “top.”  
- `OFFSET` enables pagination.  

## 28. Practice Questions
- **Easy**: Show top 3 salaries.  
- **Medium**: Show 5 employees starting from 3rd row.  
- **Hard**: Show top 10% of employees by salary (SQL Server).  

## 29. Interview Practice Queries
- Write query to find top 2 highest salaries per department.  
- Explain difference between `LIMIT` and `OFFSET` with examples.  

## 30. Hands-on Exercises
- Retrieve top 5 employees by salary.  
- Paginate employees 2 at a time using `OFFSET`.  

## 31. Mini Project Usage
Build a **Top Customers Dashboard** showing top 10 customers by revenue.

## 32. Key Takeaways
- `LIMIT`/`TOP` restricts rows.  
- `ORDER BY` is essential for meaningful results.  
- `OFFSET` enables pagination but can be slow on huge datasets.  
