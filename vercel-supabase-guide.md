# Vercel Deployment Guide for Supabase Connection

## Overview
This guide will help you set up your application with Supabase on Vercel. Supabase provides a PostgreSQL database with built-in authentication, real-time subscriptions, and more.

## Prerequisites
1. A [Supabase](https://supabase.com) account
2. A [Vercel](https://vercel.com) account
3. Your application code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Your Supabase Project

Your Supabase project is already set up with the following credentials:

- **Project URL**: `https://yxzcwkqtzmrrdvkuiyan.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8`

## Step 2: Set Up Your Database Tables

1. Go to the "Table Editor" in your Supabase dashboard
2. Create the following tables:

### Groups Table
```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

### Students Table
```sql
CREATE TABLE students (
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
  group TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Налаштування таблиць в Supabase

### Створення таблиці students

1. Перейдіть на [dashboard.supabase.com](https://dashboard.supabase.com) і виберіть ваш проект
2. Перейдіть до "SQL Editor" в лівому меню
3. Створіть новий запит, натиснувши "New Query"
4. Вставте наступний SQL-код:

```sql
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
```

5. Натисніть "Run" для виконання запиту

### Створення таблиці groups

1. Створіть ще один новий запит в SQL Editor
2. Вставте наступний SQL-код:

```sql
-- Створення таблиці groups, якщо вона не існує
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Налаштування Row Level Security для таблиці groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

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
```

3. Натисніть "Run" для виконання запиту

### Перевірка налаштувань Row Level Security (RLS)

1. Перейдіть до "Table Editor" в лівому меню
2. Виберіть таблицю `students` або `groups`
3. Натисніть на вкладку "Policies"
4. Переконайтеся, що для таблиці увімкнено RLS і створено відповідні політики

## Step 3: Deploy to Vercel

1. Import your Git repository into Vercel
2. Configure the project settings
3. Add the following environment variables:

```
SUPABASE_URL=https://yxzcwkqtzmrrdvkuiyan.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMwODAwMCwiZXhwIjoyMDU3ODg0MDAwfQ.BbZ_UK9xzdRGIbszCib03H7BYzkwGf6HvPrUKt7z_d4
NEXT_PUBLIC_SUPABASE_URL=https://yxzcwkqtzmrrdvkuiyan.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emN3a3F0em1ycmR2a3VpeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDgwMDAsImV4cCI6MjA1Nzg4NDAwMH0.90tTXd4jh8Wc9ssXKcCvzLZ_OH_tab0lIYEIMcciOL8
POSTGRES_URL=postgres://postgres.yxzcwkqtzmrrdvkuiyan:B8axamqMImSa5Hdl@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.yxzcwkqtzmrrdvkuiyan:B8axamqMImSa5Hdl@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_URL_NON_POOLING=postgres://postgres.yxzcwkqtzmrrdvkuiyan:B8axamqMImSa5Hdl@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_PASSWORD=B8axamqMImSa5Hdl
POSTGRES_DATABASE=postgres
POSTGRES_HOST=db.yxzcwkqtzmrrdvkuiyan.supabase.co
JWT_SECRET=Bgi1vHbd0y8Kde4dnpSbotpVmSAl7LqVkCn+/KSHw5RCfEF6Nrys0gb+851l/iSuAgkpIE+/ajdNAPJyd+PRuA==
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
GOOGLE_APP_SCRIPT_ID=AKfycbweaeJUUcqqESTNWj-MsuNrHt2eSKlURwI_-O9DfdVYHIak4zpI_bBSNj96L5fDaaec
GOOGLE_SHEETS_ID=1T-z_wf1Vdo_oYyII5ywUR1mM0P69nvRIz8Ry98TupeE
```

4. Deploy the project

## Step 4: Verify the Connection

After deployment, your application should be able to:
1. Connect to Supabase
2. Fetch groups from the groups table
3. Insert new student records into the students table

If you encounter any issues:
1. Check the Vercel deployment logs
2. Verify that your environment variables are set correctly
3. Ensure your Supabase project has the correct tables and permissions

## Security Considerations

1. **Row-Level Security (RLS)**: Configure RLS policies in Supabase to secure your data
2. **API Keys**: Never expose your service_role key in client-side code
3. **CORS**: Ensure your Supabase project allows requests from your Vercel domain

## Troubleshooting

### Connection Issues
- Verify that your Supabase URL and key are correct
- Check if your Supabase project is active
- Ensure your Vercel deployment has the correct environment variables

### Data Access Issues
- Check your Supabase RLS policies
- Verify that your tables have the correct structure
- Ensure your application has the necessary permissions

## Local Development

To test your Supabase connection locally:

1. Create a `.env` file with your Supabase credentials (see above)
2. Run your application with:
```bash
npm install
npm start
```

Your application should connect to Supabase and log "Supabase client initialized" if successful.

## Додаткові налаштування

Якщо у вас виникають проблеми з додаванням студентів до бази даних, виконайте наступні кроки:

1. Перевірте, чи правильно налаштовані змінні середовища в Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Перевірте логи сервера для виявлення помилок
