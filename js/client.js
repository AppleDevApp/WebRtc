$(function () {

    //初始化配置和媒体视频
    callingSys.initialRtc();

    //绑定相关事件处理
    $('#goBoth').on('click', function () {
        $('#conferenceRoom').show();

        //通信的地址两端(大堂机-终端机)
        var macCallFromAddr = '38:D5:47:B6:2E:7A';
        var macCallToAddr = '440106B083@7c:5c:f8:c7:92:8c';
        callingSys.makeCall(macCallFromAddr, macCallToAddr);
    });


});

/**
 * 重写该方法，提供相应数据
 * @returns {null}
 */
function provideOfferData() {
    // var visitInfo = {
    //     visitNum: 0,
    //     imgUrl: 'http://139.196.148.111/utfp/images/card/other/2017-12-06/1000/27a488c6368647b198fb.jpg',
    //     visitId: '89b43e05601b4e6dbfb95cc704472dbb',
    //     visitType: 1
    // };
    return generalTestVisit();
}

function generalTestVisit() {
    var visitInfo = {};
    $.ajax({
        type: "post",//发送方式
        url: "uploadOtherCard",// 路径/action
        data: {
            "baseImgStr": 'utfp/images/card/other/2017-12-06/1000/27a488c6368647b198fb.jpg',
            "companyId": '100008982',
            "visitNum": 1,
            "macAddr": macCallFrom
        },
        async: false, //
        success: function (backInfo) {
            console.log('访客信息返回', backInfo);
            visitInfo.visitNum = 1;
            visitInfo.imgUrl = backInfo.imgUrl;
            visitInfo.visitId = backInfo.visitorId;
            visitInfo.visitType = 1;
        },
        error: function (err) {
            console.log("生成访客信息错误", err);
        }
    });
    return visitInfo;
}