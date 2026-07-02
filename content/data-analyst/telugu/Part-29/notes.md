# Day 27: Aggregation & The Concept of LOD

> "To master Tableau, you must stop thinking about the chart, and start thinking about the grain of the data."

## The "Green Pill vs. Blue Pill" Illusion
When beginners open Tableau, they see that some data fields are colored **Blue** and others are colored **Green**. 
The rote learner memorizes a false rule: *"Blue means Text, Green means Numbers."*

This is entirely wrong, and believing it will prevent you from ever building complex analytical models.

**The Engineering Truth:**
* **Blue means Discrete:** Distinct, separate chunks. (e.g., Countries, Regions, or Year). When you drop a Blue pill onto the canvas, Tableau creates **Headers** (Labels).
* **Green means Continuous:** An unbroken, infinite spectrum. (e.g., Profit, Temperature, or exact Time). When you drop a Green pill onto the canvas, Tableau creates an **Axis**.

You can have a Green Date (a continuous timeline from 2020 to 2024 drawing a single line). 
You can have a Blue Date (discrete buckets: "January", "February" creating separate column headers). 

Mastering the difference between an Axis (Green) and a Header (Blue) is the key to controlling the visual layout.

---

## Level of Detail (LOD): Escaping the View
In SQL (Module 3), if you wrote `GROUP BY Department`, you collapsed the data down to the Department level. You lost the individual Employee level. 

In Tableau, the "View" (the chart you are building) determines the aggregation. If you drag `State` onto the canvas, Tableau automatically sums the revenue at the State level. 

But what if you need to calculate the **Total National Revenue** and divide each State's revenue by that National Total to find the percentage?
* The View is grouped by State. 
* To get the National Total, you need Tableau to temporarily *ignore* the State grouping, jump out of the View, calculate the grand total, and bring it back.

This is impossible for an amateur. For an engineer, this is an **LOD (Level of Detail) Expression**.

### The `FIXED` Keyword
```tableau
{ FIXED : SUM([Revenue]) }
```
This is the most powerful calculation in Tableau. The `{}` braces represent a subquery. `FIXED` commands the Tableau engine: *"I don't care how the user filters the dashboard, and I don't care what is grouped on the canvas. Lock the aggregation at this specific level and calculate it."*

**Career Connection:** If you mention "FIXED LOD Expressions" in a Tableau developer interview, you immediately prove you operate at an advanced architectural level. 

---

## Tradeoff: Table Calculations vs. Database Math
If you want to calculate a "Running Total" (e.g., Day 1 + Day 2 + Day 3...), where should that math happen?

1. **In SQL:** You could write an advanced Window Function (`SUM(sales) OVER(ORDER BY date)`). This forces the database to do the math.
2. **In Tableau:** You can right-click the metric and select "Quick Table Calculation -> Running Total". 

**The Tradeoff:**
* **Database Math** is centralized. If 5 different dashboards connect to that SQL table, they all benefit from the calculation. However, it takes longer to write and puts a computational load on the server.
* **Tableau Table Calculations** are computed locally on the user's laptop browser *after* the data is fetched. It is blazing fast and requires zero SQL code. But if you need that metric elsewhere, you have to recreate it. 

Always push heavy aggregations down to the database, but leave visual, screen-specific math (like running totals or percent-of-totals) to Tableau.

---

## Hands-On Lab: The Dual Axis
Today, you will build complex visualizations. The most important technique is the **Dual Axis**.

Imagine you want to plot `Revenue` (a Bar Chart, reaching $50,000) and `Profit Margin` (a Line Chart, reaching 15%). 
If you put them on the same axis, the 15% line will be crushed at the very bottom of the screen (because 0.15 is practically zero compared to 50,000).

You must drag the second Green Pill to the *right side* of the canvas to create a secondary Y-axis. Then, you right-click the axis and select **Synchronize Axis** (if they are the same unit) or leave them dual-scaled. This allows you to overlap a line chart directly on top of a bar chart, revealing the correlation between volume and efficiency.
