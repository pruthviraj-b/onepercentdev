# 1.5.8 Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Set operations combine result sets from two or more queries vertically. `UNION` merges & deduplicates, `UNION ALL` merges keeping duplicates, `INTERSECT` returns overlap, and `EXCEPT` returns differences.

---

# SECTION 1: UNION vs UNION ALL

## 1. What are they?
- **UNION** → Combines results of two queries and automatically removes duplicate rows.  
- **UNION ALL** → Combines results of two queries and keeps all duplicate rows.  

## 2. Why use them?
- To merge data from multiple queries or separate tables into a single result set.  
- To control whether duplicate rows should be kept or removed.  

## 3. Real-world Analogy
- **UNION** → “Merge guest list A and guest list B, but deduplicate identical names.”  
- **UNION ALL** → “Merge guest list A and guest list B, keeping every entry even if a guest appears on both lists.”  

## 4. Syntax
```sql
-- UNION (Deduplicated)
SELECT col1, col2 FROM table1
UNION
SELECT col1, col2 FROM table2;

-- UNION ALL (Preserves Duplicates)
SELECT col1, col2 FROM table1
UNION ALL
SELECT col1, col2 FROM table2;
```

## 5. Example Dataset
**Employees_US Table**

| Name | Department |
| :--- | :--- |
| Alice | HR |
| Bob | IT |

**Employees_UK Table**

| Name | Department |
| :--- | :--- |
| Bob | IT |
| Carol | Finance |

## 6. UNION Example
```sql
SELECT Name, Department FROM Employees_US
UNION
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Alice–HR, Bob–IT, Carol–Finance (Duplicate Bob is removed).

## 7. UNION ALL Example
```sql
SELECT Name, Department FROM Employees_US
UNION ALL
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Alice–HR, Bob–IT, Bob–IT, Carol–Finance (Duplicates kept).

## 8. UNION vs UNION ALL Key Differences

| Feature | UNION | UNION ALL |
| :--- | :--- | :--- |
| **Duplicates** | Removed | Preserved |
| **Performance** | Slower (requires sorting & deduplication) | Faster (direct append) |
| **Use Case** | When uniqueness is mandatory | When performance matters or duplicates are valid |

---

# SECTION 2: INTERSECT vs EXCEPT

## 9. What are they?
- **INTERSECT** → Returns only rows that appear in **both** query result sets (the overlap $A \cap B$).  
- **EXCEPT** (or `MINUS` in Oracle) → Returns rows from the first query that do **not** appear in the second query ($A - B$).  

## 10. Real-world Analogy
- **INTERSECT** → “Show me people who are on both the general guest list AND the VIP list.”  
- **EXCEPT** → “Show me people who are on the general guest list BUT NOT on the VIP list.”  

## 11. Syntax
```sql
-- INTERSECT
SELECT col1, col2 FROM table1
INTERSECT
SELECT col1, col2 FROM table2;

-- EXCEPT
SELECT col1, col2 FROM table1
EXCEPT
SELECT col1, col2 FROM table2;
```

## 12. INTERSECT Example
```sql
SELECT Name, Department FROM Employees_US
INTERSECT
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Bob–IT (the only row present in both tables).

## 13. EXCEPT Example
```sql
SELECT Name, Department FROM Employees_US
EXCEPT
SELECT Name, Department FROM Employees_UK;
```
👉 **Returns**: Alice–HR (present in US table, absent in UK table).

---

# SECTION 3: MASTER SET OPERATIONS COMPARISON MODULE

| Operator | Purpose / Result | Duplicates | Typical Use Case | Performance |
| :--- | :--- | :--- | :--- | :--- |
| **UNION** | Combines results of two queries and returns unique rows | Removed | Merge datasets but avoid duplicates (e.g., employee lists from two countries) | Slower (deduplication step) |
| **UNION ALL** | Combines results of two queries and returns all rows | Kept | Merge datasets where duplicates are meaningful (e.g., transaction logs) | Faster (no deduplication) |
| **INTERSECT** | Returns rows that appear in both queries | Removed | Find common records (e.g., employees present in both US and UK lists) | Similar to UNION (deduplication required) |
| **EXCEPT** | Returns rows from the first query not in the second | Removed | Find differences (e.g., accounts in one system but missing in another) | Similar to UNION (deduplication required) |

## 📊 Visual Summary
```text
UNION       → A ∪ B (unique)
UNION ALL   → A ∪ B (all)
INTERSECT   → A ∩ B
EXCEPT      → A – B
```

## ⚡ Quick Cheat Sheet
```sql
-- UNION
SELECT ... FROM A
UNION
SELECT ... FROM B;

-- UNION ALL
SELECT ... FROM A
UNION ALL
SELECT ... FROM B;

-- INTERSECT
SELECT ... FROM A
INTERSECT
SELECT ... FROM B;

-- EXCEPT
SELECT ... FROM A
EXCEPT
SELECT ... FROM B;
```

## 🎯 Best Practices
- Use `UNION` when uniqueness is strictly required.  
- Use `UNION ALL` for performance or when duplicates matter.  
- Use `INTERSECT` to find overlaps.  
- Use `EXCEPT` to find differences.  
- Always ensure column counts and data types match across queries.  

## 14. Common Rules for All Set Operations
> [!WARNING]
> - Both `SELECT` queries must have the **exact same number of columns**.  
> - Corresponding columns must have **compatible data types**.  
> - `ORDER BY` can only be placed at the **very end** of the combined query.  

## 15. Memory Trick
> [!TIP]
> - **UNION** = Combine + Unique  
> - **UNION ALL** = Combine + All  
> - **INTERSECT** = Intersection (overlap)  
> - **EXCEPT** = Exclusive to Query 1  

## 16. Summary
Set operations combine queries vertically.  
- `UNION` deduplicates results.  
- `UNION ALL` is fastest and keeps duplicates.  
- `INTERSECT` finds common ground.  
- `EXCEPT` finds differences.  
