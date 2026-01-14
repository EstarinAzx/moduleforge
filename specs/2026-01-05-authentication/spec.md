# Specification: User Authentication

## Goal
Implement a secure JWT-based authentication system with email/password registration and login, enabling users to create accounts, securely access their modules, and manage their profile.

## User Stories
- As a new user, I want to register with email and password so that I can start creating modules
- As a returning user, I want to log in securely so that I can access my existing modules
- As a user, I want to reset my password if I forget it so that I can regain access to my account

## Specific Requirements

### User Registration

**Email/Password Signup**
- User provides email (unique), password (min 8 chars), and display name
- Backend validates email format and checks for duplicates
- Password hashed with `bcryptjs` (salt rounds: 10) before storage
- On success, return JWT token and user profile (id, email, displayName, createdAt)
- On failure, return appropriate error (email taken, weak password, invalid email)

**Email Validation**
- Email must be valid format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Email stored in lowercase to prevent case-sensitivity issues
- No email verification required for MVP (can add later)

### User Login

**Email/Password Authentication**
- User provides email and password
- Backend retrieves user by email (case-insensitive lookup)
- Compare password hash using `bcryptjs.compare()`
- On success, generate JWT token with payload: `{ userId, email }` and return with user profile
- On failure, return generic error: "Invalid email or password" (don't reveal which is wrong)
- Token expiry: 7 days (`expiresIn: '7d'`)

**JWT Token Structure**
- Algorithm: HS256 (HMAC with SHA-256)
- Secret: Stored in environment variable `JWT_SECRET` (min 32 chars)
- Payload: `{ userId: string, email: string, iat: number, exp: number }`
- Token returned in response body (frontend stores in localStorage)

### Password Reset Flow

**Request Password Reset**
- User submits email address
- Backend generates reset token (random 32-byte hex string via `crypto.randomBytes()`)
- Store reset token hash and expiry (1 hour) in `users` table columns: `resetToken`, `resetTokenExpiry`
- For MVP: Log reset link to console (no email sending yet)
- Always return success message even if email doesn't exist (prevent email enumeration)

**Complete Password Reset**
- User submits reset token and new password
- Backend validates token exists and hasn't expired
- Hash new password and update user record
- Clear `resetToken` and `resetTokenExpiry` fields
- Return success message (don't auto-login, redirect to login page)

### Protected Routes (Backend)

**Auth Middleware**
- Extract JWT from `Authorization` header: `Bearer <token>`
- Verify token signature using `JWT_SECRET`
- If valid, attach `req.user = { userId, email }` to request object
- If invalid/missing, return 401 Unauthorized
- Apply middleware to all module CRUD routes and user profile routes

### User Profile Management

**Get Current User**
- Protected endpoint: `GET /api/auth/me`
- Return user profile: `{ id, email, displayName, createdAt }`
- Exclude password hash and reset token fields

**Update Profile**
- Protected endpoint: `PATCH /api/auth/profile`
- Allow updates to `displayName` only (no email/password changes via this endpoint)
- Validate displayName is 1-50 characters
- Return updated user profile

**Change Password**
- Protected endpoint: `POST /api/auth/change-password`
- Require current password and new password
- Verify current password before allowing change
- Hash and update new password
- Return success message

## Database Schema

**`users` Table (Prisma Schema)**
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  displayName       String
  resetToken        String?
  resetTokenExpiry  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations (for future features)
  ownedModules      Module[]  @relation("OwnedModules")
  collaborations    ModuleCollaborator[]
}
```

## API Endpoints

**Public Endpoints**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login existing user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Complete password reset

**Protected Endpoints (require JWT)**
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/profile` - Update display name
- `POST /api/auth/change-password` - Change password

## Frontend Components

**Registration Page (`/register`)**
- Form fields: Email, Password, Confirm Password, Display Name
- Client-side validation: email format, password min 8 chars, passwords match
- On submit: POST to `/api/auth/register`, store token in localStorage, redirect to dashboard
- Error handling: Display backend errors below form (email taken, etc.)
- Link to login page for existing users

**Login Page (`/login`)**
- Form fields: Email, Password
- "Remember me" checkbox (for future session extension)
- On submit: POST to `/api/auth/login`, store token in localStorage, redirect to dashboard
- Error handling: Display "Invalid email or password" message
- Link to forgot password and registration pages

**Forgot Password Page (`/forgot-password`)**
- Form field: Email
- On submit: POST to `/api/auth/forgot-password`, show success message
- Success message: "If that email exists, we've sent a reset link" (generic for security)
- For MVP: Display reset link in browser console (since no email sending yet)

**Reset Password Page (`/reset-password?token=xyz`)**
- Extract token from URL query parameter
- Form fields: New Password, Confirm Password
- On submit: POST to `/api/auth/reset-password` with token and new password
- On success: Redirect to login page with success message
- On error: Show error (token expired, invalid token)

**Auth Context/Hook**
- Create React Context to store: `{ user, token, isAuthenticated, login, logout, register }`
- `login(email, password)` - Call login API, store token, update context
- `logout()` - Clear token from localStorage, redirect to login
- `register(email, password, displayName)` - Call register API, store token, update context
- Check token on app mount, auto-logout if expired

**Protected Route Wrapper**
- Higher-order component or hook to protect dashboard routes
- Check if user is authenticated, redirect to `/login` if not
- Add token to API requests via Axios/Fetch interceptor: `Authorization: Bearer <token>`

## Visual Design

**Styling Approach**
- Modern, clean authentication forms using Tailwind CSS v4
- Use shadcn/ui form components for consistency
- Primary layout: Centered card on gradient background
- Form validation: Inline error messages below fields (red text)
- Success states: Green checkmark icon + message
- Loading states: Disabled button with spinner during API calls

**Responsive Design**
- Mobile: Full-width form with padding
- Desktop: Card (max-width 400px) centered on page
- Consistent spacing using Tailwind tokens

## Security Considerations

**Password Security**
- Use bcryptjs with salt rounds: 10 (balance between security and performance)
- Never return password hash in API responses
- Enforce minimum password length: 8 characters (consider strength meter in v2)

**Token Security**
- Store JWT in localStorage (for MVP; consider httpOnly cookies in v2)
- Set token expiry to 7 days
- Validate token on every protected request
- Use strong JWT secret (min 32 random characters)

**API Security**
- Rate limiting: Max 5 login attempts per email per 15 minutes (implement in v1.0)
- Generic error messages for login/password reset to prevent user enumeration
- CORS: Configure allowed origins (frontend URL only)
- Sanitize inputs to prevent SQL injection (Prisma handles this)

**Reset Token Security**
- Generate cryptographically secure random tokens (32 bytes)
- Hash tokens before storing in database (same as passwords)
- Set expiry to 1 hour
- Invalidate token after use

## Existing Code to Leverage

**No existing authentication code** - This is a fresh implementation.

**Future Reusable Patterns**
- Express middleware pattern for auth will be reusable for other protected routes
- Form validation pattern (React Hook Form + Zod) can be reused for module forms
- API request interceptor pattern can be extended for other features

## Out of Scope

- OAuth authentication (Google, GitHub) - Defer to v1.0
- Email verification on signup - Defer to v1.0
- Actual email sending for password reset - MVP logs to console only
- Two-factor authentication (2FA) - Future enhancement
- Session management with refresh tokens - Using simple JWT for MVP
- Password strength meter - Defer to v1.0
- Account deletion - Not in MVP
- User profile pictures - Not in MVP
- Rate limiting on endpoints - Defer to v1.0
- Remember me functionality - Checkbox present but not functional in MVP
- Admin user roles/permissions - Not needed for MVP
