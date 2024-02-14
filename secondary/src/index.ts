import type { Socket } from 'bun';

import { messages } from './store.ts';
import { appendMessage } from './utils.ts';
import type { EventData } from './types.ts';

const { HOSTNAME, WEBSOCKET_HOST, RESPONSE_TIMEOUT } = process.env;

// webserver
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
    return new Response('404!');
  },
  port: 3001,
});

console.log(`Listening on ${server.url}`);

// tcp socket
Bun.connect({
  hostname: WEBSOCKET_HOST || 'localhost',
  port: 8080,
  socket: {
    open(socket) {
      socket.write(JSON.stringify({ route: 'connect', data: { serverId: HOSTNAME || 'secondary', isBlank: !messages.length } }));
      console.log('open socket connection');
    },
    data(socket, data) {
      console.log(data.toString());
      // data.
      const { route, data: newMessage } = JSON.parse(data.toString());

      if (route === 'new') {
        try {
          setTimeout(() => {
            appendMessage(socket, newMessage);
          }, Number(RESPONSE_TIMEOUT) || 10);
        } catch {
          socket.write(JSON.stringify({ route: 'replication', data: { messageId: newMessage.id, status: 'ERROR' } }));
        }
      } else if (route === 'old') {
        messages.push(...newMessage);
        messages.sort((message1, message2) => message1.id - message2.id);

      } else if (route === 'health') {
        socket.write(JSON.stringify({ route: 'health', data: 'pong' }));

      } else if (route === 'retry') {
        appendMessage(socket, newMessage);
      }
    },
    error(socket: Socket<{ serverId: string }>, error: Error): void | Promise<void> {
      console.log(error);
    },
  },
});
