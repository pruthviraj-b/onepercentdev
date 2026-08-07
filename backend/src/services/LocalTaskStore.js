const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

function readAll() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(tasks) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(tasks, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

function list(userId) {
  return readAll()
    .filter(task => task.user_id === userId)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
}

function create(userId, text, dueDate) {
  const tasks = readAll();
  const nextId = tasks.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0) + 1;
  const task = {
    id: nextId,
    user_id: userId,
    text,
    done: false,
    due_date: dueDate || null,
    created_at: new Date().toISOString(),
  };
  writeAll([...tasks, task]);
  return task;
}

function update(userId, id, patch) {
  const tasks = readAll();
  let found = false;
  const updated = tasks.map(task => {
    if (task.user_id !== userId || Number(task.id) !== id) return task;
    found = true;
    return { ...task, ...patch };
  });
  if (found) writeAll(updated);
  return found;
}

function remove(userId, id) {
  const tasks = readAll();
  const updated = tasks.filter(task => !(task.user_id === userId && Number(task.id) === id));
  const found = updated.length !== tasks.length;
  if (found) writeAll(updated);
  return found;
}

module.exports = { list, create, update, remove };
