// models/BoothHistory.js
const mongoose = require('mongoose');

const BoothHistorySchema = new mongoose.Schema({
    messages: [
        {
            text: { type: String },
            type: { type: String },
            question: { type: String },
            answer: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Booth', BoothHistorySchema);



