const API_URL = 'http://localhost:5000/api/users';

// Fetch users list when page loads
window.onload = fetchUsers;

// Register form submission listener
document.getElementById('user-form').addEventListener('submit', saveUser);

// 1. READ: Fetch all users from API and render in table
async function fetchUsers() {
  const tableBody = document.getElementById('user-table-body');
  
  try {
    const response = await fetch(API_URL);
    const users = await response.json();
    
    tableBody.innerHTML = ''; // Clear table
    
    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No registered users found.</td></tr>`;
      return;
    }
    
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHTML(user.fullName)}</strong></td>
        <td>${escapeHTML(user.email)}</td>
        <td>${escapeHTML(user.phone || '—')}</td>
        <td>${escapeHTML(user.role)}</td>
        <td>
          <button class="btn btn-primary" onclick="editUser('${user.id}', '${escapeHTML(user.fullName)}', '${escapeHTML(user.email)}', '${escapeHTML(user.phone)}', '${escapeHTML(user.role)}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: Could not connect to API server.</td></tr>`;
  }
}

// 2. CREATE & UPDATE: Submit form to save data
async function saveUser(e) {
  e.preventDefault();
  
  const id = document.getElementById('userId').value;
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const role = document.getElementById('role').value;
  
  const userData = { fullName, email, phone, role };
  
  try {
    let response;
    
    if (id === '') {
      // Create new user (POST)
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    } else {
      // Update existing user (PUT)
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    }
    
    if (response.ok) {
      resetForm();
      fetchUsers();
    } else {
      const data = await response.json();
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert('Failed to save user. Make sure the backend server is running!');
  }
}

// 3. Populate form fields to EDIT user details
function editUser(id, fullName, email, phone, role) {
  document.getElementById('userId').value = id;
  document.getElementById('fullName').value = fullName;
  document.getElementById('email').value = email;
  document.getElementById('phone').value = phone === '—' ? '' : phone;
  document.getElementById('role').value = role;
  
  document.getElementById('form-title').textContent = 'Edit User Details';
  document.getElementById('btn-cancel').style.display = 'inline-block';
}

// 4. DELETE: Call API to delete user
async function deleteUser(id) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      alert('Error: Could not delete user.');
    }
  }
}

// Reset form to default register state
function resetForm() {
  document.getElementById('userId').value = '';
  document.getElementById('user-form').reset();
  
  document.getElementById('form-title').textContent = 'Register User';
  document.getElementById('btn-cancel').style.display = 'none';
}

// Helper to escape HTML characters (prevents XSS injection)
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
