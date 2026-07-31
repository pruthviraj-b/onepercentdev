"""Build deep, topic-aware Python for Data Analysis chapters.

This intentionally leaves hand-authored chapters alone. It is safe to rerun
while the curriculum is being upgraded in batches.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "courses.config.json"
CONTENT = ROOT / "content" / "python"


def clean_title(value: str) -> str:
    replacements = {
        "â€”": "—", "â€“": "–", "â†’": "→", "â†": "←",
        "â†‘": "↑", "â†“": "↓", "âœ“": "✓", "âœ—": "✗",
    }
    for broken, fixed in replacements.items():
        value = value.replace(broken, fixed)
    return re.sub(r"\s+", " ", value).strip()


def area(part: int) -> str:
    ranges = [(126, "core Python"), (154, "NumPy"), (212, "pandas"),
              (228, "data visualisation"), (247, "statistics"),
              (257, "data integration"), (274, "automation and code quality"),
              (286, "end-to-end analytics"), (300, "professional practice")]
    for end, name in ranges:
        if part <= end:
            return name
    return "capstone analytics"


def example_for(title: str, part: int) -> tuple[str, str, str]:
    t = title.lower()
    if part <= 126:
        if "string" in t:
            return ('customer = "  Asha Rao  "\nclean_name = customer.strip().title()\nprint(clean_name)', 'Asha Rao', 'Text is immutable, so the method returns a new string.')
        if "dictionary" in t or "dict" in t:
            return ('order = {"id": "A-104", "amount": 1250, "status": "paid"}\nprint(order.get("amount", 0))', '1250', 'get() provides a deliberate default instead of raising KeyError.')
        if "list" in t:
            return ('amounts = [120, 80, 200]\namounts.append(150)\nprint(sum(amounts))', '550', 'The list is mutable and append() changes it in place.')
        if "set" in t:
            return ('seen_regions = {"South", "North", "South"}\nprint(sorted(seen_regions))', "['North', 'South']", 'A set stores unique values; sorting makes output deterministic.')
        if "tuple" in t:
            return ('record = ("A-104", 1250, "paid")\norder_id, amount, status = record\nprint(order_id, amount)', 'A-104 1250', 'Tuple unpacking binds each position to a name.')
        if "loop" in t or "enumerate" in t or "range" in t or "comprehension" in t:
            return ('amounts = [120, 80, 200]\npaid = [amount for amount in amounts if amount >= 100]\nprint(paid)', '[120, 200]', 'The expression keeps values meeting the business rule.')
        if "function" in t or "parameter" in t or "return" in t or "lambda" in t:
            return ('def average(values: list[float]) -> float:\n    if not values:\n        raise ValueError("values cannot be empty")\n    return sum(values) / len(values)\n\nprint(average([10, 20, 30]))', '20.0', 'The function validates its input and returns a value instead of printing internally.')
        if "exception" in t or "try" in t or "except" in t or "raise" in t:
            return ('raw_amount = "1250"\ntry:\n    amount = int(raw_amount)\nexcept ValueError as error:\n    raise ValueError("amount must be a whole number") from error\nprint(amount)', '1250', 'The expected conversion succeeds; invalid input receives a domain-specific message.')
        if "file" in t or "csv" in t or "json" in t or "pathlib" in t:
            return ('from pathlib import Path\n\npath = Path("data") / "orders.csv"\nprint(path.name, path.suffix)', 'orders.csv .csv', 'Path objects make path composition explicit and portable.')
        if "class" in t or "object" in t or "method" in t:
            return ('class Metric:\n    def __init__(self, name: str, value: float):\n        self.name = name\n        self.value = value\n\nmetric = Metric("conversion_rate", 0.24)\nprint(metric.name)', 'conversion_rate', 'The instance stores state and the method or constructor defines its contract.')
        return ('orders = [120, 80, 200]\ntotal = sum(orders)\nprint(total)', '400', 'The named result makes the data flow visible.')
    if 127 <= part <= 154:
        return ('import numpy as np\n\nscores = np.array([72, 81, 66, 94])\nprint(scores.mean())', '78.25', 'NumPy performs the operation over the array and returns a scalar.')
    if 155 <= part <= 212:
        return ('import pandas as pd\n\norders = pd.DataFrame({"region": ["N", "S", "N"], "amount": [120, 80, 200]})\nsummary = orders.groupby("region", as_index=False)["amount"].sum()\nprint(summary.to_string(index=False))', 'region  amount\n     N     320\n     S      80', 'The transformation preserves a clear grain: one row per region.')
    if 213 <= part <= 228:
        return ('import matplotlib.pyplot as plt\n\nmonths = ["Jan", "Feb", "Mar"]\nrevenue = [12, 15, 14]\nfig, ax = plt.subplots()\nax.plot(months, revenue, marker="o")\nax.set_ylabel("Revenue (thousands)")\nfig.tight_layout()', 'A figure object is created with a line chart.', 'The figure is separated from the axes so the chart can be tested and saved.')
    if 229 <= part <= 247:
        return ('import statistics\n\nvalues = [10, 12, 12, 15, 21]\nprint(statistics.mean(values), statistics.median(values))', '14 12', 'Mean uses every value; median is the middle ordered value and is less affected by extremes.')
    if 248 <= part <= 257:
        return ('import sqlite3\n\nwith sqlite3.connect(":memory:") as connection:\n    connection.execute("CREATE TABLE orders (amount INTEGER)")\n    connection.executemany("INSERT INTO orders VALUES (?)", [(120,), (80,)])\n    total = connection.execute("SELECT SUM(amount) FROM orders").fetchone()[0]\n    print(total)', '200', 'The parameterised insert keeps data separate from SQL text.')
    if 258 <= part <= 274:
        return ('from pathlib import Path\n\nfiles = sorted(Path("data").glob("*.csv"))\nfor file in files:\n    print(file.name)', 'Names of CSV files in deterministic order.', 'Deterministic ordering and logging make batch work reproducible.')
    return ('import pandas as pd\n\nframe = pd.DataFrame({"amount": [120, 80, 200]})\nprint(frame["amount"].sum())', '400', 'A small, explicit example makes the analytical decision testable.')


def make_chapter(part: int, title: str) -> str:
    code, output, explanation = example_for(title, part)
    domain = area(part)
    t = title.lower()
    focus = (
        f"**{title}** is a focused lesson in {domain}. We will learn the operation, build a mental model, "
        "trace a small example, examine failure modes, and connect the technique to a real analytical decision."
    )
    if "dataframe" in t or "series" in t or "pandas" in t:
        input_shape = "Confirm the row grain, column labels, index meaning, and pandas dtypes before transforming data."
    elif "array" in t or "numpy" in t or "broadcast" in t:
        input_shape = "Confirm the array shape, dtype, axis, and whether the operation returns a view or a new array."
    elif "plot" in t or "chart" in t or "heatmap" in t:
        input_shape = "Confirm what one mark represents, which variable is encoded by each visual channel, and whether the scale is honest."
    elif part >= 229 and part <= 247:
        input_shape = "Confirm whether the data is a sample or population, the measurement scale, missing-value policy, and assumptions behind the statistic."
    else:
        input_shape = "Confirm the input type, expected output, boundary cases, and whether the operation mutates an existing object."

    return f'''# Part {part} — {title}

## Topic Overview

{focus}

This chapter follows a repeatable analyst workflow:

```text
question → input contract → operation → result → validation → communication
```

The syntax is the smallest part of the skill. Professional work depends on knowing what a result means, when it can be trusted, and what evidence would prove it wrong.

## Learning Objectives

By the end of this lesson, you should be able to:

- Define **{title}** in precise technical language.
- Write its core syntax and explain each important argument or component.
- Trace a small example without executing it first.
- Validate the result using shape, type, count, range, or independent logic.
- Explain one production use, one failure mode, and one alternative approach.

## Prerequisites

You should be comfortable with the preceding lessons in the course, basic Python expressions, and reading small code examples. For analytical lessons, also be comfortable identifying the grain of a dataset: what one row represents and what one value measures.

## Why This Topic Matters

Analysts rarely fail because they cannot remember a method name. They fail when a technically valid operation answers the wrong question, silently drops records, changes the data grain, or hides an assumption. **{title}** matters because it gives you a controlled way to solve a recurring problem in {domain}.

## Definitions

**{title}**: a Python/data-analysis technique used to express a specific transformation, inspection, calculation, or communication step. Its correctness depends on both its syntax and the meaning of its input.

### Related vocabulary

| Term | Meaning in this lesson |
|---|---|
| Input contract | The types, shape, columns, and assumptions the operation expects. |
| Output contract | The type, shape, grain, and meaning of the returned result. |
| Side effect | A change outside the returned value, such as mutating a list or writing a file. |
| Validation | Evidence that the result is plausible and answers the intended question. |
| Grain | What one row or observation represents. |

## Core Concepts

1. **Meaning before mechanics** — state the business or programming question first.
2. **Shape and type** — the same-looking operation can behave differently on a scalar, sequence, array, or table.
3. **Explicit assumptions** — missing values, duplicates, ordering, time zones, and units must be deliberate.
4. **Stable outputs** — a useful result is easy to inspect, test, and pass to the next step.
5. **Validation is part of the operation** — a result is not complete until its important invariants have been checked.

## Concepts

The core concepts above are the ideas to remember; the practical question is always how they affect the meaning, shape, and reliability of the result.

## Mental Model

Think of the operation as a small machine:

```text
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│ input data   │ →  │ {title}        │ →  │ result       │
│ type/shape   │    │ rules + options │    │ meaning/shape│
└──────────────┘    └────────────────┘    └──────────────┘
        ↑                    │                    ↓
        └──────── validation ┴────────────── explanation
```

Before using the machine, answer: “What enters it?”, “What should come out?”, and “How will I know if it is wrong?”

## Syntax

```python
{code}
```

## Syntax Breakdown

- The import or object construction establishes the tool used by the operation.
- The input values represent a small, visible dataset rather than hidden state.
- The operation is assigned or displayed intentionally; this makes the data flow traceable.
- Formatting is applied only at the presentation boundary, not while raw data is being validated.

## Internal Working

At runtime, Python evaluates expressions from the inside out, resolves names, calls the operation, and binds the returned object to a name when assignment is used. Libraries such as NumPy and pandas may execute highly optimised native loops underneath Python-level code. That improves performance, but it does not remove the need to understand dtype, shape, index alignment, missing values, or ordering.

For this topic, the reliable implementation-level questions are:

1. Does it return a new object or mutate an existing object?
2. Does it preserve the input's order and grain?
3. Does it align by position, label, key, or index?
4. What happens to missing, duplicate, empty, or invalid values?
5. Is the result deterministic when ties or unordered collections exist?

## Execution Flow

```text
1. Construct or receive input
2. Check type, shape, and required fields
3. Apply {title}
4. Inspect a representative result
5. Check invariants and edge cases
6. Store or communicate the validated result
```

## Examples

### Worked Example

```python
{code}
```

**Expected output:**

```text
{output}
```

**Why this output is correct:** {explanation}

### Line-by-line reasoning

1. The input is intentionally small enough to inspect manually.
2. The operation applies one clearly stated rule.
3. The result is shown in a stable form so a reviewer can compare it with the expected output.
4. The output should be interpreted in the context of the input grain and units, not treated as an isolated number.

## Intermediate Example: Add a Validation Boundary

```python
def validate_non_empty(values: list[float]) -> list[float]:
    if not values:
        raise ValueError("expected at least one value")
    if any(value is None for value in values):
        raise ValueError("missing values must be handled before analysis")
    return [float(value) for value in values]

values = validate_non_empty([120, 80, 200])
print(values)
```

The validation function separates “is this input acceptable?” from “what does the analysis do?” That separation makes the core operation easier to test and reuse.

## Advanced Example: A Reusable Analysis Function

```python
from collections.abc import Iterable

def analyse(values: Iterable[float | int | None]) -> dict[str, float]:
    clean = [float(value) for value in values if value is not None]
    if not clean:
        return {{"count": 0.0, "total": 0.0, "average": 0.0}}
    total = sum(clean)
    return {{
        "count": float(len(clean)),
        "total": total,
        "average": total / len(clean),
    }}

print(analyse([120, None, 80, 200]))
```

This version makes the missing-value policy explicit and returns a stable dictionary contract. In a production pipeline, the policy might instead be “reject missing values” or “impute them”; the important point is that the decision is documented rather than accidental.

## Edge Cases

| Edge case | Risk | Professional response |
|---|---|---|
| Empty input | Exceptions, misleading zero, or an empty chart | Decide whether to return an empty result or raise a clear error. |
| Missing values | Totals, counts, and rates may change silently | Choose drop, fill, or reject and report the choice. |
| Duplicate keys | Joins or lookups may multiply rows | Check key uniqueness before combining data. |
| Wrong dtype | Text may look numeric but fail or sort incorrectly | Inspect and convert with an explicit error policy. |
| Unordered input | Output may vary between runs | Sort when order matters and document the rule. |
| Large input | Correct code may be too slow or memory-heavy | Measure, stream, chunk, or use vectorised operations. |

## Real-world Applications

- **Data ingestion:** inspect and validate incoming records before analysis.
- **Business reporting:** calculate metrics while preserving their grain and definition.
- **Quality monitoring:** detect missing, duplicate, or out-of-range values.
- **Experiment analysis:** make transformations reproducible so conclusions can be reviewed.
- **Automation:** turn a one-off notebook action into a tested pipeline step.

## Best Practices

- Start with a small representative example and an expected result.
- Use descriptive names that encode business meaning and units.
- Keep raw data separate from cleaned and derived data.
- Prefer explicit arguments when defaults could hide a decision.
- Validate row counts, key uniqueness, ranges, and important totals.
- Make randomness, timezone, ordering, and missing-value policies reproducible.
- Use functions to create testable boundaries around repeated logic.
- Format values only when presenting them; keep analytical values numeric.

## Common Mistakes

- Applying **{title}** before confirming the input's type or grain.
- Assuming a method mutates data when it actually returns a new object, or vice versa.
- Accepting a plausible output without checking it against an independent calculation.
- Ignoring warnings because the final cell still produced a result.
- Treating `NaN`, `None`, an empty string, and zero as interchangeable.
- Using a large, opaque expression that cannot be tested one decision at a time.

## Debugging Playbook

When the result looks wrong, inspect in this order:

1. Print or sample the input immediately before the operation.
2. Inspect `type()`, shape, columns, index, and dtypes as appropriate.
3. Run the smallest failing example.
4. Check one record manually from input to output.
5. Compare row counts and key totals before and after.
6. Read the complete exception or warning; it often identifies the violated contract.
7. Add a regression test so the same mistake cannot return silently.

## Performance and Safety Notes

For small datasets, clarity is usually more valuable than a micro-optimisation. For large datasets, measure before changing the implementation. Avoid loading an entire untrusted file into memory without a size policy, never build SQL by concatenating user input, and do not expose credentials in notebooks or logs.

## Comparison Table

| Approach | Strength | Trade-off | Good fit |
|---|---|---|---|
| Explicit loop or steps | Easy to debug line by line | More verbose | Learning, complex branching |
| Comprehension/vectorised operation | Concise and often fast | Can hide logic when overused | Simple, uniform transformations |
| Reusable function | Testable and composable | Requires a clear contract | Production pipelines |
| Library operation | Optimised and expressive | Requires knowledge of alignment and defaults | Large analytical datasets |

## Coding Exercises

1. Recreate the worked example with five records and write down the expected output before running it.
2. Add an empty-input test and an invalid-type test.
3. Add a validation that checks the expected column or field exists.
4. Write one independent calculation that confirms the main result.
5. Explain the data grain before and after the operation.
6. Refactor the solution into a function with a type hint and docstring.
7. Add a case where a missing value appears and document your policy.

## Practice Questions

1. What problem does **{title}** solve?
2. What are its input and output contracts?
3. Does it preserve order, labels, and row grain?
4. Does it mutate input data or return a new result?
5. What happens with empty, missing, duplicate, and invalid values?
6. How would you test it on a real dataset?
7. When would a simpler or more scalable alternative be preferable?

## Interview Questions

1. Explain **{title}** to a junior analyst using a small example.
2. Describe a bug caused by an incorrect assumption about this operation.
3. How would you validate the output before publishing a dashboard?
4. What performance issue could appear at production scale?
5. How do you make the result reproducible and reviewable?

## HR Questions

Describe a time you had to learn or apply a new analytical technique. Explain the business question, how you checked that your implementation was correct, what you communicated to stakeholders, and what you would improve in a second version.

## Professional Tips

- The best explanation begins with the question the code answers.
- Show one tiny example before showing a production-sized pipeline.
- State what the code does not guarantee; this is often more valuable than listing features.
- Name units, grain, and missing-value policy in the result or documentation.
- If a transformation changes the number of rows, make that change visible in the chapter and in the code review.

## Cheat Sheet

| Check | Question |
|---|---|
| Meaning | What question am I answering? |
| Input | What type, shape, grain, and units enter? |
| Operation | Which rule or option changes the data? |
| Output | What type, shape, grain, and units leave? |
| Validation | What independent evidence supports the result? |
| Scale | Will this fit in memory and finish on schedule? |
| Communication | Can another analyst reproduce and explain it? |

## Summary

**{title}** is valuable when it is used deliberately: define the question, establish the input contract, apply the operation, inspect the output, validate the important invariants, and communicate the result with its assumptions. Syntax starts the work; reasoning and verification finish it.

## Revision Checklist

- [ ] I can define **{title}** without copying a sentence.
- [ ] I can write the core syntax from memory.
- [ ] I can explain the input and output contract.
- [ ] I can trace the worked example line by line.
- [ ] I know whether input data is mutated or copied.
- [ ] I can name three edge cases.
- [ ] I can write one validation and one test.
- [ ] I can describe a real business use and its limitation.

## References

- Python documentation: https://docs.python.org/3/
- NumPy documentation: https://numpy.org/doc/stable/
- pandas documentation: https://pandas.pydata.org/docs/
- Matplotlib documentation: https://matplotlib.org/stable/
- Python Enhancement Proposals: https://peps.python.org/
'''


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8-sig"))
    written = 0
    skipped = 0
    for module in config["python"]["modules"]:
        for part in module["parts"]:
            path = CONTENT / f"Part-{part}" / "notes.md"
            if not path.exists():
                continue
            existing = path.read_text(encoding="utf-8", errors="replace")
            if "## Connecting to the Course" in existing:
                skipped += 1
                continue
            match = re.search(r"^# Part \d+\s*(?:-|—|â€”|–)\s*(.+)$", existing, re.MULTILINE)
            title = clean_title(match.group(1)) if match else f"Lesson {part}"
            path.write_text(make_chapter(part, title), encoding="utf-8")
            written += 1
    print(f"Rebuilt {written} premium chapters; preserved {skipped} hand-authored chapters.")


if __name__ == "__main__":
    main()
