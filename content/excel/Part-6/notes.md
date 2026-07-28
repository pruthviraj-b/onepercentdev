# Part 6 — Top 5 Excel Data Types You Must Know

## Overview
Excel stores data in 5 core types. Knowing which type you are working with prevents the most frustrating errors in analytics — formulas that return zero, sorts that break, and charts that display nothing.

## The 5 Core Data Types
| # | Type | Example | Default Alignment | Internal Storage |
|---|---|---|---|---|
| 1 | Number | 42, 3.14, -100 | Right | Numeric value |
| 2 | Text (String) | "Sales", "John" | Left | Character string |
| 3 | Date/Time | 01/07/2025, 09:30 | Right | Serial number |
| 4 | Boolean (Logical) | TRUE / FALSE | Centre | 1 or 0 |
| 5 | Error | #VALUE!, #REF! | Left | Error code |

## Why This Matters
- Numbers stored as text will **not sum** correctly — SUM returns 0
- Dates stored as text **cannot** be used in date formulas like DATEDIF or MONTH
- Mismatched types cause `#VALUE!` errors in formulas

## How to Detect the Data Type
Alignment gives the first clue:
- Left-aligned = Text
- Right-aligned = Number or Date

Use functions to check:
```
=ISNUMBER(A1)   -> TRUE if A1 is a number
=ISTEXT(A1)     -> TRUE if A1 is text
=ISBLANK(A1)    -> TRUE if A1 is empty
=ISERROR(A1)    -> TRUE if A1 contains an error
```

## Fixing Numbers Stored as Text (Common Problem)
**Method 1 — Warning icon**:
1. Select the column with green triangles in the top-left of cells
2. Click the yellow warning icon -> **Convert to Number**

**Method 2 — VALUE function**:
```
=VALUE(A1)
```
Use in a helper column, then paste as values back to the original column.

**Method 3 — Paste Special multiply by 1**:
1. Type 1 in an empty cell -> Copy it
2. Select the problem column -> Paste Special -> Multiply -> OK

## Date Internals — What Excel Really Stores
Excel stores dates as serial numbers:
- January 1, 1900 = 1
- July 3, 2025 = 45841

This is why you can:
- Subtract two dates: =B1-A1 gives the number of days between them
- Add days to a date: =A1+30 gives the date 30 days later
- Format a plain number as a date: Ctrl+1 -> Number -> Date

## Resources
- Watch: https://www.youtube.com/watch?v=F3z_RmHiCA4
- Playlist: https://www.youtube.com/playlist?list=PL6Omre3duO-N7yY1Uxl7hOC3gRMMomamK


---

# Part 6 — Excel Data Types (Premium Lesson)

## Learning Objectives
By the end of this lesson you will be able to:
- Identify and describe every Excel data type (Number, Text, Date, Time, Boolean, Error, Blank)
- Explain how Excel stores each type internally (IEEE 754, serial dates, Unicode)
- Diagnose why numbers stored as text cause formula failures
- Convert any type to any other type using the correct method
- Work with Linked Data Types (Stocks and Geography)
- Understand Dynamic Array data types introduced in Excel 365
- Explain the serial date system and calculate dates manually
- Prevent the most common type-mismatch errors in analytics work

## What is a Data Type?
Imagine a spreadsheet cell is a jar. You can put different things in a jar — water, sand, coins, or air (nothing). But you have to treat each differently: you drink water, you build with sand, you spend coins, and you don't store air on purpose. Excel's data types are the different "things" that go in cells, and each requires different treatment: numbers can be added, text can be joined, dates can be compared, blanks must be handled as special cases, and errors must be caught before they break formulas downstream.

## Why Do Data Types Matter So Much?
- VLOOKUP returns #N/A when lookup value is text but table has numbers (or vice versa)
- SUM returns 0 when numbers are stored as text
- DATEDIF returns #VALUE! when dates are stored as text strings
- Sorting "numbers" stored as text sorts 1, 10, 11, 2, 20, 21... (text sort, not numeric)
- Pivot Tables place text-numbers in separate buckets from real numbers
- Conditional formatting rules comparing values fail silently when types mismatch
- AVERAGEIF returns 0 instead of the correct average when criteria types mismatch
- Charts display empty segments when supposed numeric data is actually text
Understanding data types is the single most important debugging skill in Excel analytics.

## Real World Problem — Finance
A finance team imports monthly revenue data from an ERP system. The CSV exports "Revenue" values like "₹1,23,456.00" — with the rupee symbol and commas included as text. Excel stores this as a text string. The SUM formula at the bottom returns ₹0.00. The monthly report shows zero revenue. The team spends 3 hours "checking formulas." The actual problem is a data type issue. The fix (VALUE function or Text to Columns) takes 30 seconds once you know data types.

## Simple Analogy
Think of data types like different types of containers in a kitchen: a measuring cup (number), a label (text), a calendar page (date), a timer (time), a light switch (Boolean), a broken container (error), and an empty shelf (blank). You measure liquids with the cup, read labels for text, check the calendar for dates, use the timer for time, flip the switch on or off, handle the broken container carefully, and recognise the empty shelf as genuinely empty — not zero.

## Internal Working — How Excel Stores Each Type

### Numbers — IEEE 754 Double Precision
Excel stores ALL numbers as 64-bit IEEE 754 floating-point doubles. This means:
- Range: approximately ±1.8 × 10^308
- Precision: 15-17 significant decimal digits
- Integer representation: integers up to 2^53 (9,007,199,254,740,992) are exact
- Decimal representation: some fractions cannot be represented exactly (0.1 + 0.2 ≠ 0.3 exactly in IEEE 754)
- This is why =0.1+0.2 can show as 0.30000000000000004 at full precision

### Text (Strings) — Unicode UTF-16
Excel stores text as Unicode strings. Each character is a 16-bit code point. Maximum cell content: 32,767 characters. The formula bar can show up to 32,767 characters. A cell displays approximately 1,024 characters before truncating display (but stores all 32,767). Text is left-aligned by default. Numbers stored as text (due to import issues) are technically Unicode strings that look like numbers — Excel cannot perform arithmetic on them.

### Dates and Times — Serial Number System
Excel stores dates as serial numbers:
- January 1, 1900 = serial number 1 (Note: Excel incorrectly includes Feb 29, 1900 which didn't exist — a Lotus 1-2-3 compatibility bug, so actual 1900 dates are off by 1)
- January 1, 2000 = 36526
- January 1, 2026 = 46023 (approximate)
- Times are stored as decimal fractions of a day: 0.5 = noon, 0.25 = 6:00 AM, 0.75 = 6:00 PM
- A datetime like January 1, 2026 at 3:00 PM = 46023.625
This is why you can do date math: =B1-A1 gives days between dates; =A1+30 gives date 30 days later.

### Booleans — 1 and 0
TRUE is stored internally as 1, FALSE as 0. This is why =TRUE+TRUE returns 2 and =IF(A1>0, TRUE, FALSE)+5 works as arithmetic. When multiplying, TRUE=1 and FALSE=0 enables conditional calculations without IF: =SUMPRODUCT((A1:A10>5)*B1:B10) sums B values where A>5.

### Errors — Internal Error Codes
Excel errors are special values with numeric codes:
- #NULL! (error code 1) — incorrect range operator
- #DIV/0! (error code 2) — division by zero
- #VALUE! (error code 3) — wrong data type in operation
- #REF! (error code 4) — invalid cell reference
- #NAME? (error code 5) — unrecognised formula text
- #NUM! (error code 6) — invalid numeric value
- #N/A (error code 7) — value not available
- #GETTING_DATA (temporary, data still loading — Power Query or external connections)
- #SPILL! (error code specific to 365) — dynamic array cannot spill
- #CALC! (error code specific to 365) — calculation engine error
- #CONNECT! — data connection failure

### Blank Cells — Not Zero, Not Empty String
A truly blank cell is different from a cell containing "" (empty text string) and a cell containing 0. ISBLANK(A1) returns TRUE only for a genuinely empty cell. A cell with ="" returns FALSE for ISBLANK. A cell with 0 is a number. Distinguishing these is critical for COUNTIF, AVERAGEIF, and conditional logic.

## Visual Explanation — Type Detection

```
ALIGNMENT TELLS YOU THE TYPE:
+-----+----------+----------+---------+---------+
|     | Column A | Column B | Col C   | Col D   |
+-----+----------+----------+---------+---------+
|  1  | 42       |  42      | 42      | TRUE    |
|     | (right)  | (left!)  | (right) | (centre)|
|     | Number ✓ | Text x   | Number  | Boolean |
+-----+----------+----------+---------+---------+
         ↑            ↑
    Real number   Number stored
    (can SUM)     as text — SUM returns 0!

GREEN TRIANGLE IN CORNER = Number stored as text warning
+-------+
|▲ 42   |  ← Green triangle top-left corner
|       |     Click yellow warning icon:
+-------+     "Convert to Number"

TYPE DETECTION FUNCTIONS:
=ISNUMBER(A1)   → TRUE/FALSE
=ISTEXT(A1)     → TRUE/FALSE
=ISBLANK(A1)    → TRUE/FALSE
=ISERROR(A1)    → TRUE/FALSE
=ISLOGICAL(A1)  → TRUE/FALSE (Booleans)
=TYPE(A1)       → 1=Number, 2=Text, 4=Boolean, 16=Error, 64=Array
```

## Complete Type Conversion Methods

### Convert Text to Number (5 methods)
**Method 1 — Warning Icon**: Select cells with green triangles -> click yellow warning icon -> "Convert to Number" (fastest for clean number strings)

**Method 2 — VALUE Function**:
```excel
=VALUE(A1)
```
Returns the numeric value of a text string that looks like a number. Use in helper column, then Paste Special Values back.

**Method 3 — Paste Special Multiply by 1**:
1. Type 1 in an empty cell -> Copy it
2. Select the text-number column
3. Paste Special (Ctrl+Alt+V) -> Multiply -> OK
This multiplies every cell by 1, forcing Excel to evaluate them as numbers.

**Method 4 — Double Unary Operator in Formula**: `=--A1` or `=(A1*1)` inside another formula — forces text-number to numeric inline without a helper column.

**Method 5 — Text to Columns**: Select column -> Data -> Text to Columns -> Finish (no changes needed) — forces Excel to re-parse the column and correctly identify numeric strings as numbers.

### Convert Number to Text
```excel
=TEXT(A1, "0.00")        → "42.35" as text with 2 decimal places
=TEXT(A1, "DD/MM/YYYY")  → Date number formatted as text date string
=A1&""                   → Concatenating with empty string forces number to text
```

### Convert Text Date to Real Date
```excel
=DATEVALUE("01/07/2026")  → Returns the serial number for that date
=DATEVALUE(A1)            → Converts text date in A1 to serial number
```
Then format the result cell as a Date (Ctrl+1).

### Convert Number to Date
Simply format a serial number as a date: press Ctrl+1, select Date category. The number 46023 becomes a readable date automatically.

### Convert Boolean to Number
```excel
=A1*1           → TRUE becomes 1, FALSE becomes 0
=IF(A1,1,0)     → Explicit conversion
=N(A1)          → Returns 1 for TRUE, 0 for FALSE, text 0, date serial
```

### Detect and Handle Errors
```excel
=IFERROR(formula, "")           → Shows empty string instead of any error
=IFERROR(formula, 0)            → Shows 0 for errors
=IFERROR(formula, "No data")    → Custom message for errors
=IFNA(formula, "Not found")     → Handles only #N/A errors (better than IFERROR for lookups)
```

## Linked Data Types (Excel 365)

### Stocks Data Type
1. Type a stock symbol or company name in a cell (e.g., "MSFT" or "Microsoft")
2. Select the cell
3. Data -> Data Types -> Stocks
4. Excel connects to the Bing/Microsoft Finance data source and converts the cell into a "Stocks" linked data type
5. A small building/chart icon appears in the cell
6. Click the icon or use the Extract Data button to pull: Price, Change, Volume, 52-week High/Low, P/E Ratio, Market Cap, Exchange, Currency, and more
7. Reference the stock data in formulas: `=A1.Price`, `=A1.Change`, `=A1.[52 week high]`

### Geography Data Type
1. Type a location name (city, country, region — e.g., "India", "Mumbai", "Karnataka")
2. Select cells
3. Data -> Data Types -> Geography
4. Excel converts to Geography linked data type
5. Extract: Population, Area, Capital, Currency, Time Zone, and more
6. Reference: `=A1.Population`, `=A1.Capital`, `=A1.Currency`

### Creating Custom Linked Data Types
Excel 365 with Power Query allows creating custom linked data types from internal data sources. Define a table with multiple related columns, load it into the Data Model, and use Power Pivot to create a linked data type that behaves like the built-in Stocks type but uses your company's own data. This is used in enterprise Excel for things like "Employee" data types, "Product" data types, or "Customer" data types.

## Dynamic Array Data Types (Excel 365)

### SPILL Range
In Excel 365, array formulas return a range of values (a "spill range") instead of a single value. The data type of a spill range is an array containing the underlying data types of each element. A formula like `=UNIQUE(A1:A100)` returns a dynamic array of text or numbers depending on column A's content.

### Implicit Intersection Operator (@)
In pre-365 formulas, array functions required Ctrl+Shift+Enter. In 365, they auto-spill. The @ operator forces single-value return for backwards compatibility: `=@UNIQUE(A1:A100)` returns only the first unique value.

### LAMBDA Data Type
Excel 365 LAMBDA creates reusable custom functions stored in the Name Manager. The LAMBDA itself is a function data type — not a value but a callable definition:
```excel
=LAMBDA(x, y, x^2 + y^2)
```
Named ranges holding LAMBDA functions behave as custom function types, callable from any cell in the workbook.

## Keyboard Shortcuts for Data Type Operations

| Action | Windows | Mac |
|---|---|---|
| Open Format Cells dialog | Ctrl+1 | Cmd+1 |
| Apply Number format | Ctrl+Shift+! | Ctrl+Shift+! |
| Apply Currency format | Ctrl+Shift+$ | Ctrl+Shift+$ |
| Apply Percentage format | Ctrl+Shift+% | Ctrl+Shift+% |
| Apply Date format (short) | Ctrl+Shift+# | Ctrl+Shift+# |
| Apply Time format | Ctrl+Shift+@ | Ctrl+Shift+@ |
| Apply Scientific format | Ctrl+Shift+^ | Ctrl+Shift+^ |
| Apply General format | Ctrl+Shift+~ | Ctrl+Shift+~ |
| Insert today's date (static) | Ctrl+; | Ctrl+; |
| Insert current time (static) | Ctrl+Shift+; | Ctrl+Shift+; |

## Version Differences Table

| Feature | Excel 2019 | Excel 2021 | Excel 365 | Excel Web |
|---|---|---|---|---|
| Number, Text, Date, Boolean, Error | Yes | Yes | Yes | Yes |
| Linked Data Types (Stocks, Geography) | No | Yes | Yes | Yes |
| LAMBDA data type | No | No | Yes | Yes |
| Dynamic arrays / SPILL | No | Yes | Yes | Yes |
| Custom linked data types | No | No | Yes | Partial |
| XLOOKUP (type-flexible) | No | Yes | Yes | Yes |
| TYPE function | Yes | Yes | Yes | Yes |

## Interview Questions

### Beginner
**Q: How can you tell if a number is stored as text in Excel?**
A: Three indicators: 1) Left alignment (numbers are right-aligned by default; text is left-aligned). 2) A small green triangle in the top-left corner of the cell. 3) A yellow warning icon that appears when you select such cells. Alternatively use =ISNUMBER(A1) — it returns FALSE for text-stored numbers.

**Q: What is the date serial number system in Excel?**
A: Excel stores dates as serial numbers where January 1, 1900 = 1. Each subsequent day adds 1. This allows date arithmetic: subtracting two dates gives the number of days between them. July 3, 2025 ≈ serial number 45841. Times are stored as decimal fractions of a day (0.5 = noon).

### Intermediate
**Q: Why does SUM return 0 for a column of numbers?**
A: Because the "numbers" are stored as text — they are Unicode strings, not numeric values. Excel cannot perform arithmetic on text. Fixes: use the yellow warning icon "Convert to Number", apply the VALUE function, or use Paste Special -> Multiply by 1.

**Q: What is the difference between IFERROR and IFNA?**
A: IFERROR catches all error types (#VALUE!, #REF!, #N/A, #DIV/0!, etc.) and returns the specified fallback. IFNA catches only #N/A errors. Use IFNA for lookups (VLOOKUP, XLOOKUP) where #N/A means "not found" — because IFERROR would also hide legitimate #VALUE! errors that indicate formula problems you should know about.

### Advanced
**Q: Explain the IEEE 754 floating-point precision issue in Excel and give a practical example.**
A: Excel stores numbers as 64-bit IEEE 754 doubles, which have 15-17 significant digits of precision. Most decimal fractions cannot be represented exactly in binary — 0.1 in binary is an infinitely repeating fraction. So =0.1*3 gives 0.30000000000000004 internally, though Excel displays it as 0.3. The practical impact: when comparing floating-point results, use ROUND: `=ROUND(A1*0.1,10)=0.1` rather than `=A1*0.1=0.1`. This affects financial calculations where accumulated floating-point drift over thousands of rows can produce rounding discrepancies.

## Quiz (10 Questions)

**1. What does =TYPE(TRUE) return in Excel?**
a) 1  b) 2  c) 4  d) 16
Answer: c) 4 (TYPE returns 4 for logical/Boolean values)

**2. In the IEEE 754 double precision format, how many significant decimal digits does Excel support?**
a) 10  b) 12  c) 15  d) 20
Answer: c) 15 (displays up to 15 significant digits)

**3. What is January 1, 1900 as an Excel serial date number?**
a) 0  b) 1  c) 100  d) 365
Answer: b) 1

**4. A cell containing "" (empty text string) returns what for =ISBLANK()?**
a) TRUE  b) FALSE  c) #VALUE!  d) 0
Answer: b) FALSE (ISBLANK only returns TRUE for completely empty cells, not cells with "")

**5. Which Excel error means "value not available" (typically from a failed lookup)?**
a) #VALUE!  b) #REF!  c) #N/A  d) #NAME?
Answer: c) #N/A

**6. =--A1 where A1 contains the text "42" returns:**
a) "42"  b) 42 (number)  c) #VALUE!  d) 0
Answer: b) 42 (number) — the double unary (double negative) forces text-number to numeric

**7. Which function specifically handles only #N/A errors without masking other errors?**
a) IFERROR  b) ISERROR  c) IFNA  d) ISNA
Answer: c) IFNA

**8. In Excel 365, what happens when a formula returns more values than fit in one cell?**
a) An error appears  b) Only the first value shows  c) The values spill into adjacent cells  d) A dialog box appears
Answer: c) The values spill into adjacent cells (dynamic array SPILL behaviour)

**9. What does =TEXT(TODAY(), "YYYY-MM-DD") return?**
a) The date serial number  b) Today's date formatted as "2026-07-15" style text  c) #VALUE!  d) TRUE
Answer: b) Today's date as formatted text string

**10. Times in Excel are stored as:**
a) Text strings like "14:30"  b) Integers from 0 to 1440  c) Decimal fractions of a day  d) Seconds since midnight
Answer: c) Decimal fractions of a day (0.5 = noon, 0.25 = 6am, 0.75 = 6pm)

## Cheat Sheet

```
EXCEL DATA TYPES QUICK REFERENCE
==================================
Number      → Right-aligned, IEEE 754 double (15 sig digits)
Text        → Left-aligned, Unicode string, max 32,767 chars
Date        → Right-aligned, stored as serial number (Jan 1, 1900 = 1)
Time        → Right-aligned, stored as decimal fraction of day
Boolean     → Centred, TRUE=1, FALSE=0
Error       → #NULL! #DIV/0! #VALUE! #REF! #NAME? #NUM! #N/A #SPILL!
Blank       → Empty, different from "" and 0

TYPE DETECTION:
=ISNUMBER()   =ISTEXT()   =ISBLANK()   =ISERROR()
=ISLOGICAL()  =ISNA()     =TYPE()      (1=Num,2=Text,4=Bool,16=Err)

TEXT TO NUMBER:
Warning icon -> Convert to Number
=VALUE(A1)        Paste Special -> Multiply by 1       --A1

NUMBER TO TEXT:
=TEXT(A1,"format")        =A1&""
```

## Memory Tricks
- **Alignment tells the type**: Right = Number/Date, Left = Text, Centre = Boolean
- **Green triangle = trouble**: Text masquerading as a number
- **IEEE 754 = 15 digits**: More than that and Excel rounds
- **1900 = 1**: All dates count days from January 1, 1900
- **IFERROR = fire extinguisher**: Catches any error; IFNA = specific fire extinguisher for #N/A only

## Summary
Data types are the foundation of reliable Excel work. Every frustrating formula error that returns 0, #VALUE!, or #N/A traces back to a type mismatch. Numbers stored as text after import, dates not recognised as dates, blanks confused with zeros — all have clean solutions once you understand what Excel stores internally. The serial date system enables powerful date arithmetic. IEEE 754 floating-point means you need ROUND for precise decimal comparisons. Linked and dynamic data types in Excel 365 extend the model to live web data and arrays.

## Related Topics
- Part 7: Data Entry (entering each type correctly from the start)
- Part 8: Formatting (displaying each type correctly)
- Part 5: AutoFill (type-aware fill behaviour)
- Formulas Chapter: IFERROR, IFNA, VALUE, TEXT, DATEVALUE, TYPE functions

## Frequently Asked Questions

**Q: Why does VLOOKUP return #N/A when I can clearly see the value in the table?**
A: Almost always a type mismatch. Your lookup value is text "123" but the table has the number 123 (or vice versa). Fix: wrap the lookup value in VALUE() to force it to a number, or wrap in TEXT() to force it to text — match the type of the table column.

**Q: Can Excel store numbers larger than 10^308?**
A: No. IEEE 754 doubles have a maximum of approximately 1.8 × 10^308. Larger values return #NUM! error. In practice, Excel shows values up to 9.99999999999999 × 10^307.

**Q: How do I check what data type a cell contains without using formulas?**
A: Look at the alignment (right = number/date, left = text, centre = boolean), look for green triangles (text-stored numbers), look at the format shown in the Number group on the Home tab, or click the cell and observe what the Format Cells dialog shows.

## Additional Knowledge

### The Lotus 1-2-3 Bug (Historical Note)
Excel intentionally includes a bug: it treats 1900 as a leap year, including February 29, 1900 (which never existed). This was done for Lotus 1-2-3 compatibility when Excel launched in 1985. The result is that dates before March 1, 1900 are off by one day in Excel's serial number system. Modern workbooks rarely deal with pre-1900 dates, but analysts working with historical financial data should be aware.

### Locale-Sensitive Data Types
Excel's date and number recognition is locale-sensitive. On a system with Indian locale (en-IN), Excel may recognise "01/07/2026" as July 1 or January 7 depending on the locale's date format (DD/MM vs MM/DD). This causes data import disasters when files are shared between US and UK/Indian teams. Always use ISO 8601 format (YYYY-MM-DD) for international data exchange to avoid ambiguity.
