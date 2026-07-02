# Day 22: SQL Tables & Data Types (The DDL Architecture)

> "Data without a strict schema is just a digital landfill."

## The Philosophy of the Schema
Up to this point, we have been running `SELECT` queries. In the SQL language, this is known as **DML (Data Manipulation Language)**. We were querying data that someone else already perfectly organized for us.

Today, we cross over into **DDL (Data Definition Language)**. This is how you create, alter, and destroy the actual tables themselves (`CREATE`, `ALTER`, `DROP`). 

When you build a table, you are the architect. You are laying the concrete foundation for the database. If you lay the foundation poorly, the entire skyscraper of business logic will eventually collapse. 

In a NoSQL database (like MongoDB), you can throw any JSON document you want into a collection. 
In a Relational SQL Database, you must define the **Schema**. A schema is a strict, legally binding contract. It defines exactly what columns exist and what physical Data Types they are allowed to hold.

---

## Tradeoff: The Cost of Space (`VARCHAR` vs `CHAR`)
When you define a column for a Customer's Name, you must choose a Data Type. 

If you choose text, you have a choice:
1. **`CHAR(50)` (Fixed-Length Character):** 
   If you insert the name "Bob" (3 letters), the database will physically pad it with 47 empty spaces on the hard drive to ensure it takes up exactly 50 bytes. 
   * **The Benefit:** It is incredibly fast for the CPU to read because every single row is the exact same physical size. The CPU can blindly skip 50 bytes at a time.
   * **The Cost:** It wastes massive amounts of hard drive space.

2. **`VARCHAR(50)` (Variable-Length Character):**
   If you insert "Bob", it only takes up 3 bytes (plus 1 byte to record the length).
   * **The Benefit:** It saves massive amounts of disk space.
   * **The Cost:** It is slightly slower for the CPU to read, because the CPU must check the length of every row before skipping to the next one.

**The Engineer's Choice:** Today, hard drive space is cheap, but network/memory bandwidth is still a bottleneck. `VARCHAR` is the industry standard for almost all text fields. We only use `CHAR` for strings that are guaranteed to always be the exact same length (like a 2-letter Country Code: `US`, `IN`, `UK`).

---

## Anti-Rote: Primary Keys and The Concept of Uniqueness
A database is useless if you cannot definitively identify a specific row. 

Imagine you have an `employees` table, and you want to fire "John Smith". You write `DELETE FROM employees WHERE name = 'John Smith';`. You just fired three different people who share that name. 

Every single table you ever create must have a **Primary Key (PK)**.
A Primary Key is a column (usually an integer like `employee_id`) that has two unbreakable rules mathematically enforced by the database:
1. **UNIQUE:** No two rows can ever have the same ID.
2. **NOT NULL:** It can never be empty.

By defining a Primary Key, the database automatically builds an invisible **B-Tree Index** on that column. This means if you search for `WHERE employee_id = 10452`, the database doesn't have to scan millions of rows. It jumps directly to the physical location on the hard drive in milliseconds.

---

## Career Connection: The Reality of `ALTER TABLE`
In tutorials, you `CREATE TABLE`, make a mistake, `DROP TABLE`, and start over.

In the real world, you cannot drop a production table that contains 10 years of financial history. If the business decides they want to start tracking a customer's `date_of_birth`, you must surgically alter the live fortress without breaking it.

`ALTER TABLE customers ADD COLUMN date_of_birth DATE;`

This command is terrifying on a live database. Adding a column to a table with 500 million rows can lock the table for hours while the hard drive physically writes the new structure. This is why Schema design requires so much upfront planning. 

---

## Hands-On Lab: Building the Foundation
Let's build a proper, architected table from scratch.

```sql
CREATE TABLE products (
    -- The Primary Key: The database will automatically generate numbers (1, 2, 3...)
    product_id SERIAL PRIMARY KEY,
    
    -- VARCHAR for flexible text, NOT NULL because a product must have a name
    product_name VARCHAR(100) NOT NULL,
    
    -- DECIMAL(10,2) means 10 digits total, 2 after the decimal point (e.g., 99999999.99)
    -- Perfect for financial accuracy. Never use FLOAT for money!
    price DECIMAL(10, 2) NOT NULL,
    
    -- If no status is provided, default to 'In Stock'
    status VARCHAR(20) DEFAULT 'In Stock'
);

-- Inserting data into our strict schema
INSERT INTO products (product_name, price) 
VALUES ('Laptop', 1200.50);
```

**Observation:** Notice the defensive engineering. By enforcing `NOT NULL` and `DEFAULT`, you are protecting the database from sloppy applications that might try to insert empty data. You are acting as the bouncer to the data warehouse.
