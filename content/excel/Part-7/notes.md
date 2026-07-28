# Part 7 — How to Enter and Edit Data in Excel

## Overview
Efficient data entry is the bedrock of every Excel project. This part covers all the ways to enter, edit, and navigate data without lifting your hands from the keyboard — the foundation of working fast.

## What You Will Learn
- Entering text, numbers, and dates
- Editing cell contents with F2
- AutoComplete — how Excel predicts what you are typing
- AutoFill — dragging the fill handle for sequences
- Flash Fill (Ctrl+E) for pattern-based data splitting and combining
- Entering data in multiple cells at once
- Undo and Redo

## Core Data Entry Shortcuts
| Shortcut | Action |
|---|---|
| Enter | Confirm and move down |
| Tab | Confirm and move right |
| Ctrl+Enter | Confirm and stay in the same cell |
| F2 | Edit the active cell (cursor at end) |
| Delete | Clear cell contents |
| Backspace | Delete one character while editing |
| Ctrl+D | Fill Down (copy the cell above) |
| Ctrl+R | Fill Right (copy the cell to the left) |
| Ctrl+; | Insert today's date |
| Ctrl+Shift+; | Insert the current time |
| Ctrl+E | Flash Fill |

## AutoComplete
When typing text, Excel suggests a completion based on existing values in the same column.
- Press Enter to accept the suggestion
- Press Delete or keep typing to ignore it

## AutoFill
1. Enter a value or a starting sequence (e.g. 1, 2 or Monday)
2. Select the cell(s)
3. Grab the **fill handle** (small square, bottom-right of selection)
4. Drag down or across — Excel continues the sequence

Works for: numbers, dates, months, days, and Custom Lists.

## Flash Fill — Intelligent Pattern Detection
Flash Fill learns from your typing pattern and fills the rest automatically.

Examples:
- **Split names**: Column A has "John Smith" -> Column B: type "John" -> Ctrl+E -> fills all first names
- **Format phones**: "9876543210" -> type "98765 43210" -> Ctrl+E -> reformats all
- **Combine fields**: Column A "John", Column B "Smith" -> type "John Smith" -> Ctrl+E

## Bulk Fill — Same Value in Multiple Cells
1. Select a range (e.g. A1:D10)
2. Type your value
3. Press **Ctrl+Enter**
4. Every selected cell fills with that value

## Resources
- Watch: https://www.youtube.com/watch?v=V66UBY8SZ-8
- Playlist: https://www.youtube.com/playlist?list=PL6Omre3duO-N7yY1Uxl7hOC3gRMMomamK


---

# Part 7 — Data Entry and Editing (Premium Lesson)

## Learning Objectives
By the end of this lesson you will be able to:
- Use every data entry method in Excel with maximum efficiency
- Control the direction the cursor moves after pressing Enter
- Enter data in multiple cells simultaneously with Ctrl+Enter
- Use AutoComplete for repetitive text data entry
- Apply Flash Fill (Ctrl+E) for intelligent pattern transformation
- Use every Fill option (Down, Right, Series, Across Worksheets)
- Enter dates, times, and special characters with shortcuts
- Use Paste Special all 20 options with real-world scenarios
- Use Find and Replace with advanced options (case, whole word, format, wildcards)
- Use Go To Special for targeted mass editing
- Configure Undo levels and understand Undo/Redo behaviour
- Use Data Validation for dropdown-based controlled entry
- Work with drop-down lists for restricted data entry

## What is Data Entry in the Professional Context?
Data entry is not just "typing into cells." Professional data entry is fast, accurate, consistent, and structured. A professional never uses the mouse when the keyboard serves — every click wasted is time wasted. A professional prevents entry errors at the source using validation. A professional uses patterns and tools to populate 1,000 rows as fast as 10 rows. This lesson covers the full range of techniques from basic cell editing to mass multi-cell workflows.

## Real World Problem — Operations Team
An operations analyst receives a weekly CSV dump of 500 purchase orders from 8 different suppliers. The file has inconsistent supplier name formats: "Tata Steel Ltd", "TATA STEEL", "tata steel limited", "Tata Steel". Four variants of the same supplier. Charts and PivotTables see these as 4 different suppliers. Using Flash Fill and Find & Replace, the analyst standardises all variants in 2 minutes. Using Paste Special -> Values, they remove all links to the raw data source. The cleaned file feeds the dashboard correctly.

## Simple Analogy
Think of a spreadsheet as filling out multiple copies of a paper form. Ctrl+Enter is like using a carbon copy — type once, all copies fill simultaneously. AutoComplete is like a secretary who finishes sentences you've started before. Flash Fill is like a smart photocopier that changes the format while copying. Find & Replace is like a global search-and-correct spell checker for data. Go To Special is like a highlighter that selects only blank boxes on all your forms at once so you can fill them all in simultaneously.

## Internal Working — Cell Editing States
Excel cells have three states:
- **Ready**: Normal navigation state. Arrow keys move between cells.
- **Enter**: When you start typing in a cell. The Name Box shows the cell address. The formula bar shows what you're typing. Arrow keys confirm the entry and move to the next cell.
- **Edit**: When you press F2 or click inside the formula bar. The cell enters edit mode. Arrow keys move the cursor within the cell content. Pressing Escape exits without saving changes.

The mode is always shown in the Status Bar (bottom-left): "Ready", "Enter", or "Edit".

## Complete Keyboard Shortcuts for Data Entry

| Shortcut | Action | When to Use |
|---|---|---|
| Enter | Confirm and move down | Standard data entry column by column |
| Shift+Enter | Confirm and move up | Moving backwards through a column |
| Tab | Confirm and move right | Entering data row by row across columns |
| Shift+Tab | Confirm and move left | Moving backwards through a row |
| Ctrl+Enter | Confirm and stay in same cell | When you need to stay put after entering |
| Esc | Cancel current entry | Undo a mistake before confirming |
| F2 | Enter/Exit edit mode | Edit existing cell content with cursor control |
| Backspace | Delete one character (edit mode) | Fix typos while editing |
| Delete | Clear cell contents (ready mode) | Remove cell content without entering edit mode |
| Ctrl+Delete | Delete from cursor to end of line | In edit mode, clears rest of cell content |
| Alt+Enter | Insert line break inside cell | Multi-line content within one cell |
| Ctrl+; | Insert today's date (static) | Timestamp that never changes |
| Ctrl+Shift+; | Insert current time (static) | Time stamp |
| Ctrl+' (apostrophe) | Copy formula from cell above | Useful for duplicating complex formulas |
| Ctrl+D | Fill Down | Copy topmost cell into selected range below |
| Ctrl+R | Fill Right | Copy leftmost cell into selected range right |
| Ctrl+E | Flash Fill | Pattern-based intelligent fill |
| Ctrl+H | Find and Replace | Mass text substitution |
| Ctrl+G or F5 | Go To | Navigate or Go To Special |
| Ctrl+Z | Undo | Reverse last action (up to 100 levels) |
| Ctrl+Y or F4 | Redo / Repeat last action | Redo undone action, or repeat last command |

## Entry Direction Configuration
By default, pressing Enter moves the cursor down. You can change this:
File -> Options -> Advanced -> "After pressing Enter, move selection" -> Direction dropdown: Down, Up, Right, Left

For tabular data entry (filling across a row): set direction to Right. Now Tab and Enter both confirm — but Enter moves you right while Tab also moves right. Useful for form-style data entry.

Alternative: select the entire input range first (e.g., A1:D50), then type — Enter moves within the selection, wrapping from column to column and down to the next row automatically. This confines cursor movement to your selected range.

## Multi-Cell Entry — Ctrl+Enter
One of the most underused power features:
1. Select any range (contiguous or non-contiguous with Ctrl+click)
2. Type your value or formula
3. Press **Ctrl+Enter** (not just Enter)
4. Every cell in the selection fills with the same value/formula

Use cases:
- Fill all blank cells in a column with "N/A" at once
- Apply the same formula to 500 rows simultaneously
- Set default values in selected cells before users begin editing
- After Go To Special -> Blanks, fill all blanks with =A2 to propagate values down

## AutoComplete
When entering text that matches an existing value in the same column, Excel shows a grey completion suggestion. Accept with Enter or Tab. Reject by continuing to type different characters. AutoComplete is case-insensitive matching.

To disable AutoComplete: File -> Options -> Advanced -> uncheck "Enable AutoComplete for cell values". Useful in data-entry worksheets where you need raw text without suggestions interfering.

## Paste Special — All 20 Options
Access: Ctrl+Alt+V after copying (Windows), or Ctrl+V -> click Paste Options icon -> Paste Special

### Paste Section (what to paste)
| Option | What it does |
|---|---|
| All | Pastes everything: values, formats, formulas, comments, validation |
| Formulas | Pastes formulas but not formatting |
| Values | Pastes calculated results only — removes formulas. Most used! |
| Formats | Pastes only the formatting (number format, colours, borders) |
| Comments and Notes | Pastes only comments/notes |
| Validation | Pastes data validation rules |
| All using Source theme | Pastes all content with source file's theme |
| All except borders | Pastes all but no border formatting |
| Column widths | Sets destination column widths to match source |
| Formulas and number formats | Formulas + number formatting only |
| Values and number formats | Values + number formatting — great for finished reports |
| All merging conditional formats | Pastes conditional formatting, merging with existing rules |

### Operation Section (combine pasted values with existing values)
| Option | What it does |
|---|---|
| None | Normal paste (default) |
| Add | Adds pasted values to existing cell values |
| Subtract | Subtracts pasted values from existing |
| Multiply | Multiplies existing values by pasted values |
| Divide | Divides existing values by pasted values |

Use case: Copy a column with "1.1" -> Paste Special Multiply onto your price column -> all prices increase by 10% without any formula.

### Other Options
| Option | What it does |
|---|---|
| Skip blanks | Doesn't overwrite existing values where pasted data is blank |
| Transpose | Rotates the pasted range (rows become columns, columns become rows) |
| Paste Link | Pastes a live formula reference back to the source cell |

## Find and Replace — Advanced Options

### Basic Find (Ctrl+F)
- Type search text -> Enter or Find Next/Find All
- Find All lists all matching cells in a panel — click any to navigate

### Advanced Find Options (click Options button in the dialog)
| Setting | Purpose |
|---|---|
| Within: Sheet / Workbook | Search current sheet or all sheets |
| Search: By Rows / By Columns | Order in which cells are searched |
| Look in: Formulas / Values / Notes | Search formula text, displayed values, or cell notes |
| Match case | "Excel" vs "excel" treated differently |
| Match entire cell contents | "Total" matches "Total" but not "Total Revenue" |
| Find format | Search by cell format (colour, border, number format) |

### Replace (Ctrl+H)
All Find options plus:
- Replace With: what to replace matched text with
- Replace All: replaces all matches at once
- Replace (one at a time): preview each replacement before confirming

### Wildcard Characters in Find & Replace
- `*` = any string of characters. "J*n" matches "John", "Johnson", "Jan"
- `?` = exactly one character. "J?n" matches "Jan" but not "John"
- `~*` = literal asterisk (escape with ~)
- `~?` = literal question mark

### Find Format Use Case
Search for cells with a specific background colour (e.g., all yellow highlighted cells) — click Find Format -> Fill -> select the colour. Excel finds all cells with that background, regardless of content. Useful for finding manually highlighted data entry errors.

## Go To Special (F5 -> Special)
One of Excel's most powerful editing tools. Select cells meeting specific criteria:

| Option | Selects |
|---|---|
| Comments | All cells with notes/comments |
| Constants | All cells with non-formula values (further: numbers, text, logical, errors) |
| Formulas | All cells with formulas (further: numbers, text, logical, errors results) |
| Blanks | All empty cells in the selection or used range |
| Current Region | All cells in the continuous data block around the active cell (like Ctrl+Shift+*) |
| Current Array | The entire array formula range containing the active cell |
| Objects | All embedded objects (charts, shapes, images) |
| Row Differences | Cells in each row where content differs from the first cell in that row |
| Column Differences | Cells in each column where content differs from the first cell in column |
| Precedents (Direct/All) | Cells that the active cell's formula references |
| Dependents (Direct/All) | Cells that reference the active cell |
| Last Cell | The last used cell in the sheet |
| Visible Cells Only | Only the visible cells (skipping hidden rows/columns — crucial for copying filtered data) |
| Conditional Formats | Cells with conditional formatting (same/all conditions) |
| Data Validation | Cells with data validation rules |

Most important use case: **Go To Special -> Blanks** -> type "N/A" -> Ctrl+Enter: fills every blank cell in the selection simultaneously.

Second most important: **Go To Special -> Visible Cells Only** (Alt+; shortcut): ensures you only copy visible rows from a filtered list, not the hidden rows underneath.
