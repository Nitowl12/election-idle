// Game state
let gameState = {
    votes: 0,
    money: 0,
    baseVoteTimer: 10,
    voteTimer: 10,
    timeUntilVote: 10,
    lastUpdate: Date.now(),
    parties: {
        blue: { symbol: '●', weight: 5, votes: 0 },
        red: { symbol: '✖', weight: 10, votes: 0 },
        green: { symbol: '▲', weight: 15, votes: 0 },
        yellow: { symbol: '■', weight: 20, votes: 0 }
    },
    voters: Array.from({ length: 25 }, () => ({
        blueWeight: 5, // Initial weight for Blue
        upgradeCost: 1 // Initial upgrade cost
    })),
    quickerElectionsCost: 5,
    richerVotersCost: 2,
    betterOrganizationCost: 2,
    blueVoteMoneyBonus: 1, // Base money earned by Blue voters
    blackLineMoneyBonus: 1, // Base money earned per black line
    showProbabilities: false, // NEW: Default to showing probabilities
    perfectElections: 0, // Counter for perfect elections
    gameWon: false, // Game won flag
    perfectDistrictMoneyBonus: 5, // NEW: Initial money for Perfect District
    perfectDistrictUpgradeCost: 256, // NEW: Initial cost for Perfect District upgrade
    perfectDistrictUnlocked: false, // NEW: Flag to unlock Perfect District upgrade
    assassinateRedCost: 10000, // NEW: Cost for Assassinate Red
    assassinateRedUnlocked: false, // NEW: Flag to unlock Assassinate Red
    assassinateRedPurchased: false, // NEW: Flag if Assassinate Red is purchased
    assassinateGreenCost: 15000, // NEW: Cost for Assassinate Green
    assassinateGreenUnlocked: false, // NEW: Flag to unlock Assassinate Green
    assassinateGreenPurchased: false, // NEW: Flag if Assassinate Green is purchased
    assassinateYellowKidsCost: 15000, // NEW: Cost for Assassinate Yellow's Kids
    assassinateYellowKidsUnlocked: false, // NEW: Flag to unlock Assassinate Yellow's Kids
    assassinateYellowKidsPurchased: false, // NEW: Flag if Assassinate Yellow's Kids is purchased
    assassinateYellowWifeCost: 20000, // NEW: Cost for Assassinate Yellow's Wife
    assassinateYellowWifeUnlocked: false, // NEW: Flag to unlock Assassinate Yellow's Wife
    assassinateYellowWifePurchased: false // NEW: Flag if Assassinate Yellow's Wife is purchased
};

let selectedVoterIndex = null; // To store the index of the currently selected voter

// Create voter elements
const voterGrid = document.getElementById('voterGrid');
const voterInfoPanel = document.getElementById('voterInfoPanel');
const voterPreferencesList = document.getElementById('voterPreferences');

for (let i = 0; i < 25; i++) {
    const voterContainer = document.createElement('div');
    voterContainer.style.display = 'flex';
    voterContainer.style.flexDirection = 'column';
    voterContainer.style.alignItems = 'center';
    voterContainer.classList.add('voter-container'); // Add this class for CSS positioning

    const voter = document.createElement('button');
    voter.className = 'voter';
    voter.id = `voter-${i}`;
    voter.textContent = '?';

    // --- NEW: Create and append probability span ---
    const probabilitySpan = document.createElement('span');
    probabilitySpan.classList.add('voter-probability');
    probabilitySpan.id = `voter-prob-${i}`; // Add ID for easy access
    voterContainer.appendChild(probabilitySpan); // Append the span to the container

    // Add click event to display voter preferences or upgrade
    voter.addEventListener('click', () => {
        if (selectedVoterIndex === i) {
            // If the same voter is clicked again, attempt to upgrade
            const upgradeButton = document.getElementById('upgradeBlueButton');
            upgradeVoterBlueWeight(i, upgradeButton); // Call the upgrade function
        } else {
            // Otherwise, select this voter and display preferences
            displayVoterPreferences(i);
        }
    });

    voterContainer.appendChild(voter);
    voterGrid.appendChild(voterContainer);
}

// Function to calculate and update the blue probability for a specific voter's display
function updateVoterProbabilityDisplay(voterIndex) {
    const voterData = gameState.voters[voterIndex];
    const partyKeys = Object.keys(gameState.parties);

    // Calculate total weight for the specific voter
    const totalWeight = partyKeys.reduce((sum, key) => {
        return sum + (key === 'blue' ? voterData.blueWeight : gameState.parties[key].weight);
    }, 0);

    const blueWeight = voterData.blueWeight;
    // Calculate probability and round to nearest whole number, then convert to string
    const blueProbability = totalWeight > 0 ? ((blueWeight / totalWeight) * 100).toFixed(0) : 0;

    const probabilitySpan = document.getElementById(`voter-prob-${voterIndex}`);
    if (probabilitySpan) {
        probabilitySpan.textContent = `${blueProbability}%`;
        // --- NEW: Toggle visibility based on gameState.showProbabilities ---
        probabilitySpan.style.display = gameState.showProbabilities ? 'block' : 'none';
    }
}

// Function to update all voter probabilities (useful after elections or global changes)
function updateAllVoterProbabilitiesDisplay() {
    for (let i = 0; i < gameState.voters.length; i++) {
        updateVoterProbabilityDisplay(i);
    }
}


// Function to display voter preferences
function displayVoterPreferences(voterIndex) {
    selectedVoterIndex = voterIndex; // Store the selected voter index

    const partyKeys = Object.keys(gameState.parties);
    const voter = gameState.voters[voterIndex]; // Get the selected voter
    const totalWeight = partyKeys.reduce((sum, key) => {
        return sum + (key === 'blue' ? voter.blueWeight : gameState.parties[key].weight);
    }, 0);

    // Calculate probabilities and prepare table rows
    const preferences = partyKeys.map(key => {
        const party = gameState.parties[key];
        const weight = key === 'blue' ? voter.blueWeight : party.weight; // Use voter's Blue weight
        const probability = ((weight / totalWeight) * 100).toFixed(1);
        return `<tr>
                    <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                    <td>${party.symbol}</td>
                    <td>${weight}</td>
                    <td>${probability}%</td>
                </tr>`;
    });

    // Update the voter preferences table
    document.getElementById('voterPreferences').innerHTML = preferences.join('');

    // Show and update the "Upgrade Blue" button for the selected voter
    const upgradeButton = document.getElementById('upgradeBlueButton');
    upgradeButton.textContent = `Upgrade Blue (+1 Weight) - $${voter.upgradeCost}`;
    upgradeButton.style.display = 'block'; // Make the button visible
    upgradeButton.onclick = () => upgradeVoterBlueWeight(voterIndex, upgradeButton);
}

// Function to upgrade a voter's Blue weight
function upgradeVoterBlueWeight(voterIndex, button) {
    const voter = gameState.voters[voterIndex];

    // Check if the player has enough money
    if (gameState.money >= voter.upgradeCost) {
        // Deduct the cost
        gameState.money -= voter.upgradeCost;

        // Increase the voter's Blue weight
        voter.blueWeight += 1;

        // Increase the upgrade cost (1.1x rounded up)
        voter.upgradeCost = Math.ceil(voter.upgradeCost * 1.1);

        // Update the button text (even if null, it won't throw error)
        if (button) { // Ensure button exists before trying to update its text
            button.textContent = `Upgrade Blue (+1 Weight) - $${voter.upgradeCost}`;
        }

        // Update the display (money, etc.)
        updateDisplay();

        // Draw connections between Blue voters
        drawBlueConnections();

        // Update the probability display for this specific voter
        updateVoterProbabilityDisplay(voterIndex);

        // Recalculate and update voter preferences (important for money to show immediately)
        // Only update if this voter is still the selected one, to avoid changing panel
        if (selectedVoterIndex === voterIndex) {
            displayVoterPreferences(voterIndex);
        }

    } else {
        alert("Not enough funds to upgrade!");
    }
}

// Load game state from localStorage
function loadGame() {
    const saved = localStorage.getItem('politicalGameV2');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
            // Merge loaded state with default to ensure new properties exist
            gameState = { ...gameState, ...parsed };
            // Ensure parties weights are restored correctly if they were 0
            if (parsed.parties) {
                if (parsed.parties.red && parsed.parties.red.weight !== undefined) {
                    gameState.parties.red.weight = parsed.parties.red.weight;
                }
                if (parsed.parties.green && parsed.parties.green.weight !== undefined) {
                    gameState.parties.green.weight = parsed.parties.green.weight;
                }
                if (parsed.parties.yellow && parsed.parties.yellow.weight !== undefined) {
                    gameState.parties.yellow.weight = parsed.parties.yellow.weight; // Ensure yellow weight loads
                }
            }
            gameState.lastUpdate = Date.now();
            updateVoteTimer();
        }
    }
}

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('politicalGameV2', JSON.stringify(gameState));
}

// Calculate vote timer based on upgrades
function calculateVoteTimer() {
    let timer = gameState.baseVoteTimer; // Use baseVoteTimer from gameState
    return Math.max(timer, 0.5); // Minimum 0.5 seconds between votes
}

// Update the display
function updateDisplay() {
    document.getElementById('votes').textContent = gameState.votes.toLocaleString();
    document.getElementById('money').textContent = gameState.money.toLocaleString();
    document.getElementById('timer').textContent = gameState.voteTimer.toFixed(1);
    document.getElementById('perfectElections').textContent = gameState.perfectElections; // Update perfect elections display


    // Update party votes
    const partyVotes = Object.entries(gameState.parties)
        .map(([key, party]) => `${party.symbol}: ${party.votes}`)
        .join(' | ');
    document.getElementById('partyVotes').textContent = partyVotes;

    // Update upgrade effects
    document.getElementById('quickerElectionsEffect').textContent = `${gameState.baseVoteTimer.toFixed(1)}s`;
    document.getElementById('richerVotersEffect').textContent = `${gameState.blueVoteMoneyBonus}`;
    document.getElementById('betterOrganizationEffect').textContent = `${gameState.blackLineMoneyBonus}`;
    document.getElementById('perfectDistrictEffect').textContent = `$${gameState.perfectDistrictMoneyBonus}`; // Update perfect district effect
    document.getElementById('assassinateRedEffect').textContent = `${gameState.parties.red.weight}`; // Red weight display
    document.getElementById('assassinateGreenEffect').textContent = `${gameState.parties.green.weight}`; // Green weight display
    document.getElementById('assassinateYellowKidsEffect').textContent = `${gameState.parties.yellow.weight}`; // NEW: Yellow weight display
    document.getElementById('assassinateYellowWifeEffect').textContent = `${gameState.parties.yellow.weight}`; // NEW: Yellow weight display


    // Update the UI for upgrade costs
    document.getElementById('quickerElectionsCost').textContent = gameState.quickerElectionsCost;
    document.getElementById('richerVotersCost').textContent = gameState.richerVotersCost;
    document.getElementById('betterOrganizationCost').textContent = gameState.betterOrganizationCost;
    document.getElementById('perfectDistrictCost').textContent = gameState.perfectDistrictUpgradeCost; // Update perfect district cost
    document.getElementById('assassinateRedCost').textContent = gameState.assassinateRedCost; // Red upgrade cost
    document.getElementById('assassinateGreenCost').textContent = gameState.assassinateGreenCost; // Green upgrade cost
    document.getElementById('assassinateYellowKidsCost').textContent = gameState.assassinateYellowKidsCost; // NEW: Yellow Kids upgrade cost
    document.getElementById('assassinateYellowWifeCost').textContent = gameState.assassinateYellowWifeCost; // NEW: Yellow Wife upgrade cost


    // Show/hide Perfect District upgrade based on perfectDistrictUnlocked
    const perfectDistrictUpgradeDiv = document.getElementById('perfectDistrict');
    if (perfectDistrictUpgradeDiv) {
        perfectDistrictUpgradeDiv.style.display = gameState.perfectDistrictUnlocked ? 'flex' : 'none';
    }

    // Show/hide Assassinate Red upgrade
    const assassinateRedDiv = document.getElementById('assassinateRed');
    if (assassinateRedDiv) {
        assassinateRedDiv.style.display = (gameState.assassinateRedUnlocked && !gameState.assassinateRedPurchased) ? 'flex' : 'none';
    }

    // Show/hide Assassinate Green upgrade
    const assassinateGreenDiv = document.getElementById('assassinateGreen');
    if (assassinateGreenDiv) {
        assassinateGreenDiv.style.display = (gameState.assassinateGreenUnlocked && !gameState.assassinateGreenPurchased) ? 'flex' : 'none';
    }

    // NEW: Show/hide Assassinate Yellow's Kids upgrade
    const assassinateYellowKidsDiv = document.getElementById('assassinateYellowKids');
    if (assassinateYellowKidsDiv) {
        assassinateYellowKidsDiv.style.display = (gameState.assassinateYellowKidsUnlocked && !gameState.assassinateYellowKidsPurchased) ? 'flex' : 'none';
    }

    // NEW: Show/hide Assassinate Yellow's Wife upgrade
    const assassinateYellowWifeDiv = document.getElementById('assassinateYellowWife');
    if (assassinateYellowWifeDiv) {
        assassinateYellowWifeDiv.style.display = (gameState.assassinateYellowWifeUnlocked && !gameState.assassinateYellowWifePurchased) ? 'flex' : 'none';
    }
}

// Update vote timer when upgrades change it
function updateVoteTimer() {
    gameState.voteTimer = calculateVoteTimer();
}

let isElectionInProgress = false; // Flag to track if an election is in progress

function conductElection() {
    isElectionInProgress = true; // Pause the timer

    const voters = document.querySelectorAll('.voter');
    const partyKeys = Object.keys(gameState.parties);

    // Reset party votes for the new election
    for (const key in gameState.parties) {
        gameState.parties[key].votes = 0;
    }

    let blueVotesThisElection = 0; // Track blue votes in this election

    // Function to process each voter with a delay
    function processVoter(index) {
        if (index >= voters.length) {
            // After all voters have been processed
            drawBlueConnections(); // Draw connections
            updateDisplay();      // Update main display elements
            saveGame();           // Save game state

            // Update all voter probabilities after the election
            updateAllVoterProbabilitiesDisplay();

            // Check for perfect election
            if (blueVotesThisElection === 25) {
                gameState.perfectElections++;
                if (gameState.perfectElections >= 10) {
                    gameState.gameWon = true;
                    alert("Congratulations! You've achieved 10 perfect elections and won the game!");
                    gameState.parties.red.weight = 0;
                    gameState.parties.green.weight = 0;
                    gameState.parties.yellow.weight = 0;
                    // Optionally, you can stop the game loop or disable interactions here
                    return; // Stop further execution if game is won
                }
            }

            // Check for Bingos and earn Perfect District money
            const bingos = checkForBingos();
            if (bingos > 0) {
                gameState.money += bingos * gameState.perfectDistrictMoneyBonus;
                // Unlock Perfect District if it's the first bingo
                if (!gameState.perfectDistrictUnlocked) {
                    gameState.perfectDistrictUnlocked = true;
                }
                // Unlock Assassination upgrades on first bingo
                if (!gameState.assassinateRedUnlocked) {
                    gameState.assassinateRedUnlocked = true;
                }
                if (!gameState.assassinateGreenUnlocked) {
                    gameState.assassinateGreenUnlocked = true;
                }
                updateDisplay(); // Update display to show new money and potentially unlocked upgrades
            }


            // Reset timer and resume game loop
            gameState.timeUntilVote = gameState.voteTimer;
            gameState.lastUpdate = Date.now();
            isElectionInProgress = false; // Resume the timer
            return;
        }

        const voter = voters[index];
        voter.textContent = '?';
        voter.className = 'voter';

        // Add tilt animation
        voter.style.transition = `transform 0.025s`; // Smooth animation
        voter.style.transform = 'rotate(10deg)';

        setTimeout(() => {
            voter.style.transform = 'rotate(0deg)';

            // Determine which party the voter votes for
            const voterData = gameState.voters[index];
            const totalWeight = partyKeys.reduce((sum, key) => {
                return sum + (key === 'blue' ? voterData.blueWeight : gameState.parties[key].weight);
            }, 0);

            const randomValue = Math.random() * totalWeight;
            let cumulativeWeight = 0;
            let selectedParty = null;

            for (const key of partyKeys) {
                const weight = key === 'blue' ? voterData.blueWeight : gameState.parties[key].weight;
                cumulativeWeight += weight;
                if (randomValue <= cumulativeWeight) {
                    selectedParty = key;
                    break;
                }
            }

            // Update voter appearance and game state
            if (selectedParty) {
                const party = gameState.parties[selectedParty];
                voter.className = `voter ${selectedParty}`;
                voter.textContent = party.symbol;

                party.votes++;
                if (selectedParty === 'blue') {
                    gameState.votes++;
                    gameState.money += gameState.blueVoteMoneyBonus; // Add bonus for Blue votes
                    blueVotesThisElection++; // Increment blue votes for this election
                }
            }

            // Process the next voter after a delay
            setTimeout(() => processVoter(index + 1), 50); // 50ms delay between voters
        }, 25); // 25ms for tilt animation
    }

    // Start processing voters
    processVoter(0);
}

// Function to check for Bingos (5 blue voters in a row)
function checkForBingos() {
    const voters = document.querySelectorAll('.voter');
    const gridSize = 5;
    let bingosFound = 0;

    // Helper to get voter at (row, col)
    const getVoter = (r, c) => {
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
            return voters[r * gridSize + c];
        }
        return null;
    };

    // Helper to check for 5 consecutive blue voters
    const checkLine = (line) => {
        let blueCount = 0;
        for (let i = 0; i < line.length; i++) {
            if (line[i] && line[i].classList.contains('blue')) {
                blueCount++;
                if (blueCount === 5) {
                    return true; // Bingo found
                }
            } else {
                blueCount = 0; // Reset count if non-blue voter encountered
            }
        }
        return false;
    };

    // Check Rows
    for (let r = 0; r < gridSize; r++) {
        const row = [];
        for (let c = 0; c < gridSize; c++) {
            row.push(getVoter(r, c));
        }
        if (checkLine(row)) {
            bingosFound++;
        }
    }

    // Check Columns
    for (let c = 0; c < gridSize; c++) {
        const col = [];
        for (let r = 0; r < gridSize; r++) {
            col.push(getVoter(r, c));
        }
        if (checkLine(col)) {
            bingosFound++;
        }
    }

    // Check Diagonals (main two)
    const diag1 = []; // Top-left to bottom-right
    const diag2 = []; // Top-right to bottom-left
    for (let i = 0; i < gridSize; i++) {
        diag1.push(getVoter(i, i));
        diag2.push(getVoter(i, gridSize - 1 - i));
    }
    if (checkLine(diag1)) {
        bingosFound++;
    }
    if (checkLine(diag2)) {
        bingosFound++;
    }

    // Add checks for other diagonals (not just the main two)
    // From top row, moving right
    for (let startCol = 1; startCol < gridSize - 4; startCol++) { // Start from column 1, need at least 5 for a diagonal
        const diagonal = [];
        for (let r = 0, c = startCol; r < gridSize && c < gridSize; r++, c++) {
            diagonal.push(getVoter(r, c));
        }
        if (checkLine(diagonal)) {
            bingosFound++;
        }
    }
    // From left column, moving down
    for (let startRow = 1; startRow < gridSize - 4; startRow++) { // Start from row 1, need at least 5 for a diagonal
        const diagonal = [];
        for (let r = startRow, c = 0; r < gridSize && c < gridSize; r++, c++) {
            diagonal.push(getVoter(r, c));
        }
        if (checkLine(diagonal)) {
            bingosFound++;
        }
    }

    // From top row, moving left (anti-diagonals)
    for (let startCol = gridSize - 2; startCol >= 4; startCol--) { // Start from column 3 (index 3), need at least 5
        const diagonal = [];
        for (let r = 0, c = startCol; r < gridSize && c >= 0; r++, c--) {
            diagonal.push(getVoter(r, c));
        }
        if (checkLine(diagonal)) {
            bingosFound++;
        }
    }
    // From right column, moving down (anti-diagonals)
    for (let startRow = 1; startRow < gridSize - 4; startRow++) { // Start from row 1, need at least 5
        const diagonal = [];
        for (let r = startRow, c = gridSize - 1; r < gridSize && c >= 0; r++, c--) {
            diagonal.push(getVoter(r, c));
        }
        if (checkLine(diagonal)) {
            bingosFound++;
        }
    }

    return bingosFound;
}

// Game loop
function gameLoop() {
    if (gameState.gameWon) { // Stop game loop if game is won
        return;
    }

    const now = Date.now();
    const delta = (now - gameState.lastUpdate) / 1000; // Convert to seconds

    if (!isElectionInProgress && delta > 0) {
        gameState.timeUntilVote -= delta;

        document.getElementById('nextElection').textContent = gameState.timeUntilVote.toFixed(1);

        // Conduct election when timer reaches 0
        if (gameState.timeUntilVote <= 0) {
            conductElection();
        }

        gameState.lastUpdate = now;
    }

    requestAnimationFrame(gameLoop);
}

// Tab navigation - Currently not used in this iteration of the UI, but kept for future use
function openTab(tabName) {
    // Hide all tabs
    const tabs = document.getElementsByClassName('tab');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Update tab buttons
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    event.currentTarget.classList.add('active');
}

// Function to toggle probability display
function toggleProbabilityDisplay() {
    gameState.showProbabilities = !gameState.showProbabilities; // Toggle the state
    updateAllVoterProbabilitiesDisplay(); // Update all voter displays
    saveGame(); // Save the new state
}

// Reset the game
function resetGame() {
    if (confirm("Are you sure you want to reset everything? This action cannot be undone.")) {
        // Reset game state to initial values
        gameState = {
            votes: 0,
            money: 0,
            baseVoteTimer: 10,
            voteTimer: 10,
            timeUntilVote: 10,
            lastUpdate: Date.now(),
            parties: {
                blue: { symbol: '●', weight: 5, votes: 0 },
                red: { symbol: '✖', weight: 10, votes: 0 },
                green: { symbol: '▲', weight: 15, votes: 0 },
                yellow: { symbol: '■', weight: 20, votes: 0 }
            },
            voters: Array.from({ length: 25 }, () => ({
                blueWeight: 5, // Initial weight for Blue
                upgradeCost: 1 // Initial upgrade cost
            })),
            quickerElectionsCost: 5,
            richerVotersCost: 2,
            betterOrganizationCost: 2,
            blueVoteMoneyBonus: 1,
            blackLineMoneyBonus: 1,
            showProbabilities: false, // Reset to default false on game reset
            perfectElections: 0, // Reset perfect elections
            gameWon: false, // Reset game won status
            perfectDistrictMoneyBonus: 5, // Reset Perfect District money bonus
            perfectDistrictUpgradeCost: 256, // Reset Perfect District upgrade cost
            perfectDistrictUnlocked: false, // Reset Perfect District unlocked status
            assassinateRedCost: 10000,
            assassinateRedUnlocked: false,
            assassinateRedPurchased: false,
            assassinateGreenCost: 15000,
            assassinateGreenUnlocked: false,
            assassinateGreenPurchased: false,
            assassinateYellowKidsCost: 15000, // NEW: Reset Cost for Assassinate Yellow's Kids
            assassinateYellowKidsUnlocked: false, // NEW: Reset Flag to unlock Assassinate Yellow's Kids
            assassinateYellowKidsPurchased: false, // NEW: Reset Flag if Assassinate Yellow's Kids is purchased
            assassinateYellowWifeCost: 20000, // NEW: Reset Cost for Assassinate Yellow's Wife
            assassinateYellowWifeUnlocked: false, // NEW: Reset Flag to unlock Assassinate Yellow's Wife
            assassinateYellowWifePurchased: false // NEW: Reset Flag if Assassinate Yellow's Wife is purchased
        };

        selectedVoterIndex = null; // Reset selected voter index

        // Clear localStorage
        localStorage.removeItem('politicalGameV2');

        // Update the display
        updateDisplay();
        // Update all voter probabilities after reset
        updateAllVoterProbabilitiesDisplay();

        alert("Game has been reset!");
    }
}

// Resize canvas to fit voter grid
function resizeCanvas() {
    const canvas = document.getElementById('connectionCanvas');
    const voterGrid = document.getElementById('voterGrid');
    canvas.width = voterGrid.offsetWidth;
    canvas.height = voterGrid.offsetHeight;
    canvas.style.left = `${voterGrid.offsetLeft}px`;
    canvas.style.top = `${voterGrid.offsetTop}px`;
}

// Draw blue connections on the canvas
function drawBlueConnections() {
    const canvas = document.getElementById('connectionCanvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 5;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let moneyEarned = 0; // Track money earned for drawing lines

    // Iterate through the grid
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const voterIndex = row * gridSize + col;
            const voter = document.getElementById(`voter-${voterIndex}`);

            if (voter && voter.classList.contains('blue')) {
                const voterRect = voter.getBoundingClientRect();
                const voterCenter = {
                    x: voterRect.left + voterRect.width / 2 - canvas.getBoundingClientRect().left,
                    y: voterRect.top + voterRect.height / 2 - canvas.getBoundingClientRect().top
                };

                // Check adjacent voters
                const neighbors = [
                    { r: row - 1, c: col }, // Top
                    { r: row + 1, c: col }, // Bottom
                    { r: row, c: col - 1 }, // Left
                    { r: row, c: col + 1 }  // Right
                ];

                neighbors.forEach(({ r, c }) => {
                    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
                        const neighborIndex = r * gridSize + c;
                        const neighbor = document.getElementById(`voter-${neighborIndex}`);
                        if (neighbor && neighbor.classList.contains('blue')) {
                            const neighborRect = neighbor.getBoundingClientRect();
                            const neighborCenter = {
                                x: neighborRect.left + neighborRect.width / 2 - canvas.getBoundingClientRect().left,
                                y: neighborRect.top + neighborRect.height / 2 - canvas.getBoundingClientRect().top
                            };

                            // Draw a line between the voter and the neighbor
                            ctx.beginPath();
                            ctx.moveTo(voterCenter.x, voterCenter.y);
                            ctx.lineTo(neighborCenter.x, neighborCenter.y);
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 2;
                            ctx.stroke();

                            // Increment money for each line drawn
                            moneyEarned += gameState.blackLineMoneyBonus; // Add bonus for black lines
                        }
                    }
                });
            }
        }
    }

    // Add the earned money to the player's total money
    gameState.money += moneyEarned / 2; // Divide by 2 because each line is drawn twice (from both ends)

    // Update the display to reflect the new money total
    updateDisplay();
}

// Initialize the game
function init() {
    loadGame();
    updateDisplay();
    // Initial update of all voter probabilities on load
    updateAllVoterProbabilitiesDisplay();
    gameLoop();
}

// Start the game when page loads
window.onload = () => {
    init();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // Attach event listener to the toggle button
    document.getElementById('toggleProbabilitiesButton').addEventListener('click', toggleProbabilityDisplay);
};

function upgradeQuickerElections() {
    if (gameState.money >= gameState.quickerElectionsCost) {
        // Deduct the cost
        gameState.money -= gameState.quickerElectionsCost;

        // Decrease the election timer
        gameState.baseVoteTimer = Math.max(0.5, gameState.baseVoteTimer - 0.5); // Minimum timer is 0.5s
        updateVoteTimer();

        // Increase the cost (x2)
        gameState.quickerElectionsCost *= 2;

        // Update the UI
        document.getElementById('quickerElectionsCost').textContent = gameState.quickerElectionsCost;
        document.getElementById('quickerElectionsEffect').textContent = `${gameState.baseVoteTimer.toFixed(1)}s`;
        updateDisplay();
    } else {
        alert("Not enough funds to upgrade!");
    }
}

function upgradeRicherVoters() {
    if (gameState.money >= gameState.richerVotersCost) {
        // Deduct the cost
        gameState.money -= gameState.richerVotersCost;

        // Increase money earned by Blue voters
        gameState.blueVoteMoneyBonus += 1;

        // Increase the cost (x2)
        gameState.richerVotersCost = Math.ceil(gameState.richerVotersCost * 1.5);

        // Update the UI
        document.getElementById('richerVotersCost').textContent = gameState.richerVotersCost;
        document.getElementById('richerVotersEffect').textContent = `$${gameState.blueVoteMoneyBonus}`;
        updateDisplay();
    } else {
        alert("Not enough funds to upgrade!");
    }
}

function upgradeBetterOrganization() {
    if (gameState.money >= gameState.betterOrganizationCost) {
        // Deduct the cost
        gameState.money -= gameState.betterOrganizationCost;

        // Increase money earned per black line
        gameState.blackLineMoneyBonus += 1;

        // Increase the cost (x2)
        gameState.betterOrganizationCost = Math.ceil(gameState.betterOrganizationCost * 1.5);

        // Update the UI
        document.getElementById('betterOrganizationCost').textContent = gameState.betterOrganizationCost;
        document.getElementById('betterOrganizationEffect').textContent = `$${gameState.blackLineMoneyBonus}`;
        updateDisplay();
    } else {
        alert("Not enough funds to upgrade!");
    }
}

// Function for Perfect District upgrade
function upgradePerfectDistrict() {
    // Only allow purchase if unlocked AND enough money
    if (gameState.perfectDistrictUnlocked && gameState.money >= gameState.perfectDistrictUpgradeCost) {
        gameState.money -= gameState.perfectDistrictUpgradeCost;
        gameState.perfectDistrictMoneyBonus += 5; // Increase money earned by $5
        gameState.perfectDistrictUpgradeCost = Math.ceil(gameState.perfectDistrictUpgradeCost * 1.5);
        updateDisplay();
        saveGame();
    } else if (!gameState.perfectDistrictUnlocked) {
        alert("Perfect District upgrade is not yet unlocked! Complete a Bingo first.");
    } else {
        alert("Not enough funds to upgrade!");
    }
}

// Function to Assassinate Red
function assassinateRed() {
    if (gameState.assassinateRedUnlocked && !gameState.assassinateRedPurchased && gameState.money >= gameState.assassinateRedCost) {
        gameState.money -= gameState.assassinateRedCost;
        gameState.parties.red.weight = 0; // Set Red's vote weight to 0
        gameState.assassinateRedPurchased = true; // Mark as purchased

        // NEW: Check if both assassinate upgrades are purchased to unlock yellow assassinations
        if (gameState.assassinateRedPurchased && gameState.assassinateGreenPurchased) {
            gameState.assassinateYellowKidsUnlocked = true;
            gameState.assassinateYellowWifeUnlocked = true;
        }

        updateDisplay();
        updateAllVoterProbabilitiesDisplay(); // Update voter probabilities due to weight change
        saveGame();
        alert("Red party's influence has been eliminated!");
    } else if (!gameState.assassinateRedUnlocked) {
        alert("Assassinate Red is not yet unlocked! Complete a Bingo first.");
    } else if (gameState.assassinateRedPurchased) {
        alert("You have already eliminated the Red party.");
    } else {
        alert("Not enough funds to purchase this upgrade!");
    }
}

// Function to Assassinate Green
function assassinateGreen() {
    if (gameState.assassinateGreenUnlocked && !gameState.assassinateGreenPurchased && gameState.money >= gameState.assassinateGreenCost) {
        gameState.money -= gameState.assassinateGreenCost;
        gameState.parties.green.weight = 0; // Set Green's vote weight to 0
        gameState.assassinateGreenPurchased = true; // Mark as purchased

        // NEW: Check if both assassinate upgrades are purchased to unlock yellow assassinations
        if (gameState.assassinateRedPurchased && gameState.assassinateGreenPurchased) {
            gameState.assassinateYellowKidsUnlocked = true;
            gameState.assassinateYellowWifeUnlocked = true;
        }

        updateDisplay();
        updateAllVoterProbabilitiesDisplay(); // Update voter probabilities due to weight change
        saveGame();
        alert("Green party's influence has been eliminated!");
    } else if (!gameState.assassinateGreenUnlocked) {
        alert("Assassinate Green is not yet unlocked! Complete a Bingo first.");
    } else if (gameState.assassinateGreenPurchased) {
        alert("You have already eliminated the Green party.");
    } else {
        alert("Not enough funds to purchase this upgrade!");
    }
}

// NEW: Function to Assassinate Yellow's kids
function assassinateYellowKids() {
    if (gameState.assassinateYellowKidsUnlocked && !gameState.assassinateYellowKidsPurchased && gameState.money >= gameState.assassinateYellowKidsCost) {
        gameState.money -= gameState.assassinateYellowKidsCost;
        gameState.parties.yellow.weight = Math.ceil(gameState.parties.yellow.weight / 2); // Half Yellow's vote weight
        gameState.assassinateYellowKidsPurchased = true; // Mark as purchased
        updateDisplay();
        updateAllVoterProbabilitiesDisplay(); // Update voter probabilities due to weight change
        saveGame();
        alert("Yellow's kids... have been, uh, relocated. Yellow party's influence is halved!");
    } else if (!gameState.assassinateYellowKidsUnlocked) {
        alert("Assassinate Yellow's kids is not yet unlocked! Purchase both Assassinate Red and Assassinate Green first.");
    } else if (gameState.assassinateYellowKidsPurchased) {
        alert("You have already dealt with Yellow's kids.");
    } else {
        alert("Not enough funds to purchase this upgrade!");
    }
}

// NEW: Function to Assassinate Yellow's wife
function assassinateYellowWife() {
    if (gameState.assassinateYellowWifeUnlocked && !gameState.assassinateYellowWifePurchased && gameState.money >= gameState.assassinateYellowWifeCost) {
        gameState.money -= gameState.assassinateYellowWifeCost;
        gameState.parties.yellow.weight = Math.ceil(gameState.parties.yellow.weight / 2); // Half Yellow's vote weight
        gameState.assassinateYellowWifePurchased = true; // Mark as purchased
        updateDisplay();
        updateAllVoterProbabilitiesDisplay(); // Update voter probabilities due to weight change
        saveGame();
        alert("Yellow's wife... has gone on a permanent vacation. Yellow party's influence is halved again!");
    } else if (!gameState.assassinateYellowWifeUnlocked) {
        alert("Assassinate Yellow's wife is not yet unlocked! Purchase both Assassinate Red and Assassinate Green first.");
    } else if (gameState.assassinateYellowWifePurchased) {
        alert("You have already dealt with Yellow's wife.");
    } else {
        alert("Not enough funds to purchase this upgrade!");
    }
}