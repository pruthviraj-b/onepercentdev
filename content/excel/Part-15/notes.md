# Part 15 — Best Excel Charts for Data Analysis

## Overview
Not all charts are equally useful for analysis. This part focuses on the specific chart types that analysts rely on most — with step-by-step instructions for building each one correctly and fast.

## The Analyst's Core Chart Set

### 1. Clustered Column Chart
**When to use**: Comparing values across multiple categories
**Example**: Monthly revenue broken down by region

Steps:
1. Select data with headers
2. Insert -> Column -> Clustered Column

### 2. Line Chart with Markers
**When to use**: Showing trends and changes over time
**Example**: Daily sales volume, monthly growth rate

Steps:
1. Select date column + value column
2. Insert -> Line -> Line with Markers

### 3. Combo Chart (Column + Line on Two Axes)
**When to use**: Two metrics with different scales on the same chart
**Example**: Revenue (columns, primary axis) + Growth % (line, secondary axis)

Steps:
1. Insert -> Chart -> All Charts -> Combo
2. For each series: choose chart type and whether to use primary or secondary axis

### 4. Scatter Plot with Trendline
**When to use**: Finding correlations between two numeric variables
**Example**: Does marketing spend drive revenue?

Steps:
1. Select two numeric columns -> Insert -> Scatter
2. Right-click a data point -> Add Trendline
3. Choose: Linear, Exponential, or Moving Average
4. Check "Display Equation on chart" and "Display R-squared value"

### 5. PivotChart
**When to use**: Dynamic analysis linked directly to a PivotTable
The chart updates automatically whenever the PivotTable changes.
(See Part 18 for full PivotChart coverage.)

## Sparklines — Tiny In-Cell Charts
**Insert -> Sparklines -> Line / Column / Win-Loss**
- A sparkline fits inside a single cell
- Perfect for dashboards and summary tables
- Shows the trend direction without taking up full chart space
- Select a range of cells to create one sparkline per row

## Saving Chart Templates
1. Format a chart exactly as you want it (fonts, colours, sizes)
2. Right-click the chart -> **Save as Template** (.crtx file)
3. Next time: Insert -> Charts -> Templates -> choose your saved template

## Resources
- Watch: https://www.youtube.com/watch?v=fwXGOBUzOzU
- Playlist: https://www.youtube.com/playlist?list=PL6Omre3duO-N7yY1Uxl7hOC3gRMMomamK

---

## 📘 Course Curriculum — Full 50-Chapter Roadmap

This lesson is part of the complete Excel Mastery curriculum. Here is the full roadmap so you always know where you are and where you are going.

### 🔑 Foundation (Chapters 1–10)
| Ch | Topic |
|---|---|
| 1 | Excel Basics & Navigation |
| 2 | Data Entry & Cleaning |
| 3 | Formatting & Aesthetics |
| 4 | Formulas & Functions (Intro) |
| 5 | Intermediate Functions |
| 6 | Advanced Functions |
| 7 | Data Analysis Basics |
| 8 | PivotTables |
| 9 | Charts & Visualization |
| 10 | Data Import & Export |

### 📊 Core Analytics (Chapters 11–20)
| Ch | Topic |
|---|---|
| 11 | Descriptive Statistics in Excel |
| 12 | Data Tables & Structured References |
| 13 | Conditional Logic (IF, IFS, SWITCH) |
| 14 | Lookup Mastery (VLOOKUP, XLOOKUP, INDEX/MATCH) |
| 15 | Text Functions for Cleaning |
| 16 | Date & Time Functions |
| 17 | Financial Functions (NPV, IRR, PMT) |
| 18 | Error Handling & Debugging |
| 19 | Scenario Manager & What-If Analysis |
| 20 | Solver & Optimization |

### ⚙️ Advanced Analytics (Chapters 21–30)
| Ch | Topic |
|---|---|
| 21 | Power Query Basics |
| 22 | Power Query Advanced Transformations |
| 23 | Data Modeling in Excel |
| 24 | Relationships & Joins in Power Pivot |
| 25 | DAX Basics (Data Analysis Expressions) |
| 26 | Advanced DAX Functions |
| 27 | KPIs & Measures in Power Pivot |
| 28 | Dashboards in Excel |
| 29 | Interactive Reports with Slicers & Timelines |
| 30 | Excel + Power BI Integration |

### 📈 Business Applications (Chapters 31–40)
| Ch | Topic |
|---|---|
| 31 | HR Analytics in Excel |
| 32 | Finance & Accounting Models |
| 33 | Marketing Analytics (Campaign ROI) |
| 34 | Sales Dashboards |
| 35 | E-commerce Analytics (Orders, Customers, Revenue) |
| 36 | Healthcare Analytics (Patient Data) |
| 37 | Logistics & Supply Chain Models |
| 38 | Manufacturing Quality Control |
| 39 | Education Analytics (Student Performance) |
| 40 | Retail Analytics (Inventory & Pricing) |

### 🛠️ Professional Skills (Chapters 41–50)
| Ch | Topic |
|---|---|
| 41 | Collaboration & Sharing Workbooks |
| 42 | Protecting Sheets & Data Security |
| 43 | Large Dataset Handling & Performance |
| 44 | Macros Basics |
| 45 | VBA for Automation |
| 46 | Excel + SQL Integration |
| 47 | Excel + Python (Pandas, NumPy) |
| 48 | Excel + Cloud (OneDrive, SharePoint) |
| 49 | Best Practices for Analysts |
| 50 | Final Projects & Portfolio Building |

---

## 🔄 Circular Learning Design

Each chapter loops back to earlier skills at a deeper level.

Example: When you learn **Power Query (Chapter 21)**, you revisit **Data Cleaning (Chapter 2)** — but now you apply it at enterprise scale using automated pipelines instead of manual steps.

This ensures **reinforcement + mastery**, not just exposure.

```
Ch 2: Data Cleaning (manual)
        ↓  revisited at deeper level
Ch 21: Power Query (automated cleaning pipelines)
        ↓  revisited at deeper level
Ch 22: Advanced Transformations (merge, pivot, unpivot, custom columns)
```

---

## 🏢 Real-World Example: Analyst at Swiggy

Imagine you are a Data Analyst at Swiggy. Here is exactly how you use Excel across the curriculum:

| Task | Chapter Used |
|---|---|
| Import 50,000 order records from the database | Chapter 10 — Data Import & Export |
| Clean messy customer names and phone numbers | Chapter 2 — Data Cleaning |
| Calculate delivery times using date/time formulas | Chapter 16 — Date & Time Functions |
| Build a PivotTable showing top 10 restaurants by orders | Chapter 8 — PivotTables |
| Create a revenue trend dashboard with slicers | Chapter 28 — Dashboards |
| Automate the weekly report with a macro | Chapter 44 — Macros Basics |
| Connect live data from the SQL database | Chapter 46 — Excel + SQL Integration |

This is exactly how Excel is used in real jobs — not in isolation, but as an end-to-end analytical tool.

---

## 📌 What This Course Covers That Others Miss

- ✅ Collaboration and team sharing (Chapter 41)
- ✅ Automation with VBA — not just recording macros (Chapter 45)
- ✅ Integration with SQL databases (Chapter 46)
- ✅ Integration with Python Pandas and NumPy (Chapter 47)
- ✅ Cloud workflows on OneDrive and SharePoint (Chapter 48)
- ✅ Industry-specific analytics: HR, Finance, Marketing, Sales, Healthcare, Retail
- ✅ Optimization for large datasets (Chapter 43)
- ✅ Portfolio projects to showcase your skills (Chapter 50)

---

## 🎯 How to Use These Notes

1. **Watch the video** for this part first — see the concept demonstrated live
2. **Read the notes** — they expand on everything shown in the video with more depth
3. **Try the examples** yourself in Excel as you read
4. **Complete the exercises** at the end of premium note sections
5. **Move to the next part** — each part builds on the previous one

💡 **Tip**: You do not need to memorise everything. Come back to these notes whenever you need a reference. The goal is to build understanding, not to memorise syntax.

---
