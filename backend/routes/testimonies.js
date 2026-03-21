const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Testimony, User, Comment } = require('../models');
const { sequelize } = require('../config/database');

// Get all approved testimonies with commentsCount
router.get('/', async (req, res) => {
    try {
        const testimonies = await Testimony.findAll({
            where: { status: 'approved' },
            order: [['createdAt', 'DESC']],
            attributes: {
                include: [
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM Comments WHERE Comments.testimonyId = Testimony.id)`),
                        'commentsCount'
                    ]
                ]
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'bio']
            }]
        });
        res.json(testimonies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new testimony (requires login)
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, category, scripture } = req.body;
        const testimony = await Testimony.create({
            userId: req.user.id,
            title,
            content,
            category,
            scripture
        });
        
        const fullTestimony = await Testimony.findByPk(testimony.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'bio']
            }]
        });
        
        // Return with a clear pending-status message
        res.json({
            testimony: fullTestimony,
            message: 'Your testimony has been submitted and is awaiting admin approval. Thank you for sharing!',
            status: 'pending'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Amen (increment amenCount)
router.post('/:id/amen', auth, async (req, res) => {
    try {
        const testimony = await Testimony.findByPk(req.params.id);
        if (!testimony) return res.status(404).json({ message: 'Testimony not found' });
        
        await testimony.increment('amenCount');
        const updatedTestimony = await Testimony.findByPk(testimony.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'bio']
            }]
        });
        res.json(updatedTestimony);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
