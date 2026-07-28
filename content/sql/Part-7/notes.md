# 1.0.7 Logical Operators (AND, OR, NOT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Logical operators combine multiple Boolean expressions in a `WHERE` clause. `AND` requires all conditions to be true, `OR` requires at least one, and `NOT` negates a condition.

## 1. What is it?
Logical operators in SQL (`AND`, `OR`, `NOT`) allow you to connect multiple filtering conditions together to form complex, precise query criteria.

## 2. Definition
Logical operators evaluate combinations of Boolean conditions and return `TRUE` or `FALSE`, determining which rows are included in query results.

## 3. Why do we need them?
- Filter data using multiple criteria simultaneously.
- Build complex, business-logic-driven queries.
- Eliminate noise by narrowing or broadening row selection.

## 4. Real-world Analogy
- **AND** → A job posting that requires *both* a degree **and** 3 years of experience.
- **OR** → A bank alert triggered if balance drops below ₹1,000 **or** if location is unusual.
- **NOT** → A filter showing all cities **except** Mumbai.

## 5. Truth Tables

| Condition A | Condition B | A AND B | A OR B |
| :--- | :--- | :--- | :--- |
| `TRUE` | `TRUE` | **TRUE** | **TRUE** |
| `TRUE` | `FALSE` | **FALSE** | **TRUE** |
| `FALSE` | `TRUE` | **FALSE** | **TRUE** |
| `FALSE` | `FALSE` | **FALSE** | **FALSE** |

---

## 6. Operator Precedence
SQL evaluates logical operators in this strict order:
1. `NOT` (highest priority)
2. `AND`
3. `OR` (lowest priority)

> [!TIP]
> Always use parentheses `()` to explicitly define execution order and prevent unexpected filtering bugs!

---

## 7. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Chicago |
| **5** | Emma | HR | `52000` | New York |

---

## 8. AND Example
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE Department = 'IT'
  AND Salary >= 60000;
```
👉 Returns employees who are BOTH in IT AND earn 60k or more: Bob, David.

---

## 9. OR Example
```sql
SELECT Name, Department
FROM Employees
WHERE Department = 'HR'
   OR Department = 'Finance';
```
👉 Returns employees in HR OR Finance: Alice, Carol, Emma.

---

## 10. NOT Example
```sql
SELECT Name, City
FROM Employees
WHERE NOT City = 'Chicago';
```
👉 Returns all employees NOT in Chicago: Alice, Carol, Emma.

---

## 11. Combining AND + OR (with Parentheses)
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE (Department = 'IT' OR Department = 'HR')
  AND Salary >= 52000;
```
👉 Returns IT or HR employees earning at least 52k. Parentheses ensure `OR` is evaluated first.

> [!WARNING]
> **Without parentheses**, `AND` binds tighter than `OR`:
> ```sql
> WHERE Department = 'IT' OR Department = 'HR' AND Salary >= 52000
> ```
> This would be interpreted as: `IT` OR (`HR` AND Salary >= 52000) — a different result!

---

## 12. NOT with Other Operators
```sql
-- NOT IN
SELECT Name FROM Employees WHERE Department NOT IN ('HR', 'Finance');

-- NOT BETWEEN
SELECT Name FROM Employees WHERE Salary NOT BETWEEN 50000 AND 60000;

-- NOT LIKE
SELECT Name FROM Employees WHERE Name NOT LIKE 'A%';
```

---

## 13. Real Data Analyst Scenarios
- **Marketing**: Filter customers who opted in AND are from target cities.
- **Finance**: Flag transactions NOT matching standard patterns.
- **HR**: Pull employees in IT OR Finance with salary above threshold.

---

## 14. Common Mistakes
> [!WARNING]
> - Forgetting parentheses when mixing `AND` and `OR`.
> - Using `NOT NULL` instead of `IS NOT NULL`.
> - Over-filtering with too many `AND` conditions returning zero rows.

---

## 15. Key Takeaways
- **AND** → narrows results (more restrictive).
- **OR** → broadens results (more permissive).
- **NOT** → excludes matching rows.
- Always use parentheses `()` when combining `AND` and `OR` to control precedence.
