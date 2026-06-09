import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONTENT_ROOT = path.join(process.cwd(), '..');

const MODULES_DATA = [
  { id: 1, title: 'Foundations',            parts: [2, 3, 4, 5, 6] },
  { id: 2, title: 'Core Primitives',        parts: [7, 8, 9, 10, 11, 12] },
  { id: 3, title: 'Control Flow & Logic',   parts: [13, 14, 15, 16] },
  { id: 4, title: 'Data Structures',        parts: [17, 18, 19, 20, 21, 22, 23] },
  { id: 5, title: 'Functions & Functional', parts: [24, 25, 26, 27, 28] },
  { id: 6, title: 'Modules & Packages',     parts: [29, 30, 31, 32] },
  { id: 7, title: 'Error Handling',         parts: [33, 34, 35] },
];

const IMPORTANCE: Record<number, string> = {
  2:'high', 3:'medium', 4:'medium', 5:'high', 6:'high',
  7:'high', 8:'high', 9:'medium', 10:'medium', 11:'high',
  12:'high', 13:'high', 14:'high', 15:'medium', 16:'medium',
  17:'high', 18:'high', 19:'medium', 20:'medium', 21:'high',
  22:'high', 23:'medium', 24:'medium', 25:'high', 26:'high',
  27:'medium', 28:'medium', 29:'high', 30:'high', 31:'medium',
  32:'high', 33:'high', 34:'medium', 35:'high',
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ part: string }> }
) {
  const { part: partStr } = await params;
  const partNum = parseInt(partStr, 10);
  if (isNaN(partNum)) {
    return NextResponse.json({ error: 'Invalid part' }, { status: 400 });
  }

  const dir = path.join(CONTENT_ROOT, `Part-${partNum}`);
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ error: `Part ${partNum} not found` }, { status: 404 });
  }

  const notesPath = path.join(dir, 'notes.md');
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, 'utf-8') : '';
  const titleMatch = notes.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : `Part ${partNum}`;

  const files: { path: string; content: string }[] = [];
  for (const entry of fs.readdirSync(dir)) {
    if (entry === 'notes.md') continue;
    const filePath = path.join(dir, entry);
    if (fs.statSync(filePath).isFile()) {
      files.push({ path: entry, content: fs.readFileSync(filePath, 'utf-8') });
    }
  }

  const module = MODULES_DATA.find(m => m.parts.includes(partNum));

  return NextResponse.json({
    part: partNum,
    title,
    notes,
    files,
    importance: IMPORTANCE[partNum] || 'medium',
    module: module ? module.title : 'General',
    module_id: module ? module.id : 0,
  });
}
