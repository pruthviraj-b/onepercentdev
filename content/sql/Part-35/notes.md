# 1.4.1 INSERT (Single + Multiple Rows) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: The `INSERT` DML statement adds new data rows into a table — either single row insertions, batch multi-row insertions, or copying results directly from another table.

## 1. What is INSERT?
The `INSERT` statement adds new records into a table.

## 2. Why do we need it?
- To populate tables with data.  
- To add new transactions, employees, or customers.  
- To seed test datasets and staging tables.  

## 3. Real-world Analogy
- **Single row** → Adding one new student to a class register.  
- **Multiple rows** → Adding a batch of students all at once.  

## 4. Syntax

### Single Row
```sql
INSERT INTO table_name (col1, col2, col3)
VALUES (val1, val2, val3);
```

### Multiple Rows
```sql
INSERT INTO table_name (col1, col2, col3)
VALUES 
(val1, val2, val3),
(val4, val5, val6),
(val7, val8, val9);
```

## 5. Example Dataset
**Employees Table (Before Insert)**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |

## 6. Single Row Example
```sql
INSERT INTO Employees (EmployeeID, Name, Department, Salary)
VALUES (1, 'Alice', 'HR', 50000);
```
👉 Adds Alice to the Employees table.

## 7. Multiple Rows Example
```sql
INSERT INTO Employees (EmployeeID, Name, Department, Salary)
VALUES 
(2, 'Bob', 'IT', 60000),
(3, 'Carol', 'Finance', 70000),
(4, 'David', 'IT', 65000);
```
👉 Adds Bob, Carol, and David in one single batch operation.

## 8. Insert Without Column List
```sql
INSERT INTO Employees
VALUES (5, 'Emma', 'HR', 52000);
```
👉 Works only if inserted values match the exact table column order and count.

## 9. Insert from Another Table (INSERT INTO SELECT)
```sql
INSERT INTO EmployeesArchive (EmployeeID, Name, Department, Salary)
SELECT EmployeeID, Name, Department, Salary
FROM Employees
WHERE Department = 'IT';
```
👉 Copies all IT employees into an archive table.

## 10. Real Analyst Scenarios
- **HR**: Add new hires to active employee table.  
- **Finance**: Insert new transaction ledger batches.  
- **Marketing**: Insert new campaign leads.  
- **Ecommerce**: Insert new customer order records.  

## 11. Expected Output
New rows added permanently to the target table.

## 12. Visual Explanation
```text
INSERT        → Adds new rows
Single Row    → Adds one record
Multiple Rows → Adds batch of records in one transaction
```

## 13. Common Mistakes
> [!WARNING]
> - Forgetting column list → schema mismatch errors if column order changes.  
> - Inserting wrong data types → type cast failure.  
> - Duplicate primary keys → constraint violation crash.  

## 14. Interview Questions
- **Beginner**: How do you insert a single row?  
- **Intermediate**: How do you insert multiple rows at once?  
- **Advanced**: How do you copy data from one table to another using `INSERT INTO SELECT`?  

## 15. Best Practices
- Always specify column lists explicitly in `INSERT` statements.  
- Validate data types before executing batch inserts.  
- Wrap bulk inserts in database transactions (`BEGIN ... COMMIT`) for safety.  

## 16. Comparison Table
| Type | Syntax Pattern | Primary Use Case |
| :--- | :--- | :--- |
| **Single Row** | `VALUES (...)` | One record creation |
| **Multiple Rows** | `VALUES (...), (...)` | Batch bulk insert |
| **Insert-Select** | `INSERT ... SELECT` | Copying data between tables |

## 17. Memory Trick
> [!TIP]
> **INSERT = “Put data inside.”**  
> Single row = 1 item.  
> Multiple rows = batch container.  

## 18. Cheat Sheet
```sql
INSERT INTO table (col1, col2) VALUES (val1, val2);
INSERT INTO table (col1, col2) VALUES (val1, val2), (val3, val4);
INSERT INTO table SELECT ... FROM other_table;
```

## 19. Summary
`INSERT` adds data. Use single row for one record, multiple rows for batch inserts, and `INSERT INTO SELECT` for copying.  
