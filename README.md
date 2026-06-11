# Simple User Registration & CRUD System

A clean, full-stack CRUD application designed for coding interviews. Built with a direct Express backend (persisting data in a JSON file) and a single-page HTML/CSS/JS frontend.

---

## 🚀 Quick Start

### 1. Run the Backend API
First, start the backend database API server:

```bash
# Navigate to the backend folder
cd backend

# Install Express & CORS
npm install

# Start the server (runs on http://localhost:5000)
npm start
```

### 2. Run the Frontend UI
The UI is built with standard web files. 
- Open your file explorer and double-click the file: **`frontend/index.html`**

---

## 📂 Project Structure

```
user-registration-system/
├── backend/
│   ├── data/
│   │   └── users.json         # Simple JSON flat-file database
│   ├── package.json           # Backend dependencies (express, cors)
│   └── server.js              # REST endpoints (GET, POST, PUT, DELETE)
│
└── frontend/
    ├── index.html             # Clean single-view HTML layout
    ├── style.css              # Clean, modern stylesheet
    └── app.js                 # Simple fetch API CRUD functions
```

---

## ⚙️ REST API Endpoints (Exposed on Port 5000)

- **`GET /api/users`** — Read and return all users.
- **`POST /api/users`** — Create a new user (generates ID using `Date.now()`).
- **`PUT /api/users/:id`** — Update details of the selected user.
- **`DELETE /api/users/:id`** — Delete the user from the database.
