const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');

// Create the HTTP server
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
  path: '/socket.io',
  cors: {
    origin: "*", // Adjust as necessary for security
    methods: ["GET", "POST"]
  }
});

// Configure PeerServer
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp',
  secure: true // This ensures that the connection is secure
});

// Set view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Use the PeerServer middleware
app.use('/peerjs', peerServer);

// Route for generating unique room IDs
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// Route for rendering the room view
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

// Socket.IO connection handler
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    // Handle messages
    socket.on('message', message => {
      io.to(roomId).emit('createMessage', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
