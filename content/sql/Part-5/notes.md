# 1.0.5 WHERE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `WHERE` filters table rows before grouping or aggregation, including only rows that meet your specific logical conditions.

## 1. What is it?
`WHERE` is the SQL clause used to filter rows in a query. It decides **which rows** from a table should be included in the result set.

## 2. Definition
The `WHERE` clause specifies a condition that each row must satisfy to be returned by the query.

## 3. Why do we need it?
Without `WHERE`, queries return all rows. Analysts need `WHERE` to:
- Focus on relevant data  
- Apply business rules  
- Answer specific questions  

## 4. Real-world Analogy
Think of **Amazon shopping filters**:  
- You don’t want all products.  
- You filter by price, brand, or rating.  
That’s exactly what `WHERE` does in SQL.

## 5. Mental Model
Visualize a sieve: the table is poured in, and only rows matching the condition pass through.

## 6. Syntax
```sql
SELECT column_name(s)
FROM table_name
WHERE condition;
```

## 7. Anatomy of the Syntax
- **SELECT** → choose columns  
- **FROM** → choose table  
- **WHERE condition** → filter rows based on logic  

## 8. Rules
- Conditions must evaluate to `TRUE` for a row to be included.  
- Multiple conditions can be combined with `AND`, `OR`, `NOT`.  
- `WHERE` works *before* grouping (`GROUP BY`).  

## 9. Common Variations
- `WHERE column = value`  
- `WHERE column > value`  
- `WHERE column BETWEEN value1 AND value2`  
- `WHERE column IN (list)`  
- `WHERE column LIKE pattern`  
- `WHERE column IS NULL`  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name, Salary
FROM Employees
WHERE Department = 'IT';
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Bob | `60000` |
| David | `65000` |

## 12. Intermediate Example
```sql
SELECT Name, City
FROM Employees
WHERE Salary BETWEEN 50000 AND 60000
  AND City = 'New York';
```

**Output:**

| Name | City |
| :--- | :--- |
| Alice | New York |
| Emma | New York |

## 13. Advanced Example
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE (Department = 'IT' AND Salary > 62000)
   OR (Department = 'Finance' AND City = 'Boston');
```

**Output:**

| Name | Department | Salary |
| :--- | :--- | :--- |
| David | IT | `65000` |
| Carol | Finance | `70000` |

## 14. Real Data Analyst Scenarios
- **HR**: Filter active employees with salary > 60k.  
- **Finance**: Transactions between two amounts.  
- **Marketing**: Customers from specific regions.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Table → Apply WHERE filter → Only matching rows pass through → SELECT columns
```

## 17. Behind the Scenes
Database engine scans rows, evaluates condition, keeps only those where condition = `TRUE`.

## 18. Common Mistakes
> [!WARNING]
> - Using `=` instead of `IN` for multiple values.  
> - Forgetting single quotes around text string literals.  
> - Misusing `NULL` (must use `IS NULL`, not `= NULL`).  

## 19. Interview Questions
- **Beginner**: What does `WHERE` do?  
- **Intermediate**: Difference between `WHERE` and `HAVING`?  
- **Advanced**: Explain operator precedence in `WHERE` conditions.  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can `WHERE` filter aggregated results (like `SUM` or `AVG`)?  
> **A**: No, that’s `HAVING`. `WHERE` filters individual rows before aggregation.  

## 21. Performance Notes
> [!TIP]
> - Indexes make `WHERE` clauses run significantly faster.  
> - Avoid wrapping indexed columns in functions in `WHERE` clauses.  

## 22. Best Practices
- Use `IN` for multiple values.  
- Use parentheses for logical clarity.  
- Always handle `NULL` values explicitly.  

## 23. Common Business Use Cases
- HR: Employees in specific departments.  
- Finance: Transactions above threshold.  
- Ecommerce: Customers from target cities.  

## 24. Comparison
- **WHERE vs HAVING**: `WHERE` filters rows; `HAVING` filters aggregated groups.  
- **WHERE vs ON (JOIN)**: `WHERE` filters after joining; `ON` defines the join logic.  

## 25. Memory Tricks
> [!TIP]
> Think of WHERE as **“Which rows?”**

## 26. Cheat Sheet
- `=` → Equals  
- `!=` → Not equal  
- `>` `<` → Greater/less than  
- `BETWEEN` → Range  
- `IN` → List of values  
- `LIKE` → Pattern matching  
- `IS NULL` → Missing values  

## 27. Summary
- `WHERE` filters rows.  
- Evaluated before grouping.  
- Essential for focused data analysis.  

## 28. Practice Questions
- **Easy**: Find employees in HR.  
- **Medium**: Find employees with salary > 55k.  
- **Hard**: Find IT employees in Seattle with salary > 62k.  

## 29. Interview Practice Queries
- Write a query to find employees whose names start with “A” and salary > 50k.  
- Explain the difference between `WHERE` and `HAVING` with examples.  

## 30. Hands-on Exercises
- Filter employees by city.  
- Find employees with salary between 60k and 70k.  

## 31. Mini Project Usage
Design a **Recruitment Filter Tool**:
- Candidates with GPA > 3.5  
- From specific universities (`IN`)  
- Graduated between 2020–2022 (`BETWEEN`)  

## 32. Key Takeaways
- `WHERE` is the core row filter clause.  
- Always use correct comparison operators.  
- `WHERE` executes before aggregation.  
