var aws = require('aws-sdk');
var twilio = require('twilio');
var queryString = require('querystring');
var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
var STATUS_TRIGGERED="triggered";
const TWILIO_SID="AC3bc65caef7dd2c0c478471c98d18a48b";
const TWILIO_AUTH_TOKEN = "1c5904176d20a764f530e14c801f015f";
const BOSCO_NUMBER = "+12132973841";
exports.handler = function (event, context,callback) {
    var toNumber = event.phone[0];
    var fromNumber = BOSCO_NUMBER;
    var client = new twilio(TWILIO_SID,TWILIO_AUTH_TOKEN);
    twimlSettingsUrl = "https://handler.twilio.com/twiml/EH01c18dccadaeb56b2dbf9d59b7a7c0a1";
    client.calls.create(
        {
          url: twimlSettingsUrl,
          method: "GET",
          to: toNumber,
          from: fromNumber,
          statusCallback:'https://1bvd8rzsx8.execute-api.us-east-1.amazonaws.com/dev/status',
          statusCallbackMethod: 'POST',
          statusCallbackEvent: [
                                // 'queued',
                                // 'initiated',
                                //  'ringing',
                                //  'busy',
                                //  'in-progress',
                                //  'no-answer',
                                //  'cancelled', 
                                //  'answered',
                                 'failed',
                                 'completed'
                                ]
        },
        function (err, call) {
          if (err) {
            console.log(err);
            callback("Error");
          } else {
            	var params = {
                TableName:"call",
                Item:{
                    "callSid" : { S:call.sid},
                    "accountSid" : { S:call.accountSid},
                    "from" : { S:call.from},
                    "to" : { S:call.to},
                    "callStatus":{ S:STATUS_TRIGGERED }
                }
            };
            dynamodb.putItem(params, function(err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(data, null, 2));
                }
            });
            event.callSid = call.sid;
            event.accountSid = call.accountSid;
            callback(null,event);
          }
        }
      );
};
