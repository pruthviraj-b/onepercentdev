# 1.3.5 ANY / ALL Operators (Data Analyst Edition)

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
