# 1.0.3 SQL Operators (Data Analyst Edition)

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
