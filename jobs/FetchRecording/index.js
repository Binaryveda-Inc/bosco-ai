var async = require('async');
var fs = require('fs'),
request = require('request');
var AWS = require('aws-sdk')
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const CALL_SID = process.env.CALL_SID;
const RECORDING_URL = process.env.RECORDING_URL;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET+'/'+ACCOUNT_SID+'/'+CALL_SID;
const GOOGLE_CLOUD_BUCKET = process.env.GOOGLE_CLOUD_BUCKET;
const FILE_KEY = process.env.FILE_KEY;

console.log("AccountSID:",process.env.ACCOUNT_SID);
console.log("CallSID:",process.env.CALL_SID);
console.log("RecordingUrl:",process.env.RECORDING_URL);

var r = request(RECORDING_URL+'.wav');
  r.on('response', function(resp) {
      if (resp.statusCode === 200) {
          var download_stream = fs.createWriteStream('./'+FILE_KEY);
          download_stream.on('close', fileDownloadedToLocal);
          r.pipe(download_stream);
      }
      else {
          //cb(new Error('error: '+resp.statusCode));
          console.log("File Downloaded Failed");
      }
  });

function fileDownloadedToLocal(){
  console.log("File Downloaded Successfully");
  async.waterfall([
      uploadFileToS3,
      uploadToGoogleCloud,
      submitForTranscription,
      updateDynamoDB
  ], function (err, result) {
      if(err){
        console.log('========== Job done with error:',err);
      }else{
          console.log('========== Job completed successfully:',result);
      }
  });     
}

function uploadFileToS3(cb){
  var bucket = new AWS.S3({params: {Bucket: AWS_S3_BUCKET}});
  fs.readFile("./"+FILE_KEY, function(err, data){
    if (err) {
      return cb(err);
    }
    var options = {
      Key: FILE_KEY,
      Body: data
    };
    bucket.putObject(options, function(err, data){
      if(err)
        cb(err)
      else{
        console.log("File Uploaded to S3 Successfully");
        cb(null,data);
      }
    });
  });
}

function uploadToGoogleCloud(model,cb){
  const Storage = require("@google-cloud/storage");
  const storage = Storage({
    projectId: 'central-ruler-135923',
    keyFilename: './google_cloud_credentials.json'
  })
  const bucket = storage.bucket(GOOGLE_CLOUD_BUCKET);
  var filename = './'+FILE_KEY;
  bucket.upload(filename,{ destination:ACCOUNT_SID+'/'+CALL_SID+'/'+FILE_KEY}, function (err, data) {
      if (err)
          cb(err);
      else {
          fs.unlink(filename);
          console.log("File Uploaded to Google Cloud Successfully");
          cb(null,'https://storage.googleapis.com/'+GOOGLE_CLOUD_BUCKET+'/'+ACCOUNT_SID+'/'+CALL_SID+'/'+FILE_KEY);
      }
  });
}

function submitForTranscription(gcsPublicUrl,cb){
  const Speech = require('@google-cloud/speech');
  const speech = Speech({
    projectId: 'central-ruler-135923',
    keyFilename: './google_cloud_credentials.json'
  });
  const config = {
    enableWordTimeOffsets: true,
    encoding: 'LINEAR16',
    sampleRateHertz: 8000,
    languageCode: 'en-US'
  };
  const audio = {
    uri: 'gs://'+GOOGLE_CLOUD_BUCKET+'/'+ACCOUNT_SID+'/'+CALL_SID+'/'+FILE_KEY
  };
  const request = {
    config: config,
    audio: audio
  };
  speech.longRunningRecognize(request, function (error, data) {
      if (error)
          cb(error);
      else {
          if (data.latestResponse.name != null) {
              console.log("File Submitted For Transcription Successfully:",data.latestResponse.name);
              cb(null,data.latestResponse.name);
          }
      }
  });


  // speech.longRunningRecognize(request)
  // .then((data) => {
  //   const operation = data[0];
  //   console.log("File Submitted For Transcription Successfully:",data);
  //   // Get a Promise representation of the final result of the job
  //   return operation.promise();
  // })
  // .then((data) => {
  //   const response = data[0];
  //   const transcription = response.results.map(result =>
  //       result.alternatives[0].transcript).join('\n');
  //   console.log("File Transcribed Successfully");
  //   cb(null,transcription);
  // })
  // .catch((err) => {
  //   cb(err);
  // });
}

function updateDynamoDB(operationId,cb){
  var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
   var params = {
        TableName:"call",
        Key: {
            "accountSid": { S:ACCOUNT_SID },
            "callSid": { S:CALL_SID }
        },
        UpdateExpression: "set #TranscriptionId = :transcriptionId",
        ExpressionAttributeNames: {
            "#TranscriptionId": "transcriptionId"
        },
        ExpressionAttributeValues: {
            ":transcriptionId": {S:operationId}
        },
        ReturnValues:"ALL_NEW"
    };
    dynamodb.updateItem(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            cb(err);
        } else {
            cb(null,data);
        }
    });
}
// For fetch url :


// for upload File :
// fus3.init(function(){
//   fus3.uploadFile(absoluteFilePath, 'my_key', 
//     function(err, data){
//     console.log('file uploaded to S3!');
//     console.log(data);
//   });
// });