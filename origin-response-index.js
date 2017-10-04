'use strict';

/*constants & consifuration*/
const waitingRoomTTL = 60; //TTL in seconds for waiting room
const waitingRoomCookieTTL = 'x-lambda-edge-waiting-room-ttl=';

//returning user-cookie will be set if the reuqest is selected in lottery (i.e for 200 response, and not 3xx/4xx/5xx response).
const returningUserCookieName = 'x-lambda-edge-returning-user=';
const returningUserCookieHash = 'TuPI0BSORUulC+bcQClIPhP/klRTB4Ypu6Hwk5mr0oc=';

//the premium user cookie will be set by origin, based on user infromation.
const premiumUserCookieName = 'x-lambda-edge-premium-user=';
const premiumUserCookieHash = 'w9h4uRpLlx24w4LqznqBo5oR7dh3qjUFlWrLZ3CqCeM=';

exports.handler = (event, context, callback) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    
    if (response.status=200) { 
    //set cookie to identify subsequent requests from user who was selected in lottery.
        headers["cookie"] = [{
            key: "Cookie",
            value: returningUserCookieName + returningUserCookieHash,
        }];
        
        //the premium user cookie will be set by origin, based on user infromation.
    }

    callback(null, response);
};
