document.addEventListener('DOMContentLoaded', async () => {
    const registrationForm = document.getElementById('registration-form');
    const formMessage = document.getElementById('formMessage');
    const groupSelect = document.getElementById('group');
    const phoneInput = document.getElementById('phone');

    // Initialize Supabase client
    let supabase = null;
    try {
        // Try to initialize Supabase client (will work on Vercel with environment variables)
        const { createClient } = supabaseClient;
        supabase = createClient(
            window.SUPABASE_URL || 'https://your-project-id.supabase.co',
            window.SUPABASE_KEY || 'your-supabase-anon-key'
        );
        console.log('Supabase client initialized');
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
    }

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
            status: document.getElementById('status').value,
            lastName: document.getElementById('lastName').value,
            firstName: document.getElementById('firstName').value,
            patronymic: document.getElementById('patronymic').value,
            birthDate: document.getElementById('birthDate').value,
            region: document.getElementById('region').value,
            cityType: document.getElementById('cityType').value,
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
                // Format the address according to the required format
                const addressParts = [];
                
                // Add city with prefix based on city type
                if (formData.city && formData.city.trim()) {
                    let formattedCity = formData.city.trim();
                    
                    // Add prefix based on city type
                    if (formData.cityType === 'місто') {
                        formattedCity = `м. ${formattedCity}`;
                    } else if (formData.cityType === 'селище') {
                        formattedCity = `смт. ${formattedCity}`;
                    } else if (formData.cityType === 'село') {
                        formattedCity = `с. ${formattedCity}`;
                    }
                    
                    addressParts.push(formattedCity);
                }
                
                // Add street if it exists
                if (formData.street && formData.street.trim()) {
                    addressParts.push(`вул. ${formData.street.trim()}`);
                }
                
                // Handle house and apartment
                if (formData.house && formData.house.trim()) {
                    if (formData.apartment && formData.apartment.trim()) {
                        addressParts.push(`буд. ${formData.house.trim()}, кв. ${formData.apartment.trim()}`);
                    } else {
                        addressParts.push(`буд. ${formData.house.trim()}`);
                    }
                }
                
                // Add region if it exists
                if (formData.region && formData.region.trim()) {
                    addressParts.push(`${formData.region.trim()} область`);
                }
                
                // Join all parts with commas
                const formattedAddress = addressParts.join(', ');
                console.log("Formatted address:", formattedAddress);
                
                const googleScriptData = {
                    sheetId: '1mr2DoKyJctiQGjZ3hBkkK72dPzaY5aTPKbNRSJbbH_CXr7dI_11NpnmM',
                    sheetName: formData.group, // Use the group name as the sheet name
                    timestamp: new Date().toLocaleString('uk-UA'), // Add timestamp
                    fullName: `${formData.lastName} ${formData.firstName} ${formData.patronymic}`, // Combined name field
                    dob: formData.birthDate,
                    address: formattedAddress, // Use the formatted address
                    region: formData.region, // Still include individual fields for backward compatibility
                    cityType: formData.cityType,
                    city: formData.city,
                    street: formData.street,
                    house: formData.house,
                    apartment: formData.apartment,
                    idCode: formData.idCode,
                    phone: formData.phone,
                    email: formData.email,
                    status: formData.status, // Move status field to the end
                    useUkrainianHeaders: true, // Flag to ensure Ukrainian headers are used
                    cellFormatting: {
                        horizontalAlignment: 'center', // Center text horizontally
                        verticalAlignment: 'middle'    // Center text vertically
                    }
                };
                
                const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbycEGCogYhV4SbT-t_m9A7MlnElLr1CSTJEWmmPFE-ZK70PZYoNadRzGmxxXSLnynO3sw/exec';
                
                console.log('Sending data to Google Sheets:', JSON.stringify(googleScriptData));
                
                try {
                    // Send data directly as JSON
                    const response = await fetch(googleScriptUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(googleScriptData),
                        redirect: 'follow'
                    });
                    
                    // Since we can't read the response with no-cors, we'll just assume success
                    showMessage(`Дані успішно відправлено!`, 'success');
                    registrationForm.reset();
                    phoneInput.value = '+380';
                    return;
                } catch (googleError) {
                    console.error('Error sending to Google Sheets:', googleError);
                }
                
            } catch (googleError) {
                console.error('Error sending to Google Sheets:', googleError);
            }
            
            // Try to submit directly to Supabase if available
            if (supabase) {
                try {
                    console.log('Attempting to save data to Supabase...');
                    
                    // Use the server API endpoint instead of direct Supabase client
                    // This ensures we use the server-side admin privileges
                    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                        ? '/api/students' 
                        : 'https://newuser-rose.vercel.app/api/students';
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formData)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Data saved via server API:', data);
                        showMessage('Дані успішно відправлено!', 'success');
                        registrationForm.reset();
                        phoneInput.value = '+380';
                        return;
                    } else {
                        const errorData = await response.json();
                        console.error('Server API error:', errorData);
                        throw new Error(errorData.message || 'Error saving data');
                    }
                } catch (supabaseError) {
                    console.error('Error saving to Supabase:', supabaseError);
                }
            }
            
            // Try to submit to the Node.js server as fallback
            try {
                const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? '/api/students' 
                    : 'https://newuser-rose.vercel.app/api/students';
                
                const response = await fetch(apiUrl, {
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
            // Try to load groups directly from Supabase if available
            if (supabase) {
                try {
                    console.log('Loading groups from Supabase...');
                    const { data: groups, error } = await supabase
                        .from('groups')
                        .select('name');
                    
                    if (!error && groups && groups.length > 0) {
                        console.log('Available groups from Supabase:', groups);
                        
                        groupSelect.innerHTML = '<option value="">Виберіть групу</option>';
                        
                        groups.forEach(group => {
                            const option = document.createElement('option');
                            option.value = group.name;
                            option.textContent = group.name;
                            groupSelect.appendChild(option);
                        });
                        return;
                    } else {
                        console.error('Supabase groups fetch error:', error);
                    }
                } catch (supabaseError) {
                    console.error('Error loading groups from Supabase:', supabaseError);
                }
            }
            
            // Try to load groups from the Node.js server as fallback
            try {
                console.log('Loading groups from API...');
                
                // Use absolute URL for Vercel deployment, relative URL for local development
                const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? '/api/groups/public' 
                    : 'https://newuser-rose.vercel.app/api/groups/public';
                
                console.log('Fetching groups from:', apiUrl);
                
                const response = await fetch(apiUrl);
                
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
                } else {
                    console.error('Failed to fetch groups:', response.status, response.statusText);
                    // Показуємо повідомлення про помилку замість резервних груп
                    showMessage('Немає доступних груп. Зверніться до адміністратора.', 'error');
                }
            } catch (fetchError) {
                console.log('API fetch failed:', fetchError);
                // Показуємо повідомлення про помилку замість резервних груп
                showMessage('Немає доступних груп. Зверніться до адміністратора.', 'error');
            }
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

        // Validate City Type
        const cityType = document.getElementById('cityType').value;
        if (!cityType) {
            showFieldError('cityType', 'Виберіть тип міста');
            isValid = false;
        } else {
            clearFieldError('cityType');
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

        // Validate Status
        const status = document.getElementById('status').value;
        if (!status) {
            showFieldError('status', 'Виберіть статус');
            isValid = false;
        } else {
            clearFieldError('status');
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
