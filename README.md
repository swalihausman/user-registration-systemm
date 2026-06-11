# AuthFlow: Full-Stack User Registration & Management System (CRUD)

A premium CRUD application featuring a modern client registration panel and administration portal, paired with a Node.js Express REST API backend. Designed with rich responsive aesthetics, client & server-side validation, statistics calculation, and a soft-delete mechanism with an "Undo" capability.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

### 1. Run the Backend API
First, set up and launch the Node.js database server:

```bash
# Navigate to the backend directory
cd backend

# Install project dependencies
npm install

# Start the server (runs on http://localhost:5000)
npm start
```

*Note: For active development, you can use `npm run dev` if you have `nodemon` installed globally, or it will run the dev script.*

### 2. Launch the Frontend UI
The frontend is a pure Vanilla client-side web application and does not require building:
- Simply double-click/open the file `frontend/index.html` in your web browser (Chrome, Firefox, Edge, Safari).
- Alternatively, you can use any local server extension (like VS Code Live Server) to open it.

---

## 🛠️ Project Structure

```
user-registration-system/
├── backend/
│   ├── package.json         # Server-side metadata & scripts
│   ├── server.js            # Express API, REST routes, input validation
│   └── data/
│       └── users.json       # JSON flat-file database (automatically seeds on run)
├── frontend/
│   ├── index.html           # HTML5 structure, tabs, forms, modals
│   ├── style.css            # Responsive layouts, gradients, dark mode styles
│   └── app.js               # Client validation, fetch integrations, undo actions
└── README.md                # Quickstart and project highlights
```

---

## ⚙️ Features Implemented (CRUD Lifecycle)

- **Create User (Registration)**:
  - Advanced form with name, email, phone, role, and password fields.
  - Interactive validation with input outlines, checkmarks, and custom error labels.
  - Role-based selection (`Viewer`, `Editor`, `Admin`).

- **Read Users (Directory View)**:
  - Fetches users in real-time from the backend.
  - Computes global statistics widgets (Total Profiles, Active Users, Pending Accounts, Admin Count).
  - Search filter (query checks Name or Email) and role filter dropdown.

- **Update User (Edit Profile)**:
  - Opens edit modal pre-filled with the selected user's details.
  - Saves updates back to the backend.

- **Delete User (With Undo UX)**:
  - Deletes user with a safety buffer. Vanishes instantly in the UI with a Toast message prompting `Undo`.
  - If the user clicks `Undo` within 5 seconds, the action cancels.
  - Otherwise, the row is permanently pruned from the backend `users.json` file.

- **Server-Side Validation & Security Checks**:
  - Validates email formats and enforces unique emails.
  - Phone format validation.
  - Password minimum lengths.
  - Safe-rendering logic to prevent Cross-Site Scripting (XSS).

---

## 💡 Key Highlights for Interviews

If asked to explain your code during an interview, highlight these premium touches:
1. **Separation of Concerns**: Kept backend routing, helper operations (reading/writing json database), and frontend script behaviors clearly structured.
2. **Dual-Layer Validation**: Implemented validation in both `app.js` (immediate UI feedback) and `server.js` (ensuring data integrity regardless of input source).
3. **UX Focus**: The "Undo Deletion" feature matches modern dashboard standards, showing foresight in user experience design.
4. **No Native Binary Bloat**: Used standard filesystem read/write routines for a lightweight database (`users.json`), avoiding setup errors that databases like MongoDB or compiled SQLite binaries often cause on windows machines.
