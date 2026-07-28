# 1.2.6 CAST / CONVERT (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `CAST` (ANSI SQL standard) and `CONVERT` (SQL Server) explicitly convert values from one data type to another to align types, format dates, and prevent query errors.

## 1. What are they?
- **CAST** → Standard ANSI SQL function to convert one data type into another.  
- **CONVERT** → SQL Server–specific function that also allows style/format options.  

## 2. Why do we need them?
- To ensure numeric calculations on text fields.  
- To format dates for reporting.  
- To unify data types when joining tables.  

## 3. Syntax
### CAST (Universal)
```sql
CAST(expression AS target_type)
```

### CONVERT (SQL Server)
```sql
CONVERT(target_type, expression, style)
```

## 4. Example Dataset
**Orders Table**

| OrderID | OrderDate | Amount |
| :--- | :--- | :--- |
| **1** | `2026-07-01` | `500.75` |
| **2** | `2026-07-02` | `300.00` |
| **3** | `2026-07-03` | `200.25` |

## 5. Basic Example (CAST)
```sql
SELECT CAST(Amount AS INT) AS RoundedAmount
FROM Orders;
```
👉 Converts decimal to integer (`500.75` → `500`).

## 6. Intermediate Example (CONVERT with Date)
```sql
SELECT CONVERT(VARCHAR, OrderDate, 103) AS UKDateFormat
FROM Orders;
```
👉 Converts date to string in UK format (`dd/mm/yyyy`).

## 7. Advanced Example (JOIN with CAST)
```sql
SELECT o.OrderID, c.CustomerName
FROM Orders o
JOIN Customers c
ON CAST(o.CustomerID AS VARCHAR) = c.CustomerCode;
```
👉 Ensures join works when IDs are stored in mismatched types.

## 8. Real-world Analogies
- **CAST** → Like pouring water into a new shaped glass (same liquid, new container).  
- **CONVERT** → Like changing both the container and the presentation style (wine glass vs coffee mug).  

## 9. Common Use Cases
- Convert string to number for calculations.  
- Convert date to string for reporting.  
- Convert NULLs safely with `COALESCE` + `CAST`.  
- Format currency or percentages.  

## 10. Rules
- `CAST` is ANSI SQL compliant (portable across PostgreSQL, MySQL, SQL Server, Snowflake).  
- `CONVERT` is SQL Server–specific.  
- Style codes in `CONVERT` define date/time formats.  

## 11. Common Mistakes
> [!WARNING]
> - Forgetting `CAST` before math → calculation errors on text fields.  
> - Using `CONVERT` in non–SQL Server systems.  
> - Assuming `CAST` changes stored disk schema (it only changes output).  

## 12. Interview Questions
- **Beginner**: What does `CAST` do?  
- **Intermediate**: Difference between `CAST` and `CONVERT`?  
- **Advanced**: How do style codes in `CONVERT` work?  

## 13. Best Practices
- Use `CAST` for portability.  
- Use `CONVERT` only when formatting is needed in SQL Server.  
- Always alias converted columns.  

## 14. Comparison Table
| Feature | CAST | CONVERT |
| :--- | :--- | :--- |
| **Standard** | ANSI SQL | SQL Server only |
| **Syntax** | `CAST(expr AS type)` | `CONVERT(type, expr, style)` |
| **Formatting** | No | Yes (style codes) |
| **Portability** | High | Low |

## 15. Memory Trick
> [!TIP]
> - **CAST** = “Change Shape.”  
> - **CONVERT** = “Change Shape + Style.”  

## 16. Cheat Sheet
```sql
CAST('123' AS INT)                  → 123
CONVERT(VARCHAR, GETDATE(), 101)     → 07/24/2026
```

## 17. Summary
- `CAST` → universal type conversion.  
- `CONVERT` → SQL Server with formatting.  
- Essential for clean joins, calculations, and reporting.  
