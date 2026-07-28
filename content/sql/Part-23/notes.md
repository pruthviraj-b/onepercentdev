# 1.2.3 HAVING vs WHERE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `WHERE` filters individual rows *before* grouping; `HAVING` filters aggregated groups *after* `GROUP BY` execution.

## 1. What are they?
- **WHERE** → filters rows before grouping.  
- **HAVING** → filters groups after aggregation.  

## 2. Definition
```sql
-- WHERE filters raw rows
SELECT column, AGG_FUNC(column)
FROM table
WHERE condition
GROUP BY column;

-- HAVING filters aggregated groups
SELECT column, AGG_FUNC(column)
FROM table
GROUP BY column
HAVING aggregate_condition;
```

## 3. Why do we need them?
Analysts must distinguish between filtering raw data vs filtering summarized groups. Misusing them leads to wrong results.

## 4. Real-world Analogy
- **WHERE** = “Check each student’s paper before grouping by class.”  
- **HAVING** = “After grouping by class, keep only classes with average marks above 50.”  

## 5. Mental Model
Think of a factory line:
- **WHERE** = quality check before packaging.  
- **HAVING** = quality check after packaging.  

---

## 6. Syntax
### WHERE:
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary > 50000;
```

### HAVING:
```sql
SELECT Department, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Department
HAVING AVG(Salary) > 60000;
```

---

## 7. Rules
- `WHERE` cannot use aggregate functions.  
- `HAVING` can use aggregate functions.  
- `WHERE` runs before `GROUP BY`.  
- `HAVING` runs after `GROUP BY`.  

---

## 8. Example Dataset
**Orders Table**

| OrderID | UserID | Status | Total |
| :--- | :--- | :--- | :--- |
| **1** | 101 | Completed | `500` |
| **2** | 102 | Cancelled | `200` |
| **3** | 101 | Completed | `300` |
| **4** | 103 | Completed | `700` |
| **5** | 102 | Completed | `400` |

---

## 9. Basic Example (WHERE)
```sql
SELECT UserID, COUNT(*) AS OrderCount
FROM Orders
WHERE Status = 'Completed'
GROUP BY UserID;
```
👉 Filters rows first → only completed orders grouped.

---

## 10. Intermediate Example (HAVING)
```sql
SELECT UserID, COUNT(*) AS OrderCount
FROM Orders
GROUP BY UserID
HAVING COUNT(*) > 1;
```
👉 Groups first → then keeps only users with >1 orders.

---

## 11. Advanced Example (WHERE + HAVING)
```sql
SELECT UserID, SUM(Total) AS LifetimeValue
FROM Orders
WHERE Status = 'Completed'
GROUP BY UserID
HAVING SUM(Total) > 600;
```
👉 Filters rows (completed only), then filters groups (total > 600).

---

## 12. Real Analyst Scenarios
- **HR**: `WHERE Salary > 50k`, `HAVING AVG(Salary) > 60k`.  
- **Finance**: `WHERE TransactionType = 'Credit'`, `HAVING SUM(Amount) > 1M`.  
- **Marketing**: `WHERE Region = 'Asia'`, `HAVING COUNT(CustomerID) > 1000`.  

---

## 13. Expected Output
- **WHERE** → fewer rows before grouping.  
- **HAVING** → fewer groups after grouping.  

---

## 14. Visual Explanation
```text
Rows → WHERE filter → GROUP BY → HAVING filter → Final result
```

---

## 15. Behind the Scenes
Execution order:
1. `FROM`
2. `WHERE`
3. `GROUP BY`
4. `HAVING`
5. `SELECT`
6. `ORDER BY`

---

## 16. Common Mistakes
> [!WARNING]
> - Using aggregate functions inside `WHERE` (e.g., `WHERE SUM(Salary) > 5000` ❌).  
> - Using `HAVING` instead of `WHERE` for raw row filters (much slower).  
> - Forgetting query execution order.  

---

## 17. Interview Questions
- **Beginner**: Difference between `WHERE` and `HAVING`?  
- **Intermediate**: Why can’t aggregates be used in `WHERE`?  
- **Advanced**: Explain execution order with `GROUP BY`.  

---

## 18. Interview Traps
> [!IMPORTANT]
> **Q**: Can `HAVING` be used without `GROUP BY`?  
> **A**: Yes, but rare — it treats the entire table output as one group.  

---

## 19. Performance Notes
> [!TIP]
> - `WHERE` is faster (filters early and reduces rows before grouping).  
> - `HAVING` is heavier (filters after grouping).  

---

## 20. Best Practices
- Use `WHERE` for raw filters.  
- Use `HAVING` for aggregate filters.  
- Combine both for efficiency.  

---

## 21. Common Business Use Cases
- **HR**: Filter employees by salary (`WHERE`), then departments by avg salary (`HAVING`).  
- **Finance**: Filter transactions by type (`WHERE`), then accounts by total (`HAVING`).  
- **Ecommerce**: Filter orders by status (`WHERE`), then customers by spend (`HAVING`).  

---

## 22. Comparison Table
| Clause | Filters | Execution Stage | Aggregates Allowed? |
| :--- | :--- | :--- | :--- |
| **WHERE** | Rows | Before GROUP BY | No |
| **HAVING** | Groups | After GROUP BY | Yes |

---

## 23. Memory Trick
> [!TIP]
> - **WHERE** = Row filter.  
> - **HAVING** = Group filter.  

---

## 24. Cheat Sheet
```sql
WHERE  → Raw rows
HAVING → Grouped results
```

---

## 25. Summary
- `WHERE` filters rows.  
- `HAVING` filters groups.  
- Use both together for precise queries.  

---

## 26. Practice Questions
- **Easy**: Count completed orders per user (`WHERE`).  
- **Medium**: Keep only users with >1 orders (`HAVING`).  
- **Hard**: Completed orders only, then `HAVING SUM(Total) > 600`.  

---

## 27. Interview Practice Queries
- Difference between `WHERE` and `HAVING` with examples.  
- Query to find departments with avg salary > 60k.  

---

## 28. Hands-on Exercises
- Filter employees by `salary > 50k` (`WHERE`).  
- Filter departments with `total salary > 100k` (`HAVING`).  

---

## 29. Mini Project Usage
Build **Customer Spend Report**:
- `WHERE Status = 'Completed'`
- `GROUP BY CustomerID`
- `HAVING SUM(Spend) > 1000`

---

## 30. Key Takeaways
- `WHERE` = row filter.  
- `HAVING` = group filter.  
- Execution order matters.  

---

## 31. Real-world Visualization
- **WHERE** = “Check each item before packing.”  
- **HAVING** = “After packing, keep only boxes with >10 items.”  

---

## 32. Final Note
Mastering `WHERE` vs `HAVING` is essential for analysts — it’s the difference between filtering raw data and filtering summarized insights.  
