# Day 20: SQL (The Order of Execution)

> "If you read SQL like English, you will write bugs. You must read SQL like the Database Engine reads it."

## The Illusion of English
SQL was originally designed in the 1970s (originally called SEQUEL) to be easily readable by non-programmers. It reads like a polite English sentence:

`SELECT first_name FROM employees WHERE salary > 50000;`

This English-like syntax is SQL's greatest trap. Because humans read left-to-right, beginners assume the database executes the query left-to-right. They think the database says: *"Okay, I will SELECT the first name, then I will go FROM the employees table, then I will check WHERE the salary is high."*

This is mathematically impossible. 

**Anti-Rote Rule #1:** The Database Engine does not execute your query in the order you wrote it. 

---

## The Physical Order of Execution
If you want to pass a technical interview for a Data Analytics role, you must memorize the **Logical Order of Execution**. 

When you submit a query, the SQL Optimizer intercepts it and rewrites it. This is how the engine actually executes:

### 1. `FROM` (Where is the data?)
The engine must first go to the hard drive, locate the physical table, and load it into memory. It cannot select a column if it doesn't know what table to look at!

### 2. `WHERE` (Filter the raw data)
Before doing any math or formatting, the engine drops all the rows that don't match the condition. This saves RAM. If you start with 10 million rows, and the `WHERE` clause drops 9 million, the engine only has to hold 1 million rows in memory for the rest of the query.

### 3. `GROUP BY` (Aggregate)
*We will cover this tomorrow.*

### 4. `SELECT` (Choose the columns)
Only now, at step 4, does the engine actually look at the `SELECT` word. It chops off all the columns you didn't ask for.

### 5. `ORDER BY` (Sort the result)
Sorting is the most computationally expensive thing a computer can do. Therefore, the engine waits until the absolute final microsecond, when the dataset is as small as possible, to sort it.

---

## Tradeoff: The Alias Trap
Understanding the Order of Execution solves the most common error that plagues junior analysts.

Look at this query:
```sql
SELECT 
    revenue - cost AS profit 
FROM sales 
WHERE profit > 1000;
```

If you read left-to-right, this makes perfect sense. You created the alias `profit`, and then you filtered by it.
But if you run this, SQL will throw a massive error: **`ERROR: column "profit" does not exist`**.

Why? Look at the Order of Execution:
1. `FROM sales` (Table loaded)
2. `WHERE profit > 1000` (Wait... what is profit? It hasn't been created yet!)
3. `SELECT revenue - cost AS profit` (This happens AFTER the WHERE clause).

**The Engineering Fix:** You must use the raw calculation in the WHERE clause, because the alias does not exist in memory yet.
```sql
SELECT 
    revenue - cost AS profit 
FROM sales 
WHERE (revenue - cost) > 1000;
```

---

## Career Connection: The "Limit" Saving Grace
When you connect to a production database at a real company, the `orders` table might have 500 million rows. 

If you type `SELECT * FROM orders;` and hit run, your query will demand that the database read 500 million rows from disk and send them across the network to your laptop. You will crash your SQL tool, and the Database Administrator (DBA) will hunt you down.

**The Professional Habit:** Every exploratory query you ever write must end with `LIMIT 100;` (or `TOP 100` in SQL Server). This instructs the engine to stop pulling data after the first 100 rows. It is the SQL equivalent of Pandas' `df.head()`.

---

## Hands-On Lab: The `WHERE` Engine
The `WHERE` clause is just Boolean Algebra (True/False). 

```sql
SELECT first_name, department, salary 
FROM employees
WHERE department = 'Sales' 
  AND salary >= 60000;
```
For every single row, the engine asks:
1. Is department exactly equal to 'Sales'? (True/False)
2. Is salary >= 60000? (True/False)

If both are True, the row survives. If one is False, the row is discarded. This is the exact same logic engine you learned in pure Python on Day 10. The only difference is the syntax.
