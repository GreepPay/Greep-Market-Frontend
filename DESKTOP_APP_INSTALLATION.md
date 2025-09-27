# 🖥️ Desktop App Installation Guide

Your Greep Market application can now be installed as a desktop app! Here's how:

## 📱 Method 1: PWA Installation (Recommended)

### For Chrome/Edge Users:

1. **Open your app** in Chrome or Edge browser
2. **Look for the install icon** in the address bar (📱 or ⬇️)
3. **Click "Install"** when prompted
4. **Choose "Install"** in the popup dialog
5. **Your app will appear** on your desktop and in your applications folder

### For Safari Users:

1. **Open your app** in Safari
2. **Go to File → Add to Dock** (or press Cmd+Shift+D)
3. **Your app will appear** in your dock

### For Firefox Users:

1. **Open your app** in Firefox
2. **Click the menu button** (three lines) in the top right
3. **Select "Install"** from the menu
4. **Click "Add"** in the confirmation dialog

## 🚀 Method 2: Manual Installation

### Step 1: Build the App

```bash
npm run build
```

### Step 2: Serve the Built App

```bash
# Install a simple server
npm install -g serve

# Serve the built app
serve -s build -l 3000
```

### Step 3: Install as PWA

1. Open `http://localhost:3000` in your browser
2. Follow the PWA installation steps above

## ✨ Features of the Desktop App

- **🖥️ Native Desktop Experience**: Runs like a regular desktop application
- **⚡ Fast Performance**: Optimized for desktop use
- **📱 Offline Support**: Works even without internet connection
- **🔄 Auto-Updates**: Automatically updates when you refresh the web version
- **🎯 Easy Access**: Launch from desktop, dock, or start menu

## 🛠️ Troubleshooting

### If you don't see the install button:

1. **Make sure you're using HTTPS** (or localhost)
2. **Check that the manifest.json is accessible**
3. **Try refreshing the page**
4. **Clear browser cache and try again**

### If installation fails:

1. **Check browser console** for errors
2. **Ensure all required files are present**:
   - `manifest.json`
   - `sw.js` (service worker)
   - App icons (logo192.png, logo512.png)

## 📁 File Structure

```
public/
├── manifest.json          # PWA configuration
├── sw.js                  # Service worker for offline support
├── logo192.png           # 192x192 app icon
├── logo512.png           # 512x512 app icon
└── favicon.ico           # Browser favicon
```

## 🎉 Success!

Once installed, your Greep Market app will:

- ✅ Appear in your applications folder
- ✅ Launch independently of the browser
- ✅ Have its own window and taskbar icon
- ✅ Work offline for basic functionality
- ✅ Update automatically when you deploy changes

**Enjoy your new desktop app!** 🎊
