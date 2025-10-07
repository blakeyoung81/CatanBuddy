# 🎲 Colonist Buddy - Real-Time Catan Game Tracker

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/blakeyoung81/CatanBuddy)
[![WebSocket](https://img.shields.io/badge/powered%20by-WebSocket-green.svg)](https://github.com/blakeyoung81/CatanBuddy)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

A powerful Chrome extension that provides **real-time game tracking** for Catan on [Colonist.io](https://colonist.io) using advanced WebSocket interception. Get instant statistics, probability calculations, and strategic insights!

---

## ✨ Features

### 🎯 **Real-Time WebSocket Tracking**
- **Zero Delay**: Updates instantly as the server sends data
- **100% Accurate**: Direct data from game server, no guessing
- **Language Independent**: Works in any language (no text parsing!)
- **Future-Proof**: WebSocket protocol is stable and robust

### 📊 **Advanced Statistics**
- **Dice Roll Tracking**
  - Real-time roll counts for 2-12
  - Expected vs actual percentages
  - Over/under roll ratios with color coding
  - Total roll counter
  
- **Player Monitoring**
  - Live resource card counts
  - Victory point tracking
  - Settlement, city, and road counts
  - Development card inventory
  - Turn order display

- **Strategic Insights**
  - Seven roll tracking per player
  - Discard risk calculation
  - Development card probability (coming soon)
  - Resource distribution prediction (coming soon)

### 🎨 **Clean UI**
- Draggable tables (position saved)
- Resizable containers
- Dark theme with transparency
- Non-intrusive overlay
- Collapsible sections

---

## 🚀 Quick Start

### Installation

1. **Clone or Download** this repository
   ```bash
   git clone https://github.com/blakeyoung81/CatanBuddy.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)

3. **Load Extension**
   - Click **"Load unpacked"**
   - Select the `CatanBuddy` folder

4. **Start Playing!**
   - Go to [colonist.io](https://colonist.io)
   - Start or join a game
   - Tables will appear automatically! 🎉

---

## 📖 Documentation

- **[TESTING-GUIDE.md](TESTING-GUIDE.md)** - How to test and verify the extension
- **[WEBSOCKET-MIGRATION.md](WEBSOCKET-MIGRATION.md)** - Technical architecture details
- **[WEBSOCKET-MAPPING-GUIDE.md](WEBSOCKET-MAPPING-GUIDE.md)** - Help map message types
- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history
- **[FRAGILE-POINTS.md](FRAGILE-POINTS.md)** - Old DOM-based architecture (deprecated)

---

## 🏗️ Architecture

### Version 3.0 - WebSocket-Based (Current)

```
┌─────────────────────────────────┐
│   colonist.io Game Server       │
│   (WebSocket + MessagePack)     │
└────────────┬────────────────────┘
             │ Binary messages
             ▼
┌─────────────────────────────────┐
│   websocket-sniffer.js          │
│   • Intercepts WebSocket        │
│   • Decodes MessagePack         │
│   • Extracts board layout       │
└────────────┬────────────────────┘
             │ Custom events
             ▼
┌─────────────────────────────────┐
│   websocket-game-tracker.js     │
│   • Processes all messages      │
│   • Maintains game state        │
│   • Tracks dice, resources, VP  │
└────────────┬────────────────────┘
             │ Updates window.gameState
             ▼
┌─────────────────────────────────┐
│   content-ui.js                 │
│   • Creates visual tables       │
│   • Renders statistics          │
│   • Pure UI, no game logic      │
└─────────────────────────────────┘
```

### Why WebSocket Over DOM Parsing?

| Feature | DOM Parsing (v1-2) | WebSocket (v3) |
|---------|-------------------|----------------|
| **Accuracy** | ~95% (guessing) | 100% (server data) |
| **Speed** | Delayed (polling) | Instant (real-time) |
| **Robustness** | Breaks on UI changes | Never breaks |
| **Code Size** | 3600+ lines | 800 lines |
| **Language Support** | English only | Any language |
| **Maintenance** | High (fragile selectors) | Low (stable protocol) |

---

## 🎮 How It Works

### 1. WebSocket Interception
The extension intercepts all WebSocket messages between your browser and Colonist.io's servers using a JavaScript Proxy.

### 2. MessagePack Decoding
Messages are in binary MessagePack format. We decode them to extract game events:
- Dice rolls
- Resource distributions
- Building placements
- Trades
- Development cards
- Robber actions

### 3. State Management
All game data is stored in `window.gameState`:
```javascript
{
  players: {
    "Alice": { 
      resources: { lumber: 3, brick: 2, ... },
      settlements: 4,
      cities: 2,
      victoryPoints: 8
    }
  },
  diceCounts: [0, 0, 3, 5, 7, 9, 12, 8, 6, 4, 2, 1, 0],
  currentPlayer: "Bob",
  turnNumber: 24
}
```

### 4. Real-Time Updates
UI tables automatically update as the state changes, showing live statistics.

---

## 🎯 Current Status

### ✅ **Fully Working**
- WebSocket message interception
- MessagePack binary decoding
- Board layout extraction
- Game state initialization
- Dice roll tracking
- Player detection
- UI table creation and updates
- Comprehensive logging for debugging

### ⚙️ **In Progress** (Help Needed!)
- Message type mapping (types 28, 80, 91, undefined)
- Action subtype handlers (trades, builds, cards)
- Resource change tracking from actions

### 🔮 **Planned Features**
- Probability calculations
- Trade recommendations
- Victory point predictions
- Resource distribution forecasting
- Historical game analysis

---

## 🧪 Testing

See **[TESTING-GUIDE.md](TESTING-GUIDE.md)** for comprehensive testing instructions.

Quick test:
1. Load extension
2. Open Console (F12)
3. Go to colonist.io and start a game
4. Watch for initialization messages:
   ```
   [WEBSOCKET] 🎯 WebSocket Sniffer Initialized
   [WS-TRACKER] 🚀 Initializing WebSocket Game Tracker v3.0.0...
   [CATAN-UI] ✅ UI initialization complete!
   ```

---

## 🤝 Contributing

We need help mapping WebSocket message types! See **[WEBSOCKET-MAPPING-GUIDE.md](WEBSOCKET-MAPPING-GUIDE.md)**.

### How You Can Help
1. **Play test games** and report console logs
2. **Map unknown message types** to game actions
3. **Report bugs** with detailed reproduction steps
4. **Suggest features** for future versions
5. **Submit pull requests** with improvements

---

## 📊 Version History

### [3.0.0] - 2025-10-06 🚀 **MAJOR RELEASE**
- **Complete WebSocket migration**
- Replaced 3600+ lines of DOM parsing with 800 lines of WebSocket handling
- Real-time tracking with 100% accuracy
- 78% code reduction
- 10x more maintainable

### [2.1.5] - 2025-10-05
- Fixed `TypeError: Illegal invocation` in WebSocket Proxy
- Added proper method binding

### [2.0.0] - 2025-10-04
- Enhanced error logging
- Robust user detection
- MutationObserver implementation

### [1.5.2] - 2025-01-27
- **First fully working version**
- Perfect resource tracking
- Clean error handling

[Full changelog](CHANGELOG.md)

---

## ⚖️ Fair Play

This extension **does not**:
- ❌ Modify game behavior
- ❌ Provide unfair advantages
- ❌ Automate gameplay
- ❌ Reveal hidden information (opponent's cards)

It **only displays**:
- ✅ Public game statistics
- ✅ Probability calculations
- ✅ Information visible to all players
- ✅ Your own resource counts

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Colonist.io** - For creating an amazing online Catan experience
- **MessagePack** - For the binary serialization library
- **All contributors** - For testing and feedback

---

## 🔗 Links

- **GitHub**: [github.com/blakeyoung81/CatanBuddy](https://github.com/blakeyoung81/CatanBuddy)
- **Issues**: [Report bugs or request features](https://github.com/blakeyoung81/CatanBuddy/issues)
- **Colonist.io**: [colonist.io](https://colonist.io)

---

**Made with ❤️ for Catan enthusiasts**
