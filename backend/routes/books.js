const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Book, User } = require('../models');
const auth = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/books');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const { uploadBook, cloudinary } = require('../config/cloudinary');

// ── GET ALL APPROVED BOOKS ──────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const books = await Book.findAll({
            where: { status: 'approved' },
            include: [{ model: User, as: 'uploader', attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const { uploadBook, cloudinary } = require('../config/cloudinary');
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    message: { message: 'Upload limit reached, please try again later' }
});

// ── UPLOAD A BOOK ───────────────────────────────────────────────────
router.post('/upload', auth, uploadLimiter, uploadBook.single('book'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { title, author, description, category, coverColor } = req.body;

        if (!title || !author) {
            // No need to manually unlink from Cloudinary here easily, but we should validate before upload if possible.
            // For now, simple validation.
            return res.status(400).json({ message: 'Title and Author are required' });
        }

        const book = await Book.create({
            title,
            author,
            description,
            category: category || 'other',
            coverColor: coverColor || '#4a6fa5',
            fileName: req.file.path, // Full Cloudinary URL
            originalName: req.file.originalname,
            fileSize: req.file.size,
            uploaderId: req.user.id,
            status: 'pending' // Admin must approve
        });

        const fullBook = await Book.findByPk(book.id, {
            include: [{ model: User, as: 'uploader', attributes: ['name'] }]
        });

        res.json({ 
            message: 'Book uploaded successfully! It will be visible after admin review.',
            book: fullBook 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// ── DOWNLOAD / VIEW A BOOK ──────────────────────────────────────────
router.get('/:id/download', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book || book.status !== 'approved') {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Increment download count
        await book.increment('downloadCount');

        // Redirect to Cloudinary URL
        res.redirect(book.fileName);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── VIEW (INLINE) FOR PDF READING ──────────────────────────────────
router.get('/:id/read', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book || book.status !== 'approved') {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Redirect to Cloudinary URL
        res.redirect(book.fileName);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
