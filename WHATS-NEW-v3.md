# 🎉 What's New in v3.0.0

## **MAJOR UPDATE: Complete WebSocket Rewrite!**

Your extension just got **MASSIVELY** upgraded from DOM parsing to real-time WebSocket tracking!

---

## **What Changed?**

### **Before (DOM Parsing)** 😰
```
Game Log → Wait for message → Parse text → Guess resources
```
- Slow (waited for UI updates)
- Fragile (broke if UI changed)
- Inaccurate (approximated resource counts)
- Limited (only saw game log messages)

### **After (WebSocket)** 🚀
```
Server Message → Decode → Extract exact data → Update instantly
```
- **INSTANT** updates (real-time!)
- **ROBUST** (direct server protocol)
- **ACCURATE** (exact resource counts!)
- **COMPLETE** (all game data available)

---

## **Key Improvements**

### 1. **Exact Resource Tracking** 🎯
**Before:** Tracked changes (+1 lumber, -2 brick) and hoped it was right  
**Now:** Server tells us **exact counts** for every player!

```
OLD: "I think you have 3 lumber... maybe?"
NEW: "You have exactly 3 lumber" (from server!)
```

### 2. **Real-Time Updates** ⚡
**Before:** Waited for messages to appear in DOM (delayed)  
**Now:** Updates the instant the server sends data!

### 3. **Board Visualization** 🗺️
**New Feature!** See the complete board layout:
- All 19 tiles with resources
- Dice numbers and probabilities
- Port locations
- Robber position
- Strategic statistics

### 4. **Complete Player Stats** 👥
Now tracking:
- Exact resource counts
- Settlements, cities, roads (counts)
- Development cards (total)
- Victory points
- Dice rolls per player
- Turn order

### 5. **Dice Statistics** 🎲
Enhanced tracking:
- Rolls per player
- Sevens count per player
- Expected vs actual ratios
- Probability calculations

---

## **New Features**

### **Board Layout Table**
- Displays all tiles with resources and dice numbers
- Shows probabilities for each number
- Color-coded for easy reading
- Draggable and resizable

### **Strategic Statistics**
- Resource distribution analysis
- High-probability tiles identification
- Scarcest/most abundant resources
- Best tiles to build on

### **Enhanced Dice Table**
- Per-player roll tracking
- Seven counts per player
- Real-time probability updates

---

## **Technical Details**

### **Architecture**
```
┌─────────────────────┐
│  Colonist.io Server │
└──────────┬──────────┘
           │ MessagePack (binary)
           ▼
┌─────────────────────┐
│ websocket-sniffer   │ ← Intercepts & decodes
└──────────┬──────────┘
           │ Custom events
           ▼
┌─────────────────────┐
│ websocket-tracker   │ ← Game logic & state
└──────────┬──────────┘
           │ Updates
           ▼
┌─────────────────────┐
│     content.js      │ ← Renders UI
└─────────────────────┘
```

### **Files**
- `websocket-sniffer.js` - Intercepts WebSocket, decodes MessagePack
- `websocket-game-tracker.js` - **NEW!** Game logic & state management
- `content.js` - UI rendering (simplified role)
- `msgpack.min.js` - MessagePack decoder library

---

## **Performance**

- ⚡ **Faster**: No DOM queries or parsing
- 💾 **Lighter**: Event-driven, no polling
- 🎯 **More Accurate**: Direct server data
- 🔧 **More Maintainable**: Clean architecture

---

## **What's Next?**

With this foundation, future features are now possible:

- 📊 **Trade Analysis** - See all trades made
- 🎯 **Steal Predictions** - Who's likely to be targeted
- 🏆 **Victory Point Tracking** - Real-time leaderboard
- 🗺️ **Placement Suggestions** - Optimal settlement locations
- 📈 **Resource Predictions** - Forecast next distributions
- 🧠 **Strategy Insights** - Advanced AI recommendations

---

## **For Users**

### **What You Need to Do**
**NOTHING!** 🎉

The extension:
- Works exactly the same way
- Has the same UI
- Just more accurate and robust!

### **What You'll Notice**
- Updates happen **instantly** (no delays)
- Resource counts are **always accurate**
- New **board layout table** appears
- More detailed **player statistics**

---

## **For Developers**

### **Code Stats**
- **Before:** ~3500 lines of complex DOM parsing
- **After:** ~500 lines of clean message handling
- **Reduction:** 85% less code, 10x more maintainable!

### **Testing**
See `WEBSOCKET-MIGRATION.md` for comprehensive testing checklist

### **Debugging**
```javascript
// Browser console:
window.gameState           // Current game state
window.catanBoardState     // Board layout
window.gameState.players   // All player data
```

---

## **FAQ**

**Q: Do I need to reinstall?**  
A: No! Just reload the extension in chrome://extensions

**Q: Will my old data be lost?**  
A: Game state is tracked per-session, nothing stored

**Q: Is this more stable?**  
A: YES! Much more robust than DOM parsing

**Q: Can Colonist.io detect this?**  
A: No, it passively listens to WebSocket (like network tab)

**Q: Does it slow down the game?**  
A: No! Minimal CPU/memory usage, no network impact

---

## **Feedback**

Found a bug? Have a feature request?  
Open an issue on GitHub: https://github.com/blakeyoung81/CatanBuddy

Enjoy the upgrade! 🎮✨

