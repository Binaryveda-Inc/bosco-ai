var aws = require('aws-sdk');
var moment = require('moment');
var ses = new aws.SES({});
const FROM = process.env.FROM_EMAIL;
const BASE_S3_URL = 'https://s3.amazonaws.com/';
const AWS_S3_BUCKET=process.env.AWS_S3_BUCKET;
const RECORDING_FILE_KEY=process.env.RECORDING_FILE_KEY;
const TRANSCRIPT_FILE_KEY=process.env.TRANSCRIPT_FILE_KEY;
const FULL_TRANSCRIPT_KEY="complete_"+TRANSCRIPT_FILE_KEY;
const TIME_TRANSCRIPT_KEY="time_stamped_"+TRANSCRIPT_FILE_KEY;
const WORD_TRANSCRIPT_KEY="word_by_word_"+TRANSCRIPT_FILE_KEY;
exports.handler = function (event, context,callback) {
    var accountSid = event.accountSid;
    var callSid = event.call.callSid;
    var toArr = [];
    for(var i=0;i<event.initiator.length;i++){
        toArr.push(event.initiator[i].address);
    }
    var utcTime = moment.utc(event.timeUtc);
    var localTime = moment(utcTime).local();
    var subject = 'Notes from Bosco: '+localTime.format('DD MMMM, Y HH:mm a');
    var body = "<html><font color=black>Hello, <br><br></font></html>"
    + "<html><font color=black> I have recorded the following notes from the meeting.<br><br></font></html>"
    + "<html><font color=black><b>Call Recording</b> is <a href='"+BASE_S3_URL+"/"+AWS_S3_BUCKET+"/"+accountSid+"/"+callSid+"/"+RECORDING_FILE_KEY+"'>here</a> <br><br></font></html>"
    + "<html><font color=black><b>Full Transcript</b> is <a href='"+BASE_S3_URL+"/"+AWS_S3_BUCKET+"/"+accountSid+"/"+callSid+"/"+FULL_TRANSCRIPT_KEY+"'>here</a> <br><br></font></html>"
    + "<html><font color=black><b>Timestamped Transcript</b> is <a href='"+BASE_S3_URL+"/"+AWS_S3_BUCKET+"/"+accountSid+"/"+callSid+"/"+TIME_TRANSCRIPT_KEY+"'>here</a> <br><br></font></html>"
    + "<html><font color=black><b>Word by Word Transcript</b> is <a href='"+BASE_S3_URL+"/"+AWS_S3_BUCKET+"/"+accountSid+"/"+callSid+"/"+WORD_TRANSCRIPT_KEY+"'>here</a> <br><br></font></html>"
    + "<html><font color=black>Thanks,<br></font></html>"
    + "<html><font color=black>bosco.ai</font></html></font></html>"
    ses.sendEmail( { 
            Source: FROM, 
            Destination: { ToAddresses: toArr },
            Message: {
                Subject: {
                    Data: subject
                },
                Body: {
                    Html: {
                        Data: body
                    }
                }
            }
        }
        , function(err, data) {
            if(err){
                callback(err);
            } else
                callback(null,event);
    });
};
