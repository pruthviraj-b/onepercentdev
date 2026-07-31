# 1.2.5 NULL Handling (IS NULL, IS NOT NULL, COALESCE, NULLIF) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `NULL` represents missing or unknown data in SQL. Standard equality operators (`=`, `!=`) do not work with `NULL`; you must use specialized NULL functions.

## 1. What is NULL?
`NULL` represents missing, unknown, or undefined data in SQL. It is not zero, not an empty string `""`, not false — it’s “no value.”

## 2. Why do we need to handle NULL?
Analysts must deal with incomplete data:
- Missing salaries.  
- Unknown customer emails.  
- Optional fields left blank.  

## 3. Real-world Analogy
- **NULL** = unanswered question on a form.  
- **IS NULL** = “Did they leave it blank?”  
- **COALESCE** = “If blank, fill with default fallback.”  
- **NULLIF** = “If two answers are the same, treat as blank.”  

## 4. Core Syntax
### IS NULL / IS NOT NULL
```sql
SELECT Name
FROM Employees
WHERE Email IS NULL;
```

### COALESCE
```sql
SELECT Name, COALESCE(Email, 'No Email') AS ContactEmail
FROM Employees;
```

### NULLIF
```sql
SELECT NULLIF(Discount, 0) AS EffectiveDiscount
FROM Orders;
```

## 5. Example Dataset
**Employees Table**

| EmployeeID | Name | Email | Salary |
| :--- | :--- | :--- | :--- |
| **1** | Alice | `alice@company.com` | `50000` |
| **2** | Bob | `NULL` | `60000` |
| **3** | Carol | `carol@company.com` | `NULL` |

## 6. IS NULL / IS NOT NULL Example
```sql
SELECT Name
FROM Employees
WHERE Email IS NULL;
```
👉 Finds employees without email (Bob).

## 7. COALESCE Example
```sql
SELECT Name, COALESCE(Salary, 0) AS SafeSalary
FROM Employees;
```
👉 Replaces `NULL` salary with 0.

**Output:**
- Alice → `50000`
- Bob → `60000`
- Carol → `0`

## 8. NULLIF Example
```sql
SELECT Name, NULLIF(Salary, 0) AS AdjustedSalary
FROM Employees;
```
👉 If `Salary = 0`, returns `NULL`. Prevents division by zero errors.

## 9. Daily Life Examples
- **IS NULL** → “Who didn’t write their phone number?”  
- **IS NOT NULL** → “Who provided their email address?”  
- **COALESCE** → “If no mobile phone, use home address.”  
- **NULLIF** → “If answer equals default, treat as blank.”  

## 10. Advanced Example (Aggregates)
```sql
SELECT Department,
       AVG(COALESCE(Salary,0)) AS AvgSalary
FROM Employees
GROUP BY Department;
```
👉 Ensures missing salaries don’t break averages.

## 11. Common Mistakes
> [!WARNING]
> - Thinking `NULL = 0` (it is not).  
> - Using `= NULL` instead of `IS NULL`.  
> - Forgetting `COALESCE` in reports → blank values confuse stakeholders.  

## 12. Interview Questions
- **Beginner**: What does `IS NULL` do?  
- **Intermediate**: Difference between `COALESCE` and `ISNULL`?  
- **Advanced**: How does `NULLIF` help avoid divide‑by‑zero errors?  

## 13. Best Practices
- Always check for `NULL`s in critical fields.  
- Use `COALESCE` for default fallback values in reports.  
- Use `NULLIF` for safe division calculations.  

## 14. Comparison Table
| Function | Purpose | Example | Result |
| :--- | :--- | :--- | :--- |
| **IS NULL** | Check missing | `Email IS NULL` | True if blank |
| **IS NOT NULL** | Check present | `Email IS NOT NULL` | True if filled |
| **COALESCE** | Replace NULL | `COALESCE(Salary,0)` | 0 if NULL |
| **NULLIF** | Return NULL if equal | `NULLIF(Discount,0)` | NULL if 0 |

## 15. Memory Tricks
> [!TIP]
> - **IS NULL** = “Is it blank?”  
> - **COALESCE** = “Cover the blank.”  
> - **NULLIF** = “Null if same.”  

## 16. Cheat Sheet
```sql
IS NULL     → Check missing
IS NOT NULL → Check present
COALESCE    → Replace with default
NULLIF      → NULL if equal
```

## 17. Summary
- `NULL` = missing data.  
- `IS NULL` / `IS NOT NULL` → check presence.  
- `COALESCE` → replace with fallback.  
- `NULLIF` → avoid divide‑by‑zero.  
