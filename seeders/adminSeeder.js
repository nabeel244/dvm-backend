const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Check if an admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists. No new admin will be created.');
    } else {
      const admin = new User({
        username: 'admin',
        password: 'admin123', 
        role: 'admin',
      });
      await admin.save();
      console.log('Admin user created');
    }
    process.exit();
  } catch (err) {
    console.error('Error checking or creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
