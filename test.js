document.addEventListener('DOMContentLoaded', () => {
    console.log("--- CATAN BUDDY TEST SUITE ---");

    // Mock initial game state before the log events are processed
    function setupInitialState() {
        console.log("Setting up initial game state for test...");

        // Arie#8805 starts with 2 wheat and 1 ore = 3 cards
        const arieInitial = {
            lumber: 0, brick: 0, wool: 0, grain: 2, ore: 1
        };

        // Irmine9924 starts with 5 cards (e.g., one of each)
        const irmineInitial = {
            lumber: 1, brick: 1, wool: 1, grain: 1, ore: 1
        };
        
        const initialState = {
            "Arie#8805": arieInitial,
            "Irmine9924": irmineInitial
        };
        
        // Overwrite the game state in content.js
        window.gameState.possibleStates = [JSON.parse(JSON.stringify(initialState))];
        window.gameState.players = {
            "Arie#8805": { resources: arieInitial, color: 'rgb(226, 113, 116)' },
            "Irmine9924": { resources: irmineInitial, color: 'rgb(34, 54, 151)' }
        };
        
        console.log("Initial state setup complete:", window.gameState.possibleStates[0]);
    }

    // Process the static game log from test.html
    function processStaticLog() {
        console.log("Processing static game log entries...");
        const logContainer = document.querySelector('.virtualScroller-lSkdkGJi');
        const entries = logContainer.querySelectorAll('.scrollItemContainer-WXX2rkzf');
        
        entries.forEach(entry => {
            const messageSpan = entry.querySelector('.messagePart-XeUsOgLX, .messageWithTooltip-NtPXPG_9');
            if (messageSpan) {
                const success = parseGameAction(entry, messageSpan);
                if (success) {
                    console.log(`Successfully parsed entry: "${messageSpan.textContent.trim()}"`);
                } else {
                    console.log(`No parser matched for entry: "${messageSpan.textContent.trim()}"`);
                }
            }
        });
        console.log("Finished processing static log.");
    }

    // Run the test and assert the final state
    function runTest() {
        console.log("\n--- RUNNING TEST ---");
        
        // 1. Setup the initial state
        setupInitialState();
        
        // 2. Process the log, which will modify the state
        processStaticLog();
        
        // 3. Get the final state and assert the results
        const finalState = window.gameState.possibleStates[0];
        console.log("\n--- TEST RESULTS ---");
        console.log("Final game state:", finalState);

        // Expected final counts
        const expectedArie = { lumber: 0, brick: 3, wool: 2, grain: 2, ore: 1 };
        const expectedIrmine = { lumber: 1, brick: 1, wool: 2, grain: 1, ore: 1 };
        
        const arieTotal = Object.values(expectedArie).reduce((a, b) => a + b, 0);
        const irmineTotal = Object.values(expectedIrmine).reduce((a, b) => a + b, 0);

        // Get actual counts from the final state
        const actualArie = finalState["Arie#8805"];
        const actualIrmine = finalState["Irmine9924"];

        // Assertions
        let testsPassed = true;
        
        // Check Arie's resources
        for (const [resource, count] of Object.entries(expectedArie)) {
            if (actualArie[resource] !== count) {
                console.error(`❌ FAIL: Arie#8805 ${resource} incorrect. Expected ${count}, but got ${actualArie[resource]}`);
                testsPassed = false;
            } else {
                console.log(`✅ PASS: Arie#8805 ${resource} is correct (${count})`);
            }
        }

        // Check Irmine's resources
        for (const [resource, count] of Object.entries(expectedIrmine)) {
            if (actualIrmine[resource] !== count) {
                console.error(`❌ FAIL: Irmine9924 ${resource} incorrect. Expected ${count}, but got ${actualIrmine[resource]}`);
                testsPassed = false;
            } else {
                console.log(`✅ PASS: Irmine9924 ${resource} is correct (${count})`);
            }
        }
        
        // Check total cards
        const actualArieTotal = window.gameState.getExactTotalCards("Arie#8805");
        const actualIrmineTotal = window.gameState.getExactTotalCards("Irmine9924");

        if (actualArieTotal === arieTotal) {
            console.log(`✅ PASS: Arie#8805 total cards is correct (${arieTotal})`);
        } else {
            console.error(`❌ FAIL: Arie#8805 total cards incorrect. Expected ${arieTotal}, but got ${actualArieTotal}`);
            testsPassed = false;
        }

        if (actualIrmineTotal === irmineTotal) {
            console.log(`✅ PASS: Irmine9924 total cards is correct (${irmineTotal})`);
        } else {
            console.error(`❌ FAIL: Irmine9924 total cards incorrect. Expected ${irmineTotal}, but got ${actualIrmineTotal}`);
            testsPassed = false;
        }
        
        console.log("\n--- SUMMARY ---");
        if (testsPassed) {
            console.log("🎉 ALL TESTS PASSED! The logic correctly handled the test case. 🎉");
        } else {
            console.error("🔥 SOME TESTS FAILED. Please review the errors above. 🔥");
        }
    }

    // Wait a moment for content.js to initialize fully, then run the test
    setTimeout(runTest, 500);
});
