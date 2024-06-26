const express = require('express')
const app = express()
const path = require('path'); 
// const cors = require('cors')
// app.use(cors())
const server = require('http').createServer(app);
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp',
  secure: true, // This is your active selection, indicating you want a secure connection
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

// Start the server
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
