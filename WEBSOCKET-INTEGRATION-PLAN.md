# WebSocket Integration Plan - CatanBuddy Extension

## 🎯 Goal
Integrate real-time WebSocket monitoring to track board layout, settlement/city placements, and maintain perfect sync with Colonist.io's server state.

## 📋 Current Status
✅ **Phase 1 Complete**: Resource & Dice Tracking (v1.5.2)
- Perfect resource tracking in 4-player games
- Accurate dice roll statistics
- Complex trade parsing
- Robber/steal action handling
- Clean error logging

## 🚀 Phase 2: WebSocket Integration

### Step 1: WebSocket Traffic Analysis
**Objective**: Capture and decode Colonist.io WebSocket messages

**Implementation**:
```javascript
// Intercept WebSocket connections
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
    const ws = new originalWebSocket(url, protocols);
    
    // Override message handlers
    const originalOnMessage = ws.onmessage;
    ws.onmessage = function(event) {
        // Log and parse WebSocket messages
        console.log('[WEBSOCKET] Received:', event.data);
        parseWebSocketMessage(event.data);
        
        // Call original handler
        if (originalOnMessage) originalOnMessage.call(this, event);
    };
    
    return ws;
};
```

**Key Message Types to Decode**:
- `game_state` - Complete board layout and player positions
- `player_action` - Settlement/city/road placements
- `dice_roll` - Server-confirmed dice results
- `trade` - Real-time trade confirmations
- `robber_move` - Robber position updates

### Step 2: Board Layout Detection
**Objective**: Extract hex tile positions, resource types, and numbers

**Data Structure**:
```javascript
const boardLayout = {
    hexes: [
        {
            id: 'hex_0_0',
            resource: 'lumber',
            number: 6,
            position: { x: 100, y: 150 },
            hasRobber: false
        }
        // ... more hexes
    ],
    settlements: [
        {
            id: 'settlement_1',
            player: 'BlakeYoung',
            position: { x: 120, y: 140 },
            color: '#E27174'
        }
        // ... more settlements
    ],
    cities: [
        // Similar structure to settlements
    ],
    roads: [
        {
            id: 'road_1',
            player: 'BlakeYoung',
            start: { x: 100, y: 150 },
            end: { x: 120, y: 140 },
            color: '#E27174'
        }
        // ... more roads
    ]
};
```

### Step 3: Real-time State Synchronization
**Objective**: Keep extension state perfectly synced with server

**Implementation**:
```javascript
class WebSocketStateManager {
    constructor() {
        this.serverState = null;
        this.localState = window.gameState;
        this.syncQueue = [];
    }
    
    updateFromWebSocket(message) {
        // Parse server message
        const serverUpdate = this.parseMessage(message);
        
        // Merge with local state
        this.mergeServerUpdate(serverUpdate);
        
        // Update UI
        this.updateBoardVisualization();
    }
    
    mergeServerUpdate(update) {
        // Handle conflicts between local and server state
        // Server state always wins for board layout
        // Local state can be more detailed for resource tracking
    }
}
```

### Step 4: Visual Board Overlay
**Objective**: Add interactive board visualization

**Features**:
- **Hex Tile Overlay** - Show resource types and numbers
- **Settlement/City Markers** - Visual player buildings
- **Road Connections** - Show road network
- **Robber Indicator** - Highlight current robber position
- **Resource Tooltips** - Hover to see hex details
- **Player Color Coding** - Match Colonist.io colors

**UI Components**:
```javascript
class BoardOverlay {
    constructor() {
        this.canvas = this.createOverlayCanvas();
        this.hexes = new Map();
        this.settlements = new Map();
        this.roads = new Map();
    }
    
    render() {
        // Draw hex tiles
        this.drawHexes();
        
        // Draw settlements and cities
        this.drawBuildings();
        
        // Draw roads
        this.drawRoads();
        
        // Draw robber
        this.drawRobber();
    }
}
```

### Step 5: Advanced Features
**Objective**: Enhanced gameplay analysis

**Features**:
- **Settlement Value Calculator** - Show expected resource yield
- **Port Analysis** - Highlight available trading ports
- **Longest Road Tracker** - Visual longest road path
- **Victory Point Counter** - Track all VP sources
- **Resource Probability** - Show hex roll probabilities
- **Trade Route Optimizer** - Suggest optimal trade routes

## 🔧 Technical Implementation

### WebSocket Message Parser
```javascript
class ColonistWebSocketParser {
    parseMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'game_state':
                    return this.parseGameState(message);
                case 'player_action':
                    return this.parsePlayerAction(message);
                case 'dice_roll':
                    return this.parseDiceRoll(message);
                default:
                    return null;
            }
        } catch (error) {
            console.error('[WEBSOCKET] Parse error:', error);
            return null;
        }
    }
}
```

### Board State Manager
```javascript
class BoardStateManager {
    constructor() {
        this.hexes = new Map();
        this.settlements = new Map();
        this.cities = new Map();
        this.roads = new Map();
        this.robberPosition = null;
    }
    
    updateFromServer(serverData) {
        // Update board state from server
        this.updateHexes(serverData.hexes);
        this.updateSettlements(serverData.settlements);
        this.updateCities(serverData.cities);
        this.updateRoads(serverData.roads);
        this.updateRobber(serverData.robber);
    }
}
```

## 📊 Expected Benefits

### For Players:
- **Perfect Accuracy** - Server-synced state eliminates guesswork
- **Visual Board** - See exact settlement positions and resource yields
- **Advanced Analytics** - Settlement value, trade optimization
- **Real-time Updates** - Instant updates on all player actions

### For Development:
- **Reliable Data Source** - WebSocket provides authoritative state
- **Reduced Parsing** - Less reliance on HTML parsing
- **Better Performance** - Direct data access vs DOM monitoring
- **Future-Proof** - Works with UI changes

## 🎯 Success Metrics

1. **100% State Accuracy** - Extension matches server state exactly
2. **Real-time Updates** - <100ms delay on all actions
3. **Visual Fidelity** - Board overlay matches Colonist.io exactly
4. **Zero Conflicts** - No state mismatches between local and server
5. **Enhanced UX** - Players prefer extension over manual tracking

## 📅 Timeline

- **Week 1**: WebSocket interception and message parsing
- **Week 2**: Board layout detection and data structures
- **Week 3**: State synchronization and conflict resolution
- **Week 4**: Visual board overlay and UI integration
- **Week 5**: Advanced features and optimization
- **Week 6**: Testing and refinement

## 🔍 Research Needed

1. **WebSocket Protocol** - Reverse engineer Colonist.io's WebSocket format
2. **Board Coordinates** - Map hex positions to screen coordinates
3. **Player Colors** - Match Colonist.io's color scheme
4. **Animation Timing** - Sync with game animations
5. **Mobile Compatibility** - Ensure overlay works on all screen sizes

---

**Ready to begin WebSocket integration! The foundation is solid and the extension is production-ready for the next phase.** 🚀
