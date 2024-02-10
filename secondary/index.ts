import { messages, type eventData } from './utils.ts';
import { appendMessage } from "./utils.ts";

const { HOSTNAME, WEBSOCKET_HOST, RESPONSE_TIMEOUT } = process.env;

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

const socket = new WebSocket(`ws://${WEBSOCKET_HOST || 'localhost'}:8000?serverId=${HOSTNAME || 'secondary'}&isBlank=${Boolean(messages.length)}`);

socket.addEventListener("open", event => {
  console.log('open socket connection');
});
socket.addEventListener("message", event => {
  console.log(event.data);
  const messageString = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
  const newMessageData: eventData = JSON.parse(messageString);
  const { route, data: newMessage } = newMessageData;

  if (route === 'new') {
    try {
      setTimeout(() => {
        appendMessage(socket, newMessage);
      }, Number(RESPONSE_TIMEOUT) || 10);
    } catch (err) {
      socket.send(JSON.stringify({ route: 'replication', messageId: newMessage.id, status: 'ERROR' }));
    }

  } else if (route === 'old') {
    messages.push(newMessage);
    messages.sort((message1, message2) => message1.id - message2.id);

  } else if (route === 'health') {
    socket.send(JSON.stringify({ route: 'health', data: 'pong' }));

  } else if (route === 'retry') {
    appendMessage(socket, newMessage);
  }
});

