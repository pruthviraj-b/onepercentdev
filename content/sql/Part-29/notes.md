# 1.2.9 Numeric Functions (ROUND, CEIL, FLOOR, ABS, MOD) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Numeric functions perform mathematical transformations on number values for rounding, absolute values, and modular arithmetic.

## 1. What are they?
Functions that manipulate numeric values for rounding, absolute values, and modular arithmetic.

## 2. Why do we need them?
- To format numbers for reports.  
- To handle negative values safely.  
- To calculate remainders (e.g., cycle counts).  
- To ensure consistent numeric precision.  

## 3. Real-world Analogy
- **ROUND** → Rounding bill amount at a shop.  
- **CEIL** → Always round up (bus fare).  
- **FLOOR** → Always round down (discount calculation).  
- **ABS** → Distance (always positive).  
- **MOD** → Clock arithmetic (hours wrap around).  

## 4. Example Dataset
**Sales Table**

| SaleID | Amount |
| :--- | :--- |
| **1** | `123.456` |
| **2** | `-45.67` |
| **3** | `200.00` |

## 5. ROUND
```sql
SELECT ROUND(Amount, 2) AS RoundedAmount
FROM Sales;
```
👉 `123.46`, `-45.67`, `200.00`.

## 6. CEIL (CEILING)
```sql
SELECT CEIL(Amount) AS CeilAmount
FROM Sales;
```
👉 `124`, `-45`, `200`.

## 7. FLOOR
```sql
SELECT FLOOR(Amount) AS FloorAmount
FROM Sales;
```
👉 `123`, `-46`, `200`.

## 8. ABS
```sql
SELECT ABS(Amount) AS AbsoluteAmount
FROM Sales;
```
👉 `123.456`, `45.67`, `200`.

## 9. MOD
```sql
SELECT MOD(Amount, 7) AS Remainder
FROM Sales;
```
👉 Remainder when divided by 7.

## 10. Advanced Example (Combined)
```sql
SELECT SaleID,
       ROUND(Amount,0) AS Rounded,
       CEIL(Amount) AS CeilVal,
       FLOOR(Amount) AS FloorVal,
       ABS(Amount) AS AbsVal,
       MOD(CAST(Amount AS INT), 5) AS ModVal
FROM Sales;
```

## 11. Real Analyst Scenarios
- **Finance**: Round currency values.  
- **HR**: Calculate full years of service (`FLOOR`).  
- **Marketing**: Absolute difference in campaign spend (`ABS`).  
- **Ecommerce**: Cycle through product IDs with `MOD`.  

## 12. Expected Output
Clean, precise numbers ready for reporting.

## 13. Visual Explanation
```text
ROUND → Nearest
CEIL  → Up
FLOOR → Down
ABS   → Positive
MOD   → Remainder
```

## 14. Common Mistakes
> [!WARNING]
> - Forgetting `ROUND` precision decimal argument.  
> - Confusing `CEIL` vs `FLOOR` on negative numbers (`CEIL(-45.67) = -45`, `FLOOR(-45.67) = -46`).  
> - Misusing `MOD` with decimal numbers.  

## 15. Interview Questions
- **Beginner**: What does `ABS` do?  
- **Intermediate**: Difference between `CEIL` and `FLOOR`?  
- **Advanced**: How is `MOD` used in cyclic calculations?  

## 16. Best Practices
- Always specify precision in `ROUND`.  
- Use `ABS` for variance and differences.  
- Use `MOD` for periodic grouping.  

## 17. Comparison Table
| Function | Purpose | Example | Result |
| :--- | :--- | :--- | :--- |
| **ROUND** | Nearest value | `ROUND(123.456,2)` | `123.46` |
| **CEIL** | Round up | `CEIL(123.456)` | `124` |
| **FLOOR** | Round down | `FLOOR(123.456)` | `123` |
| **ABS** | Positive value | `ABS(-45.67)` | `45.67` |
| **MOD** | Remainder | `MOD(10,3)` | `1` |

## 18. Memory Tricks
> [!TIP]
> - **ROUND** = “Nearest.”  
> - **CEIL** = “Ceiling (up).”  
> - **FLOOR** = “Floor (down).”  
> - **ABS** = “Absolute positive.”  
> - **MOD** = “Modulo remainder.”  

## 19. Cheat Sheet
```sql
ROUND(num, decimals)
CEIL(num)
FLOOR(num)
ABS(num)
MOD(num, divisor)
```

## 20. Summary
Numeric functions clean and control numbers. They’re essential for precise calculations, reporting, and handling edge cases.  
