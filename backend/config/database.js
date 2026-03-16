const { Sequelize } = require('sequelize');
const path = require('path');
const pg = require('pg');

let sequelize = null;
let initError = null;

const initSequelize = () => {
    try {
        let dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : null;
        
        // Aggressively strip ALL backslashes, quotes, or whitespace
        if (dbUrl) {
            dbUrl = dbUrl.replace(/[\\"']+/g, '').trim();
        }

        if (dbUrl) {
            console.log('Database URL detected, initializing Sequelize components manually...');
            const u = new URL(dbUrl);
            const dbName = u.pathname.substring(1);
            const dbUser = u.username;
            const dbPass = decodeURIComponent(u.password);
            const dbHost = u.hostname;
            const dbPort = parseInt(u.port || '5432', 10);

            // CRITICAL: Delete the environment variable after parsing it!
            // This prevents the 'pg' driver from seeing it and trying its own (buggy) parsing.
            delete process.env.DATABASE_URL;
            delete process.env.PGPORT;
            delete process.env.PGHOST;
            delete process.env.PGUSER;
            delete process.env.PGPASSWORD;
            delete process.env.PGDATABASE;

            sequelize = new Sequelize(dbName, dbUser, dbPass, {
                host: dbHost,
                port: dbPort,
                dialect: 'postgres',
                dialectModule: pg,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                },
                logging: false,
                pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
            });
            return sequelize;
        } else if (process.env.NODE_ENV !== 'production') {
            console.log('Using SQLite for development...');
            sequelize = new Sequelize({
                dialect: 'sqlite',
                storage: path.join(__dirname, '../database.sqlite'),
                logging: false
            });
            return sequelize;
        } else {
            throw new Error('DATABASE_URL is missing in production!');
        }
    } catch (err) {
        initError = err.message;
        console.error('CRITICAL: Database initialization failed:', err.message);
        return null;
    }
};

// Start initialization immediately
sequelize = initSequelize();

const connectDB = async () => {
    if (!sequelize) {
        throw new Error(initError || 'Sequelize was not initialized. Check your DATABASE_URL environment variable.');
    }
    
    try {
        await sequelize.authenticate();
        const isPostgres = sequelize.getDialect() === 'postgres';
        console.log(`${isPostgres ? 'Supabase PostgreSQL' : 'SQLite'} Connected successfully.`);
        
        const shouldSync = process.env.SYNC_DB === 'true' || (process.env.NODE_ENV !== 'production' && process.env.SYNC_DB !== 'false');
        if (shouldSync) {
            console.log('Syncing database models...');
            await sequelize.sync({ alter: true });
            try {
                const seedData = require('./seed');
                await seedData();
                console.log('Database seeded.');
            } catch (seedErr) {
                console.log('Seeding skipped or failed:', seedErr.message);
            }
        }
    } catch (error) {
        console.error('Database connection error:', error.message);
        throw error;
    }
};

module.exports = { sequelize, connectDB, getInitError: () => initError };