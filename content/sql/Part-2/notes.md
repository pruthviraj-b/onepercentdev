# 1.0.2 Data types — SQL Data Types (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Data types define the exact storage format, valid operations, and constraints for every column in a relational database.

## 1. What is it?
Data types define the kind of values a column can hold — numbers, text, dates, etc. They tell the database how to store, process, and validate data.

## 2. Definition
A **data type** in SQL specifies the type of data (integer, decimal, string, date, boolean, etc.) that can be stored in a column or variable.

## 3. Why do we need it?
Without data types, databases wouldn’t know:
- How much storage to allocate  
- How to compare values  
- Which operations are valid (e.g., adding numbers vs. concatenating strings)

## 4. Real-world Analogy
Think of a school register:
- **Roll number** → must be a number  
- **Name** → must be text  
- **Date of birth** → must be a date  

> [!NOTE]
> If you try to put “Alice” in the roll number field, it doesn’t make sense. Data types enforce these rules automatically.

## 5. Mental Model
Visualize each column as a **container**. The container’s shape (data type) decides what fits inside:
- **Square box** → integers  
- **Long box** → text  
- **Calendar box** → dates  

## 6. Syntax
When creating a table:

```sql
CREATE TABLE Employees (
    EmployeeID INT,
    Name VARCHAR(50),
    Salary NUMERIC(10,2),
    HireDate DATE,
    IsActive BOOLEAN
);
```

## 7. Anatomy of the Syntax
- **INT** → whole numbers  
- **VARCHAR(50)** → variable-length text up to 50 characters  
- **NUMERIC(10,2)** → fixed precision decimal (10 digits total, 2 after decimal point)  
- **DATE** → calendar date  
- **BOOLEAN** → true/false flag  

## 8. Rules
- Must choose a valid type supported by the target SQL dialect.  
- Size/precision must be specified for text and decimals.  
- Wrong type assignment causes database execution errors.  

## 9. Common Variations
- **CHAR(n)** vs **VARCHAR(n)** → fixed vs variable length text  
- **FLOAT** vs **NUMERIC** → approximate vs exact decimals  
- **TEXT** → unlimited length strings  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Salary | HireDate | IsActive |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | `50000.00` | `2020-01-15` | `TRUE` |
| **2** | Bob | `60000.50` | `2019-03-10` | `FALSE` |
| **3** | Carol | `70000.75` | `2021-07-01` | `TRUE` |

## 11. Basic Example
```sql
SELECT Name, HireDate
FROM Employees
WHERE IsActive = TRUE;
```

**Output:**

| Name | HireDate |
| :--- | :--- |
| Alice | `2020-01-15` |
| Carol | `2021-07-01` |

## 12. Intermediate Example
```sql
SELECT Name, Salary::INT AS RoundedSalary
FROM Employees;
```

**Output:**

| Name | RoundedSalary |
| :--- | :--- |
| Alice | `50000` |
| Bob | `60000` |
| Carol | `70000` |

## 13. Advanced Example
```sql
SELECT DATE_PART('year', HireDate) AS HireYear, COUNT(*) AS Hires
FROM Employees
GROUP BY HireYear;
```

**Output:**

| HireYear | Hires |
| :--- | :--- |
| **2019** | 1 |
| **2020** | 1 |
| **2021** | 1 |

## 14. Real Data Analyst Scenarios
- **Finance**: Salaries stored as `NUMERIC` for exact precision & zero rounding error.  
- **HR**: Hire dates stored as `DATE` for tenure and retention analysis.  
- **BI Dashboards**: `BOOLEAN` flags for active/inactive employee status.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Column   → Data Type → Allowed Values
---------------------------------------
Name     → VARCHAR   → Text strings
Salary   → NUMERIC   → Exact numbers with decimals
HireDate → DATE      → Calendar dates (YYYY-MM-DD)
```

## 17. Behind the Scenes
The database engine allocates memory differently based on data type:
- **INT** → 4 bytes  
- **VARCHAR** → depends on exact text character length  
- **DATE** → stored as numeric offset from a base date  

## 18. Common Mistakes
> [!WARNING]
> - Using `FLOAT` for financial currency values (causes floating-point rounding errors!).  
> - Forgetting `VARCHAR` length specification.  
> - Storing calendar dates as plain text (makes date querying and math very difficult).  

## 19. Interview Questions
- **Beginner**: What is the difference between `CHAR` and `VARCHAR`?  
- **Intermediate**: Why should you use `NUMERIC` instead of `FLOAT` for employee salaries?  
- **Advanced**: How does PostgreSQL store `DATE` values internally?  

## 20. Interview Traps
- **Q**: Can you store numbers inside a `VARCHAR` column?  
- **A**: Yes, but you lose numeric operations like mathematical sorting, summing, and statistical aggregations.  

## 21. Performance Notes
> [!TIP]
> - Smaller, tighter data types result in faster query execution and reduced memory footprint.  
> - `NUMERIC` is 100% precise but slightly slower than hardware `FLOAT`.  
> - Indexing works best with consistent, fixed-width types.  

## 22. Best Practices
- Use `NUMERIC` for money/currency.  
- Use `DATE` / `TIMESTAMP` for time-series data.  
- Avoid `TEXT` for structured, fixed-size fields.  

## 23. Common Business Use Cases
- **HR**: Employee status (`BOOLEAN`).  
- **Finance**: Salaries & Transactions (`NUMERIC`).  
- **Marketing**: Campaign start/end dates (`DATE`).  

## 24. Comparison Table
| Data Type | Primary Use Case | Key Characteristics |
| :--- | :--- | :--- |
| **CHAR** | Fixed-length text | Pads short text with spaces |
| **VARCHAR** | Variable-length text | Saves storage space |
| **NUMERIC** | Money & Currency | Exact mathematical precision |
| **FLOAT** | Scientific data | Fast approximate decimal |
| **DATE** | Calendar dates | Date only (no time component) |
| **TIMESTAMP** | Date + exact time | High precision date and time |

## 25. Memory Tricks
> [!TIP]
> **“NUMERIC for money, DATE for day, VARCHAR for variable text.”**

## 26. Cheat Sheet
- `INT` → Whole numbers  
- `NUMERIC(p,s)` → Exact decimals (p = total precision, s = scale)  
- `VARCHAR(n)` → Text up to `n` characters  
- `DATE` → Calendar date  
- `BOOLEAN` → True / False  

## 27. Summary
- Data types define storage formats, constraints, and valid operations.  
- Choosing the right type prevents calculation errors and speeds up queries.  
- Data Analysts must understand types to write accurate, high-performance queries.  

## 28. Practice Questions
- **Easy**: Create a table with `INT` and `VARCHAR` columns.  
- **Medium**: Store employee salaries with 2 decimal precision.  
- **Hard**: Write a query to extract the year from a `TIMESTAMP` column.  

## 29. Interview Practice Queries
- Create a table for transactions with `ID`, `amount`, `date`, and `status`.  
- Explain why `FLOAT` is bad for storing currency amounts.  

## 30. Hands-on Exercises
- Create a table for products with `name`, `price`, and `launch_date`.  
- Insert 5 sample rows and query them.  

## 31. Mini Project Usage
Design a **Sales Transactions Table**:
- `TransactionID` (`INT`)  
- `CustomerName` (`VARCHAR`)  
- `Amount` (`NUMERIC`)  
- `TransactionDate` (`DATE`)  
- `IsRefunded` (`BOOLEAN`)  

## 32. Key Takeaways
- Data types are the absolute foundation of relational SQL databases.  
- Always choose column data types intentionally.  
- The wrong data type = wrong financial & data analysis.  
