# 1.6.6 PARTITION BY (Master Module - Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `PARTITION BY` divides a query's result set into separate logical windows (groups). Window functions reset their calculations at each partition boundary while **preserving every individual output row** — unlike `GROUP BY` which collapses rows.

## 1. What is PARTITION BY?
`PARTITION BY` is a clause used inside window functions' `OVER()` definition. It splits the dataset into independent groups ("windows") for calculation purposes without removing any rows from the output.

## 2. Definition
`PARTITION BY col` tells a window function to treat each unique value of `col` as a separate calculation group, similar to `GROUP BY` but row-preserving.

## 3. Why use it?
- Rank employees **within** each department independently.
- Calculate running totals that reset per category.
- Compare each row against its own group's aggregate.
- Assign sequential row numbers within each partition.

## 4. Real-world Analogy
Like running a class leaderboard **per subject**:
- Maths class has its own rank 1, 2, 3...
- Science class independently has rank 1, 2, 3...
- All students still appear in the final report — no rows removed.

---

## 5. Syntax
```sql
<window_function>() OVER (
    PARTITION BY partition_column
    ORDER BY sort_column DESC
)
```

---

## 6. Example Dataset
**Sales Table**

| SaleID | Employee | DeptID | Amount |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `500` |
| **2** | Bob | 102 | `700` |
| **3** | Carol | 102 | `650` |
| **4** | David | 101 | `800` |
| **5** | Emma | 101 | `550` |

---

## 7. ROW_NUMBER with PARTITION BY
```sql
SELECT Employee, DeptID, Amount,
       ROW_NUMBER() OVER (PARTITION BY DeptID ORDER BY Amount DESC) AS DeptRank
FROM Sales;
```

**Output:**

| Employee | DeptID | Amount | DeptRank |
| :--- | :--- | :--- | :--- |
| David | 101 | `800` | 1 |
| Emma | 101 | `550` | 2 |
| Alice | 101 | `500` | 3 |
| Bob | 102 | `700` | 1 |
| Carol | 102 | `650` | 2 |

👉 Rankings reset to 1 for each department — Alice, Emma, David are ranked within Dept 101; Bob and Carol within Dept 102.

---

## 8. SUM with PARTITION BY (Department Totals)
```sql
SELECT Employee, DeptID, Amount,
       SUM(Amount) OVER (PARTITION BY DeptID) AS DeptTotal
FROM Sales;
```

**Output:**

| Employee | DeptID | Amount | DeptTotal |
| :--- | :--- | :--- | :--- |
| Alice | 101 | `500` | `1850` |
| David | 101 | `800` | `1850` |
| Emma | 101 | `550` | `1850` |
| Bob | 102 | `700` | `1350` |
| Carol | 102 | `650` | `1350` |

👉 Each row still shows, but `DeptTotal` reflects the whole department's sum — not just that row.

---

## 9. Running Total with PARTITION BY + ORDER BY
```sql
SELECT Employee, DeptID, Amount,
       SUM(Amount) OVER (PARTITION BY DeptID ORDER BY SaleID) AS RunningTotal
FROM Sales;
```
👉 Running total resets at each department boundary, accumulating within each partition.

---

## 10. AVG with PARTITION BY (Compare vs Group Average)
```sql
SELECT Employee, DeptID, Amount,
       AVG(Amount) OVER (PARTITION BY DeptID) AS DeptAvg,
       Amount - AVG(Amount) OVER (PARTITION BY DeptID) AS DiffFromAvg
FROM Sales;
```
👉 Each employee's salary compared against their own department's average — in a single query.

---

## 11. PARTITION BY vs GROUP BY Comparison

| Clause | Collapses Rows? | Returns All Rows? | Purpose |
| :--- | :--- | :--- | :--- |
| **GROUP BY** | Yes ✅ | No (Summary only) | Aggregate reporting |
| **PARTITION BY** | No ❌ | Yes (All rows preserved) | Window analytics & ranking |

---

## 12. Multiple PARTITION BY Columns
```sql
SELECT Employee, DeptID, Region, Amount,
       RANK() OVER (PARTITION BY DeptID, Region ORDER BY Amount DESC) AS RegionalRank
FROM Sales;
```
👉 Rank within each unique DeptID + Region combination.

---

## 13. Real Data Analyst Scenarios
- **HR**: Rank employees within their department by salary.
- **Finance**: Running revenue totals per business unit per quarter.
- **Sales**: Compare each rep's performance vs team average.
- **E-commerce**: Top N products per category.

---

## 14. Common Mistakes
> [!WARNING]
> - Using `PARTITION BY` without `ORDER BY` in ranking functions — results may be non-deterministic.
> - Confusing `PARTITION BY` with `GROUP BY` — the key difference is row preservation.
> - Forgetting that `PARTITION BY` is inside `OVER()` — it is not a standalone clause.

---

## 15. Memory Trick
> [!TIP]
> **PARTITION BY** = Divide into buckets, compute inside each bucket, keep **ALL rows** in the output.

---

## 16. Key Takeaways
- `PARTITION BY` = `GROUP BY` for window functions but **without** collapsing rows.
- Calculations reset at each partition boundary.
- Works with any window function: `ROW_NUMBER`, `RANK`, `SUM`, `AVG`, `LEAD`, `LAG`, etc.
- Can partition by multiple columns for finer grouping.
