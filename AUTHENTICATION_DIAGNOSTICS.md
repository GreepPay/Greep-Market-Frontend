# Authentication Diagnostics Guide

This guide explains how to diagnose and fix authentication errors in the Greep Market application.

## Quick Start

### Run Diagnostics in Browser Console

1. Open your browser's Developer Console (F12 or Cmd+Option+I)
2. Run the following command:

```javascript
window.authDiagnostics.run()
```

This will automatically run all diagnostics and print a detailed report.

## Diagnostic Checks

The diagnostics tool checks the following:

### 1. **Token Presence**
- ✅ Checks if access token exists in `localStorage`
- ✅ Checks if refresh token exists (optional)

### 2. **Token Format**
- ✅ Validates JWT structure (must have 3 parts: header.payload.signature)
- ✅ Decodes token payload to show user information

### 3. **Token Expiration**
- ✅ Checks if access token is expired
- ✅ Shows expiration date/time
- ✅ Checks if refresh token is expired

### 4. **API Service State**
- ✅ Checks if API service reports user as authenticated
- ✅ Validates token format for Authorization header

### 5. **Configuration**
- ✅ Verifies API base URL is configured
- ✅ Tests connectivity to API server

### 6. **Error History**
- ✅ Shows recent authentication errors from log
- ✅ Helps identify recurring issues

## Common Authentication Errors

### Error: "Authentication token is missing. Please sign in again."

**Causes:**
- No token in localStorage
- Token was cleared
- User logged out

**Solution:**
1. Check if token exists: `localStorage.getItem('access_token')`
2. If missing, user needs to log in again
3. Run diagnostics: `window.authDiagnostics.run()`

### Error: "Authentication token is invalid or expired"

**Causes:**
- Token expired (JWT expiration time passed)
- Token malformed (invalid JWT structure)
- Token revoked by server

**Solution:**
1. Check token expiration:
   ```javascript
   const token = localStorage.getItem('access_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Expires at:', new Date(payload.exp * 1000));
   ```
2. If expired, refresh token will be used automatically
3. If refresh fails, user needs to log in again

### Error: "Authentication failed. Please sign in again."

**Causes:**
- 401 Unauthorized response from server
- Token refresh failed
- Server rejected the token

**Solution:**
1. Check network tab for 401 responses
2. Verify API server is running
3. Check if token format matches backend expectations
4. Clear tokens and log in again:
   ```javascript
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');
   ```

### Error: "Access token required"

**Causes:**
- Request sent without Authorization header
- Token not loaded from localStorage

**Solution:**
1. Verify token is in localStorage
2. Check API service initialization
3. Ensure token is being sent in requests

## Backend Error Messages

The backend may return these specific error messages:

- `"Access token required"` - No Authorization header in request
- `"Token expired"` - JWT has expired (check `exp` claim)
- `"Invalid token"` - Token is malformed or cannot be verified
- `"Token has been revoked"` - Token was blacklisted (e.g., after logout)

## Manual Diagnostic Steps

### Step 1: Check Token Storage

```javascript
// Check if tokens exist
console.log('Access Token:', localStorage.getItem('access_token') ? 'Exists' : 'Missing');
console.log('Refresh Token:', localStorage.getItem('refresh_token') ? 'Exists' : 'Missing');
```

### Step 2: Inspect Token Details

```javascript
const token = localStorage.getItem('access_token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token Payload:', payload);
    console.log('Expires at:', new Date(payload.exp * 1000));
    console.log('Is expired:', payload.exp < Math.floor(Date.now() / 1000));
  } catch (e) {
    console.error('Invalid token format:', e);
  }
}
```

### Step 3: Check API Service State

```javascript
// Import API service (in browser console, you may need to access via window)
// Or check network tab for Authorization headers in requests
```

### Step 4: Test API Connectivity

```javascript
// Check API base URL
fetch('http://localhost:3001/api/v1/health')
  .then(r => console.log('API Server Status:', r.status))
  .catch(e => console.error('API Server Error:', e));
```

## Error Logging

The diagnostics tool automatically logs authentication errors to localStorage for analysis.

### View Error Log

```javascript
const errorLog = localStorage.getItem('auth_error_log');
if (errorLog) {
  console.log(JSON.parse(errorLog));
}
```

### Clear Error Log

```javascript
window.authDiagnostics.clearErrorLog();
```

## Troubleshooting Checklist

- [ ] Token exists in localStorage
- [ ] Token has valid JWT format (3 parts)
- [ ] Token is not expired
- [ ] API base URL is configured correctly
- [ ] API server is running and accessible
- [ ] Network requests include Authorization header
- [ ] No CORS issues blocking requests
- [ ] Backend authentication middleware is working
- [ ] Token hasn't been revoked/blacklisted

## API Service Methods

### Check Authentication Status

The API service provides these methods:

```typescript
apiService.isAuthenticated() // Returns boolean
apiService.clearTokens() // Clears tokens and triggers logout
apiService.clearTokensSilently() // Clears tokens without triggering logout
```

## Network Request Inspection

To inspect authentication in network requests:

1. Open Developer Tools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `/api/v1/` endpoints
4. Check Request Headers for `Authorization: Bearer <token>`
5. Check Response Status:
   - **200-299**: Success
   - **401**: Unauthorized (authentication failed)
   - **403**: Forbidden (authorization failed)

## Token Refresh Flow

When a token expires:

1. Frontend detects expiration (checks `exp` claim)
2. Attempts to refresh using refresh token
3. If refresh succeeds, retries original request
4. If refresh fails, clears tokens and redirects to login

## Configuration

### Token Expiration

Token expiration is configured on the backend in JWT configuration:
- Access tokens typically expire in 15 minutes - 1 hour
- Refresh tokens typically expire in 7-30 days

### API Base URL

Check configuration in `src/config/environment.ts`:
- Development: `http://localhost:3001/api/v1`
- Production: Set via `REACT_APP_API_URL` environment variable

## Getting Help

If diagnostics don't reveal the issue:

1. **Check Browser Console** for error messages
2. **Check Network Tab** for failed requests
3. **Check Backend Logs** for authentication failures
4. **Verify Backend Configuration** (JWT secret, expiration times)
5. **Check Token Storage** in Application → Local Storage

## Diagnostic Report Example

```
🔍 Authentication Diagnostics Report
Generated: 2025-01-15T10:30:00.000Z
Summary: 8/10 passed, 1 failed, 1 warnings

✅ Access Token in localStorage: Access token found in localStorage
✅ Refresh Token in localStorage: Refresh token found in localStorage
✅ Access Token JWT Format: Access token has valid JWT structure (3 parts)
✅ Access Token Payload: Token payload decoded successfully
❌ Access Token Expiration: Access token is expired (expired at 2025-01-15T09:00:00.000Z)
✅ Refresh Token Expiration: Refresh token is valid (expires at 2025-01-22T10:30:00.000Z)
✅ API Service Authentication State: API Service reports user as authenticated
⚠️ API Server Connectivity: Could not reach API server: Network error
```

## Quick Fixes

### Clear All Authentication Data

```javascript
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('auth_error_log');
location.reload();
```

### Force Token Refresh

```javascript
// Clear tokens and redirect to login
apiService.clearTokens();
window.location.href = '/login';
```

## See Also

- `src/services/api.ts` - API service implementation
- `src/utils/authUtils.ts` - Authentication utilities
- `src/context/AuthContext.tsx` - Authentication context
- `src/utils/authDiagnostics.ts` - Diagnostics tool implementation

