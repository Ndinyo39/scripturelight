const { User } = require('./models');
const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

async function addCustomAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        const email = 'ndinyodouglas5@gmail.com';
        const password = 'Ndinyo@39';
        const name = 'Douglas Ndinyo';
        
        let user = await User.findOne({ where: { email } });
        
        if (user) {
            console.log(`Found user ${user.name} (${user.email}). Promoting to admin and updating password...`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await user.update({ 
                role: 'admin', 
                status: 'active',
                password: hashedPassword
            });
            console.log('✅ User promoted and password updated successfully.');
        } else {
            console.log(`User with email ${email} not found. Creating it now...`);
            await User.create({
                name: name,
                email: email,
                password: password, // The model hook should hash this, but let's be safe if it doesn't
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Custom Admin User created successfully.');
        }
    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        process.exit();
    }
}

addCustomAdmin();
