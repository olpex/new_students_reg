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

// Function to format address
function formatAddress(data) {
    // Create an array of address parts
    const addressParts = [];
    
    // Add city if it exists
    if (data.city && data.city.trim()) {
        addressParts.push(data.city.trim());
    }
    
    // Add street if it exists
    if (data.street && data.street.trim()) {
        addressParts.push(`вул. ${data.street.trim()}`);
    }
    
    // Handle house and apartment
    if (data.house && data.house.trim()) {
        if (data.apartment && data.apartment.trim()) {
            addressParts.push(`${data.house.trim()}/${data.apartment.trim()}`);
        } else {
            addressParts.push(data.house.trim());
        }
    }
    
    // Add region if it exists
    if (data.region && data.region.trim()) {
        addressParts.push(data.region.trim());
    }
    
    // Join all parts with commas
    return addressParts.join(', ');
}

// Function to send data to Google Sheets using Apps Script
async function sendToGoogleSheets(groupName, data) {
    // Use the latest script ID if not set in environment variables
    const GOOGLE_APP_SCRIPT_ID = process.env.GOOGLE_APP_SCRIPT_ID || 'AKfycbzEvdR5rz1Tt31RwWMxQiVxKUhRPAinSLbr9VNw8TVcw6-cWkpzL8qzdu8mkrDu-EyBBA';
    const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
    
    try {
        // First, directly create or update the sheet with Ukrainian headers using Google Sheets API
        await ensureUkrainianHeadersInSheet(GOOGLE_SHEETS_ID, groupName);
        
        // Use fetch to call the Google Apps Script web app
        const appScriptUrl = `https://script.google.com/macros/s/${GOOGLE_APP_SCRIPT_ID}/exec`;
        
        // Format the address
        const address = formatAddress(data);
        
        // Prepare the data for Google Apps Script
        const payload = {
            sheetId: GOOGLE_SHEETS_ID,
            sheetName: groupName,
            lastName: data.lastName,
            firstName: data.firstName,
            patronymic: data.patronymic,
            dob: data.birthDate,
            address: address, // Send the formatted address
            region: data.region, // Still include individual fields for backward compatibility
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

// Function to ensure Ukrainian headers in a Google Sheet
async function ensureUkrainianHeadersInSheet(spreadsheetId, sheetName) {
    try {
        console.log(`Ensuring Ukrainian headers in sheet: ${sheetName}`);
        
        // Define the Ukrainian headers
        const ukrainianHeaders = [
            'Дата реєстрації',
            'Прізвище',
            'Ім\'я',
            'По батькові',
            'Дата народження',
            'Місце реєстрації',
            'Ідентифікаційний код',
            'Телефон',
            'Email'
        ];
        
        // Create a direct HTTP request to the Google Sheets API
        const sheetsApiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        
        // Get the OAuth2 token from environment variables or another secure source
        // For simplicity in this example, we're using a direct fetch, but in production
        // you should use proper OAuth2 authentication
        const accessToken = process.env.GOOGLE_API_ACCESS_TOKEN;
        
        if (!accessToken) {
            console.error('No Google API access token found in environment variables');
            return false;
        }
        
        // Check if the sheet exists and get its ID
        const spreadsheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
        const spreadsheetResponse = await fetch(spreadsheetUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!spreadsheetResponse.ok) {
            console.error(`Failed to get spreadsheet: ${spreadsheetResponse.status}`);
            return false;
        }
        
        const spreadsheetData = await spreadsheetResponse.json();
        let sheetId = null;
        let sheetExists = false;
        
        // Find the sheet by name
        for (const sheet of spreadsheetData.sheets) {
            if (sheet.properties.title === sheetName) {
                sheetId = sheet.properties.sheetId;
                sheetExists = true;
                break;
            }
        }
        
        // Prepare the request body
        let requestBody = {
            requests: []
        };
        
        if (!sheetExists) {
            // Add a request to create the sheet
            requestBody.requests.push({
                addSheet: {
                    properties: {
                        title: sheetName
                    }
                }
            });
            
            // Send the request to create the sheet
            const createResponse = await fetch(sheetsApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!createResponse.ok) {
                console.error(`Failed to create sheet: ${createResponse.status}`);
                return false;
            }
            
            const createData = await createResponse.json();
            sheetId = createData.replies[0].addSheet.properties.sheetId;
            
            // Reset requests for the next operation
            requestBody.requests = [];
        }
        
        // Add a request to update the headers
        requestBody.requests.push({
            updateCells: {
                start: {
                    sheetId: sheetId,
                    rowIndex: 0,
                    columnIndex: 0
                },
                rows: [{
                    values: ukrainianHeaders.map(header => ({
                        userEnteredValue: {
                            stringValue: header
                        },
                        userEnteredFormat: {
                            backgroundColor: {
                                red: 0.26,
                                green: 0.52,
                                blue: 0.96
                            },
                            textFormat: {
                                foregroundColor: {
                                    red: 1.0,
                                    green: 1.0,
                                    blue: 1.0
                                },
                                bold: true,
                                horizontalAlignment: 'CENTER',
                                verticalAlignment: 'MIDDLE'
                            },
                            numberFormat: {
                                type: 'TEXT',
                                pattern: ''
                            },
                            padding: {
                                top: 10,
                                right: 10,
                                bottom: 10,
                                left: 10
                            },
                            verticalAlignment: 'MIDDLE',
                            wrapStrategy: 'LEGACY_WRAP'
                        }
                    }))
                }],
                fields: 'userEnteredValue,userEnteredFormat'
            }
        });
        
        // Add a request to freeze the first row
        requestBody.requests.push({
            updateSheetProperties: {
                properties: {
                    sheetId: sheetId,
                    gridProperties: {
                        frozenRowCount: 1
                    }
                },
                fields: 'gridProperties.frozenRowCount'
            }
        });
        
        // Add a request to set row height
        requestBody.requests.push({
            updateDimensionProperties: {
                range: {
                    sheetId: sheetId,
                    dimension: 'ROWS',
                    startIndex: 0,
                    endIndex: 1
                },
                properties: {
                    pixelSize: 50
                },
                fields: 'pixelSize'
            }
        });
        
        // Add requests to set column widths to 142 pixels for each column
        for (let i = 0; i < ukrainianHeaders.length; i++) {
            requestBody.requests.push({
                updateDimensionProperties: {
                    range: {
                        sheetId: sheetId,
                        dimension: 'COLUMNS',
                        startIndex: i,
                        endIndex: i + 1
                    },
                    properties: {
                        pixelSize: 142
                    },
                    fields: 'pixelSize'
                }
            });
        }
        
        // Send the request to update the headers
        const updateResponse = await fetch(sheetsApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!updateResponse.ok) {
            console.error(`Failed to update headers: ${updateResponse.status}`);
            return false;
        }
        
        console.log('Successfully ensured Ukrainian headers in the sheet');
        return true;
    } catch (error) {
        console.error('Error ensuring Ukrainian headers:', error);
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
