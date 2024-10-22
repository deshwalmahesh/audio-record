**voiceRecorder.js**
```
const focusedWindow = () => {
  chrome.windows.getCurrent({}, w => {
    chrome.windows.update(w.id, { focused: true });
  });
}

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

// Listen for changes in localStorage
window.addEventListener('storage', (event) => {
    if (event.key === 'isRecording') {
      updateButtonState();
    } else if (event.key === 'audioSrc') {
      document.getElementById("audio").src = event.newValue;
    }
  });
  

focusedWindow();
voiceRecorder();

```

**voiceRecorder.html**
```
<html>
<body>
  <button id="record">Record</button>
  <button id="stop" disabled=true>Stop</button><br>
  <audio id="audio" controls>
  <script src="voiceRecorder.js"></script>
</body>
</html>
```

**popup.js**
```
const createDate = {
  url: "voiceRecorder.html",
  type: "popup",
  width: 400,
  height: 200
};

chrome.windows.create(createDate);
```



It records the mic audio perfectly. I now want to add capturing speaker audio to it. For example in a tabId `t` where something was playing, I invoked the extension, I want to record the tab or system or speaker audio too. Problem is that clicking on extension, it opens up the new window for mic recording. Fix it with a minimal code