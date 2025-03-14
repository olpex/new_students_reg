document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registration-form');
    const formMessage = document.getElementById('formMessage');
    const groupSelect = document.getElementById('group');
    const phoneInput = document.getElementById('phone');

    // Set initial phone input value with +380 prefix
    phoneInput.value = '+380';
    
    // Load available groups when page loads
    loadGroups();

    // Form submission
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Collect form data
        const formData = {
            lastName: document.getElementById('lastName').value,
            firstName: document.getElementById('firstName').value,
            patronymic: document.getElementById('patronymic').value,
            birthDate: document.getElementById('birthDate').value,
            region: document.getElementById('region').value,
            city: document.getElementById('city').value,
            street: document.getElementById('street').value,
            house: document.getElementById('house').value,
            apartment: document.getElementById('apartment').value,
            idCode: document.getElementById('idCode').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            group: document.getElementById('group').value
        };

        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Дані успішно відправлено!', 'success');
                registrationForm.reset();
                // Reset phone input with +380 prefix after form reset
                phoneInput.value = '+380';
            } else {
                showMessage(data.message || 'Помилка при відправці даних', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Помилка підключення до сервера', 'error');
        }
    });

    // Load available groups
    async function loadGroups() {
        try {
            console.log('Loading groups...');
            const response = await fetch('/api/groups/public');
            console.log('Groups response:', response);
            const groups = await response.json();
            console.log('Available groups:', groups);

            groupSelect.innerHTML = '<option value="">Виберіть групу</option>';

            if (groups.length === 0) {
                showMessage('Немає доступних груп. Зверніться до адміністратора.', 'error');
                return;
            }

            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.name;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading groups:', error);
            showMessage('Помилка завантаження груп. Перевірте підключення до сервера.', 'error');
        }
    }

    // Form validation
    function validateForm() {
        // Check if group is selected
        const groupValue = document.getElementById('group').value;
        if (!groupValue) {
            showMessage('Будь ласка, виберіть групу', 'error');
            return false;
        }
        
        // Last name validation - only Cyrillic letters
        const lastNameInput = document.getElementById('lastName');
        if (!lastNameInput.value.match(/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/)) {
            showMessage('Прізвище повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли', 'error');
            return false;
        }
        
        // First name validation - only Cyrillic letters
        const firstNameInput = document.getElementById('firstName');
        if (!firstNameInput.value.match(/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/)) {
            showMessage('Ім\'я повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли', 'error');
            return false;
        }
        
        // Patronymic validation - only Cyrillic letters
        const patronymicInput = document.getElementById('patronymic');
        if (!patronymicInput.value.match(/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/)) {
            showMessage('По батькові повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли', 'error');
            return false;
        }
        
        // Region validation
        const regionValue = document.getElementById('region').value;
        if (!regionValue) {
            showMessage('Будь ласка, виберіть область', 'error');
            return false;
        }
        
        // City validation - only Cyrillic letters
        const cityInput = document.getElementById('city');
        if (!cityInput.value.match(/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/)) {
            showMessage('Місто/селище/село повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли', 'error');
            return false;
        }
        
        // Street validation - only Cyrillic letters
        const streetInput = document.getElementById('street');
        if (!streetInput.value.match(/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/)) {
            showMessage('Вулиця повинна містити тільки літери українського алфавіту, апостроф, дефіс та пробіли', 'error');
            return false;
        }
        
        // House validation - only numbers
        const houseInput = document.getElementById('house');
        if (!houseInput.value.match(/^[0-9]+$/)) {
            showMessage('Будинок повинен містити тільки цифри', 'error');
            return false;
        }
        
        // Apartment validation - only numbers (optional field)
        const apartmentInput = document.getElementById('apartment');
        if (apartmentInput.value && !apartmentInput.value.match(/^[0-9]+$/)) {
            showMessage('Квартира повинна містити тільки цифри', 'error');
            return false;
        }

        // ID code validation - exactly 10 digits
        const idCodeInput = document.getElementById('idCode');
        if (!idCodeInput.value.match(/^[0-9]{10}$/)) {
            showMessage('Ідентифікаційний код повинен містити 10 цифр', 'error');
            return false;
        }

        // Phone validation - +380 followed by 9 digits
        if (!phoneInput.value.match(/^\+380[0-9]{9}$/)) {
            showMessage('Телефон повинен бути у форматі +380XXXXXXXXX', 'error');
            return false;
        }
        
        // Email validation - no Cyrillic, must have @, and not from temporary email domains
        const emailInput = document.getElementById('email');
        const email = emailInput.value;
        
        // Check for Cyrillic characters
        if (/[А-ЯІЇЄҐа-яіїєґ]/.test(email)) {
            showMessage('Email не може містити літери українського алфавіту. Використовуйте тільки латиницю.', 'error');
            return false;
        }
        
        // Basic email format validation
        if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            showMessage('Введіть коректний email у форматі username@domain.com', 'error');
            return false;
        }
        
        // Check for temporary email domains
        const tempEmailDomains = [
            'temp-mail.org', 'tempmail.com', 'throwawaymail.com', 'mailinator.com', 
            'guerrillamail.com', '10minutemail.com', 'yopmail.com', 'sharklasers.com',
            'dispostable.com', 'mailnesia.com', 'tempail.com', 'fakeinbox.com',
            'getnada.com', 'mailcatch.com', 'tempr.email', 'tempinbox.com',
            'tempmailaddress.com', 'emailondeck.com', 'spamgourmet.com', 'trashmail.com'
        ];
        
        const emailDomain = email.split('@')[1];
        for (const domain of tempEmailDomains) {
            if (emailDomain.includes(domain)) {
                showMessage('Використання тимчасових email-адрес не дозволено. Будь ласка, використовуйте постійну email-адресу.', 'error');
                return false;
            }
        }

        return true;
    }

    // Phone input handling - ensure it always starts with +380
    phoneInput.addEventListener('input', (e) => {
        if (!e.target.value.startsWith('+380')) {
            e.target.value = '+380';
        }
        
        // Limit to +380 plus 9 more digits
        if (e.target.value.length > 13) {
            e.target.value = e.target.value.slice(0, 13);
        }
    });
    
    // Prevent deletion of +380 prefix
    phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (e.target.selectionStart <= 4) {
                e.preventDefault();
            }
        }
    });

    // Show message
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = 'form-message';
        formMessage.classList.add(type);

        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Hide message after 5 seconds if it's a success message
        if (type === 'success') {
            setTimeout(() => {
                formMessage.classList.remove(type);
                formMessage.textContent = '';
            }, 5000);
        }
    }
});
