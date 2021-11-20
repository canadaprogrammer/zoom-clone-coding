import http from 'http';
import WebSocket from 'ws';
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

const wss = new WebSocket.Server({ server });
// const wss = new WebSocket.Server(); // if you want to handle ws on the different port

const sockets = [];

// listen to connect WebSocket on the server
wss.on('connection', (socket) => {
  sockets.push(socket);
  socket['nickname'] = 'Anonymous';
  console.log('Connected to the Browser');
  socket.on('close', () => console.log('Disconnected form the Browser'));
  // socket.send('hello');
  socket.on('message', (msg) => {
    // socket.send(msg.toString('utf8'));

    const message = JSON.parse(msg.toString('utf8'));
    // send a message to all of the connected browser
    switch (message.type) {
      case 'message':
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
        );
        break;
      case 'nickname':
        socket['nickname'] = message.payload;
        break;
    }
  });
});
