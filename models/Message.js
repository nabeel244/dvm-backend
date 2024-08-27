// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: String,
    senderId: String,
    senderRole: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
