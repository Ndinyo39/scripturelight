const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize = null;
let initError = null;

const initSequelize = () => {
    try {
        // AGGRESSIVE Cleanup of default PG environment variables to prevent driver interference
        const pgVars = ['DATABASE_URL', 'PGPORT', 'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'];
        if (process.env.NODE_ENV !== 'production') {
            pgVars.forEach(v => delete process.env[v]);
        }

        // STRATEGIC FIX: Force SQLite unless we are EXACTLY in production mode
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Re-read after potential deletion
        let dbUrlStr = (isProduction && process.env.DATABASE_URL) 
            ? process.env.DATABASE_URL.trim() 
            : null;
        
        if (!isProduction) dbUrlStr = null;

        if (dbUrlStr) {
            console.log('Production Database detected, configuring PostgreSQL components...');
            const pg = require('pg'); // Lazy load
            const dbUrl = dbUrlStr.replace(/[\\"']+/g, '').trim();
            const u = new URL(dbUrl);
            const dbName = u.pathname.substring(1);
            const dbUser = u.username;
            const dbPass = decodeURIComponent(u.password);
            const dbHost = u.hostname;
            const dbPort = parseInt(u.port || '5432', 10);

            // Double ensure they are gone from the environment for this process
            pgVars.forEach(v => delete process.env[v]);

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
        
        const shouldSync = String(process.env.SYNC_DB).trim() === 'true' || (process.env.NODE_ENV !== 'production' && String(process.env.SYNC_DB).trim() !== 'false');
        if (shouldSync) {
            console.log('Syncing database models...');
            require('../models'); // Ensure models are registered BEFORE sync
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