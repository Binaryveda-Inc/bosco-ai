var aws = require('aws-sdk');
exports.handler = function (event, context,callback) {
   const environment = [
       {
           name:"AWS_ACCESS_KEY_ID",
           value:process.env.JOB_AWS_ACCESS_KEY_ID
       },
       {
           name:"AWS_SECRET_ACCESS_KEY",
           value:process.env.JOB_AWS_SECRET_ACCESS_KEY
       },
       {
           name:"AWS_S3_BUCKET",
           value:process.env.JOB_AWS_S3_BUCKET
       },
       {
           name:"AWS_REGION",
           value:process.env.JOB_AWS_REGION
       },
       {
           name:"ACCOUNT_SID",
           value:event.accountSid
       },
       {
           name:"CALL_SID",
           value:event.callSid
       },
       {
           name:"RECORDING_URL",
           value:event.record[0].recordingUrl
       },
       {
           name:"GOOGLE_CLOUD_BUCKET",
           value:process.env.JOB_GOOGLE_CLOUD_BUCKET
       },
       {
           name:"FILE_KEY",
           value:process.env.JOB_FILE_KEY
       }
    ] ;
   const envContainerOverrides={
        environment:environment
   };
   const params = {
        jobDefinition: process.env.JOB_DEFINITION,
        jobName: process.env.JOB_NAME,
        jobQueue:process.env.JOB_QUEUE,
        containerOverrides: envContainerOverrides || null,
        parameters: event.parameters || null
    };
    // Submit the Batch Job
    new aws.Batch().submitJob(params, (err, data) => {
        if (err) {
            console.error(err);
            const message = 'Error calling SubmitJob for: ${event.jobName}';
            console.error(message);
            callback(message);
        } else {
            const jobId = data.jobId;
            console.log('jobId:', jobId);
            callback(null,jobId);
        }
    });
}


