var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

let chatters = {}; // object of all users in the chatroom

app.use("/public", express.static(__dirname + "/public"));

app.get('/', (req, res) => { // launch screen
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/chat', (req, res) => { // chatroom
  if (Object.keys(chatters).length >= 3) { // the lobby is full after 3 players
    res.sendFile(__dirname + '/public/full.html');
  }
  else {
    res.sendFile(__dirname + '/public/chat.html');
  }
});

app.get('*', (req, res) => { // user did not enter a valid path
  res.sendFile(__dirname, '/public/404.html');
});

io.on('connection', (socket) => {
  console.log('Connected user: ' + socket.id);

  io.emit('player connected', socket.id, 352, 1216);

  chatters[socket.id] = {
    userId: socket.id,
    username: '',
    x: 352,
    y: 1216,
    movement: 'still',
    velocityX: 0,
    velocityY: 0,
    prevVelocityX: 0,
    prevVelocityY: 0,
  };

  socket.on('chat message', (msg) => {
    if (chatters[socket.id].username === '' && msg.indexOf('!username') === -1) { // username not set yet
      socket.emit('incorrect message', 'You have not set a username yet and therefore cannot chat. Type !username <username> in order to begin chatting!');
    }
    else if (msg.charAt(0) === '!') { // command entered
      if (msg.indexOf('!username') !== -1 && msg.indexOf('!username') === 0) { // check for username command
        chatters[socket.id].username = msg.substring('!username'.length); // save user's username to server
        socket.emit('set username', chatters[socket.id].username); // confirm username set to client
        socket.broadcast.emit('chat message', chatters[socket.id].username + ' has entered the chat room.'); // notify all clients new user joined
      }
      else if (msg.indexOf('!help') !== -1 && msg.indexOf('!help') === 0) { // check for help command
        socket.emit('chat message', 'The help command is unavailable right now. Sorry!');
      }
      else { // command was incorrectly formatted
        socket.emit('incorrect command', 'The command you entered is not correctly used. Type <!help> to see the list of commands.');
      }
    }
    else { // chat message entered
      io.emit('chat message', chatters[socket.id].username + ': ' + msg);
    }
  });

  socket.on('request players', () => {
    socket.emit('players', chatters);
  });

  socket.on('player state', (x, y, cursors, velocity) => {
    const speed = 175;

    chatters[socket.id].x = x;
    chatters[socket.id].y = y;

    chatters[socket.id].prevVelocityX = chatters[socket.id].velocityX;
    chatters[socket.id].prevVelocityY = chatters[socket.id].velocityY;

    chatters[socket.id].velocityX = 0;
    chatters[socket.id].velocityY = 0;

    // Horizontal movement
    if (cursors.left.isDown) {
      chatters[socket.id].velocityX = -speed;
    }
    else if (cursors.right.isDown) {
      chatters[socket.id].velocityX = speed;
    }

    // Vertical movement
    if (cursors.up.isDown) {
      chatters[socket.id].velocityY = -speed;
    }
    else if (cursors.down.isDown) {
      chatters[socket.id].velocityY = speed;
    }

    if (cursors.left.isDown) {
      chatters[socket.id].movement = 'left';
    }
    else if (cursors.right.isDown) {
      chatters[socket.id].movement = 'right';
    }
    else if (cursors.up.isDown) {
      chatters[socket.id].movement = 'up';
    }
    else if (cursors.down.isDown) {
      chatters[socket.id].movement = 'down';
    }
    else {
      chatters[socket.id].movement = 'still';
    }
  });

  setInterval(() => {
    io.emit('game state', chatters);
  }, 1000 / 60);

  socket.on('disconnect', () => { // user disconnected
    if (chatters[socket.id].username !== '') {
      socket.broadcast.emit('chat message', chatters[socket.id].username + ' has left the chat room.');
    }
    socket.broadcast.emit('player disconnected', socket.id);
    delete chatters[socket.id]; // free disconnected user from server's list
  });
});

http.listen(3000, () => {
  console.log('Server is listening on port 3000.');
});
