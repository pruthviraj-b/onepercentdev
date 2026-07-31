"""Populate the Python for Data Analysis lesson notes from courses.config.json.

The source curriculum is deliberately kept in courses.config.json. This script
turns each configured lesson into a useful, consistently structured Markdown
chapter without changing the LMS schema or frontend.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "courses.config.json"
CONTENT = ROOT / "content" / "python"


SPECIAL = {
    "Variables": {
        "definition": "A variable is a name bound to an object. In Python, assignment creates or updates that binding; it does not declare a fixed-type storage box.",
        "concepts": ["Names refer to objects", "Python is dynamically typed", "Assignment can rebind a name", "Use clear names that describe business meaning"],
        "syntax": "revenue = 125000\nmargin = 0.18\nreport_title = \"Q1 sales\"",
        "example": "sales = [1200, 950, 1430]\ntotal_sales = sum(sales)\naverage_sales = total_sales / len(sales)\nprint(total_sales, round(average_sales, 2))",
        "output": "3580 1193.33",
        "application": "Data analysts bind incoming columns, derived metrics, thresholds, and report labels to names before transforming or visualising data.",
        "mistake": "Using vague names such as x and data throughout a notebook makes analysis hard to audit. Prefer orders, order_total, and missing_rate.",
        "exercise": "Create a list of five daily order totals and calculate total, average, minimum, and maximum using descriptive variables.",
    },
    "Data Types (int, float, complex, bool, str, None)": {
        "definition": "A data type describes the kind of value an object represents and the operations that are valid for it.",
        "concepts": ["int represents whole numbers", "float represents approximate real numbers", "str represents text", "bool represents truth values", "None represents absence of a value"],
        "syntax": "records = 120                 # int\nconversion_rate = 0.235       # float\nactive = True                 # bool\nsegment = \"enterprise\"        # str\nlast_contacted = None         # missing value",
        "example": "values = [42, 3.5, True, \"42\", None]\nfor value in values:\n    print(type(value).__name__)",
        "output": "int\nfloat\nbool\nstr\nNoneType",
        "application": "Type awareness prevents accidental arithmetic on text columns, incorrect comparisons, and ambiguous missing-value handling during ingestion.",
        "mistake": "Assuming the string \"100\" behaves like the integer 100. Inspect and normalise types before calculating metrics.",
        "exercise": "Build a record containing a customer id, spend, opt-in flag, email, and optional referral code. Print each value and type.",
    },
}


def slug_title(title: str) -> str:
    return re.sub(r"\s+", " ", title).strip()


def family(title: str, part: int) -> str:
    if part <= 126:
        return "core Python"
    if part <= 154:
        return "NumPy"
    if part <= 212:
        return "pandas"
    if part <= 228:
        return "visualisation"
    if part <= 247:
        return "statistics"
    if part <= 257:
        return "data integration"
    if part <= 274:
        return "automation and code quality"
    if part <= 286:
        return "analytics workflow"
    if part <= 300:
        return "professional practice"
    return "capstone project"


def generic_code(title: str, part: int) -> tuple[str, str]:
    t = title.lower()
    if "numpy" in t or part >= 127 and part <= 154:
        code = "import numpy as np\n\nscores = np.array([72, 81, 66, 94])\nprint(scores.mean())"
        return code, "78.25"
    if "pandas" in t or part >= 155 and part <= 212:
        code = "import pandas as pd\n\norders = pd.DataFrame({\"amount\": [120, 80, 200], \"status\": [\"paid\", \"pending\", \"paid\"]})\nprint(orders.loc[orders[\"status\"] == \"paid\", \"amount\"].sum())"
        return code, "320"
    if "visual" in t or part >= 213 and part <= 228:
        code = "import matplotlib.pyplot as plt\n\nmonths = [\"Jan\", \"Feb\", \"Mar\"]\nrevenue = [12, 15, 14]\nplt.plot(months, revenue, marker=\"o\")\nplt.ylabel(\"Revenue (thousands)\")\nplt.tight_layout()\nplt.show()"
        return code, "A line chart is displayed."
    if part >= 229 and part <= 247:
        code = "import statistics\n\nvalues = [10, 12, 12, 15, 21]\nprint(statistics.mean(values))"
        return code, "14"
    if "if" in t or "elif" in t or "else" in t:
        code = "score = 87\n\nif score >= 90:\n    band = \"excellent\"\nelif score >= 60:\n    band = \"pass\"\nelse:\n    band = \"review\"\nprint(band)"
        return code, "pass"
    if "loop" in t or "enumerate" in t or "range" in t or "comprehension" in t:
        code = "orders = [120, 80, 200]\n\nfor position, amount in enumerate(orders, start=1):\n    print(position, amount)"
        return code, "1 120\n2 80\n3 200"
    if "function" in t or "parameter" in t or "return" in t or "lambda" in t:
        code = "def average(values: list[float]) -> float:\n    if not values:\n        raise ValueError(\"values must not be empty\")\n    return sum(values) / len(values)\n\nprint(round(average([10, 20, 30]), 2))"
        return code, "20.0"
    if "file" in t or "csv" in t or "json" in t or "pathlib" in t:
        code = "from pathlib import Path\n\npath = Path(\"data\") / \"orders.csv\"\nprint(path.suffix, path.name)"
        return code, ".csv orders.csv"
    if "class" in t or "object" in t or "method" in t:
        code = "class Metric:\n    def __init__(self, name: str, value: float):\n        self.name = name\n        self.value = value\n\nmetric = Metric(\"conversion_rate\", 0.24)\nprint(metric.name, metric.value)"
        return code, "conversion_rate 0.24"
    code = "values = [120, 80, 200]\nresult = sum(values)\nprint(result)"
    return code, "400"


def make_notes(part: int, raw_title: str) -> str:
    title = slug_title(raw_title)
    special = SPECIAL.get(title, {})
    code, output = special.get("example"), special.get("output")
    if not code:
        code, output = generic_code(title, part)
    definition = special.get("definition", f"{title} is a focused Python or analytics technique used to solve a repeatable {family(title, part)} problem.")
    concepts = special.get("concepts", [f"What {title} does", "The input and output shape", "How it fits into an analysis workflow", "When a different approach is safer or clearer"])
    syntax = special.get("syntax", code.split("\n")[0] + "  # representative syntax")
    application = special.get("application", f"In {family(title, part)} work, analysts use {title} to make a transformation explicit, reproducible, and easy to validate.")
    mistake = special.get("mistake", f"Applying {title} without checking the input shape, data type, missing values, or expected output can produce plausible but incorrect results.")
    exercise = special.get("exercise", f"Create a small dataset and use {title} to answer one business question. Record the input, expected result, and a check that proves the result is correct.")
    lines = [
        f"# Part {part} - {title}", "", 
        "## Topic Overview", f"This lesson focuses on **{title}** and places it in the wider Python for Data Analysis workflow. The goal is not to memorise an API; it is to understand the data entering the operation, the result it produces, and the decision that result supports.", "",
        "## Definitions", definition, "", 
        "## Concepts", *[f"- {item}" for item in concepts], "",
        "## Syntax", "```python", syntax, "```", "",
        "## Syntax Breakdown", "- Identify the input values or columns first.", "- Apply the operation with explicit names and predictable types.", "- Inspect or validate the result before using it in a report.", "",
        "## Examples", "### Beginner example", "```python", code, "```", f"**Expected output:**\n```text\n{output}\n```", "The example is intentionally small so you can trace each value. In production, keep the same reasoning but add validation, logging, and tests.", "",
        "### Intermediate example", "```python", "records = [\n    {\"customer\": \"Asha\", \"amount\": 120},\n    {\"customer\": \"Ben\", \"amount\": 80},\n    {\"customer\": \"Chen\", \"amount\": 200},\n]", "# Keep the transformation separate from presentation.\nqualified = [row for row in records if row[\"amount\"] >= 100]", "print([row[\"customer\"] for row in qualified])", "```", "**Expected output:** `['Asha', 'Chen']`", "",
        "### Advanced example", "```python", "from collections.abc import Iterable\n\ndef analyse(values: Iterable[float]) -> dict[str, float]:\n    clean = [float(value) for value in values if value is not None]\n    if not clean:\n        return {\"count\": 0.0, \"total\": 0.0}\n    return {\"count\": float(len(clean)), \"total\": sum(clean)}\n\nprint(analyse([120, None, 80, 200]))", "```", "This version makes the contract visible: it accepts an iterable, handles missing values deliberately, and returns a stable result shape.", "",
        "## Real-world Applications", application, "", 
        "## Best Practices", "- Make assumptions visible in names, comments, or validation checks.", "- Prefer small, composable transformations over one opaque expression.", "- Keep raw data immutable; create derived columns or objects for analysis.", "- Test boundary cases such as empty input, missing values, duplicate keys, and unexpected types.", "",
        "## Common Mistakes", f"- {mistake}", "- Trusting a successful execution as proof that the result is correct.", "- Mixing cleaning, calculation, and chart formatting in one hard-to-test block.", "",
        "## Professional Tips", "- State the grain of the data: one row per order, customer, event, or date.", "- Check row counts and key metrics before and after a transformation.", "- Use reproducible inputs and fixed random seeds when randomness is involved.", "- Document decisions that affect business interpretation, not only syntax.", "",
        "## Interview Questions", f"1. What problem does {title} solve?\n2. What are its inputs, outputs, and important edge cases?\n3. How would you validate the result on a real dataset?\n4. When would you choose a simpler or more scalable alternative?", "",
        "## HR Questions", f"Describe a time you used {title} to make an analysis more reliable or understandable. Explain the business question, your checks, and how you communicated the result to a non-technical stakeholder.", "",
        "## Coding Exercises", f"1. {exercise}\n2. Add an empty-input test and an invalid-input test.\n3. Refactor the solution into a function with a type hint and docstring.", "",
        "## Cheat Sheet", "| Item | Guidance |\n|---|---|\n| Purpose | Solve a specific analysis problem |\n| Input check | Confirm type, shape, and missing-value policy |\n| Output check | Validate row count, range, and sample values |\n| Production habit | Keep it reproducible and documented |", "",
        "## Summary", f"{title} is most useful when its input contract and business purpose are clear. Start with a small example, verify the result, then scale the same pattern to the full dataset.", "",
        "## Revision Checklist", f"- [ ] Define {title} in your own words\n- [ ] Write the core syntax without looking it up\n- [ ] Explain one edge case\n- [ ] Complete the coding exercise\n- [ ] Validate a result with at least one independent check\n- [ ] Explain one real-world use to a non-technical stakeholder", "",
        "## References", "- Python documentation: https://docs.python.org/3/\n- NumPy documentation: https://numpy.org/doc/stable/\n- pandas documentation: https://pandas.pydata.org/docs/\n- Matplotlib documentation: https://matplotlib.org/stable/",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8-sig"))
    # The config stores part numbers, while the canonical titles are in the
    # existing notes headers. Read those headers so this script never invents
    # or reorders the curriculum.
    for module in config["python"]["modules"]:
        for part in module["parts"]:
            path = CONTENT / f"Part-{part}" / "notes.md"
            existing = path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""
            # Preserve hand-authored premium chapters when regenerating the
            # scaffold for the remaining lessons.
            if "## Connecting to the Course" in existing:
                continue
            match = re.search(r"^# Part \d+\s*(?:-|—|â€”|–)\s*(.+)$", existing, re.MULTILINE)
            title = match.group(1).strip() if match else f"Lesson {part}"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(make_notes(part, title), encoding="utf-8")
    print(f"Populated {sum(len(m['parts']) for m in config['python']['modules'])} Python lessons.")


if __name__ == "__main__":
    main()
