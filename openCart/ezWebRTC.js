'use explicit';
/* dependencies:
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="http://cdn.webrtc-experiment.com/DetectRTC.js"></script>
*/
//module exports:  EZWebRTC, EZSignal
;(function(global,io,detectRTC){
var key = 'asdlkfjidiasd23;342h'
//private variables not accessible from outside module
var peerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||
                       window.webkitRTCPeerConnection || window.msRTCPeerConnection;
var sessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription ||
                       window.webkitRTCSessionDescription || window.msRTCSessionDescription;

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
                       navigator.webkitGetUserMedia || navigator.msGetUserMedia;


var config = {
        pc: {
          'iceServers': [
            //free turn: create account at http://numb.viagenie.ca/
              {
                urls: 'stun:stun.l.google.com:19302'
              },
              {
                urls: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
              },
              {
                urls: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
              }
          ]
        }
        ,
        socket: {
          url: 'http://localhost:9000',
          opts: {path: '/socket.io-client'}
        }

}

function logError(error) {
  log(error.name + ': ' + error.message);
}



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

//https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/WebRTC_basics
    start:      function (options) {
                    var self     = this,
                        ezSignal = this.ezSignal,
                        pc       = this.setupPC(options);

                    // offer generation triggered by pc.addstream
                    pc.onnegotiationneeded = function () {
                        var remoteOpts = {
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                        };
                        pc.createOffer(function (offer) {
                          pc.setLocalDescription(offer, function () {
                            ezSignal.sendOffer(pc.localDescription);
                          }, logError);
                        }, logError, remoteOpts);
                    }

                    // send any ice candidates to the other peer
                    // Firefox includes ice candidate in sdp
                    pc.onicecandidate = function (evt) {
                      if (evt.candidate){
                        ezSignal.sendICE(evt.candidate);
                        pc.onicecandidate = false; // stop listening
                      }
                    };

                    // once remote stream arrives, show it in the remote video element
                    pc.onaddstream = function (evt) {
                      //remoteView.src = URL.createObjectURL(evt.stream);
                    };
    },//<--start

    startVidoeCall: function(){
                      this.start({ video:false, audio: true });
    },

    startAudioCall: function(){
                      this.start({ video:false, audio: true });
    },

    answer:         function(offer,options){
                      console.log('offer received:',offer);
                      this.setupPC(options);

                      var pc       = this.pc,
                          ezSignal = this.ezSignal;

                      offer = new sessionDescription(offer)
                      pc.setRemoteDescription(offer);

                      pc.createAnswer(function (answer) {
                          pc.setLocalDescription(answer, function() {
                              ezSignal.sendAnswer(pc.localDescription);
                          }, logError);
                      }, logError);
    },

    handleAnswer:   function(answer){
                      console.log('answer received:',answer);
                      answer = new sessionDescription(answer);
                      this.pc.setRemoteDescription(answer, function(){}, logError);
    },

    handleICE:      function(iceCandidate){
                      console.log('ice received',iceCandidate);
                      iceCandidate = new RTCIceCandidate(iceCandidate);
                      this.pc.addIceCandidate(iceCandidate);

    },

    setupPC:        function(options){
                      options = options || {video:false, audio:true};
                      options.video = options.video || false;
                      options.audio = options.audio || false;

                      var pc  = this.pc  = new peerConnection(config.pc);

                      // get a local stream, show it in a self-view and add it to be sent
                      navigator.getUserMedia(options, function (stream) {
                        //selfView.src = URL.createObjectURL(stream);
                        pc.addStream(stream);
                      }, logError);

                      return pc;
    },

    createDataChannel:  function(name,options){
                      name     = name || 'somerandomstringwithoutspaces';
                      optionsn = optins || {};

                      var channel = this.pc.createDataChannel(name, options);
    }

};

//constructor
EZWebRTC.init = function(){
  var self = this;
  this.supports = {
    ezWebRTC:   DetectRTC.isWebRTCSupported &&
                DetectRTC.isWebSocketsSupported,
    webRTC:     DetectRTC.isWebRTCSupported,
    webSockets: DetectRTC.isWebRTCSupported,
  };
  this.ezSignal = new EZSignal(config.socket);
  this.ezSignal.onOffer(function(offer){
    self.answer(offer);
  });
  this.ezSignal.onAnswer(function(answer){
    self.handleAnswer(answer);
  });
  this.ezSignal.onICE(function(candidate){
    self.handleICE(candidate);
  });
};

EZWebRTC.init.prototype = EZWebRTC.prototype;



//Signalling channel requires socket.io
var EZSignal = function(conf){
    var config = conf || config.socket;
    var self = this;
    this.socket = io(config.url,config.opts);
    this.listeners = {};
    this.socket.on('log',function(data){console.log(data);})
    this.socket.on('signal',function(data){
      if(self.listeners[data.type]){
        self.listeners[data.type](data.data);
      }
    });
};

EZSignal.prototype = {

  signal:     function(type,data){
                this.socket.emit('signal',{type:type,data:data});
                this.socket.emit('message',{type:type,data:data});
  },

  sendOffer:  function(offer){
                this.signal('offer',offer);
  },

  sendAnswer: function(answer){
                this.signal('answer',answer);
  },

  sendICE:    function(iceCandidate){
                this.signal('iceCandidate',iceCandidate);
  },

  info:       function(msg){
                //info for server
                this.socket.emit('info',msg);
  },

  on:          function(type,callback){
                this.listeners[type] = callback;
  },

  onOffer:      function(callback){
                  this.listeners.offer = callback;
  },

  onAnswer:       function(callback){
                    this.listeners.answer = callback;
  },

  onICE:        function(callback){
                      this.listeners.iceCandidate = callback;
  }
}



//requires jQuery
var EZCallWidget = function(){
    //load detect, then on document ready show/hide
    var self = this;
    this.ezWebRTC = EZWebRTC();
    $(document).ready(self.initWidget.bind(self));
}

EZCallWidget.prototype = {
    element:      '.ez-call',

    initWidget:     function(){
                      var self      = this,
                          supports  = self.ezWebRTC.supports;
                          ezWebRTC  = self.ezWebRTC;

                      //find dom element and show if browser capable
                      self.$widget = $('.ez-call');
                      if(!supports.ezWebRTC){
                        return console.log('ezCall not available');
                      }
                      self.$widget.show();

                      //detect async supports and enable buttons
                      ezWebRTC.detect(function(){
                        if(supports.videoCalls){

                          self.onClickIcon(function(){
                            ezWebRTC.start();
                          });
                          self.enableVideo();

                        }else if (supports.calls){

                          self.onClickIcon(function(){
                            ezWebRTC.start();
                          });
                          self.enableAudio();

                        }else{

                        }
                      });
                    },

    onClickIcon:    function(listener){
                      this.$widget.find('.ez-call-start').on('click',listener);
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
global.EZWebRTC     = global.EZWebRTC || EZWebRTC;
global.EZCallWidget = global.EZCallWidget || EZCallWidget;


}(window,io,DetectRTC))

ezCallWidget = new EZCallWidget();
