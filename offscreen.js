chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        startRecording(message.data);
        break;
      case 'stop-recording':
        stopRecording();
        break;
      case 'play-audio':
        playAudio();
        break;
      case 'download-audio':
        downloadAudio();
        break;
      default:
        throw new Error('Unrecognized message:', message.type);
    }
  } else if (message.type === 'check-audio') {
    sendResponse({ audioAvailable: audioBlobs.length > 0 });
    return true;
  }
});

let recorder;
let data = [];
let audioBlobs = []; // Array to store audio blobs

async function startRecording(streamId) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.');
  }

  // Request tab audio
  const tabAudio = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    }
  });

  let micAudio;
  try {
    // Attempt to request microphone audio
    micAudio = await navigator.mediaDevices.getUserMedia({
      audio: true // Request microphone audio
    });
  } catch (error) {
    console.warn('Microphone not available or permission denied:', error);
    micAudio = null; // Set micAudio to null if not available
  }

  // Combine the audio streams if microphone is available
  const combinedStream = micAudio 
    ? new MediaStream([...tabAudio.getAudioTracks(), ...micAudio.getAudioTracks()])
    : tabAudio; // Use only tab audio if mic is not available

  const output = new AudioContext();
  const source = output.createMediaStreamSource(combinedStream);
  source.connect(output.destination);

  recorder = new MediaRecorder(combinedStream, { mimeType: 'audio/webm' });
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.onstop = () => {
    const blob = new Blob(data, { type: 'audio/webm' });
    audioBlobs.push(blob); // Store the blob in the array
    data = [];
  };
  recorder.start();

  window.location.hash = 'recording';
}

async function stopRecording() {
  recorder.stop();
  recorder.stream.getTracks().forEach((t) => t.stop());
  window.location.hash = '';
}

function playAudio() {
  if (audioBlobs.length > 0) {
    const lastBlob = audioBlobs[audioBlobs.length - 1];
    const audioUrl = URL.createObjectURL(lastBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } else {
    console.error('No audio available to play.');
  }
}

function downloadAudio() {
  if (audioBlobs.length > 0) {
    const lastBlob = audioBlobs[audioBlobs.length - 1];
    const audioUrl = URL.createObjectURL(lastBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = audioUrl;
    a.download = 'recording.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    console.error('No audio available to download.');
  }
}