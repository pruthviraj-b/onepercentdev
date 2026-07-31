import json
import os

parts_data = {}

# ---------------------------------------------------------
# Part 3: 1.0.3 SQL Operators
# ---------------------------------------------------------
parts_data[3] = {
    "title": "1.0.3 SQL Operators",
    "content": """# 1.0.3 SQL Operators (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Operators in SQL are special symbols or keywords that let you perform operations on data — comparing values, combining conditions, or calculating values.

## 1. What is it?
Operators in SQL are special symbols or keywords that let you perform operations on data — like comparing values, combining conditions, or doing math.

## 2. Definition
An **operator** is a reserved symbol or word used in SQL to perform arithmetic, comparison, logical, or other operations on values in queries.

## 3. Why do we need it?
Operators allow analysts to:
- Filter rows (`WHERE Salary > 50000`)  
- Combine conditions (`AND`, `OR`)  
- Perform calculations (`Salary * 1.1`)  
- Check membership (`IN`, `BETWEEN`)  

Without operators, queries would be static and powerless.

## 4. Real-world Analogy
Think of operators as the “verbs” in everyday life:
- **Arithmetic** → Adding items to a bill  
- **Comparison** → Checking if a cricket score is greater than 200  
- **Logical** → Deciding if a student passed both math **and** science  

## 5. Mental Model
Operators are **bridges** between values. They connect two sides (left operand and right operand) and produce a result.

## 6. Syntax
Examples:
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary > 60000 AND Department = 'IT';
```

## 7. Anatomy of the Syntax
- **Salary > 60000** → Comparison operator (`>`)  
- **AND** → Logical operator combining conditions  
- **Department = 'IT'** → Equality operator  

## 8. Rules
- Operands must be compatible with operator type.  
- Logical operators combine boolean results.  
- Operator precedence matters (`AND` before `OR`).  

## 9. Common Variations
- **Arithmetic**: `+`, `-`, `*`, `/`  
- **Comparison**: `=`, `!=`, `<`, `>`, `<=`, `>=`  
- **Logical**: `AND`, `OR`, `NOT`  
- **Special**: `IN`, `BETWEEN`, `LIKE`, `IS NULL`  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name
FROM Employees
WHERE Salary > 60000;
```

**Output:**

| Name |
| :--- |
| Carol |
| David |

## 12. Intermediate Example
```sql
SELECT Name, Salary
FROM Employees
WHERE Department = 'HR' AND Salary BETWEEN 50000 AND 55000;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Alice | `50000` |
| Emma | `52000` |

## 13. Advanced Example
```sql
SELECT Name, City
FROM Employees
WHERE City IN ('New York', 'Boston')
  AND Salary >= 60000
  OR Department = 'Finance';
```

## 14. Real Data Analyst Scenarios
- **HR**: Filter employees with salary above threshold.  
- **Finance**: Identify transactions between two amounts.  
- **Marketing**: Select customers from specific cities.  

## 15. Expected Output
| Name | City |
| :--- | :--- |
| Carol | Boston |
| Emma | New York |

## 16. Visual Explanation
```text
Condition 1: Salary >= 60000
Condition 2: City IN (New York, Boston)
Condition 3: Department = Finance
Final Result = (Cond1 AND Cond2) OR Cond3
```

## 17. Behind the Scenes
Database evaluates operators in order of precedence:
1. Arithmetic  
2. Comparison  
3. Logical (`NOT` → `AND` → `OR`)  

## 18. Common Mistakes
> [!WARNING]
> - Forgetting parentheses in complex conditions.  
> - Using `=` instead of `IN` for multiple values.  
> - Misusing `LIKE` without `%`.  

## 19. Interview Questions
- **Beginner**: Difference between `=` and `IN`?  
- **Intermediate**: Explain operator precedence in SQL.  
- **Advanced**: How does `BETWEEN` handle boundaries?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Is `BETWEEN 10 AND 20` inclusive?  
> **A**: Yes, it includes both 10 and 20.  

## 21. Performance Notes
> [!TIP]
> - Use indexed columns with operators for maximum query speed.  
> - Avoid functions on columns inside `WHERE` (slows down execution).  

## 22. Best Practices
- Use parentheses for clarity.  
- Prefer `IN` for multiple values.  
- Use `IS NULL` instead of `= NULL`.  

## 23. Common Business Use Cases
- **Finance**: Transactions between amounts.  
- **HR**: Filter active employees.  
- **Ecommerce**: Customers from specific regions.  

## 24. Comparison Table
| Operator | Purpose | Example |
| :--- | :--- | :--- |
| `=` | Equality | `Salary = 50000` |
| `IN` | Membership | `City IN ('NY','LA')` |
| `BETWEEN` | Range | `Salary BETWEEN 50k AND 70k` |
| `LIKE` | Pattern | `Name LIKE 'A%'` |

## 25. Memory Tricks
> [!TIP]
> - **IN** = “in the list”  
> - **BETWEEN** = “sandwiched”  
> - **LIKE** = “pattern match”  

## 26. Cheat Sheet
- Arithmetic: `+ - * /`  
- Comparison: `= != < > <= >=`  
- Logical: `AND OR NOT`  
- Special: `IN BETWEEN LIKE IS NULL`  

## 27. Summary
- Operators are the tools for filtering and calculating.  
- Precedence matters.  
- Use correct operator for clarity.  

## 28. Practice Questions
- **Easy**: Find employees in IT department.  
- **Medium**: Find employees with salary between 55k and 65k.  
- **Hard**: Find employees in New York OR Finance department with salary > 60k.  

## 29. Interview Practice Queries
- Write query to find employees whose names start with “A” and salary > 50k.  
- Explain difference between `IN` and multiple `OR` conditions.  

## 30. Hands-on Exercises
- Create queries using `BETWEEN`, `LIKE`, `IN`.  
- Test operator precedence with parentheses.  

## 31. Mini Project Usage
Design a **Recruitment Filter Tool**:
- Candidates with GPA > 3.5  
- From specific universities (`IN`)  
- Graduated between 2020–2022 (`BETWEEN`)  

## 32. Key Takeaways
- Operators are essential for dynamic queries.  
- Know precedence rules.  
- Use the right operator for the right job.  
"""
}

# ---------------------------------------------------------
# Part 4: 1.0.4 SELECT
# ---------------------------------------------------------
parts_data[4] = {
    "title": "1.0.4 SELECT",
    "content": """# 1.0.4 SELECT (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `SELECT` is the foundation of all SQL data retrieval — it specifies which columns or expressions to display from your tables.

## 1. What is it?
`SELECT` is the SQL command used to retrieve data from a database. It’s how analysts “ask questions” of their tables.

## 2. Definition
The `SELECT` statement specifies which columns (or expressions) you want to display from one or more tables.

## 3. Why do we need it?
Without `SELECT`, you can’t view or analyze data. It’s the gateway to insights — every report, dashboard, and analysis starts with it.

## 4. Real-world Analogy
Think of a **library catalog**:  
- You don’t take the whole library home.  
- You “select” the specific books you want.  
Similarly, `SELECT` lets you pick the exact columns/rows you need.

## 5. Mental Model
Visualize a giant spreadsheet. `SELECT` is like highlighting the columns you want to copy into a new sheet.

## 6. Syntax
```sql
SELECT column_name(s)
FROM table_name
WHERE condition
GROUP BY column_name
HAVING condition
ORDER BY column_name;
```

## 7. Anatomy of the Syntax
- **SELECT** → choose columns  
- **FROM** → specify table  
- **WHERE** → filter rows  
- **GROUP BY** → aggregate rows  
- **HAVING** → filter groups  
- **ORDER BY** → sort results  

## 8. Rules
- `SELECT *` returns all columns.  
- Aliases (`AS`) rename columns.  
- Expressions allowed (e.g., `Salary * 1.1`).  
- Clause order matters.  

## 9. Common Variations
- `SELECT *` → all columns  
- `SELECT DISTINCT` → unique values  
- `SELECT column AS alias` → rename  
- `SELECT expressions` → calculations  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name, Salary
FROM Employees;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Alice | `50000` |
| Bob | `60000` |
| Carol | `70000` |
| David | `65000` |
| Emma | `52000` |

## 12. Intermediate Example
```sql
SELECT DISTINCT Department
FROM Employees;
```

**Output:**

| Department |
| :--- |
| HR |
| IT |
| Finance |

## 13. Advanced Example
```sql
SELECT Department, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Department
HAVING AVG(Salary) > 55000
ORDER BY AvgSalary DESC;
```

**Output:**

| Department | AvgSalary |
| :--- | :--- |
| Finance | `70000` |
| IT | `62500` |

## 14. Real Data Analyst Scenarios
- **HR**: List employees with salaries above threshold.  
- **Finance**: Average salary per department.  
- **Marketing**: Distinct customer segments.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
**Query Execution Order Diagram**:
```text
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
```

## 17. Behind the Scenes
Database engine first collects rows (`FROM`), filters them (`WHERE`), groups them (`GROUP BY`), applies group conditions (`HAVING`), then selects columns (`SELECT`), and finally orders (`ORDER BY`).

## 18. Common Mistakes
> [!WARNING]
> - Using `SELECT *` in production (inefficient and slow).  
> - Forgetting column aliases.  
> - Misplacing clause execution sequence.  

## 19. Interview Questions
- **Beginner**: What does `SELECT *` do?  
- **Intermediate**: Difference between `DISTINCT` and `GROUP BY`?  
- **Advanced**: Explain SQL query execution order.  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can you use column aliases in the `WHERE` clause?  
> **A**: No, because `WHERE` is evaluated by the SQL engine *before* `SELECT`.  

## 21. Performance Notes
> [!TIP]
> - Avoid `SELECT *` in production environments.  
> - Use indexes with `WHERE` for speed.  
> - Aggregations can be computational costly.  

## 22. Best Practices
- Always specify required columns explicitly.  
- Use aliases for clarity.  
- Keep queries readable.  

## 23. Common Business Use Cases
- HR salary reports.  
- Finance payroll summaries.  
- Marketing campaign segmentation.  

## 24. Comparison
- **DISTINCT vs GROUP BY**: `DISTINCT` removes duplicates; `GROUP BY` aggregates.  
- **SELECT vs SELECT INTO**: `SELECT` retrieves data; `SELECT INTO` creates a new table.  

## 25. Memory Tricks
> [!TIP]
> Think of SELECT as **“Show me these columns.”**

## 26. Cheat Sheet
- `SELECT *` → All columns  
- `SELECT DISTINCT` → Unique values  
- `SELECT col AS alias` → Rename column  
- `SELECT expression` → Calculation  

## 27. Summary
- `SELECT` retrieves data.  
- Clause execution order matters.  
- Variations allow filtering, grouping, and calculations.  

## 28. Practice Questions
- **Easy**: Select all employees in IT.  
- **Medium**: Find distinct cities.  
- **Hard**: Find departments with avg salary > 60k.  

## 29. Interview Practice Queries
- Write a query to find the top 2 highest salaries per department.  
- Explain the difference between `DISTINCT` and `GROUP BY`.  

## 30. Hands-on Exercises
- Select employees earning above 55k.  
- Find unique departments.  

## 31. Mini Project Usage
Build a **Department Salary Report** using `SELECT`, `GROUP BY`, `HAVING`, and `ORDER BY`.

## 32. Key Takeaways
- `SELECT` is the foundation of SQL.  
- Always specify needed columns.  
- Use variations for distinct, aliases, and calculations.  
"""
}

# ---------------------------------------------------------
# Part 5: 1.0.5 WHERE
# ---------------------------------------------------------
parts_data[5] = {
    "title": "1.0.5 WHERE",
    "content": """# 1.0.5 WHERE (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `WHERE` filters table rows before grouping or aggregation, including only rows that meet your specific logical conditions.

## 1. What is it?
`WHERE` is the SQL clause used to filter rows in a query. It decides **which rows** from a table should be included in the result set.

## 2. Definition
The `WHERE` clause specifies a condition that each row must satisfy to be returned by the query.

## 3. Why do we need it?
Without `WHERE`, queries return all rows. Analysts need `WHERE` to:
- Focus on relevant data  
- Apply business rules  
- Answer specific questions  

## 4. Real-world Analogy
Think of **Amazon shopping filters**:  
- You don’t want all products.  
- You filter by price, brand, or rating.  
That’s exactly what `WHERE` does in SQL.

## 5. Mental Model
Visualize a sieve: the table is poured in, and only rows matching the condition pass through.

## 6. Syntax
```sql
SELECT column_name(s)
FROM table_name
WHERE condition;
```

## 7. Anatomy of the Syntax
- **SELECT** → choose columns  
- **FROM** → choose table  
- **WHERE condition** → filter rows based on logic  

## 8. Rules
- Conditions must evaluate to `TRUE` for a row to be included.  
- Multiple conditions can be combined with `AND`, `OR`, `NOT`.  
- `WHERE` works *before* grouping (`GROUP BY`).  

## 9. Common Variations
- `WHERE column = value`  
- `WHERE column > value`  
- `WHERE column BETWEEN value1 AND value2`  
- `WHERE column IN (list)`  
- `WHERE column LIKE pattern`  
- `WHERE column IS NULL`  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name, Salary
FROM Employees
WHERE Department = 'IT';
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Bob | `60000` |
| David | `65000` |

## 12. Intermediate Example
```sql
SELECT Name, City
FROM Employees
WHERE Salary BETWEEN 50000 AND 60000
  AND City = 'New York';
```

**Output:**

| Name | City |
| :--- | :--- |
| Alice | New York |
| Emma | New York |

## 13. Advanced Example
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE (Department = 'IT' AND Salary > 62000)
   OR (Department = 'Finance' AND City = 'Boston');
```

**Output:**

| Name | Department | Salary |
| :--- | :--- | :--- |
| David | IT | `65000` |
| Carol | Finance | `70000` |

## 14. Real Data Analyst Scenarios
- **HR**: Filter active employees with salary > 60k.  
- **Finance**: Transactions between two amounts.  
- **Marketing**: Customers from specific regions.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Table → Apply WHERE filter → Only matching rows pass through → SELECT columns
```

## 17. Behind the Scenes
Database engine scans rows, evaluates condition, keeps only those where condition = `TRUE`.

## 18. Common Mistakes
> [!WARNING]
> - Using `=` instead of `IN` for multiple values.  
> - Forgetting single quotes around text string literals.  
> - Misusing `NULL` (must use `IS NULL`, not `= NULL`).  

## 19. Interview Questions
- **Beginner**: What does `WHERE` do?  
- **Intermediate**: Difference between `WHERE` and `HAVING`?  
- **Advanced**: Explain operator precedence in `WHERE` conditions.  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can `WHERE` filter aggregated results (like `SUM` or `AVG`)?  
> **A**: No, that’s `HAVING`. `WHERE` filters individual rows before aggregation.  

## 21. Performance Notes
> [!TIP]
> - Indexes make `WHERE` clauses run significantly faster.  
> - Avoid wrapping indexed columns in functions in `WHERE` clauses.  

## 22. Best Practices
- Use `IN` for multiple values.  
- Use parentheses for logical clarity.  
- Always handle `NULL` values explicitly.  

## 23. Common Business Use Cases
- HR: Employees in specific departments.  
- Finance: Transactions above threshold.  
- Ecommerce: Customers from target cities.  

## 24. Comparison
- **WHERE vs HAVING**: `WHERE` filters rows; `HAVING` filters aggregated groups.  
- **WHERE vs ON (JOIN)**: `WHERE` filters after joining; `ON` defines the join logic.  

## 25. Memory Tricks
> [!TIP]
> Think of WHERE as **“Which rows?”**

## 26. Cheat Sheet
- `=` → Equals  
- `!=` → Not equal  
- `>` `<` → Greater/less than  
- `BETWEEN` → Range  
- `IN` → List of values  
- `LIKE` → Pattern matching  
- `IS NULL` → Missing values  

## 27. Summary
- `WHERE` filters rows.  
- Evaluated before grouping.  
- Essential for focused data analysis.  

## 28. Practice Questions
- **Easy**: Find employees in HR.  
- **Medium**: Find employees with salary > 55k.  
- **Hard**: Find IT employees in Seattle with salary > 62k.  

## 29. Interview Practice Queries
- Write a query to find employees whose names start with “A” and salary > 50k.  
- Explain the difference between `WHERE` and `HAVING` with examples.  

## 30. Hands-on Exercises
- Filter employees by city.  
- Find employees with salary between 60k and 70k.  

## 31. Mini Project Usage
Design a **Recruitment Filter Tool**:
- Candidates with GPA > 3.5  
- From specific universities (`IN`)  
- Graduated between 2020–2022 (`BETWEEN`)  

## 32. Key Takeaways
- `WHERE` is the core row filter clause.  
- Always use correct comparison operators.  
- `WHERE` executes before aggregation.  
"""
}

# ---------------------------------------------------------
# Part 6: 1.0.6 Comparison operators
# ---------------------------------------------------------
parts_data[6] = {
    "title": "1.0.6 Comparison operators",
    "content": """# 1.0.6 Comparison Operators (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Comparison operators evaluate left and right operands and return Boolean results (`TRUE`, `FALSE`, or `UNKNOWN`).

## 🔑 Core SQL Comparison Operators

| Operator | Meaning | Example | Result |
| :--- | :--- | :--- | :--- |
| `=` | Equal to | `Salary = 60000` | TRUE if salary is 60000 |
| `!=` / `<>` | Not equal to | `City <> 'Boston'` | TRUE if city is not Boston |
| `>` | Greater than | `Salary > 50000` | TRUE if salary above 50k |
| `<` | Less than | `Salary < 50000` | TRUE if salary below 50k |
| `>=` | Greater than or equal | `Salary >= 60000` | TRUE if salary ≥ 60k |
| `<=` | Less than or equal | `Salary <= 50000` | TRUE if salary ≤ 50k |
| `BETWEEN` | Within range (inclusive) | `Salary BETWEEN 50000 AND 70000` | TRUE if salary is 50k–70k |
| `IN` | Matches any in list | `City IN ('NY','LA')` | TRUE if city is NY or LA |
| `LIKE` | Pattern match | `Name LIKE 'A%'` | TRUE if name starts with A |
| `IS NULL` | Checks for NULL | `HireDate IS NULL` | TRUE if no hire date |
| `NOT` | Negates condition | `NOT (Salary > 60000)` | TRUE if salary ≤ 60k |

## 📊 Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 🧩 Basic Examples
```sql
-- Equal to
SELECT Name FROM Employees WHERE Salary = 60000;
```
**Output:** Bob  

```sql
-- Greater than
SELECT Name FROM Employees WHERE Salary > 60000;
```
**Output:** Carol, David  

## ⚙️ Intermediate Examples
```sql
-- Range filter
SELECT Name, Salary FROM Employees
WHERE Salary BETWEEN 50000 AND 60000;
```
**Output:** Alice, Bob, Emma  

```sql
-- Membership filter
SELECT Name, City FROM Employees
WHERE City IN ('New York','Boston');
```
**Output:** Alice, Emma, Carol  

## 🚀 Advanced Example
```sql
SELECT Name, Department, Salary
FROM Employees
WHERE (Department = 'IT' AND Salary > 62000)
   OR (Department = 'Finance' AND City = 'Boston');
```
**Output:** David, Carol  

## 📌 Analyst Scenarios
- **HR**: Filter employees with salary > 60k.  
- **Finance**: Transactions between 10k–50k.  
- **Marketing**: Customers in target cities (`IN`).  
- **Product**: Pattern match on SKU codes (`LIKE`).  

## ⚠️ Common Mistakes
> [!WARNING]
> - Forgetting single quotes around text string literals (`City = Boston` ❌ → `City = 'Boston'` ✅).  
> - Misusing `NULL` (must use `IS NULL`, not `= NULL`).  
> - Ignoring operator precedence (always use parentheses for clarity).  

## 🎯 Interview Prep
- **Beginner**: Difference between `=` and `IN`.  
- **Intermediate**: Is `BETWEEN` inclusive? (Yes, includes boundaries).  
- **Advanced**: Explain operator precedence in complex WHERE clauses.  

## ✅ Key Takeaways
- Comparison operators return Boolean results.  
- They are the backbone of filtering in SQL.  
- Always handle NULLs carefully.  
- Use parentheses to avoid logical errors.  
"""
}

# ---------------------------------------------------------
# Part 7: 1.0.7 Logical operators (AND, OR)
# ---------------------------------------------------------
parts_data[7] = {
    "title": "1.0.7 Logical operators (AND, OR)",
    "content": """# 1.0.7 Logical Operators (AND, OR, NOT) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Logical operators combine multiple Boolean expressions in a `WHERE` clause. `AND` requires all conditions to be true, while `OR` requires at least one.

## 1. What is it?
Logical operators in SQL (`AND`, `OR`, `NOT`) allow you to connect multiple filtering conditions together to form complex logical criteria.

## 2. Truth Tables

| Condition A | Condition B | A AND B | A OR B |
| :--- | :--- | :--- | :--- |
| `TRUE` | `TRUE` | **TRUE** | **TRUE** |
| `TRUE` | `FALSE` | **FALSE** | **TRUE** |
| `FALSE` | `TRUE` | **FALSE** | **TRUE** |
| `FALSE` | `FALSE` | **FALSE** | **FALSE** |

## 3. Operator Precedence
SQL evaluates logical operators in the following order:
1. `NOT`
2. `AND`
3. `OR`

> [!TIP]
> Always use parentheses `()` to explicitly define execution order and prevent unintended filtering logic!

## 4. Syntax & Examples
```sql
SELECT Name, Department, Salary, City
FROM Employees
WHERE (Department = 'IT' OR Department = 'HR')
  AND Salary >= 52000;
```

## 5. Key Takeaways
- `AND` narrows search results (more restrictive).  
- `OR` broadens search results (more permissive).  
- Use parentheses to control precedence.  
"""
}

# ---------------------------------------------------------
# Part 8: 1.0.8 BETWEEN
# ---------------------------------------------------------
parts_data[8] = {
    "title": "1.0.8 BETWEEN",
    "content": """# 1.0.8 BETWEEN Operator (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `BETWEEN` tests whether an expression falls within an inclusive range of values (min AND max).

## 1. Syntax
```sql
SELECT column_name
FROM table_name
WHERE column_name BETWEEN low_value AND high_value;
```

## 2. Inclusivity Rule
> [!NOTE]
> `BETWEEN` is **100% inclusive**. It includes both the `low_value` and `high_value` boundary points.
>
> `Salary BETWEEN 50000 AND 60000` is identical to `Salary >= 50000 AND Salary <= 60000`.

## 3. Code Example
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary BETWEEN 50000 AND 60000;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Alice | `50000` |
| Bob | `60000` |
| Emma | `52000` |

## 4. Using NOT BETWEEN
```sql
SELECT Name, Salary
FROM Employees
WHERE Salary NOT BETWEEN 50000 AND 60000;
```

## 5. Key Takeaways
- Works on Numbers, Dates, and Text.  
- Inclusive of start and end limits.  
"""
}

# ---------------------------------------------------------
# Part 9: 1.0.9 IN
# ---------------------------------------------------------
parts_data[9] = {
    "title": "1.0.9 IN",
    "content": """# 1.0.9 IN Operator (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `IN` checks whether a value matches any value in a specified list or subquery result.

## 1. Syntax
```sql
SELECT column_name
FROM table_name
WHERE column_name IN ('Value1', 'Value2', 'Value3');
```

## 2. Why use IN instead of OR?
`IN` is cleaner, shorter, and easier to maintain than multiple `OR` conditions.

**Equivalence**:
```sql
-- Using IN (Clean & Preferred)
WHERE City IN ('New York', 'Chicago', 'Boston')

-- Equivalent OR chain (Verbose)
WHERE City = 'New York' OR City = 'Chicago' OR City = 'Boston'
```

## 3. Code Example
```sql
SELECT Name, City
FROM Employees
WHERE City IN ('New York', 'Boston');
```

**Output:**

| Name | City |
| :--- | :--- |
| Alice | New York |
| Carol | Boston |
| Emma | New York |

## 4. Key Takeaways
- Replaces long chains of `OR` clauses.  
- Can accept static lists or subqueries.  
"""
}

# ---------------------------------------------------------
# Part 10: 1.0.10 LIKE (wildcards)
# ---------------------------------------------------------
parts_data[10] = {
    "title": "1.0.10 LIKE (wildcards)",
    "content": """# 1.0.10 LIKE & Wildcards (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LIKE` searches for a specified pattern inside string columns using wildcards (`%` and `_`).

## 1. Wildcard Symbols

| Wildcard | Meaning | Example | Matches |
| :--- | :--- | :--- | :--- |
| `%` | Zero, one, or multiple characters | `'A%'` | Anything starting with "A" |
| `_` | Exactly one single character | `'A_'` | 2-letter word starting with "A" |

## 2. Common Patterns
- `'Alice%'` → Starts with "Alice"
- `'%son'` → Ends with "son"
- `'%data%'` → Contains "data" anywhere
- `'_o_'` → 3-letter word with "o" in middle

## 3. Syntax & Example
```sql
SELECT Name
FROM Employees
WHERE Name LIKE 'A%';
```

**Output:**

| Name |
| :--- |
| Alice |

## 4. Key Takeaways
- `%` matches multiple characters.  
- `_` matches exactly one character.  
- Case sensitivity depends on your database engine (PostgreSQL uses `ILIKE` for case-insensitive matches).  
"""
}

# ---------------------------------------------------------
# Part 11: 1.0.11 DISTINCT
# ---------------------------------------------------------
parts_data[11] = {
    "title": "1.0.11 DISTINCT",
    "content": """# 1.0.11 DISTINCT (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `DISTINCT` eliminates duplicate rows from your query output, returning only unique values across selected columns.

## 1. What is it?
`DISTINCT` is a keyword in SQL used to return only **unique values** from a column or set of columns. It eliminates duplicates from the result set.

## 2. Definition
The `DISTINCT` clause ensures that each row in the output is unique based on the selected columns.

## 3. Why do we need it?
Analysts often deal with messy data containing duplicates. `DISTINCT` helps:
- Identify unique categories (e.g., cities, departments).  
- Clean up reports.  
- Avoid double counting.  

## 4. Real-world Analogy
Imagine a **cricket scoreboard** listing every ball bowled. If you only want the **unique players who bowled**, you’d remove duplicates. That’s what `DISTINCT` does.

## 5. Mental Model
Think of `DISTINCT` as a **deduplication filter**: it scans results and removes repeated rows.

## 6. Syntax
```sql
SELECT DISTINCT column_name(s)
FROM table_name;
```

## 7. Anatomy of the Syntax
- **SELECT** → choose columns  
- **DISTINCT** → remove duplicates  
- **FROM** → specify table  

## 8. Rules
- Applies to all selected columns.  
- If multiple columns are listed, `DISTINCT` considers the combination.  
- Cannot be used with `*` and expect uniqueness across all columns.  

## 9. Common Variations
- `SELECT DISTINCT column` → unique values in one column  
- `SELECT DISTINCT col1, col2` → unique combinations of two columns  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT DISTINCT Department
FROM Employees;
```

**Output:**

| Department |
| :--- |
| HR |
| IT |
| Finance |

## 12. Intermediate Example
```sql
SELECT DISTINCT City
FROM Employees;
```

**Output:**

| City |
| :--- |
| New York |
| Chicago |
| Boston |
| Seattle |

## 13. Advanced Example
```sql
SELECT DISTINCT Department, City
FROM Employees;
```

**Output:**

| Department | City |
| :--- | :--- |
| HR | New York |
| IT | Chicago |
| Finance | Boston |
| IT | Seattle |

## 14. Real Data Analyst Scenarios
- **HR**: List unique departments.  
- **Finance**: Find distinct transaction types.  
- **Marketing**: Identify unique customer regions.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Raw Data → DISTINCT → Deduplicated Unique Result Set
```

## 17. Behind the Scenes
Database engine scans selected columns, builds a set of unique combinations, and outputs them.

## 18. Common Mistakes
> [!WARNING]
> - Expecting `DISTINCT` to remove duplicates across entire table when only one column is selected.  
> - Using `DISTINCT` with `*` (rarely useful).  

## 19. Interview Questions
- **Beginner**: What does `DISTINCT` do?  
- **Intermediate**: Difference between `DISTINCT` and `GROUP BY`?  
- **Advanced**: How does `DISTINCT` work with multiple columns?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `DISTINCT` remove duplicates across all columns in the table?  
> **A**: No, only across the specific columns listed in the `SELECT` clause.  

## 21. Performance Notes
> [!TIP]
> - `DISTINCT` can be expensive on massive datasets because it requires sorting/hashing.  
> - Indexes help speed up `DISTINCT` queries.  

## 22. Best Practices
- Use `DISTINCT` only when necessary.  
- Prefer `GROUP BY` when aggregations are needed.  

## 23. Common Business Use Cases
- HR: Unique job titles.  
- Finance: Distinct payment methods.  
- Ecommerce: Distinct customer cities.  

## 24. Comparison
- **DISTINCT vs GROUP BY**: `DISTINCT` removes duplicates; `GROUP BY` aggregates.  
- **DISTINCT vs UNIQUE (constraint)**: `DISTINCT` is query-level; `UNIQUE` is schema-level.  

## 25. Memory Tricks
> [!TIP]
> Think of DISTINCT as **“Don’t Include Same Twice.”**

## 26. Cheat Sheet
- `SELECT DISTINCT col` → Unique values  
- `SELECT DISTINCT col1, col2` → Unique pairs  

## 27. Summary
- `DISTINCT` removes duplicates.  
- Works on selected columns.  
- Useful for clean reporting.  

## 28. Practice Questions
- **Easy**: Find distinct departments.  
- **Medium**: Find distinct cities.  
- **Hard**: Find distinct department-city pairs.  

## 29. Interview Practice Queries
- Write query to find distinct job titles.  
- Explain difference between `DISTINCT` and `GROUP BY` with examples.  

## 30. Hands-on Exercises
- List distinct cities from Employees.  
- Find distinct salary ranges.  

## 31. Mini Project Usage
Build a **Customer Region Report** showing distinct regions customers belong to.

## 32. Key Takeaways
- `DISTINCT` removes duplicates.  
- Applies to selected columns.  
- Use carefully for performance.  
"""
}

# ---------------------------------------------------------
# Part 12: 1.0.12 ORDER BY (ASC, DESC, multiple columns)
# ---------------------------------------------------------
parts_data[12] = {
    "title": "1.0.12 ORDER BY (ASC, DESC, multiple columns)",
    "content": """# 1.0.12 ORDER BY (ASC, DESC, Multiple Columns) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `ORDER BY` sorts your query output in ascending (`ASC`) or descending (`DESC`) order across one or more columns.

## 1. What is it?
`ORDER BY` is the SQL clause used to sort query results. It arranges rows in ascending (`ASC`) or descending (`DESC`) order based on one or more columns.

## 2. Definition
The `ORDER BY` clause sorts the result set of a query by one or more columns, either ascending or descending.

## 3. Why do we need it?
Analysts often need ordered data:
- Ranking top customers by revenue  
- Sorting employees by salary  
- Displaying transactions chronologically  

## 4. Real-world Analogy
Think of a **school exam results sheet**:
- Sorted by marks descending → toppers first  
- Sorted by roll number ascending → alphabetical order  

## 5. Mental Model
Visualize a stack of papers. `ORDER BY` is like arranging them by a chosen attribute (salary, date, name).

## 6. Syntax
```sql
SELECT column_name(s)
FROM table_name
ORDER BY column_name [ASC|DESC], column_name2 [ASC|DESC];
```

## 7. Anatomy of the Syntax
- **ORDER BY** → sorting clause  
- **column_name** → column to sort by  
- **ASC** → ascending order (default)  
- **DESC** → descending order  
- Multiple columns → secondary sorting  

## 8. Rules
- Default is ascending (`ASC`).  
- Multiple columns allowed.  
- Sorting happens after filtering (`WHERE`) and grouping (`GROUP BY`).  

## 9. Common Variations
- `ORDER BY Salary ASC`  
- `ORDER BY Salary DESC`  
- `ORDER BY Department ASC, Salary DESC`  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name, Salary
FROM Employees
ORDER BY Salary ASC;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Alice | `50000` |
| Emma | `52000` |
| Bob | `60000` |
| David | `65000` |
| Carol | `70000` |

## 12. Intermediate Example
```sql
SELECT Name, Salary
FROM Employees
ORDER BY Salary DESC;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |
| Bob | `60000` |
| Emma | `52000` |
| Alice | `50000` |

## 13. Advanced Example (Multiple Columns)
```sql
SELECT Name, Department, Salary
FROM Employees
ORDER BY Department ASC, Salary DESC;
```

**Output:**

| Name | Department | Salary |
| :--- | :--- | :--- |
| Emma | HR | `52000` |
| Alice | HR | `50000` |
| David | IT | `65000` |
| Bob | IT | `60000` |
| Carol | Finance | `70000` |

## 14. Real Data Analyst Scenarios
- **HR**: Sort employees by department, then salary.  
- **Finance**: Sort transactions by date descending.  
- **Marketing**: Sort customers by purchase frequency.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Step 1: Sort by Department (A → Z)
Step 2: Within each Department, sort by Salary (High → Low)
```

## 17. Behind the Scenes
Database engine sorts rows after filtering and grouping, before presenting results.

## 18. Common Mistakes
> [!WARNING]
> - Forgetting that `ASC` is default.  
> - Misunderstanding multiple column sorting precedence.  
> - Sorting on expressions without aliasing.  

## 19. Interview Questions
- **Beginner**: What is default order in `ORDER BY`?  
- **Intermediate**: How do you sort by multiple columns?  
- **Advanced**: Explain `ORDER BY` behavior with `NULL` values.  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `ORDER BY` permanently change stored table data?  
> **A**: No, it only sorts the output result set of the query.  

## 21. Performance Notes
> [!TIP]
> - Sorting large datasets can be expensive.  
> - Indexes help speed up `ORDER BY`.  

## 22. Best Practices
- Always specify `ASC` or `DESC` explicitly for clarity.  
- Use multiple columns for precise tie-breaking.  
- Avoid unnecessary sorting in subqueries.  

## 23. Common Business Use Cases
- HR: Rank employees by salary.  
- Finance: Sort transactions by date.  
- Ecommerce: Sort products by price.  

## 24. Comparison
- **ORDER BY vs GROUP BY**: `ORDER BY` sorts; `GROUP BY` aggregates.  
- **ASC vs DESC**: `ASC` = smallest first; `DESC` = largest first.  

## 25. Memory Tricks
> [!TIP]
> Think of ORDER BY as **“Organize Rows By…”**

## 26. Cheat Sheet
- `ORDER BY col ASC` → Ascending  
- `ORDER BY col DESC` → Descending  
- `ORDER BY col1 ASC, col2 DESC` → Multiple columns  

## 27. Summary
- `ORDER BY` sorts results.  
- `ASC` is default.  
- Multiple columns allowed.  

## 28. Practice Questions
- **Easy**: Sort employees by salary ascending.  
- **Medium**: Sort employees by department, then salary descending.  
- **Hard**: Sort employees by city ascending, salary descending.  

## 29. Interview Practice Queries
- Write a query to list top 3 highest salaries.  
- Sort customers by city, then purchase amount descending.  

## 30. Hands-on Exercises
- Sort employees by name alphabetically.  
- Sort employees by salary descending.  

## 31. Mini Project Usage
Build a **Top Performers Report** sorted by department and salary.

## 32. Key Takeaways
- `ORDER BY` sorts query results.  
- `ASC` is default, `DESC` reverses.  
- Multiple columns allow hierarchical sorting.  
"""
}

# ---------------------------------------------------------
# Part 13: 1.0.13 LIMIT / TOP
# ---------------------------------------------------------
parts_data[13] = {
    "title": "1.0.13 LIMIT / TOP",
    "content": """# 1.0.13 LIMIT / TOP (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: `LIMIT` (PostgreSQL/MySQL) and `TOP` (SQL Server) restrict the maximum number of rows returned by a query.

## 1. What is it?
`LIMIT` (PostgreSQL, MySQL) and `TOP` (SQL Server) are SQL clauses used to restrict the number of rows returned by a query.

## 2. Definition
- **LIMIT**: Specifies the maximum number of rows to return.  
- **TOP**: Specifies the number of rows to return from the beginning of the result set.

## 3. Why do we need it?
Analysts often don’t need the entire dataset:
- Previewing data samples  
- Showing top performers  
- Limiting rows for dashboards  

## 4. Real-world Analogy
Think of **Netflix Top 10**: you don’t see all movies, only the top 10. That’s LIMIT/TOP in action.

## 5. Mental Model
Visualize a long list. LIMIT/TOP is like saying: “Just give me the first N items.”

## 6. Syntax
**PostgreSQL/MySQL:**
```sql
SELECT column_name(s)
FROM table_name
ORDER BY column_name DESC
LIMIT n;
```

**SQL Server:**
```sql
SELECT TOP n column_name(s)
FROM table_name
ORDER BY column_name DESC;
```

## 7. Anatomy of the Syntax
- **LIMIT n** → maximum rows returned  
- **TOP n** → first n rows returned  
- **ORDER BY** → defines which rows are considered “top”  

## 8. Rules
- `LIMIT` is supported in PostgreSQL/MySQL.  
- `TOP` is supported in SQL Server.  
- Always combine with `ORDER BY` for deterministic results.  

## 9. Common Variations
- `LIMIT n` → first n rows  
- `LIMIT n OFFSET m` → skip m rows, then return n rows  
- `TOP n PERCENT` → return percentage of rows (SQL Server)  

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 11. Basic Example
```sql
SELECT Name, Salary
FROM Employees
ORDER BY Salary DESC
LIMIT 3;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |
| Bob | `60000` |

## 12. Intermediate Example
```sql
SELECT Name, Department
FROM Employees
ORDER BY EmployeeID ASC
LIMIT 2 OFFSET 2;
```

**Output:**

| Name | Department |
| :--- | :--- |
| Carol | Finance |
| David | IT |

## 13. Advanced Example (SQL Server)
```sql
SELECT TOP 2 Name, Salary
FROM Employees
ORDER BY Salary DESC;
```

**Output:**

| Name | Salary |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |

## 14. Real Data Analyst Scenarios
- **HR**: Show top 5 highest-paid employees.  
- **Finance**: Preview first 10 transactions.  
- **Marketing**: List top 20 customers by spend.  

## 15. Expected Output
Shown above in examples.

## 16. Visual Explanation
```text
Full Result Set → ORDER BY → LIMIT/TOP → Final Subset
```

## 17. Behind the Scenes
Database engine sorts rows (if ORDER BY used), then truncates to the specified number.

## 18. Common Mistakes
> [!WARNING]
> - Using `LIMIT` without `ORDER BY` (results can be non-deterministic).  
> - Confusing `LIMIT` with `WHERE` (`LIMIT` truncates result set, `WHERE` filters rows).  

## 19. Interview Questions
- **Beginner**: What does `LIMIT` do?  
- **Intermediate**: Difference between `LIMIT` and `OFFSET`?  
- **Advanced**: How does `TOP PERCENT` work in SQL Server?  

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Does `LIMIT` guarantee consistent results without `ORDER BY`?  
> **A**: No, row order is undefined unless `ORDER BY` is specified.  

## 21. Performance Notes
> [!TIP]
> - `LIMIT` is efficient for sampling.  
> - `OFFSET` can be slow on large datasets (requires scanning & skipping rows).  

## 22. Best Practices
- Always use `ORDER BY` with `LIMIT`/`TOP`.  
- Use `OFFSET` carefully for pagination.  

## 23. Common Business Use Cases
- HR: Top 10 salaries.  
- Finance: First 100 transactions.  
- Ecommerce: Top 5 selling products.  

## 24. Comparison
- **LIMIT vs TOP**: `LIMIT` = PostgreSQL/MySQL; `TOP` = SQL Server.  
- **LIMIT vs WHERE**: `LIMIT` truncates; `WHERE` filters.  

## 25. Memory Tricks
> [!TIP]
> Think of LIMIT as **“Limit the list”** and TOP as **“Top rows only.”**

## 26. Cheat Sheet
- `LIMIT n` → First n rows  
- `LIMIT n OFFSET m` → Skip m, then n rows  
- `TOP n` → First n rows (SQL Server)  
- `TOP n PERCENT` → Percentage of rows  

## 27. Summary
- `LIMIT`/`TOP` restricts rows.  
- `ORDER BY` defines which rows are “top.”  
- `OFFSET` enables pagination.  

## 28. Practice Questions
- **Easy**: Show top 3 salaries.  
- **Medium**: Show 5 employees starting from 3rd row.  
- **Hard**: Show top 10% of employees by salary (SQL Server).  

## 29. Interview Practice Queries
- Write query to find top 2 highest salaries per department.  
- Explain difference between `LIMIT` and `OFFSET` with examples.  

## 30. Hands-on Exercises
- Retrieve top 5 employees by salary.  
- Paginate employees 2 at a time using `OFFSET`.  

## 31. Mini Project Usage
Build a **Top Customers Dashboard** showing top 10 customers by revenue.

## 32. Key Takeaways
- `LIMIT`/`TOP` restricts rows.  
- `ORDER BY` is essential for meaningful results.  
- `OFFSET` enables pagination but can be slow on huge datasets.  
"""
}

# ---------------------------------------------------------
# Part 14: 1.0.14 Aliasing (AS)
# ---------------------------------------------------------
parts_data[14] = {
    "title": "1.0.14 Aliasing (AS)",
    "content": """# 1.0.14 Aliasing (AS) in SQL (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Aliasing assigns a temporary shorthand name to a column or table using the `AS` keyword.

## 1. What is it?
Aliasing lets you assign a temporary name to a column or table in a query. It’s done using the keyword `AS`.

## 2. Definition
An **alias** is a shorthand name given to a column or table for the duration of a query. It does not change the actual schema.

## 3. Why do we need it?
- Makes queries easier to read.  
- Simplifies long expressions.  
- Helps when using aggregates (`SUM`, `AVG`, etc.).  
- Useful in reporting and dashboards.  

## 4. Real-world Analogy
Think of nicknames:  
- “Alexander” → “Alex”  
- “International Business Machines” → “IBM”  
Aliases are SQL nicknames for columns/tables.

## 5. Mental Model
Visualize a report column header. Aliasing lets you rename it to something meaningful for the audience.

## 6. Syntax
```sql
SELECT column_name AS alias_name
FROM table_name AS alias_name;
```

## 7. Anatomy of the Syntax
- **AS** → keyword for aliasing  
- **alias_name** → temporary name  

## 8. Rules
- Aliases exist only during query execution.  
- Column aliases cannot be used in `WHERE`.  
- Aliases can be used in `ORDER BY` and `HAVING` (in supported SQL dialects).  
- Table aliases are mandatory in complex joins.  

## 9. Example Dataset
**Employees Table**

| EmployeeID | Name | Department | Salary | City |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Alice | HR | `50000` | New York |
| **2** | Bob | IT | `60000` | Chicago |
| **3** | Carol | Finance | `70000` | Boston |
| **4** | David | IT | `65000` | Seattle |
| **5** | Emma | HR | `52000` | New York |

## 10. Aliasing in GROUP BY
```sql
SELECT Department AS Dept, AVG(Salary) AS AvgSalary
FROM Employees
GROUP BY Dept;
```

**Output:**

| Dept | AvgSalary |
| :--- | :--- |
| HR | `51000` |
| IT | `62500` |
| Finance | `70000` |

👉 Here, `Department` is aliased as `Dept`. The `GROUP BY` uses the alias.

## 11. Aliasing in HAVING
```sql
SELECT Department AS Dept, SUM(Salary) AS TotalSalary
FROM Employees
GROUP BY Dept
HAVING TotalSalary > 100000;
```

**Output:**

| Dept | TotalSalary |
| :--- | :--- |
| HR | `102000` |
| IT | `125000` |

👉 The aggregate `SUM(Salary)` is aliased as `TotalSalary`, and `HAVING` uses that alias.

## 12. Aliasing in ORDER BY
```sql
SELECT Name, Salary AS Pay
FROM Employees
ORDER BY Pay DESC;
```

**Output:**

| Name | Pay |
| :--- | :--- |
| Carol | `70000` |
| David | `65000` |
| Bob | `60000` |
| Emma | `52000` |
| Alice | `50000` |

👉 The alias `Pay` is used in `ORDER BY` instead of repeating `Salary`.

## 13. Real Data Analyst Scenarios
- **HR dashboards**: Alias `AVG(Salary)` as `Avg_Salary`.  
- **Finance reports**: Alias `SUM(Revenue)` as `Total_Revenue`.  
- **Marketing**: Alias `COUNT(CustomerID)` as `Customer_Count`.  

## 14. Common Mistakes
> [!WARNING]
> - Trying to use a column alias in `WHERE` (not allowed because `WHERE` runs before `SELECT`).  
> - Forgetting to alias aggregates, making outputs unclear.  

## 15. Interview Questions
- **Beginner**: What does `AS` do in SQL?  
- **Intermediate**: Can you use aliases in `WHERE`? Why not?  
- **Advanced**: Show how aliases simplify `GROUP BY` and `HAVING` queries.  

## 16. Best Practices
- Always alias aggregates.  
- Use meaningful names (`AvgSalary`, not `a`).  
- Use table aliases in joins for clarity.  

## 17. Comparison
- **Alias vs Rename (DDL)**: Alias is temporary; Rename changes schema.  
- **Alias vs Expression**: Alias names the result of an expression.  

## 18. Memory Trick
> [!TIP]
> Think of `AS` as **“Assign Shortname.”**

## 19. Cheat Sheet
- `SELECT col AS alias` → Rename column  
- `FROM table AS alias` → Rename table  
- Aliases usable in `GROUP BY`, `HAVING`, `ORDER BY`  

## 20. Summary
- Aliasing makes queries readable.  
- Essential for `GROUP BY`, `HAVING`, `ORDER BY`.  
- Cannot be used in `WHERE`.  

## 21. Practice Questions
- **Easy**: Alias `Salary` as `Pay`.  
- **Medium**: Alias `AVG(Salary)` as `AvgPay` in `GROUP BY`.  
- **Hard**: Alias `SUM(Salary)` as `TotalPay` and filter with `HAVING`.  

## 22. Mini Project Usage
Build a **Salary Report**:
- Alias `Department` as `Dept`.  
- Alias `AVG(Salary)` as `AvgSalary`.  
- Alias `SUM(Salary)` as `TotalSalary`.  
- Sort by `TotalSalary` using alias.  

## 23. Key Takeaways
- Aliases = temporary nicknames.  
- Use them in `GROUP BY`, `HAVING`, `ORDER BY`.  
- Not valid in `WHERE`.  
- Essential for analyst readability.  
"""
}

# ---------------------------------------------------------
# Save all parts and update API JSON files
# ---------------------------------------------------------
output_dir = os.path.join("frontend", "public", "api")
modules_file = os.path.join(output_dir, "modules-sql.json")

with open(modules_file, "r", encoding="utf-8") as f:
    modules_data = json.load(f)

for part_num, pinfo in parts_data.items():
    # 1. Save content/sql/Part-X/notes.md
    part_dir = os.path.join("content", "sql", f"Part-{part_num}")
    os.makedirs(part_dir, exist_ok=True)
    notes_file = os.path.join(part_dir, "notes.md")
    with open(notes_file, "w", encoding="utf-8") as f:
        f.write(pinfo["content"])

    # 2. Update modules-sql.json
    word_count = len(pinfo["content"].split())
    for m in modules_data:
        for n in m.get("notes", []):
            if n["part"] == part_num:
                n["wordCount"] = word_count
                n["title"] = pinfo["title"]

    # 3. Save notes/sql/X.json
    sql_notes_dir = os.path.join(output_dir, "notes", "sql")
    os.makedirs(sql_notes_dir, exist_ok=True)
    with open(os.path.join(sql_notes_dir, f"{part_num}.json"), "w", encoding="utf-8") as f:
        json.dump({
            "part": part_num,
            "title": pinfo["title"],
            "notes": pinfo["content"],
            "files": [],
            "importance": "high" if part_num in [4, 5] else "medium",
            "module": "1.0 TIER 1: BASICS",
            "module_id": 1,
            "metadata": None
        }, f, indent=2, ensure_ascii=False)

with open(modules_file, "w", encoding="utf-8") as f:
    json.dump(modules_data, f, indent=2, ensure_ascii=False)

print("Parts 3 through 14 successfully saved and compiled into static API JSON!")
