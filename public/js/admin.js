document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLogin');
    const errorMessage = document.getElementById('error-message');
    const adminPanel = document.getElementById('admin-panel');
    const groupForm = document.getElementById('group-form');
    const groupsList = document.getElementById('groupsList');

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
            console.log('Making fetch request to:', '/api/auth/login');
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
            } else {
                console.error('Login failed:', data.message);
                showError(data.message || 'Помилка входу');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Помилка підключення до сервера. Перевірте чи сервер запущено.');
        }
    });

    // Handle group form submission
    groupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const groupNumber = document.getElementById('groupNumber').value.trim();
        
        if (!groupNumber) {
            alert('Будь ласка, введіть номер групи');
            return;
        }

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
            } else {
                alert(data.message || 'Помилка додавання групи');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Помилка додавання групи');
        }
    });

    // Load groups
    async function loadGroups() {
        try {
            const response = await fetch('/api/groups', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

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
