// Game state
let gameState = {
    votes: 0,
    money: 0,
    winChance: 5,
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
    blackLineMoneyBonus: 1 // Base money earned per black line
};


// Create voter elements
const voterGrid = document.getElementById('voterGrid');
const voterInfoPanel = document.getElementById('voterInfoPanel');
const voterPreferencesList = document.getElementById('voterPreferences');

for (let i = 0; i < 25; i++) {
    const voterContainer = document.createElement('div');
    voterContainer.style.display = 'flex';
    voterContainer.style.flexDirection = 'column';
    voterContainer.style.alignItems = 'center';

    const voter = document.createElement('button');
    voter.className = 'voter';
    voter.id = `voter-${i}`;
    voter.textContent = '?';

    // Add click event to display voter preferences
    voter.addEventListener('click', () => displayVoterPreferences(i));

    voterContainer.appendChild(voter);
    voterGrid.appendChild(voterContainer);
}

// Function to display voter preferences
function displayVoterPreferences(voterIndex) {
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

        // Increase the upgrade cost (1.2x rounded up)
        voter.upgradeCost = Math.ceil(voter.upgradeCost * 1.2);

        // Update the button text
        button.textContent = `Upgrade Blue (+1 Weight) - $${voter.upgradeCost}`;

        // Update the display
        updateDisplay();

        // Draw connections between Blue voters
        drawBlueConnections();

        // Recalculate and update voter preferences
        displayVoterPreferences(voterIndex);
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
            gameState = parsed;
            gameState.lastUpdate = Date.now();
            updateVoteTimer();
        }
    }
}

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('politicalGameV2', JSON.stringify(gameState));
}

// Calculate win chance based on upgrades
function calculateWinChance() {
    let chance = 5;
    return Math.min(chance, 95); // Cap at 95% to keep some challenge
}

// Calculate vote timer based on upgrades
function calculateVoteTimer() {
    let timer = gameState.baseVoteTimer; // Use baseVoteTimer from gameState
    return Math.max(timer, 0.5); // Minimum 0.5 seconds between votes
}

// Update the display
// Update the display
function updateDisplay() {
    document.getElementById('votes').textContent = gameState.votes.toLocaleString();
    document.getElementById('money').textContent = gameState.money.toLocaleString();
    document.getElementById('winChance').textContent = gameState.winChance;
    document.getElementById('timer').textContent = gameState.voteTimer.toFixed(1);

    // Update party votes
    const partyVotes = Object.entries(gameState.parties)
        .map(([key, party]) => `${party.symbol}: ${party.votes}`)
        .join(' | ');
    document.getElementById('partyVotes').textContent = partyVotes;

    // Update upgrade effects
    document.getElementById('quickerElectionsEffect').textContent = `${gameState.baseVoteTimer.toFixed(1)}s`;
    document.getElementById('richerVotersEffect').textContent = `${gameState.blueVoteMoneyBonus}`;
    document.getElementById('betterOrganizationEffect').textContent = `${gameState.blackLineMoneyBonus}`;

    // ADD THESE LINES TO UPDATE THE UPGRADE COSTS ON THE UI
    document.getElementById('quickerElectionsCost').textContent = gameState.quickerElectionsCost;
    document.getElementById('richerVotersCost').textContent = gameState.richerVotersCost;
    document.getElementById('betterOrganizationCost').textContent = gameState.betterOrganizationCost;
}

// Update vote timer when upgrades change it
function updateVoteTimer() {
    gameState.voteTimer = calculateVoteTimer();
    gameState.winChance = calculateWinChance();
}

let isElectionInProgress = false; // Flag to track if an election is in progress

function conductElection() {
    isElectionInProgress = true; // Pause the timer

    const voters = document.querySelectorAll('.voter');
    const partyKeys = Object.keys(gameState.parties);

    // Function to process each voter with a delay
    function processVoter(index) {
        if (index >= voters.length) {
            // Draw connections between Blue voters
            drawBlueConnections();

            // Update the display after all voters have been processed
            updateDisplay();
            saveGame();

            // Reset the timer to the current voteTimer value
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
                }
            }

            // Process the next voter after a delay
            setTimeout(() => processVoter(index + 1), 50); // 50ms delay between voters
        }, 25); // 25ms for tilt animation
    }

    // Start processing voters
    processVoter(0);
}

// Game loop
function gameLoop() {
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

// Tab navigation
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

// Reset the game
function resetGame() {
    //if (confirm("Are you sure you want to reset everything? This action cannot be undone.")) {
    // Reset game state to initial values
    gameState = {
        votes: 0,
        money: 0,
        winChance: 5,
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
        blackLineMoneyBonus: 1
    };

    // Clear localStorage
    localStorage.removeItem('politicalGameV2');

    // Update the display
    updateDisplay();

    alert("Game has been reset!");
    //}
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
    const gridSize = 5; // Assuming a 5x5 grid

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
    gameState.money += moneyEarned / 2;

    // Update the display to reflect the new money total
    updateDisplay();
}

// Initialize the game
function init() {
    loadGame();
    updateDisplay();
    gameLoop();
}

// Start the game when page loads
window.onload = () => {
    init();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
};

function upgradeQuickerElections() {
    if (gameState.money >= gameState.quickerElectionsCost) {
        // Deduct the cost
        gameState.money -= gameState.quickerElectionsCost;

        // Decrease the election timer
        gameState.baseVoteTimer = Math.max(0.5, gameState.baseVoteTimer - 0.5); // Minimum timer is 0.5s
        updateVoteTimer();

        // Increase the cost (x5)
        gameState.quickerElectionsCost *= 5;

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
        gameState.richerVotersCost *= 2;

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
        gameState.betterOrganizationCost *= 2;

        // Update the UI
        document.getElementById('betterOrganizationCost').textContent = gameState.betterOrganizationCost;
        document.getElementById('betterOrganizationEffect').textContent = `$${gameState.blackLineMoneyBonus}`;
        updateDisplay();
    } else {
        alert("Not enough funds to upgrade!");
    }
}