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
  var a ={b:0};

  //public methods and properties shared by all instances
  EZWebRTC.prototype = {

        checkRTC : function(callback){
                      checkRTC.call(this,callback);
                    },
        info     : function(msg){
                      this.socket.emit('info',msg);
                    },

        prop2: 'asdfas'
    };



  var checkRTC = function(callback){
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
    });
  }

  //constructor
  EZWebRTC.init = function(){
    var self = this;
    self.checkRTC(function(){
        if(self.supports.calls){
          self.socket = io('http://localhost:9000',{path:'/socket.io-client'});
          console.log(self);
        }
    });


  };

  EZWebRTC.init.prototype = EZWebRTC.prototype;


  //expose EZWebRTC to global object;
  global.EZWebRTC = global.EZWebRTC || EZWebRTC;

}(window,io,DetectRTC))

myrtc = window.EZWebRTC();
