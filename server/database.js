const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

function readDatabase() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    getUser: (username) => {
        const db = readDatabase();
        return db.users.find(user => user.username === username);
    },
    updateUser: (username, updates) => {
        const db = readDatabase();
        const userIndex = db.users.findIndex(user => user.username === username);
        if (userIndex !== -1) {
            db.users[userIndex] = { ...db.users[userIndex], ...updates };
            writeDatabase(db);
        }
    }
};