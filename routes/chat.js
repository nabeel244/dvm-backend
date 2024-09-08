// routes/chat.js
const express = require('express');
const Booth = require('../models/Booth');
const ChatForm = require('../models/ChatForm');
const router = express.Router();

// Endpoint to save booth history
router.post('/saveboothistory', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        let { messages } = req.body;

        // Process messages to ensure each one has a consistent format
        messages = messages.map(msg => {
            if (msg.question && msg.answer) {
                return {
                    question: msg.question,
                    answer: msg.answer,
                    timestamp: new Date()
                };
            } else {
                return {
                    text: msg.text,
                    type: msg.type,
                    timestamp: new Date()
                };
            }
        });

        // Create a new booth history entry
        const boothHistory = new Booth({
            messages,
        });

        // Save to the database
        await boothHistory.save();
        io.emit('newSupportBotNotification', {
            message: `New Support Bot Message received!`
        });
        res.status(201).json({ msg: 'Booth history saved successfully' });
    } catch (error) {
        console.error('Error saving booth history:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});



router.get('/getboothistory', async (req, res) => {
    try {
        const boothHistories = await Booth.find();
        res.status(200).json(boothHistories);
    } catch (error) {
        console.error('Error fetching booth history:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

router.post('/save-chat-form', async (req, res) => {
    try {
        const io = req.app.get('socketio');
        const { firstName, lastName, phoneNumber, email, chatId } = req.body;

        // Check if the form data is valid
        if (!firstName || !lastName || !phoneNumber || !email || !chatId) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const newChatForm = new ChatForm({ firstName, lastName, phoneNumber, email, chatId });
        await newChatForm.save();
        io.emit('newChatFormNotification', {
            message: `New Chat form submitted by ${firstName}`
        });

        res.status(200).json({ message: 'Chat form information saved successfully' });
    } catch (error) {
        console.error('Error saving chat form information:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/get-chat-forms', async (req, res) => {
    try {
        // Fetch all chat forms from the database
        const chatForms = await ChatForm.find().sort({ createdAt: -1 }); // Sort by newest first
        res.status(200).json(chatForms);
    } catch (error) {
        console.error('Error fetching chat forms:', error);
        res.status(500).json({ message: 'Server error while fetching chat forms' });
    }
});


module.exports = router;
