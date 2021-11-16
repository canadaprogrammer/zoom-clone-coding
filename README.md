# Zoom Clone Coding

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
        "express": "^4.17.1"
      }
    }
    ```
- server.js
  - ```js
    import express from 'express';
    const app = express();
    const handleListen = () => console.log(`Listening on http://localhost:3000`);
    app.listen(3000, handleListen);
    ```
- test
  - `npm run dev`