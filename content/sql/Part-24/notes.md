# 1.2.4 CASE Statement (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: The `CASE` statement adds conditional logic (`IF-THEN-ELSE`) directly inside SQL queries to transform, categorize, or calculate values.

## 🔑 Two Types of CASE

| Type | Syntax | Best For | Example |
| :--- | :--- | :--- | :--- |
| **Simple CASE** | `CASE expr WHEN val1 THEN res1 ELSE res END` | Comparing one column to fixed values | Classify status codes |
| **Searched CASE** | `CASE WHEN cond1 THEN res1 ELSE res END` | Complex conditions, ranges, multiple columns | Risk levels, salary bands |

---

## 📊 Examples

### 1. Simple CASE
```sql
SELECT EmployeeID, Name,
       CASE Department
            WHEN 'HR' THEN 'Human Resources'
            WHEN 'IT' THEN 'Technology'
            ELSE 'Other'
       END AS DeptFullName
FROM Employees;
```
👉 Maps department codes to readable names.

### 2. Searched CASE
```sql
SELECT Name, Salary,
       CASE
            WHEN Salary > 65000 THEN 'High Earner'
            WHEN Salary BETWEEN 50000 AND 65000 THEN 'Mid Earner'
            ELSE 'Low Earner'
       END AS SalaryBand
FROM Employees;
```
👉 Categorizes employees into salary bands.

### 3. CASE in ORDER BY
```sql
SELECT CustomerName, Country
FROM Customers
ORDER BY CASE WHEN Country = 'India' THEN 0 ELSE 1 END, Country;
```
👉 Prioritizes Indian customers first, then sorts others alphabetically.

### 4. CASE with Aggregates
```sql
SELECT Department,
       SUM(CASE WHEN Salary > 60000 THEN 1 ELSE 0 END) AS HighEarners
FROM Employees
GROUP BY Department;
```
👉 Counts how many employees earn above 60k per department.

---

## 🎯 Real-world Analogies
- **Simple CASE** → Like a menu board: if you order “Tea,” you get “Hot Beverage.”  
- **Searched CASE** → Like a traffic signal: if speed > 80 → “Overspeeding,” if 40–80 → “Normal,” else → “Slow.”  

---

## ⚠️ Key Notes
> [!WARNING]
> - `CASE` evaluates top-to-bottom and stops at the **first** matching condition.  
> - Always include an `ELSE` clause to handle unmatched cases (otherwise returns `NULL`).  
> - Works seamlessly inside `SELECT`, `WHERE`, `ORDER BY`, `UPDATE`, and aggregate functions.  

---

## ✅ Key Takeaways
- `CASE` = conditional decision-maker in SQL.  
- Simple CASE compares one value; Searched CASE checks complex expressions.  
- Essential for data transformation and custom reporting.  
