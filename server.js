const express = require('express');
const connectDB = require('./config/db');
const User = require('./models/User');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const cors = require('cors');
const Message = require('./models/Message');
const Booth = require('./models/Booth');
const ChatForm = require('./models/ChatForm');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ extended: false }));

// app.use('/', async (req, res) => {
//     res.json('Dvm Backend Server is Working');
// }
// )
// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat' , require('./routes/chat'));





// Create server and initialize Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinChat', async (email) => {
        try {
            let chatForm = await ChatForm.findOne({ email });
            const chatId = chatForm.chatId;
            socket.join(chatId);

            const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).exec();
            socket.emit('chatHistory', messages);
            io.to('admin-room').emit('newChatCreated', { chatId, chatForm });
        } catch (error) {
            console.error('Error joining chat:', error);
        }
    });

    socket.on('joinAdminChat', async (chatId) => {
        try {
            socket.join(chatId);
            const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).exec();
            socket.emit('chatHistory', messages);
        } catch (error) {
            console.error('Error joining admin chat:', error);
        }
    });

    // Handling message sending
    socket.on('sendMessage', async (data) => {
        const { chatId, senderId, senderRole, message, name } = data;
        io.emit('newChatFormUserCreated', {
            message: `New Chat Message`
        });
        try {
            const newMessage = new Message({ chatId, senderId, senderRole, message, name });
            await newMessage.save();

            // Emit the message to all clients in the same chat room
            io.to(chatId).emit('receiveMessage', newMessage);
            
            // Notify admin in the 'admin-room' of the new message
            io.to('admin-room').emit('newMessageNotification', {
                messageChat: `New message from ${name}`,
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});






// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
