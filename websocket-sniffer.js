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
    
    // Intercept WebSocket constructor with Proxy for maximum coverage
    const OriginalWebSocket = window.WebSocket;
    
    window.WebSocket = function(url, protocols) {
        console.log(`[WEBSOCKET] 🔌 New WebSocket connection to: ${url}`);
        
        const ws = new OriginalWebSocket(url, protocols);
        
        // Create a Proxy to intercept ALL property access
        const wsProxy = new Proxy(ws, {
            set(target, property, value) {
                // Intercept onmessage setter
                if (property === 'onmessage') {
                    console.log("[WEBSOCKET] 🎯 onmessage setter intercepted!");
                    const wrappedHandler = function(event) {
                        console.log("[WEBSOCKET] 📬 onmessage fired!");
                        try {
                            decodeWebSocketMessage(event.data);
                        } catch (error) {
                            console.error("[WEBSOCKET] ❌ Error in onmessage:", error);
                        }
                        // Call original handler with correct 'this' context
                        if (value) {
                            value.call(target, event);
                        }
                    };
                    target[property] = wrappedHandler;
                    return true;
                }
                
                // Pass through all other properties
                target[property] = value;
                return true;
            },
            
            get(target, property) {
                const value = target[property];
                
                // Intercept addEventListener
                if (property === 'addEventListener') {
                    return function(type, listener, options) {
                        if (type === 'message') {
                            console.log("[WEBSOCKET] 🎯 addEventListener('message') intercepted!");
                            const wrappedListener = function(event) {
                                console.log("[WEBSOCKET] 📬 message event fired!");
                                try {
                                    decodeWebSocketMessage(event.data);
                                } catch (error) {
                                    console.error("[WEBSOCKET] ❌ Error in addEventListener:", error);
                                }
                                listener.call(this, event);
                            };
                            target.addEventListener.call(target, type, wrappedListener, options);
                        } else {
                            target.addEventListener.call(target, type, listener, options);
                        }
                    };
                }
                
                // Bind functions to the target WebSocket to preserve 'this' context
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                
                // Return the property
                return value;
            }
        });
        
        return wsProxy;
    };
    
    // Copy static properties
    window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
    window.WebSocket.OPEN = OriginalWebSocket.OPEN;
    window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
    window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    
    // Function to decode WebSocket messages
    function decodeWebSocketMessage(data) {
        console.log("[WEBSOCKET] 📨 decodeWebSocketMessage called!");
        console.log("[WEBSOCKET]   data type:", typeof data);
        console.log("[WEBSOCKET]   data instanceof ArrayBuffer:", data instanceof ArrayBuffer);
        console.log("[WEBSOCKET]   data instanceof Blob:", data instanceof Blob);
        
        // Check if it's binary data (ArrayBuffer or Blob)
        if (data instanceof ArrayBuffer) {
            console.log("[WEBSOCKET] ⚙️  Processing ArrayBuffer,", data.byteLength, "bytes");
            processBinaryMessage(new Uint8Array(data));
        } else if (data instanceof Blob) {
            console.log("[WEBSOCKET] ⚙️  Processing Blob,", data.size, "bytes");
            // Convert Blob to ArrayBuffer
            const reader = new FileReader();
            reader.onload = function() {
                console.log("[WEBSOCKET] ✅ Blob converted to ArrayBuffer");
                processBinaryMessage(new Uint8Array(reader.result));
            };
            reader.onerror = function(err) {
                console.error("[WEBSOCKET] ❌ Blob read error:", err);
            };
            reader.readAsArrayBuffer(data);
        } else if (typeof data === 'string') {
            console.log("[WEBSOCKET] 📝 String data:", data.substring(0, 50));
            // Try to parse as hex string
            if (data.match(/^[0-9a-fA-F]+$/)) {
                console.log("[WEBSOCKET] Parsing as hex string");
                const uint8Array = hexToUint8Array(data);
                processBinaryMessage(uint8Array);
            }
        } else {
            console.warn("[WEBSOCKET] ⚠️  Unknown data type in decoder");
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
            // Use msgpack library for decoding
            if (typeof msgpack === 'undefined') {
                console.error("[WEBSOCKET] ❌ MessagePack library not loaded! Cannot decode binary data.");
                console.log("[WEBSOCKET] Raw data length:", uint8Array.length, "bytes");
                return;
            }
            
            console.log("[WEBSOCKET] 🔄 Attempting to decode", uint8Array.length, "bytes...");
            const decoded = msgpack.decode(uint8Array);
            console.log("[WEBSOCKET] ✅ Successfully decoded MessagePack data!");
            
            // Log decoded structure for debugging
            console.log("[WEBSOCKET] Decoded structure keys:", Object.keys(decoded));
            
            // Emit custom event for game tracker to listen to
            const event = new CustomEvent('catanWebSocketMessage', { 
                detail: decoded 
            });
            window.dispatchEvent(event);
            
            // Check if this is a game initialization message
            if (decoded && decoded.data && decoded.data.payload && decoded.data.payload.gameState) {
                console.log("[WEBSOCKET] 🎯 GAME INITIALIZATION MESSAGE DETECTED!");
                processGameState(decoded.data.payload.gameState);
            } else if (decoded && decoded.data) {
                console.log("[WEBSOCKET] Message type:", decoded.data.type, "Keys:", Object.keys(decoded.data));
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
        console.log("═══════════════════════════════════════════════════════");
        console.log("🎮 GAME STATE DECODED FROM WEBSOCKET");
        console.log("═══════════════════════════════════════════════════════");
        console.log("Full Game State:", gameState);
        
        // Store player user states for game tracker
        if (gameState.playerUserStates) {
            window.catanBoardState.playerUserStates = gameState.playerUserStates;
            console.log("[WEBSOCKET] 👥 Stored player user states");
        }
        
        if (!gameState.mapState) {
            console.warn("[WEBSOCKET] No mapState found in game state");
            return;
        }
        
        const mapState = gameState.mapState;
        console.log("\n📊 MAP STATE:", mapState);
        
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
        console.log("\n🎲 EXTRACTING TILE DATA:");
        console.log("─────────────────────────────────────────────");
        
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
            
            // Enhanced logging with emojis
            const resourceEmojis = {
                'desert': '🏜️',
                'brick': '🧱',
                'wool': '🐑',
                'ore': '⛰️',
                'grain': '🌾',
                'lumber': '🌲'
            };
            
            const emoji = resourceEmojis[tile.resource] || '❓';
            const prob = tile.diceNumber ? calculateDiceProbability(tile.diceNumber) : 0;
            
            console.log(`${emoji} Tile ${tileId.padStart(2)}: (${tile.x}, ${tile.y}) = ${tile.resource.toUpperCase().padEnd(7)} | Dice: ${tile.diceNumber || 'N/A'} | Prob: ${prob.toFixed(1)}%`);
        }
        
        console.log("─────────────────────────────────────────────");
        console.log(`✅ Loaded ${Object.keys(window.catanBoardState.tiles).length} tiles\n`);
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
    
    // Calculate dice roll probability
    function calculateDiceProbability(diceNumber) {
        const probabilities = {
            2: 2.78, 3: 5.56, 4: 8.33, 5: 11.11, 6: 13.89,
            7: 16.67, 8: 13.89, 9: 11.11, 10: 8.33, 11: 5.56, 12: 2.78
        };
        return probabilities[diceNumber] || 0;
    }
    
    // Calculate strategic statistics from board data
    function calculateStrategicStats() {
        const stats = {
            resourceDistribution: { brick: 0, wool: 0, ore: 0, grain: 0, lumber: 0, desert: 0 },
            highProbabilityTiles: [],
            scarcestResources: [],
            mostAbundantResources: [],
            totalPips: 0,
            averagePipsPerResource: {}
        };
        
        // Count resources and calculate pips
        for (const tile of Object.values(window.catanBoardState.tiles)) {
            stats.resourceDistribution[tile.resource]++;
            
            if (tile.diceNumber) {
                const pips = Math.abs(tile.diceNumber - 7); // Pips are dots on the number token
                stats.totalPips += pips;
                
                if (tile.resource !== 'desert') {
                    if (!stats.averagePipsPerResource[tile.resource]) {
                        stats.averagePipsPerResource[tile.resource] = { total: 0, count: 0 };
                    }
                    stats.averagePipsPerResource[tile.resource].total += pips;
                    stats.averagePipsPerResource[tile.resource].count++;
                }
                
                // Track high-probability tiles (6, 8)
                if (tile.diceNumber === 6 || tile.diceNumber === 8) {
                    stats.highProbabilityTiles.push({
                        ...tile,
                        probability: calculateDiceProbability(tile.diceNumber)
                    });
                }
            }
        }
        
        // Calculate average pips per resource
        for (const [resource, data] of Object.entries(stats.averagePipsPerResource)) {
            data.average = data.total / data.count;
        }
        
        // Find scarcest and most abundant
        const resourceCounts = Object.entries(stats.resourceDistribution)
            .filter(([res]) => res !== 'desert')
            .sort((a, b) => a[1] - b[1]);
        
        stats.scarcestResources = resourceCounts.slice(0, 2);
        stats.mostAbundantResources = resourceCounts.slice(-2);
        
        return stats;
    }
    
    // Update board display (create or update the board table)
    function updateBoardDisplay() {
        console.log("\n📊 CALCULATING STRATEGIC STATISTICS...");
        const stats = calculateStrategicStats();
        console.log("Strategic Stats:", stats);
        console.log("═══════════════════════════════════════════════════════\n");
        
        // Remove existing tables if they exist
        const existingBoardTable = document.getElementById('board-layout-container');
        if (existingBoardTable) existingBoardTable.remove();
        
        const existingStatsTable = document.getElementById('strategic-stats-container');
        if (existingStatsTable) existingStatsTable.remove();
        
        // Create tables
        createBoardLayoutTable();
        createStrategicStatsTable(stats);
    }
    
    // Create the board layout display table
    function createBoardLayoutTable() {
        const container = document.createElement('div');
        container.id = 'board-layout-container';
        container.style.cssText = `
            position: fixed;
            top: 420px;
            left: 10px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #666;
            border-radius: 8px;
            padding: 12px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 450px;
            max-height: 500px;
            overflow-y: auto;
            resize: both;
            box-shadow: 0 4px 6px rgba(0,0,0,0.5);
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
    
    // Create strategic statistics table
    function createStrategicStatsTable(stats) {
        const container = document.createElement('div');
        container.id = 'strategic-stats-container';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #FFD700;
            border-radius: 8px;
            padding: 12px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 10001;
            max-width: 350px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #FFD700;
        `;
        
        const title = document.createElement('h3');
        title.textContent = '📊 Strategic Analysis';
        title.style.cssText = 'margin: 0; font-size: 15px; color: #FFD700;';
        header.appendChild(title);
        
        container.appendChild(header);
        
        // Resource Distribution Section
        const resourceSection = document.createElement('div');
        resourceSection.style.cssText = 'margin-bottom: 12px;';
        
        const resourceTitle = document.createElement('h4');
        resourceTitle.textContent = '📦 Resource Distribution';
        resourceTitle.style.cssText = 'margin: 0 0 6px 0; font-size: 12px; color: #90EE90;';
        resourceSection.appendChild(resourceTitle);
        
        for (const [resource, count] of Object.entries(stats.resourceDistribution)) {
            if (resource === 'desert') continue;
            
            const resourceEmojis = {
                'brick': '🧱',
                'wool': '🐑',
                'ore': '⛰️',
                'grain': '🌾',
                'lumber': '🌲'
            };
            
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;';
            
            const avgPips = stats.averagePipsPerResource[resource]?.average || 0;
            const quality = avgPips >= 4 ? '🔥 HOT' : avgPips >= 3 ? '⚠️ MED' : '❄️ COLD';
            
            row.innerHTML = `
                <span>${resourceEmojis[resource]} ${resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
                <span><strong>${count}</strong> tiles | ${avgPips.toFixed(1)} avg pips ${quality}</span>
            `;
            resourceSection.appendChild(row);
        }
        
        container.appendChild(resourceSection);
        
        // High Value Spots Section
        const valueSection = document.createElement('div');
        valueSection.style.cssText = 'margin-bottom: 12px;';
        
        const valueTitle = document.createElement('h4');
        valueTitle.textContent = '⭐ High-Value Tiles (6 & 8)';
        valueTitle.style.cssText = 'margin: 0 0 6px 0; font-size: 12px; color: #FFD700;';
        valueSection.appendChild(valueTitle);
        
        stats.highProbabilityTiles.forEach(tile => {
            const resourceEmojis = {
                'brick': '🧱',
                'wool': '🐑',
                'ore': '⛰️',
                'grain': '🌾',
                'lumber': '🌲'
            };
            
            const row = document.createElement('div');
            row.style.cssText = 'padding: 3px 0; font-size: 11px; color: #FFD700;';
            row.innerHTML = `
                ${resourceEmojis[tile.resource]} <strong>Tile ${tile.id}</strong>: ${tile.resource.toUpperCase()} on ${tile.diceNumber} (${tile.probability.toFixed(1)}% prob)
            `;
            valueSection.appendChild(row);
        });
        
        container.appendChild(valueSection);
        
        // Strategic Insights Section
        const insightsSection = document.createElement('div');
        insightsSection.style.cssText = 'margin-bottom: 12px; padding: 8px; background: rgba(255,215,0,0.1); border-radius: 4px;';
        
        const insightsTitle = document.createElement('h4');
        insightsTitle.textContent = '💡 Strategic Insights';
        insightsTitle.style.cssText = 'margin: 0 0 6px 0; font-size: 12px; color: #FF6B6B;';
        insightsSection.appendChild(insightsTitle);
        
        // Scarcest resource insight
        if (stats.scarcestResources.length > 0) {
            const scarcest = stats.scarcestResources[0];
            const insight1 = document.createElement('div');
            insight1.style.cssText = 'font-size: 10px; margin: 4px 0; line-height: 1.4;';
            insight1.innerHTML = `
                🎯 <strong>Scarcest:</strong> ${scarcest[0].toUpperCase()} (only ${scarcest[1]} tiles)<br>
                → <em>High trade value! Control these spots early.</em>
            `;
            insightsSection.appendChild(insight1);
        }
        
        // Most abundant insight
        if (stats.mostAbundantResources.length > 0) {
            const abundant = stats.mostAbundantResources[stats.mostAbundantResources.length - 1];
            const insight2 = document.createElement('div');
            insight2.style.cssText = 'font-size: 10px; margin: 4px 0; line-height: 1.4;';
            insight2.innerHTML = `
                📊 <strong>Most Common:</strong> ${abundant[0].toUpperCase()} (${abundant[1]} tiles)<br>
                → <em>Lower trade value, but easier to obtain.</em>
            `;
            insightsSection.appendChild(insight2);
        }
        
        // Port strategy
        const portCount = Object.keys(window.catanBoardState.ports).length;
        const insight3 = document.createElement('div');
        insight3.style.cssText = 'font-size: 10px; margin: 4px 0; line-height: 1.4;';
        insight3.innerHTML = `
            ⚓ <strong>${portCount} Ports Available</strong><br>
            → <em>Settle near 2:1 ports for scarce resources!</em>
        `;
        insightsSection.appendChild(insight3);
        
        container.appendChild(insightsSection);
        
        // Pro Tips Section
        const tipsSection = document.createElement('div');
        tipsSection.style.cssText = 'padding: 6px; background: rgba(144,238,144,0.1); border-radius: 4px; border-left: 3px solid #90EE90;';
        
        const tipsTitle = document.createElement('div');
        tipsTitle.style.cssText = 'font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #90EE90;';
        tipsTitle.textContent = '🎓 Pro Tips:';
        tipsSection.appendChild(tipsTitle);
        
        const tip = document.createElement('div');
        tip.style.cssText = 'font-size: 10px; line-height: 1.4;';
        tip.innerHTML = `
            • Prioritize corners touching multiple 6s and 8s<br>
            • Settle on ports for scarce resources<br>
            • Diversify resources early, specialize late<br>
            • Block opponents from high-pip clusters
        `;
        tipsSection.appendChild(tip);
        
        container.appendChild(tipsSection);
        
        // Make draggable
        makeDraggable(container, 'strategicStatsPosition');
        
        document.body.appendChild(container);
        console.log("[WEBSOCKET] ✅ Strategic stats table created!");
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

