// Game state (keep this for now if you like, but it won't be used immediately)
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
        blueWeight: 5,
        upgradeCost: 1
    })),
    quickerElectionsCost: 5,
    richerVotersCost: 2,
    betterOrganizationCost: 2,
    blueVoteMoneyBonus: 1,
    blackLineMoneyBonus: 1,
    showProbabilities: false
};

window.onload = () => {
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        const testDiv = document.createElement('div');
        testDiv.textContent = "JavaScript is running!";
        testDiv.style.color = "green";
        testDiv.style.fontSize = "24px";
        testDiv.style.marginTop = "20px";
        gameContainer.appendChild(testDiv);
    } else {
        console.error("Game container not found!");
    }

    console.log("myscripts.js loaded and window.onload fired!");

    // Comment out all your original game logic for now:
    // init();
    // resizeCanvas();
    // window.addEventListener('resize', resizeCanvas);
    // document.getElementById('toggleProbabilitiesButton').addEventListener('click', toggleProbabilityDisplay);

    // Remove the voter creation loop that runs immediately
    // for (let i = 0; i < 25; i++) { ... }
};