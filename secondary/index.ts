import { messages, type eventData } from './utils.ts';

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
  const messageString = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
  const newMessageData: eventData = JSON.parse(messageString);
  const { route, serverId, data: newMessage } = newMessageData;

  if (route === 'new') {
    setTimeout(() => {
      if (!messages.at(newMessage.id)) { // ensure messages deduplication
        messages.push(newMessage);

        if (messages.length !== newMessage.id) { // reorder messages in case of inconsistent total order
          messages.sort((message1, message2) => message1.id - message2.id);
        }
        socket.send(JSON.stringify({ messageId: newMessage.id, status: 'ACK' }));
      }
    }, Number(RESPONSE_TIMEOUT) || 10);

  } else if (route === 'old' && serverId && serverId === HOSTNAME) {
    messages.push(newMessage);
    messages.sort((message1, message2) => message1.id - message2.id);
  }
  if (!serverId || serverId === HOSTNAME) {
    console.log(event.data);
  }
});

