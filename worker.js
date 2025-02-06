import { createServer } from 'http';
import { createRequestListener } from './index.js';

// Create an adapter for the Express app to work in Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    // Set environment variables from Cloudflare
    process.env.NODE_ENV = env.NODE_ENV || 'production';
    process.env.RESEND_API_KEY = env.RESEND_API_KEY;
    process.env.PORT = env.PORT || 3001;
    process.env.RATE_LIMIT_WINDOW_MS = env.RATE_LIMIT_WINDOW_MS || 900000;
    process.env.RATE_LIMIT_MAX_REQUESTS = env.RATE_LIMIT_MAX_REQUESTS || 100;

    // Create the Express request listener
    const listener = await createRequestListener();

    // Create a new server instance
    const server = createServer(listener);

    // Convert the incoming Cloudflare Worker request to a Node.js request
    const url = new URL(request.url);
    const nodeRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: request.redirect,
    });

    // Handle the request using the Express app
    return new Promise((resolve, reject) => {
      let responseBody = [];
      const nodeResponse = {
        statusCode: 200,
        headers: {},
        write: (chunk) => {
          responseBody.push(chunk);
        },
        end: () => {
          const response = new Response(responseBody.join(''), {
            status: nodeResponse.statusCode,
            headers: nodeResponse.headers,
          });
          resolve(response);
        },
        setHeader: (name, value) => {
          nodeResponse.headers[name] = value;
        },
      };

      try {
        listener(nodeRequest, nodeResponse);
      } catch (error) {
        reject(error);
      }
    });
  },
}; 