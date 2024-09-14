let currentUser = null;

document.getElementById('login-btn').addEventListener('click', login);
document.querySelectorAll('.choice').forEach(button => {
  button.addEventListener('click', () => makeChoice(button.dataset.choice));
});

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });

    const data = await response.json();

    if (data.success) {
      currentUser = username;
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('game-container').style.display = 'block';
      document.getElementById('opponent-name').textContent = `Opponent: ${data.opponentName}`;
      document.getElementById('game-status').textContent = `Game starts at: ${data.gameTime}`;
      startPolling();
    } else {
      alert('Login failed: ' + data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login');
  }
}

async function makeChoice(choice) {
  if (!currentUser) return;

  try {
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'makeChoice', username: currentUser, choice })
    });

    const data = await response.json();
    if (data.status === 'complete') {
      handleGameResult(data);
    } else {
      document.getElementById('game-status').textContent = data.message;
    }
  } catch (error) {
    console.error('Choice error:', error);
    alert('An error occurred while making a choice');
  }
}

function startPolling() {
  setInterval(pollGameStatus, 2000); // Poll every 2 seconds
}

async function pollGameStatus() {
  if (!currentUser) return;

  try {
    const response = await fetch(`/api/game?username=${currentUser}`);
    const data = await response.json();

    if (data.status === 'complete') {
      handleGameResult(data);
    } else {
      document.getElementById('game-status').textContent = data.message;
    }
  } catch (error) {
    console.error('Polling error:', error);
  }
}

function handleGameResult(data) {
  document.getElementById('result').textContent = data.result;
  document.getElementById('game-status').textContent = 'Game Over';
  document.querySelectorAll('.choice').forEach(button => button.disabled = true);

  if (data.loser === currentUser) {
    document.getElementById('game-status').textContent = 'You have been eliminated from the tournament.';
  }
}