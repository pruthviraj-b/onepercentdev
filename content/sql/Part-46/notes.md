# 1.6.1 Common Table Expressions (CTE Basic + Chained) (Data Analyst Edition)

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
> Think: `WITH` scratchpad $\rightarrow$ final query.

## 16. Summary
CTEs make SQL modular, readable, and powerful.  
- Basic $\rightarrow$ single scratchpad.  
- Chained $\rightarrow$ multiple sequential scratchpads.  
