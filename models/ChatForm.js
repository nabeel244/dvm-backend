const mongoose = require('mongoose');

// Define the ChatForm schema
const chatFormSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    chatId: { type: String, required: true }, 
}, { timestamps: true });  

// Create the ChatForm model
const ChatForm = mongoose.model('ChatForm', chatFormSchema);

module.exports = ChatForm;
