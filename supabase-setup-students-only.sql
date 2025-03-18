-- Налаштування лише таблиці students без змін у таблиці groups

-- Створення таблиці students, якщо вона не існує
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

-- Налаштування Row Level Security для таблиці students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Видалення існуючих політик для таблиці students (якщо вони є)
DROP POLICY IF EXISTS students_insert_policy ON students;
DROP POLICY IF EXISTS students_select_policy ON students;

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

-- Додавання індексу для швидкого пошуку по group_name
CREATE INDEX IF NOT EXISTS students_group_name_idx ON students (group_name);

-- Додавання індексу для швидкого пошуку по lastName
CREATE INDEX IF NOT EXISTS students_lastname_idx ON students (lastName);
