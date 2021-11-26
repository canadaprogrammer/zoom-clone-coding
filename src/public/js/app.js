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

    const option = document.createElement('option');
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
async function handleCameraChange(deviceId) {
  await getMedia(deviceId);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    console.log('videoTrack', videoTrack);
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack);
  }
}

// getMedia();

camerasSelect.addEventListener('change', (event) => {
  handleCameraChange(event.target.value);
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
  console.log('received the offer');
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
  console.log('sent the answer');
});

socket.on('answer', (answer) => {
  // only working on caller
  console.log('received the answer');
  myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
  console.log('received candidate');
  myPeerConnection.addIceCandidate(ice);
});
// WebRTC code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  });
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('track', handleTrack);
  // add tracks into RTCPeerConnection
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log('sent candidate');
  socket.emit('ice', data.candidate, roomName);
}

function handleTrack(data) {
  const peerFace = document.querySelector('#peerFace');
  peerFace.srcObject = data.streams[0];
  console.log('Peer stream:', data.streams[0]);
  console.log('My stream:', myStream);
}
