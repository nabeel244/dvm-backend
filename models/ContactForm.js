const mongoose = require('mongoose');

// Define the ContactForm schema
const contactFormSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }  
});

// Create the ContactForm model
const ContactForm = mongoose.model('ContactForm', contactFormSchema);

module.exports = ContactForm;
