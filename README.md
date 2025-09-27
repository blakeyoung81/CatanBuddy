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

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project folder
5. The extension will be active on Colonist.io

## How It Works

The extension monitors the game log in real-time and parses various game events to maintain an accurate picture of each player's resources. When information is uncertain (like when someone steals an unknown resource), it maintains multiple possible game states and eliminates impossible ones as more information becomes available.

### Key Components

- **Content Script**: Monitors DOM changes and parses game events
- **State Management**: Maintains possible game states and eliminates impossible ones
- **Resource Display**: Shows current resource counts with ranges when uncertain
- **Event Parsing**: Handles all types of game actions with robust error handling

## Version History

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
