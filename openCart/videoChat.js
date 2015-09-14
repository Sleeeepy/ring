

var socket = io('http://localhost:9000',{path:'/socket.io-client'});

document.getElementById('startCall').addEventListener('click',function(e){
  var webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: 'localVideo',
    // the id/element dom element that will hold remote videos
    remoteVideosEl: '',
    // immediately ask for camera access
    autoRequestMedia: true
  });
  // we have to wait until it's ready
  webrtc.on('readyToCall', function () {
    // you can name it anything
    webrtc.joinRoom('your awesome room name er-098-098');

  });
  var toggleVideo = true;
  document.getElementById('button1').addEventListener('click',function(){
    if (toggleVideo){
      webrtc.pauseVideo();
    }else{
      webrtc.resumeVideo();
    }
    toggleVideo = !toggleVideo;
  });

  var toggleAudio = true;
  document.getElementById('button2').addEventListener('click',function(){
    if (toggleAudio){
      webrtc.mute();
    }else{
      webrtc.unmute();
    }
    toggleAudio = !toggleAudio;
  });

  // a peer video has been added
  webrtc.on('videoAdded', function (video, peer) {
    console.log('video added', peer);
    var remotes = document.getElementById('remotes');
    if (remotes) {
      var container = document.createElement('div');
      container.className = 'videoContainer';
      container.id = 'container_' + webrtc.getDomId(peer);
      container.appendChild(video);

      // suppress contextmenu
      video.oncontextmenu = function () { return false; };

      remotes.appendChild(container);
    }

    // show the remote volume
    var vol = document.createElement('meter');
    vol.id = 'volume_' + peer.id;
    vol.className = 'volume';
    vol.min = -45;
    vol.max = -20;
    vol.low = -40;
    vol.high = -25;
    container.appendChild(vol);

    // add muted and paused elements
    var muted = document.createElement('span');
    muted.className = 'muted';
    container.appendChild(muted);
    var paused = document.createElement('span');
    paused.className = 'paused';
    container.appendChild(paused);

  });

  // a peer video was removed
  webrtc.on('videoRemoved', function (video, peer) {
    console.log('video removed ', peer);
    var remotes = document.getElementById('remotes');
    var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
    if (remotes && el) {
    remotes.removeChild(el);
    }
  });

  // listen for mute and unmute events
  webrtc.on('mute', function (data) { // show muted symbol
    webrtc.getPeers(data.id).forEach(function (peer) {
      if (data.name == 'audio') {
        $('#videocontainer_' + webrtc.getDomId(peer) + ' .muted').show();
      } else if (data.name == 'video') {
        $('#videocontainer_' + webrtc.getDomId(peer) + ' .paused').show();
        $('#videocontainer_' + webrtc.getDomId(peer) + ' video').hide();
      }
    });
  });

  webrtc.on('unmute', function (data) { // hide muted symbol
    webrtc.getPeers(data.id).forEach(function (peer) {
    if (data.name == 'audio') {
    $('#videocontainer_' + webrtc.getDomId(peer) + ' .muted').hide();
    } else if (data.name == 'video') {
    $('#videocontainer_' + webrtc.getDomId(peer) + ' video').show();
    $('#videocontainer_' + webrtc.getDomId(peer) + ' .paused').hide();
    }
    });
  });

  // local volume has changed
  webrtc.on('volumeChange', function (volume, treshold) {
      showVolume(document.getElementById('localVolume'), volume);
  });
  // remote volume has changed
  webrtc.on('remoteVolumeChange', function (peer, volume) {
      showVolume(document.getElementById('volume_' + peer.id), volume);
  });


  // helper function to show the volume
  function showVolume(el, volume) {
      //console.log('showVolume', volume, el);
      if (!el) return;
      if (volume < -45) volume = -45; // -45 to -20 is
      if (volume > -20) volume = -20; // a good range
      el.value = volume;
  }

});
