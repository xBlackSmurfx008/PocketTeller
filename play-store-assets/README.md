# Play Store Assets

This folder contains all assets needed for Google Play Store submission.

## 📁 Structure

```
play-store-assets/
├── screenshots/          # App screenshots (capture using script)
├── graphics/            # Feature graphic and icons
│   ├── app-icon-source.png      # ✅ Ready (512x512 needed for upload)
│   ├── feature-graphic.png      # ❌ TO DO: Create this
│   └── FEATURE_GRAPHIC_SPECS.md # Design specifications
└── descriptions/        # Text content for store listing
    ├── short-description.txt    # ✅ Ready (80 chars)
    ├── full-description.txt     # ✅ Ready (4000 chars)
    ├── release-notes.txt        # ✅ Ready
    └── screenshot-captions.txt  # ✅ Ready
```

## ✅ Ready to Use

### Descriptions
All text content is written and ready to copy-paste into Play Console:
- `descriptions/short-description.txt` - Store listing short description
- `descriptions/full-description.txt` - Store listing full description
- `descriptions/release-notes.txt` - What's new in this version
- `descriptions/screenshot-captions.txt` - Captions for each screenshot

### App Icon
- `graphics/app-icon-source.png` - App icon from Android res folder
- **Note:** You'll need to create a 512x512 version for Play Console upload

## ❌ To Do

### 1. Screenshots (15-20 minutes)
Run the automated capture script:
```bash
cd ../scripts
./capture-android-screenshots.sh
```

Or capture manually using ADB. Screenshots will be saved to `screenshots/` folder.

**Required:** 4-8 screenshots showing:
1. Welcome/Auth screen
2. Dashboard
3. Accounts view
4. Transactions list
5. Budget/Goals
6. AI Coaching
7. Spending Insights
8. Settings (optional)

### 2. Feature Graphic (20-30 minutes)
Create a 1024x500 banner image for the Play Store listing.

**Specifications:**
- Size: 1024 x 500 px (exactly)
- Format: PNG or JPEG
- See: `graphics/FEATURE_GRAPHIC_SPECS.md` for complete guide

**Tools:**
- [Canva](https://canva.com) - Easiest option
- Figma
- Photoshop/GIMP

**Save as:** `graphics/feature-graphic.png`

### 3. App Icon for Play Console (5 minutes)
Create a 512x512 version of the app icon:

**Option A: Online tool**
1. Go to: https://www.iloveimg.com/resize-image
2. Upload: `graphics/app-icon-source.png`
3. Resize to 512x512
4. Download and save as: `graphics/app-icon-512.png`

**Option B: Command line (ImageMagick)**
```bash
cd graphics
convert app-icon-source.png -resize 512x512 app-icon-512.png
```

## 📋 Checklist

Before uploading to Play Console:

- [ ] 4-8 screenshots captured and in `screenshots/` folder
- [ ] Feature graphic created (1024x500) and saved as `feature-graphic.png`
- [ ] App icon resized to 512x512 and saved as `app-icon-512.png`
- [ ] All descriptions reviewed and ready to copy
- [ ] Privacy policy live at: https://pocketbanker.app/privacy
- [ ] Terms of service live at: https://pocketbanker.app/terms

## 🚀 Upload Order

When uploading to Google Play Console:

1. **Store Listing → Graphics**
   - Upload: `graphics/app-icon-512.png` (App icon)
   - Upload: `graphics/feature-graphic.png` (Feature graphic)
   - Upload: All files from `screenshots/` folder

2. **Store Listing → Text**
   - Copy from: `descriptions/short-description.txt`
   - Copy from: `descriptions/full-description.txt`

3. **Release → Release Notes**
   - Copy from: `descriptions/release-notes.txt`

## 📖 Resources

- **Full deployment guide:** `../GOOGLE_PLAY_STORE_DEPLOYMENT.md`
- **Quick start guide:** `../PLAY_STORE_QUICK_START.md`
- **Screenshot script:** `../scripts/capture-android-screenshots.sh`

---

*Last updated: October 15, 2025*

