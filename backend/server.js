require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const path = require('path');

const app = express();

let isConnected = false;
const connectOnce = async () => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
    try {
        await connectOnce();
        next();
    } catch (err) {
        console.error('Failed to connect to database:', err.message);
        res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
});

// === FIXED CORS CONFIGURATION ===
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins for development
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// === ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/community', require('./routes/community'));
app.use('/api/study', require('./routes/study'));
app.use('/api/testimonies', require('./routes/testimonies'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bible', require('./routes/bible'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/books', require('./routes/books'));
app.use('/api/users', require('./routes/users'));

// Serve uploaded book files statically
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// === SIMPLE TEST ENDPOINT ===
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '✅ ScriptureLight API is working!',
        timestamp: new Date().toISOString(),
        database: process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            test: 'GET /api/test'
        }
    });
});

// === CATCH-ALL ROUTE ===
app.all('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// === ERROR HANDLER ===
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// === START SERVER ===
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0'; // Listen on all network interfaces

    app.listen(PORT, HOST, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 ScriptureLight Backend Server Started!');
        console.log('='.repeat(60));
        console.log(`📍 Local:    http://localhost:${PORT}`);
        console.log(`📍 Database: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'}`);
        console.log('');
        console.log('📋 Active Routes:');
        console.log(`   /api/auth`);
        console.log(`   /api/community`);
        console.log(`   /api/study`);
        console.log('='.repeat(60) + '\n');
    });
}

module.exports = app;

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});