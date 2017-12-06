//浏览器兼容
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
window.PeerConnection = window.PeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCPeerConnection;
window.SessionDescription = window.SessionDescription || window.RTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription;
window.IceCandidate = window.IceCandidate || window.RTCIceCandidate || window.mozRTCIceCandidate || window.RTCIceCandidate;

//设置默认的配置信息
window.defaults = {
    iceServers: {
        "iceServers": [{
            "url": "stun:106.14.57.41"
        }, {
            "url": "turn:106.14.57.41",
            "credential": "bobodada123",
            "username": "bobo"
        }, {
            "url": "stun:139.224.195.240"
        }, {
            "url": "turn:139.224.195.240",
            "credential": "bobodada123",
            "username": "bobo"
        }]
    },
    constraints: {video: true, audio: true}
};

//视频流承载
var localStream;
var remoteStream;
var websocket;

//视频元素id
var localVideoId;
var remoteVideoId;

//通信媒体配置
var mediaConfiguration;
var socketConfiguration;
var peerConfiguration;
var rtcConnect;

//通信的地址两端(大堂机-终端机)
var macCallFrom;
var macCallTo;

var webRtc = {
    /**
     * 初始化本地呼叫视频流
     * @param options 媒体配置
     */
    initiateLocalMedia: function (options) {
        //默认使用的媒体类型
        webRtc.getUserMedia(options);
    },
    /**
     * 初始化websocket通道连接
     * @param options 连接配置
     */
    initSocket: function (options) {
        websocket = new WebSocket(options.socketServerUrl);

        websocket.onerror = function (err) {
            console.log('Websocket connect error', err);
            options.onerror && options.onerror(err);
        };

        websocket.onclose = function () {
            console.log('Websocket connect close');
            options.onclose && options.onclose();
        };

        websocket.onopen = function (event) {
            console.log('Websocket connect open', event);
            // webRtc.keepAlive(event);
            webRtc.readyForCall();
            options.onopen && options.onopen(event);
        };

        websocket.onmessage = function (event) {
            console.log('Websocket connect on message', event);
            webRtc.handleMsg(event);
            options.onmessage && options.onmessage(event);
        };

        websocket.push = websocket.send;
        websocket.send = function (data) {
            websocket.push(JSON.stringify(data));
        };
    },
    /**
     * 获取媒体设备流
     * @param options
     */
    getUserMedia: function (options) {
        navigator.getUserMedia(options.constraints || window.defaults.constraints,
            function (stream) {
                webRtc.addLocalStream(stream);
                options.onsuccess && options.onsuccess(stream);
            }, options.onerror);
    },
    /**
     * 本地视频音频流，承载对象来展示
     * @param stream 本地音频视频流
     */
    addLocalStream: function (stream) {
        console.log('Enter socket addLocalStream event');
        localStream = stream;
        webRtc.configVideoStream(localVideoId, localStream);
    },
    /**
     * 维持心跳的消息传递
     */
    keepAlive: function () {
        websocket.push("~");
    },
    /**
     * 消息处理
     * @param event 服务器发来的消息
     */
    handleMsg: function (event) {
        console.log("RTC对话内容：" + event);
        var json = JSON.parse(event.data);
        //如果是一个ICE的候选，则将其加入到PeerConnection中，否则设定对方的session描述为传递过来的描述
        if (json.event === "__ice_candidate") {
            console.log("__ice_candidate");
            rtcConnect.addice(json.data.candidate);
        } else if (json.event === "__pre_answer") {
            console.log("__pre_answer");
            rtcConnect.onanswer(json.data.sdp);
        } else if (json.event === "__answer") {
            console.log("__answer");
        } else if (json.event === "__result") {
            console.log("对方操作返回", json);
            rtcConnect.close();
        }
    },
    close: function () {
        websocket.close();
    },
    /**
     * 发出请求
     */
    readyForCall: function () {
        //初始化点对点连接
        peerConfiguration.stream = localStream;
        rtcConnect = RTCPeerConnection(peerConfiguration);
        //发出连接申请
        rtcConnect.createOffer();
    },
    /**
     * 为指定的视频加载流
     * @param elementId 元素id
     * @param mediaStream 视频流
     */
    configVideoStream(elementId, mediaStream) {
        var videoElement = document.getElementById(elementId);
        videoElement.onloadedmetadata = function (e) {
            console.log("Label: " + mediaStream.label);
            console.log("AudioTracks", mediaStream.getAudioTracks());
            console.log("VideoTracks", mediaStream.getVideoTracks());
        };

        videoElement.src = window.URL.createObjectURL(mediaStream, null, null);
    }
};


var RTCPeerConnection = function (options) {

    var iceServers = options.iceServers || defaults.iceServers;
    var constraints = options.constraints || defaults.constraints;

    var peerConnection = new PeerConnection(iceServers);

    peerConnection.onicecandidate = onicecandidate;
    peerConnection.onaddstream = onaddstream;
    if (options.stream) {
        peerConnection.addStream(options.stream);
    }

    function onicecandidate(event) {
        if (!event.candidate || !peerConnection) return;
        websocket.send(iceMessage(event.candidate));
        if (options.onICE) options.onICE(event.candidate);
    }

    function onaddstream(event) {
        var remoteMediaStream = event.stream;
        console.debug('on:add:stream', remoteMediaStream);
        remoteMediaStream.onended = function () {
            if (options.onRemoteStreamEnded) options.onRemoteStreamEnded(remoteMediaStream);
        };

        remoteStream = remoteMediaStream;
        webRtc.configVideoStream(remoteVideoId, remoteMediaStream);
        options.onRemoteStream && options.onRemoteStream(remoteMediaStream);
    }

    function createOffer() {
        if (!options.onOfferSDP) return;

        peerConnection.createOffer(function (sessionDescription) {
            peerConnection.setLocalDescription(sessionDescription);
            websocket.send(offerMessage(sessionDescription));
            options.onOfferSDP(sessionDescription);
        }, options.onSdpError, constraints);
    }

    return {
        /* offerer got answer sdp; MUST pass sdp over this function */
        onanswer: function (sdp) {
            peerConnection.setRemoteDescription(new SessionDescription(sdp));
            options.onAnswerSDP(sdp);
        },

        /* got ICE from other end; MUST pass those candidates over this function */
        addice: function (candidate) {
            peerConnection.addIceCandidate(new IceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));
        },
        createOffer: createOffer,
        // createAnswer: createAnswer,
        close: function () {
            console.log('Peer Connection Close');
            peerConnection.close();
        }
    };
};

//消息通信
var iceMessage = function (candidate) {
    return {
        "from": macCallFrom,
        "to": macCallTo,
        "event": "__ice_candidate",
        "data": {
            "candidate": candidate
        }
    };
};

//申请消息，带附加信息
var offerMessage = function (sessionDescription) {
    console.log("----发起视频", sessionDescription);
    sessionDescription.sdp = sessionDescription.sdp.replace(/UDP\/TLS\//g, "");

    var msgData = {
        "sdp": sessionDescription
    };
    if (peerConfiguration.onOfferData) {
        var offerData = peerConfiguration.onOfferData();
        msgData = Object.assign(msgData, offerData);
    }

    return {
        "from": macCallFrom,
        "to": macCallTo,
        "event": "__offer",
        "data": msgData
    }
};

var callingSys = {
    /**
     * 初始化rtc配置和本地视频流
     */
    initialRtc: function () {
        //初始化配置
        initRtcConfig();

        //本地媒体配置
        webRtc.initiateLocalMedia(mediaConfiguration);
    },
    /**
     * 进行呼叫
     * @param fromAddress 本机mac地址 '38:D5:47:B6:2E:7A'
     * @param toAddress 楼宇号+@+目标mac地址 '440106B083@7c:5c:f8:c7:92:8c'
     */
    makeCall: function (fromAddress, toAddress) {
        macCallFrom = fromAddress;
        macCallTo = toAddress;
        //初始化websocket通道
        webRtc.initSocket(socketConfiguration);
    }
};