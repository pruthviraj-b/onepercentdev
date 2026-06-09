# 🚀 1% Developer Academy — Python in Kannada

> **Learn Python from scratch to production-grade code — in Kannada**  
> A complete study companion for the YouTube series by **shyamiscoding**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-onepercentdev.vercel.app-black?style=for-the-badge&logo=vercel)](https://onepercentdev.vercel.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?style=for-the-badge&logo=github)](https://pruthviraj-b.github.io/onepercentdev)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

---

## 📖 About

**1% Developer Academy** is a free, premium-quality study platform built for students who are serious about becoming real developers. It accompanies the popular YouTube series **"Python in Kannada"** by [shyamiscoding](https://youtube.com/@shyamiscoding).

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
| 🎯 **77 Parts** | Complete Python course from beginner to 1% developer |
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
# Runs on http://localhost:3000
```

---

## 📁 Project Structure

```
onepercentdev/
├── frontend/                  # Next.js 15 app
│   ├── app/                   # App Router pages
│   ├── components/            # React components
│   │   ├── Landing.tsx        # Hero/landing page
│   │   ├── Reader.tsx         # Course reader
│   │   └── ...
│   ├── public/                # Static assets
│   └── next.config.ts         # Environment-aware config
│
├── backend/                   # Express API server
│   ├── index.js               # Entry point
│   └── academy.db             # SQLite database
│
├── vercel.json                # Vercel multi-service config
└── README.md
```

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

## 📚 Course Content

| Range | Topic |
|---|---|
| Parts 1–10 | Python basics, variables, data types |
| Parts 11–20 | Loops, functions, modules |
| Parts 21–35 | OOP, file handling, exceptions |
| Parts 36–50 | Advanced Python, decorators, generators |
| Parts 51–65 | Data structures, algorithms |
| Parts 66–77 | Projects, production patterns |

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
