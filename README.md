# PickerPacker Warehouse Operations System

A complete cross-platform warehouse operations system with mobile app, web dashboard, and backend API for managing warehouse picker-packer operations.

## 🏗️ Architecture

```
picker-packer-app/
├── backend/          # Node.js + Express + TypeScript API
├── mobile/           # React Native + Expo mobile app (iOS/Android)
├── web/              # React + Vite web dashboard
└── shared/           # Shared TypeScript types and constants
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn package manager
- Expo CLI (for mobile development)
- iOS Simulator or Android Emulator (for mobile testing)

### Installation

1. **Clone and install dependencies:**
```bash
yarn install
```

2. **Start backend server:**
```bash
yarn workspace @pp/backend dev
```
Backend will be available at `http://localhost:3000`

3. **Start mobile app:**
```bash
yarn workspace @pp/mobile start
```

4. **Start web dashboard:**
```bash
yarn workspace @pp/web dev
```
Web dashboard will be available at `http://localhost:5173`

## 📦 Features

### Mobile App (Picker-Packer)
- ✅ User signup with auto-generated employee ID
- ✅ PIN login
- ✅ Dashboard with user info
- ✅ Task listing
- ✅ Shift management UI
- 🔜 Shift start/end with geo-fence
- 🔜 Barcode scanning
- 🔜 Task details and completion
- 🔜 Exception reporting
- 🔜 Offline-first architecture

### Web Dashboard (ASM/Admin)
- 🔜 User approval workflow
- 🔜 Packing queue management
- 🔜 Putaway operations
- 🔜 Exception resolution
- 🔜 Announcements management

### Backend API
- ✅ RESTful API with TypeScript
- ✅ SQLite database with better-sqlite3
- ✅ JWT authentication
- ✅ Mock data seeding
- ✅ Error handling with standardized error codes
- ✅ All core endpoints (auth, shifts, tasks, exceptions, admin)
- 🔜 Swagger API documentation

## 🗄️ Database

The system uses SQLite for both backend and mobile apps. Database is automatically initialized and seeded on first run.

**Seed Data:**
- 10 Picker-Packers (8 approved, 2 pending)
- 2 Area Supervisors
- 1 Operations Admin
- 100 SKUs
- 500 Lock Tags
- 50 Bins (WH1 and WH2)
- 20 Tasks
- Default PIN: `123456`

## 🔐 Authentication

### Default Test Credentials

**Picke Picker (Mobile App):**
- Phone: `+15550000001`
- PIN: `123456`

**ASM (Web Dashboard):**
- Phone: `+15552000001`
- PIN: `123456`

**Ops Admin:**
- Phone: `+15553000001`
- PIN: `123456`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Sign up new user
- `POST /api/auth/login` - Login with phone and PIN
- `GET /api/auth/status` - Get current user status

### Admin/Seed (Development)
- `POST /api/seed` - Seed database with test data

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run backend tests
yarn workspace @pp/backend test

# Run frontend tests
yarn workspace @pp/web test
```

## 📝 Development Guidelines

### Code Quality
- Follow `.cursorrules` for coding standards
- Run `yarn lint` before committing
- Run `yarn format` to auto-format code
- Write tests for all new features

### Git Workflow
- Use conventional commit messages
- Format: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🚧 Current Status

### ✅ Completed
- Project foundation and monorepo setup
- Shared types and constants
- Backend API with all core endpoints (auth, shifts, tasks, exceptions, admin)
- Database schema and seeding with mock data
- Authentication with JWT
- Error handling with standardized codes
- Code quality standards
- Mobile app authentication and dashboard
- Basic task listing

### 🚧 In Progress
- Mobile app advanced features (scanner, shift management)
- Web dashboard

### 📋 TODO
- Mobile: Barcode scanning
- Mobile: Shift start/end with location
- Mobile: Task completion flow
- Mobile: Offline sync
- Web: ASM approval workflow
- Web: Dashboard UI
- Web: Packing queue management
- Swagger API documentation
- Comprehensive test coverage
- CI/CD pipeline

## 📚 Documentation

- [API Documentation](./backend/README.md)
- [Mobile App Guide](./mobile/README.md)
- [Web Dashboard Guide](./web/README.md)

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

Built with modern web and mobile technologies:
- React Native & Expo for mobile
- React & Vite for web
- Node.js & Express for backend
- TypeScript for type safety
- SQLite for data persistence
