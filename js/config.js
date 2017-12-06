/**
 * 初始化rtc配置和回调
 */
function initRtcConfig() {

    //视频流id
    localVideoId = 'localVideo';
    remoteVideoId = 'remoteVideo';

    //配置媒体信息和回调处理
    mediaConfiguration = {
        constraints: {video: true, audio: true},
        onsuccess: function (localMediaStream) {
            console.log('get user media success', localMediaStream);
        },
        onerror: function (event) {
            console.log('get user media error', event);
        }
    };

    //配置socket连接回调
    socketConfiguration = {
        socketServerUrl: 'wss://webos.cloudsplus.com.cn:443/mywebrtc/websocket?clientKey=' + macCallFrom,
        onerror: function (event) {
            console.log('get websocket error', event);
        },
        onclose: function () {
            console.log('websocket is closed');
        },
        onmessage: function (msg) {
            console.log('websocket message come in', msg);
        },
        onopen: function (event) {
            console.log('websocket connected', event);
        }
    };

    //配置点对点连接回调
    peerConfiguration = {
        stream: null,
        constraints: {video: true, audio: true},
        onICE: function (candidate) {
            console.log("coming ==== onicecandidate", candidate);
        },
        onRemoteStream: function (remoteMediaStream) {
            console.log('Enter socket addRemoteStream event');
        },
        onRemoteStreamEnded: function (remoteMediaStream) {
            console.log('Remote stream end', remoteMediaStream);
        },
        onOfferSDP: function (offerSDP) {
            console.log('Offer Sdp started', offerSDP);
        },
        onAnswerSDP: function (answerSDP) {
            console.log('Offer Sdp answer', answerSDP);
        },
        onSdpError: function (e) {
            console.error('onSdpError:', e);
        },
        onOfferData: function () {
            //提供相应的通信数据
            provideOfferData && provideOfferData();
        }
    };
};
