import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 15: 1.1.1 CREATE / DROP / RENAME DATABASE
# ---------------------------------------------------------
parts_data[15] = {
    "title": "1.1.1 CREATE / DROP / RENAME DATABASE",
    "content": """# 1.1.1 CREATE / DROP / RENAME DATABASE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: In SQL, you manage databases with three core commands: `CREATE DATABASE` (to make a new one), `DROP DATABASE` (to permanently delete it), and `RENAME DATABASE` (to change its name, though support varies across database systems).

PostgreSQL and MySQL use `CREATE`/`DROP` directly, while SQL Server uses similar syntax but does not support `RENAME DATABASE` directly — instead you use `ALTER DATABASE`.

---

## 📌 CREATE DATABASE
- **Purpose:** Create a new database container to hold tables, views, and other objects.  
- **Syntax (MySQL/PostgreSQL):**
  ```sql
  CREATE DATABASE database_name;
  ```
- **Optional:**  
  - `CREATE DATABASE IF NOT EXISTS database_name;` → avoids error if it already exists.  
- **SQL Server:**  
  ```sql
  CREATE DATABASE database_name;
  ```

---

## 🗑️ DROP DATABASE
- **Purpose:** Permanently delete a database and all its objects.  
- **Syntax (MySQL/PostgreSQL):**
  ```sql
  DROP DATABASE database_name;
  ```
- **Safe form:**  
  ```sql
  DROP DATABASE IF EXISTS database_name;
  ```
- **SQL Server:**  
  ```sql
  DROP DATABASE database_name;
  ```

> [!WARNING]
> You cannot drop a database if you are currently connected to it. Always disconnect active sessions first.

---

## ✏️ RENAME DATABASE
- **MySQL:**  
  - Direct `RENAME DATABASE` is deprecated/unsupported. Instead, you must create a new database and move tables manually.  
- **PostgreSQL:**  
  ```sql
  ALTER DATABASE old_name RENAME TO new_name;
  ```
- **SQL Server:**  
  ```sql
  ALTER DATABASE old_name MODIFY NAME = new_name;
  ```

---

## 🔍 Example Workflow
```sql
-- Create a new database
CREATE DATABASE HR_DB;

-- Use the database
USE HR_DB;

-- Drop the database safely
DROP DATABASE IF EXISTS HR_DB;

-- Rename database (PostgreSQL)
ALTER DATABASE HR_DB RENAME TO HumanResources;
```

---

## ⚠️ Analyst Notes
- **Always double-check before DROP** — deletion is 100% irreversible.  
- **Renaming** is not universally supported; in MySQL, you must migrate objects manually.  
- **Permissions:** You need database administrator (DBA) privileges to create, drop, or rename databases.  

---

## ✅ Key Takeaways
- **CREATE DATABASE** → makes a new database.  
- **DROP DATABASE** → deletes it permanently.  
- **RENAME DATABASE** → supported in PostgreSQL/SQL Server, not in MySQL.  
- Use `IF EXISTS` / `IF NOT EXISTS` for safer operations.  
"""
}

# ---------------------------------------------------------
# Part 16: 1.1.2 CREATE TABLE
# ---------------------------------------------------------
parts_data[16] = {
    "title": "1.1.2 CREATE TABLE",
    "content": """# 1.1.2 CREATE TABLE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `CREATE TABLE` is the SQL DDL command used to define a new table structure — columns, data types, and integrity constraints — where data will live.

## 1. What is it?
`CREATE TABLE` is the SQL command used to define a new table — the structure where data will live.

## 2. Definition
```sql
CREATE TABLE table_name (
    column_name data_type constraint,
    ...
);
```

## 3. Why do we need it?
Tables are the foundation of relational databases. Analysts rely on well‑designed tables to ensure clean, reliable, and efficient analysis.

## 4. Real-world Analogy
Think of designing a **school register**:  
- **Columns** = fields (Name, Roll No, Grade).  
- **Rows** = students.  
`CREATE TABLE` is like designing the register template before filling it.

## 5. Mental Model
Visualize a spreadsheet template. `CREATE TABLE` defines the headers, data types, and rules before any data is entered.

---

## 6. Basic Syntax
```sql
CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Department VARCHAR(50),
    Salary NUMERIC(10,2),
    HireDate DATE
);
```

---

## 7. Anatomy of the Syntax
- **EmployeeID INT PRIMARY KEY** → unique identifier.  
- **Name VARCHAR(50) NOT NULL** → text, required.  
- **Department VARCHAR(50)** → optional text.  
- **Salary NUMERIC(10,2)** → precise decimal.  
- **HireDate DATE** → calendar date.

---

## 8. Rules
- Table name must be unique within the schema.  
- Each column needs a data type.  
- Constraints enforce rules (`PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`, `DEFAULT`).  
- Semicolon ends the statement.

---

## 9. Common Variations
- **AUTO_INCREMENT / SERIAL** → auto‑generate IDs.  
- **DEFAULT** → assign default values.  
- **CHECK** → enforce logical conditions.  
- **FOREIGN KEY** → link tables.  
- **TEMPORARY TABLES** → exist only during session.  
- **CREATE TABLE AS SELECT** → build from query results.

---

## 10. Example Dataset
```sql
INSERT INTO Employees VALUES
(1,'Alice','HR',50000,'2020-01-15'),
(2,'Bob','IT',60000,'2019-03-10'),
(3,'Carol','Finance',70000,'2021-07-01');
```

---

## 11. Basic Example
```sql
CREATE TABLE Departments (
    DeptID INT PRIMARY KEY,
    DeptName VARCHAR(50) UNIQUE NOT NULL
);
```

---

## 12. Intermediate Example
```sql
CREATE TABLE Projects (
    ProjectID SERIAL PRIMARY KEY,
    ProjectName VARCHAR(100) NOT NULL,
    DeptID INT,
    FOREIGN KEY (DeptID) REFERENCES Departments(DeptID)
);
```

---

## 13. Advanced Example
```sql
CREATE TABLE Transactions (
    TxnID BIGSERIAL PRIMARY KEY,
    CustomerID INT NOT NULL,
    Amount NUMERIC(12,2) CHECK (Amount > 0),
    TxnDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(20) CHECK (Status IN ('Pending','Completed','Failed')),
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

---

## 14. Real Analyst Scenarios
- **HR**: Employee tables with salary constraints.  
- **Finance**: Transaction tables with numeric precision.  
- **Marketing**: Campaign tables with start/end dates.  
- **Product**: Event logs with timestamps.  

---

## 15. Expected Output
Tables created with constraints enforce rules automatically:
- No duplicate IDs.  
- No NULLs in required fields.  
- No invalid values in CHECK constraints.  

---

## 16. Visual Explanation
```text
CREATE TABLE → Define Columns → Assign Data Types → Add Constraints → Ready for Data
```

---

## 17. Behind the Scenes
Database allocates storage based on data types and enforces constraints during inserts/updates.

---

## 18. Common Mistakes
> [!WARNING]
> - Using `FLOAT` for money (causes rounding errors).  
> - Forgetting `NOT NULL` on required fields.  
> - No primary key → duplicate rows.  
> - Misusing `FOREIGN KEY` without matching parent table.  

---

## 19. Interview Questions
- **Beginner**: What does `PRIMARY KEY` do?  
- **Intermediate**: Difference between `UNIQUE` and `PRIMARY KEY`?  
- **Advanced**: How do foreign keys enforce referential integrity?  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can a table have multiple `PRIMARY KEY` clauses?  
> **A**: No, only one `PRIMARY KEY` per table, but it can span multiple columns (composite key).  

---

## 21. Performance Notes
> [!TIP]
> - Primary and Unique keys automatically build underlying B-tree indexes for fast queries.  
> - Smaller data types = faster query execution.  
> - Normalize tables to avoid redundancy.  

---

## 22. Best Practices
- Always define a primary key.  
- Use meaningful column names.  
- Choose correct data types.  
- Document constraints.  
- Avoid `SELECT *` when creating tables from queries.  

---

## 23. Common Business Use Cases
- **HR**: Employees, Departments.  
- **Finance**: Transactions, Accounts.  
- **Ecommerce**: Customers, Orders, Products.  
- **Healthcare**: Patients, Appointments.  

---

## 24. Comparison Table
| Feature | Primary Key | Unique Key | Foreign Key |
| :--- | :--- | :--- | :--- |
| **Uniqueness** | Must be unique | Must be unique | Can repeat |
| **NULL Allowed** | No | Yes | Yes |
| **Purpose** | Row identity | Prevent duplicates | Link tables |

---

## 25. Memory Trick
> [!TIP]
> Think of CREATE TABLE as **“Craft Template”** — you’re designing the mold before pouring data.

---

## 26. Cheat Sheet
- `PRIMARY KEY` → unique ID  
- `FOREIGN KEY` → link tables  
- `NOT NULL` → required  
- `DEFAULT` → auto value  
- `CHECK` → condition  
- `UNIQUE` → no duplicates  

---

## 27. Summary
- `CREATE TABLE` defines table structure.  
- Constraints enforce rules.  
- Good design = reliable analysis.  

---

## 28. Practice Questions
- **Easy**: Create a table for students.  
- **Medium**: Add constraints for unique emails.  
- **Hard**: Create table with foreign key to departments.  

---

## 29. Interview Practice Queries
- Create a table for orders with foreign key to customers.  
- Explain difference between `PRIMARY KEY` and `UNIQUE` with examples.  

---

## 30. Hands-on Exercises
- Build a table for products with `CHECK` on `price > 0`.  
- Add `DEFAULT` value for `status = 'Active'`.  

---

## 31. Mini Project Usage
Design a **Sales Database**:
- Customers table  
- Orders table (foreign key to Customers)  
- Products table  
- Transactions table with `CHECK` and `DEFAULT` constraints  

---

## 32. Key Takeaways
- `CREATE TABLE` is the foundation of SQL database design.  
- Constraints (`PRIMARY`, `FOREIGN`, `UNIQUE`, `CHECK`, `DEFAULT`) are critical.  
- Good schema design = efficient analysis.  
"""
}

# ---------------------------------------------------------
# Part 17: 1.1.3 Constraints (NOT NULL, CHECK, DEFAULT, AUTO_INCREMENT)
# ---------------------------------------------------------
parts_data[17] = {
    "title": "1.1.3 Constraints (NOT NULL, CHECK, DEFAULT, AUTO_INCREMENT)",
    "content": """# 1.1.3 Constraints (NOT NULL, CHECK, DEFAULT, AUTO_INCREMENT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Constraints are rules applied to columns in a table to enforce data integrity, prevent bad inputs, and automate default values.

## 1. What is it?
Constraints are rules applied to columns in a table to enforce data integrity and consistency.

## 2. Definition
Constraints restrict the type of data that can be inserted into a column. They ensure values meet certain conditions.

## 3. Why do we need it?
Without constraints, databases can store invalid, duplicate, or meaningless data. Analysts would waste time cleaning instead of analyzing.

## 4. Real-world Analogy
Think of filling out a **bank form**:
- You can’t leave “Account Number” blank → **NOT NULL**  
- Age must be ≥ 18 → **CHECK**  
- Default branch = “Main” if you don’t specify → **DEFAULT**  
- Account ID auto‑generates → **AUTO_INCREMENT**

---

## 5. Mental Model
Constraints are **guardrails**: they keep data on track and prevent errors.

---

## 6. Syntax
```sql
CREATE TABLE Employees (
    EmployeeID SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Salary NUMERIC(10,2) CHECK (Salary > 0),
    City VARCHAR(50) DEFAULT 'Unknown'
);
```

---

## 7. Anatomy of the Syntax
- **NOT NULL** → column must have a value.  
- **CHECK (condition)** → enforces logical rule.  
- **DEFAULT value** → assigns value if none provided.  
- **AUTO_INCREMENT / SERIAL** → auto‑generate unique IDs.

---

## 8. Rules
- `NOT NULL` prevents `NULL` entries.  
- `CHECK` must evaluate to `TRUE`.  
- `DEFAULT` applies only when no value is given.  
- `AUTO_INCREMENT` is supported differently across SQL dialects:  
  - MySQL → `AUTO_INCREMENT`  
  - PostgreSQL → `SERIAL` or `GENERATED AS IDENTITY`  
  - SQL Server → `IDENTITY`

---

## 9. Common Variations
- `CHECK (Age >= 18)`  
- `DEFAULT CURRENT_DATE`  
- `AUTO_INCREMENT` vs `SERIAL` vs `IDENTITY`

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Salary | City |
| :--- | :--- | :--- | :--- |
| **1** | Alice | `50000` | Unknown |
| **2** | Bob | `60000` | Chicago |
| **3** | Carol | `70000` | Boston |

---

## 11. Basic Example (NOT NULL)
```sql
CREATE TABLE Students (
    StudentID SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);
```
👉 You cannot insert a student without a name.

---

## 12. Intermediate Example (CHECK)
```sql
CREATE TABLE Accounts (
    AccountID SERIAL PRIMARY KEY,
    Balance NUMERIC(12,2) CHECK (Balance >= 0)
);
```
👉 Prevents negative balances.

---

## 13. Advanced Example (DEFAULT + AUTO_INCREMENT)
```sql
CREATE TABLE Orders (
    OrderID SERIAL PRIMARY KEY,
    OrderDate DATE DEFAULT CURRENT_DATE,
    Status VARCHAR(20) DEFAULT 'Pending'
);
```
👉 Auto‑generates IDs, defaults to today’s date and “Pending”.

---

## 14. Real Analyst Scenarios
- **HR**: Enforce salary > 0.  
- **Finance**: Prevent negative transactions.  
- **Marketing**: Default campaign status = “Active”.  
- **Ecommerce**: Auto‑generate order IDs.

---

## 15. Expected Output
When inserting:
```sql
INSERT INTO Orders (Status) VALUES ('Completed');
INSERT INTO Orders DEFAULT VALUES;
```

**Output Table:**

| OrderID | OrderDate | Status |
| :--- | :--- | :--- |
| **1** | `2026-07-24` | Completed |
| **2** | `2026-07-24` | Pending |

---

## 16. Visual Explanation
```text
Insert Row → Apply Constraints → Accept or Reject
```

---

## 17. Behind the Scenes
- `NOT NULL` → database checks for missing values.  
- `CHECK` → evaluates condition logic.  
- `DEFAULT` → fills in missing values.  
- `AUTO_INCREMENT` → increments sequence counter.

---

## 18. Common Mistakes
> [!WARNING]
> - Forgetting `NOT NULL` → leads to missing critical data.  
> - Misusing `CHECK` with wrong logic.  
> - Assuming `DEFAULT` applies when `NULL` is explicitly inserted (it doesn’t).  
> - Confusing `AUTO_INCREMENT` syntax across dialects.  

---

## 19. Interview Questions
- **Beginner**: What does `NOT NULL` do?  
- **Intermediate**: Difference between `DEFAULT` and `CHECK`?  
- **Advanced**: How does `AUTO_INCREMENT` differ in MySQL vs PostgreSQL?  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `DEFAULT` apply when you explicitly insert `NULL`?  
> **A**: No, `DEFAULT` only applies when no value is provided in the `INSERT` column list.  

---

## 21. Performance Notes
> [!TIP]
> - Constraints add minor validation overhead during writes, but guarantee 100% data integrity.  
> - `AUTO_INCREMENT` sequence generators are optimized at the engine level.  

---

## 22. Best Practices
- Always use `NOT NULL` for required fields.  
- Use `CHECK` for business rules.  
- Use `DEFAULT` for common values.  
- Use `AUTO_INCREMENT` for surrogate primary keys.  

---

## 23. Common Business Use Cases
- HR: Enforce non‑NULL employee names.  
- Finance: Prevent negative balances.  
- Marketing: Default campaign status.  
- Ecommerce: Auto‑generate order IDs.  

---

## 24. Comparison Table
| Constraint | Purpose | Example |
| :--- | :--- | :--- |
| **NOT NULL** | Required field | `Name NOT NULL` |
| **CHECK** | Logical rule | `Salary > 0` |
| **DEFAULT** | Auto value | `Status DEFAULT 'Active'` |
| **AUTO_INCREMENT** | Auto ID | `OrderID SERIAL` |

---

## 25. Memory Tricks
> [!TIP]
> - **NOT NULL** = “Never Empty”  
> - **CHECK** = “Condition Gate”  
> - **DEFAULT** = “Fill Automatically”  
> - **AUTO_INCREMENT** = “Count Up”  

---

## 26. Cheat Sheet
```sql
NOT NULL       → Must have value
CHECK          → Enforce condition
DEFAULT        → Auto assign
AUTO_INCREMENT → Auto ID
```

---

## 27. Summary
- Constraints enforce integrity.  
- `NOT NULL`, `CHECK`, `DEFAULT`, `AUTO_INCREMENT` are core.  
- Analysts must master them for reliable tables.  

---

## 28. Practice Questions
- **Easy**: Create table with `NOT NULL` name.  
- **Medium**: Add `CHECK` for salary > 0.  
- **Hard**: Create table with `DEFAULT` status and `AUTO_INCREMENT` ID.  

---

## 29. Interview Practice Queries
- Write query to create `Orders` table with constraints.  
- Explain difference between `DEFAULT` and `CHECK` with examples.  

---

## 30. Hands-on Exercises
- Create table for `Products` with `price > 0`.  
- Add `DEFAULT stock = 100`.  

---

## 31. Mini Project Usage
Design a **Banking Database**:
- Customers table (`NOT NULL` names).  
- Accounts table (`CHECK` balance ≥ 0).  
- Transactions table (`DEFAULT` status).  
- Auto‑generated IDs for all.  

---

## 32. Key Takeaways
- Constraints = rules for clean data.  
- `NOT NULL` prevents missing values.  
- `CHECK` enforces logic.  
- `DEFAULT` fills gaps.  
- `AUTO_INCREMENT` generates IDs.  
"""
}

# ---------------------------------------------------------
# Part 18: 1.1.4 ALTER TABLE (ADD, DROP, MODIFY, RENAME COLUMN)
# ---------------------------------------------------------
parts_data[18] = {
    "title": "1.1.4 ALTER TABLE (ADD, DROP, MODIFY, RENAME COLUMN)",
    "content": """# 1.1.4 ALTER TABLE (ADD, DROP, MODIFY, RENAME COLUMN) (Data Analyst Edition)

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
"""
}

# ---------------------------------------------------------
# Part 19: 1.1.5 DROP / TRUNCATE / RENAME TABLE
# ---------------------------------------------------------
parts_data[19] = {
    "title": "1.1.5 DROP / TRUNCATE / RENAME TABLE",
    "content": """# 1.1.5 DROP / TRUNCATE / RENAME TABLE (Data Analyst Edition)

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
"""
}

# ---------------------------------------------------------
# Part 20: 1.1.6 Primary Key, Foreign Key, Composite Key, Unique Key
# ---------------------------------------------------------
parts_data[20] = {
    "title": "1.1.6 Primary Key, Foreign Key, Composite Key, Unique Key",
    "content": """# 1.1.6 Keys in SQL (Primary, Foreign, Composite, Unique) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Keys enforce row uniqueness, establish table relationships, and preserve data integrity across relational databases.

## 1. What are they?
Keys are constraints that define relationships and uniqueness in tables. They ensure data integrity and connect tables logically.

## 2. Definition
- **Primary Key** → uniquely identifies each row.  
- **Foreign Key** → links one table to another.  
- **Composite Key** → primary key made of multiple columns.  
- **Unique Key** → ensures column values are unique but allows `NULL`.

## 3. Why do we need them?
Without keys, databases would allow duplicates, broken relationships, and unreliable analysis.

## 4. Real-world Analogy
- **Primary Key** → Aadhaar / SSN number (unique ID for each citizen).  
- **Foreign Key** → Student’s roll number in exam results (links to student table).  
- **Composite Key** → Bus ticket (Route + Seat together make it unique).  
- **Unique Key** → Email ID (unique per person, but optional).

## 5. Mental Model
Think of keys as **locks**: they guarantee uniqueness and enforce relationships.

---

## 6. Syntax
```sql
CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY,
    Email VARCHAR(100) UNIQUE,
    DeptID INT,
    FOREIGN KEY (DeptID) REFERENCES Departments(DeptID)
);
```

---

## 7. Anatomy
- **PRIMARY KEY** → one per table, no `NULL`s allowed.  
- **UNIQUE** → multiple allowed per table, `NULL` permitted.  
- **FOREIGN KEY** → references another table’s primary key.  
- **COMPOSITE KEY** → multiple columns combined.

---

## 8. Rules
- Primary Key must be unique and not `NULL`.  
- Foreign Key must match values in parent table.  
- Composite Key ensures uniqueness across multiple columns.  
- Unique Key allows `NULL` but no duplicate values.

---

## 9. Common Variations
- Single column PK vs Composite PK.  
- Foreign Key with `ON DELETE CASCADE`.  
- Unique Key for optional identifiers.

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID | Email |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `alice@company.com` |
| **2** | Bob | 102 | `bob@company.com` |
| **3** | Carol | 101 | `NULL` |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |

---

## 11. Basic Example (Primary Key)
```sql
CREATE TABLE Students (
    RollNo INT PRIMARY KEY,
    Name VARCHAR(50)
);
```

---

## 12. Intermediate Example (Foreign Key)
```sql
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY,
    CustomerID INT,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

---

## 13. Advanced Example (Composite Key)
```sql
CREATE TABLE BusTickets (
    RouteNo INT,
    SeatNo INT,
    PRIMARY KEY (RouteNo, SeatNo)
);
```

---

## 14. Real Analyst Scenarios
- **HR**: EmployeeID as PK.  
- **Finance**: TransactionID PK, CustomerID FK.  
- **Transport**: Composite key for route + seat.  
- **Marketing**: Unique email IDs.  

---

## 15. Expected Output
Constraints enforce rules:
- No duplicate EmployeeID.  
- DeptID must exist in Departments.  
- Route+Seat combination is unique.  
- Email unique if provided.  

---

## 16. Visual Explanation
```text
Primary Key   → Passport / National ID
Foreign Key   → Student roll linked to exam score
Composite Key → Bus ticket (Route + Seat)
Unique Key    → Personal Email ID
```

---

## 17. Behind the Scenes
Database engine creates indexes for keys and enforces rules during insert/update.

---

## 18. Common Mistakes
> [!WARNING]
> - Forgetting Primary Key → leads to duplicate rows.  
> - Wrong Foreign Key reference → broken relationships.  
> - Misusing composite keys.  
> - Assuming `UNIQUE` = `PRIMARY KEY`.  

---

## 19. Interview Questions
- **Beginner**: Difference between Primary Key and Unique Key?  
- **Intermediate**: What is a Composite Key?  
- **Advanced**: Explain `ON DELETE CASCADE` in Foreign Keys.  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can a table have multiple Primary Keys?  
> **A**: No, only one Primary Key clause per table, but it can be a composite key spanning multiple columns.  

---

## 21. Performance Notes
> [!TIP]
> - Primary and Unique keys automatically build underlying B-tree indexes for fast queries.  
> - Foreign Key checks add minor write validation overhead.  

---

## 22. Best Practices
- Always define a Primary Key.  
- Use Foreign Keys for relationships.  
- Use Unique Keys for optional identifiers.  
- Keep composite keys minimal.  

---

## 23. Common Business Use Cases
- HR: EmployeeID PK.  
- Finance: CustomerID FK.  
- Transport: Route+Seat composite.  
- Ecommerce: Unique email.  

---

## 24. Comparison Table
| Key Type | Unique | NULL Allowed | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Key** | Yes | No | Row identity |
| **Foreign Key** | No | Yes | Relationship link |
| **Composite Key** | Yes | No | Multi-column identity |
| **Unique Key** | Yes | Yes | Optional uniqueness |

---

## 25. Memory Tricks
> [!TIP]
> - **PK = Passport** (unique, mandatory).  
> - **FK = Family Link** (connects to parent).  
> - **Composite = Combo Lock** (two parts).  
> - **Unique = Username** (optional but unique).  

---

## 26. Cheat Sheet
```sql
PRIMARY KEY   → Unique, no NULL
FOREIGN KEY   → References parent table
COMPOSITE KEY → Multiple columns combined
UNIQUE        → Unique values, NULL allowed
```

---

## 27. Summary
- Keys enforce uniqueness and relationships.  
- PK, FK, Composite, Unique are core.  
- Analysts must master them for schema design.  

---

## 28. Practice Questions
- **Easy**: Create table with PK.  
- **Medium**: Add FK to Orders.  
- **Hard**: Composite key for BusTickets.  

---

## 29. Interview Practice Queries
- Create Customers table with PK.  
- Create Orders table with FK.  
- Create BusTickets with composite PK.  

---

## 30. Hands-on Exercises
- Add Unique constraint to Email.  
- Add FK to DeptID.  

---

## 31. Mini Project Usage
Design **University Database**:
- Students table (`PK RollNo`).  
- Courses table (`PK CourseID`).  
- Enrollments table (`Composite PK RollNo+CourseID`, FK references both).  

---

## 32. Key Takeaways
- **Primary Key** → Unique identity.  
- **Foreign Key** → Relationship link.  
- **Composite Key** → Combo uniqueness.  
- **Unique Key** → Optional uniqueness.  
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
            "importance": "high" if part_num in [16, 20] else "medium",
            "module": "1.1 TIER 2: DATABASE & TABLE MANAGEMENT",
            "module_id": 2,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Tier 2 (Parts 15 through 20) successfully saved and compiled into static API JSON!")
