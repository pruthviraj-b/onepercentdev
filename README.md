<p align="center">
  <strong>🐍 1% DEV ACADEMY</strong><br/>
  <em>Python in Kannada — by shyamiscoding</em>
</p>

<p align="center">
  <strong>Designed & Built by <a href="https://pruthviraj-portfolio-nu.vercel.app/">PRUTHVI RAJ B</a></strong>
</p>

---

## 📖 What Is This?

**1% Dev Academy** is a full-stack, interactive study companion for the popular YouTube series **"Python in Kannada"** by [shyamiscoding](https://www.youtube.com/channel/UCT0629rHJIjJWmQj1JyejyA). It brings together all **35 parts** (77 videos) of the course into a unified, high-contrast dashboard with:

- 📝 **Deep conceptual notes** — rendered from Markdown with GitHub Flavoured Markdown support
- 💻 **Copyable code blocks** with one-click "Copy" and "▶ Run" buttons
- 🎥 **Embedded YouTube lesson videos** — synced to each part
- 🐍 **In-browser Python Playground** — powered by [Pyodide](https://pyodide.org/) (real CPython in the browser, no server needed)
- ✅ **Progress tracking** — mark parts as complete, track your percentage
- ⭐ **Bookmarks** — star important parts for quick access
- ⌨️ **Keyboard shortcuts** — navigate like a pro
- 🌗 **Dark / Light theme** — persisted in localStorage

---

## 🎯 Who Is This For?

- BCA / MCA / Engineering students learning Python
- Freshers targeting 2–20 LPA developer roles
- Anyone following the **shyamiscoding** YouTube playlist
- Self-learners who want structured notes alongside video lessons

---

## 🏗️ Tech Stack

| Layer       | Technology                                                                 |
|-------------|---------------------------------------------------------------------------|
| **Frontend** | [Next.js 15](https://nextjs.org/) · React 19 · TypeScript                |
| **Styling**  | Vanilla CSS (retro high-contrast UI, no Tailwind)                        |
| **Markdown** | [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm |
| **Playground** | [Pyodide v0.27](https://pyodide.org/) (CPython compiled to WebAssembly) |
| **Backend**  | [Express.js](https://expressjs.com/) (Node.js) + [sql.js](https://github.com/sql-js/sql.js) (SQLite in JS) |
| **Deployment** | [Vercel](https://vercel.com/) (frontend + backend) / [GitHub Pages](https://pages.github.com/) (static export) |

---

## 📁 Project Structure

```
onepercentdev/
├── frontend/                  # Next.js frontend app
│   ├── app/
│   │   ├── layout.tsx         # Root layout & metadata
│   │   ├── page.tsx           # Entry page
│   │   ├── globals.css        # All styles (retro theme)
│   │   └── favicon.ico
│   ├── components/
│   │   ├── Academy.tsx        # Main app shell (state, routing, shortcuts)
│   │   ├── Landing.tsx        # Landing/home page with syllabus & progress
│   │   ├── Reader.tsx         # Note reader with video, tabs, navigation
│   │   ├── Sidebar.tsx        # Sidebar with module tree & search
│   │   ├── Playground.tsx     # In-browser Python playground (Pyodide)
│   │   └── ShortcutsModal.tsx # Keyboard shortcuts dialog
│   ├── lib/
│   │   ├── api.ts             # API client (fetch modules, progress, bookmarks)
│   │   └── videos.ts          # YouTube video ID mapping per part
│   ├── scripts/
│   │   └── export-data.js     # Pre-build script: exports Part data as static JSON
│   ├── public/                # Static assets (generated JSON lives here)
│   ├── next.config.ts         # Next.js config (GitHub Pages + local dev)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # Express API server (local dev & Vercel)
│   ├── index.js               # API routes: modules, notes, progress, bookmarks
│   ├── academy.db             # SQLite database (progress & bookmarks)
│   └── package.json
│
├── Part-2/ ... Part-35/       # Course content directories
│   ├── notes.md               # Markdown notes for each part
│   └── *.py (optional)        # Python code files for the part
│
├── notes_viewer.html          # Standalone HTML viewer (all notes in one page)
├── vercel.json                # Vercel deployment config
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18+** (LTS recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/Shyamiscoding/onepercentdev.git
cd onepercentdev
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Run Locally (Development)

You need **two terminals** running simultaneously:

**Terminal 1 — Backend API Server (port 3001):**
```bash
cd backend
npm run dev
```
This starts the Express server with hot-reload (`node --watch`). You'll see:
```
  ● 1% Dev Academy — API Server
  ● http://localhost:3001
```

**Terminal 2 — Frontend Dev Server (port 3000):**
```bash
cd frontend
npm run dev
```
This starts the Next.js dev server. Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Note:** The frontend works even without the backend! Progress and bookmarks will fall back to localStorage. The backend adds SQLite-based persistence.

---

## 📚 How to Use the Website

### Landing Page

When you open the site, you'll see:
- **Course overview** — total parts, estimated reading hours, curriculum info
- **Progress bar** — shows how many parts you've completed
- **Full syllabus** — all 7 modules with their parts; click any part to jump directly into it
- **Navigation links** — YouTube channel, Playlist, Telegram, GitHub

Click **"START LEARNING NOW"** or **"RESUME LEARNING"** to enter the course reader.

### Reader View

The reader has a **three-panel split layout**:

| Panel | Content |
|-------|---------|
| **Left** | 🎥 Embedded YouTube lesson video + 🐍 Python Playground |
| **Center/Right** | 📝 Markdown notes with code blocks |

#### Notes Tab
- Read the full lesson notes with formatted Markdown
- Code blocks have **Copy** and **▶ Run** buttons
- Click **▶ Run** on any Python code block to send it directly to the Playground
- A reading progress bar shows how far you've scrolled

#### Files Tab
- View any additional Python files (`.py`) associated with the part
- Copy or run them in the Playground

#### Python Playground
- Write or paste Python code
- Press **▶ Run** or **Ctrl+Enter** to execute
- Powered by Pyodide — runs real Python in your browser, **no server needed**
- Tab key inserts 4 spaces for indentation
- Supports standard Python libraries

### Sidebar

- **Module tree** — expandable list of all 7 modules with their parts
- **Search** — filter parts by title (`/` or `Ctrl+K` to focus)
- **Progress indicator** — shows completed/total parts and percentage
- **Bookmarks** — starred parts appear highlighted

### Progress & Bookmarks

- Click the **✓ checkmark** in the header or the **"Mark Part as Complete"** button to toggle completion
- Click the **⭐ star** to bookmark/unbookmark a part
- Progress is saved in **localStorage** (always works) and synced to the **backend SQLite database** (when running)

### Theme

The app supports **light** and **dark** themes. Your preference is saved in localStorage and persists across sessions.

---

## ⌨️ Keyboard Shortcuts

Press **`?`** anywhere to open the shortcuts modal.

| Key | Action |
|-----|--------|
| `?` | Toggle keyboard shortcuts modal |
| `/` or `Ctrl+K` | Focus search / enter reader |
| `v` | Toggle Video & Playground split mode |
| `b` | Toggle bookmark on current part |
| `c` | Toggle complete on current part |
| `Esc` | Go back to landing page |
| `Ctrl+Enter` | Run code in Playground |
| `Tab` | Insert 4 spaces (in Playground) |

---

## 🌍 Deployment

### Option 1: Vercel (Recommended)

The project is pre-configured for Vercel with `vercel.json`:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the project root
vercel
```

Both frontend and backend are deployed as a single Vercel project.

### Option 2: GitHub Pages (Static Export)

The frontend can be exported as a fully static site (no backend needed):

```bash
cd frontend

# Build static export (runs export-data.js first, then next build)
GITHUB_PAGES=true npm run build

# Deploy to GitHub Pages
npm run deploy
```

This uses [gh-pages](https://www.npmjs.com/package/gh-pages) to push the `out/` directory to the `gh-pages` branch.

> **Note:** On GitHub Pages, progress and bookmarks are stored in **localStorage only** (no backend).

---

## 📂 Course Modules

| # | Module | Parts | Topics |
|---|--------|-------|--------|
| M1 | **Foundations** | 2–6 | Python installation, basics, variables, memory model |
| M2 | **Core Language** | 7–12 | Strings, numbers, type casting, operators, I/O |
| M3 | **Advanced Python** | 13–18 | Conditionals, loops, pattern matching, comprehensions |
| M4 | **Systems & I/O** | 19–24 | File handling, OS operations, error handling |
| M5 | **Concurrency** | 25–28 | Threading, multiprocessing, async/await |
| M6 | **Web & APIs** | 29–32 | HTTP, REST APIs, Flask, web scraping |
| M7 | **Production & Tooling** | 33–35 | Testing, packaging, deployment, best practices |

---

## 🛠️ API Reference (Backend)

The backend (Express.js) serves the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/modules` | List all modules with part metadata |
| `GET` | `/api/notes/:part` | Get full notes, files, and metadata for a part |
| `GET` | `/api/progress` | Get list of completed part IDs |
| `POST` | `/api/progress/:part` | Toggle a part's completion status (`{ completed: true/false }`) |
| `GET` | `/api/bookmarks` | Get list of bookmarked part IDs |
| `POST` | `/api/bookmarks/:part` | Toggle a part's bookmark status (`{ pinned: true/false }`) |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Add your notes/content to the appropriate `Part-X/notes.md` file
4. Test locally with `npm run dev`
5. Commit: `git commit -m "Add: my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Adding a New Part

1. Create a new directory: `Part-XX/`
2. Add a `notes.md` file (start with `# Part XX — Topic Title`)
3. Optionally add `.py` code files
4. Update `MODULES_DATA` in both:
   - `backend/index.js`
   - `frontend/scripts/export-data.js`
5. Add the YouTube video ID in `frontend/lib/videos.ts`

---

## 📜 License

This project is an open educational resource. Content is from the [shyamiscoding](https://www.youtube.com/channel/UCT0629rHJIjJWmQj1JyejyA) YouTube series.

---

## 🔗 Links

- **YouTube Channel**: [shyamiscoding](https://www.youtube.com/channel/UCT0629rHJIjJWmQj1JyejyA)
- **YouTube Playlist**: [Python in Kannada](https://www.youtube.com/playlist?list=PLPzxNCCwS9ww_I4zEH6w9-HN4IKmt7UED)
- **Telegram**: [t.me/shyamiscoding](https://t.me/shyamiscoding)
- **GitHub**: [Shyamiscoding/onepercentdev](https://github.com/Shyamiscoding/onepercentdev)
- **Designer Portfolio**: [Pruthvi Raj B](https://pruthviraj-portfolio-nu.vercel.app/)

---

<p align="center">
  <em>Built with ❤️ for Kannada-speaking Python learners</em>
</p>
