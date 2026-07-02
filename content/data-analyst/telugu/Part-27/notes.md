# Day 25: Netflix SQL Portfolio (The Window Function)

> "Aggregation destroys the row. A Window Function preserves the row while revealing its place in the universe."

## The Netflix Prize
In 2006, Netflix offered $1 Million to anyone who could improve their movie recommendation algorithm by 10%. To win, data scientists had to analyze millions of user ratings and figure out what a specific user would want to watch next.

To do this, you don't just need to know the *average* rating of a movie. You need to know how a specific user's rating compares to their *own* historical average, and how it compares to the *global* average. 

You need context. You need to look at a row of data, and simultaneously peek at the rows surrounding it. 

---

## The Flaw of `GROUP BY`
Yesterday, we learned that `GROUP BY` is powerful because it collapses data. 
But what if the CEO asks: *"I want to see a list of ALL employees, their individual salary, AND the average salary of their department right next to it."*

If you use `GROUP BY department`, it crushes the individual employees out of existence. You get the average, but you lose the people. 
If you don't use `GROUP BY`, you keep the people, but you can't calculate the average. 

Rote learners solve this by writing two separate queries and joining them together. It is slow and ugly. 
Engineers use **Window Functions**.

---

## The Magic of the `OVER()` Clause
A Window Function allows a row to "look" at an aggregation without actually being crushed by it.

```sql
SELECT 
    employee_name, 
    salary,
    department,
    -- The Window Function
    AVG(salary) OVER(PARTITION BY department) AS dept_average
FROM employees;
```

**Anti-Rote Analysis:**
* `AVG(salary)`: The math we want to do.
* `OVER()`: This is the trigger. It tells the engine, *"Do NOT collapse the data. Keep every row intact, but open a 'window' to look at a specific subset of data."*
* `PARTITION BY department`: This defines the size of the window. It tells the engine to calculate the average only for the current row's department.

The result? You get 10,000 rows (all employees), and each row perfectly displays the average salary of that specific employee's department next to their own salary.

---

## Career Connection: Ranking and Top-N Queries
The most common use case for a Window Function in a technical interview is the **Top-N per Category** problem.

*"Find the Top 3 most watched movies in every single Genre."*

You cannot solve this with a simple `ORDER BY` and `LIMIT 3`, because that only gives you the Top 3 movies overall. You need the top 3 for *Action*, the top 3 for *Comedy*, etc.

**The Solution: `ROW_NUMBER()`**
```sql
WITH RankedMovies AS (
    SELECT 
        title, 
        genre, 
        views,
        ROW_NUMBER() OVER(PARTITION BY genre ORDER BY views DESC) as rank
    FROM netflix_catalog
)
SELECT title, genre, views 
FROM RankedMovies 
WHERE rank <= 3;
```

The `ROW_NUMBER()` window function creates an internal counter. Every time the engine hits a new genre (the partition), the counter resets to 1. By wrapping this in a CTE, we can easily filter out anything that ranked 4 or lower. 

This single concept—combining CTEs with Window Functions—proves to an employer that you have moved beyond basic syntax and are now writing industrial-grade SQL analytics.
