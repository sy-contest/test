import { getUser, updateUser } from '../server/database';

let activeGames = new Map();

export default function handler(req, res) {
  const { method, body } = req;

  switch (method) {
    case 'POST':
      if (body.action === 'login') {
        return handleLogin(body, res);
      } else if (body.action === 'makeChoice') {
        return handleMakeChoice(body, res);
      }
      break;
    case 'GET':
      return handleGetGameStatus(req.query, res);
    default:
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function handleLogin({ username, password }, res) {
  const user = getUser(username);
  if (user && user.password === password && !user.eliminated) {
    res.status(200).json({
      success: true,
      opponentName: user.opponent,
      gameTime: user.gameTime
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials or user eliminated'
    });
  }
}

function handleMakeChoice({ username, choice }, res) {
  if (!activeGames.has(username)) {
    const user = getUser(username);
    if (user && !user.eliminated) {
      const game = new Game(username, user.opponent);
      activeGames.set(username, game);
      activeGames.set(user.opponent, game);
    } else {
      return res.status(400).json({ error: 'Game not active or user eliminated' });
    }
  }

  const game = activeGames.get(username);
  game.makeChoice(username, choice);

  if (game.isComplete()) {
    const result = game.getResult();
    activeGames.delete(username);
    activeGames.delete(game.getOpponent(username));

    if (result.loser) {
      updateUser(result.loser, { eliminated: true });
    }

    res.status(200).json(result);
  } else {
    res.status(200).json({ message: 'Choice recorded' });
  }
}

function handleGetGameStatus({ username }, res) {
  const game = activeGames.get(username);
  if (game) {
    res.status(200).json(game.getStatus(username));
  } else {
    res.status(200).json({ status: 'waiting' });
  }
}

class Game {
  constructor(player1, player2) {
    this.players = [player1, player2];
    this.choices = {};
  }

  makeChoice(player, choice) {
    this.choices[player] = choice;
  }

  isComplete() {
    return Object.keys(this.choices).length === 2;
  }

  getOpponent(player) {
    return this.players.find(p => p !== player);
  }

  getStatus(player) {
    if (this.isComplete()) {
      return this.getResult();
    } else if (this.choices[player]) {
      return { status: 'waiting', message: 'Waiting for opponent' };
    } else {
      return { status: 'choose', message: 'Make your choice' };
    }
  }

  getResult() {
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

    return {
      status: 'complete',
      result: winner ? `${winner} wins!` : 'It\'s a draw!',
      winner,
      loser,
      choices: this.choices
    };
  }
}