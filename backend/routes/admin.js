const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { upload, hasAwsCredentials } = require('../s3');
const path = require('path');

router.use(authenticate, authorizeAdmin);

// Upload image (S3 if credentials set, otherwise local disk)
router.post('/upload-image', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'Upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // S3 gives req.file.location; local disk gives req.file.filename
        const imageUrl = hasAwsCredentials
            ? req.file.location
            : `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    });
});

// Create a quiz with optional questions
router.post('/quizzes', async (req, res) => {
    const { title, description, time_limit, questions, image_url, bg_image_url } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const insertQuizQuery = `
            INSERT INTO quizzes (title, description, time_limit, created_by, image_url, bg_image_url) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const resQuiz = await client.query(insertQuizQuery, [
            title, description, time_limit || 0, req.user.id, image_url || null, bg_image_url || null
        ]);
        const quizId = resQuiz.rows[0].id;

        if (questions && Array.isArray(questions) && questions.length > 0) {
            const insertQuestionQuery = `
                INSERT INTO questions (quiz_id, question_text, options, correct_answer) 
                VALUES ($1, $2, $3, $4)
            `;
            for (const q of questions) {
                const optionsJson = JSON.stringify(q.options);
                await client.query(insertQuestionQuery, [quizId, q.question_text, optionsJson, q.correct_answer]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Quiz created', quizId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Database error: ' + err.message });
    } finally {
        client.release();
    }
});

// Edit quiz
router.put('/quizzes/:id', async (req, res) => {
    try {
        const { title, description, time_limit } = req.body;
        const result = await db.query(
            `UPDATE quizzes SET title = $1, description = $2, time_limit = $3 WHERE id = $4`,
            [title, description, time_limit || 0, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Quiz not found' });
        res.json({ message: 'Quiz updated' });
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Delete quiz
router.delete('/quizzes/:id', async (req, res) => {
    const id = req.params.id;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM results WHERE quiz_id = $1`, [id]);
        await client.query(`DELETE FROM questions WHERE quiz_id = $1`, [id]);
        const result = await client.query(`DELETE FROM quizzes WHERE id = $1`, [id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Quiz deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Database error: ' + err.message });
    } finally {
        client.release();
    }
});

// Add a question to a quiz
router.post('/quizzes/:id/questions', async (req, res) => {
    try {
        const quizId = req.params.id;
        const { question_text, options, correct_answer } = req.body;

        if (!question_text || !options || options.length < 2 || correct_answer === undefined) {
            return res.status(400).json({ message: 'Invalid question data' });
        }

        const optionsJson = JSON.stringify(options);

        const result = await db.query(
            `INSERT INTO questions (quiz_id, question_text, options, correct_answer) VALUES ($1, $2, $3, $4) RETURNING id`,
            [quizId, question_text, optionsJson, correct_answer]
        );
        res.status(201).json({ message: 'Question added', questionId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ message: 'Database error: ' + err.message });
    }
});

// Get admin's own quizzes
router.get('/quizzes', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT q.id, q.title, q.description, q.time_limit, COUNT(qs.id) as question_count
            FROM quizzes q
            LEFT JOIN questions qs ON q.id = qs.quiz_id
            WHERE q.created_by = $1
            GROUP BY q.id
        `, [req.user.id]);
        // Convert count from string to int (pg returns COUNT as string)
        const formattedRows = rows.map(r => ({...r, question_count: parseInt(r.question_count, 10)}));
        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Get admin stats / all results for their own quizzes (Leaderboard)
router.get('/results', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT r.id, r.score, r.total_questions, r.time_taken, r.created_at, u.username, q.title 
            FROM results r 
            JOIN users u ON r.user_id = u.id 
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE q.created_by = $1
            ORDER BY r.created_at DESC
            LIMIT 15
        `, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT COUNT(r.id) as totalTaken, 
                   COALESCE(AVG(CAST(r.score AS FLOAT) / r.total_questions) * 100, 0) as avgScore
            FROM results r
            JOIN quizzes q ON r.quiz_id = q.id
            WHERE q.created_by = $1
        `, [req.user.id]);
        
        const row = rows[0];
        res.json({
            totalTaken: parseInt(row.totaltaken, 10) || 0,
            avgScore: Math.round(parseFloat(row.avgscore)) || 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Database error: ' + err.message });
    }
});

module.exports = router;
