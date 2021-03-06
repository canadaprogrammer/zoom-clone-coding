const socket = io();

const welcome = document.querySelector('#welcome');
const welcomeForm = welcome.querySelector('form');
const chat = document.querySelector('#chat');
const ul = chat.querySelector('ul');

chat.hidden = true;
let roomName;
// let nickname = 'Anonymous';

const printMessage = (message) => {
  const li = document.createElement('li');
  li.innerText = message;
  ul.appendChild(li);
};

const printNumUsers = (num) => {
  const h3 = chat.querySelector('h3');
  h3.innerText = `Room: ${roomName} (${num})`;
};

// enter a room
welcomeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const roomInput = welcome.querySelector('#room');
  roomName = roomInput.value;

  // enter a nickname
  const nicknameInput = welcome.querySelector('#nickname');
  const nickname = nicknameInput.value;

  socket.emit('enter_room', roomName, nickname, (countRoom) => {
    welcome.hidden = true;
    chat.hidden = false;
    printNumUsers(countRoom);

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

socket.on('welcome', (nickname, countRoom) => {
  printNumUsers(countRoom);
  printMessage(`${nickname} joined!`);
});

socket.on('bye', (nickname, countRoom) => {
  printNumUsers(countRoom);
  printMessage(`${nickname} left!`);
});

socket.on('new_message', (msg, nickname) =>
  printMessage(`${nickname}: ${msg}`)
);

// socket.on('room_change', (msg) => console.log(msg));
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
