const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Seeding database with sample quizzes...');

db.serialize(() => {
    // Generate an admin user if one doesn't exist, else use ID 1
    db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', '$2b$10$wTfOh3d/z2V2wz/lM.qPReo3uSIf/d5ZRKlKpH1h9Z7rJZTtRzj9u', 'admin')", function (err) {
        if (err) console.error("Error inserting admin user:", err.message);

        db.get("SELECT id FROM users WHERE username = 'admin' LIMIT 1", (err, row) => {
            let adminId = row ? row.id : 1; // Fallback to 1

            const quizzes = [
                {
                    title: "JavaScript Fundamentals",
                    description: "Test your knowledge of core JavaScript concepts.",
                    time_limit: 5,
                    questions: [
                        { text: "What is a closure in JavaScript?", options: ["A locked object", "A function bundled with its lexical environment", "A type of loop for arrays", "A way to close a database connection"], correct: 1 },
                        { text: "Which keyword is used to declare a constant?", options: ["var", "let", "const", "static"], correct: 2 },
                        { text: "What is 0 == false evaluate to?", options: ["true", "false", "undefined", "TypeError"], correct: 0 }
                    ]
                },
                {
                    title: "Advanced React.js",
                    description: "Deep dive into React hooks, context, and performance.",
                    time_limit: 10,
                    questions: [
                        { text: "What hook prevents a function from being recreated on every render?", options: ["useMemo", "useCallback", "useRef", "useEffect"], correct: 1 },
                        { text: "How does React handle state updates inside useEffect?", options: ["Synchronously", "Asynchronously", "Immediately before paint", "They are ignored"], correct: 1 }
                    ]
                },
                {
                    title: "General Tech Trivia",
                    description: "A fun mix of hardware and software history.",
                    time_limit: 0, // No limit
                    questions: [
                        { text: "What does CPU stand for?", options: ["Central Process Unit", "Computer Personal Unit", "Central Processing Unit", "Central Processor Unit"], correct: 2 },
                        { text: "Who is known as the father of computer science?", options: ["Alan Turing", "Charles Babbage", "Bill Gates", "Steve Jobs"], correct: 0 }
                    ]
                }
            ];

            let insertQuizStmt = db.prepare("INSERT INTO quizzes (title, description, time_limit, created_by) VALUES (?, ?, ?, ?)");
            let insertQuestionStmt = db.prepare("INSERT INTO questions (quiz_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)");

            let pendingQzs = quizzes.length;

            quizzes.forEach(quiz => {
                insertQuizStmt.run([quiz.title, quiz.description, quiz.time_limit, adminId], function (err) {
                    if (err) throw err;
                    let qzId = this.lastID;

                    quiz.questions.forEach(q => {
                        const opts = JSON.stringify(q.options);
                        insertQuestionStmt.run([qzId, q.text, opts, q.correct]);
                    });

                    pendingQzs--;
                    if (pendingQzs === 0) {
                        insertQuizStmt.finalize();
                        insertQuestionStmt.finalize();
                        console.log('Seeding complete! 3 Quizzes and Admin User added.');
                        db.close();
                    }
                });
            });
        });
    });
});
