import { getUser, updateUser } from '../../server/database';

// Use a more persistent storage solution in production
let activeGames = new Map();

export default async function handler(req, res) {
  console.log('Received request:', req.method, req.url, req.body);
  try {
    const { method } = req;

    switch (method) {
      case 'POST':
        return await handlePost(req, res);
      case 'GET':
        return await handleGet(req, res);
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message, stack: error.stack });
  }
}

async function handlePost(req, res) {
  console.log('Handling POST request:', req.body);
  const { action, username, password, choice } = req.body;

  if (action === 'login') {
    return await handleLogin(username, password, res);
  } else if (action === 'makeChoice') {
    return await handleMakeChoice(username, choice, res);
  }

  res.status(400).json({ error: 'Invalid action' });
}

async function handleGet(req, res) {
  console.log('Handling GET request:', req.query);
  const { username } = req.query;
  return await handleGetGameStatus(username, res);
}

async function handleLogin(username, password, res) {
  console.log('Handling login for:', username);
  try {
    const user = await getUser(username);
    console.log('User data:', user);
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message, stack: error.stack });
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