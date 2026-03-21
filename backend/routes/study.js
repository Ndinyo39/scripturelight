const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { StudyPlan, User } = require('../models');

// Get all study plans
router.get('/', async (req, res) => {
    try {
        const plans = await StudyPlan.findAll();
        res.json(plans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join/Select a study plan
router.post('/join', auth, async (req, res) => {
    try {
        const { planId } = req.body;
        
        // Find user
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find study plan
        const planExists = await StudyPlan.findByPk(planId);
        if (!planExists) {
            return res.status(404).json({ message: 'Study plan not found' });
        }
        
        // Update user's active plan
        await user.update({ activePlanId: planId });
        
        // Return updated user profile including new plan
        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] },
            include: [{
                model: StudyPlan,
                as: 'activePlan'
            }]
        });
        
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's active study plan
router.get('/my-plan', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: StudyPlan,
                as: 'activePlan'
            }]
        });
        
        if (user && user.activePlan) {
            res.json(user.activePlan);
        } else {
            res.json({ message: 'No active study plan' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;