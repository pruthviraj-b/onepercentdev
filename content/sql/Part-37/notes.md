# 1.4.3 DELETE (Row, Duplicates, With JOIN) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: The `DELETE` statement permanently removes rows from a table. It can target single records, duplicate rows, or rows linked via table joins.

## 1. What is DELETE?
The `DELETE` statement removes rows from a table.
It can target one record, multiple duplicate rows, or rows matched via another table.

## 2. Why do we need it?
- To clean incorrect or outdated records.  
- To remove duplicates for data integrity.  
- To cascade deletions across related tables.  

## 3. Real-world Analogy
- **Single row delete** → Removing one student from a class register.  
- **Duplicate delete** → Erasing repeated entries in a guest list.  
- **JOIN delete** → Removing orders when a customer account is deleted.  

## 4. Syntax

### Single Row Delete
```sql
DELETE FROM table_name
WHERE condition;
```

### Deleting Duplicates (Common Pattern)
```sql
DELETE FROM Employees e1
WHERE EXISTS (
    SELECT 1
    FROM Employees e2
    WHERE e1.EmployeeID > e2.EmployeeID
      AND e1.Name = e2.Name
      AND e1.Department = e2.Department
);
```

### Delete with JOIN (SQL Server / PostgreSQL style)
```sql
DELETE FROM e
FROM Employees e
JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.Location = 'Chicago';
```

### Delete with JOIN (MySQL style)
```sql
DELETE e
FROM Employees e
JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.Location = 'Chicago';
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `50000` |
| **2** | Bob | 102 | `60000` |
| **3** | Carol | 103 | `70000` |
| **4** | Bob | 102 | `60000` *(Duplicate)* |

**Departments Table**

| DeptID | DeptName | Location |
| :--- | :--- | :--- |
| **101** | HR | New York |
| **102** | IT | Chicago |
| **103** | Finance | New York |

## 6. Single Row Example
```sql
DELETE FROM Employees
WHERE EmployeeID = 1;
```
👉 Deletes Alice.

## 7. Delete Duplicates Example
```sql
DELETE FROM Employees e1
WHERE EXISTS (
    SELECT 1
    FROM Employees e2
    WHERE e1.EmployeeID > e2.EmployeeID
      AND e1.Name = e2.Name
      AND e1.DeptID = e2.DeptID
);
```
👉 Removes the duplicate Bob record (keeps the lower `EmployeeID = 2`).

## 8. Delete with JOIN Example
```sql
DELETE e
FROM Employees e
JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.Location = 'Chicago';
```
👉 Deletes all employees whose department is located in Chicago (Bob).

## 9. Real Analyst Scenarios
- **HR**: Remove duplicate employee records.  
- **Finance**: Delete transactions linked to closed/fraudulent accounts.  
- **Marketing**: Delete campaigns with no generated leads.  
- **Ecommerce**: Delete orders for discontinued products.  

## 10. Expected Output
Target rows removed permanently from the database table.

## 11. Visual Explanation
```text
DELETE          → Removes matching rows
Single Row      → Removes 1 record
Duplicates      → Removes repeated copies
DELETE with JOIN → Removes rows linked to matching foreign table
```

## 12. Common Mistakes
> [!WARNING]
> - Executing `DELETE FROM table;` without a `WHERE` clause → **deletes all rows in the entire table!**  
> - Misusing `JOIN` conditions → deletes unintended rows.  
> - Not running a `SELECT` query first to verify which rows will be deleted.  

## 13. Interview Questions
- **Beginner**: How do you delete a single row safely?  
- **Intermediate**: How do you delete duplicates while retaining one clean record?  
- **Advanced**: How do you delete with `JOIN` in MySQL vs SQL Server?  

## 14. Best Practices
- **Always test with `SELECT *` first** using the exact same `WHERE` / `JOIN` clauses.  
- Use transactions (`BEGIN TRAN ... ROLLBACK`) before performing destructive deletes.  
- Keep database backups prior to bulk deletions.  

## 15. Comparison Table
| Delete Type | Syntax Pattern | Use Case |
| :--- | :--- | :--- |
| **Row Delete** | `DELETE FROM table WHERE ...` | Single record removal |
| **Duplicate Delete** | `DELETE ... WHERE EXISTS (...)` | Deduplication |
| **Delete with JOIN** | `DELETE t1 FROM t1 JOIN t2 ...` | Cascading relationship delete |

## 16. Memory Trick
> [!TIP]
> - **DELETE** = “Erase.”  
> - **Row** = One record.  
> - **Duplicates** = Clean extra copies.  
> - **JOIN** = Erase using reference table.  

## 17. Cheat Sheet
```sql
DELETE FROM table WHERE condition;
DELETE FROM table1 WHERE EXISTS (SELECT 1 FROM table1 t2 WHERE ...);
DELETE t1 FROM table1 t1 JOIN table2 t2 ON t1.key = t2.key WHERE ...;
```

## 18. Summary
`DELETE` removes rows. Use `WHERE` for single rows, `EXISTS` for duplicates, and `JOIN` for related rows. Always verify with `SELECT` before executing!  
