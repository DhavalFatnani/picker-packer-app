# PickerPacker Testing Guide

## Mobile App Testing on Physical Device

### Prerequisites
1. Install Expo Go app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Ensure your phone and computer are on the same WiFi network

3. Update API URL in `mobile/src/services/api.ts` with your computer's IP (already configured)

### Start Mobile App

```bash
# From project root
cd mobile
yarn start
```

Or from root:
```bash
yarn dev:mobile
```

### Connect to Device

1. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

2. The app will load on your device

### Test Credentials

**Approved Picker-Packer:**
- Phone: `+15550000001`
- PIN: `123456`
- Employee ID: `PP-WH2-178163`

**Area Supervisor Manager:**
- Phone: `+15550010001`
- PIN: `123456`

**Pending User (for approval testing):**
- Phone: Will be generated on signup
- PIN: Set during approval

## Manual Testing Steps

### 1. Authentication Flow
- [ ] Sign up with name and phone
- [ ] Verify employee ID is generated
- [ ] Check pending approval screen
- [ ] Login with approved credentials
- [ ] Verify token is stored securely

### 2. Dashboard
- [ ] View user greeting and employee ID
- [ ] Check shift status
- [ ] View task summary cards
- [ ] See task list
- [ ] View announcements
- [ ] Test logout

### 3. Navigation
- [ ] Switch between tabs
- [ ] Test back navigation
- [ ] Verify protected routes

### 4. API Integration
- [ ] Load tasks from backend
- [ ] Load announcements
- [ ] Verify error handling
- [ ] Test offline behavior (airplane mode)

## Backend API Tests

### Run Backend Tests

```bash
cd backend
yarn test
```

### Manual API Testing

Test all endpoints with curl:

#### 1. Health Check
```bash
curl http://localhost:3000/health
```

#### 2. Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "phone": "+19999999999"}'
```

#### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+15550000001", "pin": "123456"}'
```

Save the token from login response.

#### 4. Get Tasks (protected)
```bash
TOKEN="your_token_here"
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Start Shift
```bash
curl -X POST http://localhost:3000/api/shifts/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warehouse": "WH2", "gps": {"latitude": 37.7749, "longitude": -122.4194}}'
```

#### 6. Get Announcements
```bash
curl http://localhost:3000/api/admin/announcements \
  -H "Authorization: Bearer $TOKEN"
```

#### 7. Approve User
```bash
curl -X POST "http://localhost:3000/api/admin/approve/USER_ID?action=approve" \
  -H "Authorization: Bearer $TOKEN"
```

## End-to-End Test Scenario

### Complete Workflow Test

1. **Signup Flow**
   - Open mobile app
   - Sign up with new credentials
   - Note employee ID

2. **Approval Flow** (via web or admin API)
   - Get pending users list
   - Approve the newly created user

3. **Login Flow**
   - Login with approved credentials
   - Verify dashboard loads

4. **Task Management**
   - View assigned tasks
   - Check task details
   - Verify task status

5. **Exception Handling**
   - Test exception creation
   - Verify exception appears in list

## Performance Testing

### Load Testing
```bash
# Install artillery (optional)
npm install -g artillery

# Run load test
artillery quick --count 10 --num 100 http://localhost:3000/api/tasks
```

### Response Time Checks
- All API endpoints should respond within 200ms
- Mobile app screens should load within 1s
- Database queries should complete within 50ms

## Security Testing

### Checklist
- [ ] PIN is hashed with bcrypt
- [ ] JWT tokens expire correctly
- [ ] Protected routes reject unauthorized requests
- [ ] Sensitive data not logged
- [ ] SQL injection attempts blocked
- [ ] CORS properly configured

## Known Issues & Limitations

1. **Geo-fencing**: Currently uses hardcoded location for testing
2. **Camera**: Placeholder implementation, needs Expo Camera integration
3. **Offline Sync**: Basic implementation, full offline queue coming in Phase 5
4. **Biometric Auth**: Not yet implemented (Phase 4)

## Troubleshooting

### Mobile app won't connect
1. Verify both devices on same network
2. Check API URL in `mobile/src/services/api.ts`
3. Ensure backend is running
4. Try restarting Expo server

### Backend errors
1. Check database exists: `ls -la backend/data/`
2. Verify seed data: Check for users in database
3. Check CORS settings for your IP

### Build errors
```bash
# Clean and rebuild
cd mobile
rm -rf node_modules
yarn install
yarn start --clear
```

## Test Coverage Report

Run coverage reports:
```bash
cd backend
yarn test --coverage
```

Current target: 80% coverage

## Reporting Issues

When reporting bugs, include:
1. Device/OS information
2. Steps to reproduce
3. Expected vs actual behavior
4. Console logs/error messages
5. Network connectivity status
