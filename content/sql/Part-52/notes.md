# 1.6.7 PIVOT / UNPIVOT in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `PIVOT` rotates row values into column headers (wide format). `UNPIVOT` rotates column headers back into row values (long/normalized format). These are essential for data reshaping in analytics and reporting.

## 1. What are PIVOT and UNPIVOT?
- **PIVOT**: Transforms unique row values of one column into separate column headers, with aggregated values filling each cell.
- **UNPIVOT**: The reverse — takes multiple columns and "stacks" their headers and values into two columns (key-value pairs).

## 2. Definition
- `PIVOT` → Converts a **long** table to a **wide** table.
- `UNPIVOT` → Converts a **wide** table to a **long** (normalized) table.

## 3. Why do we need them?
- **PIVOT**: Generate cross-tab reports (monthly sales per product).
- **UNPIVOT**: Normalize wide survey/spreadsheet data before loading into a database.
- Reshape data for dashboards and BI tools.

## 4. Real-world Analogy
- **PIVOT**: Like a spreadsheet's "pivot table" — turning months (rows) into columns so each column shows a month's total.
- **UNPIVOT**: Like "melting" a wide spreadsheet into a tidy database table with one value per row.

---

## 5. Example Dataset (Before PIVOT)
**Sales Table (Long Format)**

| Employee | Month | Amount |
| :--- | :--- | :--- |
| Alice | Jan | `500` |
| Alice | Feb | `600` |
| Bob | Jan | `700` |
| Bob | Feb | `750` |

---

## 6. PIVOT — Rows to Columns

### SQL Server Syntax
```sql
SELECT Employee, [Jan], [Feb]
FROM Sales
PIVOT (
    SUM(Amount) FOR Month IN ([Jan], [Feb])
) AS PivotTable;
```

**Output (Wide Format):**

| Employee | Jan | Feb |
| :--- | :--- | :--- |
| Alice | `500` | `600` |
| Bob | `700` | `750` |

👉 Month values became columns. Each cell holds the aggregated `SUM(Amount)`.

---

## 7. PIVOT using CASE (Cross-database compatible)
```sql
SELECT Employee,
       SUM(CASE WHEN Month = 'Jan' THEN Amount ELSE 0 END) AS Jan,
       SUM(CASE WHEN Month = 'Feb' THEN Amount ELSE 0 END) AS Feb
FROM Sales
GROUP BY Employee;
```
👉 Works in MySQL, PostgreSQL, SQLite — not just SQL Server. **Preferred for portability.**

---

## 8. UNPIVOT — Columns to Rows

### SQL Server Syntax
```sql
SELECT Employee, Month, Amount
FROM PivotTable
UNPIVOT (
    Amount FOR Month IN ([Jan], [Feb])
) AS UnpivotTable;
```

**Output (Long Format):**

| Employee | Month | Amount |
| :--- | :--- | :--- |
| Alice | Jan | `500` |
| Alice | Feb | `600` |
| Bob | Jan | `700` |
| Bob | Feb | `750` |

👉 Column headers (Jan, Feb) became row values in the Month column.

---

## 9. UNPIVOT using UNION ALL (Cross-database compatible)
```sql
SELECT Employee, 'Jan' AS Month, Jan AS Amount FROM PivotTable
UNION ALL
SELECT Employee, 'Feb' AS Month, Feb AS Amount FROM PivotTable;
```
👉 Works across MySQL, PostgreSQL, SQLite. **Preferred for portability.**

---

## 10. PIVOT in PostgreSQL (using crosstab)
```sql
SELECT * FROM crosstab(
  'SELECT Employee, Month, SUM(Amount) FROM Sales GROUP BY 1,2 ORDER BY 1,2'
) AS PivotResult(Employee TEXT, Jan NUMERIC, Feb NUMERIC);
```
> [!NOTE]
> PostgreSQL requires the `tablefunc` extension: `CREATE EXTENSION IF NOT EXISTS tablefunc;`

---

## 11. When to Use Each

| Operation | Input Format | Output Format | Use Case |
| :--- | :--- | :--- | :--- |
| **PIVOT** | Long (rows) | Wide (columns) | Monthly reports, cross-tabs |
| **UNPIVOT** | Wide (columns) | Long (rows) | Database normalization, tidy data |

---

## 12. Real Data Analyst Scenarios
- **Finance**: Monthly revenue by product — PIVOT to show Jan, Feb, Mar as columns.
- **HR**: Quarterly headcount per department in one row per team.
- **Survey Analysis**: UNPIVOT wide responses (Q1, Q2, Q3 columns) into long format for analysis.
- **BI Tools**: Many BI tools require long format — UNPIVOT before loading.

---

## 13. Common Mistakes
> [!WARNING]
> - Native `PIVOT`/`UNPIVOT` syntax only works in **SQL Server** and **Oracle** — use `CASE` + `GROUP BY` or `UNION ALL` for portability.
> - Forgetting to handle `NULL` values in PIVOT cells (use `COALESCE` or `ISNULL`).
> - PIVOTing too many columns dynamically — requires dynamic SQL for large sets of categories.

---

## 14. Dynamic PIVOT (SQL Server)
When pivot column values are unknown at query time, use dynamic SQL:
```sql
DECLARE @cols NVARCHAR(MAX), @query NVARCHAR(MAX);
SELECT @cols = STRING_AGG(QUOTENAME(Month), ',') FROM (SELECT DISTINCT Month FROM Sales) t;
SET @query = 'SELECT Employee, ' + @cols + ' FROM Sales PIVOT (SUM(Amount) FOR Month IN (' + @cols + ')) p';
EXEC sp_executesql @query;
```

---

## 15. Key Takeaways
- **PIVOT**: Long → Wide. Rows become columns. Great for reports.
- **UNPIVOT**: Wide → Long. Columns become rows. Great for normalization.
- Use `CASE + GROUP BY` for PIVOT portability across all databases.
- Use `UNION ALL` for UNPIVOT portability across all databases.
- Native `PIVOT`/`UNPIVOT` = SQL Server / Oracle only.
