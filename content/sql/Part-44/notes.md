# 1.5.7 ANTI JOIN (LEFT ANTI, RIGHT ANTI, FULL ANTI) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: An `ANTI JOIN` returns rows from one table that have **no match** in another table. It is the logical opposite of a regular join.

## 1. What is an ANTI JOIN?
An `ANTI JOIN` returns rows from one table that do not have a match in another table.
- It’s the logical opposite of an `INNER JOIN`.  
- Implemented using `LEFT JOIN ... WHERE right.key IS NULL`, `NOT EXISTS`, or `NOT IN`.  

## 2. Why use ANTI JOIN?
- To find missing relationships across tables.  
- To identify orphan records and broken integrity.  
- To audit data completeness and spot missing entries.  

## 3. Real-world Analogy
Imagine:
- **Table A**: Students.  
- **Table B**: Library Borrowings.  

`LEFT ANTI JOIN` = **“Show me students who have NEVER borrowed a book.”**

## 4. Types of ANTI JOIN
- **LEFT ANTI JOIN** → Rows in left table with no match in right.  
- **RIGHT ANTI JOIN** → Rows in right table with no match in left.  
- **FULL ANTI JOIN** → Rows in either table with no match in the other.  

## 5. Syntax Patterns

### LEFT ANTI JOIN
```sql
SELECT e.*
FROM Employees e
LEFT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.DeptID IS NULL;
```

### RIGHT ANTI JOIN
```sql
SELECT d.*
FROM Employees e
RIGHT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL;
```

### FULL ANTI JOIN (Simulation)
```sql
SELECT e.EmployeeID, e.Name, d.DeptID, d.DeptName
FROM Employees e
FULL OUTER JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL OR d.DeptID IS NULL;
```

## 6. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID |
| :--- | :--- | :--- |
| **1** | Alice | 101 |
| **2** | Bob | 102 |
| **3** | Carol | 103 |
| **4** | David | 105 |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |
| **104** | Marketing |

## 7. LEFT ANTI JOIN Example
```sql
SELECT e.Name
FROM Employees e
LEFT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.DeptID IS NULL;
```
👉 **Returns**: David (DeptID 105 not found in Departments).

## 8. RIGHT ANTI JOIN Example
```sql
SELECT d.DeptName
FROM Employees e
RIGHT JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL;
```
👉 **Returns**: Marketing (DeptID 104 has zero assigned employees).

## 9. FULL ANTI JOIN Example
```sql
SELECT COALESCE(e.Name, 'No Employee') AS Employee,
       COALESCE(d.DeptName, 'No Department') AS Department
FROM Employees e
FULL OUTER JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE e.EmployeeID IS NULL OR d.DeptID IS NULL;
```
👉 **Returns**: David (unmatched employee) and Marketing (unmatched department).

## 10. Real Analyst Scenarios
- **HR**: Employees without assigned departments (`LEFT ANTI`).  
- **Finance**: Accounts without transaction history (`LEFT ANTI`).  
- **Marketing**: Campaigns with zero generated leads (`LEFT ANTI`).  
- **Ecommerce**: Products without any customer orders (`RIGHT ANTI`).  
- **Data Auditing**: Any unmatched records across two legacy systems (`FULL ANTI`).  

## 11. Expected Output
Only rows that fail to match across tables.

## 12. Visual Explanation
```text
LEFT ANTI  → Left side unmatched only
RIGHT ANTI → Right side unmatched only
FULL ANTI  → Both sides unmatched
```

## 13. Common Mistakes
> [!WARNING]
> - Forgetting the `WHERE right.key IS NULL` condition (converts back to standard `LEFT JOIN`).  
> - Using `NOT IN` with subqueries containing `NULL` values (returns 0 rows!).  
> - Confusing `ANTI JOIN` with `OUTER JOIN` (ANTI returns ONLY unmatched rows).  

## 14. Interview Questions
- **Beginner**: What is an `ANTI JOIN`?  
- **Intermediate**: How do you implement a `LEFT ANTI JOIN` in SQL?  
- **Advanced**: How do you simulate `FULL ANTI JOIN` in MySQL?  

## 15. Best Practices
- Use `NOT EXISTS` for optimal safety against `NULL` values.  
- Use `LEFT JOIN ... WHERE right.key IS NULL` for maximum readability.  

## 16. Comparison Table
| Anti Join Type | Returned Rows |
| :--- | :--- |
| **LEFT ANTI** | Left rows with no right match |
| **RIGHT ANTI** | Right rows with no left match |
| **FULL ANTI** | All unmatched rows on either side |

## 17. Memory Trick
> [!TIP]
> **ANTI JOIN = “Anti‑match.”**  
> Think: Only the outsiders who don't fit in.

## 18. Cheat Sheet
```sql
-- LEFT ANTI
LEFT JOIN ... WHERE right_key IS NULL

-- RIGHT ANTI
RIGHT JOIN ... WHERE left_key IS NULL

-- FULL ANTI
FULL JOIN ... WHERE left_key IS NULL OR right_key IS NULL
```

## 19. Summary
`ANTI JOIN`s are negative joins — they return rows that don’t match.  
- `LEFT ANTI` → unmatched left rows.  
- `RIGHT ANTI` → unmatched right rows.  
- `FULL ANTI` → unmatched rows on both sides.  
