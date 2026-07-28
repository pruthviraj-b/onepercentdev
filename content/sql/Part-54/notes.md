# 1.6.9 Handling Messy Data in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Real-world data is almost always dirty. Analysts typically spend 60–80% of their project time on data cleaning. SQL provides a powerful toolkit for detecting, cleaning, standardizing, and validating messy data.

## 1. What is Messy Data?
Messy data is raw data that contains errors, inconsistencies, missing values, duplicates, or formatting irregularities that prevent accurate analysis.

## 2. Why does it happen?
- Multiple data entry operators with different conventions.
- System migrations and schema changes over time.
- API integrations with inconsistent formats.
- Manual data imports from spreadsheets.
- NULL values from optional form fields.

## 3. Real-world Analogy
Like a raw ingredient order from a supplier:
- Some weights are in kg, others in pounds.
- Some product names are uppercase, others lowercase.
- Some quantities are blank.
- A few records are duplicated.
You must clean and standardize everything before cooking — same applies to SQL data cleaning.

---

## 4. Common Messy Data Problems & SQL Solutions

### A. Missing Values (NULLs)
```sql
-- Replace NULL salary with 0
SELECT Name, COALESCE(Salary, 0) AS CleanSalary
FROM Employees;

-- Find all rows with missing emails
SELECT * FROM Customers WHERE Email IS NULL;

-- Replace NULL with a meaningful default
SELECT Name, ISNULL(Phone, 'Not Provided') AS Phone
FROM Customers;  -- SQL Server
```

---

### B. Duplicate Rows — Detection
```sql
-- Find duplicates by email
SELECT Email, COUNT(*) AS DuplicateCount
FROM Customers
GROUP BY Email
HAVING COUNT(*) > 1;
```

---

### C. Duplicate Rows — Removal (Keep Latest)
```sql
WITH Deduplicated AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email
               ORDER BY CreatedDate DESC
           ) AS rn
    FROM Customers
)
SELECT * FROM Deduplicated WHERE rn = 1;
```
👉 Keeps only the most recent record per email, removes all older duplicates.

---

### D. Inconsistent Text Casing & Trailing Spaces
```sql
-- Standardize: UPPER + TRIM
SELECT UPPER(TRIM(Department)) AS CleanDept
FROM Employees;

-- Clean both leading and trailing spaces
SELECT LTRIM(RTRIM(Name)) AS CleanName
FROM Employees;  -- SQL Server

-- PostgreSQL / MySQL
SELECT TRIM(Name) AS CleanName FROM Employees;
```

---

### E. Type Conversion & Format Standardization
```sql
-- Convert string to date
SELECT CAST('2024-01-15' AS DATE) AS CleanDate;

-- Convert string to integer
SELECT CAST(Revenue AS INT) AS CleanRevenue;

-- Convert string to decimal
SELECT CONVERT(DECIMAL(10,2), Price) AS CleanPrice;  -- SQL Server
```

---

### F. Detecting Outliers & Anomalies
```sql
-- Find transactions with suspicious amounts
SELECT *
FROM Transactions
WHERE Amount < 0 OR Amount > 1000000;

-- Find employees with unrealistic ages
SELECT * FROM Employees WHERE Age < 18 OR Age > 80;
```

---

### G. Standardizing Categories
```sql
-- Normalize inconsistent department names
UPDATE Employees
SET Department = CASE
    WHEN UPPER(TRIM(Department)) LIKE '%IT%' THEN 'IT'
    WHEN UPPER(TRIM(Department)) LIKE '%HUMAN%' THEN 'HR'
    WHEN UPPER(TRIM(Department)) LIKE '%FIN%' THEN 'Finance'
    ELSE Department
END;
```

---

### H. Handling Empty Strings vs NULL
```sql
-- Convert empty strings to NULL
UPDATE Employees
SET Email = NULL
WHERE TRIM(Email) = '';

-- Find rows with either NULL or empty phone
SELECT * FROM Customers
WHERE Phone IS NULL OR TRIM(Phone) = '';
```

---

## 5. Data Profiling — Know Your Data Before Cleaning
```sql
-- Quick profile: total rows, NULLs, distinct values, min/max
SELECT
    COUNT(*)                          AS TotalRows,
    COUNT(Salary)                     AS NonNullSalary,
    COUNT(*) - COUNT(Salary)          AS NullSalaryCount,
    COUNT(DISTINCT Department)        AS UniqueDepts,
    MIN(Salary)                       AS MinSalary,
    MAX(Salary)                       AS MaxSalary,
    AVG(Salary)                       AS AvgSalary
FROM Employees;
```

---

## 6. Data Cleaning Workflow Checklist

| Step | Action | SQL Tools |
| :--- | :--- | :--- |
| **1. Profile** | Understand shape, types, NULLs | `COUNT`, `MIN`, `MAX`, `DISTINCT` |
| **2. Deduplicate** | Remove duplicate rows | `ROW_NUMBER() OVER PARTITION BY` |
| **3. Handle NULLs** | Replace or flag missing values | `COALESCE`, `ISNULL`, `IS NULL` |
| **4. Standardize Text** | Fix casing, trim spaces | `UPPER`, `LOWER`, `TRIM`, `REPLACE` |
| **5. Fix Types** | Convert string to date/int/decimal | `CAST`, `CONVERT`, `TRY_CAST` |
| **6. Remove Outliers** | Flag or remove anomalous values | `WHERE`, `BETWEEN`, `CASE` |
| **7. Validate** | Check cleaned data against rules | `HAVING COUNT(*) > 0`, assertions |

---

## 7. Safe Cleaning with TRY_CAST (SQL Server)
```sql
-- Safely attempt type conversion — returns NULL instead of error
SELECT TRY_CAST(Revenue AS DECIMAL(10,2)) AS SafeRevenue
FROM RawData;
```
👉 If conversion fails, returns `NULL` instead of throwing an error. Safe for batch processing.

---

## 8. Real Data Analyst Scenarios
- **E-commerce**: Clean product price fields imported from multiple CSV sources with mixed formats.
- **Finance**: Deduplicate transaction logs from two merged banking systems.
- **HR**: Standardize department name inconsistencies across 5 years of records.
- **Marketing**: Fix email case inconsistencies before email campaign list building.

---

## 9. Common Mistakes
> [!WARNING]
> - Deleting rows without first auditing what you're removing — always `SELECT` before `DELETE`.
> - Using `= NULL` instead of `IS NULL` — NULL comparisons must use `IS NULL`.
> - Forgetting to handle empty strings (`''`) separately from `NULL`.
> - Running `UPDATE` / `DELETE` without a `WHERE` clause — affects every row!

---

## 10. Key Takeaways
- Data cleaning is 60–80% of a real analyst's job — master it in SQL.
- **Profile first**: always audit data before modifying it.
- **Deduplicate** with `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)`.
- **Replace NULLs** with `COALESCE` or `ISNULL`.
- **Standardize** with `UPPER()`, `LOWER()`, `TRIM()`, `REPLACE()`.
- **Convert types** safely with `TRY_CAST` (SQL Server) or `CAST`.
- Always `SELECT` first — then `UPDATE` or `DELETE`.
