# 🧪 Extension Testing Checklist

Use this checklist to verify your extension is working properly.

## ✅ Pre-Flight Check (Before Installing)

- [ ] All files are present in folder:
  - [ ] `manifest.json`
  - [ ] `content.js`
  - [ ] `icons/` folder with 4 PNG files
  - [ ] `images/` folder (optional, for resources)

## ✅ Installation Check

- [ ] Go to `chrome://extensions/`
- [ ] "Developer mode" is enabled (top-right toggle)
- [ ] Click "Load unpacked" and select your extension folder
- [ ] Extension appears as "Colonist Buddy v1.4.0"
- [ ] Extension toggle is **blue** (enabled)
- [ ] No red "Errors" button appears
  - If it does: Click it and read the error message

## ✅ Test Page Verification

- [ ] Open `test-extension.html` in Chrome
- [ ] Wait for auto-tests to run (2 seconds)
- [ ] Check results:
  - [ ] ✅ Extension gameState object found
  - [ ] ✅ Virtual scroller found
  - [ ] ✅ Feed messages found
  - [ ] ✅ Dice statistics table created
  - [ ] ✅ Resource tracking table created

**If ANY test fails, see [INSTALL.md](INSTALL.md) troubleshooting section.**

## ✅ Real Game Test (colonist.io)

### Part 1: Loading
- [ ] Go to https://colonist.io
- [ ] Open DevTools Console (`F12` or `Cmd+Option+J` on Mac)
- [ ] Look for these messages:
  ```
  Colonist Card Counter extension loaded
  Version 1.4.22 - ...
  ```
- [ ] Should see: `Initializing CATAN Card Counter extension`
- [ ] Console should be relatively quiet (not spamming messages)

### Part 2: Game Detection
- [ ] Click "Play" and either:
  - Join an existing game, OR
  - Create a new game
- [ ] Once in game lobby, watch console
- [ ] Should see one of:
  - `✅ Game started! Found container on retry!` (if game log is visible)
  - `[Observer] Still waiting for game to start...` (every 15 seconds, normal)

### Part 3: In-Game Functionality
**Start or join an actual game:**

- [ ] Game has started (you can see the board)
- [ ] Look at the **right side** of the screen
- [ ] Two tables should appear:
  
  **Dice Statistics Table:**
  - [ ] Shows numbers 2-12
  - [ ] Shows "0%" or actual percentages
  - [ ] Updates when dice are rolled
  
  **Resource Tracking Table:**
  - [ ] Shows player names with colors
  - [ ] Shows 5 resource columns (wood, brick, sheep, wheat, ore)
  - [ ] Shows "Total" column
  - [ ] Initially shows zeros

### Part 4: Live Tracking
**Play a few rounds and verify:**

- [ ] When dice are rolled:
  - [ ] Dice table updates with new roll
  - [ ] Percentages recalculate
  
- [ ] When resources are gained:
  - [ ] Resource numbers increase for correct players
  - [ ] Cells briefly highlight yellow
  
- [ ] When buildings are placed:
  - [ ] Resource counts decrease
  
- [ ] When trades happen:
  - [ ] Both players' resources update accordingly

### Part 5: Console Health Check
- [ ] Console should NOT be spamming messages
- [ ] Should NOT see repeated errors
- [ ] May see occasional game actions being logged (normal)
- [ ] Should NOT see "Impossible state detected" frequently

## 🐛 Common Issues and Quick Fixes

### Issue: Extension not in extension list
**Fix:** Make sure you selected the correct folder containing `manifest.json`

### Issue: "Errors" button appears
**Fix:** Click it and read the error. Usually means a file is missing or syntax error.

### Issue: Console spam with "❌ No game log container found"
**Fix:** This is NORMAL if you're NOT in an active game. The extension is waiting for you to start playing.

### Issue: Tables don't appear
**Fix:** 
1. Hard refresh the page: `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac)
2. Make sure you're IN a game, not just in the lobby
3. Check console for errors
4. Try reloading the extension

### Issue: Tables appear but don't update
**Fix:**
1. Check if game log is visible on the page
2. Make sure dice are actually being rolled
3. Look for error messages in console
4. The extension may need a few seconds to detect game start

## ✅ Final Verification

If you can check ALL of these, your extension is working perfectly:

- [ ] Extension loads without errors
- [ ] Test page shows all green checkmarks
- [ ] Console shows extension initialized
- [ ] Tables appear when game starts
- [ ] Dice statistics update on rolls
- [ ] Resource counts update on resource gain
- [ ] No console spam or repeated errors

## 🎉 Success!

If everything above works, congratulations! Your extension is properly installed and functioning.

## 📝 Notes

- First time setup can take a minute for Chrome to load everything
- Extension is most reliable in **Classic 4-player Catan** games
- Some exotic game modes or variations may not be fully supported
- The extension respects game privacy and runs entirely in your browser

---

**Having persistent issues?** Check [INSTALL.md](INSTALL.md) for detailed troubleshooting or open an issue on GitHub.

**Version:** 1.4.0  
**Last Updated:** October 3, 2025

