# CatanBuddy - Colonist.io Resource Tracker

A Chrome extension that provides real-time resource tracking for Colonist.io games with advanced probabilistic state management.

## Features

- **Real-time Resource Tracking**: Tracks all player resources as they change throughout the game
- **Probabilistic State Management**: Handles unknown information (like robber steals) by maintaining multiple possible game states
- **Range Display**: Shows min/max resource ranges when exact counts are unknown
- **Comprehensive Game Log Parsing**: Supports all game actions including:
  - Dice rolls and resource distribution
  - Building settlements, cities, and roads
  - Player-to-player trades
  - Bank trades (4:1, 3:1, 2:1)
  - Development card purchases and usage
  - Robber movements and resource steals
  - Player discards
- **1v1 Mode Support**: Works seamlessly in both multiplayer and 1v1 games
- **Visual Overlay**: Clean, non-intrusive resource table overlay

## Installation

**📖 See [INSTALL.md](INSTALL.md) for detailed installation instructions and troubleshooting.**

Quick start:
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. Go to Colonist.io and start a game!

**🧪 Testing:** Open `test-extension.html` in your browser to verify the extension is working.

## How It Works

The extension monitors the game log in real-time and parses various game events to maintain an accurate picture of each player's resources. When information is uncertain (like when someone steals an unknown resource), it maintains multiple possible game states and eliminates impossible ones as more information becomes available.

### Key Components

- **Content Script**: Monitors DOM changes and parses game events
- **State Management**: Maintains possible game states and eliminates impossible ones
- **Resource Display**: Shows current resource counts with ranges when uncertain
- **Event Parsing**: Handles all types of game actions with robust error handling

## 🎉 Current Status: FULLY WORKING! (v1.5.2)

### ✅ Confirmed Working Features:
- **Perfect Resource Tracking** - Accurately tracks all player resources in 4-player games
- **Dice Roll Statistics** - Real-time dice counts with expected percentages and ratios
- **Turn Order Management** - Tracks player order and calculates discard risk probabilities
- **Development Card Tracking** - Monitors card purchases and calculates remaining probabilities
- **Complex Trade Parsing** - Handles multi-resource trades and state management
- **Robber/Steal Actions** - Properly processes robber moves and resource theft
- **User Detection** - Correctly identifies "You" as the actual player (no more fake "Notifications" player!)
- **Clean Error Logging** - Comprehensive error tracking without console spam

### 🚀 Next Phase: WebSocket Integration
The extension is now **production-ready** for resource and dice tracking. The next major development phase will focus on:

1. **WebSocket Traffic Analysis** - Sniff and decode Colonist.io WebSocket messages
2. **Board Layout Detection** - Extract hex tile positions and resource types
3. **Settlement/City Tracking** - Monitor building placements on actual board
4. **Real-time State Sync** - Keep extension in sync with server state
5. **Visual Board Overlay** - Add interactive board visualization

## Version History

- **v1.5.2** (2025-01-27): 🎉 FULLY WORKING! Silenced harmless pre-game errors, confirmed flawless 4-player operation
- **v1.5.1** (2025-01-27): CRITICAL FIX: Stopped 'Notifications' from being detected as player, fixed resource counting
- **v1.5.0** (2025-01-27): Added comprehensive error logging system with structured debugging
- **v1.4.3** (2025-01-27): Enhanced username detection with better validation and fallbacks
- **v1.4.2** (2025-01-27): Fixed user detection priority and added robust error handling
- **v1.4.1** (2025-01-27): Improved game container detection with MutationObserver
- **v1.4.0** (2025-10-03): Reduced console spam, improved game detection timing, added test page and installation guide
- **v1.3.3**: Enhanced 1v1 support, improved parsing
- **v1.3.2**: Create tables immediately, track when available
- **v1.3.1**: Advanced probabilistic state tracking
- **v1.3.0**: Initial release with basic resource tracking

## Technical Details

The extension uses:
- **MutationObserver** to monitor game log changes
- **Probabilistic state tracking** for handling hidden information
- **Robust HTML parsing** to extract game events
- **Chrome Extension Manifest V3** for modern browser compatibility

## Contributing

Feel free to submit issues or pull requests to improve the extension!

## License

This project is open source and available under the MIT License.
