import { messages } from './store.ts';
import { socket } from './tcpsocket.ts';

// webserver
const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    console.log(`[HTTP] received ${method} request on ${url.pathname}`);
    switch (method) {
      case 'GET': {
        if (url.pathname === '/') {
          return new Response(JSON.stringify(messages));
        }
        break;
      }
    }
    return new Response('404!');
  },
  port: 3001,
});

console.log(`Listening on ${server.url}`);
socket.then(() => console.log('socket is healthy'));

