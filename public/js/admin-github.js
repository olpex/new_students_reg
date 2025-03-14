document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const adminPanel = document.getElementById('admin-panel');
    const loginMessage = document.getElementById('login-message');
    const groupForm = document.getElementById('group-form');
    const groupList = document.getElementById('group-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Demo credentials for GitHub Pages
    const DEMO_USERNAME = 'admin';
    const DEMO_PASSWORD = 'admin123';

    // Check if already logged in
    const isLoggedIn = localStorage.getItem('demoAdminLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showAdminPanel();
    } else {
        showLoginForm();
    }

    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simple demo authentication
        if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
            localStorage.setItem('demoAdminLoggedIn', 'true');
            showAdminPanel();
            loadGroups();
        } else {
            showLoginMessage('Невірний логін або пароль', 'error');
        }
    });

    // Logout button
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('demoAdminLoggedIn');
        showLoginForm();
    });

    // Group form submission
    groupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const groupName = document.getElementById('group-name').value;
        
        if (!groupName) {
            showAdminMessage('Введіть назву групи', 'error');
            return;
        }
        
        // Get existing groups from localStorage
        let groups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
        
        // Check if group already exists
        if (groups.some(group => group.name === groupName)) {
            showAdminMessage('Група з такою назвою вже існує', 'error');
            return;
        }
        
        // Add new group
        groups.push({ name: groupName });
        localStorage.setItem('demoGroups', JSON.stringify(groups));
        
        // Reset form and reload groups
        document.getElementById('group-name').value = '';
        loadGroups();
        
        showAdminMessage('Група успішно додана', 'success');
    });

    // Load groups from localStorage
    function loadGroups() {
        const groups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
        
        if (groups.length === 0) {
            // Add some demo groups if none exist
            const demoGroups = [
                { name: "Група 101" },
                { name: "Група 102" },
                { name: "Група 103" },
                { name: "Група 201" },
                { name: "Група 202" }
            ];
            localStorage.setItem('demoGroups', JSON.stringify(demoGroups));
            renderGroups(demoGroups);
        } else {
            renderGroups(groups);
        }
    }

    // Render groups in the list
    function renderGroups(groups) {
        groupList.innerHTML = '';
        
        groups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'group-item';
            
            const name = document.createElement('span');
            name.textContent = group.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Видалити';
            deleteBtn.addEventListener('click', () => deleteGroup(group.name));
            
            item.appendChild(name);
            item.appendChild(deleteBtn);
            groupList.appendChild(item);
        });
    }

    // Delete a group
    function deleteGroup(groupName) {
        let groups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
        groups = groups.filter(group => group.name !== groupName);
        localStorage.setItem('demoGroups', JSON.stringify(groups));
        
        loadGroups();
        showAdminMessage('Група успішно видалена', 'success');
    }

    // Show login form
    function showLoginForm() {
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }

    // Show admin panel
    function showAdminPanel() {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
    }

    // Show login message
    function showLoginMessage(message, type) {
        loginMessage.textContent = message;
        loginMessage.className = 'message';
        loginMessage.classList.add(type);
        
        setTimeout(() => {
            loginMessage.textContent = '';
            loginMessage.className = 'message';
        }, 5000);
    }

    // Show admin message
    function showAdminMessage(message, type) {
        const adminMessage = document.getElementById('admin-message');
        adminMessage.textContent = message;
        adminMessage.className = 'message';
        adminMessage.classList.add(type);
        
        setTimeout(() => {
            adminMessage.textContent = '';
            adminMessage.className = 'message';
        }, 5000);
    }
});
