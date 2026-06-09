import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = path.join(process.cwd(), '..');

// Accurate module grouping based on actual Part-* note titles
const MODULES_DATA = [
  {
    id: 1,
    title: 'Foundations',
    parts: [2, 3, 4, 5, 6],
    // Part 2: Setup + Why Python | Part 3: History | Part 4: Culture + Installed
    // Part 5: First Code | Part 6: How Python Runs
  },
  {
    id: 2,
    title: 'Core Primitives',
    parts: [7, 8, 9, 10, 11, 12],
    // Part 7: Memory Stack & Heap | Part 8: Variables & Objects | Part 9: Numbers
    // Part 10: Strings | Part 11: Booleans | Part 12: Logical Operators
  },
  {
    id: 3,
    title: 'Control Flow & Logic',
    parts: [13, 14, 15, 16],
    // Part 13: Conditionals | Part 14: Professional Conditional Patterns
    // Part 15: While Loops | Part 16: For Loops
  },
  {
    id: 4,
    title: 'Data Structures',
    parts: [17, 18, 19, 20, 21, 22, 23],
    // Part 17: Lists 1 | Part 18: Lists 2 | Part 19: Tuples & Unpacking
    // Part 20: Sets | Part 21: Dicts 1 | Part 22: Dicts 2 | Part 23: Comprehensions
  },
  {
    id: 5,
    title: 'Functions & Functional',
    parts: [24, 25, 26, 27, 28],
    // Part 24: Functions 1 | Part 25: Functions 2 | Part 26: Recursion
    // Part 27: Memoization | Part 28: Lambda & Functional Helpers
  },
  {
    id: 6,
    title: 'Modules & Packages',
    parts: [29, 30, 31, 32],
    // Part 29: Modules & Imports | Part 30: Third-Party Packages & pip
    // Part 31: Virtual Environments | Part 32: Publishing to PyPI
  },
  {
    id: 7,
    title: 'Error Handling',
    parts: [33, 34, 35],
    // Part 33: Exceptions 1 | Part 34: Exceptions 2 | Part 35: Exceptions 3
  },
];

const IMPORTANCE: Record<number, string> = {
  2:'high',  3:'medium', 4:'medium', 5:'high',   6:'high',
  7:'high',  8:'high',   9:'medium', 10:'high',  11:'high',
  12:'high', 13:'high',  14:'high',  15:'high',  16:'high',
  17:'high', 18:'high',  19:'medium',20:'medium',21:'high',
  22:'high', 23:'high',  24:'high',  25:'high',  26:'high',
  27:'medium',28:'medium',29:'high', 30:'high',  31:'high',
  32:'medium',33:'high', 34:'high',  35:'high',
};

export async function GET() {
  const result = MODULES_DATA.map(mod => ({
    id: mod.id,
    title: mod.title,
    parts: mod.parts,
    notes: mod.parts.map(p => {
      const dir = path.join(CONTENT_ROOT, `Part-${p}`);
      if (!fs.existsSync(dir)) return null;
      const notesPath = path.join(dir, 'notes.md');
      const content = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
      const titleMatch = content.match(/^#\s+(.+)/m);
      const entries = fs.readdirSync(dir);
      // Strip "Part N — " prefix for cleaner sidebar display
      const rawTitle = titleMatch ? titleMatch[1].trim() : `Part ${p}`;
      const cleanTitle = rawTitle.replace(/^Part\s+\d+\s*[—–-]+\s*/, '');
      return {
        part: p,
        title: cleanTitle,
        importance: IMPORTANCE[p] || 'medium',
        hasFiles: entries.some(f => f !== 'notes.md'),
        wordCount: content.split(/\s+/).length,
      };
    }).filter(Boolean),
  }));

  return NextResponse.json(result);
}
