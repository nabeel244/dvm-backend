const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ContactForm = require('../models/ContactForm');

const router = express.Router();

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate a JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/contact-form', async (req, res) => {
  try {
    const io = req.app.get('socketio');
      const { name, phoneNumber, email, message } = req.body;

      // Validate the form data
      if (!name || !phoneNumber || !email || !message) {
          return res.status(400).json({ message: 'All fields are required' });
      }

      // Save form data to MongoDB
      const newContactForm = new ContactForm({ name, phoneNumber, email, message });
      await newContactForm.save();

      io.emit('newContactFormNotification', {
        message: `New contact form submitted by ${name}`
    });

      res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
      console.error('Error submitting form:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

router.get('/get-contact-forms', async (req, res) => {
  try {
      const contactForms = await ContactForm.find().sort({ createdAt: -1 }); 
      res.status(200).json(contactForms);
  } catch (error) {
      console.error('Error fetching chat forms:', error);
      res.status(500).json({ message: 'Server error while fetching chat forms' });
  }
});

module.exports = router;
