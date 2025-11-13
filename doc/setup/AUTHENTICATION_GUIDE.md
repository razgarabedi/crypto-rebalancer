# Authentication System Guide

## Overview

The Kraken Rebalancer now includes a complete multi-user authentication system with secure session management.

## Features

- ✅ **User Registration** - New users can create accounts
- ✅ **Secure Login** - Password hashing with bcrypt
- ✅ **Session Management** - JWT-based sessions with database storage
- ✅ **Protected Routes** - Authentication guards for pages and API endpoints
- ✅ **Multi-User Support** - Each user has their own portfolios
- ✅ **User Profile** - Display user information in the navbar

## Getting Started

### Default Admin Account

After running migrations, a default admin account is created:

- **Email:** `admin@example.com`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change this password immediately in production!

### Changing the Default Password

1. Log in with the default credentials
2. Use the database to update the password:

```bash
npx prisma studio
```

Or via SQL:

```sql
UPDATE "User" 
SET password = '$2a$10$NEW_HASHED_PASSWORD' 
WHERE email = 'admin@example.com';
```

To generate a new hashed password:

```javascript
const bcrypt = require('bcryptjs');
const newPassword = 'your-new-secure-password';
bcrypt.hash(newPassword, 10).then(hash => console.log(hash));
```

## User Registration

Users can register at `/auth/register` with:
- Email (required, must be unique)
- Password (required, minimum 6 characters)
- Name (optional)

## Login

Users can log in at `/auth/login` with their email and password.

## Authentication Flow

1. User submits credentials to `/api/auth/login` or `/api/auth/register`
2. Server verifies credentials and creates a session
3. JWT token is generated and stored in an HTTP-only cookie
4. Session information is stored in the database
5. All subsequent requests include the session cookie
6. Protected routes verify the session before rendering

## Protected Routes

### Pages

All dashboard and market pages are protected with the `<AuthGuard>` component:

```tsx
import { AuthGuard } from '@/components/auth-guard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* Your page content */}
    </AuthGuard>
  );
}
```

### API Routes

API routes are protected with the authentication check:

```typescript
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }
  
  // Your protected logic here
}
```

## Session Management

### Session Expiration

Sessions expire after 7 days by default. Update in `lib/auth.ts`:

```typescript
const JWT_EXPIRES_IN = '7d'; // Change as needed
```

### Session Cleanup

Expired sessions are automatically cleaned up. You can manually run cleanup:

```typescript
import { cleanupExpiredSessions } from '@/lib/auth';

await cleanupExpiredSessions();
```

### Logout

Users can log out by clicking the logout button or calling:

```typescript
await fetch('/api/auth/logout', { method: 'POST' });
```

## Security Features

### Password Security

- Passwords are hashed using bcrypt with 10 salt rounds
- Plain text passwords are never stored
- Password minimum length: 6 characters

### JWT Security

- Tokens are signed with a secret key
- Tokens expire after 7 days
- Tokens are stored in HTTP-only cookies (protected from XSS)
- Tokens are validated on every request

### Session Security

- Sessions are stored in the database
- Each session is tied to a specific user
- Sessions have expiration timestamps
- Sessions can be revoked by deleting from database

### Environment Variables

Set a strong JWT secret in `.env`:

```env
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
```

Generate a strong secret:

```bash
openssl rand -base64 32
```

## Multi-User Support

### Portfolio Isolation

Each user can only access their own portfolios:

- Portfolio creation automatically assigns the current user
- API endpoints verify portfolio ownership
- Unauthorized access returns 403 Forbidden

### Data Privacy

- Users cannot see other users' data
- All queries are filtered by user ID
- Portfolio operations require ownership verification

## User Management

### Get Current User

```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();
if (user) {
  console.log(user.email, user.name);
}
```

### Require Authentication

```typescript
import { requireAuth } from '@/lib/auth';

const user = await requireAuth(); // Throws error if not authenticated
```

### Create Session

```typescript
import { createSession } from '@/lib/auth';

const { token, user } = await createSession(userId);
```

### Delete Session

```typescript
import { deleteSession } from '@/lib/auth';

await deleteSession(sessionId);
```

## API Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/login

Log in a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/logout

Log out the current user.

**Response:**
```json
{
  "success": true
}
```

### GET /api/auth/me

Get the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Testing Authentication

### Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass","name":"Test User"}'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' \
  -c cookies.txt
```

### Test Protected Route

```bash
curl http://localhost:3000/api/auth/me -b cookies.txt
```

## Troubleshooting

### "Unauthorized" Errors

- Check if the session cookie is being sent
- Verify the JWT_SECRET is set correctly
- Check if the session exists in the database
- Verify the session hasn't expired

### Login Not Working

- Verify the email and password are correct
- Check database connection
- Look at server logs for error messages
- Ensure bcrypt is installed correctly

### Session Expires Too Quickly

- Update `JWT_EXPIRES_IN` in `lib/auth.ts`
- Update session expiration in `createSession` function

### Can't Access Other User's Portfolios

This is expected behavior! The system prevents users from accessing data they don't own.

## Production Recommendations

1. **Strong JWT Secret** - Use a cryptographically secure random string
2. **HTTPS Only** - Always use HTTPS in production
3. **Secure Cookies** - Cookies are automatically secure in production
4. **Password Policy** - Consider enforcing stronger password requirements
5. **Rate Limiting** - Implement rate limiting on auth endpoints
6. **Two-Factor Authentication** - Consider adding 2FA for extra security
7. **Session Monitoring** - Monitor for suspicious session activity
8. **Regular Security Audits** - Keep dependencies updated

## Future Enhancements

Potential improvements to consider:

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub, etc.)
- [ ] Account lockout after failed attempts
- [ ] Session activity logging
- [ ] User profile management
- [ ] Admin panel for user management

## Support

For authentication-related issues, check:
- Server logs: `pm2 logs kraken-rebalancer`
- Database sessions: `SELECT * FROM "Session";`
- Browser console for client-side errors
- Network tab to inspect cookie handling

---

**Last Updated:** October 2025

