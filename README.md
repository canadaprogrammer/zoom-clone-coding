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
          h1 It works!
        main
          h2 Welcome to Noom
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
    ```

### Listening to the connection and WebSocket message

- on app.js
  - ```js
    socket.addEventListener('open', () => {
      console.log('Connected to the Server');
    });
    socket.addEventListener('close', () => {
      console.log('Disconnected from the Server');
    });
    socket.addEventListener('message', (message) => {
      console.log('Got this: ', message.data, ' from the Server');
    });
    setTimeout(() => {
      socket.send('Hello from the Browser');
    }, 10000);
    ```
- on server.js
  - ```js
    wss.on('connection', (socket) => {
      console.log('Connected to the Browser');
      socket.on('close', () => console.log('Disconnected form the Browser'));
      socket.on('message', (message) => {
        console.log(message.toString('utf8'));
      });
      socket.send('Hello!');
    });
    ```

## install dependencies after cloning from git

- `git clone git@github.com:canadaprogrammer/zoom-clone-coding.git`
- `npm install`
