# 1.1.2 CREATE TABLE (Data Analyst Edition)

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
