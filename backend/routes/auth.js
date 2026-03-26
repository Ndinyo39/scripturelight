const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User, StudyPlan, CommunityPost, Testimony, Comment } = require('../models');
const auth = require('../middleware/auth');
const { sequelize } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// ── Rate Limiters ─────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Email transporter ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Cloudinary is lazy-loaded inside the profile route to prevent
// missing env vars from crashing the entire auth module in production.

// Register user
router.post('/register', authLimiter, [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('username')
        .optional({ checkFalsy: true })
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .matches(/^[a-z0-9_]+$/).withMessage('Username can only contain lowercase letters, numbers, and underscores'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { name, username, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if username is taken
        if (username) {
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
            }
        }

        // Create user
        user = await User.create({
            name,
            username: username || null,
            email,
            password
        });

        // New users are 'active' by default for immediate community access
        res.json({ 
            message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.',
            status: 'pending'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user (accepts email or username)
router.post('/login', loginLimiter, [
    body('identifier').not().isEmpty().withMessage('Email or username is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Support both { email, password } (legacy) and { identifier, password } (new)
        const identifier = req.body.identifier || req.body.email;
        const { password } = req.body;

        // Check if user exists by email or username
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is approved
        if (user.status === 'pending') {
            return res.status(403).json({ message: 'Your account is pending admin approval. Please check back later.' });
        }
        
        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Create JWT token
        const payload = {
            user: {
                id: user.id
            }
        };

        if (!process.env.JWT_SECRET) {
            console.error('FATAL ERROR: JWT_SECRET is not defined.');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        streak: user.streak, 
                        role: user.role,
                        profilePicture: user.profilePicture,
                        bio: user.bio
                    } 
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile
router.put('/profile', auth, (req, res, next) => {
    // Lazy-load cloudinary to prevent missing env vars from crashing auth module
    try {
        const { uploadProfile } = require('../config/cloudinary');
        uploadProfile.single('profilePicture')(req, res, next);
    } catch (err) {
        console.error('Cloudinary not configured:', err.message);
        next(); // Continue without file upload if cloudinary is not set up
    }
}, async (req, res) => {
    try {
        console.log(`Updating profile for user ${req.user.id}...`);
        const { bio, name } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updates = {};
        if (bio !== undefined) updates.bio = bio;
        if (name !== undefined) updates.name = name;
        
        if (req.file) {
            console.log('New profile picture uploaded to Cloudinary:', req.file.path);
            updates.profilePicture = req.file.path; // Cloudinary returns the full URL in path
        }

        await user.update(updates);
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                streak: user.streak,
                profilePicture: user.profilePicture,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
router.get('/me', auth, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: {
                exclude: ['password'],
                include: [
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM CommunityPosts WHERE userId = User.id)`),
                        'postsCount'
                    ],
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM Testimonies WHERE userId = User.id)`),
                        'testimoniesCount'
                    ],
                    [
                        sequelize.literal(`(SELECT COUNT(*) FROM Comments WHERE userId = User.id)`),
                        'commentsCount'
                    ],
                    [
                        sequelize.literal(`(SELECT SUM(viewCount) FROM CommunityPosts WHERE userId = User.id)`),
                        'totalViewsCount'
                    ]
                ]
            },
            include: [{
                model: StudyPlan,
                as: 'activePlan'
            }]
        });
        // Return a plain object so ENUM fields (like role) are always serialized
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            streak: user.streak,
            completedPlansCount: user.completedPlansCount,
            profilePicture: user.profilePicture,
            bio: user.bio,
            lastLogin: user.lastLogin,
            postsCount: user.get('postsCount'),
            testimoniesCount: user.get('testimoniesCount'),
            commentsCount: user.get('commentsCount'),
            totalViewsCount: user.get('totalViewsCount') || 0,
            activePlan: user.activePlan ?? null,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Forgot Password ───────────────────────────────────────────────────
router.post('/forgot-password', authLimiter, [
    body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        // Always return success to avoid email enumeration
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await user.update({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: expires
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

        const mailOptions = {
            from: `"ScriptureLight" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'ScriptureLight – Password Reset Request',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#1a3052,#2a9d8f);padding:32px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:1.6rem;">🙏 ScriptureLight</h1>
                    </div>
                    <div style="padding:32px;color:#333;">
                        <h2 style="margin-top:0;">Password Reset</h2>
                        <p>Hello <strong>${user.name}</strong>,</p>
                        <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
                        <div style="text-align:center;margin:32px 0;">
                            <a href="${resetUrl}" style="background:linear-gradient(135deg,#1a3052,#2a9d8f);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem;">Reset Password</a>
                        </div>
                        <p style="font-size:0.85rem;color:#888;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
                        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                        <p style="font-size:0.8rem;color:#aaa;text-align:center;">© 2026 ScriptureLight 🙏</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }
});

// ── Reset Password ────────────────────────────────────────────────────
router.post('/reset-password', [
    body('token').not().isEmpty().withMessage('Token is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { token, email, password } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                email,
                resetPasswordToken: hashedToken
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link.' });
        }

        if (new Date() > user.resetPasswordExpires) {
            await user.update({ resetPasswordToken: null, resetPasswordExpires: null });
            return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
        }

        // Set new password (the beforeSave hook will hash it)
        await user.update({
            password,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

module.exports = router;
