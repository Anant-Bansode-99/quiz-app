const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get all quizzes
router.get('/', (req, res) => {
    db.all(`
        SELECT q.id, q.title, q.description, q.time_limit, COUNT(qs.id) as question_count
        FROM quizzes q
        LEFT JOIN questions qs ON q.id = qs.quiz_id
        GROUP BY q.id
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// ⚠️ Specific named routes MUST come before /:id wildcard

// Get user history
router.get('/user/history', authenticate, (req, res) => {
    db.all(`SELECT r.*, q.title FROM results r JOIN quizzes q ON r.quiz_id = q.id WHERE r.user_id = ? ORDER BY r.created_at DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Get specific result details
router.get('/results/:id/details', authenticate, (req, res) => {
    const resultId = req.params.id;

    db.get(`SELECT * FROM results WHERE id = ? AND user_id = ?`, [resultId, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!result) return res.status(404).json({ message: 'Result not found or unauthorized' });

        db.all(`SELECT id, question_text, options, correct_answer FROM questions WHERE quiz_id = ?`, [result.quiz_id], (err, questions) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            const formattedQuestions = questions.map(q => ({
                ...q,
                options: JSON.parse(q.options)
            }));

            res.json({ result: { ...result, answers: JSON.parse(result.answers) }, questions: formattedQuestions });
        });
    });
});

// Get quiz details and questions by ID (wildcard — must come after named routes)
router.get('/:id', authenticate, (req, res) => {
    const quizId = req.params.id;
    const userId = req.user.id;

    db.get(`SELECT * FROM quizzes WHERE id = ?`, [quizId], (err, quiz) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Check if user already attempted this quiz
        db.get(`SELECT id, score, total_questions FROM results WHERE user_id = ? AND quiz_id = ?`, [userId, quizId], (err, existingResult) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            if (existingResult) {
                return res.json({ quiz, questions: [], alreadyAttempted: true, existingResult });
            }

            db.all(`SELECT id, question_text, options FROM questions WHERE quiz_id = ?`, [quizId], (err, questions) => {
                if (err) return res.status(500).json({ message: 'Database error' });

                const formattedQuestions = questions.map(q => ({
                    ...q,
                    options: JSON.parse(q.options)
                }));

                res.json({ quiz, questions: formattedQuestions, alreadyAttempted: false });
            });
        });
    });
});

// Submit a quiz
router.post('/:id/submit', authenticate, (req, res) => {
    const quizId = req.params.id;
    const userId = req.user.id;
    const { answers, time_taken } = req.body;

    // Block duplicate attempts
    db.get(`SELECT id FROM results WHERE user_id = ? AND quiz_id = ?`, [userId, quizId], (err, existing) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (existing) return res.status(403).json({ message: 'You have already attempted this quiz.' });

        proceedWithSubmit();
    });

    function proceedWithSubmit() {
        db.all(`SELECT id, correct_answer FROM questions WHERE quiz_id = ?`, [quizId], (err, questions) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            if (!questions.length) return res.status(404).json({ message: 'Quiz questions not found' });

            let score = 0;
            const totalQuestions = questions.length;

            questions.forEach(q => {
                const userAnswer = answers.find(a => a.questionId === q.id);
                if (userAnswer && userAnswer.selectedOptionIndex === q.correct_answer) {
                    score++;
                }
            });

            const answersJson = JSON.stringify(answers);
            const timeTaken = parseInt(time_taken) || 0;

            db.run(`INSERT INTO results (user_id, quiz_id, score, total_questions, answers, time_taken) VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, quizId, score, totalQuestions, answersJson, timeTaken], function (err) {
                    if (err) return res.status(500).json({ message: 'Database error when saving results' });
                    res.json({ score, totalQuestions, resultId: this.lastID, time_taken: timeTaken });
                });
        });
    }
});

// Get quiz leaderboard
router.get('/:id/leaderboard', authenticate, (req, res) => {
    const quizId = req.params.id;
    db.all(`
        SELECT r.id, r.score, r.total_questions, r.time_taken, r.created_at, u.username, q.title
        FROM results r
        JOIN users u ON r.user_id = u.id
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE r.quiz_id = ?
        ORDER BY r.score DESC, r.time_taken ASC
        LIMIT 50
    `, [quizId], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

module.exports = router;
