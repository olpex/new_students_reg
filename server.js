require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { supabase, supabaseAdmin } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS to allow requests from Vercel domain
app.use(cors({
  origin: ['http://localhost:3001', 'https://newuser-rose.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (as fallback)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('Connected to MongoDB as fallback');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
  });
}

// Group Schema (for MongoDB fallback)
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Group = mongoose.model('Group', groupSchema);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Log all errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

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

// API endpoint to get all groups
app.get('/api/groups', verifyToken, async (req, res) => {
  try {
    // Try Supabase first
    if (supabase) {
      const { data: supabaseGroups, error } = await supabase
        .from('groups')
        .select('*');
      
      if (!error && supabaseGroups) {
        return res.json(supabaseGroups);
      } else {
        console.error('Supabase error, falling back to MongoDB:', error);
      }
    }
    
    // Fallback to MongoDB
    const groups = await Group.find({});
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to retrieve groups' });
  }
});

// Public endpoint for groups (only names, no sheetsId)
app.get('/api/groups/public', async (req, res) => {
  try {
    let groups = [];
    
    // Try Supabase first
    if (supabase) {
      const { data: supabaseGroups, error } = await supabase
        .from('groups')
        .select('name');
      
      if (!error && supabaseGroups) {
        groups = supabaseGroups;
      } else {
        console.error('Supabase error, falling back to MongoDB:', error);
        // Fallback to MongoDB
        const mongoGroups = await Group.find({});
        groups = mongoGroups.map(group => ({ name: group.name }));
      }
    } else {
      // Fallback to MongoDB
      const mongoGroups = await Group.find({});
      groups = mongoGroups.map(group => ({ name: group.name }));
    }
    
    // Add CORS headers specifically for this endpoint
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Log the groups being sent
    console.log('Sending public groups:', groups);
    
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to retrieve groups' });
  }
});

// Delete group endpoint
app.delete('/api/groups/:name', verifyToken, async (req, res) => {
  const groupName = decodeURIComponent(req.params.name);
  try {
    // Try Supabase first
    if (supabase) {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('name', groupName);
      
      if (!error) {
        return res.json({ success: true, message: 'Групу видалено' });
      } else {
        console.error('Supabase delete error, falling back to MongoDB:', error);
      }
    }
    
    // Fallback to MongoDB
    await Group.deleteOne({ name: groupName });
    res.json({ success: true, message: 'Групу видалено' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(404).json({ success: false, message: 'Групу не знайдено' });
  }
});

// Add group endpoint
app.post('/api/groups', verifyToken, async (req, res) => {
  const { name } = req.body;
  console.log('Attempting to add group:', name);

  try {
    // Try Supabase first with admin privileges
    if (supabaseAdmin) {
      // Check if group already exists
      const { data: existingGroups, error: fetchError } = await supabaseAdmin
        .from('groups')
        .select('name')
        .eq('name', name);
      
      if (fetchError) {
        console.error('Error checking if group exists in Supabase:', fetchError);
      }
      
      if (!fetchError && existingGroups && existingGroups.length > 0) {
        return res.status(400).json({ success: false, message: 'Група з таким номером вже існує' });
      }
      
      // Add new group
      const { data, error: insertError } = await supabaseAdmin
        .from('groups')
        .insert([{ name }])
        .select();
      
      if (!insertError) {
        console.log('Group added to Supabase successfully:', data);
        return res.status(201).json({ success: true, message: 'Групу додано', data });
      } else {
        console.error('Supabase insert error, falling back to MongoDB:', insertError);
      }
    } else {
      console.error('Supabase admin client not available');
    }
    
    // Fallback to MongoDB
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ success: false, message: 'Група з таким номером вже існує' });
    }

    // Add new group
    await Group.create({ name });
    res.status(201).json({ success: true, message: 'Групу додано' });
  } catch (error) {
    console.error('Error adding group:', error);
    res.status(500).json({ error: 'Failed to add group' });
  }
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
  
  // Add region if it exists, with "область" after it
  if (data.region && data.region.trim()) {
    addressParts.push(`${data.region.trim()} область`);
  }
  
  // Join all parts with commas
  return addressParts.join(', ');
}

// Function to send data to Google Sheets using Apps Script
async function sendToGoogleSheets(groupName, data) {
  // Use the latest script ID if not set in environment variables
  const GOOGLE_APP_SCRIPT_ID = process.env.GOOGLE_APP_SCRIPT_ID || 'AKfycbweaeJUUcqqESTNWj-MsuNrHt2eSKlURwI_-O9DfdVYHIak4zpI_bBSNj96L5fDaaec';
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
      fullName: `${data.lastName} ${data.firstName} ${data.patronymic}`,
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
      'Прізвище, ім\'я та по батькові',
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
  
  // Validate required fields
  if (!group || !studentData.firstName || !studentData.lastName || !studentData.birthDate) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Try to insert into Supabase first using admin client for higher privileges
    if (supabaseAdmin) {
      console.log('Attempting to save student data to Supabase with admin privileges');
      const { data, error } = await supabaseAdmin
        .from('students')
        .insert([{ 
          ...studentData,
          group_name: group // Use group_name instead of group for Supabase
        }])
        .select();
      
      if (!error) {
        console.log('Student data saved to Supabase successfully:', data);
        // Still send to Google Sheets as a backup
        try {
          await sendToGoogleSheets(group, studentData);
          console.log('Student data also sent to Google Sheets');
        } catch (sheetError) {
          console.error('Error sending to Google Sheets (but Supabase succeeded):', sheetError);
        }
        return res.json({ success: true, message: 'Дані збережено успішно' });
      } else {
        console.error('Supabase error, falling back to Google Sheets:', error);
      }
    } else {
      console.error('Supabase admin client not available');
    }
    
    // Fallback to Google Sheets only
    await sendToGoogleSheets(group, studentData);
    res.json({ success: true, message: 'Дані збережено успішно' });
  } catch (error) {
    console.error('Error saving student data:', error);
    res.status(500).json({ success: false, message: 'Помилка збереження даних' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
