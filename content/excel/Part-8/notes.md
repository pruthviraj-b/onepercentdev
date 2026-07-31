# Part 8 — Step-by-Step Guide to Data Entry and Formatting

## Overview
Raw data without formatting is hard to read and error-prone. Professional formatting makes spreadsheets clear, consistent, and presentation-ready — and signals that you take your work seriously.

## What You Will Learn
- Number formatting: currency, percentage, decimal places
- Date and time formatting with custom codes
- Font, size, bold, italic, underline
- Cell alignment and text wrapping
- Borders and fill colours
- Format Painter for copying styles
- Cell styles and themes

## Number Format Codes (Ctrl+1 -> Number -> Custom)
| Purpose | Code | Displays As |
|---|---|---|
| Currency | `$#,##0.00` | $1,234.56 |
| Indian currency | `##,##,##0.00` | 12,34,567.00 |
| Percentage | `0.00%` | 45.67% |
| Thousands separator | `#,##0` | 1,234 |
| Date | `DD/MM/YYYY` | 03/07/2025 |
| Date with day | `DDD, DD MMM YYYY` | Thu, 03 Jul 2025 |
| Time | `HH:MM:SS` | 14:30:00 |
| Duration | `[h]:MM:SS` | 26:15:00 (over 24h) |

## Custom Colour Formats
```
[Green]#,##0;[Red]-#,##0
```
Positive values display in green, negative values in red.

```
0.0" kg"
```
Appends a unit label — shows "42.5 kg"

## Alignment Options
- Horizontal: Left, Centre, Right, Justify
- Vertical: Top, Middle, Bottom
- Wrap Text: expands row height to fit long text in one cell
- Merge and Centre: for header rows only — avoid in data ranges (breaks formulas)
- Indent: use for hierarchical data (subcategories under categories)

## Format Painter — Copy Formatting Instantly
1. Select a cell with the formatting you want to copy
2. Click **Format Painter** (paintbrush icon on Home tab)
3. Click the destination cell or drag over a range

**Pro tip**: Double-click Format Painter to apply to multiple ranges. Press Esc when done.

## Cell Styles
Home -> Cell Styles
Apply consistent one-click styles: Heading 1, Total, Good, Bad, Neutral, Calculation.
Useful for standardising the look of any workbook.

## Resources
- Watch: https://www.youtube.com/watch?v=DyG6Gc8nOAE
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
