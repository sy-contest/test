const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { getUser, updateUser } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '../public')));

const activeGames = new Map();

io.on('connection', (socket) => {
    let currentUser = null;

    socket.on('login', ({ username, password }) => {
        const user = getUser(username);
        if (user && user.password === password && !user.eliminated) {
            currentUser = user;
            socket.join(username);
            socket.emit('loginResult', {
                success: true,
                opponentName: user.opponent,
                gameTime: user.gameTime
            });

            const gameTime = new Date(user.gameTime).getTime();
            const now = Date.now();
            if (now >= gameTime) {
                startGame(user.username, user.opponent);
            } else {
                setTimeout(() => startGame(user.username, user.opponent), gameTime - now);
            }
        } else {
            socket.emit('loginResult', {
                success: false,
                message: 'Invalid credentials or user eliminated'
            });
        }
    });

    socket.on('makeChoice', (choice) => {
        if (currentUser && activeGames.has(currentUser.username)) {
            const game = activeGames.get(currentUser.username);
            game.makeChoice(currentUser.username, choice);
        }
    });

    socket.on('disconnect', () => {
        if (currentUser) {
            // Handle disconnection
        }
    });
});

function startGame(player1, player2) {
    const game = new Game(player1, player2);
    activeGames.set(player1, game);
    activeGames.set(player2, game);
    io.to(player1).to(player2).emit('gameStart');
}

class Game {
    constructor(player1, player2) {
        this.players = [player1, player2];
        this.choices = {};
    }

    makeChoice(player, choice) {
        this.choices[player] = choice;
        if (Object.keys(this.choices).length === 2) {
            this.endGame();
        }
    }

    endGame() {
        const [player1, player2] = this.players;
        const choice1 = this.choices[player1];
        const choice2 = this.choices[player2];

        let winner;
        if (choice1 === choice2) {
            winner = null; // Draw
        } else if (
            (choice1 === 'rock' && choice2 === 'scissors') ||
            (choice1 === 'paper' && choice2 === 'rock') ||
            (choice1 === 'scissors' && choice2 === 'paper')
        ) {
            winner = player1;
        } else {
            winner = player2;
        }

        const loser = winner ? (winner === player1 ? player2 : player1) : null;

        io.to(player1).emit('gameResult', {
            result: winner ? (winner === player1 ? 'You won!' : 'You lost!') : 'It\'s a draw!',
            eliminated: winner === player2
        });

        io.to(player2).emit('gameResult', {
            result: winner ? (winner === player2 ? 'You won!' : 'You lost!') : 'It\'s a draw!',
            eliminated: winner === player1
        });

        if (loser) {
            updateUser(loser, { eliminated: true });
        }

        activeGames.delete(player1);
        activeGames.delete(player2);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));