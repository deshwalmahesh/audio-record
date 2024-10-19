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