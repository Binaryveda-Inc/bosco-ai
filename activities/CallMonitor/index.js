var async = require('async');
const aws = require('aws-sdk');
var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
const stepfunctions = new aws.StepFunctions();
const STATUS_TRIGGERED="triggered";
const STATUS_COMPLETED="completed";
const STATUS_FAILED="failed";
exports.handler = (event, context, callback) => {
    var noActivitiesFound = false;
    var errMsg = '';
    var taskParams = {
        activityArn: 'arn:aws:states:us-east-1:778358982262:activity:CallMonitoring'
    };
    // async.whilst(
    //     function() {
    //         console.log("============= Check Condition:",noActivitiesFound);
	// 	    return (noActivitiesFound === false); 
    //     },
	//     function(cb){
            stepfunctions.getActivityTask(taskParams, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    errMsg = 'An error occured while calling getActivityTask.';
                    noActivitiesFound = true;
                    callback(errMsg);
                    //cb(errMsg);
                } else {
                    if (data === null || data.taskToken === undefined) {
                        // No activities scheduled
                        errMsg = 'No activities received after 60 seconds.';
                        noActivitiesFound = true;
                        callback(errMsg);
                        //cb(errMsg);
                    }else{
                        console.log('------------------ Event:',event);
                        console.log('------------------ Data:',data);
                        var input = JSON.parse(data.input);
                        var accountSid = input.accountSid;
                        var callSid = input.callSid; 
                        var readParams = {
                            TableName:"call",
                            Key: {
                                "accountSid": { S:accountSid },
                                "callSid": { S:callSid }
                            }
                        };
                        dynamodb.getItem(readParams, function(err, readItem) {
                            if (err) {
                                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                                callback(errMsg);
                                //cb(err);
                            } else {
                                console.log("Read item:", JSON.stringify(readItem, null, 2));
                                if(readItem.Item.callStatus.S === STATUS_TRIGGERED){
                                    var updateParams = {
                                        TableName:"call",
                                        Key: {
                                            "accountSid": { S:accountSid },
                                            "callSid": { S:callSid }
                                        },
                                        UpdateExpression: "set #ActivityToken = :activityToken",
                                        ExpressionAttributeNames: {
                                            "#ActivityToken": "callActivityToken"
                                        },
                                        ExpressionAttributeValues: {
                                            ":activityToken": { S:data.taskToken }
                                        },
                                        ReturnValues:"UPDATED_NEW"
                                    };
                                    dynamodb.updateItem(updateParams, function(err, updatedItem) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                            callback(errMsg);
                                            //cb(err);
                                        } else {
                                            console.log("Updated item:", JSON.stringify(updatedItem));
                                            //callback(null,updatedItem);
                                            callback(null,input);
                                            //cb();
                                        }
                                    });
                                }else{
                                    if(readItem.Item.callStatus.S === STATUS_COMPLETED){
                                         var params = {
                                            output:JSON.stringify({callSid:callSid,accountSid:accountSid,callStatus:readItem.Item.callStatus.S}), /* required */
                                            taskToken: data.taskToken /* required */
                                        };
                                        console.log("=============Sending task success:",params);
                                        stepfunctions.sendTaskSuccess(params, function(err, stepData) {
                                            if (err){
                                                console.log(err, err.stack); // an error occurred
                                                callback(err);
                                                //cb(err);
                                            }
                                            else{
                                                console.log(stepData);           // successful response
                                                callback(null,input);
                                                //cb();
                                            }
                                        });
                                    }else{
                                        var params = {
                                            taskToken: data.taskToken /* required */
                                        };
                                        console.log("=============Sending task failure:",params);
                                         stepfunctions.sendTaskFailure(params, function(err, stepData) {
                                            if (err){
                                                console.log(err, err.stack); // an error occurred
                                                callback(err);
                                                //cb(err);
                                            }
                                            else{
                                                console.log(stepData);           // successful response
                                                callback(null,input);
                                                //cb();
                                            }
                                        });
                                    }
                                }
                            }
                        });
                        
                    }
                    
                }

            })
    //     } ,
    //     function (err) {
    //         if(err)
	//             console.log(err, err.stack);
    //     }
    // );
    
};

