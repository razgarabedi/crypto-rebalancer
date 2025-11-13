# User Profile Management Guide

## Overview

The Kraken Rebalancer now includes a comprehensive user profile management system where users can view their account information, update their profile details, and change their password securely.

---

## Features

### 👤 Profile Overview
- Display user information (name, email)
- Show account statistics (portfolios, active sessions)
- Account creation date
- User ID for reference

### ✏️ Update Profile
- Change display name
- Update email address
- Email validation and uniqueness check
- Real-time updates

### 🔐 Change Password
- Secure password update
- Current password verification
- Password strength validation (minimum 6 characters)
- Confirmation matching

### 📊 Account Statistics
- Number of portfolios created
- Active session count
- Member since date
- Last profile update timestamp

---

## Accessing Your Profile

### Method 1: User Menu Dropdown
1. Click on your name/email in the top-right corner
2. Click "Profile Settings" from the dropdown menu

### Method 2: Direct URL
Navigate to: `/profile`

---

## Updating Profile Information

### Change Your Name

1. Go to your profile page
2. Find the "Profile Information" section
3. Update the "Name" field
4. Click "Update Profile"
5. Success message will appear

### Change Your Email

1. Go to your profile page
2. Find the "Profile Information" section
3. Update the "Email" field
4. Click "Update Profile"
5. Email will be validated
6. Success message will appear

**Note:** Email must be unique. If another user has this email, you'll see an error.

---

## Changing Your Password

### Steps:

1. Navigate to your profile page
2. Scroll to the "Change Password" section
3. Enter your **current password**
4. Enter your **new password** (minimum 6 characters)
5. **Confirm** your new password
6. Click "Change Password"

### Password Requirements:
- Minimum 6 characters
- Must match confirmation
- Current password must be correct

### Security Notes:
- Passwords are hashed using bcrypt
- Current password is verified before change
- All password fields are cleared after successful change
- Consider using a strong, unique password

---

## Profile Page Sections

### 1. Profile Overview Card
Shows:
- User avatar (initials)
- Display name
- Email address
- Quick stats (portfolios, sessions, member since)

### 2. Profile Information Card
Update:
- Your display name
- Your email address

### 3. Change Password Card
Secure password update with:
- Current password verification
- New password input
- Confirmation field

### 4. Account Details Card
View:
- User ID
- Account creation date
- Last update timestamp
- Account status

---

## API Endpoints

### GET /api/auth/profile
Get current user profile with statistics.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-10-21T...",
    "updatedAt": "2025-10-21T...",
    "_count": {
      "portfolios": 3,
      "sessions": 2
    }
  }
}
```

### PUT /api/auth/profile
Update user profile (name, email).

**Request:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "newemail@example.com",
    "name": "New Name",
    "updatedAt": "2025-10-21T..."
  },
  "message": "Profile updated successfully"
}
```

### POST /api/auth/profile/password
Change user password.

**Request:**
```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password",
  "confirmPassword": "new-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Security Features

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Current password verified before change
- Minimum length enforcement
- Plain text passwords never stored

### Email Validation
- Format validation (must be valid email)
- Uniqueness check across all users
- Case-insensitive matching

### Session Management
- Active session count displayed
- Sessions tracked in database
- Secure JWT-based authentication

### Authorization
- All endpoints require authentication
- Users can only update their own profile
- Password verification required for changes

---

## Error Handling

### Common Errors

#### "Email already in use"
**Cause:** Another user has this email address.
**Solution:** Choose a different email address.

#### "Current password is incorrect"
**Cause:** The current password you entered doesn't match.
**Solution:** Double-check your current password.

#### "New passwords do not match"
**Cause:** New password and confirmation don't match.
**Solution:** Ensure both password fields are identical.

#### "Password must be at least 6 characters"
**Cause:** New password is too short.
**Solution:** Use a password with 6+ characters.

#### "Invalid email format"
**Cause:** Email address format is invalid.
**Solution:** Use a valid email format (user@domain.com).

---

## UI Components

### Profile Page
**Location:** `app/profile/page.tsx`

Features:
- Responsive design
- Real-time validation
- Loading states
- Error handling
- Success notifications

### User Navigation Menu
**Location:** `components/user-nav.tsx`

Features:
- Dropdown menu
- User info display
- Profile link
- Logout option

### Dropdown Menu
**Location:** `components/ui/dropdown-menu.tsx`

Radix UI component for accessible dropdown menus.

---

## Testing

### Test Profile Update

```bash
# Get profile
curl http://localhost:3000/api/auth/profile \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Update profile
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{"name":"New Name","email":"new@example.com"}'
```

### Test Password Change

```bash
curl -X POST http://localhost:3000/api/auth/profile/password \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{
    "currentPassword":"old-password",
    "newPassword":"new-password",
    "confirmPassword":"new-password"
  }'
```

---

## Best Practices

### For Users

1. **Use Strong Passwords**
   - Mix of uppercase, lowercase, numbers, symbols
   - Avoid common words or patterns
   - Minimum 8-10 characters recommended

2. **Keep Email Updated**
   - Use a valid, accessible email
   - Update if you change primary email

3. **Review Account Stats**
   - Check active sessions periodically
   - Verify portfolio count matches your expectations

4. **Secure Your Account**
   - Change password regularly
   - Use unique password for this app
   - Log out from shared devices

### For Developers

1. **Password Security**
   - Always hash passwords with bcrypt
   - Never log or store plain text passwords
   - Enforce minimum password length

2. **Email Validation**
   - Validate format on client and server
   - Check uniqueness before update
   - Consider email verification (future feature)

3. **Error Messages**
   - Don't reveal if email exists (security)
   - Provide helpful validation messages
   - Log errors for debugging

4. **Database Updates**
   - Use transactions for critical updates
   - Update timestamp on changes
   - Validate data before saving

---

## Future Enhancements

Potential improvements:

- [ ] Email verification for new emails
- [ ] Password strength meter
- [ ] Two-factor authentication (2FA)
- [ ] Profile picture upload
- [ ] Account deletion option
- [ ] Session management (revoke sessions)
- [ ] Login history
- [ ] Password reset via email
- [ ] Export account data
- [ ] Account activity log

---

## Troubleshooting

### Profile Not Loading

**Issue:** Profile page shows loading spinner indefinitely.

**Solutions:**
1. Check if you're logged in
2. Verify session cookie exists
3. Check browser console for errors
4. Try logging out and back in

### Update Not Saving

**Issue:** Profile updates don't persist.

**Solutions:**
1. Check for error messages
2. Verify internet connection
3. Ensure all required fields are filled
4. Check browser console for API errors

### Password Change Fails

**Issue:** Password change returns an error.

**Solutions:**
1. Verify current password is correct
2. Ensure new passwords match
3. Check password meets minimum length
4. Try clearing password fields and re-entering

---

## Privacy & Data

### What We Store
- Email address (required)
- Name (optional)
- Password hash (bcrypt)
- Account creation date
- Last update timestamp
- Session tokens

### What We Don't Store
- Plain text passwords
- Password history
- Login IP addresses (currently)
- Browsing history

### Data Access
- Only you can view/edit your profile
- Passwords are one-way encrypted
- Sessions expire after 7 days
- Account data tied to user ID

---

## Support

For issues with your profile:

1. Check this documentation
2. Review error messages
3. Try the troubleshooting steps
4. Check browser console
5. Contact system administrator

---

**Last Updated:** October 21, 2025

**Version:** 2.2.0 - User Profile Management

