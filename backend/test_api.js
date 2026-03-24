const http = require('http');

const checkHealth = () => {
  http.get('http://localhost:5000/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Health Check Status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('Server is running properly.');
      }
    });
  }).on('error', (err) => console.log('Error hitting health endpoint:', err.message));
};

const testWebhook = () => {
    const postData = JSON.stringify({});
    const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/mpesa/callback?token=wrong_token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Webhook test with wrong token status (should be 401):', res.statusCode);
        });
    });
    req.write(postData);
    req.end();
};

checkHealth();
setTimeout(testWebhook, 1000);
