# Day 24: SQL Portfolio Project (The Architecture of Complexity)

> "Code is read a hundred times for every one time it is written. Optimize for readability."

## The Threat of the Subquery
As your SQL skills grow, you will stop writing 5-line queries and start writing 100-line analytical models. 

When a beginner faces a complex problem—for example, *"Find the average salary of the sales department, but only for employees who were hired after 2020"*—they often turn to **Subqueries** (a query nested inside another query).

```sql
SELECT AVG(salary) 
FROM (
    SELECT salary 
    FROM employees 
    WHERE department = 'Sales' AND hire_date > '2020-01-01'
) AS recent_sales;
```

This works. But what if you need to nest a query inside a query inside a query? 
Subqueries execute **Inside-Out**. To read them, a human must jump to the deepest layer of the code, figure out what it does, and then mentally work their way backward to the outer layer. It is a nightmare for code maintenance. 

**The Lesson:** If your coworker cannot understand your SQL query in 30 seconds, it is a bad query, no matter how fast it runs on the CPU.

---

## The Engineer's Solution: CTEs (Common Table Expressions)
In modern Data Analytics, we heavily rely on the `WITH` clause to create CTEs. 

A CTE is a temporary named result set. It exists only for the millisecond your query is running, and then it vanishes. It allows you to write SQL **Top-Down**, exactly how a human brain processes logic.

```sql
WITH recent_sales_hires AS (
    -- Step 1: Filter the raw data
    SELECT employee_id, salary
    FROM employees
    WHERE department = 'Sales' AND hire_date > '2020-01-01'
),
bonus_calculations AS (
    -- Step 2: Calculate bonuses using the temporary table from Step 1
    SELECT employee_id, salary * 1.10 AS projected_salary
    FROM recent_sales_hires
)
-- Step 3: The Final Output
SELECT AVG(projected_salary)
FROM bonus_calculations;
```

### Tradeoff: Performance vs. Readability
Under the hood, the SQL Optimizer usually treats a Subquery and a CTE as the exact same thing. There is rarely a CPU speed advantage to using a CTE. 
The entire purpose of a CTE is **Human Readability**. It breaks a massive architectural problem into digestible, logical steps. 

When you build your portfolio project today, use CTEs to structure your logic. It signals to a hiring manager that you write professional, maintainable code.

---

## Hands-On Lab: The E-Commerce Challenge
As you follow along with Mohan Sir's project today, you are going to tie everything together. 
1. **The Join:** You will stitch Customers, Orders, and Products together. 
2. **The Aggregation:** You will use `GROUP BY` to roll the transactional data up into monthly revenue. 
3. **The Logic:** You will use a CTE to temporarily hold the monthly revenue, so you can easily calculate Month-over-Month growth in the final `SELECT` statement.

Do not copy the code blindly. For every line you write, ask yourself: *"At this exact moment in the execution order, what does the data look like in RAM?"*
