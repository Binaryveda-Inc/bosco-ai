var aws = require('aws-sdk');
var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
const stepfunctions = new aws.StepFunctions();
exports.handler = function (event, context,callback) {
   var accountSid = event.AccountSid;
   var callSid = event.CallSid; 
   var recordingSid = event.RecordingSid;
   var recordingDuration = event.RecordingDuration;
   var recordingUrl = event.RecordingUrl;
   var recordingChannels = event.RecordingChannels;
   var recordingStatus = event.RecordingStatus;
   var params = {
        TableName:"call",
        Key: {
            "accountSid": { S:accountSid },
            "callSid": { S:callSid }
        },
        UpdateExpression: "set #RecordingSid = :recordingSid,#RecordingDuration = :recordingDuration,#RecordingUrl = :recordingUrl,#RecordingStatus = :recordingStatus",
        ExpressionAttributeNames: {
            "#RecordingSid": "recordingSid",
            "#RecordingDuration": "recordingDuration",
            "#RecordingUrl": "recordingUrl",
            "#RecordingStatus": "recordingStatus"
        },
        ExpressionAttributeValues: {
            ":recordingSid": {S:recordingSid},
            ":recordingDuration": {S:recordingDuration},
            ":recordingUrl": {S:recordingUrl},
            ":recordingStatus": {S:recordingStatus}
        },
        ReturnValues:"ALL_NEW"
    };
    dynamodb.updateItem(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data));
            if(data.Attributes.recordActivityToken!== undefined){
                if(recordingStatus === 'completed'){
                    var params = {
                        output:JSON.stringify({callSid:callSid,accountSid:accountSid,recordingStatus:recordingStatus,recordingUrl:recordingUrl,recordingDuration:recordingDuration}), /* required */
                        taskToken: data.Attributes.recordActivityToken.S /* required */
                    };
                    console.log("=============Sending task success:",params);
                    stepfunctions.sendTaskSuccess(params, function(err, data) {
                            if (err) console.log(err, err.stack); // an error occurred
                            else     console.log(data);           // successful response
                    });
                }
            }else
                console.log("=============Task Token Not Present");
        }
    });
    callback(null,event);
};
