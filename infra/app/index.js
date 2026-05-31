const http = require('http');

const PORT = process.env.PORT || 8080;
const COMPUTE = process.env.COMPUTE_TYPE || 'unknown';

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    const response = JSON.stringify({ status: 'ok', compute: COMPUTE });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(response);
  } else if (req.method === 'POST' && req.url === '/echo') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        payload.compute = COMPUTE;
        const response = JSON.stringify(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(response);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    });
  } else {
    const response = JSON.stringify({ error: 'not found' });
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(response);
  }
});

server.listen(PORT, () => {
  console.log(`listening on :${PORT}`);
});
