# Multi-Tenant SaaS Frontend Architecture

## Overview

This is a production-ready, API-based frontend for a multi-tenant SaaS application built with Next.js, React, and TypeScript. The application communicates with a Laravel API backend and implements comprehensive authentication, authorization, and role-based access control.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Project Structure

```
/
├── app/
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── page.tsx                   # Landing page (redirects based on auth)
│   ├── login/page.tsx             # Login page
│   ├── register/page.tsx          # Registration page
│   ├── error.tsx                  # Error boundary page
│   ├── not-found.tsx              # 404 page
│   ├── unauthorized.tsx           # 403 page
│   ├── dashboard/
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   └── page.tsx               # Dashboard home page
│   └── admin/
│       ├── layout.tsx             # Admin layout (role-protected)
│       ├── tenants/page.tsx       # Tenant management
│       ├── roles/page.tsx         # Role management
│       └── permissions/page.tsx   # Permission management
├── components/
│   ├── Sidebar.tsx                # Main navigation sidebar
│   ├── ProtectedRoute.tsx         # Route protection wrapper
│   ├── TableActions.tsx           # Table action menu component
│   └── ui/                        # shadcn/ui components
├── context/
│   └── AuthContext.tsx            # Global auth state management
├── lib/
│   ├── types.ts                   # TypeScript types/interfaces
│   ├── api.ts                     # Axios API client setup
│   └── utils.ts                   # Utility functions
├── hooks/
│   └── use-mobile.ts              # Mobile detection hook
└── public/                        # Static assets
```

## Authentication Flow

### Login Process

1. User navigates to `/login`
2. Enters email, password, and tenant ID
3. Submits to `POST /api/login` with `X-Tenant-ID` header
4. API returns `access_token` and user data
5. Token and user info stored in localStorage
6. User redirected based on role:
   - `super-admin` → `/admin/tenants`
   - Other roles → `/dashboard`

### Registration Process

1. User navigates to `/register`
2. Enters tenant name, admin name, email, and password
3. Submits to `POST /api/register`
4. API creates tenant, admin user, and returns credentials
5. User redirected to login page
6. User can now login with created credentials

### Token Management

- Bearer tokens stored in localStorage
- Automatically included in all API requests via Axios interceptor
- `X-Tenant-ID` header included with every request
- Token cleared on logout or 401 response

## State Management

### AuthContext

The `AuthContext` provides global authentication state:

```typescript
{
  user: User | null,           // Current user info
  token: string | null,        // Bearer token
  isLoading: boolean,          // Auth state loading
  isAuthenticated: boolean,    // Boolean flag
  login: Function,             // Login method
  register: Function,          // Register method
  logout: Function,            // Logout method
}
```

### Usage

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

## API Integration

### API Client

The `apiClient` (Axios instance) automatically:
- Adds Bearer token to all requests
- Includes X-Tenant-ID header
- Handles 401 errors by logging out user
- Has methods for all main features:

```typescript
// Auth
apiClient.login(email, password, tenantId)
apiClient.register(tenantName, adminName, email, password)

// Tenants
apiClient.getTenants()
apiClient.createTenant(data)
apiClient.updateTenant(id, data)

// Roles
apiClient.getRoles()
apiClient.createRole(data)
apiClient.updateRole(id, data)

// Permissions
apiClient.getPermissions()
apiClient.createPermission(data)
```

## Route Protection

### ProtectedRoute Component

Wraps components that require authentication:

```typescript
<ProtectedRoute requiredRole="super-admin">
  <AdminPanel />
</ProtectedRoute>
```

Features:
- Redirects unauthenticated users to `/login`
- Redirects unauthorized users to `/unauthorized`
- Shows loading spinner while checking auth state
- Supports role-based access control

### Layout-Level Protection

Dashboard layout uses ProtectedRoute:

```typescript
// app/dashboard/layout.tsx
<ProtectedRoute>
  <div className="flex h-screen">
    <Sidebar />
    <main>{children}</main>
  </div>
</ProtectedRoute>
```

Admin layout requires super-admin role:

```typescript
// app/admin/layout.tsx
<ProtectedRoute requiredRole="super-admin">
  {/* Admin content */}
</ProtectedRoute>
```

## Features

### 1. Authentication Pages

- **Login**: Email, password, tenant ID with error handling
- **Register**: Create new tenant and admin account
- **Protected Routes**: Automatic redirects based on auth state

### 2. Dashboard

- Welcome message with user info
- Tenant information display
- Stats cards (Users, Permissions, Analytics)
- Getting started guide

### 3. Admin Panel (Super Admin Only)

#### Tenant Management
- List all tenants with status
- Create new tenants
- Edit tenant information
- Toggle tenant active/inactive status
- View creation date

#### Role Management
- List all roles per tenant
- Create new roles
- Assign permissions to roles via checkboxes
- View assigned permissions
- Edit role information

#### Permission Management
- List all system permissions
- Create new permissions with name, slug, and description
- Auto-generate slugs from names
- Assign permissions to roles

### 4. Navigation

- Responsive sidebar with mobile menu toggle
- Dynamic menu based on user role
- User info and logout button
- Active route highlighting

## Error Handling

### Error Page (`/app/error.tsx`)

Catches component-level errors:
- Shows error message
- Provides "Try Again" button to reset
- Link to dashboard

### 404 Page (`/app/not-found.tsx`)

Handles non-existent routes:
- Clean 404 message
- Link to dashboard

### 403 Page (`/app/unauthorized.tsx`)

Handles permission denials:
- Clear permission denied message
- Option to logout
- Link to dashboard

## Styling & Design

### Color Scheme

- Primary: Blue-600 (Actions)
- Background: Slate-900/800
- Text: White/Slate-300
- Borders: Slate-700
- Accents: Blue, Purple, Green, Red

### Components

All UI components from shadcn/ui:
- Button, Input, Label, Card
- Table, Dialog, Dropdown Menu
- Alert, Badge, Switch, Checkbox
- Textarea, Select, Tabs

### Responsive Design

- Mobile-first approach
- Sidebar collapsible on mobile
- Tables responsive with horizontal scroll
- Dialogs full-height on mobile

## Deployment

### Environment Variables

Create `.env.local`:

```env
REACT_APP_API_URL=https://your-api.com/api
```

### Build & Deploy

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
vercel deploy
```

## Security Considerations

1. **Token Storage**: Currently uses localStorage (consider httpOnly cookies for production)
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS on backend to match frontend domain
4. **Input Validation**: All form inputs are validated
5. **Error Messages**: Generic error messages avoid information leakage
6. **Role-Based Access**: Frontend enforces role restrictions; backend must also validate

## Future Enhancements

1. Implement httpOnly cookie storage for tokens
2. Add refresh token mechanism
3. Implement permission checking on individual actions
4. Add audit logging
5. Implement user management (invite, deactivate)
6. Add organization/team management
7. Implement activity dashboard
8. Add API key management for integrations

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### API Mocking

For development without a backend, mock the API responses in the apiClient or use MSW (Mock Service Worker).

## Troubleshooting

### Token Not Persisting

- Check localStorage in browser DevTools
- Verify auth_token and tenant_id keys exist
- Ensure AuthProvider wraps entire app

### Unauthorized Redirect

- Verify user role matches required role
- Check API returns correct user.role
- Verify requiredRole prop in ProtectedRoute

### API Calls Failing

- Check CORS settings on backend
- Verify REACT_APP_API_URL is correct
- Check network tab for request details
- Verify Bearer token format in headers

## Support

For issues, questions, or feature requests, please contact the development team or check the project documentation.
