const socket = io();

const loginForm = document.getElementById('login-form');
const gameContainer = document.getElementById('game-container');
const loginBtn = document.getElementById('login-btn');
const opponentName = document.getElementById('opponent-name');
const gameStatus = document.getElementById('game-status');
const choices = document.querySelectorAll('.choice');
const result = document.getElementById('result');

loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    socket.emit('login', { username, password });
});

socket.on('loginResult', (data) => {
    if (data.success) {
        loginForm.style.display = 'none';
        gameContainer.style.display = 'block';
        opponentName.textContent = `Opponent: ${data.opponentName}`;
        gameStatus.textContent = `Game starts at: ${data.gameTime}`;
    } else {
        alert('Login failed: ' + data.message);
    }
});

choices.forEach(choice => {
    choice.addEventListener('click', () => {
        socket.emit('makeChoice', choice.dataset.choice);
    });
});

socket.on('gameResult', (data) => {
    result.textContent = data.result;
    if (data.eliminated) {
        choices.forEach(choice => choice.disabled = true);
        gameStatus.textContent = 'You have been eliminated from the tournament.';
    }
});

socket.on('opponentChoice', (choice) => {
    // Update UI to show opponent's choice
});

socket.on('gameStart', () => {
    gameStatus.textContent = 'Game has started. Make your choice!';
});

socket.on('gameEnd', (data) => {
    // Handle game end, show final result
});