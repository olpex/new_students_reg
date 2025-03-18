-- Supabase SQL Setup Script

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  lastName TEXT NOT NULL,
  firstName TEXT NOT NULL,
  patronymic TEXT,
  birthDate DATE NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT,
  house TEXT,
  apartment TEXT,
  idCode TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  group_name TEXT NOT NULL,  -- Changed from 'group' to 'group_name' to avoid reserved keyword
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to groups (read-only)
CREATE POLICY "Allow public read access to groups" 
  ON groups 
  FOR SELECT 
  TO anon 
  USING (true);

-- Create policies for authenticated access to groups (full access)
CREATE POLICY "Allow authenticated full access to groups" 
  ON groups 
  FOR ALL 
  TO authenticated 
  USING (true);

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

-- Insert some example groups (if needed)
INSERT INTO groups (name) VALUES 
  ('Група 101'),
  ('Група 102'),
  ('Група 103')
ON CONFLICT (name) DO NOTHING;
