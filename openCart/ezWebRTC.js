'use explicit';
/* dependencies:
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="//cdn.webrtc-experiment.com/DetectRTC.js"></script>
*/

;(function(global,io,detectRTC){

  var EZWebRTC = function(){
      return new this.init();
  };

  //private variables not accessible from outside module
  var a =0;

  //public methods and properties shared by all instances
  EZWebRTC.prototype = {
        checkRTC : checkRTC.bind(this),
        prop2: 'asdfas'
    };



  var checkRTC = function(callback){
    detectRTC.load(function() {
      this.hasWebcam   = DetectRTC.hasWebcam;
      this.hasMic      = DetectRTC.hasMicrophone;
      this.hasSpeakers = DetectRTC.hasSpeakers;
      this.hasScrnCptr = DetectRTC.isScreenCapturingSupported;
      this.hasDesktopC = DetectRTC.isDesktopCapturingSupported;
      this.hasDataChan = DetectRTC.isSctpDataChannelsSupported;
      this.hasWebRTC   = DetectRTC.isWebRTCSupported;
      this.hasAudioConext = DetectRTC.isAudioContextSupported;
      this.isMobileDev = DetectRTC.isMobileDevice;
      this.hasWebsocket = DetectRTC.isWebSocketsSupported;

      //minimum requirements for EZcall
      this.hasCall = this.hasWebsocket && this.hasWebRTC && this.hasMic;
      this.hasVideoCall = this.hasCall && this.hasVideo;

});

  //constructor
  EZWebRTC.init = function(){
    this.socket = io('http://localhost:9000',{path:'/socket.io-client'});
    this.
  };

  EZWebRTC.init.prototype = EZWebRTC.prototype;


  //expose EZWebRTC to global object;
  global.EZWebRTC = global.EZWebRTC || EZWebRTC;

}(window,io,DetectRTC))
