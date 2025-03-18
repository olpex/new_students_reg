// Comprehensive diagnostic script for Supabase integration
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase clients with actual credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yxzcwkqtzmrrdvkuiyan.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMwODAwMCwiZXhwIjoyMDU3ODg0MDAwfQ.BbZ_UK9xzdRGIbszCib03H7BYzkwGf6HvPrUKt7z_d4';

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseSupabase() {
  console.log('=== SUPABASE DIAGNOSTIC REPORT ===');
  console.log('Date and Time:', new Date().toISOString());
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using Service Role Key:', !!supabaseServiceKey);
  console.log('\n');
  
  try {
    // Check if tables exist
    console.log('1. CHECKING DATABASE TABLES:');
    
    // Check groups table
    console.log('\n--- GROUPS TABLE ---');
    const { data: groupsData, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('*');
    
    if (groupsError) {
      console.error('Error accessing groups table:', groupsError);
    } else {
      console.log('Groups table exists and contains', groupsData.length, 'records');
      console.log('Sample groups:', groupsData.slice(0, 3).map(g => g.name));
    }
    
    // Check students table
    console.log('\n--- STUDENTS TABLE ---');
    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('*');
    
    if (studentsError) {
      console.error('Error accessing students table:', studentsError);
      
      // Try to get the table structure
      console.log('\nAttempting to diagnose students table structure...');
      
      // Try to get a single record with a specific column
      const { data: singleStudent, error: singleError } = await supabaseAdmin
        .from('students')
        .select('id')
        .limit(1);
      
      if (singleError) {
        console.error('Error getting single student record:', singleError);
      } else {
        console.log('Successfully retrieved a student record with id only');
      }
      
      // List all tables in the schema
      console.log('\nListing all tables in the schema:');
      const { data: tables, error: tablesError } = await supabaseAdmin.rpc('list_tables');
      
      if (tablesError) {
        console.error('Error listing tables:', tablesError);
      } else {
        console.log('Tables in schema:', tables);
      }
    } else {
      console.log('Students table exists and contains', studentsData.length, 'records');
      if (studentsData.length > 0) {
        console.log('First student record structure:', Object.keys(studentsData[0]));
        console.log('Sample student:', {
          name: `${studentsData[0].firstname} ${studentsData[0].lastname}`,
          group: studentsData[0].group_name
        });
      }
    }
    
    // Test group creation
    console.log('\n2. TESTING GROUP CREATION:');
    const testGroupName = `Test Group ${new Date().toISOString()}`;
    
    const { data: newGroup, error: groupCreateError } = await supabaseAdmin
      .from('groups')
      .insert([{ name: testGroupName }])
      .select();
    
    if (groupCreateError) {
      console.error('Error creating test group:', groupCreateError);
    } else {
      console.log('Successfully created test group:', newGroup);
    }
    
    // Test student creation
    console.log('\n3. TESTING STUDENT CREATION:');
    const testStudent = {
      firstname: 'Test',
      lastname: 'Student',
      patronymic: 'Testovich',
      birth_date: '2000-01-01',
      region: 'Test Region',
      city: 'Test City',
      street: 'Test Street',
      house: '1',
      apartment: '1',
      id_code: '1234567890',
      phone: '+380123456789',
      email: 'test@example.com',
      group_name: testGroupName
    };
    
    const { data: newStudent, error: studentCreateError } = await supabaseAdmin
      .from('students')
      .insert([testStudent])
      .select();
    
    if (studentCreateError) {
      console.error('Error creating test student:', studentCreateError);
      
      // Try to diagnose the column names issue
      console.log('\nDiagnosing column names issue...');
      
      // Try with different column names
      const alternativeStudent = {
        first_name: testStudent.firstname,
        last_name: testStudent.lastname,
        birth_date: testStudent.birth_date,
        // other fields remain the same
        group_name: testStudent.group_name
      };
      
      console.log('Trying with alternative column names...');
      const { error: altError } = await supabaseAdmin
        .from('students')
        .insert([alternativeStudent]);
      
      if (altError) {
        console.error('Alternative column names also failed:', altError);
      } else {
        console.log('Alternative column names worked!');
      }
    } else {
      console.log('Successfully created test student:', newStudent);
    }
    
    // Check RLS policies
    console.log('\n4. CHECKING RLS POLICIES:');
    
    // Try to insert with regular client
    console.log('\n--- TESTING ANON CLIENT PERMISSIONS ---');
    const { error: anonInsertError } = await supabase
      .from('groups')
      .insert([{ name: `Anon Test ${new Date().toISOString()}` }]);
    
    if (anonInsertError) {
      console.error('Anon client cannot insert into groups:', anonInsertError);
      console.log('This suggests RLS policies might be restricting anon access');
    } else {
      console.log('Anon client can insert into groups table');
    }
    
    // Test deployed API
    console.log('\n5. TESTING DEPLOYED API:');
    try {
      const apiResponse = await fetch('https://newuser-rose.vercel.app/api/groups', {
        method: 'GET'
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('API response:', apiData);
      } else {
        console.error('API returned error:', apiResponse.status);
        const errorText = await apiResponse.text();
        console.error('Error details:', errorText);
      }
    } catch (apiError) {
      console.error('Error calling API:', apiError);
    }
    
  } catch (error) {
    console.error('Diagnostic failed with error:', error);
  }
  
  console.log('\n=== END OF DIAGNOSTIC REPORT ===');
}

// Run the diagnostic
diagnoseSupabase();
