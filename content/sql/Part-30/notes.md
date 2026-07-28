# 1.3.1 Scalar Subqueries (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: A scalar subquery returns exactly one single value (one row, one column). That single value acts like a literal constant in the outer query's `SELECT`, `WHERE`, or `HAVING` clause.

## 1. What are they?
A scalar subquery is a subquery that returns exactly one value (one row, one column). That value can be used like a constant in the outer query.

## 2. Why do we need them?
- To dynamically calculate values instead of hardcoding static constants.  
- To compare each row against a computed metric (like average or total).  
- To enrich queries with single-value context from other tables.  

## 3. Real-world Analogy
Imagine asking:
> **“What’s my score compared to the class average?”**  

The class average is a scalar subquery — one single number calculated from all students and dropped into your comparison.

## 4. Syntax
```sql
SELECT column1,
       (SELECT AVG(Salary) FROM Employees) AS AvgSalary
FROM Employees;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |
| **3** | Carol | Finance | `70000` |

## 6. Basic Example
```sql
SELECT Name, Salary,
       (SELECT AVG(Salary) FROM Employees) AS CompanyAvg
FROM Employees;
```
👉 Each output row shows individual employee salary alongside the company-wide average.

## 7. In WHERE Clause
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary > (SELECT AVG(Salary) FROM Employees);
```
👉 Finds employees earning strictly above average.

## 8. In HAVING Clause
```sql
SELECT Department, AVG(Salary) AS DeptAvg
FROM Employees
GROUP BY Department
HAVING AVG(Salary) > (SELECT AVG(Salary) FROM Employees);
```
👉 Keeps only departments whose average salary exceeds the overall company average.

## 9. In SELECT with Another Table
```sql
SELECT Name,
       (SELECT DeptName FROM Departments d WHERE d.DeptID = e.DeptID) AS DepartmentName
FROM Employees e;
```
👉 Pulls department name via scalar subquery lookup.

## 10. Real Analyst Scenarios
- **HR**: Compare individual employee salary vs company average.  
- **Finance**: Compare transaction amount vs overall monthly mean spend.  
- **Marketing**: Compare campaign spend vs global average spend.  

## 11. Expected Output
Scalar subqueries return one value per query execution.

> [!WARNING]
> If a scalar subquery returns more than one row or column, the database engine will throw a runtime execution error: `Subquery returned more than 1 row`.

## 12. Visual Explanation
```text
Outer Query  → Processes rows
Scalar Subquery → Computes single value
Combine      → Compare row against single value
```

## 13. Common Mistakes
- Subquery returns multiple rows → runtime crash.  
- Forgetting table aliases in correlated context.  
- Overusing scalar subqueries in `SELECT` lists instead of `JOIN`s (causes severe performance lag).  

## 14. Interview Questions
- **Beginner**: What is a scalar subquery?  
- **Intermediate**: Difference between scalar subquery and `JOIN`?  
- **Advanced**: How do correlated scalar subqueries execute under the hood?  

## 15. Best Practices
- Ensure subquery strictly returns one value using aggregates (`AVG`, `MAX`, `MIN`) or `LIMIT 1`.  
- Use joins if multiple values are needed.  
- Alias subquery results clearly.  

## 16. Comparison Table
| Type | Returns | Primary Use Case |
| :--- | :--- | :--- |
| **Scalar Subquery** | One value | Compare against single aggregate metric |
| **Table Subquery** | Multiple rows | Derived tables, inline views |
| **Correlated Subquery** | Depends on outer row | Row‑by‑row dynamic comparison |

## 17. Memory Trick
> [!TIP]
> **Scalar = Single**.  
> Think of a scalar subquery as a single number dropped directly into your query.

## 18. Cheat Sheet
```sql
-- In SELECT
SELECT Name, (SELECT AVG(Salary) FROM Employees) AS AvgSalary;

-- In WHERE
WHERE Salary > (SELECT AVG(Salary) FROM Employees);
```

## 19. Summary
Scalar subqueries are mini queries that return one value. They’re perfect for comparisons, enrichment, and dynamic calculations.  
