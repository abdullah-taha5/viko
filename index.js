const express = require('express')
const app = express()
const path = require('path'); 
// const cors = require('cors')
// app.use(cors())
const server = require('http').createServer();
const io = require('socket.io')(server, {
  pingInterval: 10000, // How many ms before sending a new ping packet (10000ms = 10s)
  pingTimeout: 5000, // How many ms without a pong packet to consider the connection closed (5000ms = 5s)
  maxHttpBufferSize: 1e8, // Maximum allowed message size
});
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {

  
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId);
    
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      
      io.to(roomId).emit('createMessage', message)
   
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});