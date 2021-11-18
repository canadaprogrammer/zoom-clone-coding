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

  ```html5
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
  ```js
  app.set('views', __dirname + '/views'); // set views
  app.use('/public', express.static(__dirname + '/public')); // use public, user can see
  app.get('/', (req, res) => res.render('home')); // rendering home view
  app.get('/*', (req, res) => res.redirect('/')); // redirect all urls to the root. we can hide and show
  ```

## install dependencies after cloning from git

- `git clone git@github.com:canadaprogrammer/zoom-clone-coding.git`
- `npm install`
