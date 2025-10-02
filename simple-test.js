#!/usr/bin/env node

// Simple test without external dependencies
console.log("--- CATAN BUDDY LOGIC TEST ---");

// Mock DOM elements for testing
function mockElement(tagName, attributes = {}) {
    return {
        tagName: tagName.toUpperCase(),
        textContent: attributes.textContent || '',
        style: attributes.style || {},
        alt: attributes.alt || '',
        querySelector: function(selector) {
            // Return the first matching mock child
            if (this.children) {
                return this.children.find(child => child.matches && child.matches(selector));
            }
            return null;
        },
        querySelectorAll: function(selector) {
            // Return all matching mock children
            if (this.children) {
                return this.children.filter(child => child.matches && child.matches(selector));
            }
            return [];
        },
        matches: function(selector) {
            // Simple selector matching for our test cases
            if (selector.includes('color')) {
                return this.style.color !== undefined;
            }
            if (selector.includes('alt')) {
                return this.alt !== undefined && this.alt !== '';
            }
            return false;
        },
        children: []
    };
}

// Create mock DOM structure for our test
const mockLogEntries = [
    // Entry 1: Arie#8805 got 3 brick + 2 wool
    {
        messageSpan: mockElement('span', { textContent: 'Arie#8805 got' }),
        resourceImages: [
            mockElement('img', { alt: 'Brick' }),
            mockElement('img', { alt: 'Brick' }),
            mockElement('img', { alt: 'Brick' }),
            mockElement('img', { alt: 'Wool' }),
            mockElement('img', { alt: 'Wool' })
        ]
    },
    // Entry 2: Irmine9924 got 1 wool
    {
        messageSpan: mockElement('span', { textContent: 'Irmine9924 got' }),
        resourceImages: [
            mockElement('img', { alt: 'Wool' })
        ]
    },
    // Entry 3: Arie#8805 used Road Building
    {
        messageSpan: mockElement('span', { textContent: 'Arie#8805 used Road Building' }),
        resourceImages: []
    },
    // Entry 4: Arie#8805 placed a Road (free)
    {
        messageSpan: mockElement('span', { textContent: 'Arie#8805 placed a Road' }),
        resourceImages: []
    },
    // Entry 5: Arie#8805 placed a Road (free)
    {
        messageSpan: mockElement('span', { textContent: 'Arie#8805 placed a Road' }),
        resourceImages: []
    }
];

// Add colored spans to message spans
mockLogEntries[0].messageSpan.children = [
    mockElement('span', { textContent: 'Arie#8805', style: { color: '#E27174' } })
];
mockLogEntries[0].messageSpan.querySelector = function(selector) {
    if (selector.includes('color')) return this.children[0];
    return null;
};
mockLogEntries[0].messageSpan.querySelectorAll = function(selector) {
    if (selector.includes('alt')) return mockLogEntries[0].resourceImages;
    return [];
};

mockLogEntries[1].messageSpan.children = [
    mockElement('span', { textContent: 'Irmine9924', style: { color: '#223697' } })
];
mockLogEntries[1].messageSpan.querySelector = function(selector) {
    if (selector.includes('color')) return this.children[0];
    return null;
};
mockLogEntries[1].messageSpan.querySelectorAll = function(selector) {
    if (selector.includes('alt')) return mockLogEntries[1].resourceImages;
    return [];
};

mockLogEntries[2].messageSpan.children = [
    mockElement('span', { textContent: 'Arie#8805', style: { color: '#E27174' } })
];
mockLogEntries[2].messageSpan.querySelector = function(selector) {
    if (selector.includes('color')) return this.children[0];
    return null;
};

mockLogEntries[3].messageSpan.children = [
    mockElement('span', { textContent: 'Arie#8805', style: { color: '#E27174' } })
];
mockLogEntries[3].messageSpan.querySelector = function(selector) {
    if (selector.includes('color')) return this.children[0];
    return null;
};

mockLogEntries[4].messageSpan.children = [
    mockElement('span', { textContent: 'Arie#8805', style: { color: '#E27174' } })
];
mockLogEntries[4].messageSpan.querySelector = function(selector) {
    if (selector.includes('color')) return this.children[0];
    return null;
};

// Game State Implementation (simplified version of what's in content.js)
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
        console.log(`  Processing: ${action.type} - ${action.player} ${JSON.stringify(action.resource ? {[action.resource]: action.amount} : action.cost || {})}`);
        this.updatePossibleStates(action);
    },
    
    updatePossibleStates: function(action) {
        const newStates = [];
        for (const state of this.possibleStates) {
            const possibleNewStates = this.applyActionToState(state, action);
            newStates.push(...possibleNewStates);
        }
        this.possibleStates = newStates;
        console.log(`    States after action: ${this.possibleStates.length}`);
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
                    console.log(`    ✓ ${action.player} spent resources successfully`);
                } else {
                    console.log(`    ✗ ${action.player} cannot afford ${JSON.stringify(action.cost)}`);
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

// Parsing functions (adapted from content.js)
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
            
            console.log(`  Found resource gain: ${player} got`, resourceCounts);
            
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
            
            console.log(`  Road Building activated for ${playerName} (2 free roads)`);
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
                console.log(`  FREE ROAD: ${playerName} placed Road (${cardEffect.freeRoads} free roads remaining)`);
                cardEffect.freeRoads--;
                
                // Remove effect when no free roads left
                if (cardEffect.freeRoads === 0) {
                    delete gameState.activeCardEffects[playerName];
                    console.log(`  Road Building effect expired for ${playerName}`);
                }
                
                gameState.addPlayer(playerName);
                return true;
            } else {
                console.log(`  NORMAL ROAD: ${playerName} built Road - deducting cost:`, cost);
                
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
    console.log("Setting up initial game state...");
    
    // Setup initial state: Arie starts with 2 grain + 1 ore, Irmine starts with 1 of each
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
    
    console.log("Initial state:");
    console.log("  Arie#8805:", gameState.possibleStates[0]["Arie#8805"]);
    console.log("  Irmine9924:", gameState.possibleStates[0]["Irmine9924"]);
    
    // Process the mock log entries
    console.log("\nProcessing game log events...");
    
    mockLogEntries.forEach((entry, index) => {
        console.log(`\n${index + 1}. "${entry.messageSpan.textContent}"`);
        const success = parseGameAction(entry, entry.messageSpan);
        if (!success) {
            console.log(`  ✗ No parser matched this entry`);
        }
    });
    
    // Check final results
    console.log("\n--- FINAL RESULTS ---");
    const finalState = gameState.possibleStates[0];
    
    const actualArie = finalState["Arie#8805"];
    const actualIrmine = finalState["Irmine9924"];
    
    console.log("Final state:");
    console.log("  Arie#8805:", actualArie);
    console.log("  Irmine9924:", actualIrmine);
    
    // Expected results
    const expectedArie = { lumber: 0, brick: 3, wool: 2, grain: 2, ore: 1 };
    const expectedIrmine = { lumber: 1, brick: 1, wool: 2, grain: 1, ore: 1 };
    
    console.log("\n--- VERIFICATION ---");
    console.log("Expected vs Actual:");
    console.log("Arie#8805:");
    console.log("  Expected:", expectedArie);
    console.log("  Actual:  ", actualArie);
    
    console.log("Irmine9924:");
    console.log("  Expected:", expectedIrmine);
    console.log("  Actual:  ", actualIrmine);
    
    // Test each resource
    let testsPassed = true;
    
    console.log("\n--- DETAILED CHECKS ---");
    for (const [resource, count] of Object.entries(expectedArie)) {
        if (actualArie[resource] !== count) {
            console.log(`❌ FAIL: Arie#8805 ${resource} - Expected ${count}, got ${actualArie[resource]}`);
            testsPassed = false;
        } else {
            console.log(`✅ PASS: Arie#8805 ${resource} correct (${count})`);
        }
    }
    
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
    
    console.log(`\nTotal Cards:`);
    console.log(`  Arie#8805: ${arieTotal} (expected 8)`);
    console.log(`  Irmine9924: ${irmineTotal} (expected 6)`);
    
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
    
    console.log("\n" + "=".repeat(50));
    if (testsPassed) {
        console.log("🎉 ALL TESTS PASSED! The logic is working correctly! 🎉");
        console.log("✅ Road Building card effect properly handled");
        console.log("✅ Resource gains calculated correctly");
        console.log("✅ Free roads didn't deduct resources");
        console.log("✅ Final totals match expected values");
    } else {
        console.log("🔥 SOME TESTS FAILED. Check the errors above. 🔥");
    }
    console.log("=".repeat(50));
}

// Run the test
runTest();
