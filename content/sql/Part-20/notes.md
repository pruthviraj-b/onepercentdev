# 1.1.6 Keys in SQL (Primary, Foreign, Composite, Unique) (Data Analyst Edition)

> [!IMPORTANT]
> **Core Concept**: Keys enforce row uniqueness, establish table relationships, and preserve data integrity across relational databases.

## 1. What are they?
Keys are constraints that define relationships and uniqueness in tables. They ensure data integrity and connect tables logically.

## 2. Definition
- **Primary Key** → uniquely identifies each row.  
- **Foreign Key** → links one table to another.  
- **Composite Key** → primary key made of multiple columns.  
- **Unique Key** → ensures column values are unique but allows `NULL`.

## 3. Why do we need them?
Without keys, databases would allow duplicates, broken relationships, and unreliable analysis.

## 4. Real-world Analogy
- **Primary Key** → Aadhaar / SSN number (unique ID for each citizen).  
- **Foreign Key** → Student’s roll number in exam results (links to student table).  
- **Composite Key** → Bus ticket (Route + Seat together make it unique).  
- **Unique Key** → Email ID (unique per person, but optional).

## 5. Mental Model
Think of keys as **locks**: they guarantee uniqueness and enforce relationships.

---

## 6. Syntax
```sql
CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY,
    Email VARCHAR(100) UNIQUE,
    DeptID INT,
    FOREIGN KEY (DeptID) REFERENCES Departments(DeptID)
);
```

---

## 7. Anatomy
- **PRIMARY KEY** → one per table, no `NULL`s allowed.  
- **UNIQUE** → multiple allowed per table, `NULL` permitted.  
- **FOREIGN KEY** → references another table’s primary key.  
- **COMPOSITE KEY** → multiple columns combined.

---

## 8. Rules
- Primary Key must be unique and not `NULL`.  
- Foreign Key must match values in parent table.  
- Composite Key ensures uniqueness across multiple columns.  
- Unique Key allows `NULL` but no duplicate values.

---

## 9. Common Variations
- Single column PK vs Composite PK.  
- Foreign Key with `ON DELETE CASCADE`.  
- Unique Key for optional identifiers.

---

## 10. Example Dataset
**Employees Table**

| EmployeeID | Name | DeptID | Email |
| :--- | :--- | :--- | :--- |
| **1** | Alice | 101 | `alice@company.com` |
| **2** | Bob | 102 | `bob@company.com` |
| **3** | Carol | 101 | `NULL` |

**Departments Table**

| DeptID | DeptName |
| :--- | :--- |
| **101** | HR |
| **102** | IT |

---

## 11. Basic Example (Primary Key)
```sql
CREATE TABLE Students (
    RollNo INT PRIMARY KEY,
    Name VARCHAR(50)
);
```

---

## 12. Intermediate Example (Foreign Key)
```sql
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY,
    CustomerID INT,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
```

---

## 13. Advanced Example (Composite Key)
```sql
CREATE TABLE BusTickets (
    RouteNo INT,
    SeatNo INT,
    PRIMARY KEY (RouteNo, SeatNo)
);
```

---

## 14. Real Analyst Scenarios
- **HR**: EmployeeID as PK.  
- **Finance**: TransactionID PK, CustomerID FK.  
- **Transport**: Composite key for route + seat.  
- **Marketing**: Unique email IDs.  

---

## 15. Expected Output
Constraints enforce rules:
- No duplicate EmployeeID.  
- DeptID must exist in Departments.  
- Route+Seat combination is unique.  
- Email unique if provided.  

---

## 16. Visual Explanation
```text
Primary Key   → Passport / National ID
Foreign Key   → Student roll linked to exam score
Composite Key → Bus ticket (Route + Seat)
Unique Key    → Personal Email ID
```

---

## 17. Behind the Scenes
Database engine creates indexes for keys and enforces rules during insert/update.

---

## 18. Common Mistakes
> [!WARNING]
> - Forgetting Primary Key → leads to duplicate rows.  
> - Wrong Foreign Key reference → broken relationships.  
> - Misusing composite keys.  
> - Assuming `UNIQUE` = `PRIMARY KEY`.  

---

## 19. Interview Questions
- **Beginner**: Difference between Primary Key and Unique Key?  
- **Intermediate**: What is a Composite Key?  
- **Advanced**: Explain `ON DELETE CASCADE` in Foreign Keys.  

---

## 20. Interview Traps
> [!IMPORTANT]
> **Q**: Can a table have multiple Primary Keys?  
> **A**: No, only one Primary Key clause per table, but it can be a composite key spanning multiple columns.  

---

## 21. Performance Notes
> [!TIP]
> - Primary and Unique keys automatically build underlying B-tree indexes for fast queries.  
> - Foreign Key checks add minor write validation overhead.  

---

## 22. Best Practices
- Always define a Primary Key.  
- Use Foreign Keys for relationships.  
- Use Unique Keys for optional identifiers.  
- Keep composite keys minimal.  

---

## 23. Common Business Use Cases
- HR: EmployeeID PK.  
- Finance: CustomerID FK.  
- Transport: Route+Seat composite.  
- Ecommerce: Unique email.  

---

## 24. Comparison Table
| Key Type | Unique | NULL Allowed | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Key** | Yes | No | Row identity |
| **Foreign Key** | No | Yes | Relationship link |
| **Composite Key** | Yes | No | Multi-column identity |
| **Unique Key** | Yes | Yes | Optional uniqueness |

---

## 25. Memory Tricks
> [!TIP]
> - **PK = Passport** (unique, mandatory).  
> - **FK = Family Link** (connects to parent).  
> - **Composite = Combo Lock** (two parts).  
> - **Unique = Username** (optional but unique).  

---

## 26. Cheat Sheet
```sql
PRIMARY KEY   → Unique, no NULL
FOREIGN KEY   → References parent table
COMPOSITE KEY → Multiple columns combined
UNIQUE        → Unique values, NULL allowed
```

---

## 27. Summary
- Keys enforce uniqueness and relationships.  
- PK, FK, Composite, Unique are core.  
- Analysts must master them for schema design.  

---

## 28. Practice Questions
- **Easy**: Create table with PK.  
- **Medium**: Add FK to Orders.  
- **Hard**: Composite key for BusTickets.  

---

## 29. Interview Practice Queries
- Create Customers table with PK.  
- Create Orders table with FK.  
- Create BusTickets with composite PK.  

---

## 30. Hands-on Exercises
- Add Unique constraint to Email.  
- Add FK to DeptID.  

---

## 31. Mini Project Usage
Design **University Database**:
- Students table (`PK RollNo`).  
- Courses table (`PK CourseID`).  
- Enrollments table (`Composite PK RollNo+CourseID`, FK references both).  

---

## 32. Key Takeaways
- **Primary Key** → Unique identity.  
- **Foreign Key** → Relationship link.  
- **Composite Key** → Combo uniqueness.  
- **Unique Key** → Optional uniqueness.  
