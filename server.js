const express = require('express');
const connectDB = require('./config/db');
const User = require('./models/User');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const cors = require('cors');
const Message = require('./models/Message');
const Booth = require('./models/Booth');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat' , require('./routes/chat'));



app.get('/api/active-chats', async (req, res) => {
    try {
        const activeChats = await Message.aggregate([
            { $sort: { createdAt: -1 } },  // Sort by the latest message
            { $group: {
                _id: "$chatId",
                lastMessage: { $first: "$message" },
                senderId: { $first: "$senderId" },
                senderRole: { $first: "$senderRole" }
            }}
        ]).exec();

        res.json(activeChats);
    } catch (error) {
        console.error('Error fetching active chats:', error);
        res.status(500).send('Server Error');
    }
});


// Create server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Handle Socket.IO connections
// io.on('connection', (socket) => {
//     console.log('New client connected');

//     socket.on('joinChat', async (chatId) => {
//         socket.join(chatId);
//         console.log(`Client joined chat: ${chatId}`);

//         // Fetch previous messages from the database
//         try {
//             const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).exec();
//             socket.emit('chatHistory', messages);
//         } catch (error) {
//             console.error('Error fetching chat history:', error);
//         }
//     });

//     socket.on('sendMessage', async (data) => {
//         const { chatId, senderId, senderRole, message } = data;

//         console.log('Received sendMessage event:', data);

//         try {
//             const newMessage = new Message({ chatId, senderId, senderRole, message });
//             await newMessage.save();

//             console.log('Message saved to MongoDB:', newMessage);

//             io.to(chatId).emit('receiveMessage', newMessage);
//             console.log('Message emitted to chat:', chatId);
//         } catch (error) {
//             console.error('Error saving message or emitting event:', error);
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('Client disconnected');
//     });
// });

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinChat', async (chatId) => {
        socket.join(chatId);
        console.log(`Client joined chat: ${chatId}`);

        // Fetch previous messages from the database
        try {
            const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).exec();
            socket.emit('chatHistory', messages);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    });

    socket.on('sendMessage', async (data) => {
        const { chatId, senderId, senderRole, message, name } = data;

        console.log('Received sendMessage event:', data);

        try {
            // Save the message along with the sender's name
            const newMessage = new Message({ chatId, senderId, senderRole, message, name });
            await newMessage.save();

            console.log('Message saved to MongoDB:', newMessage);

            // Emit the message to all clients in the chat room, including the name
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
