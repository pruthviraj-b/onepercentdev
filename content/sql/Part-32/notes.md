# 1.3.3 EXISTS / NOT EXISTS (Data Analyst Edition)

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
