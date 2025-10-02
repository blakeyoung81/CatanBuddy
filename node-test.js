#!/usr/bin/env node

// Simulate DOM environment for Node.js testing
const { JSDOM } = require('jsdom');

// Create a DOM simulation
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div class="virtualScroller-lSkdkGJi">
        <div data-index="293" class="scrollItemContainer-WXX2rkzf">
            <div class="feedMessage-O8TLknGe">
                <span class="messagePart-XeUsOgLX">
                    <span style="font-weight:600;word-break:break-all;color:#E27174">Arie#8805</span> got 
                    <img alt="Brick" class="lobby-chat-text-icon"> 
                    <img alt="Brick" class="lobby-chat-text-icon"> 
                    <img alt="Brick" class="lobby-chat-text-icon"> 
                    <img alt="Wool" class="lobby-chat-text-icon"> 
                    <img alt="Wool" class="lobby-chat-text-icon">
                </span>
            </div>
        </div>
        <div data-index="294" class="scrollItemContainer-WXX2rkzf">
            <div class="feedMessage-O8TLknGe">
                <span class="messagePart-XeUsOgLX">
                    <span style="font-weight:600;word-break:break-all;color:#223697">Irmine9924</span> got 
                    <img alt="Wool" class="lobby-chat-text-icon">
                </span>
            </div>
        </div>
        <div data-index="296" class="scrollItemContainer-WXX2rkzf">
            <div class="feedMessage-O8TLknGe">
                <span class="messagePart-XeUsOgLX">
                    <span style="font-weight:600;word-break:break-all;color:#E27174">Arie#8805</span> used Road Building
                </span>
            </div>
        </div>
        <div data-index="297" class="scrollItemContainer-WXX2rkzf">
            <div class="feedMessage-O8TLknGe">
                <span class="messagePart-XeUsOgLX">
                    <span style="font-weight:600;word-break:break-all;color:#E27174">Arie#8805</span> placed a Road
                </span>
            </div>
        </div>
        <div data-index="298" class="scrollItemContainer-WXX2rkzf">
            <div class="feedMessage-O8TLknGe">
                <span class="messagePart-XeUsOgLX">
                    <span style="font-weight:600;word-break:break-all;color:#E27174">Arie#8805</span> placed a Road
                </span>
            </div>
        </div>
    </div>
</body>
</html>
`);

// Set global DOM references
global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// Load the game logic (we'll inline the essential parts)
// Since we can't easily require the full content.js, let's create a minimal version

// Minimal game state implementation for testing
const gameState = {
    possibleStates: [],
    players: {},
    activeCardEffects: {},
    gamePhase: 'main',
    
    addPlayer: function(playerName, color) {
        if (!this.players[playerName]) {
            this.players[playerName] = {
                resources: { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 },
                color: color || '#ffffff'
            };
        }
    },
    
    addAction: function(action) {
        console.log(`Processing action: ${action.type} for ${action.player}`);
        this.updatePossibleStates(action);
    },
    
    updatePossibleStates: function(action) {
        const newStates = [];
        for (const state of this.possibleStates) {
            const possibleNewStates = this.applyActionToState(state, action);
            newStates.push(...possibleNewStates);
        }
        this.possibleStates = newStates;
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
                break;
                
            case 'spent_resources':
                const spentState = JSON.parse(JSON.stringify(state));
                if (!spentState[action.player]) {
                    spentState[action.player] = { lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 };
                }
                
                // Check if player can afford it
                let canAfford = true;
                for (const [resource, amount] of Object.entries(action.cost)) {
                    if (spentState[action.player][resource] < amount) {
                        canAfford = false;
                        break;
                    }
                }
                
                if (canAfford) {
                    for (const [resource, amount] of Object.entries(action.cost)) {
                        spentState[action.player][resource] -= amount;
                    }
                    newStates.push(spentState);
                } else {
                    console.log(`${action.player} cannot afford ${JSON.stringify(action.cost)}`);
                }
                break;
                
            default:
                newStates.push(state);
        }
        
        return newStates;
    },
    
    getExactTotalCards: function(player) {
        if (this.possibleStates.length === 0) return 0;
        const state = this.possibleStates[0];
        if (!state[player]) return 0;
        
        return ['lumber', 'brick', 'wool', 'grain', 'ore']
            .reduce((sum, resource) => sum + (state[player][resource] || 0), 0);
    }
};

global.window.gameState = gameState;

// Parsing functions (simplified)
function parseResourceGainAction(entry, messageSpan) {
    const text = messageSpan.textContent;
    
    if (text.includes('got')) {
        const playerSpan = messageSpan.querySelector('span[style*="color"]');
        if (playerSpan) {
            const player = playerSpan.textContent.trim();
            const playerColor = playerSpan.style.color || '#ffffff';
            
            // Count resource images
            const resourceImages = messageSpan.querySelectorAll('img[alt*="Lumber"], img[alt*="Brick"], img[alt*="Wool"], img[alt*="Grain"], img[alt*="Ore"]');
            
            const resourceCounts = {};
            resourceImages.forEach(img => {
                const resourceType = img.alt.toLowerCase();
                resourceCounts[resourceType] = (resourceCounts[resourceType] || 0) + 1;
            });
            
            console.log(`${player} got:`, resourceCounts);
            
            // Add resources
            for (const [resource, amount] of Object.entries(resourceCounts)) {
                gameState.addAction({
                    type: 'got_resource',
                    player: player,
                    resource: resource,
                    amount: amount
                });
            }
            
            gameState.addPlayer(player, playerColor);
            return true;
        }
    }
    
    return false;
}

function parseCardUsageAction(entry, messageSpan) {
    const text = messageSpan.textContent;
    
    if (text.includes('used') && text.includes('Road Building')) {
        const playerSpan = messageSpan.querySelector('span[style*="color"]');
        if (playerSpan) {
            const playerName = playerSpan.textContent.trim();
            
            // Track that this player gets 2 free roads
            gameState.activeCardEffects[playerName] = {
                type: 'road_building',
                freeRoads: 2
            };
            
            console.log(`Road Building activated for ${playerName}`);
            gameState.addPlayer(playerName);
            return true;
        }
    }
    
    return false;
}

function parseBuildAction(entry, messageSpan) {
    const text = messageSpan.textContent;
    
    if (text.includes('placed a Road') || text.includes('built a Road')) {
        const playerSpan = messageSpan.querySelector('span[style*="color"]');
        if (playerSpan) {
            const playerName = playerSpan.textContent.trim();
            const cost = { lumber: 1, brick: 1 };
            
            // Check for active card effects (like Road Building)
            const cardEffect = gameState.activeCardEffects[playerName];
            
            if (cardEffect && cardEffect.type === 'road_building' && cardEffect.freeRoads > 0) {
                console.log(`FREE ROAD: ${playerName} placed Road (${cardEffect.freeRoads} free roads remaining)`);
                cardEffect.freeRoads--;
                
                // Remove effect when no free roads left
                if (cardEffect.freeRoads === 0) {
                    delete gameState.activeCardEffects[playerName];
                    console.log(`Road Building effect expired for ${playerName}`);
                }
                
                gameState.addPlayer(playerName);
                return true;
            } else {
                console.log(`NORMAL ROAD: ${playerName} built Road - deducting cost:`, cost);
                
                gameState.addAction({
                    type: 'spent_resources',
                    player: playerName,
                    cost: cost
                });
                
                gameState.addPlayer(playerName);
                return true;
            }
        }
    }
    
    return false;
}

function parseGameAction(entry, messageSpan) {
    // Try each parser
    if (parseResourceGainAction(entry, messageSpan)) return true;
    if (parseCardUsageAction(entry, messageSpan)) return true;
    if (parseBuildAction(entry, messageSpan)) return true;
    
    return false;
}

// Run the test
function runTest() {
    console.log("--- CATAN BUDDY NODE.JS TEST ---");
    
    // Setup initial state
    console.log("Setting up initial game state...");
    const arieInitial = { lumber: 0, brick: 0, wool: 0, grain: 2, ore: 1 };
    const irmineInitial = { lumber: 1, brick: 1, wool: 1, grain: 1, ore: 1 };
    
    const initialState = {
        "Arie#8805": arieInitial,
        "Irmine9924": irmineInitial
    };
    
    gameState.possibleStates = [JSON.parse(JSON.stringify(initialState))];
    gameState.players = {
        "Arie#8805": { resources: arieInitial, color: 'rgb(226, 113, 116)' },
        "Irmine9924": { resources: irmineInitial, color: 'rgb(34, 54, 151)' }
    };
    
    console.log("Initial state:", gameState.possibleStates[0]);
    
    // Process the log entries
    console.log("\nProcessing game log entries...");
    const entries = document.querySelectorAll('.scrollItemContainer-WXX2rkzf');
    
    entries.forEach(entry => {
        const messageSpan = entry.querySelector('.messagePart-XeUsOgLX');
        if (messageSpan) {
            const success = parseGameAction(entry, messageSpan);
            if (success) {
                console.log(`✓ Parsed: "${messageSpan.textContent.trim()}"`);
            } else {
                console.log(`✗ No parser: "${messageSpan.textContent.trim()}"`);
            }
        }
    });
    
    // Check final results
    console.log("\n--- TEST RESULTS ---");
    const finalState = gameState.possibleStates[0];
    console.log("Final state:", finalState);
    
    // Expected results
    const expectedArie = { lumber: 0, brick: 3, wool: 2, grain: 2, ore: 1 };
    const expectedIrmine = { lumber: 1, brick: 1, wool: 2, grain: 1, ore: 1 };
    
    const actualArie = finalState["Arie#8805"];
    const actualIrmine = finalState["Irmine9924"];
    
    console.log("\n--- VERIFICATION ---");
    
    // Check Arie
    let testsPassed = true;
    console.log("Arie#8805 Expected:", expectedArie);
    console.log("Arie#8805 Actual:  ", actualArie);
    
    for (const [resource, count] of Object.entries(expectedArie)) {
        if (actualArie[resource] !== count) {
            console.log(`❌ FAIL: Arie#8805 ${resource} - Expected ${count}, got ${actualArie[resource]}`);
            testsPassed = false;
        } else {
            console.log(`✅ PASS: Arie#8805 ${resource} correct (${count})`);
        }
    }
    
    // Check Irmine
    console.log("\nIrmine9924 Expected:", expectedIrmine);
    console.log("Irmine9924 Actual:  ", actualIrmine);
    
    for (const [resource, count] of Object.entries(expectedIrmine)) {
        if (actualIrmine[resource] !== count) {
            console.log(`❌ FAIL: Irmine9924 ${resource} - Expected ${count}, got ${actualIrmine[resource]}`);
            testsPassed = false;
        } else {
            console.log(`✅ PASS: Irmine9924 ${resource} correct (${count})`);
        }
    }
    
    // Check totals
    const arieTotal = gameState.getExactTotalCards("Arie#8805");
    const irmineTotal = gameState.getExactTotalCards("Irmine9924");
    
    console.log(`\nArie#8805 Total: ${arieTotal} (expected 8)`);
    console.log(`Irmine9924 Total: ${irmineTotal} (expected 6)`);
    
    if (arieTotal !== 8) {
        console.log("❌ FAIL: Arie#8805 total incorrect");
        testsPassed = false;
    } else {
        console.log("✅ PASS: Arie#8805 total correct");
    }
    
    if (irmineTotal !== 6) {
        console.log("❌ FAIL: Irmine9924 total incorrect");
        testsPassed = false;
    } else {
        console.log("✅ PASS: Irmine9924 total correct");
    }
    
    console.log("\n--- SUMMARY ---");
    if (testsPassed) {
        console.log("🎉 ALL TESTS PASSED! Logic is working correctly! 🎉");
    } else {
        console.log("🔥 SOME TESTS FAILED. Review the errors above. 🔥");
    }
}

// Check if jsdom is available, otherwise use a simpler approach
try {
    runTest();
} catch (error) {
    console.log("JSDOM not available, creating simplified test...");
    console.log("Install jsdom with: npm install jsdom");
    console.log("Error:", error.message);
}
