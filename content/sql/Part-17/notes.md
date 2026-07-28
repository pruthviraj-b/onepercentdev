# 1.1.3 Constraints (NOT NULL, CHECK, DEFAULT, AUTO_INCREMENT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Constraints are rules applied to columns in a table to enforce data integrity, prevent bad inputs, and automate default values.

## 1. What is it?
Constraints are rules applied to columns in a table to enforce data integrity and consistency.

## 2. Definition
Constraints restrict the type of data that can be inserted into a column. They ensure values meet certain conditions.

## 3. Why do we need it?
Without constraints, databases can store invalid, duplicate, or meaningless data. Analysts would waste time cleaning instead of analyzing.

## 4. Real-world Analogy
Think of filling out a **bank form**:
- You can’t leave “Account Number” blank → **NOT NULL**  
- Age must be ≥ 18 → **CHECK**  
- Default branch = “Main” if you don’t specify → **DEFAULT**  
- Account ID auto‑generates → **AUTO_INCREMENT**

---

## 5. Mental Model
Constraints are **guardrails**: they keep data on track and prevent errors.

---

## 6. Syntax
```sql
CREATE TABLE Employees (
    EmployeeID SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    Salary NUMERIC(10,2) CHECK (Salary > 0),
    City VARCHAR(50) DEFAULT 'Unknown'
);
```

---

## 7. Anatomy of the Syntax
- **NOT NULL** → column must have a value.  
- **CHECK (condition)** → enforces logical rule.  
- **DEFAULT value** → assigns value if none provided.  
- **AUTO_INCREMENT / SERIAL** → auto‑generate unique IDs.

---

## 8. Rules
- `NOT NULL` prevents `NULL` entries.  
- `CHECK` must evaluate to `TRUE`.  
- `DEFAULT` applies only when no value is given.  
- `AUTO_INCREMENT` is supported differently across SQL dialects:  
  - MySQL → `AUTO_INCREMENT`  
  - PostgreSQL → `SERIAL` or `GENERATED AS IDENTITY`  
  - SQL Server → `IDENTITY`

---

## 9. Common Variations
- `CHECK (Age >= 18)`  
- `DEFAULT CURRENT_DATE`  
- `AUTO_INCREMENT` vs `SERIAL` vs `IDENTITY`

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Salary | City |
| :--- | :--- | :--- | :--- |
| **1** | Alice | `50000` | Unknown |
| **2** | Bob | `60000` | Chicago |
| **3** | Carol | `70000` | Boston |

---

## 11. Basic Example (NOT NULL)
```sql
CREATE TABLE Students (
    StudentID SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);
```
👉 You cannot insert a student without a name.

---

## 12. Intermediate Example (CHECK)
```sql
CREATE TABLE Accounts (
    AccountID SERIAL PRIMARY KEY,
    Balance NUMERIC(12,2) CHECK (Balance >= 0)
);
```
👉 Prevents negative balances.

---

## 13. Advanced Example (DEFAULT + AUTO_INCREMENT)
```sql
CREATE TABLE Orders (
    OrderID SERIAL PRIMARY KEY,
    OrderDate DATE DEFAULT CURRENT_DATE,
    Status VARCHAR(20) DEFAULT 'Pending'
);
```
👉 Auto‑generates IDs, defaults to today’s date and “Pending”.

---

## 14. Real Analyst Scenarios
- **HR**: Enforce salary > 0.  
- **Finance**: Prevent negative transactions.  
- **Marketing**: Default campaign status = “Active”.  
- **Ecommerce**: Auto‑generate order IDs.

---

## 15. Expected Output
When inserting:
```sql
INSERT INTO Orders (Status) VALUES ('Completed');
INSERT INTO Orders DEFAULT VALUES;
```

**Output Table:**

| OrderID | OrderDate | Status |
| :--- | :--- | :--- |
| **1** | `2026-07-24` | Completed |
| **2** | `2026-07-24` | Pending |

---

## 16. Visual Explanation
```text
Insert Row → Apply Constraints → Accept or Reject
```

---

## 17. Behind the Scenes
- `NOT NULL` → database checks for missing values.  
- `CHECK` → evaluates condition logic.  
- `DEFAULT` → fills in missing values.  
- `AUTO_INCREMENT` → increments sequence counter.

---

## 18. Common Mistakes
> [!WARNING]
> - Forgetting `NOT NULL` → leads to missing critical data.  
> - Misusing `CHECK` with wrong logic.  
> - Assuming `DEFAULT` applies when `NULL` is explicitly inserted (it doesn’t).  
> - Confusing `AUTO_INCREMENT` syntax across dialects.  

---

## 19. Interview Questions
- **Beginner**: What does `NOT NULL` do?  
- **Intermediate**: Difference between `DEFAULT` and `CHECK`?  
- **Advanced**: How does `AUTO_INCREMENT` differ in MySQL vs PostgreSQL?  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `DEFAULT` apply when you explicitly insert `NULL`?  
> **A**: No, `DEFAULT` only applies when no value is provided in the `INSERT` column list.  

---

## 21. Performance Notes
> [!TIP]
> - Constraints add minor validation overhead during writes, but guarantee 100% data integrity.  
> - `AUTO_INCREMENT` sequence generators are optimized at the engine level.  

---

## 22. Best Practices
- Always use `NOT NULL` for required fields.  
- Use `CHECK` for business rules.  
- Use `DEFAULT` for common values.  
- Use `AUTO_INCREMENT` for surrogate primary keys.  

---

## 23. Common Business Use Cases
- HR: Enforce non‑NULL employee names.  
- Finance: Prevent negative balances.  
- Marketing: Default campaign status.  
- Ecommerce: Auto‑generate order IDs.  

---

## 24. Comparison Table
| Constraint | Purpose | Example |
| :--- | :--- | :--- |
| **NOT NULL** | Required field | `Name NOT NULL` |
| **CHECK** | Logical rule | `Salary > 0` |
| **DEFAULT** | Auto value | `Status DEFAULT 'Active'` |
| **AUTO_INCREMENT** | Auto ID | `OrderID SERIAL` |

---

## 25. Memory Tricks
> [!TIP]
> - **NOT NULL** = “Never Empty”  
> - **CHECK** = “Condition Gate”  
> - **DEFAULT** = “Fill Automatically”  
> - **AUTO_INCREMENT** = “Count Up”  

---

## 26. Cheat Sheet
```sql
NOT NULL       → Must have value
CHECK          → Enforce condition
DEFAULT        → Auto assign
AUTO_INCREMENT → Auto ID
```

---

## 27. Summary
- Constraints enforce integrity.  
- `NOT NULL`, `CHECK`, `DEFAULT`, `AUTO_INCREMENT` are core.  
- Analysts must master them for reliable tables.  

---

## 28. Practice Questions
- **Easy**: Create table with `NOT NULL` name.  
- **Medium**: Add `CHECK` for salary > 0.  
- **Hard**: Create table with `DEFAULT` status and `AUTO_INCREMENT` ID.  

---

## 29. Interview Practice Queries
- Write query to create `Orders` table with constraints.  
- Explain difference between `DEFAULT` and `CHECK` with examples.  

---

## 30. Hands-on Exercises
- Create table for `Products` with `price > 0`.  
- Add `DEFAULT stock = 100`.  

---

## 31. Mini Project Usage
Design a **Banking Database**:
- Customers table (`NOT NULL` names).  
- Accounts table (`CHECK` balance ≥ 0).  
- Transactions table (`DEFAULT` status).  
- Auto‑generated IDs for all.  

---

## 32. Key Takeaways
- Constraints = rules for clean data.  
- `NOT NULL` prevents missing values.  
- `CHECK` enforces logic.  
- `DEFAULT` fills gaps.  
- `AUTO_INCREMENT` generates IDs.  
