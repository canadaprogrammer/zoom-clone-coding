const socket = io();

const myFace = document.querySelector('#myFace');
const muteBtn = document.querySelector('#mute');
const cameraBtn = document.querySelector('#camera');
const camerasSelect = document.querySelector('#cameras');

const call = document.querySelector('#call');

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

call.hidden = true;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0];

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
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: 'user' },
    });
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

// getMedia();

camerasSelect.addEventListener('change', (event) => {
  selectCamera(event.target.value);
});
muteBtn.addEventListener('click', () => {
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

// Welcome Form (join a room)

const welcome = document.querySelector('#welcome');
const welcomeForm = welcome.querySelector('form');

const initialCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  await makeConnection();
};

welcomeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  await initialCall();
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
});

// Socket code

socket.on('welcome', async () => {
  // only working on caller
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log('sent the offer');
  // send the offer to callee
  socket.emit('offer', offer, roomName);
});

socket.on('offer', async (offer) => {
  // only working on callee
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
});

socket.on('answer', (answer) => {
  // only working on caller
  myPeerConnection.setRemoteDescription(answer);
});
// WebRTC code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  // add tracks into RTCPeerConnection
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}
