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

    //detect supports requires injection of
    //<script src="http://cdn.webrtc-experiment.com/DetectRTC.js"></script>
        detect:   function(callback){
                        var supports = this.supports;
                        DetectRTC.load(function(){
                            supports.calls      = supports.ezWebRTC &&
                                                  DetectRTC.hasMicrophone;
                            supports.videoCalls = supports.ezWebRTC &&
                                                  DetectRTC.hasWebcam;
                            if(callback){
                              callback(supports);
                            }
                        });
                  },


        start:    function () {
                        self.socket = new EZSignal(config.socket);
                        self.pc     = new peerConnection(config.pc);

                        pc = this.pc;
                        var signal = EZSignal();

                        // send any ice candidates to the other peer
                        pc.onicecandidate = function (evt) {
                          if (evt.candidate){
                            signal.signal({candidate: evt.candidate});
                          }
                        };

                        // let the 'negotiationneeded' event trigger offer generation
                        pc.onnegotiationneeded = function () {
                          pc.createOffer(localDescCreated, logError);
                        }

                        // once remote stream arrives, show it in the remote video element
                        pc.onaddstream = function (evt) {
                          remoteView.src = URL.createObjectURL(evt.stream);
                        };

                        // get a local stream, show it in a self-view and add it to be sent
                        navigator.getUserMedia({
                          'audio': true,
                          'video': true
                        }, function (stream) {
                          selfView.src = URL.createObjectURL(stream);
                          pc.addStream(stream);
                        }, logError);
                      }
                  };

  //constructor
  EZWebRTC.init = function(){
    this.supports = {
      ezWebRTC:   DetectRTC.isWebRTCSupported &&
                  DetectRTC.isWebSocketsSupported,

      webRTC:     DetectRTC.isWebRTCSupported,

      webSockets: DetectRTC.isWebRTCSupported,
    }
  };

  EZWebRTC.init.prototype = EZWebRTC.prototype;



  //Signalling channel requires socket.io
  var EZSignal = function(conf){
      var config = conf || config.socket;
      this.socket = io(config.url,config.opts);
  };

  EZSignal.prototype = {

      signal:     function(data){
                    this.socket.emit('signal',data);
                  },

      info:       function(msg){
                    this.socket.emit('info',msg);
                  },

      onSignal:   function(callback){
                    this.socket.on('signal',function(data){
                      callback(data);
                    });
                  }
  }



  //requires jQuery
  var EZCallWidget = function(){
      //load detect, then on document ready show/hide
      var self = this;
      self.ezWebRTC = EZWebRTC();
      $(document).ready(self.initWidget);
  }

  EZCallWidget.prototype = {
      element:      '.ez-call',

      initWidget:     function(){
                        var self      = this,
                            supports  = self.ezWebRTC.supports;

                        //find dom element and show if browser capable
                        self.$widget = $('.ez-call');
                        if(!supports.ezWebRTC){
                          return console.log('ezCall not available');
                        }
                        self.widget.show();

                        //detect async supports and enable buttons
                        self.ezWebRTC.detect(function(){
                          if(supports.video){
                            self.enableVideo();
                          }else if (supports.calls){
                            self.enableAudio();
                          }else{

                          }
                        });
                      },

      onClickIcon:    function(listener){
                        this.widget.find('.btn').on('click',listener);
                      },


      enableVideo:    function(){

                      },
      disableVideo:   function(){

                      },
      enableAudio:    function(){

                      },
      disableAudio:   function(){

                      },
      addRemote:      function(stream){

                      },
      addLocal:       function(stream){

                      },


  }


  //expose EZWebRTC to global object;
  global.EZWebRTC = global.EZWebRTC || EZWebRTC;


}(window,io,DetectRTC))



$(document).ready(function() {

    if( !DetectRTC || !DetectRTC.isWebRTCSupported || !DetectRTC.isWebSocketsSupported){
      console.log('EZCall not available - Your browser does not support WebRTC');
    }else{
      $('div.ez-call').show();
      $('div.ez-call .btn').on('click',function(){
        console.log('button works');
        $('div.ez-call .panel-body').slideToggle( "slow", function() {
    // Animation complete.
  });
      });
      //detect async if video and mic are available
      DetectRTC.load(function(){
        //widget starts with video and audio disabled
        if(DetectRTC.hasMicrophone){

            console.log('ready for call')
            //attach call button
            ezWebRTC = EZWebRTC();
        }
        if(DetectRTC.hasWebcam){
          console.log('ready for call')
        }


      });
    }
    console.log( "ready!" );
    console.log($('.panel'));
});
