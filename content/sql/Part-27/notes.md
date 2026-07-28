# 1.2.7 String Functions (CONCAT, SUBSTRING, TRIM, UPPER, LOWER, REPLACE, LENGTH, LEFT, RIGHT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: String functions manipulate text values to format names, clean messy data, extract substrings, and prepare raw data for joins and reporting.

## 1. What are they?
String functions manipulate text values in SQL. They help format names, clean messy data, and extract useful substrings.

## 2. Why do we need them?
- Data often comes messy (extra spaces, mixed case, partial codes).  
- Reports need clean, consistent text.  
- Analysts must extract or transform text for joins, grouping, or dashboards.  

## 3. Real-world Analogy
- **CONCAT** → Joining first name + last name.  
- **SUBSTRING** → Cutting a slice of text.  
- **TRIM** → Removing extra wrapping spaces.  
- **UPPER/LOWER** → Changing case (shouting vs whispering).  
- **REPLACE** → Find & replace text.  
- **LENGTH** → Counting letters in a word.  
- **LEFT/RIGHT** → Taking first or last few characters.  

## 4. Example Dataset
**Employees Table**

| EmployeeID | FirstName | LastName | Email |
| :--- | :--- | :--- | :--- |
| **1** | Alice | Smith | `alice@company.com` |
| **2** | Bob | Brown | `bob@company.com` |
| **3** | Carol | Jones | `NULL` |

## 5. CONCAT
```sql
SELECT CONCAT(FirstName, ' ', LastName) AS FullName
FROM Employees;
```
👉 Alice Smith, Bob Brown, Carol Jones.

## 6. SUBSTRING
```sql
SELECT SUBSTRING(Email, 1, 5) AS Prefix
FROM Employees;
```
👉 alice, bob@c, carol.

## 7. TRIM
```sql
SELECT TRIM('   SQL   ') AS CleanText;
```
👉 Returns `SQL`.

## 8. UPPER / LOWER
```sql
SELECT UPPER(FirstName) AS ShoutName,
       LOWER(LastName) AS WhisperName
FROM Employees;
```
👉 ALICE / smith.

## 9. REPLACE
```sql
SELECT REPLACE(Email, 'company.com', 'org.com') AS NewEmail
FROM Employees;
```
👉 `alice@org.com`, `bob@org.com`.

## 10. LENGTH
```sql
SELECT FirstName, LENGTH(FirstName) AS NameLength
FROM Employees;
```
👉 Alice → 5, Bob → 3.

## 11. LEFT
```sql
SELECT LEFT(LastName, 2) AS Initials
FROM Employees;
```
👉 Sm, Br, Jo.

## 12. RIGHT
```sql
SELECT RIGHT(Email, 3) AS DomainSuffix
FROM Employees;
```
👉 com.

## 13. Advanced Example (Combined)
```sql
SELECT CONCAT(UPPER(LEFT(FirstName,1)), LOWER(SUBSTRING(FirstName,2))) AS ProperCase
FROM Employees;
```
👉 Converts names to proper case (Alice, Bob, Carol).

## 14. Real Analyst Scenarios
- **HR**: Standardize employee names.  
- **Finance**: Extract codes from transaction IDs.  
- **Marketing**: Clean customer emails.  
- **Ecommerce**: Format product SKUs.  

## 15. Expected Output
Clean, formatted text ready for reporting.

## 16. Visual Explanation
```text
CONCAT      → Join
SUBSTRING   → Slice
TRIM        → Clean edges
UPPER/LOWER → Case change
REPLACE     → Swap text
LENGTH      → Count characters
LEFT/RIGHT  → Extract ends
```

## 17. Behind the Scenes
Database engine manipulates text at character level, often using memory buffers.

## 18. Common Mistakes
> [!WARNING]
> - Forgetting `TRIM` → mismatched joins due to trailing spaces.  
> - Using wrong start index in `SUBSTRING`.  
> - Assuming `LENGTH` counts bytes vs characters.  

## 19. Interview Questions
- **Beginner**: What does `CONCAT` do?  
- **Intermediate**: Difference between `SUBSTRING` and `LEFT`/`RIGHT`?  
- **Advanced**: How does `LENGTH` behave with Unicode?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `TRIM` remove spaces inside the string?  
> **A**: No, `TRIM` only removes leading and trailing spaces. Use `REPLACE(str, ' ', '')` for internal spaces.  

## 21. Performance Notes
> [!TIP]
> - String functions can slow queries if applied to large text columns inside `WHERE`.  
> - Wrapping indexed columns in string functions disables index usage.  

## 22. Best Practices
- Clean data at ETL stage when possible.  
- Use aliases for readability.  
- Avoid excessive nesting of string functions.  

## 23. Common Business Use Cases
- HR: Proper case names.  
- Finance: Extract year from transaction code.  
- Marketing: Replace old domain in emails.  
- Ecommerce: Count SKU length.  

## 24. Comparison Table
| Function | Purpose | Example |
| :--- | :--- | :--- |
| **CONCAT** | Join strings | First + Last name |
| **SUBSTRING** | Slice text | First 5 chars |
| **TRIM** | Remove spaces | Clean input |
| **UPPER/LOWER** | Case change | ALICE / alice |
| **REPLACE** | Swap text | Change domain |
| **LENGTH** | Count chars | Name length |
| **LEFT/RIGHT** | Extract ends | Initials, suffix |

## 25. Memory Tricks
> [!TIP]
> - **CONCAT** = “Connect.”  
> - **SUBSTRING** = “Sub‑slice.”  
> - **TRIM** = “Trim edges.”  
> - **UPPER/LOWER** = “Shout/Whisper.”  
> - **REPLACE** = “Find & Replace.”  
> - **LENGTH** = “Count letters.”  
> - **LEFT/RIGHT** = “Take ends.”  

## 26. Cheat Sheet
```sql
CONCAT(a,b)               → Join
SUBSTRING(str, start, len)→ Slice
TRIM(str)                 → Clean
UPPER(str)                → CAPS
LOWER(str)                → small
REPLACE(str, old, new)    → Swap
LENGTH(str)               → Count
LEFT(str,n)               → First n chars
RIGHT(str,n)              → Last n chars
```

## 27. Summary
String functions clean, transform, and format text. They’re essential for analysts working with messy or inconsistent data.  
