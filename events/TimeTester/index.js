
exports.handler = function (event, context,callback) {
    // var bucket = event.bucketName;
    // var key = event.key;
    // function getMailText(cb){
    //     console.log("-------------- Bucket:",bucket);
    //     console.log("-------------- Key:",key);
    //     s3.getObject({Bucket: bucket, Key: key}, function(err, data) {
    //         var meeting = {};
    //         if (err) {
    //             console.log("Error getting object " + key + " from bucket " + bucket +
    //                 ". Make sure they exist and your bucket is in the same region as this function.");
    //             cb(err)      
    //         } else {
    //             let parser = new mailparser.MailParser();
    //             var bufferStream = new stream.PassThrough();
    //             bufferStream.end(data.Body);
    //             bufferStream.pipe(parser);
    //             parser.on('headers', headers => {
    //                 if(headers.get("from")!==undefined)
    //                     meeting.initiator = headers.get("from").value;
    //                 if(headers.get("to")!==undefined)
    //                     meeting.invitees = headers.get("to").value;
    //                 if(headers.get("reply-to")!==undefined)
    //                     meeting.owner = headers.get("reply-to").value;
    //                 parser.on('data', body => {
    //                     if(body.type === 'text'){
    //                         //meeting.bodyText = body.text.replace(/\r?\n/g, " ");;
    //                         meeting.bodyText = body.text;
    //                         cb(null,meeting);
    //                     }
    //                 });
    //             });
    //         }
    //     });
    // }

    // function extractPhoneNo(meeting,cb){
    //     if(meeting.bodyText!==undefined){
    //         const phoneRegex = new RegExp(
    //         "\\b(dial|call|join|phone)[^'+]*(\\+?[0-9]{1,2}\\s?.?-?\\(?[0-9]{3}\\)?\\s?.?-?[0-9]{3}\\s?.?-?[0-9]{4})","gmi");  
    //         var text = meeting.bodyText;
    //         var matches, phone = [];
    //         while (matches = phoneRegex.exec(text)) {
    //             console.log('================= Keyword:',matches[1]);
    //             console.log('================= Match:',matches[2]);
    //             phone.push(matches[2]);
    //         }   
    //         meeting.phone = phone;
    //         cb(null,meeting);
    //     }else{
    //         cb("Could not extract body text for mail");
    //     }

    // }

    // function extractDate(meeting,cb){
    //     if(meeting.bodyText!==undefined){
    //         const dateRegex = new RegExp(
    //         "(\\d{0,2}?[a-z]{0,2}?\\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s?\\d{1,2}\\,?\\s?[0-9]{2,4})\\b","gmi");
    //         var text = meeting.bodyText;
    //         var matches=[];
    //         var date;
    //         while (matches = dateRegex.exec(text)) {
    //             console.log('================= Keyword:',matches[2]);
    //             console.log('================= Match:',matches[1]);
    //             if(matches[1]!==undefined){
    //                 date =matches[1];
    //                 break;
    //             }
    //         }
    //         if(date === undefined)
    //             cb("Could not extract date");
    //         else{
    //             meeting.date = date.trim();
    //             cb(null,meeting);
    //         }
    //     }else{
    //         cb("Could not extract body text for mail");
    //     }

    // }

    //  function extractTime(meeting,cb){
    //     if(meeting.bodyText!==undefined){
    //         const timeRegex = new RegExp("((\\d{1,2}(:|.)\\d{1,2}\\s?(am|pm))\\b.*)","gmi");  
    //         var text = meeting.bodyText;
    //         var matches=[];
    //         var time;
    //         var timeString;
    //         console.log('================= Time Text:',text);
    //         while (matches = timeRegex.exec(text)) {
    //             console.log('================= TimeString:',matches[1]);
    //             console.log('================= Time:',matches[2]);
    //             if(matches[1]!==undefined){
    //                 timeString =matches[1];
    //             }
    //             if(matches[2]!==undefined){
    //                 time = matches[2];
    //             }
    //             if(timeString!==undefined && time!==undefined){
    //                 break;
    //             }
    //         }
    //         if(time === undefined)
    //             cb("Could not extract time");
    //         else{
    //             meeting.time = time.trim();
    //             if(timeString === undefined)
    //                 cb("Could not extract time string");
    //             else{
    //                 meeting.timeString = timeString.trim();
    //                 cb(null,meeting);
    //             }
    //         }
    //     }else{
    //         cb("Could not extract body text for mail");
    //     }

    // }

    // function extractTimezone(meeting,cb){
    //     request.post(GOOGLE_NLP_ENDPOINT+GOOGLE_API_KEY,
	// 		{ 
    //             json: {
	// 				"document": {
	// 					"type":"PLAIN_TEXT",
	// 					"language": "EN",
	// 					"content": meeting.timeString.replace(/\s/g, ",")
	// 				},
	// 				"encodingType":"UTF8",
	// 			} 
	// 		},
	// 		function (error, response, body) {
    //             if(error||response.statusCode!==200){
    //                 cb("Could not extract timezone for mail");
    //             }else{
    //                 var entities = body.entities;
    //                 entities.forEach(entity => {
    //                     console.log(entity.name);
    //                     if(entity.type === 'LOCATION'){
    //                         meeting.timezone = entity.name;
    //                         break;
    //                     }
    //                 });
    //                 if(meeting.timezone === undefined){
    //                     cb("Could not extract timezone for mail");
    //                 }else
    //                     cb(null,meeting);
    //             }
    //         });
    // }

    // async.waterfall([
    //     getMailText,
    //     extractPhoneNo,
    //     extractDate,
    //     extractTime,
    //     extractTimezone
    // ], function (err, result) {
    //     console.log('========== Async Err:',err);
    //     console.log('========== Async Result:',result);
    //     // result now equals 'done'
    // });
var moment = require('moment-timezone');   
// var newYork    = moment.tz("2014-06-01 12:00", "America/New_York"); 
// var mumbai = newYork.clone().tz("India/Mumbai");
// console.log("=======FORMAT is:",mumbai.format());
// console.log("=======UTC is:",mumbai.utc());
// console.log("=======ISO is:",mumbai.toISOString());  
var localTime = moment('12 March, 2016 05:03 pm', ['DDMMMMY HH:mm a', 'MMMMDDY HH:mm a']).utcOffset("-05:30").format('YYYY-MM-DDTHH:mm:ss')+'Z';
console.log("=========== Time1:",localTime); 
}


