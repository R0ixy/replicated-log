import { messages } from './utils.ts';

const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    switch (method) {
      case 'GET': {
        if (url.pathname === '/') {
          return new Response(JSON.stringify(messages));
        }
        break;
      }
    }
    return new Response("404!");
  },
  port: 3001,
});

console.log(`Listening on ${server.url}`);

const socket = new WebSocket(`ws://${process.env.WEBSOCKET_HOST || 'localhost'}:8000`);

socket.addEventListener("open", event => {
  console.log('open socket connection');
});
socket.addEventListener("message", event => {
  console.log(event.data);

  setTimeout(() => {
    const messageString = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
    messages.push(JSON.parse(messageString));
    socket.send('ACK');
  }, Number(process.env.RESPONSE_TIMEOUT) || 10);
});

