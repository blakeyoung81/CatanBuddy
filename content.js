(() => {
    "use strict";
    
    console.log("Colonist Card Counter extension loaded");
        console.log("Version 1.3.6 - Improved player detection using DOM elements, cleaner current player logic");
    
    // Advanced game state tracking system
    window.gameState = {
        diceHasBeenRolled: false,
        diceCounts: Array(13).fill(0),
        totalRolls: 0,
        players: {},
        possibleStates: [], // Array of all possible game states
        confirmedActions: [], // Confirmed actions from the log
        
        // Initialize dice counts and state tracking
        init: function() {
            for (let i = 2; i <= 12; i++) {
                this.diceCounts[i] = 0;
            }
            this.possibleStates = [{}]; // Start with one empty state
        },
        
        // Function to increment dice count
        incrementDiceCount: function(roll) {
            try {
                console.log(`Incrementing dice count for roll: ${roll}`);
                if (roll >= 2 && roll <= 12) {
                    this.diceCounts[roll]++;
                    this.totalRolls++;
                    this.updateDiceTable();
                } else {
                    console.error(`Invalid dice roll: ${roll}`);
                }
            } catch (error) {
                console.error("Error incrementing dice count:", error);
            }
        },
        
        // Function to update the dice table
        updateDiceTable: function() {
            try {
                const table = document.getElementById('dice-table');
                if (!table) {
                    console.log("Dice table not found, can't update counts");
                    return;
                }
                
                // Update counts
                for (let i = 2; i <= 12; i++) {
                    const countCell = document.getElementById(`count-${i}`);
                    if (countCell) {
                        countCell.textContent = this.diceCounts[i];
                    }
                    
                    // Update percentages if there are any rolls
                    if (this.totalRolls > 0) {
                        const percentCell = document.getElementById(`percentage-${i}`);
                        if (percentCell) {
                            const percent = (this.diceCounts[i] / this.totalRolls * 100).toFixed(1);
                            percentCell.textContent = `${percent}%`;
                        }
                        
                        // Update expected percentages
                        const expectedCell = document.getElementById(`expected-${i}`);
                        if (expectedCell) {
                            const expected = this.getDiceExpectedPercentage(i);
                            const ratio = this.totalRolls > 0 ? 
                                ((this.diceCounts[i] / this.totalRolls) / (expected / 100)).toFixed(2) : 
                                "0.00";
                            
                            expectedCell.textContent = ratio;
                            
                            // Color code the expected cell
                            if (ratio < 0.75) {
                                expectedCell.style.color = "#ff4444"; // Red for under-rolled
                            } else if (ratio > 1.25) {
                                expectedCell.style.color = "#44ff44"; // Green for over-rolled
                            } else {
                                expectedCell.style.color = "#ffffff"; // White for expected range
                            }
                        }
                    }
                }
                
                // Update total rolls
                const totalCell = document.getElementById('dice-total-rolls');
                if (totalCell) {
                    totalCell.textContent = this.totalRolls;
                }
            } catch (error) {
                console.error("Error updating dice table:", error);
            }
        },
        
        // Get expected percentage for dice roll
        getDiceExpectedPercentage: function(sum) {
            const expectedPercentages = {
                2: 2.8,
                3: 5.6,
                4: 8.3,
                5: 11.1,
                6: 13.9,
                7: 16.7,
                8: 13.9,
                9: 11.1,
                10: 8.3,
                11: 5.6,
                12: 2.8
            };
            return expectedPercentages[sum] || 0;
        },
        
        // Add a player to the game state
        addPlayer: function(playerName, playerColor = '#ffffff') {
            // Never add "you" as a literal player - resolve it first
            if (playerName && playerName.toLowerCase() === 'you') {
                console.log(`[PLAYER] Resolving 'you' to current player before adding`);
                playerName = this.getCurrentPlayer();
            }
            
            console.log(`Adding player: ${playerName} with color: ${playerColor}`);
            if (!this.players[playerName]) {
                this.players[playerName] = {
                    name: playerName,
                    color: playerColor,
                    resources: {
                        lumber: 0,
                        brick: 0,
                        wool: 0,
                        grain: 0,
                        ore: 0
                    }
                };
                
                // Detect game mode based on player count
                const playerCount = Object.keys(this.players).length;
                if (playerCount <= 2) {
                    console.log(`[MODE] Detected 1v1 or minimal player game mode (${playerCount} players)`);
                }
                
                // Add player to resource table if it exists
                const resourceTable = document.getElementById('resource-table');
                if (resourceTable && resourceTable.querySelector('tbody')) {
                    this.addPlayerToResourceTable(resourceTable.querySelector('tbody'), this.players[playerName]);
                }
            }
            return this.players[playerName];
        },
        
        // Update resource counts
        updateResourceCount: function(playerName, resource, amount) {
            try {
                console.log(`Updating resource for ${playerName}: ${resource} by ${amount}`);
                
                // Make sure player exists
                if (!this.players[playerName]) {
                    this.addPlayer(playerName);
                }
                
                // Update resource count
                this.players[playerName].resources[resource] += amount;
                
                // Make sure it doesn't go below 0
                if (this.players[playerName].resources[resource] < 0) {
                    this.players[playerName].resources[resource] = 0;
                }
                
                // Update UI
                const resourceCell = document.getElementById(`player-${playerName}-${resource}`);
                if (resourceCell) {
                    resourceCell.textContent = this.players[playerName].resources[resource];
                    // Highlight cell briefly
                    resourceCell.style.backgroundColor = '#ffff99';
                    setTimeout(() => {
                        resourceCell.style.backgroundColor = '';
                    }, 500);
                }
            } catch (error) {
                console.error("Error updating resource count:", error);
            }
        },
        
        // Game phase tracking
        gamePhase: 'initial', // 'initial' or 'main'
        initialPlacements: 0,
        turnOrder: [], // Track the order players place their second settlement
        
        isInitialPlacementPhase: function() {
            // Once a dice roll happens, we're definitely in the main game
            // Only trust the gamePhase after the first dice roll
            console.log(`[PHASE] Checking initial placement: gamePhase=${this.gamePhase}`);
            return this.gamePhase === 'initial';
        },
        
        // Track processed entries to prevent duplicates
        processedEntries: new Set(),
        
        // Track current player name for "You" messages
        currentPlayer: null,
        
        // Track active development card effects
        activeCardEffects: {},
        
        // Helper function to determine current player
        getCurrentPlayer: function() {
            if (this.currentPlayer) {
                return this.currentPlayer;
            }
            
            // Method 1: Try to get username from the header profile element (most reliable)
            const headerUsernameElement = document.getElementById('header_profile_username');
            if (headerUsernameElement && headerUsernameElement.textContent.trim()) {
                this.currentPlayer = headerUsernameElement.textContent.trim();
                console.log(`[PLAYER] Found current player from header: ${this.currentPlayer}`);
                return this.currentPlayer;
            }
            
            // Method 2: Alternative selector for the header username
            const headerUsernameElement2 = document.querySelector('.header_profile_username');
            if (headerUsernameElement2 && headerUsernameElement2.textContent.trim()) {
                this.currentPlayer = headerUsernameElement2.textContent.trim();
                console.log(`[PLAYER] Found current player from header (alt selector): ${this.currentPlayer}`);
                return this.currentPlayer;
            }
            
            // Method 3: Look for username in any profile-related elements
            const profileElements = document.querySelectorAll('[class*="username"], [class*="profile"], [id*="username"], [id*="profile"]');
            for (const element of profileElements) {
                const text = element.textContent.trim();
                if (text && text.length > 0 && text.length < 50 && !text.includes(' ')) {
                    this.currentPlayer = text;
                    console.log(`[PLAYER] Found current player from profile element: ${this.currentPlayer}`);
                    return this.currentPlayer;
                }
            }
            
            // Fallback: Try to find BlakeYoung in tracked players (legacy support)
            const blakeYoung = Object.keys(this.players).find(name => name.includes('BlakeYoung'));
            if (blakeYoung) {
                this.currentPlayer = blakeYoung;
                console.log(`[PLAYER] Using tracked BlakeYoung as fallback: ${this.currentPlayer}`);
                return this.currentPlayer;
            }
            
            // Ultimate fallback
            this.currentPlayer = "BlakeYoung";
            console.log(`[PLAYER] Using hardcoded fallback: ${this.currentPlayer}`);
            
            return this.currentPlayer;
        },
        
        // Function to set current player explicitly
        setCurrentPlayer: function(playerName) {
            if (playerName && playerName !== "You") {
                this.currentPlayer = playerName;
                console.log(`[PLAYER] Current player set to: ${playerName}`);
                
                // Clean up any "you" player that might have been incorrectly added
                this.cleanupYouPlayer();
            }
        },
        
        // Clean up any "you" player that was incorrectly added and merge their resources
        cleanupYouPlayer: function() {
            if (this.players['you'] || this.players['You']) {
                const currentPlayer = this.getCurrentPlayer();
                console.log(`[PLAYER] Cleaning up 'you' player, merging to: ${currentPlayer}`);
                
                // Merge resources from "you" to the actual current player
                ['you', 'You'].forEach(youKey => {
                    if (this.players[youKey]) {
                        const youPlayer = this.players[youKey];
                        if (!this.players[currentPlayer]) {
                            this.addPlayer(currentPlayer);
                        }
                        
                        // Merge resources
                        for (const [resource, amount] of Object.entries(youPlayer.resources)) {
                            this.players[currentPlayer].resources[resource] += amount;
                        }
                        
                        // Remove the "you" player
                        delete this.players[youKey];
                        console.log(`[PLAYER] Merged and removed '${youKey}' player`);
                    }
                });
                
                // Also update all possible states to replace "you" with current player
                this.possibleStates.forEach(state => {
                    ['you', 'You'].forEach(youKey => {
                        if (state[youKey]) {
                            if (!state[currentPlayer]) {
                                state[currentPlayer] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                            }
                            
                            // Merge resources in this state
                            for (const [resource, amount] of Object.entries(state[youKey])) {
                                state[currentPlayer][resource] += amount;
                            }
                            
                            // Remove "you" from this state
                            delete state[youKey];
                        }
                    });
                });
                
                console.log(`[PLAYER] Cleaned up 'you' references in all game states`);
            }
        },
        
        // Track turn order based on second settlement placement
        addToTurnOrder: function(playerName) {
            if (!this.turnOrder.includes(playerName)) {
                this.turnOrder.push(playerName);
                console.log(`[TURN_ORDER] Added ${playerName} to turn order. Current order:`, this.turnOrder);
            }
        },
        
        // Get players sorted by turn order
        getPlayersSortedByTurnOrder: function() {
            const allPlayers = Object.keys(this.players);
            
            // Players in turn order come first
            const orderedPlayers = this.turnOrder.filter(player => this.players[player]);
            
            // Add any remaining players that aren't in turn order yet
            const remainingPlayers = allPlayers.filter(player => !this.turnOrder.includes(player));
            
            const finalOrder = [...orderedPlayers, ...remainingPlayers];
            console.log(`[TURN_ORDER] Final player order for table:`, finalOrder);
            return finalOrder;
        },
        
        // Initialize and cache the current player early
        initializeCurrentPlayer: function() {
            console.log(`[PLAYER] Initializing current player detection...`);
            const detectedPlayer = this.getCurrentPlayer();
            if (detectedPlayer) {
                console.log(`[PLAYER] Successfully initialized current player: ${detectedPlayer}`);
            } else {
                console.log(`[PLAYER] Failed to detect current player during initialization`);
            }
        },
        
        // Advanced state management methods
        addAction: function(action) {
            // Create unique identifier for this action to prevent duplicates
            const actionId = `${action.type}-${action.player || 'unknown'}-${Date.now()}-${Math.random()}`;
            
            this.confirmedActions.push({...action, id: actionId});
            
            // Track game phase transitions
            if (action.type === 'dice_roll' && this.gamePhase === 'initial') {
                console.log("First dice roll detected - switching to main game phase");
                this.gamePhase = 'main';
            }
            
            this.updatePossibleStates(action);
            this.eliminateImpossibleStates();
            this.updateResourceDisplay();
        },
        
        updatePossibleStates: function(action) {
            const newStates = [];
            
            for (const state of this.possibleStates) {
                const possibleNewStates = this.applyActionToState(state, action);
                newStates.push(...possibleNewStates);
            }
            
            this.possibleStates = newStates;
            console.log(`After action ${action.type}, we have ${this.possibleStates.length} possible states`);
            
            // Check for impossible state and attempt to fix
            if (this.possibleStates.length === 0) {
                console.warn(`[WARN] Impossible state detected! Attempting to fix...`);
                this.fixImpossibleState();
            }
        },
        
        applyActionToState: function(state, action) {
            const newStates = [];
            
            switch (action.type) {
                case 'got_resource':
                    const resourceState = JSON.parse(JSON.stringify(state));
                    if (!resourceState[action.player]) {
                        resourceState[action.player] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    resourceState[action.player][action.resource] += action.amount;
                    newStates.push(resourceState);
                    console.log(`State after ${action.player} got ${action.amount}x ${action.resource}:`, resourceState[action.player]);
                    break;
                
                case 'dice_roll':
                    // Dice rolls don't change resources, just pass state through
                    newStates.push(state);
                    break;
                    
                case 'spent_resources':
                    // Handle spending - ensure player exists first
                    const spentState = JSON.parse(JSON.stringify(state));
                    if (!spentState[action.player]) {
                        spentState[action.player] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    
                    // Only keep states where player has enough resources
                    if (this.playerCanAfford(spentState[action.player], action.cost)) {
                        for (const [resource, amount] of Object.entries(action.cost)) {
                            spentState[action.player][resource] -= amount;
                            // Ensure we don't go negative
                            if (spentState[action.player][resource] < 0) {
                                spentState[action.player][resource] = 0;
                            }
                        }
                        newStates.push(spentState);
                        console.log(`State after ${action.player} spent resources:`, spentState[action.player]);
                    } else {
                        console.log(`${action.player} cannot afford ${JSON.stringify(action.cost)} in state:`, spentState[action.player]);
                        // If player can't afford it, this state is eliminated
                    }
                    break;
                    
                case 'traded':
                    // Handle trades between players (legacy simple trades)
                    console.log(`[STATE] Processing trade: ${action.trader} gave ${action.traderGave}, received ${action.traderReceived}, partner: ${action.partner}`);
                    
                    // Ensure both players exist in state
                    const tradeState = JSON.parse(JSON.stringify(state));
                    if (!tradeState[action.trader]) {
                        tradeState[action.trader] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    if (!tradeState[action.partner]) {
                        tradeState[action.partner] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    
                        // Check if BOTH players have the resources they're giving away
                        // Trader must have what they're giving, Partner must have what trader is receiving
                    const traderHasResource = tradeState[action.trader][action.traderGave] > 0;
                    const partnerHasResource = tradeState[action.partner][action.traderReceived] > 0;
                        
                    console.log(`[STATE] Before trade - ${action.trader}:`, tradeState[action.trader]);
                    console.log(`[STATE] Before trade - ${action.partner}:`, tradeState[action.partner]);
                        console.log(`[STATE] Trader has ${action.traderGave}? ${traderHasResource}, Partner has ${action.traderReceived}? ${partnerHasResource}`);
                        
                        if (traderHasResource && partnerHasResource) {
                            // Trader: loses what they gave, gains what they received
                        tradeState[action.trader][action.traderGave] -= 1;
                        tradeState[action.trader][action.traderReceived] += 1;
                            
                            // Partner: loses what they gave (what trader received), gains what they received (what trader gave)
                        tradeState[action.partner][action.traderReceived] -= 1;
                        tradeState[action.partner][action.traderGave] += 1;
                            
                            console.log(`[STATE] TRADE PROCESSED: ${action.trader} (${action.traderGave} → ${action.traderReceived}), ${action.partner} (${action.traderReceived} → ${action.traderGave})`);
                        console.log(`[STATE] After trade - ${action.trader}:`, tradeState[action.trader]);
                        console.log(`[STATE] After trade - ${action.partner}:`, tradeState[action.partner]);
                        newStates.push(tradeState);
        } else {
                            console.log(`[STATE] TRADE ELIMINATED STATE - ${action.trader} has ${action.traderGave}? ${traderHasResource}, ${action.partner} has ${action.traderReceived}? ${partnerHasResource}`);
                            // This state is eliminated because the trade is impossible
                        }
                    break;
                    
                case 'traded_complex':
                    // Handle complex trades with multiple resources
                    console.log(`[STATE] Processing complex trade: ${action.trader} gave`, action.traderGave, 'received', action.traderReceived, `partner: ${action.partner}`);
                    
                    // Ensure both players exist in state
                    const complexTradeState = JSON.parse(JSON.stringify(state));
                    if (!complexTradeState[action.trader]) {
                        complexTradeState[action.trader] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    if (!complexTradeState[action.partner]) {
                        complexTradeState[action.partner] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    
                    // Check if trader has all resources they're giving away
                    let traderCanAfford = true;
                    for (const [resource, amount] of Object.entries(action.traderGave)) {
                        if (complexTradeState[action.trader][resource] < amount) {
                            traderCanAfford = false;
                            break;
                        }
                    }
                    
                    // Check if partner has all resources they're giving away (what trader receives)
                    let partnerCanAfford = true;
                    for (const [resource, amount] of Object.entries(action.traderReceived)) {
                        if (complexTradeState[action.partner][resource] < amount) {
                            partnerCanAfford = false;
                            break;
                        }
                    }
                    
                    console.log(`[STATE] Before complex trade - ${action.trader}:`, complexTradeState[action.trader]);
                    console.log(`[STATE] Before complex trade - ${action.partner}:`, complexTradeState[action.partner]);
                    console.log(`[STATE] Trader can afford? ${traderCanAfford}, Partner can afford? ${partnerCanAfford}`);
                    
                    if (traderCanAfford && partnerCanAfford) {
                        // Trader loses what they gave
                        for (const [resource, amount] of Object.entries(action.traderGave)) {
                            complexTradeState[action.trader][resource] -= amount;
                        }
                        // Trader gains what they received
                        for (const [resource, amount] of Object.entries(action.traderReceived)) {
                            complexTradeState[action.trader][resource] += amount;
                        }
                        
                        // Partner loses what they gave (what trader received)
                        for (const [resource, amount] of Object.entries(action.traderReceived)) {
                            complexTradeState[action.partner][resource] -= amount;
                        }
                        // Partner gains what they received (what trader gave)
                        for (const [resource, amount] of Object.entries(action.traderGave)) {
                            complexTradeState[action.partner][resource] += amount;
                        }
                        
                        console.log(`[STATE] COMPLEX TRADE PROCESSED`);
                        console.log(`[STATE] After complex trade - ${action.trader}:`, complexTradeState[action.trader]);
                        console.log(`[STATE] After complex trade - ${action.partner}:`, complexTradeState[action.partner]);
                        newStates.push(complexTradeState);
        } else {
                        console.log(`[STATE] COMPLEX TRADE ELIMINATED STATE - trader can afford? ${traderCanAfford}, partner can afford? ${partnerCanAfford}`);
                        // This state is eliminated because the trade is impossible
                    }
                    break;
                    
                case 'bank_trade':
                    // Handle bank trades (port trading)
                    console.log(`[STATE] Processing bank trade: ${action.player} gave:`, action.gave, 'received:', action.received);
                    
                    // Ensure player exists in state
                    const bankNewState = JSON.parse(JSON.stringify(state));
                    if (!bankNewState[action.player]) {
                        bankNewState[action.player] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    
                        // Check if player has all the resources they're giving to bank
                        let canAfford = true;
                        for (const [resource, amount] of Object.entries(action.gave)) {
                        if (bankNewState[action.player][resource] < amount) {
                                canAfford = false;
                                break;
                            }
                        }
                        
                        console.log(`[STATE] Player can afford bank trade? ${canAfford}`);
                        
                        if (canAfford) {
                            // Remove resources given to bank
                            for (const [resource, amount] of Object.entries(action.gave)) {
                            bankNewState[action.player][resource] -= amount;
                            }
                            
                            // Add resources received from bank
                            for (const [resource, amount] of Object.entries(action.received)) {
                            bankNewState[action.player][resource] += amount;
                            }
                            
                            console.log(`[STATE] BANK TRADE PROCESSED: ${action.player}`);
                        console.log(`[STATE] Before bank trade:`, state[action.player] || 'null');
                        console.log(`[STATE] After bank trade:`, bankNewState[action.player]);
                        newStates.push(bankNewState);
                        } else {
                            console.log(`[STATE] BANK TRADE ELIMINATED STATE - player cannot afford trade`);
                            // This state is eliminated because the player can't afford the trade
                    }
                    break;
                    
                case 'robbed':
                    // Handle robbing - create states for each possible stolen resource
                    console.log(`[STATE] Processing unknown resource steal: ${action.robber} stole from ${action.victim}`);
                    
                    // Ensure both players exist in state
                    const robberyState = JSON.parse(JSON.stringify(state));
                    if (!robberyState[action.victim]) {
                        robberyState[action.victim] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    if (!robberyState[action.robber]) {
                        robberyState[action.robber] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    
                        const possibleResources = ['lumber', 'brick', 'wool', 'grain', 'ore']
                        .filter(res => robberyState[action.victim][res] > 0);
                        
                        console.log(`[STATE] Victim ${action.victim} can lose:`, possibleResources);
                    console.log(`[STATE] Before robbery - ${action.victim}:`, robberyState[action.victim]);
                    console.log(`[STATE] Before robbery - ${action.robber}:`, robberyState[action.robber]);
                        
                        if (possibleResources.length > 0) {
                            for (const resource of possibleResources) {
                            const stealState = JSON.parse(JSON.stringify(robberyState));
                            stealState[action.victim][resource] -= 1;
                            stealState[action.robber][resource] += 1;
                                console.log(`[STATE] Created robbery state: ${action.victim} lost ${resource}, ${action.robber} gained ${resource}`);
                            console.log(`[STATE] After robbery - ${action.victim}:`, stealState[action.victim]);
                            console.log(`[STATE] After robbery - ${action.robber}:`, stealState[action.robber]);
                            newStates.push(stealState);
                            }
                        } else {
                            console.log(`[STATE] ROBBERY ELIMINATED STATE - victim has no resources to steal`);
                            // If victim has no resources, this state is impossible
                    }
                    break;
                    
                case 'robbed_specific':
                    // Handle specific resource robbery (rare but possible)
                    console.log(`[STATE] Processing specific resource steal: ${action.robber} stole ${action.resource} from ${action.victim}`);
                    
                    // Ensure both players exist in state
                    const specificRobberyState = JSON.parse(JSON.stringify(state));
                    if (!specificRobberyState[action.victim]) {
                        specificRobberyState[action.victim] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    if (!specificRobberyState[action.robber]) {
                        specificRobberyState[action.robber] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                    }
                    
                    if (specificRobberyState[action.victim][action.resource] > 0) {
                        specificRobberyState[action.victim][action.resource] -= 1;
                        specificRobberyState[action.robber][action.resource] += 1;
                            console.log(`[STATE] SPECIFIC ROBBERY PROCESSED`);
                        console.log(`[STATE] After robbery - ${action.victim}:`, specificRobberyState[action.victim]);
                        console.log(`[STATE] After robbery - ${action.robber}:`, specificRobberyState[action.robber]);
                        newStates.push(specificRobberyState);
                        } else {
                            console.log(`[STATE] SPECIFIC ROBBERY ELIMINATED STATE - victim doesn't have ${action.resource}`);
                            // This state is eliminated because victim doesn't have the specific resource
                    }
                    break;
                    
                default:
                    newStates.push(state);
            }
            
            return newStates;
        },
        
        playerCanAfford: function(playerResources, cost) {
            for (const [resource, amount] of Object.entries(cost)) {
                if (!playerResources[resource] || playerResources[resource] < amount) {
                    return false;
                }
            }
                        return true;
        },
        
        eliminateImpossibleStates: function() {
            // Remove duplicate states
            const uniqueStates = [];
            const stateStrings = new Set();
            
            for (const state of this.possibleStates) {
                const stateString = JSON.stringify(state);
                if (!stateStrings.has(stateString)) {
                    stateStrings.add(stateString);
                    uniqueStates.push(state);
                }
            }
            
            const beforeCount = this.possibleStates.length;
            this.possibleStates = uniqueStates;
            const afterCount = this.possibleStates.length;
            
            if (beforeCount !== afterCount) {
                console.log(`Eliminated ${beforeCount - afterCount} duplicate states, ${afterCount} remain`);
            }
        },
        
        fixImpossibleState: function() {
            console.log(`[FIX] Attempting to fix impossible state by resetting to simple tracking`);
            
            // When we have an impossible state, fall back to simple resource tracking
            // Create a new state based on the players object
            const newState = {};
            
            for (const [playerName, player] of Object.entries(this.players)) {
                newState[playerName] = { ...player.resources };
            }
            
            // If no players exist, create an empty state
            if (Object.keys(newState).length === 0) {
                newState = {};
            }
            
            this.possibleStates = [newState];
            console.log(`[FIX] Reset to single state:`, newState);
        },
        
        getResourceRange: function(player, resource) {
            if (this.possibleStates.length === 0) return { min: 0, max: 0, certain: true };
            
            const values = this.possibleStates.map(state => 
                state[player] ? (state[player][resource] || 0) : 0
            );
            
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            return {
                min: min,
                max: max,
                certain: min === max,
                value: min === max ? min : null
            };
        },
        
        getExactTotalCards: function(player) {
            if (this.possibleStates.length === 0) return 0;
            
            // Get total cards from first state - should be identical across all states
            const firstState = this.possibleStates[0];
            if (!firstState[player]) return 0;
            
            const total = ['lumber', 'brick', 'wool', 'grain', 'ore']
                .reduce((sum, resource) => sum + (firstState[player][resource] || 0), 0);
            
            // Verify that all states have the same total (they should!)
            const allTotals = this.possibleStates.map(state => {
                if (!state[player]) return 0;
                return ['lumber', 'brick', 'wool', 'grain', 'ore']
                    .reduce((sum, resource) => sum + (state[player][resource] || 0), 0);
            });
            
            const minTotal = Math.min(...allTotals);
            const maxTotal = Math.max(...allTotals);
            
            if (minTotal !== maxTotal) {
                console.warn(`[WARNING] Total cards mismatch for ${player}: ${minTotal}-${maxTotal}. This should never happen!`);
            }
            
            return total;
        },
        
        updateResourceDisplay: function() {
            const tbody = document.querySelector('#resource-table tbody');
            if (!tbody) return;
            
            // Clear existing rows
            tbody.innerHTML = '';
            
            // Get all players from all states
            const allPlayers = new Set();
            for (const state of this.possibleStates) {
                Object.keys(state).forEach(player => allPlayers.add(player));
            }
            Object.keys(this.players).forEach(player => allPlayers.add(player));
            
            // Get players sorted by turn order (second settlement placement order)
            const orderedPlayers = this.getPlayersSortedByTurnOrder();
            const remainingPlayers = Array.from(allPlayers).filter(player => !orderedPlayers.includes(player));
            const finalPlayerOrder = [...orderedPlayers, ...remainingPlayers];
            
            console.log(`[TABLE] Building table with player order:`, finalPlayerOrder);
            
            // Create rows for each player in turn order
            for (const playerName of finalPlayerOrder) {
                if (allPlayers.has(playerName)) {
                this.addPlayerToResourceTable(tbody, playerName);
                }
            }
        },
        
        // Add player to resource table with simple exact values
        addPlayerToResourceTableSimple: function(tbody, playerName) {
            const row = document.createElement('tr');
            const player = this.players[playerName];
            if (player && player.color) {
                row.style.color = player.color;
            }
            
            // Player name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = playerName;
            nameCell.style.fontWeight = 'bold';
            nameCell.style.padding = '4px 8px';
            row.appendChild(nameCell);
            
            // Resource cells with exact values
            const resources = ['lumber', 'brick', 'wool', 'grain', 'ore'];
            let total = 0;
            
            resources.forEach(resource => {
                const cell = document.createElement('td');
                cell.id = `player-${playerName}-${resource}`;
                cell.style.textAlign = 'center';
                cell.style.padding = '4px 8px';
                
                const value = player.resources[resource] || 0;
                cell.textContent = value;
                cell.style.backgroundColor = value > 0 ? 'rgba(0, 255, 0, 0.2)' : '';
                total += value;
                
                row.appendChild(cell);
            });
            
            // Total cell
            const totalCell = document.createElement('td');
            totalCell.style.textAlign = 'center';
            totalCell.style.padding = '4px 8px';
            totalCell.style.fontWeight = 'bold';
            totalCell.textContent = total;
            row.appendChild(totalCell);
            
            tbody.appendChild(row);
        },
        
        // Add player to resource table with range display
        addPlayerToResourceTable: function(tbody, playerName) {
            const row = document.createElement('tr');
            const player = this.players[playerName];
            if (player && player.color) {
                row.style.color = player.color;
            }
            
            // Player name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = playerName;
            nameCell.style.fontWeight = 'bold';
            nameCell.style.padding = '4px 8px';
            row.appendChild(nameCell);
            
            // Resource cells with range display
            const resources = ['lumber', 'brick', 'wool', 'grain', 'ore'];
            let totalMin = 0, totalMax = 0;
            
            resources.forEach(resource => {
                const cell = document.createElement('td');
                cell.id = `player-${playerName}-${resource}`;
                cell.style.textAlign = 'center';
                cell.style.padding = '4px 8px';
                
                const range = this.getResourceRange(playerName, resource);
                if (range.certain) {
                    cell.textContent = range.value;
                    cell.style.backgroundColor = range.value > 0 ? 'rgba(0, 255, 0, 0.2)' : '';
                    totalMin += range.value;
                    totalMax += range.value;
                                } else {
                    cell.textContent = `${range.min}-${range.max}`;
                    cell.style.backgroundColor = 'rgba(255, 255, 0, 0.2)'; // Yellow for uncertain
                    cell.title = `Possible range: ${range.min} to ${range.max}`;
                    totalMin += range.min;
                    totalMax += range.max;
                }
                
                row.appendChild(cell);
            });
            
            // Total cell - should NEVER show a range because total cards are always known exactly
            const totalCell = document.createElement('td');
            totalCell.style.textAlign = 'center';
            totalCell.style.padding = '4px 8px';
            totalCell.style.fontWeight = 'bold';
            
            // Calculate exact total from all possible states - should be the same across all states
            const exactTotal = this.getExactTotalCards(playerName);
            totalCell.textContent = exactTotal;
            
            row.appendChild(totalCell);
            
            tbody.appendChild(row);
            
            // Update states count display
            const statesCountElement = document.getElementById('states-count');
            if (statesCountElement) {
                statesCountElement.textContent = this.possibleStates.length;
            }
        }
    };
    
    // Initialize game state
    window.gameState.init();
    
    // Function to create dice table
    function createDiceTable(position = { top: "10px", left: "50px" }) {
        try {
            // Remove existing table if it exists
            const existingTable = document.getElementById('dice-table-container');
            if (existingTable) {
                existingTable.remove();
            }
            
            console.log("Creating dice statistics table");
            
            const container = document.createElement('div');
            container.id = 'dice-table-container';
            container.style.cssText = `
                position: fixed;
                top: ${position.top};
                left: ${position.left};
                z-index: 10000;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                cursor: move;
                user-select: none;
                border: 1px solid #666;
            `;
            
            const table = document.createElement('table');
            table.id = 'dice-table';
            table.style.cssText = 'border-collapse: collapse; width: 100%;';
            
            // Header
            const header = document.createElement('thead');
            header.innerHTML = `
                <tr>
                    <th colspan="4" style="text-align: center; padding: 5px; border-bottom: 1px solid #666;">
                        Dice Statistics
                    </th>
                </tr>
                <tr style="border-bottom: 1px solid #666;">
                    <th style="padding: 3px 6px;">Roll</th>
                    <th style="padding: 3px 6px;">Count</th>
                    <th style="padding: 3px 6px;">%</th>
                    <th style="padding: 3px 6px;">Ratio</th>
                </tr>
            `;
            table.appendChild(header);
            
            // Body
            const tbody = document.createElement('tbody');
            for (let i = 2; i <= 12; i++) {
                const row = document.createElement('tr');
                const expected = window.gameState.getDiceExpectedPercentage(i);
                
                row.innerHTML = `
                    <td style="padding: 2px 6px; text-align: center;">${i}</td>
                    <td id="count-${i}" style="padding: 2px 6px; text-align: center;">0</td>
                    <td id="percentage-${i}" style="padding: 2px 6px; text-align: center;">0.0%</td>
                    <td id="expected-${i}" style="padding: 2px 6px; text-align: center;">0.00</td>
                `;
                tbody.appendChild(row);
            }
            
            // Total row
            const totalRow = document.createElement('tr');
            totalRow.style.borderTop = '1px solid #666';
            totalRow.innerHTML = `
                <td style="padding: 3px 6px; font-weight: bold;">Total</td>
                <td id="dice-total-rolls" style="padding: 3px 6px; text-align: center; font-weight: bold;">0</td>
                <td colspan="2"></td>
            `;
            tbody.appendChild(totalRow);
            
            table.appendChild(tbody);
            container.appendChild(table);
            
            // Make draggable
            makeDraggable(container, 'diceTablePosition');
            
            document.body.appendChild(container);
            console.log("Dice table created successfully");
                                } catch (error) {
            console.error("Error creating dice table:", error);
        }
    }
    
    // Function to create resource table
    function createResourceTable(position = { top: "10px", left: "400px" }) {
        try {
            // Remove existing table if it exists
            const existingTable = document.getElementById('resource-table-container');
            if (existingTable) {
                existingTable.remove();
            }
            
            console.log("Creating resource tracking table");
            
            const container = document.createElement('div');
            container.id = 'resource-table-container';
            container.style.cssText = `
                position: fixed;
                top: ${position.top};
                left: ${position.left};
                z-index: 10000;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                cursor: move;
                user-select: none;
                border: 1px solid #666;
            `;
            
            const table = document.createElement('table');
            table.id = 'resource-table';
            table.style.cssText = 'border-collapse: collapse;';
            
            // Header
            const header = document.createElement('thead');
            header.innerHTML = `
                <tr>
                    <th colspan="7" style="text-align: center; padding: 5px; border-bottom: 1px solid #666;">
                        Advanced Resource Tracker
                        <div style="font-size: 10px; font-weight: normal;">
                            States: <span id="states-count">1</span> | 
                            <span style="color: #0f0;">Green = Certain</span> | 
                            <span style="color: #ff0;">Yellow = Range</span>
                        </div>
                    </th>
                </tr>
                <tr style="border-bottom: 1px solid #666;">
                    <th style="padding: 3px 6px;">Player</th>
                    <th style="padding: 3px 6px;">🌲</th>
                    <th style="padding: 3px 6px;">🧱</th>
                    <th style="padding: 3px 6px;">🐑</th>
                    <th style="padding: 3px 6px;">🌾</th>
                    <th style="padding: 3px 6px;">⛰️</th>
                    <th style="padding: 3px 6px;">Total</th>
                </tr>
            `;
            table.appendChild(header);
            
            const tbody = document.createElement('tbody');
            table.appendChild(tbody);
            
            container.appendChild(table);
            
            // Make draggable
            makeDraggable(container, 'resourceTablePosition');
            
            document.body.appendChild(container);
            console.log("Resource table created successfully");
        } catch (error) {
            console.error("Error creating resource table:", error);
        }
    }
    
    // Function to make elements draggable
    function makeDraggable(element, storageKey) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        element.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === element || e.target.closest(`#${element.id}`)) {
                isDragging = true;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            
            if (storageKey) {
                // Save position
                const rect = element.getBoundingClientRect();
                localStorage.setItem(storageKey, JSON.stringify({
                    top: `${rect.top}px`,
                    left: `${rect.left}px`
                }));
            }
        });
    }
    
    // Function to find the game log container - updated for the specific HTML structure
    function findGameLogContainer() {
        try {
            console.log("Searching for game feeds container...");
            
            // Look for the specific game feeds container structure
            const gameFeedsContainer = document.querySelector('.gameFeedsContainer-jBSxvDCV');
            if (gameFeedsContainer) {
                console.log("Found gameFeedsContainer-jBSxvDCV");
                const virtualScroller = gameFeedsContainer.querySelector('.virtualScroller-lSkdkGJi');
                if (virtualScroller) {
                    console.log("Found virtualScroller within game feeds container");
                    return virtualScroller;
                }
            }
            
            // Fallback: look for virtualScroller directly
            const virtualScroller = document.querySelector('.virtualScroller-lSkdkGJi');
            if (virtualScroller) {
                console.log("Found virtualScroller directly");
                return virtualScroller;
            }
            
            // Look for the container that has feedMessage elements
            const feedMessages = document.querySelectorAll('.feedMessage-O8TLknGe');
            if (feedMessages.length > 0) {
                let parent = feedMessages[0].parentElement;
                while (parent && !parent.classList.contains('virtualScroller-lSkdkGJi')) {
                    parent = parent.parentElement;
                }
                if (parent) {
                    console.log("Found container by tracing up from feedMessage");
                    return parent;
                }
            }
            
            console.log("No game log container found");
            return null;
                                } catch (error) {
            console.error("Error finding game log container:", error);
            return null;
        }
    }

    // Function to parse dice rolls from log entries
    function parseDiceRoll(entry) {
        try {
            const text = entry.textContent || '';
            
            // Look for dice images
            const diceImages = entry.querySelectorAll('img[src*="dice"], img[alt*="dice"]');
            if (diceImages.length >= 2) {
                const diceValues = Array.from(diceImages).map(img => {
                    const src = img.src || '';
                    const alt = img.alt || '';
                    const match = (src + alt).match(/dice[_\s]*(\d+)/i);
                    return match ? parseInt(match[1]) : null;
                    }).filter(Boolean);
                    
                    if (diceValues.length >= 2) {
                        const sum = diceValues.reduce((a, b) => a + b, 0);
                    console.log(`Found dice roll: ${diceValues.join(' + ')} = ${sum}`);
                    window.gameState.incrementDiceCount(sum);
            return true;
                    }
                }
                
            // Fallback: parse text for dice rolls
            const rollMatch = text.match(/rolled.*?(\d+).*?(\d+)/i);
            if (rollMatch) {
                const dice1 = parseInt(rollMatch[1]);
                const dice2 = parseInt(rollMatch[2]);
                if (dice1 >= 1 && dice1 <= 6 && dice2 >= 1 && dice2 <= 6) {
                    const sum = dice1 + dice2;
                    console.log(`Found dice roll from text: ${dice1} + ${dice2} = ${sum}`);
                    window.gameState.incrementDiceCount(sum);
            return true;
                }
            }
            
            return false;
                } catch (error) {
            console.error("Error parsing dice roll:", error);
                            return false;
                        }
    }
    
    // Advanced parsing functions for the specific HTML structure
    function parseGameAction(entry) {
        try {
            const messageSpan = entry.querySelector('.messagePart-XeUsOgLX');
            if (!messageSpan) return false;
            
            const text = messageSpan.textContent.trim();
            if (!text || text === 'Happy settling!' || text.includes('Learn how to play')) {
                return false; // Skip system messages
            }
            
            // Create unique identifier for this specific entry content
            const parentContainer = entry.closest('.scrollItemContainer-WXX2rkzf');
            const dataIndex = parentContainer ? parentContainer.dataset.index : 'unknown';
            const contentHash = text.substring(0, 50) + dataIndex + (messageSpan.innerHTML.length || 0);
            
            if (window.gameState.processedEntries.has(contentHash)) {
                console.log(`Skipping already processed entry ${dataIndex}: ${text.substring(0, 30)}...`);
                return false; // Already processed this entry
            }
            
            console.log(`Processing entry ${dataIndex}: ${text.substring(0, 60)}...`);
            
            // Enhanced logging for debugging 1v1 mode
            const playerSpans = messageSpan.querySelectorAll('span[style*="color"]');
            if (playerSpans.length > 0) {
                const playerInfo = Array.from(playerSpans).map(span => ({
                    name: span.textContent.trim(),
                    color: span.style.color
                }));
                console.log(`[PARSE] Found players in message:`, playerInfo);
            }
            
            // Mark as processed
            window.gameState.processedEntries.add(contentHash);
            
            // Parse different types of actions
            const actions = [
                parseDiceRollAction,
                parseResourceGainAction,
                parseTradeAction,
                parseBankTradeAction,
                parseDiscardAction,
                parseStealAction,
                parseCardUsageAction,
                parseRobberAction,
                parseBuildAction,
                parseBuyAction
            ];
            
            for (const parseAction of actions) {
                if (parseAction(entry, messageSpan)) {
                    console.log(`Successfully parsed: ${text.substring(0, 60)}...`);
                    return true;
                }
            }
            
            console.log(`No parser matched: ${text.substring(0, 60)}...`);
            return false;
        } catch (error) {
            console.error("Error parsing game action:", error);
            return false;
        }
    }
    
    function parseDiceRollAction(entry, messageSpan) {
        try {
            const diceImages = messageSpan.querySelectorAll('img[alt*="dice_"]');
            if (diceImages.length >= 2) {
                const playerSpan = messageSpan.querySelector('span[style*="color"]');
                if (!playerSpan) return false;
                
                const playerName = playerSpan.textContent.trim();
                const playerColor = playerSpan.style.color || '#ffffff';
                
                // Extract dice values
                const diceValues = Array.from(diceImages).map(img => {
                    const match = img.alt.match(/dice_(\d+)/);
                    return match ? parseInt(match[1]) : null;
                }).filter(Boolean);
                
                if (diceValues.length >= 2) {
                    const sum = diceValues.reduce((a, b) => a + b, 0);
                    console.log(`${playerName} rolled: ${diceValues.join(' + ')} = ${sum}`);
                    
                    // Add player and track dice roll
                    window.gameState.addPlayer(playerName, playerColor);
                    window.gameState.incrementDiceCount(sum);
                    
                    // This player is actively rolling, so they're likely the current player
                    window.gameState.setCurrentPlayer(playerName);
                    
                    // Track dice roll action for game phase detection
                    window.gameState.addAction({
                        type: 'dice_roll',
                        player: playerName,
                        roll: sum
                    });
                    
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Error parsing dice roll:", error);
            return false;
        }
    }
    
    function parseResourceGainAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[RESOURCE] Checking text: "${text}"`);
            
            // IMPORTANT: Skip if this is a trade message (should be handled by trade parser)
            if (text.includes('gave') && text.includes('and got') && text.includes('from')) {
                console.log(`[RESOURCE] Skipping trade message - should be handled by trade parser`);
                return false;
            }
            
            const playerSpan = messageSpan.querySelector('span[style*="color"]');
            if (!playerSpan) {
                console.log(`[RESOURCE] No player span found`);
                return false;
            }
            
            const playerName = playerSpan.textContent.trim();
            const playerColor = playerSpan.style.color || '#ffffff';
            const messageText = text;
            console.log(`[RESOURCE] Player: ${playerName}, Message: "${messageText}"`);
            
            // Look for resource cards
            const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
            console.log(`[RESOURCE] Found ${resourceImages.length} resource images`);
            
            if (resourceImages.length > 0 && (messageText.includes('got') || messageText.includes('received starting resources'))) {
                const resourceMap = {
                    'Lumber': 'lumber',
                    'Brick': 'brick', 
                    'Wool': 'wool',
                    'Grain': 'grain',
                    'Ore': 'ore'
                };
                
                // Count each resource type
                const resourceCounts = {
                    lumber: 0,
                    brick: 0,
                    wool: 0,
                    grain: 0,
                    ore: 0
                };
                
                resourceImages.forEach((img, index) => {
                    const resourceType = resourceMap[img.alt];
                    console.log(`[RESOURCE] Image ${index}: ${img.alt} -> ${resourceType}`);
                    if (resourceType) {
                        resourceCounts[resourceType]++;
                    }
                });
                
                console.log(`[RESOURCE] Resource counts:`, resourceCounts);
                
                // Add player and track all resource gains
                window.gameState.addPlayer(playerName, playerColor);
                
                for (const [resource, count] of Object.entries(resourceCounts)) {
                    if (count > 0) {
                        console.log(`[RESOURCE] PROCESSING: ${playerName} ${messageText.includes('starting') ? 'received starting' : 'got'} ${count}x ${resource}`);
                        window.gameState.addAction({
                            type: 'got_resource',
                            player: playerName,
                            resource: resource,
                            amount: count
                        });
                    }
                }
                
                return true;
    } else {
                console.log(`[RESOURCE] Not processing: resourceImages=${resourceImages.length}, got=${messageText.includes('got')}, starting=${messageText.includes('received starting resources')}`);
            }
            
            return false;
        } catch (error) {
            console.error("Error parsing resource gain:", error);
            return false;
        }
    }
    
    function parseTradeAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[TRADE] Checking text: "${text}"`);
            
            // Look for trade patterns like "Player1 gave X and got Y from Player2"
            if (text.includes('gave') && text.includes('and got') && text.includes('from')) {
                console.log(`[TRADE] Found trade pattern in text`);
                
                const tradeMatch = text.match(/(\w+)\s+gave\s+.*?\s+and\s+got\s+.*?\s+from\s+(\w+)/);
                if (tradeMatch) {
                    const trader = tradeMatch[1]; // Person who initiated trade
                    const partner = tradeMatch[2]; // Person they traded with
                    console.log(`[TRADE] Trader: ${trader}, Partner: ${partner}`);
                    
                    // Extract resources from images - should be exactly 2 for a simple trade
                    const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
                    console.log(`[TRADE] Found ${resourceImages.length} resource images`);
                    
                    if (resourceImages.length >= 2) {
                        const resourceMap = {
                            'Lumber': 'lumber',
                            'Brick': 'brick', 
                            'Wool': 'wool',
                            'Grain': 'grain',
                            'Ore': 'ore'
                        };
                        
                        // Log all found resource images
                        resourceImages.forEach((img, index) => {
                            console.log(`[TRADE] Resource image ${index}: ${img.alt}`);
                        });
                        
                        // Parse the trade by finding "and got" position in the text
                        const textLower = text.toLowerCase();
                        const andGotIndex = textLower.indexOf('and got');
                        
                        if (andGotIndex === -1) {
                            console.log(`[TRADE] Could not find 'and got' in trade text`);
                            return false;
                        }
                        
                        // Count resources before "and got" (what trader gave)
                        const beforeAndGot = text.substring(0, andGotIndex);
                        const afterAndGot = text.substring(andGotIndex);
                        
                        // Count resource images in each section by looking at innerHTML
                        const beforeHTML = messageSpan.innerHTML.substring(0, messageSpan.innerHTML.toLowerCase().indexOf('and got'));
                        const afterHTML = messageSpan.innerHTML.substring(messageSpan.innerHTML.toLowerCase().indexOf('and got'));
                        
                        const beforeResourceCount = (beforeHTML.match(/alt="(Lumber|Brick|Wool|Grain|Ore)"/g) || []).length;
                        const afterResourceCount = (afterHTML.match(/alt="(Lumber|Brick|Wool|Grain|Ore)"/g) || []).length;
                        
                        console.log(`[TRADE] Before 'and got': ${beforeResourceCount} resources`);
                        console.log(`[TRADE] After 'and got': ${afterResourceCount} resources`);
                        
                        if (beforeResourceCount === 0 || afterResourceCount === 0) {
                            console.log(`[TRADE] Invalid trade - missing gave or received resources`);
                            return false;
                        }
                        
                        // Get the resources trader gave (first N resources)
                        const traderGaveResources = Array.from(resourceImages).slice(0, beforeResourceCount).map(img => resourceMap[img.alt]);
                        // Get the resources trader received (remaining resources)
                        const traderReceivedResources = Array.from(resourceImages).slice(beforeResourceCount).map(img => resourceMap[img.alt]);
                        
                        console.log(`[TRADE] ${trader} gave:`, traderGaveResources);
                        console.log(`[TRADE] ${trader} received:`, traderReceivedResources);
                        
                        // Count resources by type
                        const traderGaveCounts = {};
                        const traderReceivedCounts = {};
                        
                        traderGaveResources.forEach(resource => {
                            traderGaveCounts[resource] = (traderGaveCounts[resource] || 0) + 1;
                        });
                        
                        traderReceivedResources.forEach(resource => {
                            traderReceivedCounts[resource] = (traderReceivedCounts[resource] || 0) + 1;
                        });
                        
                        console.log(`[TRADE] VALID TRADE: ${trader} gave`, traderGaveCounts, `and received`, traderReceivedCounts, `from ${partner}`);
                            
                            // Make sure both players exist in game state
                            window.gameState.addPlayer(trader);
                            window.gameState.addPlayer(partner);
                            
                            // Process the trade
                            window.gameState.addAction({
                            type: 'traded_complex',
                                trader: trader,
                                partner: partner,
                            traderGave: traderGaveCounts,
                            traderReceived: traderReceivedCounts
                            });
                            
                            return true;
                    } else {
                        console.log(`[TRADE] Not enough resource images found (need 2, got ${resourceImages.length})`);
                    }
                } else {
                    console.log(`[TRADE] Trade regex didn't match`);
        }
    } else {
                console.log(`[TRADE] Not a trade message (missing required words)`);
            }
            
            return false;
                } catch (error) {
            console.error("Error parsing trade:", error);
        return false;
    }
    }
    
    function parseBankTradeAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[BANK] Checking text: "${text}"`);
            
            // Look for bank trade patterns like "Player gave bank X and took Y"
            if (text.includes('gave bank') && text.includes('and took')) {
                console.log(`[BANK] Found bank trade pattern`);
                
                const bankTradeMatch = text.match(/(\w+)\s+gave bank\s+.*?\s+and took\s+/);
                if (bankTradeMatch) {
                    const player = bankTradeMatch[1];
                    console.log(`[BANK] Player: ${player}`);
                    
                    // Extract all resource images
                    const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
                    console.log(`[BANK] Found ${resourceImages.length} resource images`);
                    
                    if (resourceImages.length >= 2) {
                        const resourceMap = {
                            'Lumber': 'lumber',
                            'Brick': 'brick', 
                            'Wool': 'wool',
                            'Grain': 'grain',
                            'Ore': 'ore'
                        };
                        
                        // Find the "and took" position to split gave vs received
                        const textParts = text.split('and took');
                        if (textParts.length === 2) {
                            const gaveText = textParts[0];
                            
                            // Count resources before "and took"
                            const gaveResources = {};
                            const receivedResources = {};
                            
                            let foundAndTook = false;
                            resourceImages.forEach((img, index) => {
                                const resourceType = resourceMap[img.alt];
                                console.log(`[BANK] Image ${index}: ${img.alt} -> ${resourceType}`);
                                
                                if (resourceType) {
                                    // Check if this image appears before "and took" in the HTML
                                    const imgHTML = img.outerHTML;
                                    const fullHTML = messageSpan.innerHTML;
                                    const imgPosition = fullHTML.indexOf(imgHTML);
                                    const andTookPosition = fullHTML.indexOf('and took');
                                    
                                    if (imgPosition < andTookPosition) {
                                        // Resource was given to bank
                                        gaveResources[resourceType] = (gaveResources[resourceType] || 0) + 1;
                                    } else {
                                        // Resource was received from bank
                                        receivedResources[resourceType] = (receivedResources[resourceType] || 0) + 1;
                                    }
                                }
                            });
                            
                            console.log(`[BANK] Player gave:`, gaveResources);
                            console.log(`[BANK] Player received:`, receivedResources);
                            
                            if (Object.keys(gaveResources).length > 0 && Object.keys(receivedResources).length > 0) {
                                console.log(`[BANK] VALID BANK TRADE: ${player} traded with bank`);
                                
                                // Make sure player exists
                                window.gameState.addPlayer(player);
                                
                                // Process the bank trade
                                window.gameState.addAction({
                                    type: 'bank_trade',
                                    player: player,
                                    gave: gaveResources,
                                    received: receivedResources
                                });
                                
            return true;
    } else {
                                console.log(`[BANK] Invalid bank trade - no resources found`);
                            }
        }
    } else {
                        console.log(`[BANK] Not enough resource images for bank trade`);
                    }
                } else {
                    console.log(`[BANK] Bank trade regex didn't match`);
                }
            } else {
                console.log(`[BANK] Not a bank trade message`);
            }
            
            return false;
    } catch (error) {
            console.error("Error parsing bank trade:", error);
            return false;
        }
    }
    
    function parseDiscardAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[DISCARD] Checking text: "${text}"`);
            
            // Look for discard patterns like "Player discarded X"
            if (text.includes('discarded')) {
                console.log(`[DISCARD] Found discard pattern`);
                
                const playerSpan = messageSpan.querySelector('span[style*="color"]');
                if (playerSpan) {
                    const playerName = playerSpan.textContent.trim();
                    console.log(`[DISCARD] Player: ${playerName}`);
                    
                    // Extract resource images
                    const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
                    console.log(`[DISCARD] Found ${resourceImages.length} resource images`);
                    
                    if (resourceImages.length > 0) {
                        const resourceMap = {
                            'Lumber': 'lumber',
                            'Brick': 'brick', 
                            'Wool': 'wool',
                            'Grain': 'grain',
                            'Ore': 'ore'
                        };
                        
                        // Count each resource type discarded
                        const discardedResources = {};
                        resourceImages.forEach((img, index) => {
                            const resourceType = resourceMap[img.alt];
                            console.log(`[DISCARD] Image ${index}: ${img.alt} -> ${resourceType}`);
                            if (resourceType) {
                                discardedResources[resourceType] = (discardedResources[resourceType] || 0) + 1;
                            }
                        });
                        
                        console.log(`[DISCARD] Player discarded:`, discardedResources);
                        
                        if (Object.keys(discardedResources).length > 0) {
                            console.log(`[DISCARD] VALID DISCARD: ${playerName} discarded resources`);
                            
                            // Make sure player exists
                            window.gameState.addPlayer(playerName);
                            
                            // Process the discard as spending resources
                            window.gameState.addAction({
                                type: 'spent_resources',
                                player: playerName,
                                cost: discardedResources,
                                reason: 'discard'
                            });
                            
            return true;
        }
        } else {
                        console.log(`[DISCARD] No resource images found`);
        }
    } else {
                    console.log(`[DISCARD] No player span found`);
        }
    } else {
                console.log(`[DISCARD] Not a discard message`);
            }
            
            return false;
                } catch (error) {
            console.error("Error parsing discard action:", error);
            return false;
        }
    }
    
    function parseCardUsageAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[CARD] Checking text: "${text}"`);
            
            if (text.includes('used') && text.includes('Road Building')) {
                console.log(`[CARD] Found Road Building card usage`);
                
                const playerSpan = messageSpan.querySelector('span[style*="color"]');
                if (playerSpan) {
                    const playerName = playerSpan.textContent.trim();
                    console.log(`[CARD] Player: ${playerName} used Road Building`);
                    
                    // Track that this player gets 2 free roads
                    window.gameState.activeCardEffects[playerName] = {
                        type: 'road_building',
                        freeRoads: 2
                    };
                    
                    console.log(`[CARD] ROAD BUILDING ACTIVATED: ${playerName} gets 2 free roads`);
                    window.gameState.addPlayer(playerName);
            return true;
        } else {
                    console.log(`[CARD] No player span found in card usage`);
        }
    } else {
                console.log(`[CARD] Not a card usage message`);
            }
            return false;
        } catch (error) {
            console.error("Error parsing card usage:", error);
        return false;
    }
}

    function parseStealAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[STEAL] Checking text: "${text}"`);
            
            // Look for steal patterns
            if (text.includes('stole') && text.includes('from')) {
                console.log(`[STEAL] Found steal pattern`);
                
                // Check for "You stole X from Player" pattern first (player is the robber)
                if (text.startsWith('You stole')) {
                    console.log(`[STEAL] Player is the robber (You stole pattern)`);
                    
                    const youStoleMatch = text.match(/You stole\s+.*?\s+from\s+(\w+)/);
                    if (youStoleMatch) {
                        const victim = youStoleMatch[1];
                        console.log(`[STEAL] You stole from: ${victim}`);
                        
                        // Check for specific resource images - should always be present in "You stole" messages
                        const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
                        if (resourceImages.length > 0) {
                            const resourceMap = {
                                'Lumber': 'lumber',
                                'Brick': 'brick', 
                                'Wool': 'wool',
                                'Grain': 'grain',
                                'Ore': 'ore'
                            };
                            
                            const stolenResource = resourceMap[resourceImages[0].alt];
                            if (stolenResource) {
                                console.log(`[STEAL] YOU STOLE KNOWN RESOURCE: You stole ${stolenResource} from ${victim}`);
                                
                                // Get the current player name
                                const currentPlayer = window.gameState.getCurrentPlayer();
                                console.log(`[STEAL] Current player (You) is: ${currentPlayer}`);
                                console.log(`[STEAL] Processing direct steal: ${currentPlayer} +1 ${stolenResource}, ${victim} -1 ${stolenResource}`);
                                
                                // Make sure both players exist
                                window.gameState.addPlayer(currentPlayer);
                                window.gameState.addPlayer(victim);
                                
                                // Process as specific resource steal - no uncertainty here!
                                window.gameState.addAction({
                                    type: 'robbed_specific',
                                    robber: currentPlayer,
                                    victim: victim,
                                    resource: stolenResource
                                });
                                
            return true;
        }
    } else {
                            console.log(`[STEAL] You stole message but no resource images found`);
                        }
                    }
                } else {
                    // Handle third-person steal patterns like "Player stole X from Player2"
                    const stealMatch = text.match(/(\w+)\s+stole\s+.*?\s+from\s+(\w+)/);
                    if (stealMatch) {
                        const robber = stealMatch[1];
                        let victim = stealMatch[2];
                        
                        // Resolve "you" to the actual current player
                        if (victim.toLowerCase() === 'you') {
                            victim = window.gameState.getCurrentPlayer();
                            console.log(`[STEAL] Resolved 'you' to current player: ${victim}`);
                        }
                        
                        console.log(`[STEAL] Third-person steal - Robber: ${robber}, Victim: ${victim}`);
                        
                        // Check if it's a resource card back (unknown resource)
                        const resourceCardBack = messageSpan.querySelector('img[alt*="Resource Card"]');
                        if (resourceCardBack) {
                            console.log(`[STEAL] UNKNOWN RESOURCE STOLEN: ${robber} stole from ${victim}`);
                            
                            // Make sure both players exist
                            window.gameState.addPlayer(robber);
                            window.gameState.addPlayer(victim);
                            
                            // Process the steal - this creates multiple possible states
                            window.gameState.addAction({
                                type: 'robbed',
                                robber: robber,
                                victim: victim
                            });
                            
                            return true;
} else {
                            // Check for specific resource images (when other players see the exact steal)
                            const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
                            if (resourceImages.length > 0) {
                                const resourceMap = {
                                    'Lumber': 'lumber',
                                    'Brick': 'brick', 
                                    'Wool': 'wool',
                                    'Grain': 'grain',
                                    'Ore': 'ore'
                                };
                                
                                const stolenResource = resourceMap[resourceImages[0].alt];
                                if (stolenResource) {
                                    console.log(`[STEAL] KNOWN THIRD-PERSON STEAL: ${robber} stole ${stolenResource} from ${victim}`);
                                    
                                    // Make sure both players exist
                                    window.gameState.addPlayer(robber);
                                    window.gameState.addPlayer(victim);
                                    
                                    // Process as specific resource steal
                                    window.gameState.addAction({
                                        type: 'robbed_specific',
                                        robber: robber,
                                        victim: victim,
                                        resource: stolenResource
                                    });
                                    
                                    return true;
                                }
                            }
                            
                            console.log(`[STEAL] No valid resource found in third-person steal message`);
                        }
                    } else {
                        console.log(`[STEAL] Steal regex didn't match`);
                    }
                }
} else {
                console.log(`[STEAL] Not a steal message`);
            }
            
            return false;
        } catch (error) {
            console.error("Error parsing steal action:", error);
            return false;
        }
    }

    function parseRobberAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            const robberImg = messageSpan.querySelector('img[alt="robber"]');
            
            if (robberImg && text.includes('moved Robber')) {
                const playerSpan = messageSpan.querySelector('span[style*="color"]');
                if (playerSpan) {
                    const playerName = playerSpan.textContent.trim();
                    console.log(`${playerName} moved the robber`);
                    return true;
                }
                }
                
                return false;
    } catch (error) {
            console.error("Error parsing robber action:", error);
            return false;
        }
    }
    
    function parseBuildAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[BUILD] Checking text: "${text}"`);
            
            // Look for building actions - both "built" and "placed"
            if (text.includes('built') || text.includes('placed')) {
                console.log(`[BUILD] Found build/place action`);
                
                const playerSpan = messageSpan.querySelector('span[style*="color"]');
                if (playerSpan) {
                    const playerName = playerSpan.textContent.trim();
                    console.log(`[BUILD] Player: ${playerName}`);
                    
                    // Player is actively building, so they're likely the current player
                    window.gameState.setCurrentPlayer(playerName);
                    
                    // Determine what was built/placed and the cost
                    let cost = {};
                    let actionType = '';
                    
                    if (text.includes('Settlement') || text.includes('settlement')) {
                        cost = { lumber: 1, brick: 1, wool: 1, grain: 1 };
                        actionType = 'Settlement';
                        
                        // Check for settlement color variations in 1v1 mode
                        const settlementImage = messageSpan.querySelector('img[alt*="settlement"]');
                        if (settlementImage) {
                            console.log(`[BUILD] Settlement image src: ${settlementImage.src}`);
                        }
                    } else if (text.includes('City') || text.includes('city')) {
                        cost = { grain: 2, ore: 3 };
                        actionType = 'City';
                    } else if (text.includes('Road') || text.includes('road')) {
                        cost = { lumber: 1, brick: 1 };
                        actionType = 'Road';
                    }
                    
                    console.log(`[BUILD] Detected: ${actionType}, Cost:`, cost);
                    
                    if (Object.keys(cost).length > 0) {
                        // Check if this might be initial placement (free)
                        const isInitialPlacement = window.gameState.isInitialPlacementPhase();
                        console.log(`[BUILD] Is initial placement? ${isInitialPlacement}, Game phase: ${window.gameState.gamePhase}`);
                        
                        if (isInitialPlacement && (actionType === 'Settlement' || actionType === 'Road')) {
                            console.log(`[BUILD] INITIAL PLACEMENT: ${playerName} placed initial ${actionType} (no cost)`);
                            
                            // Track settlement placements for turn order
                            if (actionType === 'Settlement') {
                                window.gameState.initialPlacements++;
                                console.log(`[BUILD] Settlement placement #${window.gameState.initialPlacements} by ${playerName}`);
                                
                                // Second settlement placement determines turn order (players go in reverse order for second settlements)
                                if (window.gameState.initialPlacements >= 5) { // After first round of settlements (4 players), second settlements determine turn order
                                    window.gameState.addToTurnOrder(playerName);
                                }
                            }
                            
                            // Don't subtract resources during initial placement
                            return true;
                        } else {
                            // Check for active card effects (like Road Building)
                            const cardEffect = window.gameState.activeCardEffects[playerName];
                            if (cardEffect && cardEffect.type === 'road_building' && actionType === 'Road' && cardEffect.freeRoads > 0) {
                                console.log(`[BUILD] FREE ROAD FROM CARD: ${playerName} placed ${actionType} (Road Building card - ${cardEffect.freeRoads} free roads left)`);
                                cardEffect.freeRoads--;
                                
                                // Remove effect when no free roads left
                                if (cardEffect.freeRoads === 0) {
                                    delete window.gameState.activeCardEffects[playerName];
                                    console.log(`[BUILD] Road Building effect expired for ${playerName}`);
                                }
                                
                                window.gameState.addPlayer(playerName);
                                return true;
                            } else {
                                console.log(`[BUILD] MAIN GAME: ${playerName} built ${actionType} - deducting cost:`, cost);
                                
                                // Make sure player exists in game state
                                window.gameState.addPlayer(playerName);
                                
                                window.gameState.addAction({
                                    type: 'spent_resources',
                                    player: playerName,
                                    cost: cost,
                                    building: actionType
                                });
                                
                                return true;
                            }
                        }
} else {
                        console.log(`[BUILD] Unknown building type in: "${text}"`);
        }
    } else {
                    console.log(`[BUILD] No player span found`);
                }
            } else {
                console.log(`[BUILD] Not a build/place action`);
                }
                
                return false;
    } catch (error) {
            console.error("Error parsing build action:", error);
            return false;
        }
    }
    
    // Add parser for buying actions (development cards, etc.)
    function parseBuyAction(entry, messageSpan) {
        try {
            const text = messageSpan.textContent;
            console.log(`[BUY] Checking text: "${text}"`);
            
            if (text.includes('bought')) {
                console.log(`[BUY] Found 'bought' in text`);
                
                const playerSpan = messageSpan.querySelector('span[style*="color"]');
                if (playerSpan) {
                    const playerName = playerSpan.textContent.trim();
                    console.log(`[BUY] Player: ${playerName}`);
                    
                    // Player is actively buying, so they're likely the current player
                    window.gameState.setCurrentPlayer(playerName);
                    
                    // Check what was bought by looking at images and text
                    let cost = {};
                    let itemBought = '';
                    
                    // Check for development card images
                    const devCardImage = messageSpan.querySelector('img[alt*="Development Card"], img[src*="devcardback"]');
                    if (devCardImage || text.includes('Development Card')) {
                        cost = { grain: 1, ore: 1, wool: 1 };
                        itemBought = 'Development Card';
                        console.log(`[BUY] Detected Development Card purchase`);
                    }
                    
                    if (Object.keys(cost).length > 0) {
                        console.log(`[BUY] ${playerName} bought ${itemBought}, deducting cost:`, cost);
                        
                        // Make sure player exists
                        window.gameState.addPlayer(playerName);
                        
                        window.gameState.addAction({
                            type: 'spent_resources',
                            player: playerName,
                            cost: cost,
                            reason: `bought ${itemBought}`
                        });
                        
                    return true;
                    } else {
                        console.log(`[BUY] Could not determine what was bought or cost`);
                    }
                } else {
                    console.log(`[BUY] No player span found`);
                }
            } else {
                console.log(`[BUY] No 'bought' keyword found`);
                }
                
                return false;
    } catch (error) {
            console.error("Error parsing buy action:", error);
            return false;
        }
    }
                
    // Prevent multiple observers
    let observerSetup = false;
    
    // Function to setup observer for the game log
    function setupObserver() {
        if (observerSetup) {
            console.log("Observer already set up, skipping");
                    return true;
                }
                
        const gameLogContainer = findGameLogContainer();
        if (!gameLogContainer) {
            console.log("Game log container not found, will retry later");
                return false;
        }
        
        console.log("Setting up mutation observer for game log");
        observerSetup = true;
        
        // Parse existing entries
        const existingEntries = gameLogContainer.querySelectorAll('.feedMessage-O8TLknGe');
        console.log(`Found ${existingEntries.length} existing game feed entries`);
        
        // Process entries in chronological order (oldest first)
        const entriesArray = Array.from(existingEntries);
        entriesArray.sort((a, b) => {
            const aIndex = parseInt(a.closest('.scrollItemContainer-WXX2rkzf')?.dataset.index || '0');
            const bIndex = parseInt(b.closest('.scrollItemContainer-WXX2rkzf')?.dataset.index || '0');
            return aIndex - bIndex;
        });
        
        entriesArray.forEach((entry, index) => {
            const parsed = parseGameAction(entry);
            if (index < 5) { // Log first few entries for debugging
                console.log(`Entry ${index} (parsed: ${parsed}):`, entry.textContent.trim().substring(0, 100));
            }
        });
        
        // Setup observer for new entries
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if this is a scrollItemContainer that might contain feed messages
                        if (node.classList && node.classList.contains('scrollItemContainer-WXX2rkzf')) {
                            const feedMessage = node.querySelector('.feedMessage-O8TLknGe');
                            if (feedMessage) {
                                const text = feedMessage.textContent.trim();
                                if (text && !text.includes('Learn how to play')) {
                                    console.log("New scroll item with feed message:", text.substring(0, 50));
                                    parseGameAction(feedMessage);
                                }
                            }
                        }
                        
                        // Check for feed messages within the node
                        const feedMessages = node.querySelectorAll && node.querySelectorAll('.feedMessage-O8TLknGe');
                        if (feedMessages && feedMessages.length > 0) {
                            feedMessages.forEach(entry => {
                                const text = entry.textContent.trim();
                                if (text && !text.includes('Learn how to play')) {
                                    console.log("Processing feed message:", text.substring(0, 50));
                                    parseGameAction(entry);
                                }
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(gameLogContainer, {
            childList: true,
            subtree: true
        });
        
        console.log("Observer setup complete");
            return true;
    }
    
    // Load saved table positions
    function loadTablePositions() {
        try {
            const savedDicePosition = localStorage.getItem('diceTablePosition');
            const savedResourcePosition = localStorage.getItem('resourceTablePosition');
            
            return {
                dice: savedDicePosition ? JSON.parse(savedDicePosition) : { top: "10px", left: "50px" },
                resource: savedResourcePosition ? JSON.parse(savedResourcePosition) : { top: "10px", left: "400px" }
            };
        } catch (error) {
            console.error("Error loading table positions:", error);
            return {
                dice: { top: "10px", left: "50px" },
                resource: { top: "10px", left: "400px" }
            };
        }
    }
    
    // Initialize extension
    function initializeExtension() {
        console.log("Initializing CATAN Card Counter extension");
        
        // Check if we're on colonist.io
        if (!window.location.hostname.includes('colonist.io')) {
            console.log("Not on colonist.io, extension will not activate");
        return;
    }
    
        // Reset state if reinitializing
        if (window.gameState) {
            window.gameState.processedEntries.clear();
            window.gameState.possibleStates = [{}];
            window.gameState.confirmedActions = [];
            window.gameState.players = {};
            console.log("Reset game state for reinitialization");
        }
        
        // Initialize current player detection (with slight delay to ensure DOM is loaded)
        setTimeout(() => {
            window.gameState.initializeCurrentPlayer();
        }, 500);
        
        // Load table positions
        const positions = loadTablePositions();
        
        // Create tables immediately
        createDiceTable(positions.dice);
        createResourceTable(positions.resource);
        
        // Setup observer
        if (!setupObserver()) {
            // If observer setup failed, retry periodically
            const retryInterval = setInterval(() => {
                console.log("Retrying observer setup...");
                if (setupObserver()) {
                    clearInterval(retryInterval);
                }
            }, 3000);
            
            // Stop retrying after 30 seconds
            setTimeout(() => {
                clearInterval(retryInterval);
            }, 30000);
        }
        
        console.log("Extension initialization complete");
    }
    
    // Start initialization when page loads
if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
            } else {
        // Page already loaded
        setTimeout(initializeExtension, 1000);
    }
    
    // Also try to initialize after a short delay
    setTimeout(initializeExtension, 2000);
    
})();
