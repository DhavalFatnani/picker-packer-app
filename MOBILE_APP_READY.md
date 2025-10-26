# Mobile App - Ready for Testing

## ✅ Setup Complete

The mobile app is now ready for testing on your physical device!

## How to Test on Your Phone

### 1. Start the Mobile App

From the terminal, run:
```bash
cd /Users/abcom/Downloads/KNOT/picker-packer-app
yarn dev:mobile
```

Or directly:
```bash
cd mobile
yarn start
```

### 2. Scan QR Code

- **iOS**: Open the Camera app and scan the QR code
- **Android**: Open the Expo Go app and scan the QR code

### 3. Install Expo Go (if not already installed)

- **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 4. Ensure Same Network

Make sure your phone and computer are on the same WiFi network.

## Test Credentials

**Picker-Packer Account:**
- Phone: `+15550000001`
- PIN: `123456`
- Employee ID: `PP-WH2-178163`

**Area Supervisor Manager:**
- Phone: `+15552000001`
- PIN: `123456`

## What You Can Test

### ✅ Authentication Flow
- [ ] Sign up with name and phone
- [ ] View generated employee ID
- [ ] See pending approval screen
- [ ] Login with approved credentials
- [ ] PIN authentication (6 digits)

### ✅ Dashboard
- [ ] User greeting with name
- [ ] Employee ID display
- [ ] Shift status card
- [ ] Summary cards (completed/pending tasks)
- [ ] Task list
- [ ] Announcements
- [ ] Logout functionality

### ✅ Navigation
- [ ] Tab navigation (Dashboard, Scan, Exceptions)
- [ ] Back navigation
- [ ] Route protection

### ✅ API Integration
- [ ] Tasks load from backend
- [ ] Announcements display
- [ ] User data loads
- [ ] Error handling

## Troubleshooting

### App Won't Connect

1. **Check API URL**: Ensure `mobile/src/services/api.ts` has your computer's IP:
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://192.168.31.10:3000' // Your computer's IP
     : 'https://api.pickerpacker.com';
   ```

2. **Check Backend**: Ensure backend is running:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Same Network**: Ensure phone and computer on same WiFi

4. **Firewall**: Check if firewall is blocking connections

### Asset Errors

If you see asset errors:
```bash
cd mobile/assets
cp icon.png splash.png
```

### Dependency Issues

If packages are outdated:
```bash
cd mobile
yarn install
yarn start --clear
```

## Known Issues

1. **Expo Version Mismatch**: Some packages show warnings but should still work
2. **Camera Not Implemented**: Scanner screen is placeholder
3. **Offline Mode**: Basic implementation, full offline sync coming later

## Next Steps

After testing the mobile app:

1. **Continue Development**: Implement camera scanning, offline sync
2. **Build Web Dashboard**: React + Vite for ASM/Admin
3. **Add More Tests**: Extend backend test coverage
4. **Set Up CI/CD**: GitHub Actions workflow

## Support

For issues, check:
- `TESTING_GUIDE.md` - Comprehensive testing guide
- `README.md` - Project documentation
- Backend logs in terminal
- Mobile app logs in Expo

## Summary

✅ Mobile app is running and ready
✅ Backend is connected at 192.168.31.10:3000
✅ Test credentials provided
✅ Troubleshooting guide included

**Now scan the QR code and start testing!**
