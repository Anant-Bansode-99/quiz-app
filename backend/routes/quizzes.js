const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get all quizzes
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT q.id, q.title, q.description, q.time_limit, COUNT(qs.id) as question_count
            FROM quizzes q
            LEFT JOIN questions qs ON q.id = qs.quiz_id
            GROUP BY q.id
        `);
        const formattedRows = rows.map(r => ({...r, question_count: parseInt(r.question_count, 10)}));
        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Get user history
router.get('/user/history', authenticate, async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT r.*, q.title FROM results r JOIN quizzes q ON r.quiz_id = q.id WHERE r.user_id = $1 ORDER BY r.created_at DESC`, 
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Get specific result details
router.get('/results/:id/details', authenticate, async (req, res) => {
    try {
        const resultId = req.params.id;
        const resultRes = await db.query(`SELECT * FROM results WHERE id = $1 AND user_id = $2`, [resultId, req.user.id]);
        const result = resultRes.rows[0];

        if (!result) return res.status(404).json({ message: 'Result not found or unauthorized' });

        const questionsRes = await db.query(
            `SELECT id, question_text, options, correct_answer FROM questions WHERE quiz_id = $1`, 
            [result.quiz_id]
        );
        
        const formattedQuestions = questionsRes.rows.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));

        res.json({ result: { ...result, answers: JSON.parse(result.answers) }, questions: formattedQuestions });
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Get quiz details and questions by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user.id;

        const quizRes = await db.query(`SELECT * FROM quizzes WHERE id = $1`, [quizId]);
        const quiz = quizRes.rows[0];
        
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const existingRes = await db.query(
            `SELECT id, score, total_questions FROM results WHERE user_id = $1 AND quiz_id = $2`, 
            [userId, quizId]
        );
        const existingResult = existingRes.rows[0];

        if (existingResult) {
            return res.json({ quiz, questions: [], alreadyAttempted: true, existingResult });
        }

        const questionsRes = await db.query(`SELECT id, question_text, options FROM questions WHERE quiz_id = $1`, [quizId]);
        const formattedQuestions = questionsRes.rows.map(q => ({
            ...q,
            options: JSON.parse(q.options)
        }));

        res.json({ quiz, questions: formattedQuestions, alreadyAttempted: false });
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Submit a quiz
router.post('/:id/submit', authenticate, async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user.id;
        const { answers, time_taken } = req.body;

        const existingRes = await db.query(`SELECT id FROM results WHERE user_id = $1 AND quiz_id = $2`, [userId, quizId]);
        if (existingRes.rows.length > 0) return res.status(403).json({ message: 'You have already attempted this quiz.' });

        const questionsRes = await db.query(`SELECT id, correct_answer FROM questions WHERE quiz_id = $1`, [quizId]);
        const questions = questionsRes.rows;
        
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

        const insertRes = await db.query(
            `INSERT INTO results (user_id, quiz_id, score, total_questions, answers, time_taken) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [userId, quizId, score, totalQuestions, answersJson, timeTaken]
        );

        res.json({ score, totalQuestions, resultId: insertRes.rows[0].id, time_taken: timeTaken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get quiz leaderboard
router.get('/:id/leaderboard', authenticate, async (req, res) => {
    try {
        const quizId = req.params.id;
        const { rows } = await db.query(`
            SELECT r.id, r.score, r.total_questions, r.time_taken, r.created_at, u.username, q.title
            FROM results r
            JOIN users u ON r.user_id = u.id
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE r.quiz_id = $1
            ORDER BY r.score DESC, r.time_taken ASC
            LIMIT 50
        `, [quizId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
