document.getElementById('startButton').addEventListener('click', async () => {
    document.getElementById('startButton').disabled = true; // Disable Start button
    document.getElementById('stopButton').disabled = false; // Enable Stop button

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
    document.getElementById('startButton').disabled = false; // Enable Start button
    document.getElementById('stopButton').disabled = true; // Disable Stop button
    
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen'
    });
  });