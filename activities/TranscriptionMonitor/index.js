const aws = require('aws-sdk');
var dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10'});
var request = require('request');
const COMPLETED_STATUS = 'completed'; 
exports.handler = (event, context, callback) => {
    console.log("===================== EVENT:",event);
    delete event.status;
    var callSid = event.callSid;
    var accountSid = event.accountSid;
    var timeStampedTranscript;
    var completeTranscript;
    var wordByWordTranscript;
    var uploadCounter = 0;
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
            callback(err);
        } else {
            var transcriptionId = readItem.Item.transcriptionId.S; 
            var url = 'https://speech.googleapis.com/v1/operations/' + transcriptionId + '?key=' + process.env.GOOGLE_API_KEY;
            request.get(url, null, function (err, res, body) {
                if (err)
                    callback(err);
                if (res.statusCode == 200) {
                    body = JSON.parse(body);
                    var progress = body.metadata.progressPercent;
                    if (progress == 100)
                        updateStatus({transcriptionId:transcriptionId,progress:progress,body:body,status:COMPLETED_STATUS});
                    else
                        updateStatus({transcriptionId:transcriptionId,progress:progress,status:"in progress"});
                }
            });

        }
    });

    function updateStatus(input){
        var progress = input.progress;
        var status = input.status;
        var params = {
            TableName:"call",
            Key: {
                "accountSid": { S:accountSid },
                "callSid": { S:callSid }
            },
            UpdateExpression: "set #TranscriptionProgress = :transcriptionProgress",
            ExpressionAttributeNames: {
                "#TranscriptionProgress": "transcriptionProgress"
            },
            ExpressionAttributeValues: {
                ":transcriptionProgress": {S:''+progress}
            },
            ReturnValues:"ALL_NEW"
        };
        dynamodb.updateItem(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                callback(err);
            } else {
                if(status === COMPLETED_STATUS){
                    processTranscription(input);
                }else{
                    callback(null,constructOutput(input));
                }
            }
        });
    }

    function processTranscription(input){
        console.log("==== Processing Transcription");
        var body = input.body;
        var output = "Transcription with Time Intervals: ";
        var finalOutput = "Complete Transcription of the Conference Call: \n\n";
        var wordbyword = "word by word transcription with timestamps: \n\n";
        if (body.response.results != null) {
            for (var i in body.response.results) {
                wordsLength = body.response.results[i].alternatives[0].words.length
                output = output + "\n\nfrom: " + body.response.results[i].alternatives[0].words[0].startTime + " to: " + body.response.results[i].alternatives[0].words[wordsLength - 1].endTime;
                var transcription = body.response.results[i].alternatives[0].transcript;
                output = output + "\n" + transcription;
                finalOutput = finalOutput + transcription;
                for (var k in body.response.results[i].alternatives[0].words) {
                    var starting = body.response.results[i].alternatives[0].words[k].startTime;
                    var ending = body.response.results[i].alternatives[0].words[k].endTime;
                    var spokenWord = body.response.results[i].alternatives[0].words[k].word;
                    wordbyword = wordbyword + "From " + starting + " to " + ending + " - " + spokenWord + "\n\n";
                }
            }
            timeStampedTranscript = output;
            completeTranscript = finalOutput;
            wordByWordTranscript = wordbyword;
            uploadToS3(input);
        }
        else {
            callback(new Error('No transcription received'));
        }

    }
    function uploadToS3(input){
        console.log("======= Uploading to S3");
        const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET+'/'+accountSid+'/'+callSid;
        const FILE_KEY = process.env.FILE_KEY;
        var bucket = new aws.S3({params: {Bucket: AWS_S3_BUCKET}});
        if(uploadCounter < 3){
            var content;
            var key;
            switch(uploadCounter){
                case 0:{
                    content = timeStampedTranscript;
                    key = 'time_stamped_'+FILE_KEY;
                    break;
                }
                case 1:{
                    content = completeTranscript;
                    key = 'complete_'+FILE_KEY;
                    break;
                }
                case 2:{
                    content = wordByWordTranscript;
                    key = 'word_by_word_'+FILE_KEY;
                    break;
                }
            }
            console.log("======== Content:",content);
            console.log("======== Key:",key);
            var options = {
                Key: key,
                Body: content
            };
            bucket.putObject(options, function(err, data){
                if(err)
                    callback(err)
                else{
                    console.log("File Uploaded to S3 Successfully");
                    uploadCounter = uploadCounter + 1;
                    if(uploadCounter === 3){
                        delete input.body;
                        callback(null,constructOutput(input));
                    }else if(uploadCounter<3){
                        uploadToS3(input);
                    }
                }
            });
        }
    }

    function constructOutput(input){
        event.status = input.status;
        if(input.status === COMPLETED_STATUS){
            var data = event;
            console.log("=====+CALL DATA:",data);
            delete data.callSid;
            if(data.call[0]){
                var call = data.call[0];
                delete call.accountSid;
                delete data.call;
                data.call = call;
            }
            if(data.record[0]){
                var record = data.record[0];
                delete record.accountSid;
                delete record.callSid;
                delete data.record;
                record.jobId = data.jobId;
                delete data.jobId;
                data.record = record;
            }
            var transcribe = {
                transcriptionId:input.transcriptionId,
                transcriptionStatus:input.status
            }
            data.transcribe = transcribe;
            delete data.jobId;
            //delete data.status;
            return data;
        }else
            return event;
    }
};

