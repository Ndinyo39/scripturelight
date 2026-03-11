const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
    // Priority: PostgreSQL/Supabase if URL provided
    console.log('Using PostgreSQL Database...');
    
    // Some passwords might have special chars like @, we should ensure the URL is handled correctly
    // If Sequelize has trouble with the raw URL, we can parse it
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        sequelize = new Sequelize(dbUrl.pathname.split('/')[1], dbUrl.username, decodeURIComponent(dbUrl.password), {
            host: dbUrl.hostname,
            port: dbUrl.port,
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
    } catch (e) {
        // Fallback to direct URL if URL parsing fails
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
    }
} else {
    // Fallback: Local SQLite
    console.log('Using SQLite Local Database...');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        const isPostgres = sequelize.getDialect() === 'postgres';
        console.log(`${isPostgres ? 'Supabase PostgreSQL' : 'SQLite'} Connected successfully.`);
        
        // Sync models
        // In serverless, we only sync if we are in development or if a forced sync variable is true
        // This prevents multiple heavy operations on every cold start
        if (process.env.NODE_ENV !== 'production' || process.env.SYNC_DB === 'true') {
            await sequelize.sync({ alter: true });
            console.log('Database models synced');

            // Seed initial data
            const seedData = require('./seed');
            await seedData();
        }
    } catch (error) {
        console.error('Database connection error:', error.message);
        // Don't process.exit(1) in a serverless environment as it causes a 500 error
        // instead just throw the error so the request handler can catch it
        throw error;
    }
};

module.exports = { sequelize, connectDB };