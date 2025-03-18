# Vercel Deployment Guide for MongoDB Connection

## Problem
Your application is not saving group data to the MongoDB database when deployed on Vercel.

## Solution
Follow these steps to properly configure your MongoDB connection on Vercel:

### 1. Set Up Environment Variables on Vercel

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to the "Settings" tab
4. Click on "Environment Variables"
5. Add the following environment variables:

   - `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority`)
   - `JWT_SECRET`: Your JWT secret key
   - `ADMIN_USERNAME`: Admin username
   - `ADMIN_PASSWORD`: Admin password
   - `GOOGLE_APP_SCRIPT_ID`: Your Google Apps Script ID
   - `GOOGLE_SHEETS_ID`: Your Google Sheets ID
   - `PORT`: 3000 (Vercel will override this, but it's good to have)

6. Click "Save" to apply the changes

### 2. Redeploy Your Application

After setting the environment variables:

1. Go to the "Deployments" tab
2. Click "Redeploy" to apply the new environment variables

### 3. Verify MongoDB Connection

To verify that your application is connecting to MongoDB:

1. After redeployment, check the Vercel logs:
   - Go to the "Deployments" tab
   - Click on the latest deployment
   - Click "View Function Logs"
   - Look for "Connected to MongoDB" message

## Troubleshooting

If you're still experiencing issues:

1. **Network Access**: Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or specifically from Vercel's IP ranges
2. **Database User**: Verify your MongoDB database user has the correct permissions
3. **Connection String**: Double-check your connection string format and credentials

## Local Testing

To test MongoDB connection locally before deploying:

```bash
npm install
npm start
```

Your application should log "Connected to MongoDB" if the connection is successful.
