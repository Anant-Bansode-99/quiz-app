const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Generating dummy users and quiz results...');

const usersToCreate = [
    { username: 'alice', role: 'user' },
    { username: 'bob', role: 'user' },
    { username: 'charlie', role: 'user' },
    { username: 'diana', role: 'user' },
    { username: 'eve', role: 'user' }
];

async function seed() {
    db.serialize(async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);

        let insertUserStmt = db.prepare("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)");

        // 1. Insert Users
        for (const u of usersToCreate) {
            insertUserStmt.run([u.username, hashedPassword, u.role]);
        }
        insertUserStmt.finalize();

        // 2. Fetch Users and Quizzes
        db.all("SELECT id, username FROM users WHERE role = 'user'", (err, users) => {
            if (err) throw err;
            db.all("SELECT id, time_limit FROM quizzes", (err, quizzes) => {
                if (err) throw err;

                let insertResultStmt = db.prepare("INSERT INTO results (user_id, quiz_id, score, total_questions, answers, time_taken) VALUES (?, ?, ?, ?, ?, ?)");

                // 3. For each quiz, have each user take it with random results
                quizzes.forEach(quiz => {
                    // Get questions for this quiz to know total
                    db.all("SELECT id, correct_answer FROM questions WHERE quiz_id = ?", [quiz.id], (err, questions) => {
                        if (err) throw err;

                        const totalQuestions = questions.length;
                        if (totalQuestions === 0) return;

                        users.forEach(user => {
                            // Randomize score and time taken
                            // Let's say user gets random score 0 to totalQuestions
                            const score = Math.floor(Math.random() * (totalQuestions + 1));

                            // Let's randomize time taken between 10s and quiz.time_limit (or 10-300s if unlimited)
                            const maxTime = quiz.time_limit > 0 ? quiz.time_limit * 60 : 300;
                            const timeTaken = Math.floor(Math.random() * (maxTime - 10 + 1)) + 10;

                            // Mock answers array
                            const mockAnswers = JSON.stringify(questions.map(q => ({
                                questionId: q.id,
                                selectedOptionIndex: Math.random() > 0.5 ? q.correct_answer : 0 // 50% chance of correct
                            })));

                            insertResultStmt.run([user.id, quiz.id, score, totalQuestions, mockAnswers, timeTaken]);
                        });
                    });
                });

                setTimeout(() => {
                    insertResultStmt.finalize();
                    console.log('Successfully seeded 5 users with random quiz results!');
                    db.close();
                }, 2000); // Give inner queries time to finish
            });
        });
    });
}

seed();
