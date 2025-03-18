# Supabase Integration Fix Guide

## Problem Identified

We've identified two key issues with the Supabase integration:

1. **Column Name Mismatch**: The column names in our code don't match the actual column names in the Supabase database.
2. **Permissions Issue**: The application is using the anon key for operations that require higher privileges.

## Step 1: Fix the Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- SQL script to fix the students table in Supabase

-- First, let's drop the existing students table if it exists
DROP TABLE IF EXISTS students;

-- Create the students table with the correct column names
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  lastname TEXT NOT NULL,
  firstname TEXT NOT NULL,
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

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to students (insert only)
CREATE POLICY "Allow public insert access to students" 
  ON students 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Create policies for authenticated access to students (full access)
CREATE POLICY "Allow authenticated full access to students" 
  ON students 
  FOR ALL 
  TO authenticated 
  USING (true);

-- Create policy for service_role to have full access
CREATE POLICY "Allow service_role full access to students" 
  ON students 
  FOR ALL 
  TO service_role 
  USING (true);
```

## Step 2: Update Environment Variables on Vercel

Make sure the following environment variables are set in your Vercel project settings:

```
SUPABASE_URL=https://yxzcwkqtzmrrdvkuiyan.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMwODAwMCwiZXhwIjoyMDU3ODg0MDAwfQ.BbZ_UK9xzdRGIbszCib03H7BYzkwGf6HvPrUKt7z_d4
```

## Step 3: Deploy the Updated Code

The following files have been updated to fix the issues:

1. **supabase.js**: Now exports both regular and admin clients
2. **server.js**: Updated to use the admin client for operations requiring higher privileges
3. **server.js**: Fixed column names to match the Supabase database schema

Push these changes to your GitHub repository and deploy to Vercel.

## Step 4: Verify the Fix

After deploying, test the application by:

1. Adding a new group in the admin panel
2. Adding a new student through the registration form
3. Checking the Supabase dashboard to confirm the data was saved

## Troubleshooting

If issues persist:

1. **Check Vercel Logs**: Look for any error messages in the Vercel deployment logs
2. **Verify Environment Variables**: Ensure all environment variables are correctly set in Vercel
3. **Test RLS Policies**: Make sure the Row Level Security policies are correctly configured
4. **Check Network Requests**: Use browser developer tools to inspect network requests for any errors

## Additional Notes

- The service role key has higher privileges and should be kept secure
- The application now properly converts camelCase field names to snake_case for Supabase
- Both Google Sheets and Supabase are used for data storage, with Supabase being the primary storage
