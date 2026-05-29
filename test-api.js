#!/usr/bin/env node

const http = require('http');

const data = JSON.stringify({
  streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  format: 'mp3',
  quality: 'medium',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/convert',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    console.log('Response Body:', JSON.parse(responseData));

    // Poll status every 2 seconds
    const jobId = JSON.parse(responseData).jobId;
    console.log(`\nPolling status for job: ${jobId}\n`);

    const pollStatus = setInterval(() => {
      const statusReq = http.get(`http://localhost:3000/api/status/${jobId}`, (statusRes) => {
        let statusData = '';
        statusRes.on('data', (chunk) => {
          statusData += chunk;
        });
        statusRes.on('end', () => {
          const job = JSON.parse(statusData);
          console.log(`Status: ${job.status} | Progress: ${job.progress}%`);
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(pollStatus);
            console.log('\nFinal job details:', job);
            process.exit(0);
          }
        });
      });
    }, 2000);

    // Stop polling after 60 seconds
    setTimeout(() => {
      clearInterval(pollStatus);
      console.log('\nTest completed (timeout)');
      process.exit(0);
    }, 60000);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(data);
req.end();
