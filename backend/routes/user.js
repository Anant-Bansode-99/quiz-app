const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get User Profile
router.get('/profile', async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT id, username as email, name, role, google_id FROM users WHERE id = $1`, [req.user.id]);
        const user = rows[0];

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            isGoogleUser: !!user.google_id
        });
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

// Update User Profile
router.put('/profile', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (name === undefined) {
            return res.status(400).json({ message: 'Name is required' });
        }

        await db.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, req.user.id]);
        res.json({ message: 'Profile updated successfully', name });
    } catch (err) {
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
