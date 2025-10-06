// WebSocket Sniffer for Catan Board Layout Detection
// Intercepts Colonist.io WebSocket messages and extracts board state

(() => {
    "use strict";
    
    console.log("[WEBSOCKET] Initializing WebSocket sniffer...");
    
    // Board state storage - accessible globally
    window.catanBoardState = {
        initialized: false,
        tiles: {},
        corners: {},
        edges: {},
        ports: {},
        robberPosition: null,
        playerColors: {},
        
        // Resource type mapping
        resourceTypes: {
            0: 'desert',
            1: 'brick',
            2: 'wool',
            3: 'ore',
            4: 'grain',
            5: 'lumber'
        },
        
        // Port type mapping
        portTypes: {
            0: '3:1',    // Generic 3:1 port
            1: '2:1 Brick',
            2: '2:1 Wool',
            3: '2:1 Ore',
            4: '2:1 Grain',
            5: '2:1 Lumber',
            6: '2:1 Any' // Sometimes there's a 6th type
        }
    };
    
    // Intercept WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    window.WebSocket = function(url, protocols) {
        console.log(`[WEBSOCKET] New WebSocket connection to: ${url}`);
        
        const ws = new OriginalWebSocket(url, protocols);
        
        // Store original handlers
        const originalOnMessage = ws.onmessage;
        const originalAddEventListener = ws.addEventListener;
        
        // Override onmessage
        ws.onmessage = function(event) {
            try {
                // Try to decode the message
                decodeWebSocketMessage(event.data);
            } catch (error) {
                console.error("[WEBSOCKET] Error processing message:", error);
            }
            
            // Call original handler
            if (originalOnMessage) {
                originalOnMessage.call(this, event);
            }
        };
        
        // Override addEventListener to catch all message handlers
        ws.addEventListener = function(type, listener, options) {
            if (type === 'message') {
                const wrappedListener = function(event) {
                    try {
                        decodeWebSocketMessage(event.data);
                    } catch (error) {
                        console.error("[WEBSOCKET] Error in addEventListener wrapper:", error);
                    }
                    listener.call(this, event);
                };
                originalAddEventListener.call(this, type, wrappedListener, options);
            } else {
                originalAddEventListener.call(this, type, listener, options);
            }
        };
        
        return ws;
    };
    
    // Copy static properties
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    
    // Function to decode WebSocket messages
    function decodeWebSocketMessage(data) {
        // Check if it's binary data (ArrayBuffer or Blob)
        if (data instanceof ArrayBuffer) {
            processBinaryMessage(new Uint8Array(data));
        } else if (data instanceof Blob) {
            // Convert Blob to ArrayBuffer
            const reader = new FileReader();
            reader.onload = function() {
                processBinaryMessage(new Uint8Array(reader.result));
            };
            reader.readAsArrayBuffer(data);
        } else if (typeof data === 'string') {
            // Try to parse as hex string
            if (data.match(/^[0-9a-fA-F]+$/)) {
                const uint8Array = hexToUint8Array(data);
                processBinaryMessage(uint8Array);
            }
        }
    }
    
    // Convert hex string to Uint8Array
    function hexToUint8Array(hexString) {
        const matches = hexString.match(/.{1,2}/g);
        if (!matches) return new Uint8Array(0);
        return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
    }
    
    // Process binary MessagePack data
    function processBinaryMessage(uint8Array) {
        try {
            // Use msgpack-lite for decoding (we'll need to load this library)
            if (typeof window.msgpack === 'undefined') {
                // MessagePack library not loaded yet - we'll add it via manifest
                console.warn("[WEBSOCKET] MessagePack library not loaded");
                return;
            }
            
            const decoded = window.msgpack.decode(uint8Array);
            
            // Check if this is a game initialization message
            if (decoded && decoded.data && decoded.data.payload && decoded.data.payload.gameState) {
                console.log("[WEBSOCKET] 🎯 GAME INITIALIZATION MESSAGE DETECTED!");
                processGameState(decoded.data.payload.gameState);
            }
            
        } catch (error) {
            // Not all messages are MessagePack, so errors are expected
            // Only log if it looks like it should have been MessagePack
            if (uint8Array.length > 10 && uint8Array[0] > 0x80) {
                console.debug("[WEBSOCKET] Could not decode as MessagePack:", error.message);
            }
        }
    }
    
    // Process the game state and extract board layout
    function processGameState(gameState) {
        console.log("[WEBSOCKET] Processing game state...", gameState);
        
        if (!gameState.mapState) {
            console.warn("[WEBSOCKET] No mapState found in game state");
            return;
        }
        
        const mapState = gameState.mapState;
        
        // Extract tile hex states (the board!)
        if (mapState.tileHexStates) {
            console.log("[WEBSOCKET] 🎲 Extracting board tiles...");
            extractTileData(mapState.tileHexStates);
        }
        
        // Extract corner states (settlement/city locations)
        if (mapState.tileCornerStates) {
            console.log("[WEBSOCKET] 🏠 Extracting corner data...");
            extractCornerData(mapState.tileCornerStates);
        }
        
        // Extract edge states (road locations)
        if (mapState.tileEdgeStates) {
            console.log("[WEBSOCKET] 🛤️  Extracting edge data...");
            extractEdgeData(mapState.tileEdgeStates);
        }
        
        // Extract port states
        if (mapState.portEdgeStates) {
            console.log("[WEBSOCKET] ⚓ Extracting port data...");
            extractPortData(mapState.portEdgeStates);
        }
        
        // Extract robber position
        if (gameState.mechanicRobberState) {
            window.catanBoardState.robberPosition = gameState.mechanicRobberState.locationTileIndex;
            console.log(`[WEBSOCKET] 🦹 Robber is on tile ${window.catanBoardState.robberPosition}`);
        }
        
        // Extract player colors
        if (gameState.playerStates) {
            extractPlayerColors(gameState.playerStates);
        }
        
        // Mark as initialized
        window.catanBoardState.initialized = true;
        console.log("[WEBSOCKET] ✅ Board state fully initialized!");
        
        // Trigger board display update
        updateBoardDisplay();
    }
    
    // Extract tile data (hexes with resources and numbers)
    function extractTileData(tileHexStates) {
        for (const [tileId, tileData] of Object.entries(tileHexStates)) {
            const tile = {
                id: tileId,
                x: tileData.x,
                y: tileData.y,
                type: tileData.type,
                resource: window.catanBoardState.resourceTypes[tileData.type] || 'unknown',
                diceNumber: tileData.diceNumber || 0,
                hasRobber: false
            };
            
            window.catanBoardState.tiles[tileId] = tile;
            
            console.log(`[TILE ${tileId}] (${tile.x}, ${tile.y}) = ${tile.resource} (${tile.diceNumber})`);
        }
    }
    
    // Extract corner data (vertices for settlements/cities)
    function extractCornerData(tileCornerStates) {
        for (const [cornerId, cornerData] of Object.entries(tileCornerStates)) {
            const corner = {
                id: cornerId,
                x: cornerData.x,
                y: cornerData.y,
                z: cornerData.z,
                building: null, // Will be populated when buildings are placed
                player: null
            };
            
            window.catanBoardState.corners[cornerId] = corner;
        }
        console.log(`[WEBSOCKET] Loaded ${Object.keys(window.catanBoardState.corners).length} corners`);
    }
    
    // Extract edge data (edges for roads)
    function extractEdgeData(tileEdgeStates) {
        for (const [edgeId, edgeData] of Object.entries(tileEdgeStates)) {
            const edge = {
                id: edgeId,
                x: edgeData.x,
                y: edgeData.y,
                z: edgeData.z,
                road: null, // Will be populated when roads are placed
                player: null
            };
            
            window.catanBoardState.edges[edgeId] = edge;
        }
        console.log(`[WEBSOCKET] Loaded ${Object.keys(window.catanBoardState.edges).length} edges`);
    }
    
    // Extract port data
    function extractPortData(portEdgeStates) {
        for (const [portId, portData] of Object.entries(portEdgeStates)) {
            const port = {
                id: portId,
                x: portData.x,
                y: portData.y,
                z: portData.z,
                type: portData.type,
                tradeName: window.catanBoardState.portTypes[portData.type] || 'Unknown'
            };
            
            window.catanBoardState.ports[portId] = port;
            
            console.log(`[PORT ${portId}] (${port.x}, ${port.y}, ${port.z}) = ${port.tradeName}`);
        }
    }
    
    // Extract player color assignments
    function extractPlayerColors(playerStates) {
        for (const [playerId, playerData] of Object.entries(playerStates)) {
            if (playerData.color !== undefined) {
                window.catanBoardState.playerColors[playerId] = playerData.color;
            }
        }
        console.log(`[WEBSOCKET] Player colors:`, window.catanBoardState.playerColors);
    }
    
    // Update board display (create or update the board table)
    function updateBoardDisplay() {
        console.log("[WEBSOCKET] Updating board display...");
        
        // Remove existing board table if it exists
        const existingTable = document.getElementById('board-layout-container');
        if (existingTable) {
            existingTable.remove();
        }
        
        // Create board layout table
        createBoardLayoutTable();
    }
    
    // Create the board layout display table
    function createBoardLayoutTable() {
        const container = document.createElement('div');
        container.id = 'board-layout-container';
        container.style.cssText = `
            position: fixed;
            top: 420px;
            left: 10px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #8B4513;
            border-radius: 8px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 400px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #8B4513;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '🗺️ Board Layout';
        title.style.cssText = 'margin: 0; font-size: 14px;';
        header.appendChild(title);
        
        container.appendChild(header);
        
        // Create table
        const table = document.createElement('table');
        table.id = 'board-table';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        `;
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #8B4513;">
                <th style="padding: 4px; border: 1px solid #666;">Tile</th>
                <th style="padding: 4px; border: 1px solid #666;">Coords</th>
                <th style="padding: 4px; border: 1px solid #666;">Resource</th>
                <th style="padding: 4px; border: 1px solid #666;">Number</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        tbody.id = 'board-tbody';
        
        // Sort tiles by ID
        const sortedTiles = Object.entries(window.catanBoardState.tiles).sort((a, b) => {
            return parseInt(a[0]) - parseInt(b[0]);
        });
        
        // Add rows for each tile
        for (const [tileId, tile] of sortedTiles) {
            const row = document.createElement('tr');
            
            // Tile ID
            const idCell = document.createElement('td');
            idCell.textContent = tileId;
            idCell.style.cssText = 'padding: 3px 6px; text-align: center; border: 1px solid #666; font-weight: bold;';
            row.appendChild(idCell);
            
            // Coordinates
            const coordCell = document.createElement('td');
            coordCell.textContent = `(${tile.x}, ${tile.y})`;
            coordCell.style.cssText = 'padding: 3px 6px; text-align: center; border: 1px solid #666;';
            row.appendChild(coordCell);
            
            // Resource type with color coding
            const resourceCell = document.createElement('td');
            resourceCell.textContent = tile.resource.charAt(0).toUpperCase() + tile.resource.slice(1);
            resourceCell.style.padding = '3px 6px';
            resourceCell.style.textAlign = 'center';
            resourceCell.style.border = '1px solid #666';
            resourceCell.style.fontWeight = 'bold';
            
            // Color code by resource
            const resourceColors = {
                'desert': '#DAA520',
                'brick': '#CD5C5C',
                'wool': '#98FB98',
                'ore': '#808080',
                'grain': '#FFD700',
                'lumber': '#228B22'
            };
            resourceCell.style.color = resourceColors[tile.resource] || '#FFFFFF';
            row.appendChild(resourceCell);
            
            // Dice number with probability coloring
            const numberCell = document.createElement('td');
            numberCell.textContent = tile.diceNumber || '-';
            numberCell.style.cssText = 'padding: 3px 6px; text-align: center; border: 1px solid #666; font-weight: bold;';
            
            // Color code by probability (6 and 8 are red, 2 and 12 are gray)
            if (tile.diceNumber === 6 || tile.diceNumber === 8) {
                numberCell.style.color = '#FF6B6B'; // High probability - red
            } else if (tile.diceNumber === 2 || tile.diceNumber === 12) {
                numberCell.style.color = '#888888'; // Low probability - gray
            } else if (tile.diceNumber === 0) {
                numberCell.style.color = '#666666'; // Desert - dark gray
            }
            row.appendChild(numberCell);
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        // Add port summary
        if (Object.keys(window.catanBoardState.ports).length > 0) {
            const portHeader = document.createElement('h4');
            portHeader.textContent = '⚓ Ports';
            portHeader.style.cssText = 'margin: 10px 0 5px 0; font-size: 12px;';
            container.appendChild(portHeader);
            
            const portList = document.createElement('div');
            portList.style.cssText = 'font-size: 10px;';
            
            for (const [portId, port] of Object.entries(window.catanBoardState.ports)) {
                const portItem = document.createElement('div');
                portItem.textContent = `Port ${portId}: ${port.tradeName}`;
                portItem.style.padding = '2px 0';
                portList.appendChild(portItem);
            }
            
            container.appendChild(portList);
        }
        
        // Make draggable (same as other tables)
        makeDraggable(container, 'boardTablePosition');
        
        document.body.appendChild(container);
        console.log("[WEBSOCKET] ✅ Board layout table created!");
    }
    
    // Make element draggable
    function makeDraggable(element, storageKey) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            initialX = e.clientX - parseInt(element.style.left || 0);
            initialY = e.clientY - parseInt(element.style.top || 0);
            
            if (e.target === element || e.target.parentElement === element) {
                isDragging = true;
            }
        }
        
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                element.style.left = currentX + 'px';
                element.style.top = currentY + 'px';
            }
        }
        
        function dragEnd(e) {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                
                // Save position
                localStorage.setItem(storageKey, JSON.stringify({
                    top: element.style.top,
                    left: element.style.left
                }));
            }
        }
    }
    
    console.log("[WEBSOCKET] ✅ WebSocket sniffer initialized!");
    
})();

