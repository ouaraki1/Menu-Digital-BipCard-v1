const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); 

require('dotenv').config();

async function createUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const usersData = [
            {
                email: 'abdo@gmail.com',
                password: 'abdo123',
                role: 'admin',
                name: 'Abdo Admin',
            },
            {
                email: 'souly@outlook.com',
                password: 'souly123',
                role: 'kitchen',
                name: 'Souly Kitchen',
            },
            {
                email: 'amina@outlook.com',
                password: 'amina123',
                role: 'kitchen',
                name: 'amina Kitchen',
            },{
                email: 'oussama@outlook.com',
                password: 'oussama123',
                role: 'admin',
                name: 'oussama Admin',
            }
        ];

        for (const userData of usersData) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.email} already exists, skipping...`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                name: userData.name,
            });

            await user.save();
            console.log(`User ${user.email} created successfully`);
        }

        mongoose.disconnect();
        console.log('✅ All done, disconnected from MongoDB');
    } catch (error) {
        console.error('Error creating users:', error);
        process.exit(1);
    }
}

createUsers();
