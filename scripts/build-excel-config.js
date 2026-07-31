/**
 * Builds the excel entry for courses.config.json
 * 50 chapters × 10 parts = 500 parts total
 * Run: node scripts/build-excel-config.js
 */
const fs = require('fs');
const path = require('path');

const chapters = [
  // Foundation (1–10)
  { id: 1,  title: 'Excel Basics & Navigation' },
  { id: 2,  title: 'Data Entry & Cleaning' },
  { id: 3,  title: 'Formatting & Aesthetics' },
  { id: 4,  title: 'Formulas & Functions (Intro)' },
  { id: 5,  title: 'Intermediate Functions' },
  { id: 6,  title: 'Advanced Functions' },
  { id: 7,  title: 'Data Analysis Basics' },
  { id: 8,  title: 'PivotTables' },
  { id: 9,  title: 'Charts & Visualization' },
  { id: 10, title: 'Data Import & Export' },
  // Core Analytics (11–20)
  { id: 11, title: 'Descriptive Statistics in Excel' },
  { id: 12, title: 'Data Tables & Structured References' },
  { id: 13, title: 'Conditional Logic (IF, IFS, SWITCH)' },
  { id: 14, title: 'Lookup Mastery (VLOOKUP, XLOOKUP, INDEX/MATCH)' },
  { id: 15, title: 'Text Functions for Cleaning' },
  { id: 16, title: 'Date & Time Functions' },
  { id: 17, title: 'Financial Functions (NPV, IRR, PMT)' },
  { id: 18, title: 'Error Handling & Debugging' },
  { id: 19, title: 'Scenario Manager & What-If Analysis' },
  { id: 20, title: 'Solver & Optimization' },
  // Advanced Analytics (21–30)
  { id: 21, title: 'Power Query Basics' },
  { id: 22, title: 'Power Query Advanced Transformations' },
  { id: 23, title: 'Data Modeling in Excel' },
  { id: 24, title: 'Relationships & Joins in Power Pivot' },
  { id: 25, title: 'DAX Basics (Data Analysis Expressions)' },
  { id: 26, title: 'Advanced DAX Functions' },
  { id: 27, title: 'KPIs & Measures in Power Pivot' },
  { id: 28, title: 'Dashboards in Excel' },
  { id: 29, title: 'Interactive Reports with Slicers & Timelines' },
  { id: 30, title: 'Excel + Power BI Integration' },
  // Business Applications (31–40)
  { id: 31, title: 'HR Analytics in Excel' },
  { id: 32, title: 'Finance & Accounting Models' },
  { id: 33, title: 'Marketing Analytics (Campaign ROI)' },
  { id: 34, title: 'Sales Dashboards' },
  { id: 35, title: 'E-commerce Analytics (Orders, Customers, Revenue)' },
  { id: 36, title: 'Healthcare Analytics (Patient Data)' },
  { id: 37, title: 'Logistics & Supply Chain Models' },
  { id: 38, title: 'Manufacturing Quality Control' },
  { id: 39, title: 'Education Analytics (Student Performance)' },
  { id: 40, title: 'Retail Analytics (Inventory & Pricing)' },
  // Professional Skills (41–50)
  { id: 41, title: 'Collaboration & Sharing Workbooks' },
  { id: 42, title: 'Protecting Sheets & Data Security' },
  { id: 43, title: 'Large Dataset Handling & Performance' },
  { id: 44, title: 'Macros Basics' },
  { id: 45, title: 'VBA for Automation' },
  { id: 46, title: 'Excel + SQL Integration' },
  { id: 47, title: 'Excel + Python (Pandas, NumPy)' },
  { id: 48, title: 'Excel + Cloud (OneDrive, SharePoint)' },
  { id: 49, title: 'Best Practices for Analysts' },
  { id: 50, title: 'Final Projects & Portfolio Building' },
];

// Build modules — each chapter is a module, parts (ch-1)*10+1 .. ch*10
const modules = chapters.map(ch => {
  const start = (ch.id - 1) * 10 + 1;
  const parts = Array.from({ length: 10 }, (_, i) => start + i);
  return { id: ch.id, title: ch.title, parts };
});

// All 500 part numbers
const allParts = modules.flatMap(m => m.parts);

// Importance — first 3 chapters all high; rest use a pattern
function importanceFor(partNum) {
  const ch = Math.ceil(partNum / 10);
  // Foundation & Core Analytics = high throughout
  if (ch <= 20) return 'high';
  // Advanced Analytics chapters — high
  if (ch <= 30) return 'high';
  // Business Applications — high
  if (ch <= 40) return 'high';
  // Professional Skills — mix
  return 'high';
}

const importance = {};
allParts.forEach(p => { importance[String(p)] = importanceFor(p); });

const videos = {};
allParts.forEach(p => { videos[String(p)] = ''; });

const excelEntry = {
  title: 'Excel Mastery',
  description: 'Master Microsoft Excel from basics to advanced — 50 chapters, 500 lessons, real-world projects across every industry.',
  tagline: 'EXCEL MASTERY — 500 LESSONS, ZERO TO ANALYST',
  mascot: '📊',
  contentDir: 'content/excel',
  dirPattern: 'Part-{part}',
  playlistUrl: '',
  channelUrl: '',
  discordUrl: 'https://discord.gg/A3TVRXf58',
  author: '1% Dev Academy',
  authorTitle: 'Excel Expert',
  eyebrow: 'EXCEL FOR DATA ANALYSTS',
  subtitle: 'CELLS TO DASHBOARDS',
  target: 'Students, professionals, and analysts wanting to master Excel for real-world data work',
  goal: 'Build powerful spreadsheets, automate workflows, and create stunning dashboards across every industry',
  welcomeParagraphs: [
    'Welcome to the <b>Excel Mastery</b> course — 50 chapters and 500 lessons taking you from absolute zero to professional analyst.',
    'This is a circular learning curriculum: each advanced chapter revisits earlier skills at a deeper level, ensuring reinforcement and real mastery.',
    'Every part includes structured notes, the lesson video, and real-world examples from industries like Finance, HR, E-commerce, Healthcare, and more.',
  ],
  modules,
  importance,
  videos,
};

// Read existing config
const configPath = path.join(__dirname, '..', 'courses.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Replace excel entry
config.excel = excelEntry;

// Write back
fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log('✅ Excel course config written — 50 chapters, 500 parts.');
console.log('   Now run: node frontend/scripts/export-data.js');
