# 1.0.10 LIKE & Wildcards (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LIKE` searches for a specified pattern inside string columns using wildcards (`%` for any sequence of characters, `_` for exactly one character).

## 1. What is it?
The `LIKE` operator performs pattern-matching searches on text columns using wildcard symbols to represent unknown or variable characters.

## 2. Definition
`LIKE` compares a column's string value to a pattern that can include literal characters and wildcard placeholders.

## 3. Why do we need it?
- Search for names/emails/descriptions that partially match a pattern.
- Filter rows where exact values are unknown.
- Build flexible text-based search criteria.

## 4. Real-world Analogy
Think of Google Search's autocomplete — typing "data" matches "data analyst," "data engineer," "database," etc. `LIKE` does the same inside SQL.

---

## 5. Wildcard Symbols

| Wildcard | Meaning | Example Pattern | Matches |
| :--- | :--- | :--- | :--- |
| `%` | Zero, one, or many characters | `'A%'` | Alice, Amber, A, Abc123 |
| `_` | Exactly one single character | `'B_b'` | Bob, Bab, Bcb |

---

## 6. Common Patterns Cheat Sheet

| Pattern | What it Matches |
| :--- | :--- |
| `'A%'` | Starts with "A" |
| `'%son'` | Ends with "son" |
| `'%data%'` | Contains "data" anywhere |
| `'A_'` | 2 characters, starts with "A" |
| `'_o_'` | 3-letter word with "o" in middle |
| `'__r%'` | Third character is "r" |

---

## 7. Example Dataset
**Employees Table**

| EmployeeID | Name | Email | Department |
| :--- | :--- | :--- | :--- |
| **1** | Alice | alice@company.com | HR |
| **2** | Bob | bob@company.com | IT |
| **3** | Carol | carol@company.com | Finance |
| **4** | David | david@external.org | IT |
| **5** | Emma | emma@company.com | HR |

---

## 8. Starts With — LIKE 'A%'
```sql
SELECT Name
FROM Employees
WHERE Name LIKE 'A%';
```

**Output:**

| Name |
| :--- |
| Alice |

👉 Only names beginning with "A".

---

## 9. Ends With — LIKE '%l'
```sql
SELECT Name
FROM Employees
WHERE Name LIKE '%l';
```

**Output:**

| Name |
| :--- |
| Carol |

👉 Only names ending in "l".

---

## 10. Contains — LIKE '%@company%'
```sql
SELECT Name, Email
FROM Employees
WHERE Email LIKE '%@company%';
```
👉 Finds employees with company domain email addresses.

---

## 11. Single Character Wildcard — LIKE '_o_'
```sql
SELECT Name
FROM Employees
WHERE Name LIKE '_o_';
```

**Output:**

| Name |
| :--- |
| Bob |

👉 Matches exactly 3-character names with "o" in the middle.

---

## 12. NOT LIKE
```sql
SELECT Name, Email
FROM Employees
WHERE Email NOT LIKE '%@company.com';
```
👉 Returns employees with non-company email domains: David.

---

## 13. Case Sensitivity

| Database | LIKE Case Sensitive? | Case-Insensitive Option |
| :--- | :--- | :--- |
| **MySQL** | No (default) | Use `LIKE BINARY` for sensitive |
| **PostgreSQL** | Yes | Use `ILIKE` for insensitive |
| **SQL Server** | Depends on collation | Use `COLLATE` clause |

> [!TIP]
> In PostgreSQL, use `ILIKE` instead of `LIKE` for case-insensitive pattern matching:
> ```sql
> WHERE Name ILIKE 'alice%';
> ```

---

## 14. Escaping Wildcards
If you want to search for a literal `%` or `_` character, use the `ESCAPE` clause:
```sql
SELECT * FROM Products WHERE Name LIKE '100\%' ESCAPE '';
```
👉 Searches for names literally containing "100%".

---

## 15. Real Data Analyst Scenarios
- **HR**: Find all employees with names starting with a specific letter.
- **Marketing**: Filter email lists by domain pattern.
- **Finance**: Find invoice numbers matching a prefix pattern.
- **Customer Service**: Search order notes containing specific keywords.

---

## 16. Common Mistakes
> [!WARNING]
> - Using `LIKE` without wildcards (e.g., `LIKE 'Alice'`) is the same as `= 'Alice'` — pointless but valid.
> - Placing `%` at the start (`'%Alice'`) forces a full-table scan and is slow on large tables.
> - Forgetting that `_` matches **exactly one** character (not zero or multiple).

---

## 17. Key Takeaways
- `%` matches any number of characters (including zero).
- `_` matches exactly one character.
- `NOT LIKE` excludes pattern matches.
- Use `ILIKE` in PostgreSQL for case-insensitive matching.
- Leading wildcards (`'%value'`) are slow — avoid on large datasets without indexes.
