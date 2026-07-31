# Day 23: SQL Joins (The Architecture of Normalization)

> "A database is a disassembled puzzle. A JOIN is how we put the pieces back together."

## The Update Anomaly
Imagine you are building the database for Amazon. A rote learner would create one massive Excel-like table called `Orders` with columns for: `OrderID, Date, ProductName, Price, CustomerName, CustomerAddress`. 

If Mohan makes 5,000 purchases over 10 years, his `CustomerAddress` is physically written onto the hard drive 5,000 times. 
One day, Mohan moves to a new city. To update his address, the database must scan all 5,000 rows and update them individually. If the server crashes at row 2,500, Mohan now has two different addresses in the system. The data is corrupted. This is called an **Update Anomaly**.

**The Engineering Fix: Normalization**
To prevent this, database architects split the data into two tables: `Orders` and `Customers`. 
Mohan's address lives in the `Customers` table exactly *once*. The `Orders` table just stores his `Customer_ID`. When Mohan moves, you update exactly one row. Total data integrity is preserved.

---

## The Philosophy of the JOIN
Normalization is brilliant for storage, but terrible for reporting. 
When the CEO asks for a report of "Total Sales by City," the data is scattered across two different tables. 

This is why the `JOIN` was invented. A `JOIN` is the computational glue that temporarily fuses normalized tables back together in RAM so you can read them as one wide table.

**Anti-Rote: The Cartesian Truth**
When you write an `INNER JOIN`, what is the engine actually doing?
Conceptually, it performs a **Cross Join (Cartesian Product)**. If Table A has 100 rows and Table B has 100 rows, it multiplies them together to create a massive 10,000-row temporary table. It then applies your `ON` condition (e.g., `ON A.id = B.id`) to filter out the 9,900 rows that don't match, leaving you with the true 100 connected rows.

*(Modern SQL Optimizers use Hash Joins to avoid the actual multiplication, but understanding the logic prevents you from accidentally writing a query that blows up the server's memory).*

---

## Tradeoff: INNER vs. LEFT JOIN
In software engineering, developers love `INNER JOIN`. It only returns rows where there is a perfect match in both tables. It keeps the data clean.

In Data Analytics, **we vastly prefer the `LEFT JOIN`.**

Why? A Data Analyst's primary job is to find what is *missing*. 
If you use an `INNER JOIN` between `Customers` and `Orders`, it will drop any customer who hasn't bought anything yet. 
If you use a `LEFT JOIN`, it keeps ALL customers on the left side, and attaches order data if it exists. If they haven't bought anything, it attaches a `NULL`. 

By finding those `NULL` values, you can build a report of "Customers who created an account but never made a purchase"—a highly valuable insight for the Marketing team that an `INNER JOIN` would have completely erased.

---

## Hands-On Lab: The Left Join Trap
```sql
SELECT 
    c.customer_name, 
    o.order_date, 
    o.amount
FROM customers c
LEFT JOIN orders o 
    ON c.customer_id = o.customer_id;
```

**The Trap:** Notice the aliases `c` and `o`. We assigned sticky notes to the tables in the `FROM` clause. Because of the Order of Execution (Day 20), the `SELECT` clause doesn't run until the very end. This means the engine *knows* what `c` and `o` are when it processes the `SELECT` line. 

If you try to alias a table in the `SELECT` line, it will fail. Aliases must be declared at the point of origin (`FROM`). Always qualify your columns (`c.customer_name` instead of just `customer_name`) so the next analyst who reads your code knows exactly which table the data came from.
