let currentUser = null;
let users = [];
let matches = [];

// Load user data
async function loadUsers() {
    try {
        const response = await fetch('data/users.json');
        users = await response.json();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load match data
async function loadMatches() {
    try {
        const response = await fetch('data/matches.json');
        matches = await response.json();
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

// Login function
function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        document.getElementById('player-name').textContent = currentUser.username;
        checkMatchTime();
    } else {
        alert('Invalid username or password');
    }
}

// Check match time
function checkMatchTime() {
    const match = matches.find(m => m.player1 === currentUser.username || m.player2 === currentUser.username);
    if (match) {
        const matchTime = new Date(match.time);
        document.getElementById('match-time').textContent = matchTime.toLocaleString();
        if (new Date() >= matchTime) {
            document.getElementById('game-status').textContent = 'Your match is ready!';
            enableGameButtons();
        } else {
            document.getElementById('game-status').textContent = 'Waiting for your scheduled match time...';
            setTimeout(checkMatchTime, 60000); // Check again in 1 minute
        }
    } else {
        document.getElementById('game-status').textContent = 'No match scheduled.';
    }
}

// Enable game buttons
function enableGameButtons() {
    const buttons = document.querySelectorAll('#choices button');
    buttons.forEach(button => {
        button.disabled = false;
        button.addEventListener('click', makeChoice);
    });
}

// Player makes a choice
function makeChoice(event) {
    const playerChoice = event.target.id;
    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    
    const result = determineWinner(playerChoice, computerChoice);
    updateResult(result, playerChoice, computerChoice);
    
    if (result === 'You lose!') {
        eliminatePlayer();
    }
}

// Determine the winner
function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) return 'It\'s a tie!';
    if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        return 'You win!';
    }
    return 'You lose!';
}

// Update the result on the page
function updateResult(result, playerChoice, computerChoice) {
    const resultElement = document.getElementById('result');
    resultElement.textContent = `You chose ${playerChoice}. Opponent chose ${computerChoice}. ${result}`;
}

// Eliminate player
function eliminatePlayer() {
    currentUser.eliminated = true;
    document.getElementById('game-status').textContent = 'You have been eliminated from the tournament.';
    const buttons = document.querySelectorAll('#choices button');
    buttons.forEach(button => button.disabled = true);
    // In a real application, you would send this information to the server to update the database
}

// Event listener for login form
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
});

// Initialize the application
async function init() {
    await loadUsers();
    await loadMatches();
}

init();