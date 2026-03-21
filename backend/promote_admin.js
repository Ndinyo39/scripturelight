const { User } = require('./models');
const { sequelize } = require('./config/database');

async function promoteAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        const email = 'admin@scripturelight.com';
        const user = await User.findOne({ where: { email } });
        
        if (user) {
            console.log(`Found user ${user.name} (${user.email}). Promoting to admin...`);
            await user.update({ role: 'admin', status: 'active' });
            console.log('✅ User promoted to admin successfully.');
        } else {
            console.log(`User with email ${email} not found. Creating it now...`);
            await User.create({
                name: 'Admin User',
                email: email,
                password: 'AdminPassword123!',
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Admin User created successfully.');
        }
    } catch (err) {
        console.error('Promotion failed:', err);
    } finally {
        process.exit();
    }
}

promoteAdmin();
