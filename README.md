# 🚀 1% Developer Academy

> **Master technology from scratch to production-grade — in Kannada**  
> A complete study companion for YouTube courses by **shyamiscoding**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-onepercentdev.vercel.app-black?style=for-the-badge&logo=vercel)](https://onepercentdev.vercel.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?style=for-the-badge&logo=github)](https://pruthviraj-b.github.io/onepercentdev)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

---

## 📖 About

**1% Developer Academy** is a free, premium-quality study platform built for students who are serious about becoming real developers. It accompanies YouTube courses by [shyamiscoding](https://youtube.com/@shyamiscoding).

### Courses Available
| Course | Parts | Description |
|--------|-------|-------------|
| 🐍 **Python in Kannada** | 40 | Complete Python from beginner to 1% developer |
| ☁️ **Cloud Computing** | 8 | Cloud concepts, architectures, and deployments |

Every lesson includes:
- 📝 Deep conceptual notes
- 💻 Copyable, production-ready code blocks
- 🎬 Embedded YouTube video for each part
- 🧠 Split-screen reader + video mode
- 🔒 Progress tracking (localStorage)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Multi-Course** | Separate pathways for Python and Cloud Computing |
| 🌙 **Dark Terminal UI** | Retro-modern design with glassmorphism effects |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| 🔍 **Search** | Instantly search through all parts and notes |
| ⌨️ **Keyboard Shortcuts** | Press `?` to view all shortcuts |
| 📊 **Progress Bar** | Track your learning progress visually |
| 🔗 **Deep Links** | Share links to specific parts directly |
| 🧩 **Split View** | Side-by-side video + notes reading mode |

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** — React framework with App Router
- **TypeScript** — Type-safe development
- **Vanilla CSS** — Custom retro terminal design system
- **react-markdown** — Markdown rendering with syntax highlighting

### Backend
- **Node.js + Express** — Lightweight REST API
- **sql.js** — In-memory SQLite for progress/notes data
- **CORS** enabled for cross-origin requests

### Deployment
- **Vercel** — Primary deployment (frontend + backend)
- **GitHub Pages** — Static export mirror

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/pruthviraj-b/onepercentdev.git
cd onepercentdev
```

### 2. Start the Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3005
```

---

## 📁 Project Structure

```
onepercentdev/
├── courses.config.json        ← SINGLE SOURCE OF TRUTH for all course data
│
├── content/                   ← All course content, cleanly separated
│   ├── python/                ← Python in Kannada course
│   │   ├── Part-1/notes.md
│   │   ├── Part-2/notes.md
│   │   └── ...Part-38.1/
│   └── cloud/                 ← Cloud Computing course
│       ├── Part-1/notes.md
│       ├── Part-2/notes.md
│       └── ...Part-8/
│
├── frontend/                  ← Next.js 15 app
│   ├── app/                   ← App Router pages
│   ├── components/            ← React components
│   │   ├── Landing.tsx        ← Hero/landing page
│   │   ├── Reader.tsx         ← Course reader
│   │   └── ...
│   ├── lib/                   ← API client & utilities
│   ├── scripts/               ← Build-time data export
│   │   └── export-data.js     ← Reads courses.config.json → static JSON
│   ├── public/api/            ← Generated static JSON data
│   └── next.config.ts         ← Environment-aware config
│
├── backend/                   ← Express API server
│   ├── index.js               ← Entry point (reads courses.config.json)
│   └── academy.db             ← SQLite database
│
├── vercel.json                ← Vercel multi-service config
└── README.md
```

---

## 📝 Admin Guide — How to Update Content

All course data is managed through **one file**: `courses.config.json`

### Add a YouTube video to a part
Edit the `"videos"` section of the course:
```json
"videos": {
  "1": "VIDEO_ID_HERE",
  "2": "ANOTHER_VIDEO_ID"
}
```

### Add a new part
1. Create the folder: `content/python/Part-39/notes.md` (or `content/cloud/Part-X/`)
2. Add the part number to the correct module in `courses.config.json`:
   ```json
   { "id": 8, "title": "File Handling & Advanced Data", "parts": [36, 37.1, 37.2, 38, 38.1, 39] }
   ```
3. Add importance: `"39": "high"` in the `importance` section
4. Run `node frontend/scripts/export-data.js` to regenerate static files

### Change playlist/channel links
Edit the course's link fields:
```json
"playlistUrl": "https://youtube.com/playlist?list=...",
"channelUrl": "https://youtube.com/channel/...",
"telegramUrl": "https://t.me/..."
```

### Add a new course
Add a new key to `courses.config.json` with all required fields. Create a `content/<course-id>/` directory with Part folders.

---

## 🌍 Deployment

### Vercel (Recommended)
The project uses `vercel.json` with `experimentalServices` to deploy both frontend and backend:

```json
{
  "experimentalServices": {
    "frontend": { "root": "frontend", "routePrefix": "/", "framework": "nextjs" },
    "backend": { "framework": "node", "mount": "backend", "entrypoint": "backend/index.js" }
  }
}
```

### GitHub Pages (Static Export)
Set `GITHUB_PAGES=true` environment variable during build to enable static export with correct `basePath`.

---

## 👨‍💻 Credits

| Role | Person |
|---|---|
| **Instructor / Content** | [shyamiscoding](https://youtube.com/@shyamiscoding) |
| **Designed & Built By** | [Pruthvi Raj B](https://pruthviraj-portfolio-nu.vercel.app/) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ for Kannada developers  
**[🌐 Visit the Academy](https://onepercentdev.vercel.app)**

</div>
