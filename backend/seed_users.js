const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const createUsers = async () => {
    try {
        const adminPassword = await bcrypt.hash('admin123', 10);
        const userPassword = await bcrypt.hash('user123', 10);

        db.serialize(() => {
            // Create Admin
            db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
                ['admin', adminPassword, 'admin'], (err) => {
                    if (err) console.error("Error creating admin:", err);
                    else console.log("Admin user 'admin' created! (Password: admin123)");
                });

            // Create User
            db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
                ['user', userPassword, 'user'], (err) => {
                    if (err) console.error("Error creating user:", err);
                    else console.log("Normal user 'user' created! (Password: user123)");
                });
        });
    } catch (e) {
        console.error(e);
    }
};

createUsers();
