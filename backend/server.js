const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'data', 'users.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read from JSON DB
function readUsersDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Ensure folder exists
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading database file:', error);
    return [];
  }
}

// Helper function to write to JSON DB
function writeUsersDB(users) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
}

// Validation Regex patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

// --- REST API ENDPOINTS ---

// 1. GET ALL USERS (Read)
app.get('/api/users', (req, res) => {
  console.log('GET /api/users requested');
  const users = readUsersDB();
  // Return users sorted by creation date (newest first)
  const sortedUsers = users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sortedUsers);
});

// 2. GET SINGLE USER (Read)
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/users/${id} requested`);
  const users = readUsersDB();
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// 3. CREATE USER / REGISTER (Create)
app.post('/api/users', (req, res) => {
  console.log('POST /api/users registration attempt:', req.body);
  const { fullName, email, phone, role, password } = req.body;
  const users = readUsersDB();

  // Basic validation checks
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full Name is required' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check for unique email
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Create new user object (do not save password in the clear for standard API response,
  // in production we would hash it using bcrypt)
  const newUser = {
    id: uuidv4(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    role: role || 'Viewer',
    status: 'Active',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  const success = writeUsersDB(users);

  if (!success) {
    return res.status(500).json({ error: 'Database error. Could not register user.' });
  }

  res.status(201).json(newUser);
});

// 4. UPDATE USER (Update)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log(`PUT /api/users/${id} update attempt:`, req.body);
  const { fullName, phone, role, status } = req.body;
  const users = readUsersDB();

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[userIndex];

  // Validation
  if (fullName && !fullName.trim()) {
    return res.status(400).json({ error: 'Full Name cannot be empty' });
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  const validRoles = ['Admin', 'Editor', 'Viewer'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  const validStatuses = ['Active', 'Pending', 'Suspended'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status selection' });
  }

  // Update details
  if (fullName) user.fullName = fullName.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (role) user.role = role;
  if (status) user.status = status;

  users[userIndex] = user;
  const success = writeUsersDB(users);

  if (!success) {
    return res.status(500).json({ error: 'Database error. Could not update user.' });
  }

  res.json(user);
});

// 5. DELETE USER (Delete)
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/users/${id} requested`);
  const users = readUsersDB();

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Remove user
  const deletedUser = users.splice(userIndex, 1)[0];
  const success = writeUsersDB(users);

  if (!success) {
    return res.status(500).json({ error: 'Database error. Could not delete user.' });
  }

  res.json({ message: 'User deleted successfully', user: deletedUser });
});

// Start the server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`REST API endpoints active at /api/users`);
  console.log(`Database seeded at: ${DB_FILE}`);
  console.log(`=========================================`);
});
