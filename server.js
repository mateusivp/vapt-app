const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Normalize URL by removing query string and trailing slash
  let url = req.url.split('?')[0];
  if (url.endsWith('/') && url.length > 1) {
    url = url.slice(0, -1);
  }
  
  // If URL is '/', serve index.html
  if (url === '/') {
    url = '/index.html';
  }
  
  // Get the file path
  const filePath = path.join(__dirname, url);
  
  // Get the file extension
  const ext = path.extname(filePath);
  
  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    
    // Read the file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('500 Internal Server Error');
        return;
      }
      
      // Set the content type
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});