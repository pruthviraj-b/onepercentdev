# 1.1.5 DROP / TRUNCATE / RENAME TABLE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `DROP TABLE` permanently deletes a table and structure; `TRUNCATE TABLE` clears all rows while keeping structure; `RENAME TABLE` updates table names.

## 1. What are they?
- **DROP TABLE** → permanently deletes a table and all its data.  
- **TRUNCATE TABLE** → removes all rows but keeps the table structure.  
- **RENAME TABLE** → changes the table’s name.  

## 2. Why do we need them?
- **DROP** → clean up obsolete tables.  
- **TRUNCATE** → reset data quickly without losing schema.  
- **RENAME** → clarify naming conventions or fix mistakes.  

## 3. Real-world Analogy
- **DROP** = throwing away the entire notebook.  
- **TRUNCATE** = erasing all notes but keeping the notebook binder.  
- **RENAME** = relabeling the notebook’s cover.  

---

## 4. Syntax
### DROP
```sql
DROP TABLE table_name;
```

### TRUNCATE
```sql
TRUNCATE TABLE table_name;
```

### RENAME
- **MySQL**:
```sql
RENAME TABLE old_name TO new_name;
```
- **PostgreSQL**:
```sql
ALTER TABLE old_name RENAME TO new_name;
```
- **SQL Server**:
```sql
sp_rename 'old_name', 'new_name';
```

---

## 5. Rules
- `DROP` deletes table + data permanently.  
- `TRUNCATE` deletes rows but keeps schema.  
- `RENAME` only changes name, not structure.  
- Admin permissions required.  

---

## 6. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |

---

## 7. Basic Example (DROP)
```sql
DROP TABLE Employees;
```
👉 Table removed completely from database catalog.

---

## 8. Intermediate Example (TRUNCATE)
```sql
TRUNCATE TABLE Employees;
```
👉 All rows deleted, but table structure remains intact.

---

## 9. Advanced Example (RENAME)
```sql
ALTER TABLE Employees RENAME TO Staff;
```
👉 Table renamed to Staff.

---

## 10. Real Analyst Scenarios
- **HR**: Drop old temporary staging tables.  
- **Finance**: Truncate staging tables before reloading daily batch data.  
- **Marketing**: Rename `Cust` to `Customers` for clarity.  

---

## 11. Expected Output
- **DROP** → Table gone completely.  
- **TRUNCATE** → Empty table, identical schema.  
- **RENAME** → Table name updated in database catalog.  

---

## 12. Visual Explanation
```text
DROP     → Delete notebook
TRUNCATE → Erase pages
RENAME   → Change notebook label
```

---

## 13. Behind the Scenes
- `DROP` updates metadata and frees disk storage.  
- `TRUNCATE` is significantly faster than `DELETE` because it doesn't log row-by-row deletions.  
- `RENAME` updates catalog metadata entry.  

---

## 14. Common Mistakes
> [!WARNING]
> - Dropping tables without a backup.  
> - Confusing `TRUNCATE` with `DELETE` (`DELETE` can filter rows with `WHERE`, `TRUNCATE` clears the entire table).  
> - Forgetting to update queries after renaming.  

---

## 15. Interview Questions
- **Beginner**: Difference between `DROP` and `TRUNCATE`?  
- **Intermediate**: Can `TRUNCATE` be rolled back?  
- **Advanced**: How does `TRUNCATE` differ from `DELETE` in logging and performance?  

---

## 16. Interview Traps
> [!IMPORTANT]
> **Q**: Does `TRUNCATE` reset auto-increment / identity counters?  
> **A**: Yes, in most relational engines (`MySQL`, `PostgreSQL`), `TRUNCATE` resets identity counters back to seed 1.  

---

## 17. Performance Notes
> [!TIP]
> - `TRUNCATE` is lightning-fast compared to `DELETE FROM table`.  
> - `DROP` frees storage space instantly.  

---

## 18. Best Practices
- Always backup before `DROP`/`TRUNCATE`.  
- Use `TRUNCATE` for staging ETL tables.  
- Use meaningful names when renaming.  

---

## 19. Common Business Use Cases
- Finance: Truncate daily load tables.  
- HR: Drop obsolete temp tables.  
- Ecommerce: Rename `Orders2025` to `OrdersHistory`.  

---

## 20. Comparison Table
| Command | Effect | Keeps Schema? | Reversible? |
| :--- | :--- | :--- | :--- |
| **DROP** | Delete table + data | No | No |
| **TRUNCATE** | Delete all rows | Yes | Transaction-dependent |
| **RENAME** | Change table name | Yes | Yes |

---

## 21. Memory Trick
> [!TIP]
> - **DROP** = Delete Object  
> - **TRUNCATE** = Trim All Rows  
> - **RENAME** = Relabel Name  

---

## 22. Cheat Sheet
```sql
DROP TABLE table_name;          -- Remove table completely
TRUNCATE TABLE table_name;      -- Clear all rows fast
ALTER TABLE old RENAME TO new;  -- Rename table
```

---

## 23. Summary
- `DROP` → Permanent removal.  
- `TRUNCATE` → Fast reset.  
- `RENAME` → Name change.  

---

## 24. Practice Questions
- **Easy**: Drop Employees table.  
- **Medium**: Truncate Orders table.  
- **Hard**: Rename Customers to Clients.  

---

## 25. Interview Practice Queries
- Write query to truncate staging table.  
- Rename `Orders2026` to `OrdersArchive`.  

---

## 26. Hands-on Exercises
- Create table, insert rows, then truncate.  
- Rename table and query it.  

---

## 27. Mini Project Usage
Data pipeline cleanup:
- Truncate staging tables daily.  
- Drop temp tables after ETL completion.  
- Rename archive tables yearly.  

---

## 28. Key Takeaways
- `DROP` deletes table permanently.  
- `TRUNCATE` clears rows quickly.  
- `RENAME` changes table name.  
- Always backup before destructive changes.  
