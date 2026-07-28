# Part 13 — Master Sorting, Filters, Tables, and Advanced Excel Techniques

## Overview
Sorting and filtering are how analysts interrogate large datasets. Excel Tables take this further by turning a plain data range into a dynamic, auto-expanding, formula-friendly smart object.

## Sorting

### Simple Sort
Click any cell in the column you want to sort -> Data -> Sort A to Z (or Z to A)
Or use the sort buttons on the Home tab.

### Multi-Level Sort
1. **Data -> Sort**
2. Click **Add Level**
3. Set Sort By (e.g. Department A-Z), then By (e.g. Salary largest to smallest)
4. Click OK

### Custom Sort Order
In the Sort dialog, Order dropdown -> Custom List
For example: sort months as Jan, Feb, Mar... rather than alphabetically.

## AutoFilter
**Ctrl+Shift+L** to toggle AutoFilter on or off.
Click the dropdown arrow on any column header to:
- Filter by specific values
- Filter by text: contains, begins with, ends with
- Filter by number: greater than, less than, between
- Filter by date: this week, last month, this year, before/after
- Filter by cell colour or font colour

**Search box**: type inside the filter dropdown to instantly find values in large lists.

## Advanced Filter
**Data -> Advanced**
- Use a separate Criteria Range (a small table with column headers and filter conditions)
- Filter in place OR copy results to another location on the sheet
- Great for complex AND/OR conditions that AutoFilter cannot handle

## Excel Tables (Ctrl+T)

### Why Use Tables Instead of Plain Ranges?
- **Auto-expand**: formulas and formatting automatically include new rows
- **Structured references**: `=Table1[Revenue]` instead of `=$C$2:$C$1000`
- **Filter arrows**: built in on every column header
- **Total Row**: one-click SUM, AVERAGE, COUNT, MAX, MIN at the bottom
- **Consistent formatting**: zebra stripes automatically applied

### Creating a Table
1. Click any cell in your data
2. Press **Ctrl+T**
3. Confirm whether your data has headers -> OK
4. Rename: Table Design tab -> Table Name box (e.g. "SalesData")

### Structured Reference Examples
```
=SUM(SalesData[Revenue])            <- sum the entire Revenue column
=SalesData[@Quantity]*SalesData[@Price]  <- current row calculation
=COUNTIF(SalesData[Region], "North")
```

## Remove Duplicates
**Data -> Remove Duplicates**
Select which columns define a duplicate -> OK
Excel removes duplicate rows and tells you how many were removed.

## Text to Columns
**Data -> Text to Columns**
Step 1: Choose Delimited (comma, space, tab) or Fixed Width
Step 2: Set the delimiter character
Step 3: Set the format for each resulting column
Use case: split "John,Smith" into "John" and "Smith" in separate columns.

## Resources
- Watch: https://www.youtube.com/watch?v=oK5Pn78tiv8
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
