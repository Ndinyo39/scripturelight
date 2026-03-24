const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Highlight, BibleActivity } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Get all highlights for current user
router.get('/highlights', auth, async (req, res) => {
    try {
        const highlights = await Highlight.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(highlights);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create, Update, or Delete a highlight
router.post('/highlights', auth, async (req, res) => {
    try {
        const { book, chapter, verseNumber, content, color } = req.body;
        
        const where = {
            userId: req.user.id,
            book,
            chapter,
            verseNumber
        };

        if (!color) {
            // Treat missing color as a deletion request
            await Highlight.destroy({ where });
            return res.json({ message: 'Highlight removed' });
        }

        // Find existing highlight for this specific verse
        let highlight = await Highlight.findOne({ where });

        if (highlight) {
            // Update color or content
            highlight.color = color;
            if (content) highlight.content = content;
            await highlight.save();
        } else {
            // Create new
            highlight = await Highlight.create({
                userId: req.user.id,
                book,
                chapter,
                verseNumber,
                content: content || '',
                color
            });
        }

        res.json(highlight);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a highlight
router.delete('/highlights/:id', auth, async (req, res) => {
    try {
        const highlight = await Highlight.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!highlight) {
            return res.status(404).json({ message: 'Highlight not found' });
        }

        await highlight.destroy();
        res.json({ message: 'Highlight removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Record reading progress
router.post('/record-progress', auth, async (req, res) => {
    try {
        const { book, chapter, minutesSpent } = req.body;
        
        // Log activity (multiple logs per day/chapter are fine, we aggregate later)
        await BibleActivity.create({
            userId: req.user.id,
            book,
            chapter,
            minutesSpent: minutesSpent || 5
        });

        res.json({ message: 'Progress recorded' });
    } catch (err) {
        console.error('Failed to record progress:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reading statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Total chapters read (unique book/chapter pairs)
        const totalChapters = await BibleActivity.count({
            where: { userId },
            distinct: true,
            col: 'chapter',
            // Note: This is a bit simplified for SQLite; ideally we'd use a composite unique count
            // but for a dev environment this is fine, or we can use a raw query.
        });

        // More accurate chapter count:
        const uniqueChapters = await BibleActivity.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('book')), 'book'],
                'chapter'
            ],
            where: { userId },
            raw: true
        });

        // 2. Total minutes spent
        const totalMinutes = await BibleActivity.sum('minutesSpent', {
            where: { userId }
        }) || 0;

        // 3. Chart data (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const dayMins = await BibleActivity.sum('minutesSpent', {
                where: {
                    userId,
                    dateRead: {
                        [Op.gte]: new Date(dateString + 'T00:00:00.000Z'),
                        [Op.lte]: new Date(dateString + 'T23:59:59.999Z')
                    }
                }
            }) || 0;

            last7Days.push({ name: dayName, mins: dayMins });
        }

        res.json({
            totalChapters: uniqueChapters.length,
            totalMinutes,
            chartData: last7Days
        });
    } catch (err) {
        console.error('Failed to fetch bible stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
