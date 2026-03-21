const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { BibleGroup, User, GroupMember, CommunityPost } = require('../models');

// @route   GET /api/groups
// @desc    Get all public groups
router.get('/', async (req, res) => {
    try {
        const groups = await BibleGroup.findAll({
            where: { isPrivate: false },
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'founder',
                attributes: ['name']
            }]
        });
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups/my
// @desc    Get groups the user belongs to
router.get('/my', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: BibleGroup,
                as: 'groups',
                through: { attributes: ['role'] }
            }]
        });
        res.json(user.groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/groups
// @desc    Create a new group
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, topic, meetingTime, pinnedVerse, isPrivate } = req.body;
        
        const group = await BibleGroup.create({
            name,
            description,
            topic,
            meetingTime,
            pinnedVerse,
            isPrivate: isPrivate || false,
            founderId: req.user.id
        });

        // Add founder as a member with 'founder' role
        await GroupMember.create({
            userId: req.user.id,
            groupId: group.id,
            role: 'founder'
        });

        const fullGroup = await BibleGroup.findByPk(group.id, {
            include: [{
                model: User,
                as: 'founder',
                attributes: ['name']
            }]
        });
        
        res.json(fullGroup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups/:id
// @desc    Get group details
router.get('/:id', async (req, res) => {
    try {
        const group = await BibleGroup.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'founder',
                    attributes: ['name']
                },
                {
                    model: User,
                    as: 'members',
                    attributes: ['id', 'name'],
                    through: { attributes: ['role'] }
                }
            ]
        });
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
router.post('/:id/join', auth, async (req, res) => {
    try {
        const group = await BibleGroup.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if already a member
        const existingMember = await GroupMember.findOne({
            where: { userId: req.user.id, groupId: group.id }
        });

        if (existingMember) {
            return res.status(400).json({ message: 'Already a member of this group' });
        }

        await GroupMember.create({
            userId: req.user.id,
            groupId: group.id,
            role: 'member'
        });

        // Increment memberCount
        await group.increment('memberCount');
        
        res.json({ message: 'Joined successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
router.post('/:id/leave', auth, async (req, res) => {
    try {
        const group = await BibleGroup.findByPk(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const membership = await GroupMember.findOne({
            where: { userId: req.user.id, groupId: group.id }
        });

        if (!membership) {
            return res.status(400).json({ message: 'Not a member of this group' });
        }

        if (membership.role === 'founder') {
            return res.status(400).json({ message: 'Founder cannot leave the group. Delete it instead.' });
        }

        await membership.destroy();
        await group.decrement('memberCount');
        
        res.json({ message: 'Left successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups/:id/posts
// @desc    Get posts for a specific group
router.get('/:id/posts', async (req, res) => {
    try {
        const posts = await CommunityPost.findAll({
            where: { groupId: req.params.id },
            order: [['createdAt', 'DESC']],
            include: [{
                model: User,
                as: 'user',
                attributes: ['name']
            }]
        });
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/groups/:id/posts
// @desc    Create a post in a group
router.post('/:id/posts', auth, async (req, res) => {
    try {
        const { content, scripture } = req.body;
        
        // Check if user is a member
        const membership = await GroupMember.findOne({
            where: { userId: req.user.id, groupId: req.params.id }
        });
        
        if (!membership) {
            return res.status(403).json({ message: 'Must be a group member to post' });
        }

        const post = await CommunityPost.create({
            userId: req.user.id,
            groupId: req.params.id,
            content,
            scripture,
            type: 'group_discussion'
        });

        const fullPost = await CommunityPost.findByPk(post.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['name']
            }]
        });

        res.json(fullPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
