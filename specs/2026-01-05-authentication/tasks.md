# Implementation Tasks: User Authentication

> **Spec**: [spec.md](./spec.md)

## Overview
This document breaks down the authentication specification into granular, implementable tasks grouped by specialty. Tasks are ordered following TDD principles where applicable.

---

## 1. Database & Schema Setup

### Prisma Schema
- [x] Install Prisma dependencies (`prisma`, `@prisma/client`, `@prisma/adapter-pg`)
- [x] Initialize Prisma (`npx prisma init`)
- [x] Configure PostgreSQL connection in `.env` with Supabase/Neon URL
- [x] Create User model in `prisma/schema.prisma` with all fields (id, email, passwordHash, displayName, resetToken, resetTokenExpiry, createdAt, updatedAt)
- [x] Add unique constraint on email field
- [ ] Run `npx prisma migrate dev --name init_users_table` to create migration
- [x] Generate Prisma Client (`npx prisma generate`)
- [x] Create `src/lib/prisma.ts` with PrismaClient initialization using `@prisma/adapter-pg`

---

## 2. Backend - Dependencies & Setup

### Project Initialization
- [x] Initialize backend project: `npm init -y` in `backend/` directory
- [x] Install core dependencies: `express`, `typescript`, `@types/node`, `@types/express`, `tsx`, `dotenv`
- [x] Install auth dependencies: `bcryptjs`, `@types/bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`
- [x] Create `tsconfig.json` with strict mode enabled
- [x] Create `.env` file with: `DATABASE_URL`, `JWT_SECRET` (32+ char random string), `PORT`
- [x] Create `src/server.ts` with basic Express app setup
- [x] Add CORS middleware configuration
- [x] Add JSON body parser middleware
- [x] Create start script in `package.json`: `"dev": "tsx watch src/server.ts"`

### Utilities
- [x] Create `src/utils/jwt.ts` with `generateToken()` and `verifyToken()` functions
- [x] Create `src/utils/validation.ts` with email regex validator
- [x] Create `src/utils/crypto.ts` with `hashPassword()` and `comparePassword()` wrappers for bcryptjs

---

## 3. Backend - Authentication Routes

### Registration Endpoint
- [x] Create `src/routes/auth.routes.ts` file
- [x] Create POST `/api/auth/register` route handler
- [x] Validate request body (email, password, displayName) using Zod or manual validation
- [x] Check email format with regex validator
- [x] Convert email to lowercase before checking database
- [x] Check if email already exists in database (return 400 if duplicate)
- [x] Validate password length (min 8 chars)
- [x] Hash password with bcryptjs (salt rounds: 10)
- [x] Create user in database with Prisma
- [x] Generate JWT token with userId and email payload
- [x] Return response: `{ token, user: { id, email, displayName, createdAt } }`
- [x] Add error handling for database errors

### Login Endpoint
- [x] Create POST `/api/auth/login` route handler
- [x] Validate request body (email, password)
- [x] Query user by email (case-insensitive)
- [x] Return generic error if user not found: "Invalid email or password"
- [x] Compare password hash using bcryptjs
- [x] Return same generic error if password doesn't match
- [x] Generate JWT token with 7-day expiry
- [x] Return response: `{ token, user: { id, email, displayName, createdAt } }`
- [x] Exclude passwordHash and resetToken from response

### Password Reset - Request
- [x] Create POST `/api/auth/forgot-password` route handler
- [x] Validate email in request body
- [x] Query user by email
- [x] Generate reset token: `crypto.randomBytes(32).toString('hex')`
- [x] Hash reset token before storing
- [x] Set resetTokenExpiry to 1 hour from now
- [x] Update user record with hashed resetToken and expiry
- [x] Log reset link to console: `http://localhost:3000/reset-password?token=<token>`
- [x] Always return success message (even if email doesn't exist)

### Password Reset - Complete
- [x] Create POST `/api/auth/reset-password` route handler
- [x] Validate request body (token, newPassword)
- [x] Hash the provided token for comparison
- [x] Query user by hashed resetToken
- [x] Check if resetTokenExpiry is still valid (not expired)
- [x] Return error if token invalid or expired
- [x] Validate new password length (min 8 chars)
- [x] Hash new password
- [x] Update user: set new passwordHash, clear resetToken and resetTokenExpiry
- [x] Return success message

---

## 4. Backend - Protected Routes & Middleware

### Auth Middleware
- [x] Create `src/middleware/auth.middleware.ts` file
- [x] Create `authenticateToken` middleware function
- [x] Extract token from `Authorization` header (format: `Bearer <token>`)
- [x] Return 401 if no token provided
- [x] Verify token using JWT secret
- [x] Return 401 if token invalid or expired
- [x] Decode token to get userId and email
- [x] Attach `req.user = { userId, email }` to request object
- [x] Call `next()` if successful
- [x] Add TypeScript type extension for `req.user`

### Profile Endpoints
- [x] Create GET `/api/auth/me` route with auth middleware
- [x] Query user by userId from `req.user`
- [x] Return user profile excluding passwordHash and resetToken
- [x] Return 404 if user not found

- [x] Create PATCH `/api/auth/profile` route with auth middleware
- [x] Validate displayName in request body (1-50 chars)
- [x] Update user's displayName using Prisma
- [x] Return updated user profile

- [x] Create POST `/api/auth/change-password` route with auth middleware
- [x] Validate request body (currentPassword, newPassword)
- [x] Query user by userId
- [x] Compare currentPassword with stored hash
- [x] Return error if currentPassword incorrect
- [x] Hash newPassword
- [x] Update user's passwordHash
- [x] Return success message

### Route Registration
- [x] Register auth routes in `src/server.ts`: `app.use('/api/auth', authRoutes)`
- [ ] Test all endpoints with Postman/Thunder Client

---

## 5. Frontend - Project Setup

### Vite + React + TypeScript
- [x] Initialize frontend: `npm create vite@latest frontend -- --template react-ts`
- [x] Install dependencies: `cd frontend && npm install`
- [x] Install Tailwind CSS v4: `npm install -D @tailwindcss/vite`
- [x] Configure Vite plugin in `vite.config.ts` with `@tailwindcss/vite`
- [x] Create `src/index.css` with Tailwind directives
- [x] Install routing: `npm install react-router-dom`
- [x] Install form library: `npm install react-hook-form zod @hookform/resolvers`
- [x] Install HTTP client: `npm install axios`
- [ ] Install shadcn/ui: `npx shadcn@latest init` (choose Tailwind v4 compatible settings)
- [ ] Add button, input, label, form components from shadcn/ui

---

## 6. Frontend - Auth Context & API

### Auth Context
- [x] Create `src/contexts/AuthContext.tsx`
- [x] Define AuthContext type: `{ user, token, isAuthenticated, loading, login, logout, register }`
- [x] Create AuthProvider component with useState for user and token
- [x] Implement `login(email, password)` function (calls API, stores token in localStorage)
- [x] Implement `register(email, password, displayName)` function
- [x] Implement `logout()` function (clears localStorage, resets state)
- [x] Check localStorage for token on mount, verify validity
- [x] If token exists and valid, fetch user profile
- [x] Create custom hook: `useAuth()` to access context
- [x] Wrap app with AuthProvider in `src/main.tsx`

### API Client
- [x] Create `src/lib/api.ts` with axios instance
- [x] Set base URL from environment variable
- [x] Create axios request interceptor to add `Authorization: Bearer <token>` header
- [x] Create axios response interceptor to handle 401 (auto-logout)
- [x] Export API functions: `registerUser()`, `loginUser()`, `forgotPassword()`, `resetPassword()`, `getCurrentUser()`, `updateProfile()`, `changePassword()`

---

## 7. Frontend - Authentication Pages

### Registration Page
- [x] Create `src/pages/RegisterPage.tsx`
- [x] Create form with React Hook Form: email, password, confirmPassword, displayName
- [x] Add Zod schema for validation (email format, password min 8, passwords match, displayName 1-50 chars)
- [x] Add shadcn/ui form components
- [x] Implement onSubmit: call `register()` from auth context
- [x] Store token in localStorage on success
- [x] Redirect to `/dashboard` after successful registration
- [x] Display backend errors below form fields
- [x] Add link to login page: "Already have an account? Log in"
- [x] Style with Tailwind: centered card, gradient background

### Login Page
- [x] Create `src/pages/LoginPage.tsx`
- [x] Create form with React Hook Form: email, password
- [x] Add "Remember me" checkbox (non-functional for MVP)
- [x] Add Zod schema for validation
- [x] Implement onSubmit: call `login()` from auth context
- [x] Redirect to `/dashboard` on success
- [x] Display error message: "Invalid email or password"
- [x] Add links: "Forgot password?" and "Don't have an account? Register"
- [x] Style with Tailwind

### Forgot Password Page
- [x] Create `src/pages/ForgotPasswordPage.tsx`
- [x] Create form with email field only
- [x] Implement onSubmit: call `forgotPassword()` API function
- [x] Show success message regardless of response (prevents email enumeration)
- [x] Add note about checking console for reset link (MVP only)
- [x] Add link back to login page

### Reset Password Page
- [x] Create `src/pages/ResetPasswordPage.tsx`
- [x] Extract token from URL query params (`?token=...`)
- [x] Create form with newPassword and confirmPassword fields
- [x] Validate passwords match
- [x] Implement onSubmit: call `resetPassword(token, newPassword)`
- [x] Show error if token invalid or expired
- [x] Redirect to login on success with success message
- [x] Handle missing token in URL gracefully
- [x] Style with Tailwind

---

## 8. Frontend - Protected Routes

### Route Protection
- [x] Create `src/components/ProtectedRoute.tsx`
- [x] Use `useAuth()` to check `isAuthenticated`
- [x] If not authenticated, redirect to `/login`
- [x] If authenticated, render children (Outlet)
- [x] Show loading spinner while checking auth status

### Router Setup
- [x] Create `src/App.tsx` with React Router
- [x] Define routes: `/register`, `/login`, `/forgot-password`, `/reset-password`, `/dashboard` (protected)
- [x] Wrap `/dashboard` with ProtectedRoute
- [x] Create placeholder dashboard page: `src/pages/DashboardPage.tsx` with "Welcome {user.displayName}" message
- [x] Add logout button in dashboard

---

## 9. Frontend - Styling & Polish

### Tailwind Styling
- [x] Style all auth forms: max-width 400px, centered, card with shadow
- [x] Add gradient background to auth pages
- [x] Style input fields with focus rings (Tailwind ring utilities)
- [x] Style buttons: primary (blue), destructive (red)
- [x] Add loading spinner component for submit buttons
- [x] Style error messages: red text, small font, icon
- [x] Add responsive design: mobile full-width, desktop centered

### UX Improvements
- [x] Add loading states to all form submit buttons (disabled + spinner)
- [ ] Add success toast notifications (install `sonner` or similar)
- [ ] Add smooth transitions between pages
- [x] Disable form during submission
- [ ] Clear form on successful submission
- [x] Auto-focus first input field on page load

---

## 10. Testing & Verification

### Manual Testing
- [ ] Test registration flow: create account, verify token stored, redirect works
- [ ] Test login flow: login with created account, verify dashboard access
- [ ] Test logout: clear token, redirect to login, dashboard inaccessible
- [ ] Test forgot password: submit email, verify console log shows reset link
- [ ] Test reset password: use token from console, set new password, login with new password
- [ ] Test protected routes: try accessing dashboard without login (should redirect)
- [ ] Test profile update: change display name, verify persistence
- [ ] Test change password: change password, logout, login with new password
- [ ] Test validation errors: empty fields, invalid email, password mismatch, weak password
- [ ] Test error handling: duplicate email on registration, wrong credentials on login

### Edge Cases
- [ ] Test expired reset token (manually set expiry in past)
- [ ] Test invalid reset token (use random string)
- [ ] Test expired JWT (manually set expiry to past, verify auto-logout)
- [ ] Test concurrent logins (login on two devices/browsers)

### Security Verification
- [ ] Verify passwords are hashed in database (not plaintext)
- [ ] Verify reset tokens are hashed in database
- [ ] Verify JWT secret is loaded from environment variable
- [ ] Verify API returns generic errors for login failures
- [ ] Verify CORS is configured correctly

---

## Implementation Order Recommendation

**Phase 1: Backend Foundation (Days 1-2)**
1. Database & Schema Setup
2. Backend Dependencies & Setup
3. Authentication Routes (register, login)
4. Test with Postman

**Phase 2: Password Reset (Day 3)**
5. Password reset endpoints (request + complete)
6. Test with Postman

**Phase 3: Protected Routes (Day 4)**
7. Auth Middleware
8. Profile endpoints
9. Test with Postman

**Phase 4: Frontend Foundation (Days 5-6)**
10. Frontend Project Setup
11. Auth Context & API Client
12. Registration and Login pages
13. Test end-to-end

**Phase 5: Complete Auth Flow (Day 7)**
14. Forgot/Reset Password pages
15. Protected Routes
16. Dashboard placeholder

**Phase 6: Polish (Day 8)**
17. Styling & UX improvements
18. Testing & verification
19. Bug fixes

**Estimated Total**: 8-10 days for MVP authentication system
