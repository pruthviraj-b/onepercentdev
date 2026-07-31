import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 35: 1.4.1 INSERT (single + multiple rows)
# ---------------------------------------------------------
parts_data[35] = {
    "title": "1.4.1 INSERT (single + multiple rows)",
    "content": """# 1.4.1 INSERT (Single + Multiple Rows) (Data Analyst Edition)

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
"""
}

# ---------------------------------------------------------
# Part 36: 1.4.2 UPDATE (with JOIN)
# ---------------------------------------------------------
parts_data[36] = {
    "title": "1.4.2 UPDATE (with JOIN)",
    "content": """# 1.4.2 UPDATE with JOIN (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `UPDATE` modifies existing column values in a table. When combined with a `JOIN`, it allows updating target rows using matching lookup values from another reference table.

## 1. What is it?
An `UPDATE` statement modifies existing rows.
When combined with a `JOIN`, it lets you update a table using values from another table.

## 2. Why do we need it?
- To sync data between related tables.  
- To apply changes based on reference tables.  
- To fix mismatched or missing values using authoritative lookup sources.  

## 3. Real-world Analogy
Imagine updating employee records:
- **Without JOIN** → You manually search and edit each row individually.  
- **With JOIN** → You cross-check with HR’s master list and update automatically in bulk.  

## 4. Syntax (SQL Server / PostgreSQL Style)
```sql
UPDATE t1
SET t1.col = t2.col
FROM table1 t1
JOIN table2 t2
  ON t1.key = t2.key
WHERE condition;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `50000` |
| **2** | Bob | 102 | `60000` |
| **3** | Carol | 103 | `70000` |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |
| **103** | Finance |

## 6. Basic Example
```sql
UPDATE Employees
SET Department = d.DeptName
FROM Employees e
JOIN Departments d
  ON e.DeptID = d.DeptID;
```
👉 Updates `Employees` table with department names matched from `Departments`.

## 7. Conditional Example
```sql
UPDATE Employees
SET Salary = Salary * 1.1
FROM Employees e
JOIN Departments d
  ON e.DeptID = d.DeptID
WHERE d.DeptName = 'IT';
```
👉 Gives a 10% salary raise strictly to IT employees.

## 8. MySQL Syntax Variant
```sql
UPDATE Employees e
JOIN Departments d
  ON e.DeptID = d.DeptID
SET e.Department = d.DeptName;
```

## 9. Real Analyst Scenarios
- **HR**: Update employee records with official department names.  
- **Finance**: Update transactions with latest daily exchange rates.  
- **Marketing**: Update campaign tables with region names.  
- **Ecommerce**: Update orders with product category tags.  

## 10. Expected Output
Target table rows updated cleanly with values from the joined table.

## 11. Visual Explanation
```text
Table A (Target to update) 
       JOIN 
Table B (Reference lookup) 
       → Updated values written to Table A
```

## 12. Common Mistakes
> [!WARNING]
> - Forgetting the `WHERE` clause → updates **all** rows in the target table accidentally!  
> - Misusing `JOIN` conditions → updates rows with wrong matching criteria.  
> - Executing `UPDATE` without previewing changes via `SELECT` first.  

## 13. Interview Questions
- **Beginner**: What does `UPDATE` with `JOIN` do?  
- **Intermediate**: Difference in syntax between SQL Server/PostgreSQL vs MySQL for `UPDATE JOIN`?  
- **Advanced**: How do you prevent accidental mass table updates?  

## 14. Best Practices
- Always test your query with a `SELECT` statement before converting it to an `UPDATE`.  
- Wrap updates in transactions (`BEGIN TRAN ... ROLLBACK / COMMIT`).  
- Alias target and source tables clearly.  

## 15. Dialect Comparison Table
| Database Engine | Syntax Pattern |
| :--- | :--- |
| **SQL Server / PostgreSQL** | `UPDATE t1 SET t1.col = t2.col FROM t1 JOIN t2 ON ...` |
| **MySQL** | `UPDATE t1 JOIN t2 ON ... SET t1.col = t2.col` |

## 16. Memory Trick
> [!TIP]
> - **UPDATE** = “Change.”  
> - **JOIN** = “Use another reference table.”  
> - **UPDATE + JOIN** = “Change using another table.”  

## 17. Cheat Sheet
```sql
-- SQL Server / Postgres
UPDATE t1
SET t1.col = t2.col
FROM t1
JOIN t2 ON t1.key = t2.key;

-- MySQL
UPDATE t1
JOIN t2 ON t1.key = t2.key
SET t1.col = t2.col;
```

## 18. Summary
`UPDATE` with `JOIN` lets you modify rows in one table using values from another. It’s essential for syncing, enriching, and correcting data across schemas.  
"""
}

# ---------------------------------------------------------
# Part 37: 1.4.3 DELETE (row, duplicates, with JOIN)
# ---------------------------------------------------------
parts_data[37] = {
    "title": "1.4.3 DELETE (row, duplicates, with JOIN)",
    "content": """# 1.4.3 DELETE (Row, Duplicates, With JOIN) (Data Analyst Edition)

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
"""
}

# ---------------------------------------------------------
# Save all parts and update API JSON files
# ---------------------------------------------------------
output_dir = os.path.join("frontend", "public", "api")
modules_file = os.path.join(output_dir, "modules-sql.json")

with open(modules_file, "r", encoding="utf-8") as f:
    modules_data = json.load(f)

for part_num, pinfo in parts_data.items():
    # 1. Save content/sql/Part-X/notes.md
    part_dir = os.path.join("content", "sql", f"Part-{part_num}")
    os.makedirs(part_dir, exist_ok=True)
    notes_file = os.path.join(part_dir, "notes.md")
    with open(notes_file, "w", encoding="utf-8") as f:
        f.write(pinfo["content"])

    # 2. Update modules-sql.json
    word_count = len(pinfo["content"].split())
    for m in modules_data:
        for n in m.get("notes", []):
            if n["part"] == part_num:
                n["wordCount"] = word_count
                n["title"] = pinfo["title"]

    # 3. Save notes/sql/X.json
    sql_notes_dir = os.path.join(output_dir, "notes", "sql")
    os.makedirs(sql_notes_dir, exist_ok=True)
    with open(os.path.join(sql_notes_dir, f"{part_num}.json"), "w", encoding="utf-8") as f:
        json.dump({
            "part": part_num,
            "title": pinfo["title"],
            "notes": pinfo["content"],
            "files": [],
            "importance": "high" if part_num in [35, 36, 37] else "medium",
            "module": "1.4 TIER 5: DATA MODIFICATION",
            "module_id": 5,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Tier 5 (Parts 35 through 37) successfully saved and compiled into static API JSON!")
