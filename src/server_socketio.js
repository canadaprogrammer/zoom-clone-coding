import http from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
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
const io = new Server(server, {
  cors: {
    origin: ['https://admin.socket.io'],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

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

const countRoom = (room) => {
  return io.sockets.adapter.rooms.get(room)?.size;
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
    done(countRoom(roomName));
    // send a message to one socket
    socket
      .to(roomName)
      .emit('welcome', socket['nickname'], countRoom(roomName));
    // send a message to all sockets
    io.sockets.emit('room_change', publicRooms());
  });
  // disconnecting
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit('bye', socket['nickname'], countRoom(room) - 1)
    );
  });
  socket.on('disconnect', () => io.sockets.emit('room_change', publicRooms()));
  // socket.on('nickname', (nickname) => (socket['nickname'] = nickname));
  socket.on('new_message', (message, room, done) => {
    socket.to(room).emit('new_message', message, socket['nickname']);
    done();
  });
});
server.listen(3000, handleListen);
