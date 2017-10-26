FROM node:7
ENV AWS_ACCESS_KEY_ID=AKIAJDDUZ3UNLCMZVDWA \
    AWS_SECRET_ACCESS_KEY=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 \
    AWS_S3_BUCKET=bosco-mail-bucket \
    AWS_REGION=us-east-1 \
    ACCOUNT_SID=AC3bc65caef7dd2c0c478471c98d18a48b \
    CALL_SID=CA3eef302a3703fd7a0a6ab30ec81b115c \
    RECORDING_URL=https://api.twilio.com/2010-04-01/Accounts/AC3bc65caef7dd2c0c478471c98d18a48b/Recordings/REffa33a4f13e3728bf232630203428bf8 \
    GOOGLE_CLOUD_BUCKET=bosco-recording-bucket \
    FILE_KEY=recording.wav
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm start