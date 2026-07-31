# 1.0.1 SQL Syntax Overview (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: SQL (Structured Query Language) is the standard language for requesting, filtering, aggregating, and manipulating data stored in relational database management systems (RDBMS).

## 1. What is it?
SQL syntax is the set of rules, keywords, and structural guidelines used to write valid database queries.

## 2. Definition
SQL (Structured Query Language) syntax defines how database commands — such as `SELECT`, `FROM`, `WHERE`, `GROUP BY`, and `ORDER BY` — must be written and sequenced for execution.

## 3. Why do we need it?
Databases require structured instructions to understand what data to retrieve. Clean SQL syntax ensures:
- Accurate data retrieval.  
- High query performance.  
- Code readability and maintainability across data teams.  

## 4. Real-world Analogy
Think of ordering at a **restaurant**:
- **Menu** = Database tables.  
- **Order Slip** = SQL Query.  
- **Syntax Rules** = Placing your order clearly so the kitchen staff understands exactly what dishes to bring you.  

## 5. Mental Model
Visualize SQL as a **blueprint pipeline**:
```text
FROM (Source) → WHERE (Filter) → GROUP BY (Bucket) → HAVING (Group Filter) → SELECT (Pick Columns) → ORDER BY (Sort)
```

---

## 6. Basic Syntax
```sql
SELECT column1, column2
FROM table_name
WHERE condition;
```

---

## 7. Anatomy of the Statement
- **SELECT**: Specifies the columns or calculated expressions to display.  
- **FROM**: Specifies the table or view containing the source data.  
- **WHERE**: Filters individual rows before grouping or aggregation.  

---

## 8. General Syntax Rules
- **Case Insensitivity**: SQL keywords (`SELECT`, `FROM`) are case-insensitive, but writing keywords in **UPPERCASE** is industry best practice.  
- **Semicolon `;`**: Used to terminate SQL statements in multi-query scripts.  
- **Strings**: String literals must be enclosed in single quotes `'New York'`.  
- **Comments**:
  - `-- Single line comment`
  - `/* Multi-line comment */`

---

## 9. Major SQL Sublanguages (Commands Overview)

| Sublanguage | Full Name | Purpose | Key Commands |
| :--- | :--- | :--- | :--- |
| **DQL** | Data Query Language | Retrieve data | `SELECT` |
| **DDL** | Data Definition Language | Manage database schemas | `CREATE`, `ALTER`, `DROP`, `TRUNCATE` |
| **DML** | Data Manipulation Language | Modify data records | `INSERT`, `UPDATE`, `DELETE` |
| **DCL** | Data Control Language | Manage permissions | `GRANT`, `REVOKE` |
| **TCL** | Transaction Control Language | Manage transactions | `COMMIT`, `ROLLBACK`, `SAVEPOINT` |

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |

---

## 11. Basic Query Example
```sql
SELECT Name, Department
FROM Employees;
```

---

## 12. Intermediate Query Example
```sql
SELECT Name, Salary
FROM Employees
WHERE Department = 'IT' AND Salary >= 60000;
```

---

## 13. Advanced Query Example
```sql
SELECT Department, COUNT(*) AS TotalEmployees, AVG(Salary) AS AvgSalary
FROM Employees
WHERE City IN ('New York', 'Chicago', 'Boston')
GROUP BY Department
HAVING AVG(Salary) > 55000
ORDER BY AvgSalary DESC;
```

---

## 14. Real Data Analyst Scenarios
- **HR**: Query active employee headcounts.  
- **Finance**: Retrieve quarterly financial transaction logs.  
- **Marketing**: Pull campaign performance metrics.  
- **Ecommerce**: Filter daily order revenues.  

---

## 15. Common Mistakes
> [!WARNING]
> - Misspelling keywords (e.g. `SELEC` or `FORM`).  
> - Forgetting single quotes around text values (`WHERE City = New York` ❌).  
> - Using commas between `WHERE` clauses instead of `AND`/`OR`.  

---

## 16. Best Practices
- Always write SQL keywords in **UPPERCASE**.  
- Use indentation and newlines to format queries clearly.  
- Use meaningful table aliases (`e` for Employees, `d` for Departments).  

---

## 17. Memory Trick
> [!TIP]
> Think of SQL Syntax as **“Filter, Choose, Arrange.”**  
> 1. Where do I get it? (`FROM`)  
> 2. How do I filter it? (`WHERE`)  
> 3. What do I want to see? (`SELECT`)  
> 4. How do I want it ordered? (`ORDER BY`)  

---

## 18. Key Takeaways
- SQL is declarative: you state *what* data you want, not *how* to fetch it.  
- Proper formatting makes queries easy to read, debug, and maintain.  
- Mastering syntax rules is the first step toward advanced database analytics.  
