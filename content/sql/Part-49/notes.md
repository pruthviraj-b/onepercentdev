# 1.6.4 Window Functions (LEAD, LAG) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LAG` accesses a value from a **previous** row; `LEAD` accesses a value from a **future** row — without needing self-joins. They are the go-to tools for time-series analysis and period-over-period comparisons.

## 1. What are LEAD and LAG?
- **LAG** → Looks *backward* — returns a value from a preceding row in the ordered window.
- **LEAD** → Looks *forward* — returns a value from a succeeding row in the ordered window.

Both functions are window functions used inside `OVER()` clauses.

## 2. Definition
`LAG(column, offset, default)` and `LEAD(column, offset, default)` let you reference adjacent rows by their ordered position, enabling row-to-row difference calculations in a single query pass.

## 3. Why use them?
- Calculate Month-over-Month (MoM) or Year-over-Year (YoY) growth.
- Compare today's metric against yesterday's without a self-join.
- Detect increases, decreases, or status changes between consecutive records.

## 4. Real-world Analogy
Like looking at a marathon leaderboard:
- **LAG** = Who was ahead of you in the last checkpoint?
- **LEAD** = Who will be ahead in the next checkpoint?

---

## 5. Syntax
```sql
LAG(column, offset, default_value)  OVER (PARTITION BY col ORDER BY sort_col)
LEAD(column, offset, default_value) OVER (PARTITION BY col ORDER BY sort_col)
```

| Parameter | Description | Default |
| :--- | :--- | :--- |
| `column` | The column to look up | Required |
| `offset` | Number of rows back/forward | `1` |
| `default_value` | Value returned when boundary is hit | `NULL` |

---

## 6. Example Dataset
**MonthlySales Table**

| SaleID | Month | Sales |
| :--- | :--- | :--- |
| **1** | Jan | `100` |
| **2** | Feb | `120` |
| **3** | Mar | `150` |
| **4** | Apr | `130` |
| **5** | May | `180` |

---

## 7. LAG — Month-over-Month Growth
```sql
SELECT Month, Sales,
       LAG(Sales, 1, 0) OVER (ORDER BY SaleID) AS PrevMonthSales,
       Sales - LAG(Sales, 1, 0) OVER (ORDER BY SaleID) AS MoMGrowth
FROM MonthlySales;
```

**Output:**

| Month | Sales | PrevMonthSales | MoMGrowth |
| :--- | :--- | :--- | :--- |
| Jan | `100` | `0` | `100` |
| Feb | `120` | `100` | `+20` |
| Mar | `150` | `120` | `+30` |
| Apr | `130` | `150` | `-20` |
| May | `180` | `130` | `+50` |

👉 The `default_value` of `0` replaces `NULL` for the first row.

---

## 8. LEAD — Preview Next Month Sales
```sql
SELECT Month, Sales,
       LEAD(Sales, 1) OVER (ORDER BY SaleID) AS NextMonthSales
FROM MonthlySales;
```

**Output:**

| Month | Sales | NextMonthSales |
| :--- | :--- | :--- |
| Jan | `100` | `120` |
| Feb | `120` | `150` |
| Mar | `150` | `130` |
| Apr | `130` | `180` |
| May | `180` | `NULL` |

👉 May has `NULL` for `NextMonthSales` — no future row exists.

---

## 9. LAG with Offset > 1
```sql
SELECT Month, Sales,
       LAG(Sales, 2) OVER (ORDER BY SaleID) AS TwoMonthsAgo
FROM MonthlySales;
```
👉 Compares each month against the sales figure from 2 months prior.

---

## 10. LAG with PARTITION BY (Per Department)
```sql
SELECT Employee, DeptID, Month, Sales,
       LAG(Sales, 1) OVER (PARTITION BY DeptID ORDER BY Month) AS PrevMonthDeptSales
FROM DeptSales;
```
👉 Each department's LAG resets independently — comparisons stay within the same department.

---

## 11. Percentage Change with LAG
```sql
SELECT Month, Sales,
       LAG(Sales) OVER (ORDER BY SaleID) AS PrevSales,
       ROUND(100.0 * (Sales - LAG(Sales) OVER (ORDER BY SaleID))
             / NULLIF(LAG(Sales) OVER (ORDER BY SaleID), 0), 2) AS PctChange
FROM MonthlySales;
```
👉 Calculates percentage growth between months. `NULLIF` prevents division-by-zero errors.

---

## 12. LAG vs LEAD Comparison

| Function | Direction | Returns | Primary Use |
| :--- | :--- | :--- | :--- |
| **LAG** | Backward | Previous row value | MoM/YoY comparisons, trailing data |
| **LEAD** | Forward | Next row value | Forecasting, look-ahead scheduling |

---

## 13. Real Data Analyst Scenarios
- **Finance**: Month-over-Month and Year-over-Year revenue growth analysis.
- **Marketing**: Campaign-to-campaign conversion rate delta.
- **Operations**: Stock level changes between inventory snapshots.
- **HR**: Salary change tracking between performance review periods.

---

## 14. Common Mistakes
> [!WARNING]
> - Forgetting `ORDER BY` inside `OVER()` — without it, results are non-deterministic.
> - Not handling the first/last `NULL` row that occurs at boundaries — use the `default_value` parameter.
> - Confusing `offset` direction: `LAG` goes back, `LEAD` goes forward.

---

## 15. Memory Trick
> [!TIP]
> - **LAG** = Look **A**t **G**one (past)
> - **LEAD** = Look **E**xpecting **A** **D**irection (future)
>
> Or simply: **LAG looks back, LEAD looks forward.**

---

## 16. Key Takeaways
- `LAG` and `LEAD` eliminate the need for self-joins when comparing adjacent rows.
- Always specify `ORDER BY` inside `OVER()`.
- Use the `default_value` parameter to handle boundary `NULL`s gracefully.
- Combine with `PARTITION BY` for group-level row comparisons.
