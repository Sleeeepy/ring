var i;

var peerConnection =  mozRTCPeerConnection
                      || webkitRTCPeerConnection;


var connection  = new peerConnection({
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
});
var sdpConstraints ={
            offerToReceiveAudio: false,
            offerToReceiveVideo: true
        };

connection.createOffer(getOfferSDP, onFailure, sdpConstraints);
function getOfferSDP(offerSDP) {
    connection.setLocalDescription(offerSDP);

    console.log('offer sdp', offerSDP.sdp);
    console.log('type',      offerSDP.type);

    //send offerSDP to peer via socket.io
};

function onFailure(err){
  console.log('failed to create offer:', err);
}



//socket.io.on('offer')
// "setRemoteDescription" is quickly called for answerer
var remoteSessionDescription = new RTCSessionDescription(offerSDP);
connection.setRemoteDescription(remoteSessionDescription);

connection.createAnswer(getAnswerSDP, onfailure, sdpConstraints);
function getAnswerSDP(answerSDP) {
    connection.setLocalDescription(answerSDP);

    console.log('answer sdp', answerSDP.sdp);
    console.log('type',       answerSDP.type);
    //send answerSDP to peer via socket.io
};
