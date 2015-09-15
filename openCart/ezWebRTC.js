'use explicit';
/* dependencies:
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="http://cdn.webrtc-experiment.com/DetectRTC.js"></script>
*/

;(function(global,io,detectRTC){

  var EZWebRTC = function(){
      return new EZWebRTC.init();
  };


  //private variables not accessible from outside module
  var config = {
          pc: {
            'iceServers': [
                {
                  'url': 'stun:stun.l.google.com:19302'
                },
                {
                  'url': 'turn:192.158.29.39:3478?transport=udp',
                  'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                  'username': '28224511:1379330808'
                },
                {
                  'url': 'turn:192.158.29.39:3478?transport=tcp',
                  'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                  'username': '28224511:1379330808'
                }
            ]
          }
          ,
          socket: {
            url: 'http://localhost:9000',
            opts: {path: '/socket.io-client'}
          }

  }
  var peerConnection =  mozRTCPeerConnection
                        || webkitRTCPeerConnection;

  //public methods and properties shared by all instances
  EZWebRTC.prototype = {


        //signalling
        info:       function(msg){
                      this.socket.emit('info',msg);
                    },
        signal:     function(data){
                      this.socket.emit('signal',data);
                    },
        //detect supports requires injection of
        //<script src="http://cdn.webrtc-experiment.com/DetectRTC.js"></script>
        checkRTC:   function(callback){
                      var self = this;
                      detectRTC.load(function() {
                        self.supports = {
                            webcam          : DetectRTC.hasWebcam,
                            microphone      : DetectRTC.hasMicrophone,
                            speakers        : DetectRTC.hasSpeakers,
                            screenCapture   : DetectRTC.isScreenCapturingSupported,
                            desktopCapture  : DetectRTC.isDesktopCapturingSupported,
                            datachannel     : DetectRTC.isSctpDataChannelsSupported,
                            webRTC          : DetectRTC.isWebRTCSupported,
                            audioContext    : DetectRTC.isAudioContextSupported,
                            isMobileDev     : DetectRTC.isMobileDevice,
                            webSocket       : DetectRTC.isWebSocketsSupported
                        }

                        //minimum requirements for EZcall
                        self.supports.calls = self.supports.webSocket &&
                                              self.supports.webRTC &&
                                              self.supports.microphone;
                        self.supports.videoCalls = self.supports.calls && self.supports.webcam;
                        callback();
                      })
                    },
    };





  //constructor
  EZWebRTC.init = function(){
    var self = this;
    self.checkRTC(function(){
        if(self.supports.calls){
          self.socket = io(config.socket.url,config.socket.opts);
          self.pc     = new peerConnection(config.pc);
          console.log(self);
        }
    });


  };

  EZWebRTC.init.prototype = EZWebRTC.prototype;


  //expose EZWebRTC to global object;
  global.EZWebRTC = global.EZWebRTC || EZWebRTC;

}(window,io,DetectRTC))

myrtc = window.EZWebRTC();
