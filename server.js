require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const { google } = require('googleapis');

const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    next();
});

// Middleware
app.use(cors());  // Allow all origins for now since we're running locally
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/', express.static(path.join(__dirname, 'public')));

// Log all errors
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// In-memory storage for groups
let groups = [];

// Google Sheets ID for all student data
// This is the single file where all student data will be stored (in different sheets)
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1YourGoogleSheetsIDHere';
const GOOGLE_APP_SCRIPT_ID = process.env.GOOGLE_APP_SCRIPT_ID;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Необхідна авторизація' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Недійсний токен' });
    }
};

// Auth endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ success: true, token });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Невірний логін або пароль' 
        });
    }
});

// Groups API - Admin access
app.get('/api/groups', verifyToken, (req, res) => {
    res.json(groups);
});

// Public endpoint for groups (only names, no sheetsId)
app.get('/api/groups/public', (req, res) => {
    const publicGroups = groups.map(group => ({ name: group.name }));
    res.json(publicGroups);
});

// Delete group endpoint
app.delete('/api/groups/:name', verifyToken, (req, res) => {
    const groupName = decodeURIComponent(req.params.name);
    const initialLength = groups.length;

    groups = groups.filter(group => group.name !== groupName);

    if (groups.length < initialLength) {
        res.json({ success: true, message: 'Групу видалено' });
    } else {
        res.status(404).json({ success: false, message: 'Групу не знайдено' });
    }
});

// Add group endpoint
app.post('/api/groups', verifyToken, (req, res) => {
    const { name } = req.body;

    // Check if group already exists
    if (groups.some(group => group.name === name)) {
        return res.status(400).json({ success: false, message: 'Група з таким номером вже існує' });
    }

    // Add new group
    groups.push({ name });
    res.status(201).json({ success: true, message: 'Групу додано' });
});

// Function to send data to Google Sheets using Apps Script
async function sendToGoogleSheets(groupName, data) {
    const GOOGLE_APP_SCRIPT_ID = process.env.GOOGLE_APP_SCRIPT_ID;
    const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
    
    try {
        // Use fetch to call the Google Apps Script web app
        const appScriptUrl = `https://script.google.com/macros/s/${GOOGLE_APP_SCRIPT_ID}/exec`;
        
        // Prepare the data for Google Apps Script
        const payload = {
            sheetId: GOOGLE_SHEETS_ID,
            sheetName: groupName,
            lastName: data.lastName,
            firstName: data.firstName,
            patronymic: data.patronymic,
            dob: data.birthDate,
            region: data.region,
            city: data.city,
            street: data.street,
            house: data.house,
            apartment: data.apartment,
            idCode: data.idCode,
            phone: data.phone,
            email: data.email,
            useUkrainianHeaders: true // Flag to ensure Ukrainian headers are used
        };

        console.log('Sending data to Google Apps Script URL:', appScriptUrl);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        // Make the request to the Apps Script web app
        const response = await fetch(appScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log('Parsed response:', responseData);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            // If we can't parse the response, we'll just use the text
            responseData = { success: false, message: responseText };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.message || responseText}`);
        }

        return responseData.success;
    } catch (error) {
        console.error('Error sending data to Google Sheets:', error.toString());
        console.error('Error details:', error);
        return false;
    }
}

// Students registration endpoint
app.post('/api/students', async (req, res) => {
    console.log('Received student registration request');
    const { group, ...studentData } = req.body;
    
    console.log('Group:', group);
    console.log('Student data:', studentData);
    
    // Find the group
    const groupData = groups.find(g => g.name === group);
    if (!groupData) {
        console.log('Group not found:', group);
        return res.status(404).json({ success: false, message: 'Групу не знайдено' });
    }
    
    try {
        // Send data to Google Sheets via Apps Script
        console.log('Attempting to send data to Google Sheets for group:', group);
        const success = await sendToGoogleSheets(group, studentData);
        
        if (success) {
            console.log('Data successfully sent to Google Sheets');
            res.status(201).json({ success: true, message: 'Дані успішно відправлено до Google Sheets' });
        } else {
            console.log('Failed to send data to Google Sheets');
            res.status(500).json({ success: false, message: 'Помилка при відправці даних до Google Sheets' });
        }
    } catch (error) {
        console.error('Error submitting student data:', error);
        res.status(500).json({ success: false, message: 'Помилка при відправці даних' });
    }
});

const PORT = 3001;  // Always use port 3001
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Initial groups:', groups);
});
