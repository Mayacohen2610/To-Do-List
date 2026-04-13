# ✅ TODO List (Full Stack)

A small full-stack TODO app built with React (Vite) and Express.

## 🚀 Tech Stack

- 🎨 Frontend: React + Vite + React Router
- ⚙️ Backend: Node.js + Express
- 💾 Data storage: local JSON file (`backend/data.json`)

## 📁 Project Structure

```text
TODO-LIST/
|- backend/
|  |- app.js
|  |- server.js
|  |- data.json
|  |- .env.example
|  `- package.json
|- frontend/
|  |- src/
|  |- .env.example
|  |- index.html
|  `- package.json
`- README.md
```

## ⚡ Quick Start

### 1) 📦 Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) 🔐 Configure environment variables

Create these files from examples:

- `backend/.env` from `backend/.env.example`
- `frontend/.env` from `frontend/.env.example`

Default values:

- Backend `PORT=5000`
- Frontend `VITE_API_BASE_URL=http://localhost:5000`

### 3) ▶️ Run the app

In one terminal (backend):

```bash
cd backend
npm run dev
```

In another terminal (frontend):

```bash
cd frontend
npm run dev
```

Then open the frontend URL shown by Vite (usually `http://localhost:5173`).

## 🧭 How to Use the Application

1. 🌐 Open the app in your browser.
2. 👤 Create a user (if prompted by the UI) and select that user.
3. ➕ Add a new todo task.
4. ✅ Mark tasks as completed when done.
5. ✏️ Edit or delete tasks as needed.
6. 📅 Use the week page to plan and review tasks by day.

## 🛠️ Available Scripts

### Backend ⚙️

- `npm run dev` - start API with nodemon
- `npm start` - start API with node

### Frontend 🎨

- `npm run dev` - start Vite dev server
- `npm run build` - build for production
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
