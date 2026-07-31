# 1.6.2 Recursive CTE (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A Recursive CTE is a CTE that references itself in its own definition. It repeatedly executes until a termination condition is reached, making it essential for processing organizational hierarchies, family trees, and bill of materials.

## 1. What is a Recursive CTE?
A Recursive CTE is a CTE that references itself.
- Repeatedly evaluates data in iterations until a stop condition is met.  
- Perfect for hierarchical structures (org charts, categories) or sequence generation.  

## 2. Why use Recursive CTEs?
- Traverse hierarchical parent-child relationships (e.g., Employees $\rightarrow$ Managers).  
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
- **Marketing**: Expand referral chain trees (User $\rightarrow$ Referred User).  
- **Ecommerce**: Fill missing calendar date gaps in daily sales reports.  

## 9. Common Mistakes
> [!WARNING]
> - Forgetting the termination condition (`WHERE n < 10`) $\rightarrow$ causes an infinite loop crash!  
> - Using `UNION` instead of `UNION ALL` inside recursion.  
> - Forgetting the `RECURSIVE` keyword in PostgreSQL / MySQL (SQL Server omits `RECURSIVE`).  

## 10. Best Practices
- Always include a strict termination condition.  
- Use `UNION ALL` for performance and proper recursion behavior.  
- In SQL Server, use `OPTION (MAXRECURSION 100)` to guard against infinite loops.  

## 11. Memory Trick
> [!TIP]
> **Recursive CTE = Anchor + Recursive + Stop.**  
> Start at base $\rightarrow$ repeat step $\rightarrow$ stop when done.
