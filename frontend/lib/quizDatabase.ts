import { Question } from '../components/CodexQuiz';

export const quizDatabase: Record<string, Record<number, Question[]>> = {
  cloud: {
    7: [
      {
        question: "What is the primary function of a network router?",
        options: [
          "To translate HTML files into visual interfaces",
          "To inspect destination IP addresses and direct packets across networks",
          "To host relational SQL database records",
          "To write code snippets into a browser scratchpad"
        ],
        correctIndex: 1,
        explanation: "Routers act as postal sorters, looking at destination IP addresses to decide the next hop for each packet."
      }
    ],
    14: [
      {
        question: "In the client-server pattern, who initiates the connection?",
        options: [
          "The server, polling clients for work",
          "The database, checking for queries",
          "The client, sending an outbound request",
          "The firewall, authorizing incoming users"
        ],
        correctIndex: 2,
        explanation: "The client is the initiator, sending requests to which the server responds."
      }
    ],
    19: [
      {
        question: "What is the role of a hypervisor in virtualization?",
        options: [
          "It accelerates graphic card render times",
          "It distributes requests evenly across multi-region servers",
          "It creates and manages guest Virtual Machines on top of physical host hardware",
          "It minifies JavaScript bundles for fast transfers"
        ],
        correctIndex: 2,
        explanation: "The hypervisor isolates physical resources and slices them up into independent virtual environments."
      }
    ],
    23: [
      {
        question: "Which of the following is a core characteristic of Cloud Computing?",
        options: [
          "Requiring manual server rack installation by the user",
          "On-demand self-service resources over the internet with pay-as-you-go pricing",
          "Single-tenant physical server allocation only",
          "Proprietary local offline storage databases"
        ],
        correctIndex: 1,
        explanation: "Cloud computing provides elastic, on-demand resources over a network with pay-per-use metrics."
      }
    ]
  },
  'data-analyst': {
    1: [
      {
        question: "Why do we use Excel in Data Analytics instead of doing everything by hand?",
        options: [
          "Excel makes our computer run faster",
          "It allows us to store, organize, and compute large amounts of tabular data efficiently",
          "Excel is required to build a cloud network",
          "It is the only software that can open text files"
        ],
        correctIndex: 1,
        explanation: "Excel's grid system and formula engine let analysts compute massive amounts of data without manual calculations."
      }
    ],
    2: [
      {
        question: "What does conditional formatting do in Excel?",
        options: [
          "Deletes rows that contain errors",
          "Automatically changes the visual appearance of a cell based on its value",
          "Translates data into different languages",
          "Saves the workbook to the cloud"
        ],
        correctIndex: 1,
        explanation: "Conditional formatting dynamically applies colors or icons to cells, making trends and outliers instantly visible."
      }
    ],
    3: [
      {
        question: "When importing CSV files into Excel, what does 'Delimiter' mean?",
        options: [
          "The file size limit",
          "The character (like a comma) used to separate columns of data",
          "The password used to open the file",
          "The total number of rows in the document"
        ],
        correctIndex: 1,
        explanation: "A delimiter tells the system where one column ends and the next begins in a plain text file."
      }
    ],
    4: [
      {
        question: "What is the primary benefit of using VLOOKUP or XLOOKUP?",
        options: [
          "They automatically translate data to SQL",
          "They allow you to search for a value in one column and return a corresponding value from another column",
          "They permanently delete duplicate rows",
          "They encrypt sensitive cells"
        ],
        correctIndex: 1,
        explanation: "Lookup functions act as a bridge between tables, finding matching data instantly without manual searching."
      }
    ],
    5: [
      {
        question: "What happens when you lock a cell reference using '$' (e.g., $A$1)?",
        options: [
          "The formula becomes invisible",
          "The cell reference remains constant even if you copy the formula to another cell",
          "The cell is password protected",
          "The cell will only accept numerical values"
        ],
        correctIndex: 1,
        explanation: "Absolute referencing ($) 'anchors' the cell, ensuring formulas point to the exact same cell when dragged."
      }
    ],
    6: [
      {
        question: "Why are Pivot Tables considered one of the most powerful features in Excel?",
        options: [
          "Because they automatically fix corrupted files",
          "They allow rapid aggregation (sum, count, average) of massive datasets simply by dragging and dropping fields",
          "They execute Python code inside Excel",
          "They convert Excel into a relational database"
        ],
        correctIndex: 1,
        explanation: "Pivot tables abstract away complex formulas, letting you slice and dice data visually and instantly."
      }
    ],
    7: [
      {
        question: "What is the main limitation of using Excel for large-scale data analysis?",
        options: [
          "It does not support basic math operations",
          "It crashes or slows down significantly when handling millions of rows",
          "It cannot be saved on Windows computers",
          "It lacks the ability to color cells"
        ],
        correctIndex: 1,
        explanation: "Excel's memory management struggles with datasets exceeding ~1 million rows, which is where Python/SQL take over."
      }
    ],
    8: [
      {
        question: "Why do data analysts use Python when they already have Excel?",
        options: [
          "Python is easier to install than Excel",
          "Python can automate repetitive tasks, handle millions of rows, and integrate with APIs much better than Excel",
          "Excel cannot do basic math",
          "Python has better built-in fonts"
        ],
        correctIndex: 1,
        explanation: "Python scales infinitely better than Excel. It can handle massive datasets and automate complex ETL pipelines."
      }
    ],
    9: [
      {
        question: "In Python, what is a variable?",
        options: [
          "A network connection to a database",
          "A named storage location in computer memory used to hold data",
          "A type of loop that runs infinitely",
          "A specific error thrown by the interpreter"
        ],
        correctIndex: 1,
        explanation: "Variables act like containers with labels, allowing you to store and reuse data dynamically throughout your code."
      }
    ],
    10: [
      {
        question: "What is the difference between a Python List and a Dictionary?",
        options: [
          "Lists store text, Dictionaries store numbers",
          "Lists are ordered collections of items, Dictionaries are key-value pairs where each item is accessed by a unique key",
          "Lists are faster than Dictionaries",
          "Dictionaries can only hold up to 10 items"
        ],
        correctIndex: 1,
        explanation: "Lists rely on numerical indexing (0, 1, 2), whereas dictionaries map specific keys (like 'name') to values."
      }
    ],
    11: [
      {
        question: "What is the primary purpose of a 'for loop' in Data Analytics?",
        options: [
          "To secure the database",
          "To iterate over thousands of data points automatically without writing repetitive code",
          "To format output text to be bold",
          "To shut down the terminal"
        ],
        correctIndex: 1,
        explanation: "Loops are the engine of automation. Instead of checking 10,000 rows manually, a loop does it in milliseconds."
      }
    ],
    12: [
      {
        question: "Why do we define custom Functions in Python (using 'def')?",
        options: [
          "To make the code run slower so we can debug it",
          "To encapsulate a block of logic into a reusable block, making the code modular and clean",
          "To prevent other developers from reading our code",
          "Because Python requires all code to be inside a function"
        ],
        correctIndex: 1,
        explanation: "Functions abstract away complexity. You write the logic once, name it, and call it whenever needed."
      }
    ],
    13: [
      {
        question: "What is a major advantage of the Pandas library?",
        options: [
          "It provides DataFrames, which are like super-powered Excel tables that run purely in computer memory",
          "It adds visual animations to the Python terminal",
          "It translates SQL to Python",
          "It compresses the computer's hard drive"
        ],
        correctIndex: 0,
        explanation: "Pandas was built specifically for data manipulation, introducing DataFrames to handle tabular data flawlessly in Python."
      }
    ],
    14: [
      {
        question: "How do you handle missing or 'NaN' values in a Pandas DataFrame?",
        options: [
          "You must delete the entire dataset and start over",
          "You can either drop the rows using .dropna() or fill them with a default value using .fillna()",
          "You ignore them and hope the code doesn't crash",
          "You convert the DataFrame back to Excel to fix it"
        ],
        correctIndex: 1,
        explanation: "Handling missing data (imputation or removal) is a critical step in data cleaning before any analysis can begin."
      }
    ],
    15: [
      {
        question: "What does the Pandas method .groupby() achieve?",
        options: [
          "It splits a dataset into multiple separate CSV files",
          "It groups rows sharing a common value so you can perform aggregations (like sum or mean) on them, similar to an Excel Pivot Table",
          "It groups all Python errors into one file",
          "It combines two different DataFrames side-by-side"
        ],
        correctIndex: 1,
        explanation: "Groupby is the programmatic equivalent of a Pivot Table, allowing deep, multi-level aggregations in one line of code."
      }
    ],
    16: [
      {
        question: "Why use Matplotlib or Seaborn instead of just printing Pandas tables?",
        options: [
          "Because printing tables is illegal in some servers",
          "Humans process visual patterns (charts, graphs) drastically faster than raw tabular numbers",
          "Matplotlib automatically fixes data errors",
          "Seaborn runs a machine learning algorithm"
        ],
        correctIndex: 1,
        explanation: "Visualizations translate abstract metrics into clear narratives, making it instantly obvious if a trend is up or down."
      }
    ],
    17: [
      {
        question: "What is the primary difference between a Bar Chart and a Histogram?",
        options: [
          "Bar charts have horizontal bars, histograms have vertical bars",
          "Bar charts compare categorical discrete variables, while histograms show the distribution of continuous numerical data",
          "Histograms can only be made in SQL",
          "There is no difference, they are synonyms"
        ],
        correctIndex: 1,
        explanation: "A bar chart might show 'Sales by City', but a histogram shows 'How many sales were between $10-$20, $20-$30, etc.'"
      }
    ],
    18: [
      {
        question: "What does a correlation matrix tell an analyst?",
        options: [
          "Which server is the fastest",
          "The linear relationship strength between multiple variables in a dataset",
          "The number of missing values in each column",
          "How long the code took to execute"
        ],
        correctIndex: 1,
        explanation: "Correlation reveals hidden relationships (e.g., as temperature goes up, ice cream sales go up), driving predictive insights."
      }
    ],
    19: [
      {
        question: "Why is data cleaning considered 80% of an analyst's job?",
        options: [
          "Because writing algorithms takes very little time",
          "Because real-world data is inherently messy, duplicated, and inconsistent, and models fed bad data will output bad results",
          "Because analysts are paid by the hour",
          "Because Python requires strictly formatted text files"
        ],
        correctIndex: 1,
        explanation: "Garbage in, garbage out. No amount of advanced modeling can fix fundamentally flawed or missing input data."
      }
    ],
    20: [
      {
        question: "What is the main purpose of SQL in data analytics?",
        options: [
          "To style web pages",
          "To query, retrieve, and manage data stored in relational databases",
          "To create dynamic animations",
          "To build predictive machine learning models"
        ],
        correctIndex: 1,
        explanation: "SQL (Structured Query Language) is the universal standard for communicating with massive relational databases."
      }
    ],
    21: [
      {
        question: "What does the WHERE clause do in a SQL query?",
        options: [
          "It defines which database to connect to",
          "It filters the result set to only include rows that meet a specific condition",
          "It orders the final results alphabetically",
          "It groups rows together"
        ],
        correctIndex: 1,
        explanation: "WHERE acts as a gatekeeper, instantly reducing a massive table to only the exact records you care about."
      }
    ],
    22: [
      {
        question: "How does the GROUP BY clause differ from ORDER BY?",
        options: [
          "They are exactly the same",
          "GROUP BY aggregates rows into summary rows (like finding totals), while ORDER BY simply sorts the output",
          "GROUP BY is only used for text, ORDER BY is for numbers",
          "ORDER BY creates a new table"
        ],
        correctIndex: 1,
        explanation: "GROUP BY is used with functions like SUM() or COUNT() to aggregate data, whereas ORDER BY just dictates the visual sequence (ASC/DESC)."
      }
    ],
    23: [
      {
        question: "What is the purpose of a SQL JOIN?",
        options: [
          "To combine two queries so they run faster",
          "To combine rows from two or more tables based on a related column between them",
          "To connect the database to a web server",
          "To compress database tables"
        ],
        correctIndex: 1,
        explanation: "Relational databases split data across tables to avoid redundancy. JOINs stitch them back together for analysis."
      }
    ],
    24: [
      {
        question: "What happens in an INNER JOIN?",
        options: [
          "All records from both tables are returned regardless of matches",
          "Only records that have matching values in BOTH tables are returned",
          "The database deletes records that don't match",
          "The inner core of the database is accessed"
        ],
        correctIndex: 1,
        explanation: "INNER JOIN is highly restrictive; it acts like a strict intersection, dropping any rows that lack a counterpart."
      }
    ],
    25: [
      {
        question: "Why would you use a LEFT JOIN instead of an INNER JOIN?",
        options: [
          "Because it runs faster on left-side servers",
          "To keep all records from the primary (left) table even if they have no matches in the secondary table",
          "To reverse the order of columns",
          "LEFT JOIN is an outdated feature"
        ],
        correctIndex: 1,
        explanation: "LEFT JOIN preserves your core dataset (like a list of all customers), even if some of them haven't placed an order yet."
      }
    ],
    26: [
      {
        question: "What is a Subquery?",
        options: [
          "A query that failed to execute",
          "A query nested inside another query, used to perform calculations sequentially",
          "A secondary database connection",
          "A query written in Python instead of SQL"
        ],
        correctIndex: 1,
        explanation: "Subqueries allow you to compute an intermediate result (like 'Find the average salary') and immediately use it in the main query."
      }
    ],
    27: [
      {
        question: "What is the advantage of using CTEs (Common Table Expressions) over Subqueries?",
        options: [
          "They run exactly 10x faster",
          "They make complex queries drastically more readable by breaking them into named, modular blocks",
          "They permanently save the data to the hard drive",
          "They can be used outside of a database"
        ],
        correctIndex: 1,
        explanation: "CTEs (using the WITH clause) let you architect massive analytical queries step-by-step, making maintenance far easier."
      }
    ],
    28: [
      {
        question: "Why do companies use Tableau or Power BI when they already have Python and SQL?",
        options: [
          "They don't; Tableau is obsolete",
          "Tableau allows non-technical stakeholders (like CEOs) to interact with dynamic dashboards without writing code",
          "Tableau is used to create the databases",
          "Power BI is an operating system"
        ],
        correctIndex: 1,
        explanation: "Business Intelligence tools democratize data. They take complex backend queries and turn them into interactive, live visual interfaces."
      }
    ],
    29: [
      {
        question: "What distinguishes a strong BI Dashboard from a weak one?",
        options: [
          "A strong dashboard has as many colors and charts as physically possible",
          "A strong dashboard focuses on narrative clarity, showing actionable KPIs instantly without overwhelming the user",
          "A weak dashboard uses SQL",
          "A strong dashboard requires a password for every chart"
        ],
        correctIndex: 1,
        explanation: "Dashboards are about cognitive load. If an executive takes more than 5 seconds to find the key metric, the design has failed."
      }
    ],
    30: [
      {
        question: "As a professional Data Analyst, what is the ultimate goal of combining Excel, Python, SQL, and Tableau?",
        options: [
          "To prove technical superiority to coworkers",
          "To extract raw data, transform it into a structured format, and present actionable insights that drive business strategy",
          "To build cloud infrastructure",
          "To avoid writing reports"
        ],
        correctIndex: 1,
        explanation: "Tools are just tools. The ultimate engineering goal is turning chaos (raw data) into clarity (business decisions) efficiently and reliably."
      }
    ]
  }
};
