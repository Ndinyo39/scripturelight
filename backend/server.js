require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// === 1. HEALTH CHECK (ABSOLUTE TOP) ===
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// === 2. CORS & MIDDLEWARE ===
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// === 3. LAZY DATABASE CONNECTION ===
let isConnected = false;
const connectOnce = async () => {
    if (!isConnected) {
        // Only require DB config when needed
        const { connectDB } = require('./config/database');
        await connectDB();
        isConnected = true;
    }
};

app.use(async (req, res, next) => {
    // Skip DB check for health
    if (req.path === '/api/health' || req.path === '/api/test') return next();
    
    try {
        await connectOnce();
        next();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        res.status(500).json({ 
            error: 'Database connection failed', 
            details: err.message
        });
    }
});

// === 4. LAZY ROUTES ===
// This prevents top-level crashes if a route file has a bug
app.use('/api/auth', (req, res, next) => require('./routes/auth')(req, res, next));
app.use('/api/community', (req, res, next) => require('./routes/community')(req, res, next));
app.use('/api/study', (req, res, next) => require('./routes/study')(req, res, next));
app.use('/api/testimonies', (req, res, next) => require('./routes/testimonies')(req, res, next));
app.use('/api/comments', (req, res, next) => require('./routes/comments')(req, res, next));
app.use('/api/bible', (req, res, next) => require('./routes/bible')(req, res, next));
app.use('/api/groups', (req, res, next) => require('./routes/groups')(req, res, next));
app.use('/api/admin', (req, res, next) => require('./routes/admin')(req, res, next));
app.use('/api/books', (req, res, next) => require('./routes/books')(req, res, next));
app.use('/api/users', (req, res, next) => require('./routes/users')(req, res, next));

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