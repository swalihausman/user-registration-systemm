const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'data', 'users.json');

// Middleware
app.use(cors());
app.use(express.json());

// Read users array from local file
function readUsers() {
  if (!fs.existsSync(DB_FILE)) {
    // Create folder and empty file if missing
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
    return [];
  }
  const fileData = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(fileData || '[]');
}

// Write users array to local file
function writeUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// 1. GET: Read all users
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// 2. POST: Create a new user
app.post('/api/users', (req, res) => {
  const { fullName, email, phone, role } = req.body;
  const users = readUsers();

  // Basic validation check
  if (!fullName || !email) {
    return res.status(400).json({ error: 'Name and Email are required!' });
  }

  // Create user object
  const newUser = {
    id: Date.now().toString(), // Simple unique ID using timestamp
    fullName,
    email,
    phone: phone || '',
    role: role || 'Viewer'
  };

  users.push(newUser);
  writeUsers(users);

  res.status(201).json(newUser);
});

// 3. PUT: Update an existing user
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, role } = req.body;
  const users = readUsers();

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found!' });
  }

  // Update fields
  users[userIndex].fullName = fullName || users[userIndex].fullName;
  users[userIndex].email = email || users[userIndex].email;
  users[userIndex].phone = phone !== undefined ? phone : users[userIndex].phone;
  users[userIndex].role = role || users[userIndex].role;

  writeUsers(users);
  res.json(users[userIndex]);
});

// 4. DELETE: Delete a user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  let users = readUsers();

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found!' });
  }

  // Remove the user
  const deletedUser = users.splice(userIndex, 1)[0];
  writeUsers(users);

  res.json({ message: 'User deleted successfully!', user: deletedUser });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
