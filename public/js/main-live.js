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
            // Try to submit to Google Sheets
            try {
                const googleScriptData = {
                    sheetId: '1T-z_wf1Vdo_oYyII5ywUR1mM0P69nvRIz8Ry98TupeE',
                    sheetName: formData.group, // Use the group name as the sheet name
                    lastName: formData.lastName,
                    firstName: formData.firstName,
                    patronymic: formData.patronymic,
                    dob: formData.birthDate,
                    region: formData.region,
                    city: formData.city,
                    street: formData.street,
                    house: formData.house,
                    apartment: formData.apartment,
                    idCode: formData.idCode,
                    phone: formData.phone,
                    email: formData.email,
                    useUkrainianHeaders: true // Flag to ensure Ukrainian headers are used
                };
                
                const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbzK6m_OB7aIoMI14VfMtxCdqGChP0oW4-Krb2biqI6D-4g2YdiV7U4yXf-j1pxdgtHG9Q/exec';
                
                // Use fetch API with POST request
                const response = await fetch(googleScriptUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(googleScriptData),
                    mode: 'no-cors' // This prevents CORS issues
                });
                
                // Since we can't read the response with no-cors, we'll just assume success
                showMessage(`Дані успішно відправлено!`, 'success');
                registrationForm.reset();
                phoneInput.value = '+380';
                return;
            } catch (googleError) {
                console.error('Error sending to Google Sheets:', googleError);
            }
            
            // Try to submit to the Node.js server first
            try {
                const response = await fetch('/api/students', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    const data = await response.json();
                    showMessage('Дані успішно відправлено!', 'success');
                    registrationForm.reset();
                    phoneInput.value = '+380';
                    return;
                }
            } catch (fetchError) {
                console.log('API fetch failed, using localStorage for registration:', fetchError);
            }
            
            // Fallback for Live Server: store in localStorage
            const students = JSON.parse(localStorage.getItem('demoStudents') || '[]');
            students.push(formData);
            localStorage.setItem('demoStudents', JSON.stringify(students));
            
            showMessage('Дані успішно відправлено! (Демо-режим)', 'success');
            registrationForm.reset();
            phoneInput.value = '+380';
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('Помилка відправки даних. Спробуйте ще раз.', 'error');
        }
    });

    // Load available groups
    async function loadGroups() {
        try {
            // Try to load groups from the Node.js server first
            try {
                console.log('Loading groups from API...');
                const response = await fetch('/api/groups/public');
                
                if (response.ok) {
                    const groups = await response.json();
                    console.log('Available groups from API:', groups);
                    
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
                    return;
                }
            } catch (fetchError) {
                console.log('API fetch failed, using localStorage for groups:', fetchError);
            }
            
            // Fallback for Live Server: load from localStorage
            console.log('Loading groups from localStorage...');
            const localGroups = JSON.parse(localStorage.getItem('demoGroups') || '[]');
            console.log('Available groups from localStorage:', localGroups);
            
            groupSelect.innerHTML = '<option value="">Виберіть групу</option>';
            
            if (localGroups.length === 0) {
                showMessage('Немає доступних груп. Зверніться до адміністратора.', 'error');
                return;
            }
            
            localGroups.forEach(group => {
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
        let isValid = true;

        // Validate Last Name - only Cyrillic letters
        const lastName = document.getElementById('lastName').value;
        if (!lastName) {
            showFieldError('lastName', 'Введіть прізвище');
            isValid = false;
        } else if (!/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/.test(lastName)) {
            showFieldError('lastName', 'Прізвище повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли');
            isValid = false;
        } else {
            clearFieldError('lastName');
        }

        // Validate First Name - only Cyrillic letters
        const firstName = document.getElementById('firstName').value;
        if (!firstName) {
            showFieldError('firstName', 'Введіть ім\'я');
            isValid = false;
        } else if (!/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/.test(firstName)) {
            showFieldError('firstName', 'Ім\'я повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли');
            isValid = false;
        } else {
            clearFieldError('firstName');
        }

        // Validate Patronymic - only Cyrillic letters
        const patronymic = document.getElementById('patronymic').value;
        if (!patronymic) {
            showFieldError('patronymic', 'Введіть по батькові');
            isValid = false;
        } else if (!/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/.test(patronymic)) {
            showFieldError('patronymic', 'По батькові повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли');
            isValid = false;
        } else {
            clearFieldError('patronymic');
        }

        // Validate Birth Date
        const birthDate = document.getElementById('birthDate').value;
        if (!birthDate) {
            showFieldError('birthDate', 'Введіть дату народження');
            isValid = false;
        } else {
            // Check if the person is at least 16 years old
            const today = new Date();
            const birthDateObj = new Date(birthDate);
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }
            
            if (age < 16) {
                showFieldError('birthDate', 'Вам має бути не менше 16 років');
                isValid = false;
            } else {
                clearFieldError('birthDate');
            }
        }

        // Validate Region
        const region = document.getElementById('region').value;
        if (!region) {
            showFieldError('region', 'Виберіть область');
            isValid = false;
        } else {
            clearFieldError('region');
        }

        // Validate City - only Cyrillic letters
        const city = document.getElementById('city').value;
        if (!city) {
            showFieldError('city', 'Введіть місто');
            isValid = false;
        } else if (!/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/.test(city)) {
            showFieldError('city', 'Місто/село повинно містити тільки літери українського алфавіту, апостроф, дефіс та пробіли');
            isValid = false;
        } else {
            clearFieldError('city');
        }

        // Validate Street - only Cyrillic letters
        const street = document.getElementById('street').value;
        if (!street) {
            showFieldError('street', 'Введіть вулицю');
            isValid = false;
        } else if (!/^[А-ЯІЇЄҐа-яіїєґ\s'-]+$/.test(street)) {
            showFieldError('street', 'Вулиця повинна містити тільки літери українського алфавіту, апостроф, дефіс та пробіли');
            isValid = false;
        } else {
            clearFieldError('street');
        }

        // Validate House - only numbers and letters
        const house = document.getElementById('house').value;
        if (!house) {
            showFieldError('house', 'Введіть номер будинку');
            isValid = false;
        } else if (!/^[0-9А-ЯІЇЄҐа-яіїєґA-Za-z]+$/.test(house)) {
            showFieldError('house', 'Номер будинку повинен містити тільки цифри та літери');
            isValid = false;
        } else {
            clearFieldError('house');
        }

        // Validate Apartment - only numbers (optional field)
        const apartment = document.getElementById('apartment').value;
        if (apartment && !/^[0-9]+$/.test(apartment)) {
            showFieldError('apartment', 'Номер квартири повинен містити тільки цифри');
            isValid = false;
        } else {
            clearFieldError('apartment');
        }

        // Validate ID Code - exactly 10 digits
        const idCode = document.getElementById('idCode').value;
        if (!idCode) {
            showFieldError('idCode', 'Введіть ідентифікаційний код');
            isValid = false;
        } else if (!/^\d{10}$/.test(idCode)) {
            showFieldError('idCode', 'Ідентифікаційний код повинен містити рівно 10 цифр');
            isValid = false;
        } else {
            clearFieldError('idCode');
        }

        // Validate Phone - exactly +380 followed by 9 digits
        const phone = document.getElementById('phone').value;
        if (!phone) {
            showFieldError('phone', 'Введіть номер телефону');
            isValid = false;
        } else if (!/^\+380\d{9}$/.test(phone)) {
            showFieldError('phone', 'Номер телефону повинен бути у форматі +380 та містити 9 цифр після коду');
            isValid = false;
        } else {
            clearFieldError('phone');
        }

        // Validate Email - Latin letters only with @ and domain
        const email = document.getElementById('email').value;
        if (!email) {
            showFieldError('email', 'Введіть email');
            isValid = false;
        } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
            showFieldError('email', 'Email повинен бути написаний латиницею та містити символ @ і правильний домен');
            isValid = false;
        } else {
            clearFieldError('email');
        }

        // Validate Group
        const group = document.getElementById('group').value;
        if (!group) {
            showFieldError('group', 'Виберіть групу');
            isValid = false;
        } else {
            clearFieldError('group');
        }

        return isValid;
    }

    // Phone input handling - ensure it always starts with +380
    phoneInput.addEventListener('input', (e) => {
        if (!e.target.value.startsWith('+380')) {
            e.target.value = '+380';
        }
    });

    // Show field error
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('error');
        
        // Check if error message element already exists
        let errorElement = field.parentElement.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    // Clear field error
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.remove('error');
        
        const errorElement = field.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Show message
    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = 'form-message';
        formMessage.classList.add(type);
        formMessage.style.display = 'block';
        
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
});
