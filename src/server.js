import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);

// http and websocket on the same server
// localhost can handle http, ws request on the same port.
const server = http.createServer(app);
const io = SocketIO(server);

const publicRooms = () => {
  // const sids = io.sockets.adapter.sids;
  // const rooms = io.sockets.adapter.rooms;
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

io.on('connection', (socket) => {
  // socket['nickname'] = 'Anonymous';
  socket.onAny((event) => {
    console.log(io.sockets.adapter);
    console.log(`Socket Event:${event}`); // Socket Event:enter_room
  });
  socket.on('enter_room', (roomName, nickname, done) => {
    socket['nickname'] = nickname;
    socket.join(roomName);
    done();
    // send a message to one socket
    socket.to(roomName).emit('welcome', socket['nickname']);
    // send a message to all sockets
    io.sockets.emit('room_change', publicRooms());
  });
  // disconnecting
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit('bye', socket['nickname'])
    );
  });
  socket.on('disconnect', () => {
    io.sockets.emit('room_change', publicRooms());
  });
  // socket.on('nickname', (nickname) => (socket['nickname'] = nickname));
  socket.on('new_message', (message, room, done) => {
    socket.to(room).emit('new_message', message, socket['nickname']);
    done();
  });
});
server.listen(3000, handleListen);
