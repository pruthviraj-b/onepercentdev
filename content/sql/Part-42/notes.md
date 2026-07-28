# 1.5.5 SELF JOIN (Master Module - Data Analyst Edition)

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
