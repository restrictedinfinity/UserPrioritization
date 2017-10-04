'use strict';

/*constants & configuration*/
const waitingRoomTTL = 60; //TTL in seconds for waiting room
const waitingRoomCookieTTL = 'x-lambda-edge-waiting-room-ttl=';

const returningUserCookieName = 'x-lambda-edge-returning-user=';
const returningUserCookieHash = 'TuPI0BSORUulC+bcQClIPhP/klRTB4Ypu6Hwk5mr0oc=';
const premiumUserCookieName = 'x-lambda-edge-premium-user=';
const premiumUserCookieHash = 'w9h4uRpLlx24w4LqznqBo5oR7dh3qjUFlWrLZ3CqCeM=';

/* Percentage of newer users allowed*/
//TODO: Periodically refresh capacityConfiguration variable by making remote network calls to S3.
const capacityConfiguration = 0.2;


exports.handler = (event, context, callback) => {
    var request = event.Records[0].cf.request;
    
    if(capacityConfiguration < 0) { //
    	/*Server overloaded. Redirect everyone to waiting room, do not send any traffic to origin.*/
    	console.log("Capacity overloaded. User redirected to waiting-room.");
    	callback(null, getHTTPRedirectResponse( {status:307,
    		statusDescription:'Temporary Redirect',
    		redirectLocation: 'http://www.waiting-room.com',
    		setCookie: waitingRoomCookieTTL + ': ' + getCookieTTL(),
    		body: 'Origin Overloaded, Re-try Later'}));
    } else if (capacityConfiguration == 100){
    	/*Allow everyone.*/
    	console.log("No capacity restriction. User let through.");
    	callback(null, request);
    } else {
    	/*Allow returning user, and any premium user. And allow only a ratio of new users users defined by capacityConfiguration.*/
    	if (isCookieSet(request.headers, returningUserCookieName, returningUserCookieHash) || 
    		isCookieSet(request.headers, premiumUserCookieName, premiumUserCookieHash)) {
    		console.log("Premium or Returning user let through. Capacity set at " + capacityConfiguration);
    		callback(null, request);
    	} else {
    	/*Toss coin, to decide the fate. The user is neither premium, nor returning.*/
    		let coinToss = Math.random();
    		console.log("Toss " + coinToss + ", at capacity " + capacityConfiguration);
    		if(/*!isUserStillWaiting(request) && */ coinToss <= capacityConfiguration) { //If the user is not supposed to be waiting, toss a coin.
    			/*Selected, allow them*/
    			console.log("Selected in lottery, new user let through");
				callback(null, request);
    		} else {
    			/*Not selected, redirect them to waiting room.*/
    			console.log("Not selected in lottery, new user redirected to waiting room");
    			callback(null, getHTTPRedirectResponse({status:307,
		    		statusDescription:'Temporary Redirect',
		    		redirectLocation: "http://www.waiting-room.com",
		    		setCookie: waitingRoomCookieTTL + ': ' + getCookieTTL(),
		    		body: 'Origin Overloaded, Re-try Later'}));
		    }
    	}
    }
};

function isCookieSet(headers, cookieName, cookieValue) {
	var returningUser = false;
    console.log("looking for cookie:" + cookieName + ", with val:" + cookieValue);

	if (headers.cookie) { // if the cookies are set	
        for (let cookie of headers.cookie) { // list through all the cookies
            console.log("in cookie:" + JSON.stringify(cookie));
            if(cookie.value.trim().startsWith(cookieName)) { //to find the cookie with the cookieName argument
                try {
                    let value = cookie.value.trim().substring(cookieName.length); //extract the value for cookie which match cookieName argument
                    if(value === cookieValue) { //check if the value of this cookie matches cookieValue argument
                    	console.log("found: " + cookieName + "," + cookieValue);
                        returningUser = true; //cookieName and cookieValue matched
                    }
                } catch (err) {
                    console.log("Errored parsing cookie" + cookie.value + "with error" + err.message);
                    //continue over to next cookie
                }
            } else {
            	console.log(", and it does not matche cookie name");
            }
        }
    }
    return returningUser;
}

function getCookieTTL() {
	return (new Date()).getTime()/1000 + waitingRoomTTL; //set TTL as now + waitingRoomTTL in seconds
}

/*TODO: Implement the logic to check if the user is still supposed to be waiting (now < TTL for waitingRoomCookieTTL)*/
function isUserStillWaiting(request) {
	return false; //Allow user to return the pool for selection.
}

const getHTTPRedirectResponse = (args) => {
  return {
    "status": args.status,
    "statusDescription": args.statusDescription,
    "headers": {
      "vary": [
        {
          "key": "Vary",
          "value": "*"
        }
      ],
      "location": [
      	{
      		"key": "Location",
      		"value": args.redirectLocation
      	}
      ],
      "set-cookie": [
      	{
      		"key": "set-cookie",
      		"value": args.setCookie
      	}
      ]
    },
    "body": args.body
  };
}