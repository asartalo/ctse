const http = require('http');
const ip = require('ip'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = function createServer(port) {
  const server = http.createServer((req, res) => {
    const body = '<html><body><p>This page is just for testing</p></body></html>';
    const contentLength = Buffer.byteLength(body);
    res.writeHead(200, {
      'Content-Length': contentLength,
      'Content-Type': 'text/html',
    });
    res.end(body);
  });

  const host = ip.address();
  const url = `http://${host}:${port}/`;

  return {
    url,
    start: () => server.listen(port),
    stop: () => {
      if (server) {
        server.close();
      }
    },
  };
};
