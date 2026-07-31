# Part 1 — Excel 2025 Complete Course: From Beginner to Advanced

## Overview
Full introductory session covering the scope of the Excel 2025 Complete Course — from navigating the interface to building advanced dashboards. This is the foundation video that explains why every analyst needs Excel and what you will master across all 50 chapters.

## What You Will Learn
- What Microsoft Excel is and why every analyst needs it
- Installing and accessing Excel 2025 or Microsoft 365
- Key differences between Excel versions (2016, 2019, 2021, 365)
- Understanding Workbook, Worksheet, Cell, Ribbon, and Formula Bar
- Setting up your workspace before the first lesson

## Core Concepts
| Concept | Description |
|---|---|
| Workbook | An Excel file (.xlsx) containing one or more sheets |
| Worksheet | A single spreadsheet tab inside a workbook |
| Cell | The intersection of a row and column (e.g. A1) |
| Ribbon | Top toolbar containing all Excel commands |
| Formula Bar | Displays and edits the content of the selected cell |
| Name Box | Top-left box showing the active cell address |

## Why Excel in 2025?
- Number one tool used in Finance, HR, Operations, and Analytics worldwide
- Power Query + Power Pivot + DAX bring near-BI-level capability inside Excel
- Seamless integration with Power BI, SQL, Python, and Cloud services
- Every analyst job description lists Excel as a required or preferred skill

## Quick Start Checklist
- [ ] Install Excel 2025 or activate Microsoft 365
- [ ] Open Excel and explore all ribbon tabs
- [ ] Create your first workbook and save it with Ctrl+S
- [ ] Explore the Name Box and Formula Bar
- [ ] Type data into a few cells and navigate with arrow keys

## Course Roadmap (50 Chapters)
| Section | Chapters | Topics |
|---|---|---|
| Foundation | 1-10 | Basics, formulas, PivotTables, charts |
| Core Analytics | 11-20 | Statistics, lookups, financial functions |
| Advanced Analytics | 21-30 | Power Query, Power Pivot, DAX, dashboards |
| Business Applications | 31-40 | HR, Finance, Sales, E-commerce, Retail |
| Professional Skills | 41-50 | VBA, SQL/Python integration, portfolio |

## Resources
- Watch: https://www.youtube.com/watch?v=r5fXft08dVY
- Playlist: https://www.youtube.com/playlist?list=PL6Omre3duO-N7yY1Uxl7hOC3gRMMomamK

---

# 📘 Lesson 1 — What is Microsoft Excel? (Premium LMS Content)

## Learning Objectives
By the end of this lesson you will:
- Understand what Excel is and exactly what it does
- Know every part of the Excel screen by name
- Navigate a workbook confidently using both keyboard and mouse
- Understand the difference between a workbook, worksheet, cell, range, row, and column
- Know why Excel is still the world's most important business tool in 2026
- Use 20+ keyboard shortcuts for navigation
- Understand how Excel stores data internally

---

## What is it?

Imagine you have a giant piece of paper with thousands of tiny boxes drawn on it.

Each box can hold a number, a word, a date, or a formula.

You can add numbers together, compare them, find patterns, build graphs, and create automatic reports — all inside this paper.

That paper is Microsoft Excel.

Excel is a **spreadsheet program** made by Microsoft. It runs on Windows, Mac, and the web.

Think of Excel like a very smart calculator combined with a very organised filing cabinet.

---

## Why do we need it?

Before Excel existed, people used actual paper to track numbers.

Imagine being an accountant in 1980. You had a huge paper ledger. Hundreds of rows. Thousands of numbers. All calculated by hand. One mistake meant erasing and recalculating everything.

Excel solved that problem in 1985 and has kept improving ever since.

Today in 2026, Excel is used by:
- Every finance team in every company to track money
- Every HR team to manage employee data
- Every sales team to track deals and targets
- Every logistics team to track shipments
- Every government to manage budgets

No matter what industry you work in, someone in that organisation is using Excel every single day.

---

## Real World Problem

**Finance at Infosys**: Analysts use Excel to build monthly P&L (Profit and Loss) statements. They track revenue, costs, and profit for each business unit.

**HR at Swiggy**: HR managers use Excel to track 5,000 delivery partners — their joining dates, attendance, performance ratings, and salary.

**Retail at D-Mart**: Inventory managers use Excel to track which products are running low, which are overstocked, and which need reordering.

**Healthcare at Apollo Hospitals**: Administrators use Excel to track patient discharge times, bed occupancy rates, and daily admission counts.

**Banking at HDFC**: Loan officers use Excel to calculate EMIs, build loan amortisation schedules, and compare interest scenarios.

---

## Simple Analogy

Think of Excel as a **restaurant menu board with a calculator built in**.

- Every row is a dish on the menu.
- Every column is a property of that dish: Name, Price, Calories, Rating.
- The formula bar is the chef who calculates the total when you order multiple items.
- The workbook is the entire restaurant binder with multiple pages (sheets).

---

## Internal Working

When you open Excel, here is what happens behind the scenes:

```
You open Excel
      ↓
Excel loads the Ribbon (toolbar)
      ↓
Excel creates a grid in memory
Each cell = a memory address
Cell A1 = Row 1, Column 1
Cell B3 = Row 3, Column 2
      ↓
When you type a number, Excel stores it as a float or integer
When you type text, Excel stores it as a string
When you type a formula, Excel evaluates it and stores the result
      ↓
When you save, Excel writes the file as an XML archive (.xlsx)
```

Excel's grid has:
- **1,048,576 rows** (over 1 million)
- **16,384 columns** (columns go from A to XFD)
- That is **17,179,869,184 cells** in one worksheet

---

## Step-by-Step Explanation

### Step 1: Open Excel
- Press the Windows key → type "Excel" → press Enter
- Or find it in the Start menu under Microsoft Office

### Step 2: Choose a starting point
- **Blank Workbook** — start fresh
- **Template** — use a pre-built design (budget, calendar, invoice)

### Step 3: Understand the screen
- **Top**: Quick Access Toolbar (QAT)
- **Below QAT**: Ribbon with tabs (Home, Insert, Formulas, Data...)
- **Left side**: Row numbers (1, 2, 3...)
- **Top**: Column letters (A, B, C...)
- **Centre**: The grid of cells
- **Below the grid**: Sheet tabs
- **Bottom**: Status bar

### Step 4: Click a cell
- Click any cell — it becomes the "active cell"
- A green border appears around it
- The Name Box (top-left) shows its address: A1, B5, Z100

### Step 5: Type something
- Type any number or text
- It appears in the cell AND in the Formula Bar above
- Press Enter to confirm

---

## Visual Explanation

```
┌──────────────────────────────────────────────────────────────┐
│  Quick Access Toolbar (QAT) ─ Save, Undo, Redo, Customize   │
├──────────────────────────────────────────────────────────────┤
│  [Home] [Insert] [Page Layout] [Formulas] [Data] [Review]   │
│                        RIBBON                                │
├────────┬─────────────────────────────────────────────────────┤
│ A1   ↓ │  Formula Bar ─ shows content of active cell        │
├────────┼──────┬──────┬──────┬──────┬──────┬──────────────── │
│        │  A   │  B   │  C   │  D   │  E   │                 │
│   1    │      │      │      │      │      │                 │
│   2    │      │  ←   │      │      │      │                 │
│   3    │      │  Active Cell (green border)    │             │
│   4    │      │      │      │      │      │                 │
├────────┴──────┴──────┴──────┴──────┴──────┴─────────────────┤
│  [Sheet1] [Sheet2] [Sheet3]  +                               │
├──────────────────────────────────────────────────────────────┤
│  Status Bar: Sum: 0   Average: 0   Count: 0   Ready         │
└──────────────────────────────────────────────────────────────┘
```

---

## Beginner Method: Mouse Navigation

1. Click a cell to select it
2. Click and drag to select a range
3. Click a sheet tab to switch sheets
4. Use the scroll bars on the right and bottom to move around
5. Zoom in/out using the slider at the bottom-right

---

## Professional Method: Keyboard Navigation

Professionals never touch the mouse while entering data. Here is how they navigate:

| Action | Keyboard |
|---|---|
| Move one cell | Arrow keys |
| Jump to last filled cell | Ctrl + Arrow |
| Go to A1 | Ctrl + Home |
| Go to last used cell | Ctrl + End |
| Switch sheets | Ctrl + Page Up / Page Down |
| Go to specific cell | Press F5 → type address → Enter |
| Select entire row | Shift + Spacebar |
| Select entire column | Ctrl + Spacebar |
| Select used range | Ctrl + Shift + End |

---

## Fastest Method: Name Box Navigation

1. Click the **Name Box** (the box showing "A1" at the top-left)
2. Type any cell address: `Z1000`
3. Press Enter — you jump there instantly

Or type a range: `A1:D50` → press Enter → selects all 200 cells instantly.

---

## Advanced Method: Go To Special (F5)

Press **F5** → click **Special**

This opens a powerful dialog that lets you select:
- Only cells with formulas
- Only blank cells
- Only cells with errors
- Only visible cells (great after filtering)
- Only cells with conditional formatting

**Use case**: You have 10,000 rows. You want to select only the blank cells to fill them with "N/A". F5 → Special → Blanks → OK → type "N/A" → Ctrl+Enter.

---

## Keyboard Shortcuts (Complete Reference)

### Navigation
| Shortcut | Windows | Mac | What it does |
|---|---|---|---|
| Move one cell | Arrow keys | Arrow keys | Move in any direction |
| Jump to data edge | Ctrl+Arrow | Cmd+Arrow | Jump to last filled cell |
| Go to A1 | Ctrl+Home | Cmd+Home | Go to beginning |
| Go to last used cell | Ctrl+End | Cmd+End | Go to bottom-right of data |
| Switch sheet forward | Ctrl+PgDn | Ctrl+PgDn | Next sheet tab |
| Switch sheet backward | Ctrl+PgUp | Ctrl+PgUp | Previous sheet tab |
| Go to cell | F5 or Ctrl+G | F5 or Cmd+G | Jump to any cell |
| Scroll without moving selection | Scroll Lock + Arrows | — | Moves view only |

### Selection
| Shortcut | What it does |
|---|---|
| Shift+Arrow | Extend selection one cell |
| Ctrl+Shift+Arrow | Extend selection to data edge |
| Ctrl+A | Select all used cells (press twice for entire sheet) |
| Ctrl+Shift+End | Select from active cell to last used cell |
| Ctrl+Shift+Home | Select from active cell to A1 |
| Shift+Click | Select range between current cell and clicked cell |

### Editing
| Shortcut | What it does |
|---|---|
| F2 | Edit active cell (cursor at end) |
| Escape | Cancel edit without saving |
| Delete | Clear cell contents |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Alt+Enter | New line inside a cell |
| Ctrl+Enter | Confirm and stay in cell |
| Tab | Confirm and move right |
| Shift+Tab | Confirm and move left |

### Workbook Management
| Shortcut | What it does |
|---|---|
| Ctrl+S | Save |
| Ctrl+N | New workbook |
| Ctrl+O | Open workbook |
| Ctrl+W | Close workbook |
| Ctrl+F4 | Close workbook |
| Ctrl+P | Print |
| Ctrl+F | Find |
| Ctrl+H | Find and Replace |

### Function Keys
| Key | What it does |
|---|---|
| F1 | Help |
| F2 | Edit cell |
| F4 | Repeat last action / absolute reference toggle |
| F5 | Go To dialog |
| F7 | Spell check |
| F9 | Recalculate all formulas |
| F11 | Create a chart on new sheet |
| F12 | Save As |

---

## Mouse Method

| Action | How |
|---|---|
| Select a cell | Left-click |
| Select a range | Click and drag |
| Select non-adjacent cells | Ctrl+Click each cell |
| Resize a column | Drag the column border in the header |
| Resize a row | Drag the row border in the header |
| AutoFit column width | Double-click the column border |
| Right-click menu | Right-click any cell |
| Move a sheet | Click and drag the sheet tab |
| Copy a sheet | Ctrl + drag the sheet tab |

---

## Ribbon Navigation

Every feature in Excel lives somewhere in the Ribbon. Here is the map:

```
Home
├── Clipboard (Copy, Cut, Paste, Format Painter)
├── Font (Bold, Italic, Underline, Font size, Colour)
├── Alignment (Wrap Text, Merge, Indent, Centre)
├── Number (Format: %, $, Date, Custom)
├── Styles (Conditional Formatting, Cell Styles, Table)
└── Cells & Editing (Insert, Delete, Sort, Find)

Insert
├── Tables (Table, PivotTable)
├── Illustrations (Pictures, Shapes, Icons)
├── Charts (Column, Line, Pie, Bar, Scatter, Combo)
├── Sparklines (Line, Column, Win/Loss)
└── Filters (Slicer, Timeline)

Formulas
├── Function Library (Insert Function, AutoSum, Recently Used)
├── Defined Names (Name Manager, Define Name, Create from Selection)
└── Formula Auditing (Trace Precedents, Error Checking, Evaluate)

Data
├── Get & Transform (Power Query — Get Data, From Text, From Web)
├── Queries & Connections
├── Sort & Filter (Sort A-Z, Sort Z-A, Filter, Advanced)
├── Data Tools (Text to Columns, Remove Duplicates, Validation)
└── Forecast (What-If Analysis, Forecast Sheet)
```

---

## Right Click Methods

Right-clicking a cell opens a context menu. Key options:
- **Format Cells (Ctrl+1)** — number, font, alignment, border, fill
- **Insert** — add row/column above/left
- **Delete** — remove row/column
- **Hide** — hide row or column
- **Define Name** — name the cell or range
- **Hyperlink** — add a clickable link

---

## Quick Access Toolbar (QAT) Tips

The QAT sits above the Ribbon. Add any command you use daily:

1. Right-click any Ribbon command → **Add to Quick Access Toolbar**
2. Or: click the dropdown arrow on the QAT → **More Commands**

**Recommended QAT setup for analysts:**
- Save (Ctrl+S already works, but visual reminder is useful)
- Undo (multiple levels)
- Redo
- Print Preview
- Paste Special
- Remove Duplicates
- Freeze Panes
- Filter Toggle

---

## Hidden Productivity Tricks

### Trick 1: Double-click the fill handle to AutoFill a column instantly
If column A has 1,000 rows of data and you write a formula in B1, double-click the fill handle (bottom-right corner of B1) — it fills all 1,000 rows instantly.

### Trick 2: Ctrl+` (backtick) to see all formulas
Press **Ctrl+`** to toggle between showing formula text and formula results across the entire sheet. Great for auditing.

### Trick 3: Alt key reveals Ribbon shortcuts
Press **Alt** — letters appear on every Ribbon tab. Press the letter to activate that tab without clicking. Then press more letters for specific commands.

```
Alt → H → B → A   = Apply All Borders
Alt → H → A → C   = Centre align
Alt → M → I       = Insert Function dialog
```

### Trick 4: The Status Bar does instant calculations
Select any range of cells containing numbers. Look at the bottom-right of the screen. Excel shows Sum, Average, and Count instantly — without any formula.

### Trick 5: Ctrl+Shift+Plus to insert rows/columns
Select a row → Ctrl+Shift+Plus → Excel inserts a new row above.

---

## Real Company Example

**Amazon Operations Team** uses Excel dashboards to track daily order volumes across 20 warehouses. Each warehouse manager receives a shared Excel workbook every morning. They navigate to their region's sheet using Ctrl+Page Down, check the previous day's numbers, and update their counts.

**Swiggy's Finance Team** uses Excel to reconcile delivery partner payments every week. They navigate between 5 sheets — one per city — using Ctrl+Page Up/Down to compare numbers.

---

## Business Use Cases

| Industry | How Excel Navigation Is Used |
|---|---|
| Finance | Navigate between 15 sheets in a financial model |
| HR | Jump to specific employee rows using Ctrl+F |
| Sales | Use F5 → Go To to jump to month-end rows |
| Logistics | Ctrl+End to find where the last shipment row is |
| Healthcare | Freeze top row and navigate 50,000 patient records |

---

## Performance Tips

- **Large files (100MB+)**: turn off automatic recalculation temporarily: Formulas → Calculation Options → Manual. Recalculate manually with F9.
- **Navigation speed**: Ctrl+Arrow is 100x faster than scrolling. Always use it.
- **File size**: `.xlsx` is compressed XML. Save as `.xlsb` (Binary) for 30-40% smaller files with faster open/save on huge datasets.

---

## Best Practices (2026)

- Always name your sheets clearly. "Sheet1" is meaningless. Use "Sales_Q1", "HR_Data", "Summary".
- Never use merged cells in data ranges. They break sorting, filtering, and formulas.
- Keep one table per sheet. Do not mix multiple unrelated datasets on one sheet.
- Use Excel Tables (Ctrl+T) from day one. They auto-expand and have structured references.
- Save versions with dates: `Report_2026_07_03.xlsx`. Never overwrite your only copy.

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| Scrolling with mouse wheel to navigate | Slow and inaccurate | Use Ctrl+Arrow keys |
| Clicking individual sheet tabs to switch | Slow | Ctrl+Page Up/Down |
| Not knowing where the last row is | Waste time scrolling | Ctrl+End shows it instantly |
| Using merged cells in data | Breaks formulas and sort | Use Centre Across Selection instead |
| Saving as .xls instead of .xlsx | Old format, smaller size limit | Always use .xlsx or .xlsb |

---

## Troubleshooting

**Problem: Arrow keys scroll the entire sheet instead of moving the cell selection**
Cause: Scroll Lock is ON
Fix: Press the Scroll Lock key on your keyboard (or use the on-screen keyboard: Win+R → osk)

**Problem: Ctrl+Home goes to a cell other than A1**
Cause: Freeze Panes are set
Fix: View → Freeze Panes → Unfreeze Panes, then Ctrl+Home

**Problem: Clicking a cell selects the entire row**
Cause: You accidentally clicked the row number, not the cell
Fix: Click inside the grid area

---

## Security Tips

- Do not store passwords in plain text in any cell
- Use File → Info → Protect Workbook → Encrypt with Password for sensitive files
- Be careful when sharing: File → Info → Check for Issues → Inspect Document removes hidden data before sharing

---

## Version Differences

| Feature | Excel 2019 | Excel 2021 | Microsoft 365 | Excel Web |
|---|---|---|---|---|
| Maximum rows | 1,048,576 | 1,048,576 | 1,048,576 | 1,048,576 |
| Maximum columns | 16,384 | 16,384 | 16,384 | 16,384 |
| Copilot | ❌ | ❌ | ✅ | ✅ |
| Dynamic Arrays | ❌ | ✅ | ✅ | ✅ |
| XLOOKUP | ❌ | ✅ | ✅ | ✅ |
| LET function | ❌ | ✅ | ✅ | ✅ |
| Auto-save | ❌ | ❌ | ✅ (OneDrive) | ✅ |

---

## AI & Copilot (2026)

Microsoft Copilot is now embedded in Excel 365. Here is what it can do for navigation and orientation:

- **"Show me a summary of this workbook"** — Copilot reads all sheets and gives an overview
- **"Navigate to the sales data"** — Copilot highlights the relevant range
- **"What is in column G?"** — Copilot explains the column content
- **"Find all cells with errors"** — Copilot highlights error cells and explains causes

To access: Look for the Copilot button (sparkle icon) in the Ribbon under the Home tab. Requires Microsoft 365 subscription.

---

## Interview Questions

**Beginner:**
Q: What is the difference between a workbook and a worksheet?
A: A workbook is the entire Excel file. A worksheet is a single tab/sheet inside that file. One workbook can have up to 255 worksheets.

Q: What does Ctrl+End do?
A: It moves to the last used cell — the cell at the intersection of the last used row and last used column.

**Intermediate:**
Q: How do you navigate to a specific cell quickly in a large spreadsheet?
A: Press F5 (Go To) or Ctrl+G, type the cell address, press Enter. Alternatively, click the Name Box and type the address.

Q: What is the maximum number of rows in an Excel worksheet?
A: 1,048,576 rows (2^20).

**Advanced:**
Q: Explain the difference between .xlsx and .xlsb file formats.
A: .xlsx is XML-based and human-readable. .xlsb is binary format — opens 30-40% faster and is smaller, but less compatible with non-Microsoft tools. Use .xlsb for large performance-critical files.

**Senior:**
Q: How would you design a navigation structure for a workbook with 30 sheets used by 50 different analysts?
A: Create a "Table of Contents" sheet as the first tab. Use hyperlinks from the TOC to each sheet and back. Add a consistent navigation bar on every sheet. Protect the structure to prevent accidental sheet deletion.

---

## Practice Exercises

**Easy:**
1. Open Excel and identify every element of the screen by name (Ribbon, Formula Bar, Name Box, Sheet tabs, Status Bar).
2. Navigate to cell Z100 using the Name Box. Come back to A1 using Ctrl+Home.
3. Select the range B2:F10 without using the mouse (Name Box → B2:F10 → Enter).

**Medium:**
4. Create a workbook with 5 sheets. Name each sheet after a month (Jan, Feb, Mar, Apr, May). Navigate between them using only the keyboard.
5. Open a blank workbook. Enter numbers in A1:A20. Use Ctrl+End to confirm the last used cell. Add data in Z1. Press Ctrl+End again. What changed?

**Hard:**
6. Open any large Excel file. Use F5 → Special → Blanks to select all blank cells in a column. Fill them all with "N/A" using Ctrl+Enter. Then use Ctrl+Z to undo.
7. Configure your QAT to have 8 of your most-used commands. Export your customisation and save the .exportedUI file.

---

## Mini Project

**Project: Build Your First Navigation-Ready Workbook**

1. Create a new workbook called `Analytics_Starter.xlsx`
2. Create 5 sheets: **Summary**, **Raw_Data**, **Charts**, **Calculations**, **Reference**
3. On the Summary sheet, create a table of contents with hyperlinks to each sheet
4. On each sheet, add a "Back to Summary" hyperlink in cell A1
5. Add your name and the date to the Summary sheet
6. Save as both .xlsx and .xlsb
7. Password-protect the workbook

---

## Portfolio Project

**"Excel Workspace Setup Guide" — Showcase Item**

Document your professional Excel workspace:
1. Screenshot your custom QAT setup with annotations explaining each button
2. Screenshot your custom Ribbon tab with your most-used commands
3. Create a one-page "Excel Keyboard Shortcut Reference" sheet using Excel itself
4. Save everything in a single workbook: `Portfolio_Excel_Setup.xlsx`

This demonstrates to any employer or client that you work like a professional analyst, not like a beginner clicking through menus.

---

## Quiz

1. What is the keyboard shortcut to go to cell A1?
   - a) Ctrl+A  b) Ctrl+Home  c) F5  d) Ctrl+1
   **Answer: b) Ctrl+Home**

2. How many rows does an Excel worksheet have?
   - a) 65,536  b) 500,000  c) 1,048,576  d) 16,384
   **Answer: c) 1,048,576**

3. What does the Name Box show?
   - a) The formula in the cell  b) The address of the active cell  c) The sheet name  d) The file name
   **Answer: b) The address of the active cell**

4. What shortcut selects the range from the current cell to the last used cell?
   - a) Ctrl+End  b) Ctrl+Shift+End  c) Ctrl+A  d) Shift+End
   **Answer: b) Ctrl+Shift+End**

5. What file format is binary and opens faster than .xlsx?
   - a) .xls  b) .csv  c) .xlsb  d) .xlsm
   **Answer: c) .xlsb**

6. What happens when you press Ctrl+` (backtick)?
   - a) Opens a new file  b) Shows all formulas  c) Saves the file  d) Deletes the cell
   **Answer: b) Shows all formulas**

7. How do you insert a new row using keyboard only?
   - a) Ctrl+I  b) Select row → Ctrl+Plus  c) Alt+I+R  d) F6
   **Answer: b) Select row → Ctrl+Shift+Plus**

8. What does Ctrl+Page Down do?
   - a) Scrolls down  b) Goes to next sheet  c) Goes to last row  d) Opens Print dialog
   **Answer: b) Goes to next sheet**

9. What does F5 open?
   - a) Find  b) Spell check  c) Go To dialog  d) Format Cells
   **Answer: c) Go To dialog**

10. To select only blank cells in a range, you use:
    - a) Ctrl+F → blanks  b) F5 → Special → Blanks  c) Home → Find → Blanks  d) Data → Filter → Blanks
    **Answer: b) F5 → Special → Blanks**

---

## Cheat Sheet

```
╔══════════════════════════════════════════════════════════╗
║            EXCEL NAVIGATION CHEAT SHEET                  ║
╠══════════════════════════════════════════════════════════╣
║  Go to A1              │ Ctrl + Home                     ║
║  Go to last used cell  │ Ctrl + End                      ║
║  Jump to data edge     │ Ctrl + Arrow                    ║
║  Select to data edge   │ Ctrl + Shift + Arrow            ║
║  Switch sheet          │ Ctrl + PgUp / PgDn              ║
║  Go to specific cell   │ F5 or Ctrl+G                    ║
║  Select used range     │ Ctrl + Shift + End              ║
║  Edit cell             │ F2                              ║
║  Show all formulas     │ Ctrl + `                        ║
║  New line in cell      │ Alt + Enter                     ║
║  Select all            │ Ctrl + A                        ║
║  Find                  │ Ctrl + F                        ║
║  Find & Replace        │ Ctrl + H                        ║
╚══════════════════════════════════════════════════════════╝
```

---

## Memory Tricks

- **Ctrl+Home = HOME button** — takes you to the "home" of the spreadsheet (A1)
- **Ctrl+End = END of the story** — takes you to the last cell with data
- **Ctrl+Arrow = ARROW at full speed** — jumps over empty cells to the next data edge
- **F5 = FIVE fingers pointing to a spot** — Go To exactly where you want
- **Ctrl+PgDn = turn the PAGE DOWN** — goes to the next sheet (next page of the workbook)

---

## Summary

Excel is a grid of cells organised in rows and columns inside worksheets, all contained in a workbook.

The most important skills in this lesson:
1. Know every part of the screen by name
2. Navigate using Ctrl+Arrow, Ctrl+Home, Ctrl+End instead of scrolling
3. Use the Name Box to jump to any cell instantly
4. Use F5 → Special for selecting specific types of cells
5. Use Ctrl+Page Up/Down to switch between sheets

Every other Excel skill builds on top of fast, confident navigation.

---

## Related Topics

- **Part 2** — Master the Excel User Interface (deep dive on every UI element)
- **Part 7** — Data Entry (now that you can navigate, learn to enter data efficiently)
- **Part 9** — Shortcuts and Functions (expand your shortcut library)
- **Chapter 8** — PivotTables (requires navigating large datasets confidently)

---

## Frequently Asked Questions

**Q: I pressed something and now the arrow keys scroll the sheet instead of moving the cell. What happened?**
A: You accidentally pressed Scroll Lock. Press Scroll Lock again to turn it off. You will see "SCRL" disappear from the status bar at the bottom.

**Q: Can Excel run out of rows?**
A: Yes — the limit is 1,048,576 rows. For larger datasets, use Power Query to load only a summary, or use a database (SQL) to store the data and query it from Excel.

**Q: What is the difference between pressing Delete and pressing Backspace in a cell?**
A: Delete clears the cell contents while staying in the cell. Backspace enters edit mode and deletes one character at a time.

**Q: Can I use Excel without a keyboard?**
A: Yes, everything works with a mouse. But professionals always prefer keyboard shortcuts — they are 3-5x faster for data work.

**Q: Is Excel free?**
A: Excel comes with Microsoft 365 (subscription) or can be purchased as a one-time Office 2021 licence. Excel for the web (excel.new) is free with a Microsoft account but has limited features.

---

## Additional Knowledge

### Excel for the Web (2026)
Excel now runs fully in your browser at office.com. It supports:
- Most formulas and PivotTables
- Collaborative editing (multiple users simultaneously)
- Copilot integration
- Auto-save to OneDrive

Limitation: No VBA macros in the web version.

### Excel on Mobile
Available on iOS and Android. Good for viewing and light editing. Not recommended for serious analysis work due to screen size.

### Microsoft Fabric Integration (2026)
Excel now connects directly to Microsoft Fabric, Microsoft's enterprise analytics platform. Analysts can publish Excel models to Fabric and have them refresh automatically from data warehouses.

### Copilot in Excel — 2026 Update
Copilot can now:
- Generate formulas from plain English descriptions
- Explain what a complex formula does in simple terms
- Identify trends and anomalies in your data automatically
- Build PivotTables from natural language ("Show me sales by region by month")
- Create charts automatically with appropriate types selected

Copilot requires Microsoft 365 E3 or higher licence.
