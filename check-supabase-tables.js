// Script to check Supabase table structures
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client with service role key
const supabaseUrl = 'https://yxzcwkqtzmrrdvkuiyan.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMwODAwMCwiZXhwIjoyMDU3ODg0MDAwfQ.BbZ_UK9xzdRGIbszCib03H7BYzkwGf6HvPrUKt7z_d4';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    // Check the students table structure using a system query
    console.log('Checking students table structure...');
    const { data: studentsColumns, error: studentsError } = await supabaseAdmin.rpc(
      'get_table_columns',
      { table_name: 'students' }
    );
    
    if (studentsError) {
      console.error('Error fetching students table structure:', studentsError);
      
      // Alternative approach - try to get a single row to see the structure
      console.log('Trying alternative approach...');
      const { data: sampleStudent, error: sampleError } = await supabaseAdmin
        .from('students')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error fetching sample student:', sampleError);
      } else if (sampleStudent && sampleStudent.length > 0) {
        console.log('Sample student structure:', Object.keys(sampleStudent[0]));
      } else {
        console.log('No students found in the table');
      }
    } else {
      console.log('Students table columns:', studentsColumns);
    }
    
    // Check the groups table structure
    console.log('\nChecking groups table structure...');
    const { data: groupsColumns, error: groupsError } = await supabaseAdmin.rpc(
      'get_table_columns',
      { table_name: 'groups' }
    );
    
    if (groupsError) {
      console.error('Error fetching groups table structure:', groupsError);
      
      // Alternative approach
      console.log('Trying alternative approach...');
      const { data: sampleGroup, error: sampleError } = await supabaseAdmin
        .from('groups')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error fetching sample group:', sampleError);
      } else if (sampleGroup && sampleGroup.length > 0) {
        console.log('Sample group structure:', Object.keys(sampleGroup[0]));
      } else {
        console.log('No groups found in the table');
      }
    } else {
      console.log('Groups table columns:', groupsColumns);
    }
    
  } catch (error) {
    console.error('Check failed with error:', error);
  }
}

// Run the check
checkTableStructure();
