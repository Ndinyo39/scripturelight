require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const app = express();

// === GLOBAL ENV SANITIZATION (Fix for 'Port number ended with \') ===
for (const key in process.env) {
    if (typeof process.env[key] === 'string' && process.env[key].includes('\\')) {
        // console.log(`Sanitizing env var: ${key}`);
        process.env[key] = process.env[key].replace(/[\\]+/g, '').trim();
    }
}

// === 1. HEALTH CHECK (Professional) ===
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        time: new Date().toISOString(),
        version: '1.1.0'
    });
});

const helmet = require('helmet');
const compression = require('compression');

// === 2. CORS & MIDDLEWARE ===
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// === 3. LAZY DATABASE CONNECTION ===
let isConnected = false;
const connectOnce = async () => {
    if (!isConnected) {
        const { connectDB } = require('./config/database');
        await connectDB();
        isConnected = true;
    }
};

app.use(async (req, res, next) => {
    // Skip DB check for health/external tests
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

app.use('/api/auth', (req, res, next) => {
    try {
        return require('./routes/auth')(req, res, next);
    } catch (err) {
        console.error('Lazy load /api/auth failed:', err);
        res.status(500).json({ error: 'Failed to load auth routes', details: err.message });
    }
});
app.use('/api/community', (req, res, next) => require('./routes/community')(req, res, next));
app.use('/api/study', (req, res, next) => require('./routes/study')(req, res, next));
app.use('/api/testimonies', (req, res, next) => require('./routes/testimonies')(req, res, next));
app.use('/api/comments', (req, res, next) => require('./routes/comments')(req, res, next));
app.use('/api/bible', (req, res, next) => require('./routes/bible')(req, res, next));
app.use('/api/groups', (req, res, next) => require('./routes/groups')(req, res, next));
app.use('/api/admin', (req, res, next) => require('./routes/admin')(req, res, next));
app.use('/api/books', (req, res, next) => require('./routes/books')(req, res, next));
app.use('/api/users', (req, res, next) => require('./routes/users')(req, res, next));
app.use('/api/stats', (req, res, next) => require('./routes/stats')(req, res, next));
app.use('/api/mpesa', (req, res, next) => require('./routes/mpesa')(req, res, next));

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
        console.log(`   /api/mpesa`);
        console.log('='.repeat(60) + '\n');
    });
}

module.exports = app;

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});