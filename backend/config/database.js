const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
    // Production: Always use PostgreSQL from the URL
    console.log('Connecting to PostgreSQL...');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else if (process.env.NODE_ENV !== 'production') {
    // Development only: Fallback to Local SQLite
    console.log('Using SQLite Local Database...');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false
    });
} else {
    // Production without DB_URL: Critical Error
    throw new Error('DATABASE_URL environment variable is missing in production!');
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        const isPostgres = sequelize.getDialect() === 'postgres';
        console.log(`${isPostgres ? 'Supabase PostgreSQL' : 'SQLite'} Connected successfully.`);
        
        // Sync models
        // CRITICAL for Vercel: NEVER sync or seed on every cold start in production.
        // This causes timeouts and "Function Invocation Failed" errors.
        const shouldSync = process.env.SYNC_DB === 'true' || (process.env.NODE_ENV !== 'production' && process.env.SYNC_DB !== 'false');
        
        if (shouldSync) {
            console.log('Syncing database models...');
            await sequelize.sync({ alter: true });
            
            // Seed initial data ONLY if syncing
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

module.exports = { sequelize, connectDB };