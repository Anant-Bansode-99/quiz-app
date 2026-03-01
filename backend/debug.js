const db = require('./db');

db.serialize(() => {
    db.all("SELECT * FROM quizzes", (err, rows) => {
        console.log("QUIZZES:", rows);
    });
    db.all("SELECT * FROM questions", (err, rows) => {
        console.log("QUESTIONS:", rows);
    });
});
