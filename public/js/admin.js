document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLogin');
    const errorMessage = document.getElementById('error-message');
    const adminPanel = document.getElementById('admin-panel');
    const groupForm = document.getElementById('group-form');
    const groupsList = document.getElementById('group-list');

    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        document.getElementById('login-form').classList.add('hidden');
        adminPanel.classList.remove('hidden');
        loadGroups();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('hidden');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log('Login attempt started...'); // Debug log
        try {
            // Try to authenticate with the Node.js server first
            console.log('Making fetch request to:', '/api/auth/login');
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });

                console.log('Response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });

                const data = await response.json();
                console.log('Response data:', data);

                if (response.ok && data.success) {
                    console.log('Login successful, storing token...');
                    localStorage.setItem('adminToken', data.token);
                    document.getElementById('login-form').classList.add('hidden');
                    adminPanel.classList.remove('hidden');
                    await loadGroups();
                    return;
                }
            } catch (fetchError) {
                console.log('API fetch failed, trying fallback authentication:', fetchError);
            }
            
            // Fallback to hardcoded credentials for Live Server environment
            if (username === 'admin' && password === 'admin123') {
                console.log('Fallback authentication successful');
                localStorage.setItem('adminToken', 'demo-token');
                document.getElementById('login-form').classList.add('hidden');
                adminPanel.classList.remove('hidden');
                await loadGroups();
            } else {
                showError('Невірний логін або пароль');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Помилка входу');
        }
    });

    // Group form submission
    groupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const groupNumber = document.getElementById('group-name').value.trim();
        
        if (!groupNumber) {
            alert('Введіть номер групи');
            return;
        }
        
        try {
            // Try to add group using the Node.js server API first
            try {
                const response = await fetch('/api/groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({
                        name: groupNumber
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    groupForm.reset();
                    await loadGroups();
                    alert('Група успішно додана');
                    return;
                } else {
                    // If API returned an error like "group already exists", show it
                    alert(data.message || 'Помилка додавання групи');
                    return;
                }
            } catch (fetchError) {
                console.log('API fetch failed, using localStorage for adding group:', fetchError);
            }
            
            // Fallback to localStorage for Live Server environment
            const localGroups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
            
            // Check if group already exists
            if (localGroups.some(g => g.name === groupNumber)) {
                alert('Група з такою назвою вже існує');
                return;
            }
            
            // Add new group to localStorage
            localGroups.push({ name: groupNumber });
            localStorage.setItem('demoGroups', JSON.stringify(localGroups));
            
            groupForm.reset();
            await loadGroups();
            alert('Група успішно додана');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Помилка додавання групи');
        }
    });

    // Load groups
    async function loadGroups() {
        try {
            // Try to load groups from the Node.js server first
            try {
                const response = await fetch('/api/groups', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });

                if (response.ok) {
                    const groups = await response.json();
                    
                    groupsList.innerHTML = '';
                    if (groups.length === 0) {
                        groupsList.innerHTML = '<p>Немає доданих груп</p>';
                        return;
                    }

                    groups.forEach(group => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <div>
                                <strong>Група номер:</strong> ${group.name}
                            </div>
                            <button onclick="deleteGroup('${group.name}')" class="delete-btn">
                                Видалити
                            </button>
                        `;
                        groupsList.appendChild(li);
                    });
                    return;
                }
            } catch (fetchError) {
                console.log('API fetch failed, using localStorage for groups:', fetchError);
            }
            
            // Fallback to localStorage for Live Server environment
            const localGroups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
            
            groupsList.innerHTML = '';
            if (localGroups.length === 0) {
                groupsList.innerHTML = '<p>Немає доданих груп</p>';
                return;
            }

            localGroups.forEach(group => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <strong>Група номер:</strong> ${group.name}
                    </div>
                    <button class="delete-btn" data-group="${group.name}">
                        Видалити
                    </button>
                `;
                groupsList.appendChild(li);
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-btn[data-group]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const groupName = this.getAttribute('data-group');
                    if (confirm(`Ви впевнені, що хочете видалити групу ${groupName}?`)) {
                        const groups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
                        const updatedGroups = groups.filter(g => g.name !== groupName);
                        localStorage.setItem('demoGroups', JSON.stringify(updatedGroups));
                        loadGroups();
                    }
                });
            });
        } catch (error) {
            console.error('Error loading groups:', error);
            groupsList.innerHTML = '<p>Помилка завантаження груп</p>';
        }
    }

    // Delete group
    window.deleteGroup = async (groupName) => {
        if (confirm(`Ви впевнені, що хочете видалити групу ${groupName}?`)) {
            try {
                const response = await fetch(`/api/groups/${encodeURIComponent(groupName)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    }
                });

                if (response.ok) {
                    await loadGroups();
                    alert(`Групу ${groupName} успішно видалено`);
                } else {
                    const data = await response.json();
                    alert(data.message || 'Помилка видалення групи');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Помилка підключення до сервера');
            }
        }
    };

    // Logout function
    window.logout = () => {
        if (confirm('Ви впевнені, що хочете вийти?')) {
            localStorage.removeItem('adminToken');
            document.getElementById('login-form').classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    };

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});
