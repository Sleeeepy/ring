'use strict';

module.exports.register = function(socket){

  // convenience function to log server messages to the client
    function log(){
      var array = ['>>> Message from server: '];
      for (var i = 0; i < arguments.length; i++) {
        array.push(arguments[i]);
      }
        socket.emit('log', array);
    }
    socket.on('signal',function(data){
      socket.broadcast.emit('signal',data);
    });
    socket.on('message', function (message) {
      console.log('signal ', socket.id);
      log('Got message:', message);
      // for a real app, would be room only (not broadcast)
      socket.broadcast.emit('message', message);
      console.log('clients:' )
    });

    socket.on('create or join', function (room) {
      var numClients = io.sockets.clients(room).length;

      log('Room ' + room + ' has ' + numClients + ' client(s)');
      log('Request to create or join room ' + room);

      if (numClients === 0){
        socket.join(room);
        socket.emit('created', room);
      } else if (numClients === 1) {
        io.sockets.in(room).emit('join', room);
        socket.join(room);
        socket.emit('joined', room);
      } else { // max two clients
        socket.emit('full', room);
      }
      socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
      socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

    });


}
