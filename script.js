const API_URL = 'http://127.0.0.1:5000';

let token = localStorage.getItem('collabtask_token');
let currentUser = JSON.parse(localStorage.getItem('collabtask_user'));

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');
const authError = document.getElementById('auth-error');
const userGreeting = document.getElementById('user-greeting');
const logoutBtn = document.getElementById('logout-btn');

let isLogin = true;

// Initialize
function init() {
    if (token) {
        showDashboard();
    } else {
        showAuth();
    }
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.msg || 'API Error');
    }
    return data;
}

// UI State
function showAuth() {
    authView.classList.remove('hidden-pane');
    dashboardView.classList.add('hidden-pane');
    userGreeting.classList.add('hidden-pane');
    logoutBtn.classList.add('hidden-pane');
}

function showDashboard() {
    authView.classList.add('hidden-pane');
    dashboardView.classList.remove('hidden-pane');
    userGreeting.classList.remove('hidden-pane');
    logoutBtn.classList.remove('hidden-pane');
    
    if (currentUser) {
        userGreeting.textContent = `Hello, ${currentUser.username}`;
    }
    
    loadTasks();
    loadGroups();
}

// Auth Logic
toggleAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Sign in to your account' : 'Register a new account';
    authSubmitBtn.textContent = isLogin ? 'Sign in' : 'Register';
    toggleAuthBtn.textContent = isLogin ? 'register a new account' : 'sign in to an existing account';
    authError.classList.add('hidden-pane');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    authError.classList.add('hidden-pane');

    try {
        if (isLogin) {
            const data = await apiCall('/login', 'POST', { username, password });
            token = data.access_token;
            currentUser = { id: data.user_id, username: data.username };
            localStorage.setItem('collabtask_token', token);
            localStorage.setItem('collabtask_user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            await apiCall('/register', 'POST', { username, password });
            // Switch to login
            isLogin = true;
            authTitle.textContent = 'Sign in to your account';
            authSubmitBtn.textContent = 'Sign in';
            toggleAuthBtn.textContent = 'register a new account';
            authError.classList.remove('hidden-pane');
            authError.textContent = 'Registration successful. Please log in.';
            authError.classList.replace('text-red-600', 'text-green-600');
            document.getElementById('password').value = '';
        }
    } catch (err) {
        authError.classList.remove('hidden-pane');
        authError.classList.replace('text-green-600', 'text-red-600');
        authError.textContent = err.message;
    }
});

logoutBtn.addEventListener('click', () => {
    token = null;
    currentUser = null;
    localStorage.removeItem('collabtask_token');
    localStorage.removeItem('collabtask_user');
    showAuth();
});

// Task Logic
async function loadTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '<div class="p-6 text-center text-slate-500">Loading tasks...</div>';
    try {
        const tasks = await apiCall('/tasks');
        if(tasks.length === 0) {
            taskList.innerHTML = '<div class="p-6 text-center text-slate-500">No tasks found. Create one above!</div>';
            return;
        }
        taskList.innerHTML = tasks.map(task => `
            <div class="p-6 hover:bg-slate-50 transition-colors priority-${task.priority.toLowerCase()}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <h4 class="text-lg font-medium text-slate-900">${task.title}</h4>
                            ${!task.is_owner ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Shared by user ${task.owner_id}</span>` : ''}
                        </div>
                        <p class="mt-1 text-sm text-slate-600">${task.description || 'No description'}</p>
                        <div class="mt-2 text-xs text-slate-500 flex items-center space-x-4">
                            <span>Due: ${task.due_date || 'N/A'}</span>
                            <span class="font-medium text-slate-700">Priority: ${task.priority}</span>
                        </div>
                    </div>
                    ${task.image_url ? `<img src="${task.image_url}" alt="Task Image" class="w-16 h-16 object-cover rounded-md shadow-sm ml-4 border border-slate-200">` : ''}
                </div>
                ${task.is_owner ? `
                <div class="mt-4 flex space-x-3 border-t border-slate-100 pt-3">
                    <button onclick="shareTask(${task.id})" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Share</button>
                    <button onclick="deleteTask(${task.id})" class="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
                </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        taskList.innerHTML = `<div class="p-6 text-center text-red-500">${err.message}</div>`;
        if(err.message.includes('Token has expired')) logoutBtn.click();
    }
}

async function deleteTask(id) {
    if(confirm('Are you sure you want to delete this task?')) {
        try {
            await apiCall(`/tasks/${id}`, 'DELETE');
            loadTasks();
        } catch(err) {
            alert(err.message);
        }
    }
}

async function shareTask(id) {
    try {
        // Fetch users to show available IDs
        const users = await apiCall('/users');
        const userList = users.map(u => `User ID: ${u.id} - ${u.username}`).join('\n');
        
        const userId = prompt(`Enter User ID to share with:\n\nAvailable Users:\n${userList}`);
        if(userId) {
            await apiCall(`/tasks/${id}/share`, 'POST', { user_id: parseInt(userId) });
            alert('Task shared successfully!');
            loadTasks();
        }
    } catch(err) {
        alert(err.message);
    }
}

// Group Logic
async function loadGroups() {
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '<div class="p-6 text-center text-slate-500">Loading groups...</div>';
    try {
        const groups = await apiCall('/groups');
        if(groups.length === 0) {
            groupList.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No groups joined.</div>';
            return;
        }
        groupList.innerHTML = groups.map(group => `
            <div class="p-5 hover:bg-slate-50 transition-colors">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-md font-medium text-slate-900">${group.name}</h4>
                    <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">${group.members.length} members</span>
                </div>
                <div class="mt-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                    <span class="font-medium">Members:</span> ${group.members.map(m => m.username).join(', ')}
                </div>
                ${group.owner_id === currentUser.id ? `
                <button onclick="addToGroup(${group.id})" class="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-md text-xs font-medium transition-colors">+ Add Member</button>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        groupList.innerHTML = `<div class="p-6 text-center text-red-500">${err.message}</div>`;
    }
}

async function addToGroup(id) {
    try {
        const users = await apiCall('/users');
        const userList = users.map(u => `User ID: ${u.id} - ${u.username}`).join('\n');
        
        const userId = prompt(`Enter User ID to add to group:\n\nAvailable Users:\n${userList}`);
        if(userId) {
            await apiCall(`/groups/${id}/add_user`, 'POST', { user_id: parseInt(userId) });
            alert('User added to group!');
            loadGroups();
        }
    } catch(err) {
        alert(err.message);
    }
}

// Modals
const taskModal = document.getElementById('task-modal');
const showTaskBtn = document.getElementById('show-task-modal-btn');
const closeTaskBtn = document.getElementById('close-task-modal-btn');
const taskForm = document.getElementById('task-form');

showTaskBtn.addEventListener('click', () => taskModal.classList.remove('hidden-pane'));
closeTaskBtn.addEventListener('click', () => taskModal.classList.add('hidden-pane'));

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        due_date: document.getElementById('task-date').value,
        priority: document.getElementById('task-priority').value,
        image_url: document.getElementById('task-image').value
    };
    try {
        await apiCall('/tasks', 'POST', payload);
        taskModal.classList.add('hidden-pane');
        taskForm.reset();
        loadTasks();
    } catch(err) {
        alert(err.message);
    }
});

const groupModal = document.getElementById('group-modal');
const showGroupBtn = document.getElementById('show-group-modal-btn');
const closeGroupBtn = document.getElementById('close-group-modal-btn');
const groupForm = document.getElementById('group-form');

showGroupBtn.addEventListener('click', () => groupModal.classList.remove('hidden-pane'));
closeGroupBtn.addEventListener('click', () => groupModal.classList.add('hidden-pane'));

groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { name: document.getElementById('group-name').value };
    try {
        await apiCall('/groups', 'POST', payload);
        groupModal.classList.add('hidden-pane');
        groupForm.reset();
        loadGroups();
    } catch(err) {
        alert(err.message);
    }
});

// Run Init
init();
