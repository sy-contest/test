const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    throw new Error('Failed to read database');
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database:', error);
    throw new Error('Failed to write to database');
  }
}

module.exports = {
  getUser: (username) => {
    try {
      console.log('Getting user:', username);
      const db = readDatabase();
      const user = db.users.find(user => user.username === username);
      console.log('User found:', user);
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },
  updateUser: (username, updates) => {
    try {
      console.log('Updating user:', username, updates);
      const db = readDatabase();
      const userIndex = db.users.findIndex(user => user.username === username);
      if (userIndex !== -1) {
        db.users[userIndex] = { ...db.users[userIndex], ...updates };
        writeDatabase(db);
        console.log('User updated successfully');
      } else {
        console.log('User not found for update');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
};