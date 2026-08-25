//streaming-client-api.js
// Import the DID_API configuration
//import DID_API from '../../api.json' assert { type: 'json' };
//const DID_API = require('../../api.json');
'use strict';

let DID_API = null;
try {
  const fetchJsonFile = await fetch("./api.json");
  if (!fetchJsonFile.ok) throw new Error(`HTTP ${fetchJsonFile.status}`);
  DID_API = await fetchJsonFile.json();
} catch (e) {
  console.error('Could not load ./api.json — the avatar video will stay disabled. Copy api.json.example to api.json and fill in your D-ID key.', e);
}

if (!DID_API || !DID_API.key || DID_API.key === '🤫') {
  console.warn('Missing/invalid D-ID API key in ./api.json. Avatar video is disabled; text chat still works.');
  DID_API = null;
}

//same  - No edits from Github example for this whole section
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

const talkVideo = document.getElementById('talk-video');
talkVideo.setAttribute('playsinline', '');
const peerStatusLabel = document.getElementById('peer-status-label');
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');
//var conectado = false;

// Output mode: 'voice' speaks replies with the browser's built-in
// text-to-speech and never shows/connects the avatar; 'avatar' speaks
// replies through the D-ID talking-head video and never uses browser TTS.
// The mic (speech-to-text) button is independent of this and always works.
let outputMode = 'voice';
const modeVoiceButton = document.getElementById('mode-voice-button');
const modeAvatarButton = document.getElementById('mode-avatar-button');

// Connecting to D-ID (session setup + SDP/ICE negotiation) is async and not
// instant, so a reply can arrive before peerConnection reaches 'connected'.
// Hold onto the latest such reply and speak it as soon as the connection is
// ready, instead of silently dropping it.
let pendingAvatarSpeech = null;

function setOutputMode(mode) {
  outputMode = mode;
  modeVoiceButton.classList.toggle('active', mode === 'voice');
  modeAvatarButton.classList.toggle('active', mode === 'avatar');
  connectButton.disabled = mode !== 'avatar';

  if (mode === 'voice') {
    window.speechSynthesis && window.speechSynthesis.cancel();
    pendingAvatarSpeech = null;
    if (peerConnection) {
      disconnectAvatar();
    }
  }
}

modeVoiceButton.addEventListener('click', () => setOutputMode('voice'));
modeAvatarButton.addEventListener('click', () => setOutputMode('avatar'));

const connectButton = document.getElementById('connect-button');
connectButton.onclick = async () => {
  if (outputMode !== 'avatar') {
    return; // button is disabled in this mode, but guard anyway
  }
  //conectado = true;
  playIdleVideo(); // instant feedback: show the idle avatar right away, even before/without D-ID
  if (!DID_API) {
    alert('D-ID is not configured: copy public/api.json.example to public/api.json and add your key.');
    return;
  }
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();

  const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    //headers: {'Authorization': `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
    headers: {
          Authorization: `Basic ${btoa(DID_API.key + ':')}`,
          'Content-Type': 'application/json'
        },
    body: JSON.stringify({
      //source_url: "https://create-images-results.d-id.com/google-oauth2%7C107664625991236743226/upl_VrFVsnxVajUki3IETwSZr/image.png",
      //source_url: "https://create-images-results.d-id.com/google-oauth2%7C107664625991236743226/upl_cYirYQ0lSDRhPl4HHwww1/image.png",
      //source_url: "https://create-images-results.d-id.com/google-oauth2%7C107664625991236743226/upl_lxZSp2ROJ8tvsPvWeYbW3/image.png",
      source_url: "https://create-images-results.d-id.com/google-oauth2%7C107664625991236743226/upl_Z8DMZTsAwr619vlqkCGPW/image.png",
      //stream_warmup: true, 
      //config: { video_quality: 'hd' } 
    }),
  });

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
  streamId = newStreamId;
  sessionId = newSessionId;
  
  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers);
  } catch (e) {
    console.log('error during streaming setup', e);
    stopAllStreams();
    closePC();
    return;
  }

  const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`,
    {
      method: 'POST',
      //headers: {Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json'},
       headers: {
          'Authorization': `Basic ${btoa(DID_API.key + ':')}`,
          'Content-Type': 'application/json'
        },
      body: JSON.stringify({answer: sessionClientAnswer, session_id: sessionId})
    });
};

setOutputMode(outputMode); // apply initial UI state (connect button disabled, active pill) now that connectButton exists

// Speaks each chat reply according to the selected output mode. In 'avatar'
// mode, browser TTS is never used — audio comes only from the D-ID video
// stream; if the avatar isn't connected yet, the reply is silent (the user
// must click Connect first) rather than silently falling back to TTS.
document.addEventListener('chatResponse', async (event) => {
  const chatResponse = event.detail; // The detail property contains the response data

  if (outputMode === 'avatar') {
    if (peerConnection && peerConnection.connectionState === 'connected') {
      handleDIDStreaming(chatResponse);
    } else {
      console.warn('Avatar mode is selected but not connected yet — will speak this reply once the connection is ready.');
      pendingAvatarSpeech = chatResponse;
    }
  } else {
    speakLocally(chatResponse);
  }
});

// Browser text-to-speech, used for 'voice' output mode.
function speakLocally(text) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel(); // don't stack utterances if replies come quickly
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';
  window.speechSynthesis.speak(utterance);
}

// You need a function like this to handle the streaming logic with D-ID API
async function handleDIDStreaming(chatResponse) {
  try {
    const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Basic ${btoa(DID_API.key + ':')}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          subtitles: 'false',
          provider: { type: 'microsoft', voice_id: 'es-MX-JorgeNeural' }, //es-MX-JorgeNeural, en-US-AndrewNeural, es-MX-GerardoNeural
          ssml: false,
          input: chatResponse  // Send the chatResponse to D-ID
        },
        config: {
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
            transition_frames: 0
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          stitch: true,
          result_format: 'mp4'
        },
        'driver_url': 'bank://lively/',
        'config': {
          'stitch': true,
        },
        'session_id': sessionId
      })
    });

    // Handle the response from D-ID here
    if (!talkResponse.ok) {
      throw new Error(`D-ID streaming request failed with status ${talkResponse.status}`);
    }

    // Process the talkResponse if needed
    const responseData = await talkResponse.json();
    console.log('D-ID Streaming Response:', responseData);

  } catch (error) {
    console.error('Error during D-ID streaming:', error);
  }
}

// NOTHING BELOW THIS LINE IS CHANGED FROM ORIGNAL D-id File Example
//

async function disconnectAvatar() {
  pendingAvatarSpeech = null;
  if (!DID_API || !streamId) {
    stopAllStreams();
    closePC();
    return;
  }
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(DID_API.key + ':')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  closePC();
}

const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = disconnectAvatar;

function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event);
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(DID_API.key + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    });
  }
}
function onIceConnectionStateChange() {
  iceStatusLabel.innerText = peerConnection.iceConnectionState;
  iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams();
    closePC();
  }
}
function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;

  if (peerConnection.connectionState === 'connected' && pendingAvatarSpeech) {
    const text = pendingAvatarSpeech;
    pendingAvatarSpeech = null;
    handleDIDStreaming(text);
  }
}
function onSignalingStateChange() {
  signalingStatusLabel.innerText = peerConnection.signalingState;
  signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

function onVideoStatusChange2(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';

    // Create a video element to play the stream
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;

    // Listen for the 'canplaythrough' event to ensure smooth playback
    videoElement.addEventListener('canplaythrough', function() {
      // Now the video is ready to play
      setVideoElement(stream); // This function should now use videoElement instead of directly using stream
      videoElement.play(); // Make sure this is okay per your application's logic
    }, false);

    // It's a good idea to also listen for errors in case the video fails to load
    videoElement.addEventListener('error', function(e) {
      console.error('Video playback error:', e);
      // Handle the error, e.g., by trying to reload the video or playing the idle video
      playIdleVideo();
    });

  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}


function onVideoStatusChange(videoIsPlaying, stream) {
  let status;
  if (videoIsPlaying) {
    status = 'streaming';
    const remoteStream = stream;
    setVideoElement(remoteStream);
  } else {
    status = 'empty';
    playIdleVideo();
  }
  streamingStatusLabel.innerText = status;
  streamingStatusLabel.className = 'streamingState-' + status;
}

function onTrack(event) {
  /**
   * The following code is designed to provide information about wether currently there is data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no talk is streaming.
   * To create this idle video use the POST https://api.d-id.com/talks endpoint with a silent audio file or a text script with only ssml breaks 
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return;

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track);
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived;
          onVideoStatusChange2(videoIsPlaying, event.streams[0]);
        }
        lastBytesReceived = report.bytesReceived;
      }
    });
  }, 500);
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}

function setVideoElement(stream) {
  if (!stream) return;
  talkVideo.srcObject = stream;
  talkVideo.loop = false;

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo
      .play()
      .then((_) => {})
      .catch((e) => {});
  }
}

function playIdleVideo() {
  talkVideo.srcObject = undefined;
  //talkVideo.src = 'idle_subtle3.mp4';
  //talkVideo.src = 'idle_cris.mp4';
  //talkVideo.src = "idle_mago.mp4";
  talkVideo.src = "somme_idle.mp4";  
  talkVideo.loop = true;
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams');
    talkVideo.srcObject.getTracks().forEach((track) => track.stop());
    talkVideo.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;
// Default of 1 moved to 5
async function fetchWithRetries(url, options, retries = 3) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}