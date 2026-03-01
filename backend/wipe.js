const db = require('./db');

db.serialize(() => {
    db.run("DELETE FROM results", (err) => {
        if (!err) console.log("Removed all old results");
    });
    db.run("DELETE FROM questions", (err) => {
        if (!err) console.log("Removed all old questions");
    });
    db.run("DELETE FROM quizzes", (err) => {
        if (!err) console.log("Removed all old quizzes");
    });
});
