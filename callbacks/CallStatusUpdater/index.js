var aws = require('aws-sdk');
var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
const stepfunctions = new aws.StepFunctions();
exports.handler = function (event, context,callback) {
   var accountSid = event.AccountSid;
   var callSid = event.CallSid; 
   var status = event.CallStatus;
   var duration = event.CallDuration;
   var to = event.To;  
   var from = event.From;  
   var params = {
        TableName:"call",
        Key: {
            "accountSid": { S:accountSid },
            "callSid": { S:callSid }
        },
        UpdateExpression: "set callStatus = :callStatus",
        ExpressionAttributeValues: {
            ":callStatus": { S:status }
        },
        ReturnValues:"ALL_NEW"
    };
    dynamodb.updateItem(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data));
            if(data.Attributes.callActivityToken.S !== undefined){
                if(status === 'completed'){
                    var params = {
                        output:JSON.stringify({callSid:callSid,accountSid:accountSid,callStatus:status,callDuration:duration}), /* required */
                        taskToken: data.Attributes.callActivityToken.S /* required */
                    };
                    console.log("=============Sending task success:",params);
                    stepfunctions.sendTaskSuccess(params, function(err, data) {
                            if (err) console.log(err, err.stack); // an error occurred
                            else     console.log(data);           // successful response
                    });
                }else if(status === 'failed'){  
                    var params = {
                        taskToken: data.Attributes.callActivityToken.S /* required */
                    };
                    console.log("=============Sending task failure:",params);
                    stepfunctions.sendTaskFailure(params, function(err, data) {
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
