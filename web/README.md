# PickerPacker Admin Dashboard

Admin web dashboard for managing warehouse operations. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: Login with phone and PIN
- **Pending Approvals**: ASM can approve/reject new user signups
- **Geofence Management**: Ops Admin can configure warehouse location coordinates and geofence radius
- **Dashboard**: Overview of operations with quick access to key features

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Backend API running on `http://localhost:3000`

### Installation

```bash
cd web
yarn install
```

### Development

```bash
yarn dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
yarn build
```

## Test Credentials

- **ASM**: 
  - Phone: `+15552000001`
  - PIN: `123456`
  
- **Ops Admin**: 
  - Phone: `+15553000001`
  - PIN: `123456`

## Pages

### Login Page (`/login`)
- Authentication with phone and PIN
- Error handling and validation

### Dashboard (`/dashboard`)
- Quick access to all features
- Summary cards for key operations
- Role-based access control

### Pending Approvals (`/approvals`)
- View pending user signups
- Approve or reject users
- Display user details (name, employee ID, phone, warehouse)

### Geofence Management (`/geofence`) - Ops Admin Only
- View all geofence settings
- Add new warehouse geofence settings
- Edit existing settings (coordinates, radius, enabled status)
- Delete geofence settings
- Each setting includes:
  - Warehouse code
  - Latitude/Longitude
  - Radius in meters
  - Enabled/Disabled status

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Shared Types** - From `@pp/shared` workspace

## Project Structure

```
web/
├── src/
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PendingApprovalsPage.tsx
│   │   └── GeofenceManagementPage.tsx
│   ├── services/        # API services
│   │   └── api.ts
│   ├── utils/           # Utilities
│   │   └── auth.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Integration

All API calls are proxied through Vite dev server to `http://localhost:3000/api`

### Available APIs

- `POST /api/auth/login` - Login
- `GET /api/admin/pending-approvals` - Get pending users
- `POST /api/admin/approve/:id` - Approve/reject user
- `GET /api/admin/geofence-settings` - List all geofence settings
- `POST /api/admin/geofence-settings` - Create/update setting
- `DELETE /api/admin/geofence-settings/:warehouse` - Delete setting

## Authentication Flow

1. User logs in with phone and PIN
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. All subsequent requests include token in Authorization header
5. On 401 response, user is redirected to login

## Protected Routes

Routes are protected based on user role:
- `/dashboard` - ASM, OpsAdmin
- `/approvals` - ASM, OpsAdmin
- `/geofence` - OpsAdmin only

Users without required role are redirected to dashboard.

## Environment Variables

Create `.env` file for environment-specific config:

```env
VITE_API_URL=http://localhost:3000
```

## Future Enhancements

- [ ] Packing queue management
- [ ] Exception resolution
- [ ] Announcements management
- [ ] Shift history and analytics
- [ ] User management
- [ ] Reports and exports
