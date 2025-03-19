-- Supabase SQL Setup Script

-- Create students table
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

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for students table (if they exist)
DROP POLICY IF EXISTS students_insert_policy ON students;
DROP POLICY IF EXISTS students_select_policy ON students;

-- Create policies for students table
CREATE POLICY students_insert_policy
  ON students
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create indexes for faster search
CREATE INDEX IF NOT EXISTS students_group_name_idx ON students (group_name);
CREATE INDEX IF NOT EXISTS students_lastname_idx ON students (last_name);
