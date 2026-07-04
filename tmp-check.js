const app = require('./server');
const http = require('http');
const server = app.listen(3105, () => {
  http.get('http://127.0.0.1:3105/css/style.css', (res) => {
    console.log('status', res.statusCode);
    console.log('content-type', res.headers['content-type']);
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log('preview', data.slice(0, 200));
      server.close();
    });
  });
});
