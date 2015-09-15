'use explicit';
/* dependencies:
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="http://cdn.webrtc-experiment.com/DetectRTC.js"></script>
*/
//module exports:  EZWebRTC, EZSignal
;(function(global,io,detectRTC){
  var signalingChannel;

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

  var EZWebRTC = function(){
      return new EZWebRTC.init();
  };

  //public methods and properties shared by all instances
  EZWebRTC.prototype = {

        detect:      function(callback){
          var self = this;
          self.checkRTC(function(){
              if(self.supports.calls){
                self.socket = new EZSignal(config.socket);
                self.pc     = new peerConnection(config.pc);
                if(callback){callback();}
              }
          });
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
  EZWebRTC.init = function(el){
    this.el = el;


  };

  EZWebRTC.init.prototype = EZWebRTC.prototype;



  //Signalling channel requires socket.io
  var EZSignal = function(config){
    this.socket = io(config.url,config.opts);
    this.socket.on('signal',function(data){
      this.onSignal(data);
    }
    )
  };

  EZSignal.prototype = {
    signal: function(data){
              this.socket.emit('signal',data);
    },
    info: function(msg){
                this.socket.emit('info',msg);
    },
    onSignal: function(data){} //to be replaced
  }



  //expose EZWebRTC to global object;
  global.EZWebRTC = global.EZWebRTC || EZWebRTC;

}(window,io,DetectRTC))

myrtc = EZWebRTC();
console.log('myrtc',myrtc);
myrtc.detect(function(){
  console.log('calls',myrtc.supports.calls);
  console.log($('.panel'));

});
