# 1.2.1 Aggregate Functions (COUNT, SUM, AVG, MIN, MAX) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aggregate functions in SQL — `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` — collapse multiple rows of data into a single summary value for quick reporting and decision-making.

Aggregate functions answer questions like:
- “How many employees are in total?” (`COUNT`)
- “What is the total company salary payout?” (`SUM`)
- “What is the mean salary?” (`AVG`)
- “Who earns the most or least?” (`MAX` / `MIN`)

---

## 🔑 Core Aggregate Functions

| Function | Purpose | Example | Output Description |
| :--- | :--- | :--- | :--- |
| **COUNT** | Counts rows | `SELECT COUNT(*) FROM Employees;` | Total number of employees |
| **SUM** | Totals numeric column | `SELECT SUM(Salary) FROM Employees;` | Total salary payout |
| **AVG** | Average of numeric column | `SELECT AVG(Salary) FROM Employees;` | Mean salary |
| **MIN** | Smallest value | `SELECT MIN(Salary) FROM Employees;` | Lowest salary |
| **MAX** | Largest value | `SELECT MAX(Salary) FROM Employees;` | Highest salary |

---

## 📊 Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` |
| **2** | Bob | IT | `60000` |
| **3** | Carol | Finance | `70000` |
| **4** | David | IT | `65000` |
| **5** | Emma | HR | `52000` |

---

## 🧩 Basic Examples

### COUNT
```sql
SELECT COUNT(*) AS TotalEmployees FROM Employees;
```
👉 **Returns**: `5`

### SUM
```sql
SELECT SUM(Salary) AS TotalSalary FROM Employees;
```
👉 **Returns**: `297,000`

### AVG
```sql
SELECT AVG(Salary) AS AvgSalary FROM Employees;
```
👉 **Returns**: `59,400`

### MIN / MAX
```sql
SELECT MIN(Salary) AS Lowest, MAX(Salary) AS Highest FROM Employees;
```
👉 **Returns**: Lowest = `50,000`, Highest = `70,000`

---

## 🎯 Real-world Analogies
- **COUNT** → Counting students in a classroom.  
- **SUM** → Adding up items on a grocery bill.  
- **AVG** → Calculating average marks in an exam.  
- **MIN** → Finding the cheapest product in a shop.  
- **MAX** → Identifying the tallest building in a city.  

---

## ⚙️ Advanced Usage

### GROUP BY Integration
```sql
SELECT Department, AVG(Salary) AS AvgDeptSalary
FROM Employees
GROUP BY Department;
```
👉 Returns the average salary per department.

### HAVING Clause Integration
```sql
SELECT Department, SUM(Salary) AS DeptTotal
FROM Employees
GROUP BY Department
HAVING SUM(Salary) > 100000;
```
👉 Filters departments where total salary payout exceeds 100k.

---

## ⚠️ Key Notes
> [!WARNING]
> - `NULL` values are automatically ignored in `SUM`, `AVG`, `MIN`, and `MAX`.  
> - `COUNT(*)` counts all rows including `NULL` values.  
> - `COUNT(column)` counts only non‑`NULL` values.  
> - `COUNT(DISTINCT column)` counts unique non‑`NULL` values.  

---

## ✅ Key Takeaways
- Aggregate functions summarize row data instantly.  
- Combine with `GROUP BY` for category summaries.  
- Use `HAVING` to filter aggregated results.  
- Backbone of all BI reporting and dashboards.  
