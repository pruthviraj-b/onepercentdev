# 1.0.6 Comparison Operators (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Comparison operators evaluate left and right operands and return Boolean results (`TRUE`, `FALSE`, or `UNKNOWN`).

## 🔑 Core SQL Comparison Operators

| Operator | Meaning | Example | Result |
| :--- | :--- | :--- | :--- |
| `=` | Equal to | `Salary = 60000` | TRUE if salary is 60000 |
| `!=` / `<>` | Not equal to | `City <> 'Boston'` | TRUE if city is not Boston |
| `>` | Greater than | `Salary > 50000` | TRUE if salary above 50k |
| `<` | Less than | `Salary < 50000` | TRUE if salary below 50k |
| `>=` | Greater than or equal | `Salary >= 60000` | TRUE if salary ≥ 60k |
| `<=` | Less than or equal | `Salary <= 50000` | TRUE if salary ≤ 50k |
| `BETWEEN` | Within range (inclusive) | `Salary BETWEEN 50000 AND 70000` | TRUE if salary is 50k–70k |
| `IN` | Matches any in list | `City IN ('NY','LA')` | TRUE if city is NY or LA |
| `LIKE` | Pattern match | `Name LIKE 'A%'` | TRUE if name starts with A |
| `IS NULL` | Checks for NULL | `HireDate IS NULL` | TRUE if no hire date |
| `NOT` | Negates condition | `NOT (Salary > 60000)` | TRUE if salary ≤ 60k |

## 📊 Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 🧩 Basic Examples
```sql
-- Equal to
SELECT Name FROM Employees WHERE Salary = 60000;
```
**Output:** Bob  

```sql
-- Greater than
SELECT Name FROM Employees WHERE Salary > 60000;
```
**Output:** Carol, David  

## ⚙️ Intermediate Examples
```sql
-- Range filter
SELECT Name, Salary FROM Employees
WHERE Salary BETWEEN 50000 AND 60000;
```
**Output:** Alice, Bob, Emma  

```sql
-- Membership filter
SELECT Name, City FROM Employees
WHERE City IN ('New York','Boston');
```
**Output:** Alice, Emma, Carol  

## 🚀 Advanced Example
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE (Department = 'IT' AND Salary > 62000)
   OR (Department = 'Finance' AND City = 'Boston');
```
**Output:** David, Carol  

## 📌 Analyst Scenarios
- **HR**: Filter employees with salary > 60k.  
- **Finance**: Transactions between 10k–50k.  
- **Marketing**: Customers in target cities (`IN`).  
- **Product**: Pattern match on SKU codes (`LIKE`).  

## ⚠️ Common Mistakes
> [!WARNING]
> - Forgetting single quotes around text string literals (`City = Boston` ❌ → `City = 'Boston'` ✅).  
> - Misusing `NULL` (must use `IS NULL`, not `= NULL`).  
> - Ignoring operator precedence (always use parentheses for clarity).  

## 🎯 Interview Prep
- **Beginner**: Difference between `=` and `IN`.  
- **Intermediate**: Is `BETWEEN` inclusive? (Yes, includes boundaries).  
- **Advanced**: Explain operator precedence in complex WHERE clauses.  

## ✅ Key Takeaways
- Comparison operators return Boolean results.  
- They are the backbone of filtering in SQL.  
- Always handle NULLs carefully.  
- Use parentheses to avoid logical errors.  
