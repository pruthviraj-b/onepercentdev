# 1.2.8 Date Functions (DATEDIFF, DATE_TRUNC, EXTRACT, DATEADD, CURRENT_DATE) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Date functions let analysts measure durations, truncate timestamps for period grouping, extract date parts (year/month/day), and add/subtract time intervals.

## 1. What are they?
Functions that operate on date/time values to calculate differences, adjust dates, or extract components.

## 2. Why do we need them?
- To measure durations (days between orders).  
- To group by time periods (monthly sales).  
- To extract parts of dates (year, month).  
- To add/subtract intervals (next payment date).  

## 3. Real-world Analogy
- **DATEDIFF** → Counting days between two birthdays.  
- **DATE_TRUNC** → Rounding a clock to the nearest hour/month.  
- **EXTRACT** → Picking out the month from a calendar.  
- **DATEADD** → Adding 30 days to a due date.  
- **CURRENT_DATE** → Today’s date.  

## 4. Example Dataset
**Orders Table**

| OrderID | OrderDate | DeliveryDate | Amount |
| :--- | :--- | :--- | :--- |
| **1** | `2026-07-01` | `2026-07-05` | `500` |
| **2** | `2026-07-02` | `2026-07-04` | `300` |
| **3** | `2026-07-03` | `2026-07-10` | `200` |

## 5. DATEDIFF
```sql
SELECT OrderID, DATEDIFF(day, OrderDate, DeliveryDate) AS DaysToDeliver
FROM Orders;
```
👉 Calculates days between order and delivery.

## 6. DATE_TRUNC (PostgreSQL)
```sql
SELECT DATE_TRUNC('month', OrderDate) AS OrderMonth, SUM(Amount)
FROM Orders
GROUP BY DATE_TRUNC('month', OrderDate);
```
👉 Groups sales by month.

## 7. EXTRACT
```sql
SELECT OrderID, EXTRACT(YEAR FROM OrderDate) AS OrderYear
FROM Orders;
```
👉 Extracts year from order date.

## 8. DATEADD
```sql
SELECT OrderID, DATEADD(day, 30, OrderDate) AS PaymentDue
FROM Orders;
```
👉 Adds 30 days to order date.

## 9. CURRENT_DATE
```sql
SELECT OrderID
FROM Orders
WHERE DeliveryDate < CURRENT_DATE;
```
👉 Finds orders already delivered before today.

## 10. Advanced Example (Combined)
```sql
SELECT EXTRACT(MONTH FROM OrderDate) AS Month,
       COUNT(*) AS Orders,
       AVG(DATEDIFF(day, OrderDate, DeliveryDate)) AS AvgDeliveryDays
FROM Orders
GROUP BY EXTRACT(MONTH FROM OrderDate);
```
👉 Monthly order count + average delivery time.

## 11. Real Analyst Scenarios
- **HR**: Calculate tenure (`DATEDIFF` hire vs today).  
- **Finance**: Add 30 days to invoice date (`DATEADD`).  
- **Marketing**: Group campaigns by month (`DATE_TRUNC`).  
- **Ecommerce**: Extract year for annual sales (`EXTRACT`).  

## 12. Expected Output
Summarized tables with durations, grouped periods, and extracted date parts.

## 13. Visual Explanation
```text
DATEDIFF     → Duration between dates
DATE_TRUNC   → Round timestamp to period
EXTRACT      → Pull specific date part
DATEADD      → Add interval to date
CURRENT_DATE → Today's calendar date
```

## 14. Common Mistakes
> [!WARNING]
> - Mixing up the argument order in `DATEDIFF(start, end)` vs `DATEDIFF(unit, start, end)`.  
> - Forgetting `DATE_TRUNC` is PostgreSQL/Snowflake specific.  
> - Using `EXTRACT` incorrectly on text strings.  

## 15. Interview Questions
- **Beginner**: What does `DATEDIFF` do?  
- **Intermediate**: Difference between `DATE_TRUNC` and `EXTRACT`?  
- **Advanced**: How does `DATEADD` differ across SQL dialects?  

## 16. Best Practices
- Always alias calculated date columns.  
- Use `DATE_TRUNC` for grouping, `EXTRACT` for filtering.  
- Use `CURRENT_DATE` for dynamic time-series queries.  

## 17. Comparison Table
| Function | Purpose | Example |
| :--- | :--- | :--- |
| **DATEDIFF** | Difference | Days between order & delivery |
| **DATE_TRUNC** | Round | Group by month |
| **EXTRACT** | Pull part | Year from date |
| **DATEADD** | Add interval | Add 30 days |
| **CURRENT_DATE** | Today | Filter past orders |

## 18. Memory Tricks
> [!TIP]
> - **DATEDIFF** = “Date Difference.”  
> - **DATE_TRUNC** = “Truncate to period.”  
> - **EXTRACT** = “Extract part.”  
> - **DATEADD** = “Add interval.”  
> - **CURRENT_DATE** = “Today.”  

## 19. Cheat Sheet
```sql
DATEDIFF(day, start, end)
DATE_TRUNC('month', date)
EXTRACT(YEAR FROM date)
DATEADD(day, n, date)
CURRENT_DATE
```

## 20. Summary
Date functions let analysts measure, group, extract, and adjust time values — essential for reporting and trend analysis.  
