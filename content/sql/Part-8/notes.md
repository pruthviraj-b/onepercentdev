# 1.0.8 BETWEEN Operator (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `BETWEEN` tests whether a value falls within an inclusive range — both the lower AND upper boundary values are included.

## 1. What is it?
The `BETWEEN` operator filters rows where a column value falls within a specified minimum and maximum range (inclusive on both ends).

## 2. Definition
`BETWEEN low AND high` is syntactic shorthand for `column >= low AND column <= high`.

## 3. Why do we need it?
- Cleaner than writing two separate `>=` and `<=` conditions.
- Works on numbers, dates, and text strings.
- Makes queries more readable for range-based filtering.

## 4. Real-world Analogy
Like checking if a flight is scheduled **between** 6 AM and 9 AM — both 6 AM and 9 AM flights are included.

---

## 5. Syntax
```sql
SELECT column_name
FROM table_name
WHERE column_name BETWEEN low_value AND high_value;
```

> [!NOTE]
> `BETWEEN` is **100% inclusive**. It includes both the `low_value` and `high_value` boundary points.
>
> `Salary BETWEEN 50000 AND 60000` is identical to `Salary >= 50000 AND Salary <= 60000`.

---

## 6. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | HireDate |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | 2020-01-15 |
| **2** | Bob | IT | `60000` | 2019-06-01 |
| **3** | Carol | Finance | `70000` | 2021-03-10 |
| **4** | David | IT | `65000` | 2018-11-20 |
| **5** | Emma | HR | `52000` | 2022-07-05 |

---

## 7. Numeric BETWEEN
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary BETWEEN 50000 AND 60000;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Alice | `50000` |
| Bob | `60000` |
| Emma | `52000` |

👉 50000 and 60000 are both included in the result.

---

## 8. Date BETWEEN
```sql
SELECT Name, HireDate
FROM Employees
WHERE HireDate BETWEEN '2019-01-01' AND '2021-12-31';
```
👉 Returns employees hired between Jan 2019 and Dec 2021 — inclusive.

---

## 9. Text BETWEEN
```sql
SELECT Name
FROM Employees
WHERE Name BETWEEN 'Alice' AND 'David';
```
👉 Returns names alphabetically between Alice and David (inclusive): Alice, Bob, Carol, David.

---

## 10. NOT BETWEEN
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary NOT BETWEEN 50000 AND 60000;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |

👉 Returns employees earning outside the 50k–60k range.

---

## 11. BETWEEN vs >= and <=

| Style | Readability | Result |
| :--- | :--- | :--- |
| `BETWEEN 50000 AND 60000` | Clean ✅ | Inclusive |
| `>= 50000 AND <= 60000` | Verbose | Identical |

---

## 12. Real Data Analyst Scenarios
- **Finance**: Pull transactions within a specific amount range.
- **HR**: Find employees hired in a particular year range.
- **Sales**: Filter products priced within a customer's budget band.

---

## 13. Common Mistakes
> [!WARNING]
> - Writing the range backwards: `BETWEEN 60000 AND 50000` returns **zero rows**.
> - Confusing `BETWEEN` as exclusive — it is **inclusive** of both boundaries.
> - For time ranges, be careful: `BETWEEN '2021-01-01' AND '2021-12-31'` may miss events on Dec 31 if timestamps include time components. Use `< '2022-01-01'` for safety.

---

## 14. Key Takeaways
- `BETWEEN` works on numbers, dates, and text.
- Always **inclusive** of start and end limits.
- `NOT BETWEEN` excludes the range.
- Write ranges in **ascending order** (low → high).
