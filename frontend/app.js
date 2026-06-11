// ==========================================================================
// AuthFlow Client-Side Application Logic (CRUD)
// ==========================================================================

const API_BASE_URL = 'http://localhost:5000/api/users';
let allUsers = [];
let pendingDeletions = {}; // Track user deletions scheduled to execute

// Page State Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Try connecting to the backend to check status
  checkServerConnection();

  // Setup form validation listeners
  setupFormValidation();

  // Load directory users
  fetchUsers();
});

// Check if backend API is online
async function checkServerConnection() {
  const statusIndicator = document.querySelector('.status-indicator');
  const statusText = document.querySelector('.status-text');

  try {
    const response = await fetch(API_BASE_URL);
    if (response.ok || response.status === 404 || response.status === 200) {
      statusIndicator.classList.add('online');
      statusText.textContent = 'Server Connected';
    }
  } catch (error) {
    statusIndicator.classList.remove('online');
    statusText.textContent = 'Server Offline (Port 5000)';
    showToast('Cannot connect to the registration server. Please ensure it is running.', 'danger', 6000);
  }
}

// ==========================================================================
// Tab Navigation Routing
// ==========================================================================
function switchTab(tabName) {
  // Remove active classes
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  // Add active classes
  if (tabName === 'register') {
    document.getElementById('tab-btn-register').classList.add('active');
    document.getElementById('tab-content-register').classList.add('active');
  } else if (tabName === 'directory') {
    document.getElementById('tab-btn-directory').classList.add('active');
    document.getElementById('tab-content-directory').classList.add('active');
    fetchUsers(); // Refresh database directory
  }
}

// Helper to show/hide passwords
function togglePasswordVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-regular fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-regular fa-eye';
  }
}

// ==========================================================================
// Client-Side Validation
// ==========================================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

function setupFormValidation() {
  const form = document.getElementById('registration-form');
  const fields = ['fullName', 'email', 'phone', 'password', 'agreement'];

  fields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;

    // Listen on input/change to run validation on-the-fly
    const eventName = input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventName, () => validateField(input));
  });

  form.addEventListener('submit', handleRegistrationSubmit);
}

function validateField(input) {
  const val = input.value.trim();
  const errorSpan = document.getElementById(`err-${input.name || input.id}`);
  const wrapper = input.closest('.input-wrapper') || input.parentElement;
  
  let isValid = true;

  if (input.id === 'fullName') {
    isValid = val.length >= 2;
  } else if (input.id === 'email') {
    isValid = EMAIL_REGEX.test(val);
  } else if (input.id === 'phone') {
    // Phone is optional, but if entered it must match the regex
    isValid = val === '' || PHONE_REGEX.test(val);
  } else if (input.id === 'password') {
    isValid = val.length >= 6;
  } else if (input.id === 'agreement') {
    isValid = input.checked;
  }

  // Toggle CSS styling and helper labels
  if (isValid) {
    wrapper.classList.remove('has-error');
    wrapper.classList.add('has-success');
    if (errorSpan) errorSpan.style.display = 'none';
  } else {
    wrapper.classList.remove('has-success');
    wrapper.classList.add('has-error');
    if (errorSpan) errorSpan.style.display = 'block';
  }

  return isValid;
}

function isFormValid() {
  const fields = ['fullName', 'email', 'phone', 'password', 'agreement'];
  let allValid = true;

  fields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (input) {
      const fieldValid = validateField(input);
      if (!fieldValid) allValid = false;
    }
  });

  return allValid;
}

// ==========================================================================
// CRUD: CREATE (Register User)
// ==========================================================================
async function handleRegistrationSubmit(e) {
  e.preventDefault();

  if (!isFormValid()) {
    showToast('Please fix the errors in the registration form.', 'danger');
    return;
  }

  const submitBtn = document.getElementById('btn-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');

  // Activate spinner loader state
  submitBtn.disabled = true;
  btnText.style.opacity = '0.5';
  spinner.classList.remove('hidden');

  const userData = {
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    role: document.getElementById('role').value,
    password: document.getElementById('password').value
  };

  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error during registration.');
    }

    showToast(`Successfully registered ${data.fullName}!`, 'success');
    
    // Reset form styling & inputs
    document.getElementById('registration-form').reset();
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
      wrapper.classList.remove('has-success', 'has-error');
    });
    
    // Redirect to database view
    setTimeout(() => {
      switchTab('directory');
    }, 800);

  } catch (error) {
    showToast(error.message, 'danger');
  } finally {
    // Reset loader state
    submitBtn.disabled = false;
    btnText.style.opacity = '1';
    spinner.classList.add('hidden');
  }
}

// ==========================================================================
// CRUD: READ (Fetch & Render Users)
// ==========================================================================
async function fetchUsers() {
  const tableBody = document.getElementById('users-table-body');
  
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Could not fetch user directory.');
    
    const users = await response.json();
    
    // Save to global storage
    allUsers = users;
    
    // Render list
    renderUsersTable(allUsers);
    
    // Calculate and render stats overview cards
    calculateStats(allUsers);

  } catch (error) {
    console.error('Error fetching users:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-loading text-danger">
          <i class="fa-solid fa-triangle-exclamation"></i> Error connecting to database API.
        </td>
      </tr>
    `;
  }
}

function renderUsersTable(usersList) {
  const tableBody = document.getElementById('users-table-body');
  const emptyState = document.getElementById('empty-state');
  const badgeCount = document.getElementById('badge-count');

  badgeCount.textContent = usersList.length;

  // Clear current lines
  tableBody.innerHTML = '';

  // Filter out users that are currently undergoing a "soft delete" (pending undo deletion)
  const activeDisplayList = usersList.filter(user => !pendingDeletions[user.id]);

  if (activeDisplayList.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  activeDisplayList.forEach(user => {
    const row = document.createElement('tr');
    row.id = `user-row-${user.id}`;
    
    // Format creation timestamp
    const dateFormatted = new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Extract initials for avatar placeholder
    const initials = user.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    row.innerHTML = `
      <td>
        <div class="user-profile-cell">
          <div class="user-avatar-placeholder">${initials}</div>
          <div>
            <div class="user-name">${escapeHTML(user.fullName)}</div>
            <div class="user-email">${escapeHTML(user.email)}</div>
          </div>
        </div>
      </td>
      <td>${user.phone ? escapeHTML(user.phone) : '<span class="color-text-muted">—</span>'}</td>
      <td>
        <span class="badge badge-${user.role.toLowerCase()}">${user.role}</span>
      </td>
      <td>
        <span class="badge badge-status badge-${user.status.toLowerCase()}">${user.status}</span>
      </td>
      <td>${dateFormatted}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-edit" onclick="openEditModal('${user.id}')" title="Edit Profile">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="triggerDeleteUser('${user.id}', '${escapeHTML(user.fullName)}')" title="Delete Profile">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Calculate Admin statistics widgets
function calculateStats(usersList) {
  const activeDisplayList = usersList.filter(user => !pendingDeletions[user.id]);

  const total = activeDisplayList.length;
  const active = activeDisplayList.filter(u => u.status === 'Active').length;
  const pending = activeDisplayList.filter(u => u.status === 'Pending').length;
  const admins = activeDisplayList.filter(u => u.role === 'Admin').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-active').textContent = active;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-admin').textContent = admins;
}

// Filtering & Searching logic
function filterUsers() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
  const selectedRole = document.getElementById('filter-role').value;

  const filtered = allUsers.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchQuery) || 
                          user.email.toLowerCase().includes(searchQuery);
    
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  renderUsersTable(filtered);
}

// ==========================================================================
// CRUD: UPDATE (Edit User Profile Details)
// ==========================================================================
function openEditModal(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  // Prefill current values
  document.getElementById('edit-user-id').value = user.id;
  document.getElementById('edit-fullName').value = user.fullName;
  document.getElementById('edit-phone').value = user.phone;
  document.getElementById('edit-role').value = user.role;
  document.getElementById('edit-status').value = user.status;

  // Open the modal
  document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
  document.getElementById('edit-form').reset();
}

// Edit Form submit listener
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('edit-user-id').value;
  const saveBtn = document.getElementById('btn-edit-save');
  const btnText = saveBtn.querySelector('.btn-text');
  const spinner = saveBtn.querySelector('.spinner');

  // Loader state
  saveBtn.disabled = true;
  btnText.style.opacity = '0.5';
  spinner.classList.remove('hidden');

  const updatedData = {
    fullName: document.getElementById('edit-fullName').value.trim(),
    phone: document.getElementById('edit-phone').value.trim(),
    role: document.getElementById('edit-role').value,
    status: document.getElementById('edit-status').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Could not update user details.');
    }

    showToast(`Updated profile for ${data.fullName}`, 'success');
    closeEditModal();
    
    // Refresh list
    fetchUsers();

  } catch (error) {
    showToast(error.message, 'danger');
  } finally {
    saveBtn.disabled = false;
    btnText.style.opacity = '1';
    spinner.classList.add('hidden');
  }
});

// ==========================================================================
// CRUD: DELETE (With Undo Deletion Toaster)
// ==========================================================================
function triggerDeleteUser(userId, fullName) {
  // Soft delete phase: hide from view and queue deletion
  pendingDeletions[userId] = true;
  
  // Rerender table so it immediately vanishes from sight
  renderUsersTable(allUsers);
  calculateStats(allUsers);

  // Setup a timer to commit the actual API call after 5 seconds
  const timeoutId = setTimeout(async () => {
    if (pendingDeletions[userId]) {
      // Deletion confirmed, run actual database DELETE request
      try {
        const response = await fetch(`${API_BASE_URL}/${userId}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Deletion failed.');
        
        // Remove permanently from local variable
        allUsers = allUsers.filter(u => u.id !== userId);
        delete pendingDeletions[userId];
        
        // Ensure stats and lists are up to date
        renderUsersTable(allUsers);
        calculateStats(allUsers);

      } catch (error) {
        showToast(`Failed to delete ${fullName} from server.`, 'danger');
        // Rollback on server error
        delete pendingDeletions[userId];
        renderUsersTable(allUsers);
        calculateStats(allUsers);
      }
    }
  }, 5000);

  // Show Toast notification with an "Undo" action button
  showToast(
    `Profile for ${fullName} deleted.`, 
    'info', 
    5000, 
    () => {
      // UNDO Action Callback
      clearTimeout(timeoutId);
      delete pendingDeletions[userId];
      
      // Restore row to table list
      renderUsersTable(allUsers);
      calculateStats(allUsers);
      showToast(`Restored profile for ${fullName}.`, 'success');
    }, 
    'Undo'
  );
}

// ==========================================================================
// Utility functions: Toasts, HTML Escape
// ==========================================================================
function showToast(message, type = 'info', duration = 4000, actionCallback = null, actionLabel = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let actionButtonHTML = '';
  if (actionCallback && actionLabel) {
    actionButtonHTML = `<button class="toast-undo-btn">${actionLabel}</button>`;
  }

  let iconClass = 'fa-solid fa-circle-info';
  if (type === 'success') iconClass = 'fa-solid fa-circle-check';
  if (type === 'danger') iconClass = 'fa-solid fa-triangle-exclamation';

  toast.innerHTML = `
    <div class="toast-content">
      <i class="${iconClass} toast-icon"></i>
      <div class="toast-body">${message}</div>
    </div>
    <div style="display:flex; align-items:center; gap:10px;">
      ${actionButtonHTML}
      <button class="toast-close-btn">&times;</button>
    </div>
  `;

  container.appendChild(toast);

  // Setup undo button action
  if (actionCallback) {
    const actionBtn = toast.querySelector('.toast-undo-btn');
    actionBtn.addEventListener('click', () => {
      actionCallback();
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    });
  }

  // Close button trigger
  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

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
