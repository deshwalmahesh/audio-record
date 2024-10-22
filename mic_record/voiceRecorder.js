const focusedWindow = () => {
  chrome.windows.getCurrent({}, w => {
    chrome.windows.update(w.id, { focused: true });
  });
}

const voiceRecorder = () => {
    const record = document.getElementById("record");
    const stop = document.getElementById("stop");
    const download = document.getElementById("download");
    const audio = document.getElementById("audio");
  
    const constraints = { audio: true };
    let chunks = [];
    let mediaRecorder;
  
    const updateButtonState = () => {
      const isRecording = localStorage.getItem('isRecording') === 'true';
      const isPlaying = !audio.paused;
      record.disabled = isRecording || isPlaying;
      stop.disabled = !isRecording;
      download.disabled = !audio.src;
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
  
      download.onclick = () => {
        const blob = new Blob(chunks, { "type": "audio/ogg; codecs=opus" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "recording.ogg";
        a.click();
        window.URL.revokeObjectURL(url);
      }
  
      mediaRecorder.onstop = (e) => {
        const blob = new Blob(chunks, { "type": "audio/ogg; codecs=opus" });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
        localStorage.setItem('audioSrc', audioURL);
        updateButtonState();
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
  
      // Add event listener for audio play/pause
      audio.addEventListener('play', updateButtonState);
      audio.addEventListener('pause', updateButtonState);
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

