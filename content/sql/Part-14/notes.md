# 1.0.14 Aliasing (AS) in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aliasing assigns a temporary shorthand name to a column or table using the `AS` keyword.

## 1. What is it?
Aliasing lets you assign a temporary name to a column or table in a query. It’s done using the keyword `AS`.

## 2. Definition
An **alias** is a shorthand name given to a column or table for the duration of a query. It does not change the actual schema.

## 3. Why do we need it?
- Makes queries easier to read.  
- Simplifies long expressions.  
- Helps when using aggregates (`SUM`, `AVG`, etc.).  
- Useful in reporting and dashboards.  

## 4. Real-world Analogy
Think of nicknames:  
- “Alexander” → “Alex”  
- “International Business Machines” → “IBM”  
Aliases are SQL nicknames for columns/tables.

## 5. Mental Model
Visualize a report column header. Aliasing lets you rename it to something meaningful for the audience.

## 6. Syntax
```sql
SELECT column_name AS alias_name
FROM table_name AS alias_name;
```

## 7. Anatomy of the Syntax
- **AS** → keyword for aliasing  
- **alias_name** → temporary name  

## 8. Rules
- Aliases exist only during query execution.  
- Column aliases cannot be used in `WHERE`.  
- Aliases can be used in `ORDER BY` and `HAVING` (in supported SQL dialects).  
- Table aliases are mandatory in complex joins.  

## 9. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 10. Aliasing in GROUP BY
```sql
SELECT Department AS Dept, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Dept;
```

**Output:**

| Dept | AvgSalary |
| :--- | :--- |
| HR | `51000` |
| IT | `62500` |
| Finance | `70000` |

👉 Here, `Department` is aliased as `Dept`. The `GROUP BY` uses the alias.

## 11. Aliasing in HAVING
```sql
SELECT Department AS Dept, SUM(Salary) AS TotalSalary
FROM Employees
GROUP BY Dept
HAVING TotalSalary > 100000;
```

**Output:**

| Dept | TotalSalary |
| :--- | :--- |
| HR | `102000` |
| IT | `125000` |

👉 The aggregate `SUM(Salary)` is aliased as `TotalSalary`, and `HAVING` uses that alias.

## 12. Aliasing in ORDER BY
```sql
SELECT Name, Salary AS Pay
FROM Employees
ORDER BY Pay DESC;
```

**Output:**

| Name | Pay |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |
| Bob | `60000` |
| Emma | `52000` |
| Alice | `50000` |

👉 The alias `Pay` is used in `ORDER BY` instead of repeating `Salary`.

## 13. Real Data Analyst Scenarios
- **HR dashboards**: Alias `AVG(Salary)` as `Avg_Salary`.  
- **Finance reports**: Alias `SUM(Revenue)` as `Total_Revenue`.  
- **Marketing**: Alias `COUNT(CustomerID)` as `Customer_Count`.  

## 14. Common Mistakes
> [!WARNING]
> - Trying to use a column alias in `WHERE` (not allowed because `WHERE` runs before `SELECT`).  
> - Forgetting to alias aggregates, making outputs unclear.  

## 15. Interview Questions
- **Beginner**: What does `AS` do in SQL?  
- **Intermediate**: Can you use aliases in `WHERE`? Why not?  
- **Advanced**: Show how aliases simplify `GROUP BY` and `HAVING` queries.  

## 16. Best Practices
- Always alias aggregates.  
- Use meaningful names (`AvgSalary`, not `a`).  
- Use table aliases in joins for clarity.  

## 17. Comparison
- **Alias vs Rename (DDL)**: Alias is temporary; Rename changes schema.  
- **Alias vs Expression**: Alias names the result of an expression.  

## 18. Memory Trick
> [!TIP]
> Think of `AS` as **“Assign Shortname.”**

## 19. Cheat Sheet
- `SELECT col AS alias` → Rename column  
- `FROM table AS alias` → Rename table  
- Aliases usable in `GROUP BY`, `HAVING`, `ORDER BY`  

## 20. Summary
- Aliasing makes queries readable.  
- Essential for `GROUP BY`, `HAVING`, `ORDER BY`.  
- Cannot be used in `WHERE`.  

## 21. Practice Questions
- **Easy**: Alias `Salary` as `Pay`.  
- **Medium**: Alias `AVG(Salary)` as `AvgPay` in `GROUP BY`.  
- **Hard**: Alias `SUM(Salary)` as `TotalPay` and filter with `HAVING`.  

## 22. Mini Project Usage
Build a **Salary Report**:
- Alias `Department` as `Dept`.  
- Alias `AVG(Salary)` as `AvgSalary`.  
- Alias `SUM(Salary)` as `TotalSalary`.  
- Sort by `TotalSalary` using alias.  

## 23. Key Takeaways
- Aliases = temporary nicknames.  
- Use them in `GROUP BY`, `HAVING`, `ORDER BY`.  
- Not valid in `WHERE`.  
- Essential for analyst readability.  
