# 1.1.4 ALTER TABLE (ADD, DROP, MODIFY, RENAME COLUMN) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `ALTER TABLE` is the DDL command used to modify an existing table structure (adding, dropping, modifying, or renaming columns) without destroying stored data.

## 1. What is it?
`ALTER TABLE` is the SQL command used to change the structure of an existing table without dropping and recreating it.

## 2. Definition
```sql
ALTER TABLE table_name
<alteration_command>;
```

## 3. Why do we need it?
- Business rules evolve (new attributes needed).  
- Data types need adjustment.  
- Columns renamed for clarity.  
- Obsolete fields removed.  

## 4. Real-world Analogy
Think of a **school register**:  
- Adding a new subject column → `ADD COLUMN`.  
- Removing discontinued subject → `DROP COLUMN`.  
- Changing “Marks” to “Score” → `RENAME COLUMN`.  
- Adjusting roll number format → `MODIFY COLUMN`.

## 5. Mental Model
Visualize a spreadsheet template. `ALTER TABLE` is like editing the headers or rules after the sheet already has data.

---

## 6. Syntax
### Add Column
```sql
ALTER TABLE Employees
ADD COLUMN Email VARCHAR(100);
```

### Drop Column
```sql
ALTER TABLE Employees
DROP COLUMN City;
```

### Modify Column (PostgreSQL: ALTER COLUMN TYPE)
```sql
ALTER TABLE Employees
ALTER COLUMN Salary TYPE NUMERIC(12,2);
```

### Rename Column
```sql
ALTER TABLE Employees
RENAME COLUMN Name TO FullName;
```

---

## 7. Anatomy of the Syntax
- **ALTER TABLE** → choose table.  
- **ADD COLUMN** → add new field.  
- **DROP COLUMN** → remove field.  
- **ALTER COLUMN TYPE** → change data type.  
- **RENAME COLUMN** → rename field.

---

## 8. Rules
- Table must exist.  
- Adding column requires data type.  
- Dropping column deletes all its data.  
- Renaming doesn’t affect stored data.  
- Modifying type may require casting.  

---

## 9. Common Variations
- **PostgreSQL**: `ALTER COLUMN TYPE`.  
- **MySQL**: `MODIFY COLUMN`.  
- **SQL Server**: `ALTER COLUMN`.  

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |

---

## 11. Basic Example (ADD)
```sql
ALTER TABLE Employees
ADD COLUMN Email VARCHAR(100);
```

**Result:** Table now has an Email column.

---

## 12. Intermediate Example (DROP)
```sql
ALTER TABLE Employees
DROP COLUMN City;
```

**Result:** City column removed.

---

## 13. Advanced Example (MODIFY + RENAME)
```sql
ALTER TABLE Employees
ALTER COLUMN Salary TYPE NUMERIC(12,2);

ALTER TABLE Employees
RENAME COLUMN Name TO FullName;
```

---

## 14. Real Analyst Scenarios
- **HR**: Add “DateOfBirth” column.  
- **Finance**: Change Salary precision.  
- **Marketing**: Rename “CustID” to “CustomerID”.  

---

## 15. Expected Output
Schema changes reflected in table design. Data preserved unless column dropped.

---

## 16. Visual Explanation
```text
Table → ALTER TABLE → Schema Updated → Data remains intact
```

---

## 17. Behind the Scenes
Database updates metadata about table structure. Existing rows adapt to new schema rules.

---

## 18. Common Mistakes
> [!WARNING]
> - Dropping column without backup.  
> - Renaming column without updating query dependencies.  
> - Modifying type incompatible with existing data.  

---

## 19. Interview Questions
- **Beginner**: What does `ALTER TABLE` do?  
- **Intermediate**: Difference between `MODIFY` and `ALTER COLUMN`?  
- **Advanced**: How does `ALTER TABLE` affect existing data?  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `ALTER TABLE` delete existing rows?  
> **A**: Only if you explicitly `DROP COLUMN`. Other alterations preserve existing data.  

---

## 21. Performance Notes
> [!TIP]
> - `ALTER TABLE` can lock tables during schema modification.  
> - Large production tables may take time to alter.  

---

## 22. Best Practices
- Always backup before `DROP`/`MODIFY`.  
- Use meaningful names when renaming.  
- Test schema changes in staging environments.  

---

## 23. Common Business Use Cases
- HR: Add “ManagerID” column.  
- Finance: Adjust precision for transactions.  
- Ecommerce: Rename “ProdID” to “ProductID”.  

---

## 24. Comparison
- **ALTER TABLE vs CREATE TABLE**: `ALTER` modifies structure; `CREATE` defines a new table.  
- **ALTER vs UPDATE**: `ALTER` changes schema; `UPDATE` changes data rows.  

---

## 25. Memory Trick
> [!TIP]
> Think of ALTER TABLE as **“Adjust Layout of Table.”**

---

## 26. Cheat Sheet
- `ADD COLUMN` → New field  
- `DROP COLUMN` → Remove field  
- `ALTER COLUMN TYPE` → Change type  
- `RENAME COLUMN` → Rename field  

---

## 27. Summary
- `ALTER TABLE` modifies schema.  
- Supports `ADD`, `DROP`, `MODIFY`, `RENAME`.  
- Data preserved except `DROP`.  

---

## 28. Practice Questions
- **Easy**: Add Email column.  
- **Medium**: Rename Name to FullName.  
- **Hard**: Change Salary to `NUMERIC(12,2)`.  

---

## 29. Interview Practice Queries
- Write query to add `DateOfBirth` column.  
- Rename `CustID` to `CustomerID`.  

---

## 30. Hands-on Exercises
- Add `Status` column with `DEFAULT 'Active'`.  
- Drop obsolete `City` column.  

---

## 31. Mini Project Usage
Update **Sales Database**:
- Add `Discount` column.  
- Rename `OrderDate` to `PurchaseDate`.  
- Modify `Amount` precision.  

---

## 32. Key Takeaways
- `ALTER TABLE` evolves schema.  
- `ADD`, `DROP`, `MODIFY`, `RENAME` are core operations.  
- Always backup before major schema changes.  
