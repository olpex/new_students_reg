# Vercel Deployment Guide for Supabase Connection

## Overview
This guide will help you set up your application with Supabase on Vercel. Supabase provides a PostgreSQL database with built-in authentication, real-time subscriptions, and more.

## Prerequisites
1. A [Supabase](https://supabase.com) account
2. A [Vercel](https://vercel.com) account
3. Your application code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Create a Supabase Project

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter a name for your project
4. Set a secure database password
5. Choose a region close to your users
6. Click "Create new project"

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

## Step 3: Get Your Supabase Credentials

1. In your Supabase project, go to "Settings" > "API"
2. Copy the "Project URL" - this is your `SUPABASE_URL`
3. Copy the "anon" public key - this is your `SUPABASE_KEY`
   - Note: Never expose the "service_role" key in your client-side code

## Step 4: Deploy to Vercel

1. Import your Git repository into Vercel
2. Configure the project settings
3. Add the following environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `JWT_SECRET`: Your JWT secret key
   - `ADMIN_USERNAME`: Admin username
   - `ADMIN_PASSWORD`: Admin password
   - `GOOGLE_APP_SCRIPT_ID`: Your Google Apps Script ID
   - `GOOGLE_SHEETS_ID`: Your Google Sheets ID
   - `PORT`: 3000 (Vercel will override this)
4. Deploy the project

## Step 5: Verify the Connection

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

1. Create a `.env` file with your Supabase credentials
2. Run your application with:
```bash
npm install
npm start
```

Your application should connect to Supabase and log "Supabase client initialized" if successful.
