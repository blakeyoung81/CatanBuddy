// WebSocket-Based Catan Game Tracker
// Comprehensive game state tracking via WebSocket messages
// Version 3.0.0 - Complete WebSocket Rewrite

(() => {
    "use strict";
    
    console.log("[WS-TRACKER] 🚀 Initializing WebSocket Game Tracker v3.0.0...");
    
    // ============================================================================
    // GAME STATE - Complete game tracking via WebSocket
    // ============================================================================
    
    window.gameState = {
        // Core tracking
        extensionUser: null,
        currentPlayer: null,
        gamePhase: 'initial', // 'initial' or 'main'
        turnNumber: 0,
        
        // Dice tracking
        diceHasBeenRolled: false,
        diceCounts: Array(13).fill(0),
        totalRolls: 0,
        sevenCounts: {},
        playerRollCounts: {},
        
        // Player data
        players: {},
        turnOrder: [],
        
        // Resource tracking (exact counts from WebSocket)
        resourceCounts: {},
        
        // Development cards
        devCardsPurchased: 0,
        devCardsPlayed: {
            knight: 0,
            victory_point: 0,
            road_building: 0,
            year_of_plenty: 0,
            monopoly: 0
        },
        devCardDistribution: {
            knight: 14,
            victory_point: 5,
            road_building: 2,
            year_of_plenty: 2,
            monopoly: 2
        },
        
        // Board state (from websocket-sniffer.js)
        get boardState() {
            return window.catanBoardState || {};
        },
        
        // Initialize game state
        init: function() {
            console.log("[WS-TRACKER] Initializing game state...");
            this.diceCounts = Array(13).fill(0);
            this.players = {};
            this.resourceCounts = {};
            this.sevenCounts = {};
            this.playerRollCounts = {};
            this.turnOrder = [];
            this.devCardsPurchased = 0;
            this.devCardsPlayed = {
                knight: 0,
                victory_point: 0,
                road_building: 0,
                year_of_plenty: 0,
                monopoly: 0
            };
        },
        
        // Add player
        addPlayer: function(playerName, playerColor = '#ffffff', colorIndex = null) {
            if (!this.players[playerName]) {
                this.players[playerName] = {
                    name: playerName,
                    color: playerColor,
                    colorIndex: colorIndex,
                    resources: {
                        lumber: 0,
                        brick: 0,
                        wool: 0,
                        grain: 0,
                        ore: 0
                    },
                    settlements: 0,
                    cities: 0,
                    roads: 0,
                    devCards: 0,
                    victoryPoints: 0,
                    longestRoad: 0,
                    largestArmy: 0
                };
                console.log(`[WS-TRACKER] ✅ Added player: ${playerName} (Color: ${playerColor})`);
            }
            return this.players[playerName];
        },
        
        // Update resource count
        updateResourceCount: function(playerName, resource, amount) {
            if (!this.players[playerName]) {
                this.addPlayer(playerName);
            }
            
            this.players[playerName].resources[resource] += amount;
            
            // Prevent negative resources
            if (this.players[playerName].resources[resource] < 0) {
                this.players[playerName].resources[resource] = 0;
            }
            
            console.log(`[WS-TRACKER] ${playerName}: ${resource} ${amount >= 0 ? '+' : ''}${amount} = ${this.players[playerName].resources[resource]}`);
        },
        
        // Get total cards for a player
        getTotalCards: function(playerName) {
            if (!this.players[playerName]) return 0;
            const resources = this.players[playerName].resources;
            return resources.lumber + resources.brick + resources.wool + resources.grain + resources.ore;
        },
        
        // Increment dice count
        incrementDiceCount: function(roll, playerName = null) {
            if (roll >= 2 && roll <= 12) {
                this.diceCounts[roll]++;
                this.totalRolls++;
                
                if (playerName) {
                    this.playerRollCounts[playerName] = (this.playerRollCounts[playerName] || 0) + 1;
                    
                    if (roll === 7) {
                        this.sevenCounts[playerName] = (this.sevenCounts[playerName] || 0) + 1;
                    }
                }
                
                console.log(`[WS-TRACKER] 🎲 Dice roll ${roll} by ${playerName || 'unknown'} (Total: ${this.totalRolls})`);
                this.updateDiceTable();
            }
        },
        
        // Update dice table (UI)
        updateDiceTable: function() {
            const table = document.getElementById('dice-table');
            if (!table) return;
            
            for (let i = 2; i <= 12; i++) {
                const countCell = document.getElementById(`count-${i}`);
                if (countCell) {
                    countCell.textContent = this.diceCounts[i];
                }
                
                if (this.totalRolls > 0) {
                    const percentCell = document.getElementById(`percentage-${i}`);
                    if (percentCell) {
                        const percent = (this.diceCounts[i] / this.totalRolls * 100).toFixed(1);
                        percentCell.textContent = `${percent}%`;
                    }
                    
                    const expectedCell = document.getElementById(`expected-${i}`);
                    if (expectedCell) {
                        const expected = this.getDiceExpectedPercentage(i);
                        const ratio = ((this.diceCounts[i] / this.totalRolls) / (expected / 100)).toFixed(2);
                        expectedCell.textContent = ratio;
                        
                        if (ratio < 0.75) {
                            expectedCell.style.color = "#ff4444";
                        } else if (ratio > 1.25) {
                            expectedCell.style.color = "#44ff44";
                        } else {
                            expectedCell.style.color = "#ffffff";
                        }
                    }
                }
            }
            
            const totalCell = document.getElementById('dice-total-rolls');
            if (totalCell) {
                totalCell.textContent = this.totalRolls;
            }
            
            this.updateTurnOrderTable();
        },
        
        // Get expected dice percentage
        getDiceExpectedPercentage: function(sum) {
            const expectedPercentages = {
                2: 2.8, 3: 5.6, 4: 8.3, 5: 11.1, 6: 13.9,
                7: 16.7, 8: 13.9, 9: 11.1, 10: 8.3, 11: 5.6, 12: 2.8
            };
            return expectedPercentages[sum] || 0;
        },
        
        // Update turn order table
        updateTurnOrderTable: function() {
            const turnTbody = document.getElementById('turn-order-tbody');
            if (!turnTbody) return;
            
            turnTbody.innerHTML = '';
            
            const allPlayers = Object.keys(this.players);
            if (allPlayers.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="3" style="padding: 3px 6px; text-align: center; font-style: italic;">Waiting for players...</td>`;
                turnTbody.appendChild(emptyRow);
                return;
            }
            
            const sortedPlayers = this.turnOrder.length > 0 ? this.turnOrder : allPlayers.sort();
            
            sortedPlayers.forEach((playerName) => {
                const row = document.createElement('tr');
                const player = this.players[playerName];
                const playerColor = (player && player.color !== '#ffffff') ? player.color : '#ffffff';
                
                // Player name with color
                const nameCell = document.createElement('td');
                nameCell.style.cssText = `padding: 2px 4px; color: ${playerColor}; font-weight: bold;`;
                nameCell.textContent = playerName;
                row.appendChild(nameCell);
                
                // Total cards
                const cardsCell = document.createElement('td');
                cardsCell.style.cssText = 'padding: 2px 4px; text-align: center;';
                const totalCards = this.getTotalCards(playerName);
                cardsCell.textContent = totalCards;
                
                if (totalCards >= 8) {
                    cardsCell.style.color = '#FF6B6B';
                    cardsCell.style.fontWeight = 'bold';
                } else if (totalCards >= 6) {
                    cardsCell.style.color = '#FFD700';
                } else {
                    cardsCell.style.color = '#90EE90';
                }
                row.appendChild(cardsCell);
                
                // Seven count
                const sevenCell = document.createElement('td');
                sevenCell.style.cssText = 'padding: 2px 4px; text-align: center;';
                const sevenCount = this.sevenCounts[playerName] || 0;
                sevenCell.textContent = sevenCount.toString();
                sevenCell.style.color = sevenCount > 0 ? '#FF6B6B' : '#90EE90';
                row.appendChild(sevenCell);
                
                turnTbody.appendChild(row);
            });
        },
        
        // Update resource display
        updateResourceDisplay: function() {
            for (const playerName in this.players) {
                const player = this.players[playerName];
                
                for (const resource in player.resources) {
                    const cellId = `player-${playerName}-${resource}`;
                    const cell = document.getElementById(cellId);
                    
                    if (cell) {
                        cell.textContent = player.resources[resource];
                    }
                }
                
                // Update total
                const totalCell = document.getElementById(`player-${playerName}-total`);
                if (totalCell) {
                    totalCell.textContent = this.getTotalCards(playerName);
                }
            }
        }
    };
    
    // ============================================================================
    // WEBSOCKET MESSAGE HANDLERS
    // ============================================================================
    
    // Hook into the WebSocket message processing
    function processWebSocketGameUpdate(decoded) {
        if (!decoded || !decoded.data) return;
        
        const messageType = decoded.data.type;
        const payload = decoded.data.payload;
        
        console.log(`[WS-TRACKER] 📨 Message type: ${messageType}`);
        
        // Handle different message types
        switch (messageType) {
            case 4: // Game state update
                if (payload && payload.gameState) {
                    handleGameStateUpdate(payload.gameState);
                }
                break;
                
            case 5: // Game action
                if (payload) {
                    handleGameAction(payload);
                }
                break;
                
            default:
                // Log unknown message types with full structure for debugging
                if (messageType !== undefined && messageType !== null) {
                    console.log(`[WS-TRACKER] ⚠️ Unknown message type: ${messageType}`);
                    console.log(`[WS-TRACKER]   Full decoded:`, decoded);
                    console.log(`[WS-TRACKER]   Payload keys:`, payload ? Object.keys(payload) : 'no payload');
                }
        }
    }
    
    // Handle full game state updates
    function handleGameStateUpdate(gameState) {
        console.log("[WS-TRACKER] 🎮 Processing game state update...");
        
        // Extract player states
        if (gameState.playerStates) {
            updatePlayersFromGameState(gameState.playerStates);
        }
        
        // Extract dice state
        if (gameState.diceState) {
            handleDiceState(gameState.diceState);
        }
        
        // Extract current turn
        if (gameState.currentState) {
            handleCurrentState(gameState.currentState);
        }
        
        // Extract bank state (resource cards available)
        if (gameState.bankState) {
            handleBankState(gameState.bankState);
        }
        
        // Extract development cards
        if (gameState.mechanicDevelopmentCardsState) {
            handleDevCardsState(gameState.mechanicDevelopmentCardsState);
        }
        
        // Update UI
        window.gameState.updateResourceDisplay();
        window.gameState.updateTurnOrderTable();
    }
    
    // Update players from game state
    function updatePlayersFromGameState(playerStates) {
        for (const [colorIndex, playerData] of Object.entries(playerStates)) {
            // Get player info from playerUserStates if available
            const userStates = window.gameState.boardState.playerUserStates || [];
            let playerName = `Player ${colorIndex}`;
            
            // Find matching user state by color
            const userState = userStates.find(u => u.selectedColor === parseInt(colorIndex));
            if (userState && userState.username) {
                playerName = userState.username;
            }
            
            // Get color from stored board state
            const playerColor = window.gameState.boardState.playerColors?.[colorIndex] || '#ffffff';
            
            // Add player
            window.gameState.addPlayer(playerName, playerColor, colorIndex);
            
            // Update resource counts from WebSocket
            if (playerData.resourceCards && playerData.resourceCards.cards) {
                const resources = playerData.resourceCards.cards;
                const resourceNames = ['lumber', 'brick', 'wool', 'grain', 'ore'];
                
                resources.forEach((count, index) => {
                    if (index < resourceNames.length) {
                        const resourceName = resourceNames[index];
                        const currentCount = window.gameState.players[playerName].resources[resourceName];
                        const difference = count - currentCount;
                        
                        if (difference !== 0) {
                            window.gameState.updateResourceCount(playerName, resourceName, difference);
                        }
                    }
                });
            }
            
            // Update victory points
            if (playerData.victoryPointsState) {
                window.gameState.players[playerName].victoryPoints = 
                    Object.values(playerData.victoryPointsState).reduce((a, b) => a + b, 0);
            }
            
            // Update settlements, cities, roads
            if (playerData.mechanicSettlementState) {
                window.gameState.players[playerName].settlements = 
                    5 - (playerData.mechanicSettlementState.bankSettlementAmount || 5);
            }
            
            if (playerData.mechanicCityState) {
                window.gameState.players[playerName].cities = 
                    4 - (playerData.mechanicCityState.bankCityAmount || 4);
            }
            
            if (playerData.mechanicRoadState) {
                window.gameState.players[playerName].roads = 
                    15 - (playerData.mechanicRoadState.bankRoadAmount || 15);
            }
            
            // Update dev cards
            if (playerData.developmentCards && playerData.developmentCards.cards) {
                window.gameState.players[playerName].devCards = playerData.developmentCards.cards.length;
            }
        }
    }
    
    // Handle dice state
    function handleDiceState(diceState) {
        if (diceState.dice1 && diceState.dice2) {
            const roll = diceState.dice1 + diceState.dice2;
            const currentPlayer = window.gameState.currentPlayer;
            
            window.gameState.incrementDiceCount(roll, currentPlayer);
            window.gameState.diceHasBeenRolled = true;
            
            // Check if transitioning from initial to main phase
            if (window.gameState.gamePhase === 'initial' && roll !== 7) {
                window.gameState.gamePhase = 'main';
                console.log("[WS-TRACKER] 🎯 Game phase: INITIAL → MAIN");
            }
        }
    }
    
    // Handle current state (turn tracking)
    function handleCurrentState(currentState) {
        if (currentState.currentTurnPlayerColor !== undefined) {
            const colorIndex = currentState.currentTurnPlayerColor;
            const playerName = findPlayerNameByColorIndex(colorIndex);
            
            if (playerName) {
                window.gameState.currentPlayer = playerName;
                console.log(`[WS-TRACKER] 👤 Current turn: ${playerName}`);
            }
        }
        
        if (currentState.completedTurns !== undefined) {
            window.gameState.turnNumber = currentState.completedTurns;
        }
    }
    
    // Handle bank state
    function handleBankState(bankState) {
        // Track remaining resources in bank (for advanced strategies)
        if (bankState.resourceCards) {
            console.log("[WS-TRACKER] 🏦 Bank resources:", bankState.resourceCards);
        }
    }
    
    // Handle development cards state
    function handleDevCardsState(devCardsState) {
        if (devCardsState.bankDevelopmentCards && devCardsState.bankDevelopmentCards.cards) {
            const totalInBank = devCardsState.bankDevelopmentCards.cards.length;
            const totalCards = 25; // Standard Catan deck
            window.gameState.devCardsPurchased = totalCards - totalInBank;
            console.log(`[WS-TRACKER] 🎴 Dev cards purchased: ${window.gameState.devCardsPurchased}`);
        }
    }
    
    // Handle individual game actions
    function handleGameAction(payload) {
        // This would handle individual actions like trades, builds, etc.
        // For now, we rely on full state updates
        console.log("[WS-TRACKER] Game action:", payload);
    }
    
    // Find player name by color index
    function findPlayerNameByColorIndex(colorIndex) {
        for (const [playerName, playerData] of Object.entries(window.gameState.players)) {
            if (playerData.colorIndex === colorIndex) {
                return playerName;
            }
        }
        return null;
    }
    
    // ============================================================================
    // HOOK INTO WEBSOCKET SNIFFER
    // ============================================================================
    
    // Wait for WebSocket sniffer to be ready
    function initializeTracker() {
        if (typeof window.catanBoardState === 'undefined') {
            console.log("[WS-TRACKER] Waiting for WebSocket sniffer...");
            setTimeout(initializeTracker, 100);
            return;
        }
        
        console.log("[WS-TRACKER] ✅ WebSocket sniffer detected!");
        
        // Hook into message processing
        const originalProcessBinaryMessage = window.processBinaryMessage;
        
        // We'll add our own processing after the sniffer's
        window.addEventListener('catanWebSocketMessage', (event) => {
            const decoded = event.detail;
            processWebSocketGameUpdate(decoded);
        });
        
        console.log("[WS-TRACKER] ✅ WebSocket game tracker initialized!");
    }
    
    // Start initialization
    window.gameState.init();
    initializeTracker();
    
})();

