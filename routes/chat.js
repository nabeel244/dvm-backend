// routes/chat.js
const express = require('express');
const Booth = require('../models/Booth');
const router = express.Router();

// Endpoint to save booth history
router.post('/saveboothistory', async (req, res) => {
    try {
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

module.exports = router;
