# WebSocket Message Mapping Guide

This guide will help us complete the WebSocket migration by mapping all message types to game events.

## Current Status

**✅ Working:**
- Type 4: Full game state updates (players, resources, VP, buildings)
- WebSocket interception and MessagePack decoding
- Board layout extraction
- UI rendering (dice table, turn order, resource display)

**⚠️ Needs Mapping:**
- Type 28: Unknown
- Type 80: Unknown  
- Type 91: Unknown
- Type undefined: Unknown
- Type 5 action subtypes (trades, builds, steals, etc.)

## How to Help Map Message Types

### Step 1: Load the Extension
1. Load the unpacked extension in Chrome
2. Go to `colonist.io` and start a game
3. Open DevTools Console (F12)

### Step 2: Play the Game and Watch Console
The enhanced logging will now show detailed information for every WebSocket message:

```
[WS-TRACKER] 📨 Message type: 28
[WS-TRACKER] 🔍 Type 28 payload: {action: {...}}
[WS-TRACKER]   Action type: BUILD_SETTLEMENT
[WS-TRACKER]   Action data: {...}
```

### Step 3: Match Actions to Message Types

Perform these game actions and note which message type appears:

#### Core Actions to Test:
- [ ] **Roll dice** - Watch for the message type
- [ ] **Collect resources from dice** - Watch for multiple messages
- [ ] **Build settlement** - Note the type
- [ ] **Build city** - Note the type
- [ ] **Build road** - Note the type
- [ ] **Buy development card** - Note the type
- [ ] **Play Knight card** - Note the type
- [ ] **Play Year of Plenty** - Note the type
- [ ] **Play Road Building** - Note the type
- [ ] **Play Monopoly** - Note the type
- [ ] **Trade with player** - Note the type
- [ ] **Trade with bank (4:1)** - Note the type
- [ ] **Trade with port (3:1 or 2:1)** - Note the type
- [ ] **Steal from player (with robber)** - Note the type
- [ ] **Discard on 7** - Note the type
- [ ] **Move robber** - Note the type

### Step 4: Share Findings

Copy the console logs showing:
1. The action you performed
2. The message type that appeared
3. The payload structure logged

Example:
```
Action: Built a settlement
Console:
[WS-TRACKER] 📨 Message type: 28
[WS-TRACKER] 🔍 Type 28 payload: {action: {type: "BUILD_SETTLEMENT", playerColor: 2, ...}}
```

## Expected Message Type Structure

Based on typical WebSocket game protocols, we expect:

- **Type 4**: Full state sync (confirmed working)
- **Type 5**: Individual game actions (needs action subtype mapping)
- **Type 28/80/91**: Likely one of:
  - Real-time action updates
  - Player status changes
  - Turn phase transitions
  - Chat/notification messages
  - Animation triggers

## What Happens Next?

Once we map the message types, we'll:
1. Add specific handlers for each message type
2. Remove the DOM-based parsing from `content.js`
3. Have a fully WebSocket-based, real-time extension
4. Eliminate all the fragile DOM selectors and text parsing

## Benefits of Full WebSocket Migration

- **Real-time**: Instant updates, no polling or observers
- **Accurate**: Data directly from game server
- **Robust**: No DOM selectors that break with UI updates
- **Complete**: Access to data not visible in UI (hidden cards, etc.)
- **Performant**: Minimal processing, no DOM traversal

