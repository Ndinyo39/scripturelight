const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { CommunityPost, User } = require('../models');

// Get all community posts
router.get('/', async (req, res) => {
    try {
        const posts = await CommunityPost.findAll({
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'bio']
            }]
        });
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new post (auth required)
router.post('/', auth, async (req, res) => {
    try {
        const { content, scripture, type } = req.body;
        const post = await CommunityPost.create({
            userId: req.user.id,
            content,
            scripture,
            type: type || 'encouragement'
        });
        
        // Fetch post with user info for response
        const fullPost = await CommunityPost.findByPk(post.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'bio']
            }]
        });
        
        res.json(fullPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Pray for a post (increment prayCount)
router.post('/:id/pray', auth, async (req, res) => {
    try {
        const post = await CommunityPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        await post.increment('prayCount');
        const updatedPost = await post.reload();
        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a post (auth required, must be owner)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await CommunityPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.userId !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        
        await post.destroy();
        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;