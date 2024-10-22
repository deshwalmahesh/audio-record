# Record Audio

## Mic Recording
Logic:

1. The moment you click on the extension icon, it invokes `popup.html` which in turns calls `popup.js`
2. Create a New Window in `popup.js` which calls `voiceRecorder.html` which in turns calls `voiceRecorder.js`
3. The created window promptly asks for mic permission from user
4. In `voiceRecorder.js` focuses on the window and creates a `MediaStream` and the rest of the process follows. 

## Tab Audio Recording
Logic:

1. The moment you click on the extension icon, it invokes `popup.html` which in turns calls `popup.js`
2. Inside `popup.js`, it create event listeners. It'll first see if an offscreen document is created or not. If not then create a new one to capture the audio in background
3. It then captures the stream id of the current tab and invokes `offscreen.html` which uses `offscreen.js`
4. Inside `offscreen.js` there is code written for capturing current tab's audio in background


**NOTE**: Both the apps has statefulness which means even if you click anywhere on the screen or do some other work, the recording keeps going in background

## To-DO
This is the main thing that I wanted to do initially. 

1. Is there a way I can capture the Tab audio in the Mic Audio Window by forwording existing Tab and Stream id?
2. If `1` is possible then modify the code for Start, Stop and Download button so that when clicked any of the button, they work on both Mic as well Speaker at the same time
3. Download should download `mic` and `speaker` files seperately

