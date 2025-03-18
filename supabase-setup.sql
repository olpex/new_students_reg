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
  group_name TEXT NOT NULL,
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

-- Створення політики для вставки даних (будь-хто може вставляти)
CREATE POLICY students_insert_policy
  ON students
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Створення політики для читання даних (будь-хто може читати)
CREATE POLICY students_select_policy
  ON students
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Створення політики для вставки даних в groups
CREATE POLICY groups_insert_policy
  ON groups
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Створення політики для читання даних з groups
CREATE POLICY groups_select_policy
  ON groups
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Створення політики для видалення даних з groups
CREATE POLICY groups_delete_policy
  ON groups
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Додавання індексу для швидкого пошуку по group_name
CREATE INDEX IF NOT EXISTS students_group_name_idx ON students (group_name);

-- Додавання індексу для швидкого пошуку по lastName
CREATE INDEX IF NOT EXISTS students_lastname_idx ON students (lastName);
