# 🤖 Robot Icon Fix Guide

## The Problem
Your robot icon isn't showing up because we need to:
1. Create properly sized icon variants
2. Replace the existing icon files
3. Rebuild the apps

## Quick Fix Steps

### Step 1: Add Your Robot Image
1. Save your robot image as `robot-icon.png`
2. Place it in `public/lovable-uploads/robot-icon.png`

### Step 2: Run the Fix Script
```bash
./scripts/fix-robot-icon.sh
```

This script will:
- ✅ Check if ImageMagick is installed (install if needed)
- ✅ Create 12 different web icon sizes (16x16 to 180x180)
- ✅ Create iOS icon (1024x1024)
- ✅ Create Android icons for all densities (48x48 to 192x192)
- ✅ Create Open Graph image for social sharing

### Step 3: Rebuild Everything
```bash
npm run build
export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8
npx cap sync ios
npx cap sync android
```

### Step 4: Test
- **Web**: Check browser tab for new icon
- **iOS**: Build in Xcode and check home screen
- **Android**: Build APK and check home screen

## Manual Alternative (if script doesn't work)

If you prefer to do it manually:

### Web Icons
Create these sizes in `public/lovable-uploads/`:
- `robot-icon-16x16.png`
- `robot-icon-32x32.png`
- `robot-icon-57x57.png`
- `robot-icon-60x60.png`
- `robot-icon-72x72.png`
- `robot-icon-76x76.png`
- `robot-icon-114x114.png`
- `robot-icon-120x120.png`
- `robot-icon-144x144.png`
- `robot-icon-152x152.png`
- `robot-icon-167x167.png`
- `robot-icon-180x180.png`
- `robot-og-image.png` (1200x630)

### iOS Icon
Place `robot-icon.png` (1024x1024) in:
`ios/App/App/Assets.xcassets/AppIcon.appiconset/robot-icon.png`

### Android Icons
For each directory in `android/app/src/main/res/mipmap-*/`:
- Replace `ic_launcher.png`
- Replace `ic_launcher_foreground.png`
- Replace `ic_launcher_round.png`

## Troubleshooting

### Icon Still Not Showing?
1. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
2. **Check file paths** - make sure files are in correct directories
3. **Verify file sizes** - icons should be square (same width/height)
4. **Check console errors** - look for 404 errors for missing icon files

### iOS Issues?
1. **Clean Xcode build folder** (Cmd+Shift+K)
2. **Delete derived data** in Xcode preferences
3. **Rebuild project** from scratch

### Android Issues?
1. **Clean Gradle cache**: `cd android && ./gradlew clean`
2. **Rebuild APK**: `./gradlew assembleDebug`
3. **Uninstall old app** from device before installing new one

## File Structure After Fix
```
public/lovable-uploads/
├── robot-icon.png (original)
├── robot-icon-16x16.png
├── robot-icon-32x32.png
├── ... (all sizes)
└── robot-og-image.png

ios/App/App/Assets.xcassets/AppIcon.appiconset/
└── robot-icon.png (1024x1024)

android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_foreground.png
│   └── ic_launcher_round.png
└── ... (all density folders)
```

## Success Indicators
- ✅ Browser tab shows robot icon
- ✅ iOS home screen shows robot icon
- ✅ Android home screen shows robot icon
- ✅ Social sharing shows robot image
- ✅ App splash screen has robot branding
