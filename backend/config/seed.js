const { StudyPlan, User } = require('../models');

const seedData = async () => {
    try {
        // ── 1. Seed Study Plans ──────────────────────────────────────────
        const plansCount = await StudyPlan.count();
        if (plansCount === 0) {
            console.log('Seeding initial study plans...');
            await StudyPlan.bulkCreate([
                {
                    title: "Foundations of Faith",
                    category: "faith",
                    difficulty: "Beginner",
                    description: "A 30-day journey through the core beliefs of Christianity, from creation to salvation.",
                    durationDays: 30,
                    color: "#4a6fa5",
                    content: []
                },
                {
                    title: "The Psalms of David",
                    category: "worship",
                    difficulty: "Intermediate",
                    description: "Explore the poetry, prayers, and praises of King David across 21 selected Psalms.",
                    durationDays: 21,
                    color: "#2a9d8f",
                    content: []
                },
                {
                    title: "The Gospel of John",
                    category: "gospel",
                    difficulty: "Intermediate",
                    description: "A deep dive into the Gospel of John — the book of believing and eternal life.",
                    durationDays: 28,
                    color: "#e9c46a",
                    content: []
                },
                {
                    title: "Prayer Life",
                    category: "prayer",
                    difficulty: "Beginner",
                    description: "Learn to pray with power through examples from Jesus and the apostles.",
                    durationDays: 14,
                    color: "#dc3545",
                    content: []
                },
                {
                    title: "Leadership in Scripture",
                    category: "leadership",
                    difficulty: "Advanced",
                    description: "Study biblical leaders like Moses, Joshua, Nehemiah, and Paul for modern lessons.",
                    durationDays: 21,
                    color: "#6c757d",
                    content: []
                },
                {
                    title: "Hope in Hard Times",
                    category: "faith",
                    difficulty: "Beginner",
                    description: "Find comfort and hope through scriptures that speak to trials and perseverance.",
                    durationDays: 14,
                    color: "#17a2b8",
                    content: []
                }
            ]);
            console.log('✅ Study plans seeded successfully.');
        }

        // ── 2. Seed Admin User ─────────────────────────────────────────────
        const userCount = await User.count();
        if (userCount === 0) {
            console.log('Seeding default admin user...');
            await User.create({
                name: 'Admin User',
                email: 'admin@scripturelight.com',
                password: 'AdminPassword123!',
                role: 'admin',
                status: 'active'
            });
            console.log('✅ Admin User created: admin@scripturelight.com / AdminPassword123!');
        } else {
            // Check if admin specifically exists
            const adminExists = await User.findOne({ where: { role: 'admin' } });
            if (!adminExists) {
                console.log('Creating admin user as none was found...');
                await User.create({
                    name: 'Admin User',
                    email: 'admin@scripturelight.com',
                    password: 'AdminPassword123!',
                    role: 'admin',
                    status: 'active'
                });
                console.log('✅ Admin User created.');
            }
        }

        console.log('Database check/seed complete.');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
};

module.exports = seedData;
