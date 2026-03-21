const express = require('express');
const router = express.Router();
const { User, Testimony, CommunityPost, BibleGroup } = require('../models');

router.get('/', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
        const [usersCount, testimoniesCount, postsCount, groupsCount] = await Promise.all([
            User.count(),
            Testimony.count({ where: { status: 'approved' } }),
            CommunityPost.count(),
            BibleGroup.count()
        ]);

        res.json({
            users: usersCount,
            testimonies: testimoniesCount,
            prayers: postsCount,
            groups: groupsCount
        });
    } catch (err) {
        console.error('Stats fetch failed:', err);
        res.status(500).json({ message: 'Failed to fetch statistics' });
    }
});

module.exports = router;
