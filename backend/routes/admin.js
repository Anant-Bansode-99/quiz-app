const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.use(authenticate, authorizeAdmin);

// Create a quiz with optional questions
router.post('/quizzes', (req, res) => {
    const { title, description, time_limit, questions } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    db.run("BEGIN TRANSACTION");

    db.run(`INSERT INTO quizzes (title, description, time_limit, created_by) VALUES (?, ?, ?, ?)`,
        [title, description, time_limit || 0, req.user.id], function (err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }

            const quizId = this.lastID;

            if (questions && Array.isArray(questions) && questions.length > 0) {
                let completed = 0;
                let hasError = false;

                const stmt = db.prepare(`INSERT INTO questions (quiz_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)`);

                questions.forEach(q => {
                    const optionsJson = JSON.stringify(q.options);
                    stmt.run([quizId, q.question_text, optionsJson, q.correct_answer], (qErr) => {
                        if (qErr && !hasError) {
                            hasError = true;
                            db.run("ROLLBACK");
                            return res.status(500).json({ message: 'Error saving questions: ' + qErr.message });
                        }

                        completed++;
                        if (completed === questions.length && !hasError) {
                            stmt.finalize();
                            db.run("COMMIT");
                            return res.status(201).json({ message: 'Quiz and questions created', quizId });
                        }
                    });
                });
            } else {
                db.run("COMMIT");
                res.status(201).json({ message: 'Quiz created (no questions)', quizId });
            }
        });
});

// Edit quiz (only if creator)
router.put('/quizzes/:id', (req, res) => {
    const { title, description, time_limit } = req.body;
    db.run(`UPDATE quizzes SET title = ?, description = ?, time_limit = ? WHERE id = ? AND created_by = ?`,
        [title, description, time_limit || 0, req.params.id, req.user.id], function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (this.changes === 0) return res.status(403).json({ message: 'Not authorized to edit this quiz' });
            res.json({ message: 'Quiz updated' });
        });
});

// Delete quiz (only if creator)
router.delete('/quizzes/:id', (req, res) => {
    db.run(`DELETE FROM quizzes WHERE id = ? AND created_by = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (this.changes === 0) return res.status(403).json({ message: 'Not authorized to delete this quiz' });
        res.json({ message: 'Quiz deleted' });
    });
});

// Add a question to a quiz
router.post('/quizzes/:id/questions', (req, res) => {
    const quizId = req.params.id;
    const { question_text, options, correct_answer } = req.body; // options as array

    if (!question_text || !options || options.length < 2 || correct_answer === undefined) {
        return res.status(400).json({ message: 'Invalid question data' });
    }

    const optionsJson = JSON.stringify(options);

    db.run(`INSERT INTO questions (quiz_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)`,
        [quizId, question_text, optionsJson, correct_answer], function (err) {
            if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
            res.status(201).json({ message: 'Question added', questionId: this.lastID });
        });
});

// Get admin's own quizzes
router.get('/quizzes', (req, res) => {
    db.all(`
        SELECT q.id, q.title, q.description, q.time_limit, COUNT(qs.id) as question_count
        FROM quizzes q
        LEFT JOIN questions qs ON q.id = qs.quiz_id
        WHERE q.created_by = ?
        GROUP BY q.id
    `, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Get admin stats / all results for their own quizzes (Leaderboard)
router.get('/results', (req, res) => {
    db.all(`
    SELECT r.id, r.score, r.total_questions, r.time_taken, r.created_at, u.username, q.title 
    FROM results r 
    JOIN users u ON r.user_id = u.id 
    JOIN quizzes q ON r.quiz_id = q.id
    WHERE q.created_by = ?
    ORDER BY r.created_at DESC
    LIMIT 15`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Get admin dashboard stats
router.get('/stats', (req, res) => {
    db.get(`
        SELECT COUNT(r.id) as totalTaken, 
               IFNULL(AVG(CAST(r.score AS FLOAT) / r.total_questions) * 100, 0) as avgScore
        FROM results r
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE q.created_by = ?
    `, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({
            totalTaken: row.totalTaken || 0,
            avgScore: Math.round(row.avgScore) || 0
        });
    });
});

module.exports = router;
