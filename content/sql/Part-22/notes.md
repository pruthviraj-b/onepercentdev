# 1.2.2 Aggregate Functions + GROUP BY (Data Analyst Edition)

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
