document.addEventListener('DOMContentLoaded', () => {
  const isRecording = localStorage.getItem('isRecording') === 'true';

  document.getElementById('startButton').disabled = isRecording;
  document.getElementById('stopButton').disabled = !isRecording;

  // Check if there are any audio recordings stored
  chrome.runtime.sendMessage({ type: 'check-audio' }, (response) => {
    const audioAvailable = response.audioAvailable;
    document.getElementById('playButton').disabled = !audioAvailable;
    document.getElementById('downloadButton').disabled = !audioAvailable;
  });
});

document.getElementById('startButton').addEventListener('click', async () => {
  document.getElementById('startButton').disabled = true;
  document.getElementById('stopButton').disabled = false;
  document.getElementById('playButton').disabled = true;
  document.getElementById('downloadButton').disabled = true;

  localStorage.setItem('isRecording', 'true');

  const existingContexts = await chrome.runtime.getContexts({});
  let offscreenDocument = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
  );

  if (!offscreenDocument) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording from chrome.tabCapture API'
    });
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });

  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data: streamId
  });
});

document.getElementById('stopButton').addEventListener('click', () => {
  document.getElementById('startButton').disabled = false;
  document.getElementById('stopButton').disabled = true;

  chrome.runtime.sendMessage({
    type: 'stop-recording',
    target: 'offscreen'
  }, () => {
    chrome.runtime.sendMessage({ type: 'check-audio' }, (response) => {
      const audioAvailable = response.audioAvailable;
      document.getElementById('playButton').disabled = !audioAvailable;
      document.getElementById('downloadButton').disabled = !audioAvailable;
    });
  });

  localStorage.setItem('isRecording', 'false');
});

document.getElementById('playButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'play-audio',
    target: 'offscreen'
  });
});

document.getElementById('downloadButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'download-audio',
    target: 'offscreen'
  });
});



// const focusedWindow = () => {
//   chrome.windows.getCurrent({}, w => {
//     chrome.windows.update(w.id, { focused: true });
//   });
// }

const voiceRecorder = () => {
  const record = document.getElementById("record");
  const stop = document.getElementById("stop");
  const audio = document.getElementById("audio");

  const constraints = { audio: true };
  let chunks = [];
  let mediaRecorder;

  const updateButtonState = () => {
    const isRecording = localStorage.getItem('isRecording') === 'true';
    record.disabled = isRecording;
    stop.disabled = !isRecording;
    record.style.background = isRecording ? "red" : "";
  }

  const onSuccess = (stream) => {
    mediaRecorder = new MediaRecorder(stream);

    record.onclick = () => {
      mediaRecorder.start();
      localStorage.setItem('isRecording', 'true');
      updateButtonState();
    }

    stop.onclick = () => {
      mediaRecorder.stop();
      localStorage.setItem('isRecording', 'false');
      updateButtonState();
    }

    mediaRecorder.onstop = (e) => {
      const blob = new Blob(chunks, { "type": "audio/ogg; codecs=opus" });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      localStorage.setItem('audioSrc', audioURL);
    }

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    }

    // Restore previous state
    const previousAudioSrc = localStorage.getItem('audioSrc');
    if (previousAudioSrc) {
      audio.src = previousAudioSrc;
    }

    updateButtonState();
  }

  const onError = (err) => {
    console.log(err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
}

focusedWindow();
voiceRecorder();

// Listen for changes in localStorage
window.addEventListener('storage', (event) => {
  if (event.key === 'isRecording') {
    updateButtonState();
  } else if (event.key === 'audioSrc') {
    document.getElementById("audio").src = event.newValue;
  }
});