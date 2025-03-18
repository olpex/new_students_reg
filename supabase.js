const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with your actual credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://yxzcwkqtzmrrdvkuiyan.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8';

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables are not set');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
