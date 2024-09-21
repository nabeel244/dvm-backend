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

app.get('/api/active-chats', async (req, res) => {
    try {
        const activeChats = await Message.aggregate([
            // Stage 1: Get the most recent message per chatId
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: "$chatId",
                lastMessage: { $first: "$message" },
                senderId: { $first: "$senderId" },
                senderRole: { $first: "$senderRole" },
                createdAt: { $first: "$createdAt" },
                name: { $first: "$name" }  // Get name from the most recent message
            }},
            
            // Stage 2: Get the name from any user message in the group if the name is missing
            {
                $lookup: {
                    from: 'messages', // Assuming the same collection name as 'Message'
                    let: { chatId: "$_id" },
                    pipeline: [
                        { $match: {
                            $expr: { $and: [
                                { $eq: ["$chatId", "$$chatId"] },
                                { $ne: ["$senderRole", "admin"] } // Exclude admin messages
                            ]}
                        }},
                        { $project: { name: 1 } }, // Project only the name field
                        { $limit: 1 } // Take any one message if available
                    ],
                    as: 'userMessages'
                }
            },
            
            // Stage 3: Use the name from user messages if the current name is null
            { $addFields: {
                name: {
                    $ifNull: [
                        "$name",
                        { $arrayElemAt: ["$userMessages.name", 0] } // Use name from user message
                    ]
                }
            }},
            
            // Stage 4: Final sort by the latest message
            { $sort: { createdAt: -1 } }
        ]).exec();
        res.json(activeChats);
    } catch (error) {
        console.error('Error fetching active chats:', error);
        res.status(500).send('Server Error');
    }
});





// app.get('/api/active-chats', async (req, res) => {
//     try {
//         const activeChats = await Message.aggregate([
//             { $sort: { createdAt: -1 } },  // Sort by the latest message
//             { $group: {
//                 _id: "$chatId",
//                 lastMessage: { $first: "$message" },
//                 senderId: { $first: "$senderId" },
//                 senderRole: { $first: "$senderRole" },
//                 createdAt: { $first: "$createdAt" } 
//             }}
//         ]).exec();
//         console.log(activeChats, 'active chats')
//         res.json(activeChats);
//     } catch (error) {
//         console.error('Error fetching active chats:', error);
//         res.status(500).send('Server Error');
//     }
// });


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





// io.on('connection', (socket) => {
//     console.log('New client connected');

//     // User joins the chat by email
//     socket.on('joinChat', async (email) => {
//         try {
//             // Find chat form by user email
//             let chatForm = await ChatForm.findOne({ email });
//             if (!chatForm) {
//                 return socket.emit('error', 'Chat form not found');
//             }
//             const chatId = chatForm.chatId;

//             // User joins the chat room
//             socket.join(chatId);

//             // Fetch and emit chat history to the user
//             const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).exec();
//             socket.emit('chatHistory', messages);

//             // Notify the admin room about the new chat
//             io.to('admin-room').emit('newChatCreated', { chatId, chatForm });
//         } catch (error) {
//             console.error('Error joining chat:', error);
//             socket.emit('error', 'Error joining chat');
//         }
//     });

//     // Admin joins a specific chat by chatId
//     socket.on('joinAdminChat', async (chatId, callback) => {
//         try {
//             // Admin joins the specific chat room
//             socket.join(chatId);

//             // Fetch and send chat history to the admin
//             const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).exec();
//             socket.emit('chatHistory', messages);

//             // Acknowledge to the frontend that the admin has successfully joined
//             if (callback) callback('joined');
//         } catch (error) {
//             console.error('Error joining admin chat:', error);
//             if (callback) callback('error');
//         }
//     });

//     // Handle message sending
//     socket.on('sendMessage', async (data) => {
//         const { chatId, senderId, senderRole, message, name } = data;

//         try {
//             // Create and save the new message
//             const newMessage = new Message({ chatId, senderId, senderRole, message, name });
//             await newMessage.save();

//             // Emit the message to all clients in the chat room
//             io.to(chatId).emit('receiveMessage', newMessage);
            
//             // Notify admin in the 'admin-room' of the new message
//             io.to('admin-room').emit('newMessageNotification', {
//                 messageChat: `New message from ${name}`,
//             });
//         } catch (error) {
//             console.error('Error sending message:', error);
//             socket.emit('error', 'Error sending message');
//         }
//     });

//     // Handle user disconnection
//     socket.on('disconnect', () => {
//         console.log('Client disconnected');
//     });
// });




// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
