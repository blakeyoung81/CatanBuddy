# 🎲 CATAN Card Counter - Installation & Testing Guide

## Quick Install (Chrome/Edge/Brave)

1. **Download the Extension**
   - If from GitHub: Download the ZIP and extract it
   - Or: Clone the repo: `git clone https://github.com/blakeyoung81/CatanBuddy.git`

2. **Open Extension Management**
   - Go to `chrome://extensions/` (or `edge://extensions/` for Edge)
   - **Enable "Developer mode"** (toggle in top-right corner)

3. **Load the Extension**
   - Click **"Load unpacked"**
   - Select the folder containing `manifest.json`
   - You should see "Colonist Buddy" appear in your extensions list

4. **Verify It's Working**
   - Extension should show as **enabled** (blue toggle)
   - Click the extension icon to make sure there are no errors

## 🧪 Testing Your Installation

### Option 1: Test Page (Recommended)
1. Open `test-extension.html` in your browser
2. The page will automatically run tests after 2 seconds
3. Check the results:
   - ✅ All green = Extension working perfectly!
   - ❌ Any red = See troubleshooting below

### Option 2: Real Game Test
1. Go to [Colonist.io](https://colonist.io)
2. Start or join a game
3. Open DevTools Console (Press `F12`)
4. You should see:
   ```
   Colonist Card Counter extension loaded
   Version 1.4.22 - ...
   Initializing CATAN Card Counter extension
   ```
5. Look for the dice stats and resource tracking tables on the right side of the game

## 🔧 Troubleshooting

### Extension Not Loading
**Problem:** No console messages, no tables appear

**Solutions:**
1. Make sure `manifest.json` exists in the folder you selected
2. Check `chrome://extensions/` - is "Colonist Buddy" enabled?
3. Look for any red error text under the extension name
4. Try these steps:
   - Click the **reload icon** (circular arrow) on the extension card
   - Close all colonist.io tabs and reopen
   - Disable and re-enable the extension

### "Errors" Button Shows in Extension
**Problem:** Gray "Errors" button appears on extension card

**Solution:**
1. Click the "Errors" button to see what's wrong
2. Common issues:
   - **File not found**: Make sure all files are in the folder
   - **Syntax error**: Check if `content.js` was edited correctly
   - **Icon missing**: Check that `icons/` folder exists with all PNG files

### Extension Loads But Doesn't Work on colonist.io
**Problem:** Extension works on test page but not on actual game

**Solutions:**
1. **Hard refresh** the colonist.io page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Check console (F12) for error messages
3. Make sure you're IN a game (not just on the main menu)
4. The extension needs a few seconds to find the game log - be patient!

### Console Shows "Extension waiting in background"
**Problem:** Message says "Extension waiting in background. Start or join a game to activate."

**This is NORMAL!** The extension is working correctly:
- It's waiting for you to start/join a game
- Once the game starts, you'll see: "✅ Game started! Found container on retry!"
- Then the tracking will begin

### Tables Don't Update
**Problem:** Tables appear but stay empty

**Solutions:**
1. Make sure the game has started (dice are being rolled)
2. Check if game log is visible on the page
3. Try clicking "Reset" in the extension's UI (if available)
4. Reload the extension and refresh the page

## 📊 How to Use

Once installed and working:

1. **Dice Statistics Table** (top right)
   - Shows how often each number has been rolled
   - Expected % vs Actual %
   - Helps identify hot/cold numbers

2. **Resource Tracking Table** (below dice stats)
   - Tracks each player's resources
   - Shows exact counts or ranges (if uncertain)
   - Updates automatically as game progresses

3. **Development Card Probabilities**
   - Shows likelihood of drawing each card type
   - Tracks which cards have been played
   - Estimates remaining cards in deck

## 🐛 Still Having Issues?

1. **Check the Console** (F12) - most errors show there
2. **Run the test page** - helps isolate the problem
3. **Verify file structure**:
   ```
   Your Extension Folder/
   ├── manifest.json
   ├── content.js
   ├── icons/
   │   ├── icon16.png
   │   ├── icon32.png
   │   ├── icon48.png
   │   └── icon128.png
   └── images/
       └── (various SVG files)
   ```

4. **Check permissions**: Extension needs access to colonist.io
   - Go to `chrome://extensions/`
   - Click "Details" on Colonist Buddy
   - Scroll to "Site access"
   - Should say "On specific sites" with colonist.io listed

## 🎯 Known Limitations

- Extension activates only AFTER joining a game (not on menu/lobby)
- Some resources might show as ranges (e.g., "2-3") due to trade uncertainty
- Works best with games that have visible game logs
- Requires game log to be visible on page

## 🔄 Updating the Extension

When you pull new changes from GitHub:

1. Go to `chrome://extensions/`
2. Find "Colonist Buddy"
3. Click the **reload icon** (circular arrow)
4. Refresh any open colonist.io tabs

---

**Version:** 1.3.2  
**Last Updated:** 2025-10-03

