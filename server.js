import { createServer } from 'http';
import { createServerEntry } from './dist/server/index.js';

const port = process.env.PORT || 3000;

// Create a Node.js HTTP server from the Cloudflare Worker handler
const server = createServer(async (req, res) => {
  try {
    // Create a Cloudflare-like Request object for the worker
    const url = new URL(req.url, `http://${req.headers.host}`);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
    });

    // Call the worker handler
    const response = await createServerEntry(request);

    // Send response back
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
