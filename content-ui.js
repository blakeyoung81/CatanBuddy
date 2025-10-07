// Colonist Buddy UI - Creates and manages visual tables
// Version 3.0.0 - WebSocket Edition
// This file ONLY handles UI creation and rendering
// All game state is managed by websocket-game-tracker.js

(() => {
    "use strict";
    
    console.log("[CATAN-UI] 🎨 Initializing UI components v3.0.0...");
    
    // Wait for gameState to be available from websocket-game-tracker.js
    function waitForGameState() {
        if (typeof window.gameState === 'undefined') {
            console.log("[CATAN-UI] ⏳ Waiting for game state from WebSocket tracker...");
            setTimeout(waitForGameState, 100);
            return;
        }
        
        console.log("[CATAN-UI] ✅ Game state detected! Initializing UI...");
        initializeUI();
    }
    
    // Initialize all UI components
    function initializeUI() {
        // Load saved positions
        const savedPositions = loadTablePositions();
        
        // Create tables
        createDiceTable(savedPositions.dice || { top: "10px", left: "50px" });
        createResourceTable(savedPositions.resource || { top: "10px", left: "400px" });
        
        // Set up periodic UI updates (fallback in case WebSocket doesn't trigger updates)
        setInterval(() => {
            if (window.gameState) {
                window.gameState.updateDiceTable();
                window.gameState.updateResourceDisplay();
                window.gameState.updateTurnOrderTable();
            }
        }, 1000);
        
        console.log("[CATAN-UI] ✅ UI initialization complete!");
    }
    
    // ============================================================================
    // DICE STATISTICS TABLE
    // ============================================================================
    
    function createDiceTable(position = { top: "10px", left: "50px" }) {
        // Check if table already exists
        if (document.getElementById('dice-table')) {
            console.log("[CATAN-UI] Dice table already exists");
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'dice-table-container';
        container.style.cssText = `
            position: fixed;
            top: ${position.top};
            left: ${position.left};
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #444;
            border-radius: 8px;
            padding: 8px;
            z-index: 10000;
            color: white;
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            cursor: move;
            resize: both;
            overflow: auto;
            min-width: 200px;
            min-height: 100px;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #444;
        `;
        
        const title = document.createElement('div');
        title.textContent = '🎲 Dice Statistics';
        title.style.cssText = 'font-weight: bold; font-size: 12px;';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            line-height: 18px;
        `;
        closeButton.onclick = () => container.style.display = 'none';
        
        header.appendChild(title);
        header.appendChild(closeButton);
        container.appendChild(header);
        
        const table = document.createElement('table');
        table.id = 'dice-table';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        `;
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="padding: 3px 6px; text-align: center; border-bottom: 1px solid #444;">Roll</th>
                <th style="padding: 3px 6px; text-align: center; border-bottom: 1px solid #444;">Count</th>
                <th style="padding: 3px 6px; text-align: center; border-bottom: 1px solid #444;">%</th>
                <th style="padding: 3px 6px; text-align: center; border-bottom: 1px solid #444;">Ratio</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        for (let i = 2; i <= 12; i++) {
            const row = document.createElement('tr');
            const dotColor = i === 7 ? '#ff4444' : (i === 6 || i === 8) ? '#ffaa44' : '#aaaaaa';
            
            row.innerHTML = `
                <td style="padding: 2px 4px; text-align: center;">
                    <span style="color: ${dotColor}; font-weight: bold;">${i}</span>
                </td>
                <td id="count-${i}" style="padding: 2px 4px; text-align: center;">0</td>
                <td id="percentage-${i}" style="padding: 2px 4px; text-align: center;">0%</td>
                <td id="expected-${i}" style="padding: 2px 4px; text-align: center;">0.00</td>
            `;
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        
        // Total rolls footer
        const tfoot = document.createElement('tfoot');
        tfoot.innerHTML = `
            <tr>
                <td colspan="4" style="padding: 3px 6px; text-align: center; border-top: 1px solid #444; font-weight: bold;">
                    Total Rolls: <span id="dice-total-rolls">0</span>
                </td>
            </tr>
        `;
        table.appendChild(tfoot);
        
        container.appendChild(table);
        document.body.appendChild(container);
        
        // Make draggable
        makeDraggable(container, 'diceTablePosition');
        
        console.log("[CATAN-UI] ✅ Dice table created");
    }
    
    // ============================================================================
    // RESOURCE & TURN ORDER TABLE
    // ============================================================================
    
    function createResourceTable(position = { top: "10px", left: "400px" }) {
        // Check if table already exists
        if (document.getElementById('turn-order-container')) {
            console.log("[CATAN-UI] Resource table already exists");
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'turn-order-container';
        container.style.cssText = `
            position: fixed;
            top: ${position.top};
            left: ${position.left};
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #444;
            border-radius: 8px;
            padding: 8px;
            z-index: 10000;
            color: white;
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            cursor: move;
            resize: both;
            overflow: auto;
            min-width: 200px;
            min-height: 100px;
        `;
        
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #444;
        `;
        
        const title = document.createElement('div');
        title.textContent = '👥 Turn Order';
        title.style.cssText = 'font-weight: bold; font-size: 12px;';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            line-height: 18px;
        `;
        closeButton.onclick = () => container.style.display = 'none';
        
        header.appendChild(title);
        header.appendChild(closeButton);
        container.appendChild(header);
        
        const table = document.createElement('table');
        table.id = 'turn-order-table';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
        `;
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="padding: 3px 6px; text-align: left; border-bottom: 1px solid #444;">Player</th>
                <th style="padding: 3px 6px; text-align: center; border-bottom: 1px solid #444;">Cards</th>
                <th style="padding: 3px 6px; text-align: center; border-bottom: 1px solid #444;">7s</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        tbody.id = 'turn-order-tbody';
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="padding: 3px 6px; text-align: center; font-style: italic;">
                    Waiting for players...
                </td>
            </tr>
        `;
        table.appendChild(tbody);
        
        container.appendChild(table);
        document.body.appendChild(container);
        
        // Make draggable
        makeDraggable(container, 'resourceTablePosition');
        
        console.log("[CATAN-UI] ✅ Resource table created");
    }
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    function makeDraggable(element, storageKey) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        const header = element.querySelector('div');
        if (!header) return;
        
        header.style.cursor = 'move';
        
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        
        function dragStart(e) {
            if (e.target.tagName === 'BUTTON') return;
            
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
            isDragging = true;
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
        }
        
        function dragEnd() {
            if (!isDragging) return;
            
            isDragging = false;
            
            // Save position
            const position = {
                top: element.style.top,
                left: element.style.left
            };
            
            try {
                const savedPositions = JSON.parse(localStorage.getItem('catanTablePositions') || '{}');
                savedPositions[storageKey] = position;
                localStorage.setItem('catanTablePositions', JSON.stringify(savedPositions));
            } catch (error) {
                console.error("[CATAN-UI] Failed to save position:", error);
            }
        }
    }
    
    function loadTablePositions() {
        try {
            const savedPositions = localStorage.getItem('catanTablePositions');
            if (savedPositions) {
                const positions = JSON.parse(savedPositions);
                return {
                    dice: positions.diceTablePosition || { top: "10px", left: "50px" },
                    resource: positions.resourceTablePosition || { top: "10px", left: "400px" }
                };
            }
        } catch (error) {
            console.error("[CATAN-UI] Failed to load positions:", error);
        }
        
        return {
            dice: { top: "10px", left: "50px" },
            resource: { top: "10px", left: "400px" }
        };
    }
    
    // Start the UI initialization process
    waitForGameState();
    
})();

