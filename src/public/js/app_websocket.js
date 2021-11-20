const messageList = document.querySelector('ul');
const messageForm = document.querySelector('form#message');
const nicknameForm = document.querySelector('form#nickname');
const socket = new WebSocket(`ws://${window.location.host}`);

const makeMessage = (type, payload) => {
  const msg = { type, payload };
  return JSON.stringify(msg);
};
socket.addEventListener('open', () => {
  console.log('Connected to the Server');
});
socket.addEventListener('message', (message) => {
  const li = document.createElement('li');
  messageList.appendChild(li);
  li.innerText = message.data;
  // console.log('New message: ', message.data);
});
socket.addEventListener('close', () => {
  console.log('Disconnected from the Server');
});

// setTimeout(() => {
//   socket.send('Hello from the Browser');
// }, 3000);

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = messageForm.querySelector('input');
  socket.send(makeMessage('message', input.value));
  input.value = '';
});
nicknameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = nicknameForm.querySelector('input');
  socket.send(makeMessage('nickname', input.value));
  input.value = '';
});
