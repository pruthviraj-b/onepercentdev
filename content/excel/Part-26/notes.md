# Part 26 — Formatting & Aesthetics: Number Formats Deep Dive

## What is it?
Number formatting controls how a value *looks* in a cell without changing the actual stored value.
Think of it like a costume — the number underneath stays the same, but it dresses differently depending on the occasion.

**Example**: The number `0.45` can display as:
- `45%` (percentage format)
- `$0.45` (currency)
- `45.00%` (percentage with decimals)
- `Zero point four five` — no, Excel does not do that, but custom formats get close

## Why do we need it?
Raw numbers are meaningless without context.
`1500000` means nothing until it reads `₹15,00,000` or `$1,500,000`.
Number formats make data instantly readable and professional.

## How Does It Work?
Excel applies a *display mask* over the stored value.
The actual value in memory never changes — only the visual representation changes.

Open Format Cells: **Ctrl+1** → Number tab

Categories:
| Category | Use Case |
|---|---|
| General | Default — no specific format |
| Number | Decimal places, thousands separator |
| Currency | $ or ₹ symbol with decimals |
| Accounting | Currency aligned, negatives in parentheses |
| Date | Various date display patterns |
| Time | HH:MM:SS patterns |
| Percentage | Multiplies by 100, adds % |
| Fraction | Displays as 1/2, 3/4 |
| Scientific | 1.5E+06 notation |
| Text | Forces cell to be treated as text |
| Custom | Build your own format code |

## Custom Format Codes — Complete Reference
```
# = optional digit (shows nothing if zero)
0 = mandatory digit (shows 0 if nothing there)
, = thousands separator
. = decimal point
% = multiply by 100 and add % sign
" " = literal text inside quotes
@ = text placeholder
[Red] = colour code
```

### Real Examples
```
#,##0          → 1,500,000  (thousands with no decimals)
#,##0.00       → 1,500,000.00
0.00%          → 45.00%
"₹"#,##0.00   → ₹1,500.00
[Green]#,##0;[Red]-#,##0   → positives green, negatives red
0.0"x"         → 3.5x  (multiplier display)
[>1000]"HIGH";[<0]"LOW";"OK"  → conditional text display
```

## Visual Explanation
```
Stored Value: 1500000

Format Applied      Displays As
─────────────────────────────────
General           → 1500000
#,##0             → 1,500,000
$#,##0.00         → $1,500,000.00
"₹"#,##0          → ₹1,500,000
0.00E+00          → 1.50E+06
0%                → 150000000%  ← WRONG use case
```

## Real World Example
**HDFC Bank analysts** format loan amounts with Accounting format so all the currency symbols align perfectly in a column and negative values appear in parentheses — standard accounting presentation.

**Swiggy's finance team** uses custom formats like `#,##0,,"M"` to display millions: `1,500,000` shows as `1.5M` — making dashboards cleaner for executive reviews.

## Step-by-Step Practice
1. Enter `1500000` in cell A1
2. Press **Ctrl+1** → Number → Custom
3. Type: `"₹"#,##0.00`
4. Click OK — see the value display as `₹1,500,000.00`
5. Click the cell again — the Formula Bar still shows `1500000`
6. Now try: `[Green]#,##0;[Red]-#,##0;[Blue]0`
   - Positive = green, Negative = red, Zero = blue

## Common Mistakes
| Mistake | Problem | Fix |
|---|---|---|
| Formatting numbers as Text | SUM returns 0 | Change format to Number, then re-enter |
| Using % format on 0.45 expecting 0.45% | Gets 45% | % format multiplies by 100 — store 0.0045 for 0.45% |
| Accounting vs Currency confusion | Symbols do not align | Use Accounting for financial statements |
| Deleting the format | Values go back to General | Press Ctrl+Z or reapply from Format Cells |

## Best Practices (2026)
- Use **Accounting** format (not Currency) for financial statements — symbols align neatly
- Use `#,##0` (not `0`) for large numbers — avoids unnecessary leading zeros
- Use custom `[Color]` formats sparingly — not all printers honour them
- Keep one consistent format per column — mixed formats confuse readers

## Key Takeaways
- Number format is a visual mask — the stored value never changes
- Ctrl+1 opens Format Cells for any formatting need
- Custom format codes give you complete control
- The `%` format multiplies by 100 — store the decimal (0.45 not 45)
- Accounting format aligns currency symbols better than Currency format

## Practice Exercise
1. Create a table with columns: Product, Price, Discount, Final Price
2. Format Price as `₹#,##0.00`
3. Format Discount as `0.0%` (store as 0.15 for 15%)
4. Format Final Price with conditional colour: green if >1000, red if <500
5. Create a custom format that shows "FREE" when the value is 0

## Related Topics
- Part 27 — Conditional Formatting (colour based on rules)
- Part 28 — Cell Styles (pre-built format sets)
- Part 8 — Data Entry & Formatting (foundation)

---

## 📘 Course Roadmap
| Section | Chapters | Topics |
|---|---|---|
| Foundation | 1–10 | Basics, formulas, PivotTables, charts |
| Core Analytics | 11–20 | Statistics, lookups, financial functions |
| Advanced Analytics | 21–30 | Power Query, Power Pivot, DAX, dashboards |
| Business Applications | 31–40 | HR, Finance, Sales, E-commerce, Retail |
| Professional Skills | 41–50 | VBA, SQL/Python integration, portfolio |
