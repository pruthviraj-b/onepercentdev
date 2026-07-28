# 1.3.2 Correlated Subqueries (Data Analyst Edition)

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
