-- SQL script to fix the students table in Supabase

-- First, let's drop the existing students table if it exists
DROP TABLE IF EXISTS students;

-- Create the students table with the correct column names
CREATE TABLE students (
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
