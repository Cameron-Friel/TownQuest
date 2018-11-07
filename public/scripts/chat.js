var socket = io();

$(() => {
  let user = '';

  $('form').submit(() => {
    socket.emit('chat message', $('#message').val());
    $('#message').val('');
    return false;
  });

  socket.on('chat message', (msg) => {
    $('#messages').append($('<li>').text(msg));
  });

  socket.on('set username', (username) => {
    user = username;
    $('#messages').append($('<li>').text('Username set as: ' + username + '.'));
  });

  socket.on('incorrect command', (msg) => {
    $('#messages').append($('<li>').text(msg));
  });

  socket.on('incorrect message', (msg) => {
    $('#messages').append($('<li>').text(msg));
  });
});
