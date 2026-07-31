# 1.6.3 Window Functions (ROW_NUMBER, RANK, DENSE_RANK) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Window functions perform calculations across a set of table rows related to the current row without collapsing rows into a single summary output (unlike `GROUP BY`).

## 1. What are Window Functions?
Operate over a window of rows defined by `OVER()`.
- Unlike `GROUP BY`, they retain all individual detail rows while appending computed ranking metrics.  
- Essential for top-N analysis, deduplication, and ordered ranking.  

## 2. Syntax
```sql
ROW_NUMBER() OVER (PARTITION BY col ORDER BY col DESC)
RANK()       OVER (PARTITION BY col ORDER BY col DESC)
DENSE_RANK() OVER (PARTITION BY col ORDER BY col DESC)
```

## 3. Example Dataset
**Sales Table**

| SaleID | Employee | Amount |
| :--- | :--- | :--- |
| **1** | Alice | `500` |
| **2** | Bob | `700` |
| **3** | Carol | `700` |
| **4** | David | `600` |

## 4. ROW_NUMBER Example
```sql
SELECT Employee, Amount,
       ROW_NUMBER() OVER (ORDER BY Amount DESC) AS RowNum
FROM Sales;
```
👉 **Output**: Bob (1), Carol (2), David (3), Alice (4).  
*No ties: every single row gets a unique sequential integer.*

## 5. RANK Example
```sql
SELECT Employee, Amount,
       RANK() OVER (ORDER BY Amount DESC) AS RankNum
FROM Sales;
```
👉 **Output**: Bob (1), Carol (1), David (3), Alice (4).  
*Ties share rank (1), but the next rank skips (skips 2 $\rightarrow$ 3).*

## 6. DENSE_RANK Example
```sql
SELECT Employee, Amount,
       DENSE_RANK() OVER (ORDER BY Amount DESC) AS DenseRankNum
FROM Sales;
```
👉 **Output**: Bob (1), Carol (1), David (2), Alice (3).  
*Ties share rank (1), but the next rank does NOT skip (1 $\rightarrow$ 2).*

## 7. Key Comparison Table

| Function | Handles Ties? | Next Rank Behavior | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **ROW_NUMBER** | No | Increments by 1 strictly | Deduplication (`rn = 1`) |
| **RANK** | Yes | Skips ranks after ties | Olympics medals style |
| **DENSE_RANK** | Yes | Does NOT skip ranks | Dense leaderboard ranking |

## 8. Real Analyst Scenarios
- **HR**: Find top 2 highest paid employees per department using `ROW_NUMBER()`.  
- **Finance**: Rank sales representatives by quarterly performance using `DENSE_RANK()`.  
- **Ecommerce**: Identify top customers per region using `RANK()`.  

## 9. Memory Trick
> [!TIP]
> - **ROW_NUMBER**: 1, 2, 3, 4 (Strict counting)  
> - **RANK**: 1, 1, 3, 4 (Skips after tie)  
> - **DENSE_RANK**: 1, 1, 2, 3 (Dense, no gaps)  
