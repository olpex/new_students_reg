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
    // Try Supabase first with admin privileges
    if (supabaseAdmin) {
      console.log(`Attempting to delete group '${groupName}' from Supabase using admin privileges`);
      
      const { error } = await supabaseAdmin
        .from('groups')
        .delete()
        .eq('name', groupName);
      
      if (!error) {
        console.log(`Successfully deleted group '${groupName}' from Supabase`);
        return res.json({ success: true, message: 'Групу видалено' });
      } else {
        console.error('Supabase delete error, falling back to MongoDB:', error);
        console.error('Supabase delete error details:', error.message, error.details);
      }
    } else if (supabase) {
      console.log(`Attempting to delete group '${groupName}' from Supabase with regular client`);
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('name', groupName);
      
      if (!error) {
        console.log(`Successfully deleted group '${groupName}' from Supabase`);
        return res.json({ success: true, message: 'Групу видалено' });
      } else {
        console.error('Supabase delete error, falling back to MongoDB:', error);
        console.error('Supabase delete error details:', error.message, error.details);
      }
    }
    
    // Fallback to MongoDB
    console.log(`Falling back to MongoDB to delete group '${groupName}'`);
    await Group.deleteOne({ name: groupName });
    console.log(`Successfully deleted group '${groupName}' from MongoDB`);
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
        console.error('Supabase error details:', fetchError.message, fetchError.details);
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
        console.error('Supabase insert error details:', insertError.message, insertError.details);
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

// Test endpoint for checking Supabase permissions
app.get('/api/test/groups', verifyToken, async (req, res) => {
  try {
    console.log('Testing Supabase permissions for groups table');
    
    // Check if we can read groups
    if (supabaseAdmin) {
      console.log('Testing with supabaseAdmin client');
      const { data: readData, error: readError } = await supabaseAdmin
        .from('groups')
        .select('*')
        .limit(10);
      
      if (readError) {
        console.error('Error reading groups with admin client:', readError);
      } else {
        console.log('Successfully read groups with admin client:', readData);
      }
      
      // Test inserting a test group
      const testGroupName = `test-group-${Date.now()}`;
      console.log(`Testing insert with admin client: ${testGroupName}`);
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('groups')
        .insert([{ name: testGroupName }])
        .select();
      
      if (insertError) {
        console.error('Error inserting test group with admin client:', insertError);
      } else {
        console.log('Successfully inserted test group with admin client:', insertData);
        
        // Test deleting the test group
        console.log(`Testing delete with admin client: ${testGroupName}`);
        const { error: deleteError } = await supabaseAdmin
          .from('groups')
          .delete()
          .eq('name', testGroupName);
        
        if (deleteError) {
          console.error('Error deleting test group with admin client:', deleteError);
        } else {
          console.log('Successfully deleted test group with admin client');
        }
      }
    }
    
    res.json({ success: true, message: 'Permissions test completed, check server logs for details' });
  } catch (error) {
    console.error('Error testing Supabase permissions:', error);
    res.status(500).json({ success: false, message: 'Error testing permissions' });
  }
});

// Test endpoint for checking Supabase student insertion
app.get('/api/test/students', verifyToken, async (req, res) => {
  try {
    console.log('Testing Supabase student insertion');
    
    if (supabaseAdmin) {
      console.log('Testing with supabaseAdmin client');
      
      // Generate test student data
      const testStudent = {
        last_name: 'Тестовий',
        first_name: 'Студент',
        patronymic: 'Тестович',
        birth_date: '2000-01-01',
        region: 'Київська',
        city: 'Київ',
        street: 'Тестова',
        house: '1',
        apartment: '1',
        id_code: '1234567890',
        phone: '+380991234567',
        email: 'test@example.com',
        group_name: 'Тестова група'
      };
      
      console.log('Test student data:', testStudent);
      
      // First, try to create the test group if it doesn't exist
      const { data: groupData, error: groupError } = await supabaseAdmin
        .from('groups')
        .upsert([{ name: testStudent.group_name }], { onConflict: 'name' })
        .select();
      
      if (groupError) {
        console.error('Error creating test group:', groupError);
      } else {
        console.log('Test group created or already exists:', groupData);
      }
      
      // Now try to insert the test student
      const { data, error } = await supabaseAdmin
        .from('students')
        .insert([testStudent])
        .select();
      
      if (error) {
        console.error('Error inserting test student:', error);
        console.error('Error details:', error.message, error.details);
        
        // Try to get more information about the table structure
        try {
          // First, try to directly query the table structure
          const { data: tableColumns, error: columnsError } = await supabaseAdmin
            .from('students')
            .select('*')
            .limit(1);
            
          if (columnsError) {
            console.error('Error querying table structure:', columnsError);
          } else {
            console.log('Table columns from sample row:', tableColumns.length > 0 ? Object.keys(tableColumns[0]) : 'No rows found');
          }
          
          // Try to get schema information
          const { data: tableInfo, error: tableError } = await supabaseAdmin
            .rpc('get_table_info', { table_name: 'students' });
          
          if (tableError) {
            console.error('Error getting table info via RPC:', tableError);
            
            // Alternative approach if RPC fails
            const { data: schemaInfo, error: schemaError } = await supabaseAdmin
              .from('information_schema.columns')
              .select('column_name')
              .eq('table_name', 'students');
              
            if (schemaError) {
              console.error('Error getting schema info:', schemaError);
            } else {
              console.log('Schema info from information_schema:', schemaInfo);
            }
          } else {
            console.log('Table info from RPC:', tableInfo);
          }
        } catch (infoError) {
          console.error('Error while trying to get table information:', infoError);
        }
        
        res.json({ 
          success: false, 
          message: 'Помилка при додаванні тестового студента', 
          error: error.message,
          details: error.details 
        });
      } else {
        console.log('Test student inserted successfully:', data);
        res.json({ 
          success: true, 
          message: 'Тестовий студент успішно доданий до бази даних', 
          data 
        });
      }
    } else {
      res.json({ 
        success: false, 
        message: 'Supabase admin client not available' 
      });
    }
  } catch (error) {
    console.error('Error testing student insertion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Помилка при тестуванні додавання студента',
      error: error.toString() 
    });
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
async function sendToGoogleSheets(group, studentData, sequentialNumber) {
  try {
    const url = 'https://script.google.com/macros/s/AKfycbweaeJUUcqqESTNWj-MsuNrHt2eSKlURwI_-O9DfdVYHIak4zpI_bBSNj96L5fDaaec/exec';
    
    console.log('Sending data to Google Sheets with sequentialNumber:', sequentialNumber);
    console.log('Using sheet name:', group);
    
    const payload = {
      sheetId: '1T-z_wf1Vdo_oYyII5ywUR1mM0P69nvRIz8Ry98TupeE',
      sheetName: group,
      fullName: `${studentData.lastName} ${studentData.firstName} ${studentData.patronymic}`,
      birthDate: studentData.birthDate,
      address: `${studentData.city}, вул. ${studentData.street}, ${studentData.house}${studentData.apartment ? '/' + studentData.apartment : ''}, ${studentData.region} область`,
      phone: studentData.phone,
      email: studentData.email,
      school: '',
      grade: '',
      fatherName: '',
      fatherPhone: '',
      motherName: '',
      motherPhone: '',
      sequentialNumber: sequentialNumber
    };
    
    console.log('Payload for Google Sheets:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }
    return data;
  } catch (error) {
    console.error('Error sending to Google Sheets:', error);
    throw error;
  }
}

// Students registration endpoint
app.post('/api/students', async (req, res) => {
  console.log('Received student registration request');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  const { group, ...studentData } = req.body;
  
  // Validate required fields
  if (!group || !studentData.firstName || !studentData.lastName || !studentData.birthDate) {
    console.error('Missing required fields:', { 
      group: group ? 'present' : 'missing', 
      firstName: studentData.firstName ? 'present' : 'missing', 
      lastName: studentData.lastName ? 'present' : 'missing', 
      birthDate: studentData.birthDate ? 'present' : 'missing' 
    });
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Try to insert into Supabase first using admin client for higher privileges
    if (supabaseAdmin) {
      console.log('Attempting to save student data to Supabase with admin privileges');
      
      // Convert camelCase to match Supabase table structure
      const supabaseData = {
        last_name: studentData.lastName,
        first_name: studentData.firstName,
        patronymic: studentData.patronymic,
        birth_date: studentData.birthDate,
        region: studentData.region,
        city: studentData.city,
        street: studentData.street,
        house: studentData.house,
        apartment: studentData.apartment,
        id_code: studentData.idCode,
        phone: studentData.phone,
        email: studentData.email,
        group_name: group
      };
      
      console.log('Formatted data for Supabase:', supabaseData);
      
      // Log the Supabase client configuration
      console.log('Supabase Admin URL:', process.env.SUPABASE_URL);
      console.log('Supabase table name being used:', 'students');
      
      // Check if students table exists and create it if it doesn't
      try {
        const { count, error: countError } = await supabaseAdmin
          .from('students')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.log('Error checking students table, attempting to create it:', countError);
          
          // Create the students table
          const { error: createError } = await supabaseAdmin.rpc('create_students_table');
          
          if (createError) {
            console.error('Error creating students table:', createError);
            // Try direct SQL approach
            const createTableSQL = `
              CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                last_name TEXT NOT NULL,
                first_name TEXT NOT NULL,
                patronymic TEXT,
                birth_date DATE NOT NULL,
                region TEXT NOT NULL,
                city TEXT NOT NULL,
                street TEXT,
                house TEXT,
                apartment TEXT,
                id_code TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT NOT NULL,
                group_name TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            
            try {
              await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
              console.log('Students table created successfully using exec_sql');
            } catch (sqlError) {
              console.error('Error executing SQL to create table:', sqlError);
            }
          } else {
            console.log('Students table created successfully');
          }
        } else {
          console.log('Students table exists, proceeding with insert');
        }
      } catch (tableCheckError) {
        console.error('Error checking/creating students table:', tableCheckError);
      }
      
      // Now try to insert the data
      const { data, error } = await supabaseAdmin
        .from('students')
        .insert([supabaseData])
        .select();
      
      if (!error) {
        console.log('Student data saved to Supabase successfully:', data);
        // Still send to Google Sheets as a backup
        try {
          await sendToGoogleSheets(group, studentData, data[0].id);
          console.log('Student data also sent to Google Sheets');
        } catch (sheetError) {
          console.error('Error sending to Google Sheets (but Supabase succeeded):', sheetError);
        }
        return res.json({ success: true, message: 'Дані збережено успішно' });
      } else {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Supabase insert data that caused error:', JSON.stringify(supabaseData, null, 2));
        console.error('Supabase error, falling back to Google Sheets:', error);
      }
    } else {
      console.error('Supabase admin client not available');
    }
    
    // Fallback to Google Sheets only
    await sendToGoogleSheets(group, studentData, 1);
    res.json({ success: true, message: 'Дані збережено успішно' });
  } catch (error) {
    console.error('Error saving student data:', error);
    res.status(500).json({ success: false, message: 'Помилка збереження даних' });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Check if students table exists in Supabase
  if (supabaseAdmin) {
    try {
      console.log('Checking Supabase tables...');
      
      // Check students table
      const { data: studentsData, error: studentsError } = await supabaseAdmin
        .from('students')
        .select('*')
        .limit(1);
      
      if (studentsError) {
        console.error('Error checking students table:', studentsError);
        console.error('This may indicate that the students table does not exist or has incorrect permissions');
        console.error('Please create the students table in Supabase with the correct structure');
      } else {
        console.log('Successfully connected to students table in Supabase');
        console.log('Table structure seems to be correct');
      }
      
      // Check groups table
      const { data: groupsData, error: groupsError } = await supabaseAdmin
        .from('groups')
        .select('*')
        .limit(1);
      
      if (groupsError) {
        console.error('Error checking groups table:', groupsError);
        console.error('This may indicate that the groups table does not exist or has incorrect permissions');
        console.error('Please create the groups table in Supabase with the correct structure');
        console.error('SQL to create groups table: CREATE TABLE groups (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE);');
      } else {
        console.log('Successfully connected to groups table in Supabase');
        console.log('Groups table structure seems to be correct');
        console.log('Groups in the table:', groupsData);
      }
    } catch (error) {
      console.error('Exception when checking Supabase tables:', error);
    }
  }
});
