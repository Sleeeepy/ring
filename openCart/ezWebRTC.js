
/* dependencies:
<script src="https://cdn.socket.io/socket.io-1.3.5.js"></script>
<script src="http://code.jquery.com/jquery-1.11.3.min.js"></script>
<script src="http://cdn.webrtc-experiment.com/DetectRTC.js"></script>
*/
//module exports:  EZWebRTC, EZSignal
;(function(global,io,detectRTC){
'use strict';
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
// Helper functions
function logError(error) {
  console.log(error.name + ': ' + error.message);
}

var errorHandler = function (err) {
    console.error(err);
};

//merges prototypes of child and super object
function inherit(ctor, supCtor){
    for (var prop in supCtor){
        if(!ctor.prototype[prop]){
          ctor.prototype[prop] = supCtor[prop];
        }
    }
}

//Basic EventHandler serving as super class for EZWebRTC
var EventHandler = {

  on:   function(eventName, fn) {
            this.events = this.events || {};
            this.events[eventName] = this.events[eventName] || [];
            this.events[eventName].push(fn);
        },

  off:  function(eventName, fn) {
            this.events = this.events || {};
            if (this.events[eventName]) {
              for (var i = 0; i < this.events[eventName].length; i++) {
                if (this.events[eventName][i] === fn) {
                  this.events[eventName].splice(i, 1);
                  break;
                }
              };
            }
        },

  emit: function(eventName, data) {
            this.events = this.events || {};
            if (this.events[eventName]) {
              this.events[eventName].forEach(function(fn) {
                fn(data);
              });
            }
        }
};




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
    startVideoCall: function(){
                      console.log('starting video call')
                      this.createOffer({ video: true, audio: true });
    },

    startAudioCall: function(){
                      console.log('starting audio call')
                      this.createOffer({ video:false, audio: true });
    },

    createOffer:  function (options) {
                    this.setupPC(options);

                    // offer generation triggered by pc.addstream
                    this.pc.onnegotiationneeded = this.sendOffer.bind(this);
    },


    sendOffer:      function(){
                      var pc       = this.pc,
                          ezSignal = this.ezSignal;

                      var remoteOpts = {
                              offerToReceiveAudio: true,
                              offerToReceiveVideo: true
                      };
                      console.log('in sendOffer')
                      pc.createOffer(function (offer) {
                        pc.setLocalDescription(offer, function () {
                          ezSignal.sendOffer(pc.localDescription);
                        }, logError);
                      }, logError, remoteOpts);
    },

    handleOffer:    function(offer,options){
                        //returns pc, calls sendAnswer on add media
                        this.setupPC(options,this.sendAnswer.bind(this));
                        offer = new sessionDescription(offer)
                        this.pc.setRemoteDescription(offer,function(){},logError);
    },

    sendAnswer:    function(offer){
                      var ezSignal = this.ezSignal,
                          pc       = this.pc;
                      pc.createAnswer(function (answer) {
                          pc.setLocalDescription(answer, function() {
                              ezSignal.sendAnswer(pc.localDescription);
                          }, logError);
                      }, logError);
    },

    handleAnswer:   function(answer){
                      console.log('handling answer')
                      var pc = this.pc;
                      answer = new sessionDescription(answer);
                      pc.setRemoteDescription(answer, function(){}, errorHandler);
    },

    handleICE:      function(iceCandidate){
                      iceCandidate = new RTCIceCandidate(iceCandidate);
                      this.pc.addIceCandidate(iceCandidate);
                      //make sure pc exists!!!!!!!!!!
    },

    setupPC:        function(options,callback){
                      options = options || {video:true, audio:true};

                      var self = this;
                      var pc   = this.pc  = new peerConnection(config.pc),
                          ezSignal = this.ezSignal;


                      console.log('here');

                      // send any ice candidates to the other peer
                      // Firefox includes ice candidate in sdp
                      pc.onicecandidate = function (evt) {
                        if (!evt.candidate){return}
                        ezSignal.sendICE(evt.candidate);
                        pc.onicecandidate = false; // stop listening
                      };
                      // once remote stream arrives, show it in the remote video element
                      pc.onaddstream = function (evt) {
                        self.emit('remoteStream',evt.stream);
                      };
                      // get a local stream, show it in a self-view and add it to be sent
                      navigator.getUserMedia(options, function (stream) {
                        self.emit('localStream',stream);
                        pc.addStream(stream);
                        if(callback){callback();}
                      }, logError);

                      return pc;
    }

};


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
    startVideoCall: function(){
                      console.log('starting video call')
                      this.createOffer({ video: true, audio: true });
    },

    startAudioCall: function(){
                      console.log('starting audio call')
                      this.createOffer({ video:false, audio: true });
    },

    initPC:         function(){
                      var self = this;
                      var pc   = this.pc  = new peerConnection(config.pc),
                          ezSignal = this.ezSignal;

                      // send any ice candidates to the other peer
                      // Firefox includes ice candidate in sdp
                      pc.onicecandidate = function (evt) {
                        if (!evt.candidate){return}
                        ezSignal.sendICE(evt.candidate);
                        pc.onicecandidate = false; // stop listening
                      };
                      // once remote stream arrives, show it in the remote video element
                      pc.onaddstream = function (evt) {
                        console.log('onaddstream');
                        self.emit('remoteStream',evt.stream);
                      };

                      pc.onsignalingstatechange = function(event){
                        console.log('signaling state: ', pc.signalingState);
                        if (pc.signalingState=='stable'){
                        //  self.addMedia();
                        }
                      };

                      pc.oniceconnectionstatechange = function(event){
                        console.log('ICE connection state change',pc.iceConnectionState)
                        console.log(event);
                      }


                      return pc;

    },

    createOffer:    function (){
                      console.log('creatingoffer')
                      var pc       = this.initPC(),
                          ezSignal = this.ezSignal;

                      var options = {
                              offerToReceiveAudio: true,
                              offerToReceiveVideo: true
                      };

                      this.addMedia({audio:true},function(){
                          pc.createOffer(function (offer) {
                              pc.setLocalDescription(offer, function() {
                                ezSignal.sendOffer(pc.localDescription);
                              }, errorHandler);
                          }, errorHandler, options);//onicechange
                      });

    },

    createAnswer:   function(offer){
                      console.log('Creating answer')
                      offer = new sessionDescription(offer);
                      var pc      = this.initPC(),
                          ezSignal = this.ezSignal;

                      pc.setRemoteDescription(offer);

                      this.addMedia({audio:true},function(){
                        pc.createAnswer(function (answer) {
                          console.log('answercreated',answer)
                          pc.setLocalDescription(answer, function() {
                            ezSignal.sendAnswer(pc.localDescription);
                          }, errorHandler);
                        }, errorHandler);
                      }

                      );


    },

    addMedia:       function(options,callback){
                      options = options || {audio:true, video:false};
                      var self = this,
                          pc   = this.pc;
                      console.log('addMedia')
                      navigator.getUserMedia(options, function (stream) {
                        self.emit('localStream',stream);
                        pc.addStream(stream);
                        if(callback)callback();
                      }, logError);
    },

    handleAnswer:   function(answer){
                      console.log('handling answer')
                      var pc = this.pc;
                      answer = new sessionDescription(answer);
                      pc.setRemoteDescription(answer, function(){}, errorHandler);
    },

    handleICE:      function(iceCandidate){
                      console.log('handling ICE',this.pc);
                      iceCandidate = new RTCIceCandidate(iceCandidate);
                      this.pc.addIceCandidate(iceCandidate);
                      //make sure pc exists!!!!!!!!!!
    },

    createDataChannel:  function(name,options){
                      name     = name || 'somerandomstringwithoutspaces'+new Date();
                      options = options || {};
                      var pc = this.pc;

                      var channel = this.channel = pc.createDataChannel(name, options);
                      console.log('channel',channel);
                      channel.onmessage = function (event) {
                      console.log("received: " + event.data);
                    };

                    channel.onopen = function () {
                      console.log("datachannel open");
                    };

                    channel.onclose = function () {
                      console.log("datachannel close");
                    };
    }

};



inherit(EZWebRTC,EventHandler);

//constructor
EZWebRTC.init = function(){
  this.supports = {
    ezWebRTC:   DetectRTC.isWebRTCSupported && DetectRTC.isWebSocketsSupported,
    webRTC:     DetectRTC.isWebRTCSupported,
    webSockets: DetectRTC.isWebRTCSupported,
  };
  var ezSignal = this.ezSignal = new EZSignal(config.socket);
  //ezSignal.onOffer(this.handleOffer.bind(this));
  //ezSignal.onAnswer(this.handleAnswer.bind(this));
  ezSignal.onOffer(this.createAnswer.bind(this));
  ezSignal.onAnswer(this.handleAnswer.bind(this));
  ezSignal.onICE(this.handleICE.bind(this));
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
        console.log('signal received: ',data.type);
        self.listeners[data.type](data.data);
      }
    });
};

EZSignal.prototype = {

  signal:     function(type,data){
                this.socket.emit('signal',{type:type,data:data});
                //this.socket.emit('message',{type:type,data:data});
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
    console.log('widget constr'
    )
    //load detect, then on document ready show/hide
    var self = this;
    this.ezWebRTC = EZWebRTC();
    this.ezWebRTC.on('localStream',self.addLocal.bind(this));
    this.ezWebRTC.on('remoteStream',self.addRemote.bind(this));
    $(document).ready(self.initWidget.bind(self));
}

EZCallWidget.prototype = {
    element:      '.ez-call',

    initWidget:     function(){
                      console.log('initwidget')
                      var self      = this,
                          supports  = self.ezWebRTC.supports,
                          ezWebRTC  = self.ezWebRTC;

                      //find dom element and show if browser capable
                      self.$widget = $('.ez-call');
                      if(!supports.ezWebRTC){
                        return console.log('ezCall not available');
                      }
                      self.$widget.show();
                      var second;
                      //detect async supports and enable buttons
                      ezWebRTC.detect(function(){
                        if(second){return}
                        second = true;
                        console.log('detectedwebrtc')
                        if(supports.videoCalls){

                          self.onClickIcon(function(){
                            console.log('adding click event')
                            ezWebRTC.startVideoCall();
                          });
                          self.enableVideo();

                        }else if (supports.calls){

                          self.onClickIcon(function(){
                            ezWebRTC.startAudioCall();
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
                      this.$widget.find('.remoteVideo').attr('src', URL.createObjectURL(stream));
                    },
    addLocal:       function(stream){

                      this.$widget.find('.localVideo').attr('src', URL.createObjectURL(stream));



                    },


}


/*
var Child = function(name){
  EventHandler.call(this);
  this.name = name;
}

Child.prototype.sayName = function(){
    console.log('my name is ' + this.name);
  }

inherit(Child,EventHandler)


var child = new Child('elamr');
console.log(child)

child.on('sayname',child.sayName.bind(child));
child.emit('sayname');*/
//expose EZWebRTC to global object;
global.EZWebRTC     = global.EZWebRTC || EZWebRTC;
global.EZCallWidget = global.EZCallWidget || EZCallWidget;


}(window,io,DetectRTC))

var ezCallWidget = new EZCallWidget();
