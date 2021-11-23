# Noom - Zoom Clone Coding

- Zoom clone using NodeJS, WebRTC and Websocket.

## Server Setup

- ```bash
  npm init -y
  npm i nodemon -D
  touch babel.config.json nodemon.json
  mkdir src
  touch src/server.js
  npm i @babel/core @babel/cli @babel/node -D
  npm i @babel/preset-evn -D
  npm i express
  npm i pug # one of popular template engine working with Express
  ```
- nodemon.json
  - ```json
    {
      "exec": "babel-node src/server.js"
    }
    ```
    - This returned an error: `'babel-node' is not recognized as an internal or external command`
    - Solution 1: Use absolute path on nodemon.json. `"exec": "node_modules/.bin/babel-node src/server.js"`
    - Solution 2: Install babel-node global, not dev. `npm i -g @babel/node`
- babel.config.json
  - ```json
    {
      "presets": ["@babel/preset-env"]
    }
    ```
- modify package.json
  - ```json
    {
      "name": "zoom",
      "version": "1.0.0",
      "description": "Zoom clone using NodeJS, WebRTC and Websocket",
      "license": "MIT",
      "scripts": {
        "dev": "nodemon"
      },
      "devDependencies": {
        "@babel/cli": "^7.16.0",
        "@babel/core": "^7.16.0",
        "@babel/node": "^7.16.0",
        "@babel/preset-env": "^7.16.0",
        "nodemon": "^2.0.15"
      },
      "dependencies": {
        "express": "^4.17.1",
        "pug": "^3.0.2"
      }
    }
    ```
- server.js
  - ```js
    import express from 'express';
    const app = express();
    const handleListen = () =>
      console.log(`Listening on http://localhost:3000`);
    app.listen(3000, handleListen);
    ```
- test
  - `npm run dev`

## Front-End Setup

- app.js on /src/public/js/app.js

  - Files on public folder will be executed on the Front-End.
  - server.js runs on the Back-End, app.js runs on the Front-End.

- Add ignore on nodemon.json for preventing to restart nodemon
  `"ignore": ["src/public/*"],`

- Home view on /src/views/home.pug

  - ```html5
    doctype html
    html(lang="en")
      head
        meta(charset="UTF-8")
        meta(http-equiv="X-UA-Compatible", content="IE=edge")
        meta(name="viewport", content="width=device-width, initial-scale=1.0")
        title Noom
        link(rel="stylesheet", href="https://unpkg.com/mvp.css")
      body
        header
          h1 Noom
        main
          ul
          form#message
            input(type="text", placeholder="Write a message", required)
            button Send
        script(src="/public/js/app.js")
    ```

- Set server.js to use view and js
  - ```js
    app.set('views', __dirname + '/views'); // set views
    app.use('/public', express.static(__dirname + '/public')); // use public, user can see
    app.get('/', (req, res) => res.render('home')); // rendering home view
    app.get('/*', (req, res) => res.redirect('/')); // redirect all urls to the root. we can hide and show
    ```

## Chat with WebSockets

- A WebSocket is a persistent connection between a client and server. WebSockets provide a bidirectional, full-duplex communications channel that operates over HTTP through a single TCP/IP socket connection.

### Connect WebSocket

- connect WebSocket on the server on `server.js`

  - ```js
    import http from 'http';
    import WebSocket from 'ws';

    const handleListen = () =>
      console.log(`Listening on http://localhost:3000`);
    // app.listen(3000, handleListen);

    // http and websocket on the same server
    // localhost can handle http, ws request on the same port.
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });
    // const wss = new WebSocket.Server(); // if you want to handle ws on the different port

    server.listen(3000, handleListen);
    ```

- connect URL on `app.js`

  - `new WebSocket(url [, protocols]);`

  - ```js
    const socket = new WebSocket(`ws://${window.location.host}`);

    const messageList = document.querySelector('ul');
    const messageForm = document.querySelector('form#message');
    ```

### Listening to the connection and WebSocket message

- on `app.js`
  - ```js
    socket.addEventListener('open', () => {
      console.log('Connected to the Server');
    });
    socket.addEventListener('close', () => {
      console.log('Disconnected from the Server');
    });
    socket.addEventListener('message', (message) => {
      const li = document.createElement('li');
      messageList.appendChild(li);
      li.innerText = message.data;
    });
    messageForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = messageForm.querySelector('input');
      socket.send(input.value);
      input.value = '';
    });
    ```
- on `server.js`
  - ```js
    wss.on('connection', (socket) => {
      console.log('Connected to the Browser');
      socket.on('close', () => console.log('Disconnected form the Browser'));
      socket.on('message', (message) => {
        socket.send(message.toString('utf8'));
      });
    });
    ```

### Send message to all connected browsers

- Save connected sockets and send the message back to all of the sockets on `server.js`

  - ```js
    const sockets = [];

    wss.on('connection', (socket) => {
      sockets.push(socket);
      socket.on('message', (message) => {
        sockets.forEach((aSocket) => aSocket.send(message.toString('utf8')));
      });
    });
    ```

### Message with the Nickname

- Add nickname form on `home.pug`

  - ```html5
    form#nickname
      input(type="text", placeholder="Choose a nickname")
      button Save
    ```

- Object
  - ```js
    {
      type: 'nickname',
      payload: input.value,
    },
    {
      type: 'message',
      payload: input.value,
    }
    ```
- Send the object as JSON to server on `app.js`

  - ```js
    const nicknameForm = document.querySelector('form#nickname');

    const makeMessage = (type, payload) => {
      const msg = { type, payload };
      return JSON.stringify(msg);
    };

    nicknameForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = nicknameForm.querySelector('input');
      socket.send(makeMessage('nickname', input.value));
      input.value = '';
    });
    ```

- Receive the JSON and send it back to all connected browsers on `server.js`

  - Save the nickname to the socket
  - ```js
    wss.on('connection', (socket) => {
      sockets.push(socket);
      socket['nickname'] = 'Anonymous';

      socket.on('message', (msg) => {
        const message = JSON.parse(msg.toString('utf8'));

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
    ```

## Socket.IO

- Socket.IO is a library that enables real-time, bidirectional and event-based communication between the browser and the server.
- The client will try to establish a WebSocket connection if possible, and will fall back on HTTP long polling if not.
  - Long poling is a technique where the server elects to hold a client's connection open for as long as possible, delivering a response only after data becomes available or a timeout threshold is reached.

### Install Socket.IO

- `npm i socket.io`

  - Socket.IO was installed on a browser as well as on a server.
  - `http://localhost:3000/socket.io/socket.io.js`

- on `server.js`

  - ```js
    import SocketIO from 'socket.io';

    const io = SocketIO(server);
    io.on('connection', (socket) => {
      console.log(socket);
    });
    ```

- on `home.pug`
  - ```html5
    script(src="/socket.io/socket.io.js)
    script(src="/public/js/app.js")
    ```
- on `app.js`
  - ```js
    const socket = io();
    ```

### Emitting events

- You can emit events on one side and register listeners on the other.
- You can send any number of arguments, and all serializable datastructures are supported, including binary objects like Buffer or TypedArray

  - ```js
    // server-side
    io.on('connection', (socket) => {
      socket.emit('event_name', 'world');
    });

    // client-side
    socket.on('event_name', (arg) => {
      console.log(arg); // 'world'
    });
    ```

  - ```js
    // server-side
    io.on('connection', (socket) => {
      socket.on('event_name', (arg1, arg2, arg3) => {
        console.log(arg1); // 1
        console.log(arg2); // '2'
        console.log(arg3); // { 3: '4', 5: ArrayBuffer (1) [ 6 ] }
      });
    });

    // client-side
    socket.emit('event_name', 1, '2', { 3: '4', 5: Buffer.from([6]) });
    ```

- You can add a callback as **the last argument** of the `emit()`, and this callback will be called once the other side acknowledges the event

  - ```js
    // server-side
    io.on('connection', (socket) => {
      socket.on('enter_room', (msg, callback) => {
        console.log(msg); // { payload: 'room name' }
        callback({
          status: 'ok',
        });
      });
    });

    // client-size
    socket.emit('enter_room', { payload: input.value }, (response) => {
      console.log(response.status); // 'ok'
    });
    ```

  - ```js
    // server-side
    io.on('connection', (socket) => {
      socket.on('enter_room', (msg, done) => {
        console.log(msg);
        setTimeout(() => {
          done('hello from the backend');
        }, 3000);
      });
    });

    // client-size
    socket.emit('enter_room', { payload: input.value }, (msg) => {
      console.log('The backend say: ', msg);
    });
    ```

### Server API

- socket.id

  - (String) A unique identifier for the session, that comes from the underlying Client.

- socket.rooms

  - (Set) A Set of strings identifying the rooms this client is in.

- socket.emit(eventName[, ...arg][, ack])

  - Emits an event to the socket identified by the string name. Any other parameters can be included. All serializable datastructures are supported, including `Buffer`.
  - (overrides `EventEmitter.emit`)
  - Returns `true`
  - `eventName` (String)
  - `args`
  - `ack` (Function)

    - `ack` will be called with the client's answer or the server's.
    - If socket.on doesn't have its callback on the other side, `ack` won't be called.

    ```js
    // server-side
    socket.on('new_message', (message, room) => {
      // no callback fn.
      socket.to(room).emit('new_message', message);
    });

    // client-side
    socket.emit('new_message', message, roomName, () => {
      // `ack` won't be called.
      printMessage(`You: ${message}`);
    });
    ```

    ```js
    // server-side
    socket.on('new_message', (message, room, done) => {
      // done is the callback fn.
      socket.to(room).emit('new_message', message);
      done();
    });

    // client-side
    socket.emit('new_message', message, roomName, () => {
      // `ack` will be called.
      printMessage(`You: ${message}`);
    });
    ```

- socket.on(eventName, callback)

  - Register a new handler for the given event.
  - (inherited from `EventEmitter`)
  - Returns `Socket`
  - `eventName` (String)
  - `callback` (Function)

- socket.onAny(callback)

  - Register a new catch-all listener

- socket.join(room)

  - Adds the socket to the given `room` or to the list of rooms.
  - Returns `void` | `Promise`
  - `room` (string) | (string[])

- socket.to(room)

  - Sets a modifier for a subsequent event emission that the event will only be broadcast to clients that have joined the given `room` (the socket itself being excluded).
  - To emit to multiple rooms, you can call `to` several times
  - Returns `Socket` for chaining.
  - `room` (string) | (string[])

- Event: 'disconnecting'

  - Fired when the client is going to be disconnected (but hasn't left its `rooms` yet).
  - `reason` (String) the reason of the disconnection (either client or server-side)

  - ```js
    // server-side
    io.on('connection', (socket) => {
      socket.onAny((event) => {
        console.log(`Socket Event:${event}`); // Socket Event:enter_room
      });
      socket.on('enter_room', (roomName, done) => {
        console.log(socket.rooms); // Set { <socket.id> }
        socket.join(roomName);
        console.log(socket.rooms); // Set { <socket.id>, { payload: 'room1' } }
        setTimeout(() => {
          done('Hello from the backend');
        }, 3000);
        socket.to(roomName).emit('welcome'); // sending socket didn't get 'welcome' message
      });
    });

    // client-side
    socket.on('welcome', () => {
      const ul = room.querySelector('ul');
      const li = document.createElement('li');
      li.innerText = 'Someone joined!'; // The other browsers can see this message
      ul.appendChild(li);
    });
    ```

### Room, Nickname, Chat

    - ```js
    // server-side
    io.on('connection', (socket) => {
      socket.onAny((event) => {
        console.log(`Socket Event:${event}`); // Socket Event:enter_room
      });
      socket.on('enter_room', (roomName, nickname, done) => {
        console.log(socket.rooms); // Set { <socket.id> }
        socket.join(roomName);
        console.log(socket.rooms); // Set { <socket.id>, { payload: 'room1' } }

        socket['nickname'] = nickname;

        setTimeout(() => {
          done('Hello from the backend');
        }, 3000);

        socket.to(roomName).emit('welcome', socket['nickname']); // sending socket didn't get 'welcome' message

        socket.on('disconnecting', () => {
          socket.rooms.forEach((room) =>
            socket.to(room).emit('bye', socket['nickname'])
          );
        });

        socket.on('new_message', (message, room, done) => {
          socket.to(room).emit('new_message', message, socket['nickname']);
          done();
        });
      });
    });

    // client-side
    welcomeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const roomInput = welcome.querySelector('#room');
      roomName = roomInput.value;

      // enter a nickname
      const nicknameInput = welcome.querySelector('#nickname');
      const nickname = nicknameInput.value;

      socket.emit('enter_room', roomName, nickname, () => {
        welcome.hidden = true;
        chat.hidden = false;
        const h2 = document.querySelector('h2');
        h2.innerText = `Room: ${roomName}`;

        // send a message
        const messageForm = chat.querySelector('#message');
        messageForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const input = messageForm.querySelector('input');
          const message = input.value;
          socket.emit('new_message', message, roomName, () => {
            printMessage(`You: ${message}`);
          });
          input.value = '';
        });
      });
      roomInput.value = '';
      nicknameInput.value = '';
    });

    socket.on('welcome', (nickname) => printMessage(`${nickname} joined!`));

    socket.on('bye', (nickname) => printMessage(`${nickname} left!`));

    socket.on('new_message', (msg, nickname) =>
      printMessage(`${nickname}: ${msg}`)
    );
    ```

### Adapter

- An Adapter is a server-side component which is responsible for broadcasting events to all or a subset of clients.

- On Adapter, if the key is on `rooms`, but not `sids`, it's a public room.
- `io.sockets.adapter`

  ```bash
  rooms: Map(3) {
    'DIvCFUEP18LzTnO7AAAB' => Set(1) { 'DIvCFUEP18LzTnO7AAAB' },
    'Tz-EfGtMbZn_fvw1AAAF' => Set(1) { 'Tz-EfGtMbZn_fvw1AAAF' },
    'aa' => Set(1) { 'Tz-EfGtMbZn_fvw1AAAF' }
  },
  sids: Map(2) {
    'DIvCFUEP18LzTnO7AAAB' => Set(1) { 'DIvCFUEP18LzTnO7AAAB' },
    'Tz-EfGtMbZn_fvw1AAAF' => Set(2) { 'Tz-EfGtMbZn_fvw1AAAF', 'aa' }
  },
  ```

- Opened room notification

  - ```js
    // server-size
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
      socket.on('enter_room', (roomName, nickname, done) => {
        io.sockets.emit('room_change', publicRooms());
      });
      socket.on('disconnect', () => {
        io.sockets.emit('room_change', publicRooms());
      });
    });

    // client-side
    socket.on('room_change', (rooms) => {
      const roomList = welcome.querySelector('ul');
      roomList.innerHTML = '';
      if (rooms.length === 0) {
        return;
      }
      rooms.forEach((room) => {
        const li = document.createElement('li');
        li.innerText = room;
        roomList.appendChild(li);
      });
    });
    ```

- Count users on the room

  - ```js
    // server-side
    const countRoom = (room) => {
      return io.sockets.adapter.rooms.get(room)?.size;
    };
    socket.on('enter_room', (roomName, nickname, done) => {
      done(countRoom(roomName));
      socket
        .to(roomName)
        .emit('welcome', socket['nickname'], countRoom(roomName));
    });
    socket.on('disconnecting', () => {
      socket.rooms.forEach((room) =>
        socket.to(room).emit('bye', socket['nickname'], countRoom(room) - 1)
      );
    });

    // client-side
    const printNumUsers = (num) => {
      const h3 = chat.querySelector('h3');
      h3.innerText = `Room: ${roomName} (${num})`;
    };
    socket.emit('enter_room', roomName, nickname, (countRoom) => {
      printNumUsers(countRoom);
    });
    socket.on('welcome', (nickname, countRoom) => {
      printNumUsers(countRoom);
    });

    socket.on('bye', (nickname, countRoom) => {
      printNumUsers(countRoom);
    });
    ```

### Admin UI

- Socket.IO admin UI can be used to have an overview of the state of your Socket.IO deployment.
- Install

  - `npm i @socket.io/admin-ui`
  - Server-side on server.js

    - ```js
      import { Server } from 'socket.io';
      import { instrument } from '@socket.io/admin-ui';

      const io = new Server(server, {
        cors: {
          origin: ['https://admin.socket.io'],
          credentials: true,
        },
      });

      instrument(io, {
        auth: {
          type: 'basic',
          username: 'admin',
          password:
            '$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS', // "changeit" encrypted with bcrypt
        },
      });
      ```

  - Client-side
    - `https://admin.socket.io
    - Connection
      - Server URL: `http://localhost:3000/admin` or `https://example.com/admin`
      - Path: empty

## Video

- `navigator.mediaDevices`

  - The `navigator.mediaDevices` read-only property returns a `MediaDevices` object, which provides access to connected media input devices like cameras and microphones, as well as screen sharing.

- `navigator.mediaDevices.getUserMedia()`

  - It returns a `Promise` that resolves to `MediaStream` object. If the user denies permission, or matching media is nlt available, then the promise is rejected with `NotAllowedError` or `NotFoundError` respectively.
  - ```js
    async function getMedia(constraints) {
      let mediaStream = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            /* camera resolution */
            width: 1280,
            height: 720
            /* min, max, or exact(a.k.a min == max) */
            width: { min: 1024, max: 1920 },
            height: { min: 576, max: 1080}
            /* On mobile devices, the following will prefer the front camera (if one is available) over the rear one */
            facingMode: "user"
            /* To require the rear camera */
            facingMode: { exact: "environment" }
            /* If you have a `deviceId` from `mediaDevices.enumerateDevices(), you can use it to request a specific device */
            deviceId: myPreferredCameraDeviceId
            /* To require the specific camera */
            deviceId: { exact: myExactCameraOrBustDeviceId }
          }
        });
        /* use the stream */
      } catch (err) {
        /* handle the error */
      }
    }
    ```

- `navigator.mediaDevices.enumerateDevices()`

  - The method requests a list of the available media input and output devices. The returned `Promise` is resolved with `MediaDeviceInfo` array describing the devices.

- `mediaStream.getAudioTracks()`

  - This methods of the `MediaStream` interface returns a sequence that represents all the `MediaStreamTrack` objects in this stream's track set where MediaStreamTrack.kind is `audio`.
  - You can mute or unmute by `enabled`.
    - `mediaStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));`

- `mediaStream.getVideoTracks()`

- `mediaStream.getTracks()`

- ```js
  const socket = io();

  const myFace = document.querySelector('#myFace');

  let myStream;
  let muted = false;
  let cameraOff = false;

  const muteBtn = document.querySelector('#mute');
  const cameraBtn = document.querySelector('#camera');
  const camerasSelect = document.querySelector('#cameras');

  async function getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      // get only videoinput
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      const currentCamera = myStream.getVideoTracks()[0];
      // cameras selection
      cameras.forEach((camera) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.innerText = camera.label;
        if (currentCamera.label == camera.label) {
          option.selected = true;
        }
        camerasSelect.appendChild(option);
      });
    } catch (err) {
      console.log(err);
    }
  }
  async function getMedia(deviceId) {
    try {
      // get video
      myStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user' },
      });
      // show video
      myFace.srcObject = myStream;
      if (!deviceId) {
        await getCameras();
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function selectCamera(deviceId) {
    await getMedia(deviceId);
  }
  getMedia();
  camerasSelect.addEventListener('change', (event) => {
    selectCamera(event.target.value);
  });
  muteBtn.addEventListener('click', () => {
    // audio tracking to mute or unmute
    myStream
      .getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
      muteBtn.innerText = 'Unmute';
      muted = true;
    } else {
      muteBtn.innerText = 'Mute';
      muted = false;
    }
  });
  cameraBtn.addEventListener('click', () => {
    // video tracking to turn on or turn off
    myStream
      .getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff) {
      cameraBtn.innerText = 'Turn Camera Off';
      cameraOff = false;
    } else {
      cameraBtn.innerText = 'Turn Camera On';
      cameraOff = true;
    }
  });
  ```

## WebRTC (Web Real-Time Communication)

### Signaling and video calling

- WebRTC allows real-time, peer-to-peer, media exchange between two devices. A connection is established through a discovery and negotiation precess called **signaling**.

- Establishing a WebRTC connection between two devices requires the use of a **signaling server** to resolve how to connect them over the internet.

- Signaling transaction flow

  - The signaling process involves this exchange of messages among a number of points:
    - Each user's client running within a web browser
    - Each user's web browser
    - The signaling server
    - The web server hosting the chat service

  1. getUserMedia

  2. create RTCPeerConnection

     - `new RTCPeerConnection()`

  3. enter room name

  4. emit 'join_room' from caller

     - `socket.emit('join_room', input.value);`

  5. add track into RTCPeerConnection

     - `myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));`

  6. join the room and emit welcome to the room from server

  7. caller creates an offer

     - `const offer = await myPeerConnection.createOffer();`

  8. change the local description associated with the connection on caller

     - `myPeerConnection.setLocalDescription(offer);`

  9. emit the offer from caller

     - `socket.emit('offer', offer, roomName);`

  10. emit the offer to the room from server

      - `socket.to(roomName).emit('offer', offer);`

  11. callee receives the offer

  12. set the specified session description as the remote peer's current offer.

      - `myPeerConnection.setRemoteDescription(offer);`

  13. callee creates the answer

      - `const answer = await myPeerConnection.createAnswer();`

  14. change the local description associated with the connection on callee

  - `myPeerConnection.setLocalDescription(answer);`

  15. emit the answer from callee

  - `socket.emit('answer', answer, roomName);`

  16. emit the answer to the room from server

      - `socket.to(roomName).emit('answer', answer);`

  17. caller receives the answer

  18. set the specified session description as the remote peer's current answer.

      - `myPeerConnection.setRemoteDescription(answer);`

![Signaling transaction flow](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling/webrtc_-_signaling_diagram.svg)

- ICE candidate exchange process
  - When each peer's ICE layer begins to send candidates, it enters into an exchange among the various points in the chain that looks like this:

![ICE candidate exchange process](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling/webrtc_-_ice_candidate_exchange.svg)

## Install dependencies after cloning from git

- `git clone git@github.com:canadaprogrammer/zoom-clone-coding.git`
- `npm install`
