# 1.0.11 DISTINCT (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `DISTINCT` eliminates duplicate rows from your query output, returning only unique values across selected columns.

## 1. What is it?
`DISTINCT` is a keyword in SQL used to return only **unique values** from a column or set of columns. It eliminates duplicates from the result set.

## 2. Definition
The `DISTINCT` clause ensures that each row in the output is unique based on the selected columns.

## 3. Why do we need it?
Analysts often deal with messy data containing duplicates. `DISTINCT` helps:
- Identify unique categories (e.g., cities, departments).  
- Clean up reports.  
- Avoid double counting.  

## 4. Real-world Analogy
Imagine a **cricket scoreboard** listing every ball bowled. If you only want the **unique players who bowled**, you’d remove duplicates. That’s what `DISTINCT` does.

## 5. Mental Model
Think of `DISTINCT` as a **deduplication filter**: it scans results and removes repeated rows.

## 6. Syntax
```sql
SELECT DISTINCT column_name(s)
FROM table_name;
```

## 7. Anatomy of the Syntax
- **SELECT** → choose columns  
- **DISTINCT** → remove duplicates  
- **FROM** → specify table  

## 8. Rules
- Applies to all selected columns.  
- If multiple columns are listed, `DISTINCT` considers the combination.  
- Cannot be used with `*` and expect uniqueness across all columns.  

## 9. Common Variations
- `SELECT DISTINCT column` → unique values in one column  
- `SELECT DISTINCT col1, col2` → unique combinations of two columns  

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
SELECT DISTINCT Department
FROM Employees;
```

**Output:**

| Department |
| :--- |
| HR |
| IT |
| Finance |

## 12. Intermediate Example
```sql
SELECT DISTINCT City
FROM Employees;
```

**Output:**

| City |
| :--- |
| New York |
| Chicago |
| Boston |
| Seattle |

## 13. Advanced Example
```sql
SELECT DISTINCT Department, City
FROM Employees;
```

**Output:**

| Department | City |
| :--- | :--- |
| HR | New York |
| IT | Chicago |
| Finance | Boston |
| IT | Seattle |

## 14. Real Data Analyst Scenarios
- **HR**: List unique departments.  
- **Finance**: Find distinct transaction types.  
- **Marketing**: Identify unique customer regions.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Raw Data → DISTINCT → Deduplicated Unique Result Set
```

## 17. Behind the Scenes
Database engine scans selected columns, builds a set of unique combinations, and outputs them.

## 18. Common Mistakes
> [!WARNING]
> - Expecting `DISTINCT` to remove duplicates across entire table when only one column is selected.  
> - Using `DISTINCT` with `*` (rarely useful).  

## 19. Interview Questions
- **Beginner**: What does `DISTINCT` do?  
- **Intermediate**: Difference between `DISTINCT` and `GROUP BY`?  
- **Advanced**: How does `DISTINCT` work with multiple columns?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `DISTINCT` remove duplicates across all columns in the table?  
> **A**: No, only across the specific columns listed in the `SELECT` clause.  

## 21. Performance Notes
> [!TIP]
> - `DISTINCT` can be expensive on massive datasets because it requires sorting/hashing.  
> - Indexes help speed up `DISTINCT` queries.  

## 22. Best Practices
- Use `DISTINCT` only when necessary.  
- Prefer `GROUP BY` when aggregations are needed.  

## 23. Common Business Use Cases
- HR: Unique job titles.  
- Finance: Distinct payment methods.  
- Ecommerce: Distinct customer cities.  

## 24. Comparison
- **DISTINCT vs GROUP BY**: `DISTINCT` removes duplicates; `GROUP BY` aggregates.  
- **DISTINCT vs UNIQUE (constraint)**: `DISTINCT` is query-level; `UNIQUE` is schema-level.  

## 25. Memory Tricks
> [!TIP]
> Think of DISTINCT as **“Don’t Include Same Twice.”**

## 26. Cheat Sheet
- `SELECT DISTINCT col` → Unique values  
- `SELECT DISTINCT col1, col2` → Unique pairs  

## 27. Summary
- `DISTINCT` removes duplicates.  
- Works on selected columns.  
- Useful for clean reporting.  

## 28. Practice Questions
- **Easy**: Find distinct departments.  
- **Medium**: Find distinct cities.  
- **Hard**: Find distinct department-city pairs.  

## 29. Interview Practice Queries
- Write query to find distinct job titles.  
- Explain difference between `DISTINCT` and `GROUP BY` with examples.  

## 30. Hands-on Exercises
- List distinct cities from Employees.  
- Find distinct salary ranges.  

## 31. Mini Project Usage
Build a **Customer Region Report** showing distinct regions customers belong to.

## 32. Key Takeaways
- `DISTINCT` removes duplicates.  
- Applies to selected columns.  
- Use carefully for performance.  
