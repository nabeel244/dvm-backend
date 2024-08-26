const express = require('express');
const connectDB = require('./config/db');
const User = require('./models/User');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const cors = require('cors');
const Message = require('./models/Message');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));



// Create server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`Client joined chat: ${chatId}`);
    });

    socket.on('sendMessage', async (data) => {
        const { chatId, sender, message } = data;

        console.log('Received sendMessage event:', data);

        try {
            const newMessage = new Message({ chatId, sender, message });
            await newMessage.save();

            console.log('Message saved to MongoDB:', newMessage);

            io.to(chatId).emit('receiveMessage', newMessage);
            console.log('Message emitted to chat:', chatId);
        } catch (error) {
            console.error('Error saving message or emitting event:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});


// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
