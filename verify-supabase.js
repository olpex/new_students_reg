// Script to verify Supabase connection and permissions
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients with actual credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yxzcwkqtzmrrdvkuiyan.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMwODAwMCwiZXhwIjoyMDU3ODg0MDAwfQ.BbZ_UK9xzdRGIbszCib03H7BYzkwGf6HvPrUKt7z_d4';

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifySupabaseConnection() {
  console.log('Verifying Supabase connection...');
  
  try {
    // Test regular client connection
    console.log('Testing regular client connection...');
    const { data: regularData, error: regularError } = await supabase
      .from('groups')
      .select('*');
    
    if (regularError) {
      console.error('Regular client error:', regularError);
    } else {
      console.log('Regular client connection successful. Groups found:', regularData.length);
    }
    
    // Test admin client connection
    console.log('\nTesting admin client connection...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('groups')
      .select('*');
    
    if (adminError) {
      console.error('Admin client error:', adminError);
    } else {
      console.log('Admin client connection successful. Groups found:', adminData.length);
    }
    
    // Test group insertion with admin client
    console.log('\nTesting group insertion with admin client...');
    const testGroupName = `Test Group ${new Date().toISOString()}`;
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('groups')
      .insert([{ name: testGroupName }])
      .select();
    
    if (insertError) {
      console.error('Group insertion error:', insertError);
    } else {
      console.log('Group insertion successful:', insertData);
      
      // Test student insertion with admin client
      console.log('\nTesting student insertion with admin client...');
      const testStudent = {
        firstName: 'Test',
        lastName: 'Student',
        patronymic: 'Testovich',
        birthDate: '2000-01-01',
        region: 'Test Region',
        city: 'Test City',
        street: 'Test Street',
        house: '1',
        apartment: '1',
        idCode: '1234567890',
        phone: '+380123456789',
        email: 'test@example.com',
        group_name: testGroupName
      };
      
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .insert([testStudent])
        .select();
      
      if (studentError) {
        console.error('Student insertion error:', studentError);
      } else {
        console.log('Student insertion successful:', studentData);
      }
    }
    
  } catch (error) {
    console.error('Verification failed with error:', error);
  }
}

// Run the verification
verifySupabaseConnection();
