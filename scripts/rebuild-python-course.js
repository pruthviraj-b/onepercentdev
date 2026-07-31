const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'python');
const CONFIG_PATH = path.join(ROOT_DIR, 'courses.config.json');

const MODULES_SPEC = [
  {
    id: 1,
    title: "Tier 1: Python Fundamentals (Refresher)",
    lessons: [
      { part: 1, title: "Variables" },
      { part: 2, title: "Data Types (int, float, complex, bool, str, None)" },
      { part: 3, title: "Type Casting" },
      { part: 4, title: "Input & Output" },
      { part: 5, title: "Comments & Documentation" },
      { part: 6, title: "Operators (Arithmetic, Comparison, Assignment, Logical, Identity, Membership, Bitwise)" },
      { part: 7, title: "String Basics" },
      { part: 8, title: "String Indexing" },
      { part: 9, title: "String Slicing" },
      { part: 10, title: "String Methods" },
      { part: 11, title: "String Formatting (f-strings, format(), %)" },
      { part: 12, title: "Lists" },
      { part: 13, title: "List Methods" },
      { part: 14, title: "Nested Lists" },
      { part: 15, title: "Tuples" },
      { part: 16, title: "Tuple Packing" },
      { part: 17, title: "Tuple Unpacking" },
      { part: 18, title: "Sets" },
      { part: 19, title: "Set Operations" },
      { part: 20, title: "Dictionaries" },
      { part: 21, title: "Dictionary Methods" },
      { part: 22, title: "Nested Dictionaries" }
    ]
  },
  {
    id: 2,
    title: "Tier 2: Flow Control",
    lessons: [
      { part: 23, title: "if Statement" },
      { part: 24, title: "elif Statement" },
      { part: 25, title: "else Statement" },
      { part: 26, title: "for Loop" },
      { part: 27, title: "while Loop" },
      { part: 28, title: "break Statement" },
      { part: 29, title: "continue Statement" },
      { part: 30, title: "pass Statement" },
      { part: 31, title: "enumerate()" },
      { part: 32, title: "zip()" },
      { part: 33, title: "any()" },
      { part: 34, title: "all()" },
      { part: 35, title: "range()" },
      { part: 36, title: "Comprehensions (List, Dictionary, Set, Generator)" }
    ]
  },
  {
    id: 3,
    title: "Tier 3: Functions",
    lessons: [
      { part: 37, title: "Creating Functions" },
      { part: 38, title: "Parameters" },
      { part: 39, title: "Return Statement" },
      { part: 40, title: "Default Parameters" },
      { part: 41, title: "Keyword Arguments" },
      { part: 42, title: "Positional Arguments" },
      { part: 43, title: "Variable Arguments (*args)" },
      { part: 44, title: "Keyword Variable Arguments (**kwargs)" },
      { part: 45, title: "Lambda Functions" },
      { part: 46, title: "Recursion (Awareness)" },
      { part: 47, title: "Scope" },
      { part: 48, title: "Global Keyword" },
      { part: 49, title: "Local Variables" },
      { part: 50, title: "Docstrings" },
      { part: 51, title: "Type Hints" }
    ]
  },
  {
    id: 4,
    title: "Tier 4: Exception Handling",
    lessons: [
      { part: 52, title: "try Block" },
      { part: 53, title: "except Block" },
      { part: 54, title: "else Block" },
      { part: 55, title: "finally Block" },
      { part: 56, title: "raise Statement" },
      { part: 57, title: "assert (Awareness)" },
      { part: 58, title: "Custom Exceptions (Basic)" }
    ]
  },
  {
    id: 5,
    title: "Tier 5: File Handling",
    lessons: [
      { part: 59, title: "Reading Files" },
      { part: 60, title: "Writing Files" },
      { part: 61, title: "Appending Files" },
      { part: 62, title: "Context Manager (with)" },
      { part: 63, title: "Text Files" },
      { part: 64, title: "CSV Files" },
      { part: 65, title: "JSON Files" },
      { part: 66, title: "pathlib Module" },
      { part: 67, title: "pathlib vs os.path" },
      { part: 68, title: "File Encoding" },
      { part: 69, title: "Working with Large Files" }
    ]
  },
  {
    id: 6,
    title: "Tier 6: Modules & Packages",
    lessons: [
      { part: 70, title: "import Statement" },
      { part: 71, title: "from ... import Statement" },
      { part: 72, title: "Aliases" },
      { part: 73, title: "Standard Library" },
      { part: 74, title: "Creating Modules" },
      { part: 75, title: "Packages" },
      { part: 76, title: "pip Package Manager" },
      { part: 77, title: "Virtual Environments" },
      { part: 78, title: "requirements.txt" }
    ]
  },
  {
    id: 7,
    title: "Tier 7: Useful Python Built-ins",
    lessons: [
      { part: 79, title: "sorted()" },
      { part: 80, title: "reversed()" },
      { part: 81, title: "len()" },
      { part: 82, title: "min()" },
      { part: 83, title: "max()" },
      { part: 84, title: "sum()" },
      { part: 85, title: "abs()" },
      { part: 86, title: "round()" },
      { part: 87, title: "map()" },
      { part: 88, title: "filter()" },
      { part: 89, title: "reduce()" },
      { part: 90, title: "enumerate()" },
      { part: 91, title: "zip()" },
      { part: 92, title: "any()" },
      { part: 93, title: "all()" },
      { part: 94, title: "isinstance()" },
      { part: 95, title: "type()" },
      { part: 96, title: "id()" },
      { part: 97, title: "dir()" },
      { part: 98, title: "help()" },
      { part: 99, title: "print()" }
    ]
  },
  {
    id: 8,
    title: "Tier 8: OOP (Awareness)",
    lessons: [
      { part: 100, title: "Classes" },
      { part: 101, title: "Objects" },
      { part: 102, title: "self Parameter" },
      { part: 103, title: "__init__ Method" },
      { part: 104, title: "Instance Variables" },
      { part: 105, title: "Class Variables" },
      { part: 106, title: "Instance Methods" },
      { part: 107, title: "Class Methods (Awareness)" },
      { part: 108, title: "Static Methods (Awareness)" },
      { part: 109, title: "Inheritance (Awareness)" },
      { part: 110, title: "Encapsulation (Basic)" }
    ]
  },
  {
    id: 9,
    title: "Tier 9: Iterators & Generators",
    lessons: [
      { part: 111, title: "Iterables" },
      { part: 112, title: "Iterators" },
      { part: 113, title: "next()" },
      { part: 114, title: "Generator Functions" },
      { part: 115, title: "yield Statement" },
      { part: 116, title: "Generator Expressions" }
    ]
  },
  {
    id: 10,
    title: "Tier 10: Collections Module",
    lessons: [
      { part: 117, title: "Counter" },
      { part: 118, title: "defaultdict" },
      { part: 119, title: "namedtuple (Awareness)" },
      { part: 120, title: "deque (Awareness)" }
    ]
  },
  {
    id: 11,
    title: "Tier 11: Datetime",
    lessons: [
      { part: 121, title: "datetime Module" },
      { part: 122, title: "timedelta" },
      { part: 123, title: "Date Formatting" },
      { part: 124, title: "Parsing Dates" },
      { part: 125, title: "Time Zones (Awareness)" },
      { part: 126, title: "Working with Pandas Dates" }
    ]
  },
  {
    id: 12,
    title: "Tier 12: NumPy",
    lessons: [
      { part: 127, title: "NumPy Arrays" },
      { part: 128, title: "Array Creation" },
      { part: 129, title: "arange()" },
      { part: 130, title: "linspace()" },
      { part: 131, title: "zeros()" },
      { part: 132, title: "ones()" },
      { part: 133, title: "full()" },
      { part: 134, title: "eye()" },
      { part: 135, title: "random()" },
      { part: 136, title: "Array Indexing" },
      { part: 137, title: "Array Slicing" },
      { part: 138, title: "Boolean Indexing" },
      { part: 139, title: "Fancy Indexing" },
      { part: 140, title: "Reshape" },
      { part: 141, title: "flatten()" },
      { part: 142, title: "ravel()" },
      { part: 143, title: "Transpose" },
      { part: 144, title: "Broadcasting" },
      { part: 145, title: "Vectorization" },
      { part: 146, title: "Aggregate Functions" },
      { part: 147, title: "Statistical Functions" },
      { part: 148, title: "np.where()" },
      { part: 149, title: "np.select()" },
      { part: 150, title: "Array Sorting" },
      { part: 151, title: "Array Searching" },
      { part: 152, title: "NaN Handling" },
      { part: 153, title: "Unique Values" },
      { part: 154, title: "Performance Comparison" }
    ]
  },
  {
    id: 13,
    title: "Tier 13: Pandas Structures & I/O",
    lessons: [
      { part: 155, title: "Pandas Series" },
      { part: 156, title: "Pandas DataFrame" },
      { part: 157, title: "read_csv()" },
      { part: 158, title: "read_excel()" },
      { part: 159, title: "read_json()" },
      { part: 160, title: "read_sql()" },
      { part: 161, title: "read_parquet()" },
      { part: 162, title: "Writing Files" },
      { part: 163, title: "Data Inspection" },
      { part: 164, title: "Data Types" },
      { part: 165, title: "Memory Usage" }
    ]
  },
  {
    id: 14,
    title: "Tier 14: Selecting & Filtering",
    lessons: [
      { part: 166, title: "Selecting Columns" },
      { part: 167, title: "loc Selection" },
      { part: 168, title: "iloc Selection" },
      { part: 169, title: "Boolean Indexing" },
      { part: 170, title: "query() Method" },
      { part: 171, title: "isin() Method" },
      { part: 172, title: "between() Method" },
      { part: 173, title: "where() Method" },
      { part: 174, title: "mask() Method" }
    ]
  },
  {
    id: 15,
    title: "Tier 15: Data Cleaning",
    lessons: [
      { part: 175, title: "Missing Values" },
      { part: 176, title: "Duplicate Records" },
      { part: 177, title: "astype() Conversion" },
      { part: 178, title: "rename() Columns/Indices" },
      { part: 179, title: "replace() Values" },
      { part: 180, title: "String Cleaning" },
      { part: 181, title: "Regular Expressions" },
      { part: 182, title: "Outlier Detection (IQR)" },
      { part: 183, title: "Z-score Outlier Detection" },
      { part: 184, title: "Winsorization (Awareness)" }
    ]
  },
  {
    id: 16,
    title: "Tier 16: Transformation",
    lessons: [
      { part: 185, title: "sort_values()" },
      { part: 186, title: "sort_index()" },
      { part: 187, title: "apply() Method" },
      { part: 188, title: "applymap() Method" },
      { part: 189, title: "map() Method" },
      { part: 190, title: "replace() Transformation" },
      { part: 191, title: "assign() Method" },
      { part: 192, title: "insert() Method" },
      { part: 193, title: "drop() Columns/Rows" },
      { part: 194, title: "value_counts()" },
      { part: 195, title: "unique() Values" },
      { part: 196, title: "nunique() Values" },
      { part: 197, title: "explode() Lists" },
      { part: 198, title: "GroupBy Operations" },
      { part: 199, title: "agg() Aggregations" },
      { part: 200, title: "transform() Function" },
      { part: 201, title: "filter() Method" },
      { part: 202, title: "pivot_table()" },
      { part: 203, title: "crosstab()" },
      { part: 204, title: "melt() Unpivoting" },
      { part: 205, title: "stack() Method" },
      { part: 206, title: "unstack() Method" },
      { part: 207, title: "merge() Joining" },
      { part: 208, title: "join() Index-based" },
      { part: 209, title: "concat() Concatenation" },
      { part: 210, title: "Date Operations" },
      { part: 211, title: "Rolling Windows (Basic)" },
      { part: 212, title: "Expanding Windows (Awareness)" }
    ]
  },
  {
    id: 17,
    title: "Tier 17: Data Visualization",
    lessons: [
      { part: 213, title: "Matplotlib Fundamentals" },
      { part: 214, title: "Figure Object" },
      { part: 215, title: "Axes Object" },
      { part: 216, title: "Line Plot" },
      { part: 217, title: "Scatter Plot" },
      { part: 218, title: "Histogram" },
      { part: 219, title: "Bar Chart" },
      { part: 220, title: "Pie Chart (When Appropriate)" },
      { part: 221, title: "Box Plot" },
      { part: 222, title: "Heatmap" },
      { part: 223, title: "Pairplot" },
      { part: 224, title: "Violin Plot" },
      { part: 225, title: "Countplot" },
      { part: 226, title: "Plot Styling" },
      { part: 227, title: "Annotations" },
      { part: 228, title: "Saving Figures" }
    ]
  },
  {
    id: 18,
    title: "Tier 18: Statistics for Data Analysts",
    lessons: [
      { part: 229, title: "Mean" },
      { part: 230, title: "Median" },
      { part: 231, title: "Mode" },
      { part: 232, title: "Variance" },
      { part: 233, title: "Standard Deviation" },
      { part: 234, title: "Quartiles" },
      { part: 235, title: "Percentiles" },
      { part: 236, title: "Correlation" },
      { part: 237, title: "Covariance" },
      { part: 238, title: "Distribution" },
      { part: 239, title: "Skewness" },
      { part: 240, title: "Kurtosis" },
      { part: 241, title: "Outliers" },
      { part: 242, title: "Confidence Intervals (Basic)" },
      { part: 243, title: "Hypothesis Testing" },
      { part: 244, title: "p-value" },
      { part: 245, title: "t-test" },
      { part: 246, title: "Chi-square Test" },
      { part: 247, title: "ANOVA (Awareness)" }
    ]
  },
  {
    id: 19,
    title: "Tier 19: SQL Integration",
    lessons: [
      { part: 248, title: "sqlite3 Module" },
      { part: 249, title: "SQLAlchemy (Basic Awareness)" },
      { part: 250, title: "read_sql() Function" },
      { part: 251, title: "to_sql() Method" },
      { part: 252, title: "Database Connections" }
    ]
  },
  {
    id: 20,
    title: "Tier 20: APIs & Web Data",
    lessons: [
      { part: 253, title: "requests Library" },
      { part: 254, title: "Parsing JSON APIs" },
      { part: 255, title: "API Authentication (Basic)" },
      { part: 256, title: "API Pagination (Basic)" },
      { part: 257, title: "API Error Handling" }
    ]
  },
  {
    id: 21,
    title: "Tier 21: Automation",
    lessons: [
      { part: 258, title: "Combining Multiple Files" },
      { part: 259, title: "Batch Processing" },
      { part: 260, title: "Folder Automation" },
      { part: 261, title: "Excel Automation" },
      { part: 262, title: "openpyxl Library" },
      { part: 263, title: "Report Generation" },
      { part: 264, title: "Logging" }
    ]
  },
  {
    id: 22,
    title: "Tier 22: Performance & Code Quality",
    lessons: [
      { part: 265, title: "Time Complexity" },
      { part: 266, title: "Space Complexity" },
      { part: 267, title: "Profiling with timeit" },
      { part: 268, title: "Memory Optimisation" },
      { part: 269, title: "Vectorisation" },
      { part: 270, title: "Pythonic Code" },
      { part: 271, title: "PEP 8 Style Guide" },
      { part: 272, title: "Clean Code Principles" },
      { part: 273, title: "Naming Conventions" },
      { part: 274, title: "Code Reviews" }
    ]
  },
  {
    id: 23,
    title: "Tier 23: Real-World Data Analysis Workflow",
    lessons: [
      { part: 275, title: "Understanding Business Problem" },
      { part: 276, title: "Data Collection" },
      { part: 277, title: "Data Validation" },
      { part: 278, title: "Data Cleaning" },
      { part: 279, title: "Exploratory Data Analysis" },
      { part: 280, title: "Feature Engineering (Basic)" },
      { part: 281, title: "Data Visualization" },
      { part: 282, title: "Business Insights" },
      { part: 283, title: "Dashboard Preparation" },
      { part: 284, title: "Exporting Results" },
      { part: 285, title: "Documentation" },
      { part: 286, title: "Stakeholder Communication" }
    ]
  },
  {
    id: 24,
    title: "Tier 24: Jupyter & Development Tools",
    lessons: [
      { part: 287, title: "Jupyter Notebook" },
      { part: 288, title: "Keyboard Shortcuts" },
      { part: 289, title: "Markdown Cells" },
      { part: 290, title: "Notebook Best Practices" },
      { part: 291, title: "VS Code for Python" }
    ]
  },
  {
    id: 25,
    title: "Tier 25: Portfolio & Interview Preparation",
    lessons: [
      { part: 292, title: "Git Basics" },
      { part: 293, title: "GitHub Basics" },
      { part: 294, title: "README Writing" },
      { part: 295, title: "Kaggle Workflow" },
      { part: 296, title: "Building Portfolio Projects" },
      { part: 297, title: "Resume-Friendly Python Projects" },
      { part: 298, title: "Technical Interview Questions" },
      { part: 299, title: "HR Interview Questions" },
      { part: 300, title: "Mock Data Analyst Case Studies" }
    ]
  },
  {
    id: 26,
    title: "Final Capstone Projects",
    lessons: [
      { part: 301, title: "Sales Data Analysis Dashboard" },
      { part: 302, title: "Customer Churn Analysis" },
      { part: 303, title: "Retail Inventory Analysis" },
      { part: 304, title: "HR Analytics Dashboard" },
      { part: 305, title: "Financial Performance Analysis" },
      { part: 306, title: "IPL Data Analysis" },
      { part: 307, title: "Netflix Data Analysis" },
      { part: 308, title: "E-commerce Customer Behaviour Analysis" },
      { part: 309, title: "COVID-19 Data Analysis" },
      { part: 310, title: "End-to-End Business Analytics Project (CSV → Cleaning → EDA → Visualisation → Excel Export → Business Report)" }
    ]
  }
];

function generatePlaceholderNotes(part, title) {
  return `# Part ${part} — ${title}

## Topic Overview


## Definitions


## Concepts


## Syntax


## Examples


## Real-world Applications


## Best Practices


## Common Mistakes


## Professional Tips


## Interview Questions


## HR Questions


## Coding Exercises


## Cheat Sheet


## Summary


## Revision Checklist
`;
}

function run() {
  console.log("=== Rebuilding Python LMS Course ===");

  // 1. Purge existing content/python/
  if (fs.existsSync(CONTENT_DIR)) {
    console.log(`Purging existing directory: ${CONTENT_DIR}`);
    fs.rmSync(CONTENT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  // 2. Build new lesson directories and notes.md files
  let totalLessons = 0;
  const modulesConfig = [];
  const importanceMap = {};
  const videosMap = {};

  for (const mod of MODULES_SPEC) {
    const partsArray = [];
    for (const les of mod.lessons) {
      partsArray.push(les.part);
      importanceMap[les.part] = 'high';
      videosMap[les.part] = '';
      totalLessons++;

      const partDir = path.join(CONTENT_DIR, `Part-${les.part}`);
      fs.mkdirSync(partDir, { recursive: true });
      const notesPath = path.join(partDir, 'notes.md');
      fs.writeFileSync(notesPath, generatePlaceholderNotes(les.part, les.title), 'utf-8');
    }
    modulesConfig.push({
      id: mod.id,
      title: mod.title,
      parts: partsArray
    });
  }
  console.log(`Created ${totalLessons} lesson directories and placeholder notes.md files.`);

  // 3. Update courses.config.json
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  
  config.python = {
    title: "Python for Data Analysis — Industry Master Program",
    description: "Master Python from fundamental concepts to advanced data analysis, NumPy, Pandas, visualization, statistics, SQL integration, automation, and real-world analytics projects.",
    tagline: "PYTHON FOR DATA ANALYSIS — INDUSTRY MASTER PROGRAM",
    mascot: "snake",
    contentDir: "content/python",
    dirPattern: "Part-{part}",
    playlistUrl: "",
    channelUrl: "",
    discordUrl: "",
    author: "",
    authorTitle: "",
    eyebrow: "INDUSTRY MASTER PROGRAM",
    subtitle: "PYTHON FOR DATA ANALYSIS",
    target: "Aspiring Data Analysts, Freshers, and Professionals targeting industry-ready Python data analysis skills",
    goal: "Master Python, NumPy, Pandas, Data Cleaning, EDA, Visualization, Statistics, SQL, and Real-World Analytics Projects",
    welcomeParagraphs: [
      "Welcome to the <b>Python for Data Analysis — Industry Master Program</b>. This comprehensive curriculum is designed to take you from core Python fundamentals to production-quality data manipulation, exploratory data analysis, visualization, statistical reasoning, and end-to-end data analytics workflows.",
      "Our objective: equip you with industry-standard, production-grade Python capabilities so you can confidently write clean code, analyze complex datasets, build insightful dashboards, and excel in technical data analysis interviews."
    ],
    modules: modulesConfig,
    importance: importanceMap,
    videos: videosMap
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log("Updated courses.config.json with new Python for Data Analysis course configuration.");
}

run();
