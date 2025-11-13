# 🔧 Environment Setup Guide

## The 401 Unauthorized Error

The error you're experiencing is caused by missing environment variables. The application needs a database connection and JWT secret to handle authentication.

## Quick Fix

### Step 1: Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Database Configuration (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/kraken_rebalancer?schema=public"

# JWT Secret (REQUIRED for authentication)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long-change-in-production"

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Set Up Database

**Option A: Local PostgreSQL**

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE kraken_rebalancer;
```

3. Update DATABASE_URL in `.env.local` with your credentials

**Option B: Cloud Database (Recommended)**

Use a free cloud PostgreSQL service:
- [Supabase](https://supabase.com) (Free tier)
- [Neon](https://neon.tech) (Free tier)
- [Railway](https://railway.app)

### Step 3: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

### Step 4: Restart Development Server

```bash
npm run dev
```

## Testing the Fix

1. Open the debug tool: `debug-auth.html` in your browser
2. Click "Run All Tests" to verify authentication is working
3. If tests pass, the 401 error should be resolved

## Default Login Credentials

After setup, you can login with:
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Change these credentials in production!**

## Next Steps

1. **Add Kraken API Keys** (Optional):
   - Go to `/profile` page
   - Add your Kraken API credentials
   - This enables live balance fetching

2. **Create Your First Portfolio**:
   - Go to `/dashboard`
   - Click "Add Portfolio"
   - Configure your target allocation

## Troubleshooting

### Still Getting 401 Errors?

1. **Check Database Connection**:
   ```bash
   npm run db:status
   ```

2. **Verify Environment Variables**:
   ```bash
   echo $DATABASE_URL
   echo $JWT_SECRET
   ```

3. **Clear Browser Cookies**:
   - Clear all cookies for localhost:3000
   - Try logging in again

4. **Check Server Logs**:
   - Look at the terminal running `npm run dev`
   - Check for database connection errors

### Common Issues

- **Database not running**: Start PostgreSQL service
- **Wrong DATABASE_URL**: Verify connection string format
- **Missing JWT_SECRET**: Generate a strong random string
- **Port conflicts**: Make sure port 3000 is available

## Need Help?

If you're still experiencing issues:

1. Check the server console for error messages
2. Use the debug tool (`debug-auth.html`) to diagnose the problem
3. Verify all environment variables are set correctly
4. Ensure the database is running and accessible
