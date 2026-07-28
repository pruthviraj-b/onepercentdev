# 1.6.5 Window Functions (SUM/AVG/COUNT OVER Running Totals) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aggregate window functions — `SUM() OVER`, `AVG() OVER`, `COUNT() OVER` — compute cumulative totals, running averages, and row counts across ordered rows, while preserving every individual transaction row in the output.

## 1. What are Running Totals?
Running totals (also called cumulative aggregates) accumulate a value row-by-row in chronological order without collapsing individual transaction lines into a single summary row.

## 2. Definition
`SUM(col) OVER (ORDER BY date)` tells SQL to sum values from the first row up to and including the current row — updating the total with each new row processed.

## 3. Why use them?
- Track cumulative revenue month-by-month.
- Calculate Year-to-Date (YTD) totals in financial reports.
- Compute moving averages to smooth noisy time-series data.
- Show a running count of events over time.

## 4. Real-world Analogy
Like a bank account statement:
- Each transaction row shows its own amount.
- But there's also a "Running Balance" column that accumulates every transaction.
That running balance = `SUM(Amount) OVER (ORDER BY TransactionDate)`.

---

## 5. Core Syntax
```sql
SUM(col)   OVER (PARTITION BY dept ORDER BY date)
AVG(col)   OVER (PARTITION BY dept ORDER BY date)
COUNT(col) OVER (PARTITION BY dept ORDER BY date)
```

### With explicit frame clause:
```sql
SUM(col) OVER (
    PARTITION BY dept
    ORDER BY date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

> [!NOTE]
> `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` is the default frame when `ORDER BY` is present — it means "from the very first row of the partition up to the current row."

---

## 6. Example Dataset
**DailySales Table**

| SaleID | Month | Department | Sales |
| :--- | :--- | :--- | :--- |
| **1** | Jan | IT | `100` |
| **2** | Feb | IT | `120` |
| **3** | Mar | IT | `150` |
| **4** | Apr | IT | `130` |

---

## 7. Running Total (SUM OVER)
```sql
SELECT Month, Sales,
       SUM(Sales) OVER (ORDER BY SaleID) AS RunningTotal
FROM DailySales;
```

**Output:**

| Month | Sales | RunningTotal |
| :--- | :--- | :--- |
| Jan | `100` | `100` |
| Feb | `120` | `220` |
| Mar | `150` | `370` |
| Apr | `130` | `500` |

👉 Each row accumulates the previous total — all rows preserved.

---

## 8. Running Average (AVG OVER)
```sql
SELECT Month, Sales,
       AVG(Sales) OVER (ORDER BY SaleID) AS RunningAvg
FROM DailySales;
```

**Output:**

| Month | Sales | RunningAvg |
| :--- | :--- | :--- |
| Jan | `100` | `100.0` |
| Feb | `120` | `110.0` |
| Mar | `150` | `123.3` |
| Apr | `130` | `125.0` |

---

## 9. Running Count (COUNT OVER)
```sql
SELECT Month, Sales,
       COUNT(*) OVER (ORDER BY SaleID) AS RunningCount
FROM DailySales;
```

**Output:**

| Month | Sales | RunningCount |
| :--- | :--- | :--- |
| Jan | `100` | `1` |
| Feb | `120` | `2` |
| Mar | `150` | `3` |
| Apr | `130` | `4` |

---

## 10. Running Total Per Department (with PARTITION BY)
```sql
SELECT Employee, DeptID, Month, Sales,
       SUM(Sales) OVER (PARTITION BY DeptID ORDER BY Month) AS DeptRunningTotal
FROM DeptSales;
```
👉 Running totals reset at each department boundary — each department tracks its own cumulative sum independently.

---

## 11. Moving Average (N-Row Window Frame)
```sql
SELECT Month, Sales,
       AVG(Sales) OVER (
           ORDER BY SaleID
           ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS MovingAvg3
FROM DailySales;
```
👉 A 3-row moving average — averages the current row and the two rows preceding it. Great for smoothing volatile time-series data.

---

## 12. Window Frame Options

| Frame Clause | What it covers |
| :--- | :--- |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | All rows from start to current (cumulative) |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Current row + 2 prior rows (3-row moving window) |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | Current row to end (reverse cumulative) |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` | All rows in partition (grand total per row) |

---

## 13. Running Total vs GROUP BY Comparison

| Approach | Rows Preserved? | Individual Detail? | Use Case |
| :--- | :--- | :--- | :--- |
| `GROUP BY` + `SUM` | No (collapsed) | No | Summary totals only |
| `SUM() OVER` | Yes | Yes | Running totals with detail |

---

## 14. Real Data Analyst Scenarios
- **Finance**: Bank statement running balance; YTD cumulative revenue.
- **Sales**: Cumulative monthly revenue toward annual quota.
- **Operations**: 7-day moving average for daily demand smoothing.
- **Marketing**: Running count of campaign sign-ups over time.

---

## 15. Common Mistakes
> [!WARNING]
> - Forgetting `ORDER BY` inside `OVER()` — without it, the window aggregates the entire partition at once (grand total per row), not a running total.
> - Confusing `ROWS` vs `RANGE` frame modes — they differ in how they handle ties.
> - Using `GROUP BY` when you need running totals — it collapses rows and loses detail.

---

## 16. Key Takeaways
- `SUM() OVER (ORDER BY date)` = cumulative running total.
- `AVG() OVER (ORDER BY date)` = running (expanding) average.
- `PARTITION BY` resets the running total per group.
- `ROWS BETWEEN` frame clause controls the window size for moving aggregates.
- Running totals preserve all individual rows — unlike `GROUP BY`.
