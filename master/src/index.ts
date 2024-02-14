import { once } from 'node:events';

import { socket } from './websocket.ts';
import { secondaries, messages } from './store.ts';
import { getHealthStatuses, startRetryProcess } from './utils.ts';
import { ee } from './eventEmitter.ts';

import type { ReqBody } from './types.ts';

const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    switch (method) {
      case 'GET': {
        if (url.pathname === '/') {
          return new Response(JSON.stringify(messages));
        }
        if (url.pathname === '/health') {
          const result = getHealthStatuses(Date.now());

          return new Response(JSON.stringify(result));
        }
        break;
      }
      case 'POST': {
        if (url.pathname === '/') {
          const data: ReqBody = await req.json();
          const { message, w } = data;
          const newMessage = { id: messages.length + 1, message };
          messages.push(newMessage);

          secondaries.forEach(socket => socket.write(JSON.stringify({ route: 'new', data: newMessage })));
          ee.emit('set-write-concern', { messageId: newMessage.id, writeConcern: w ? w - 1 : secondaries.size });

          startRetryProcess(1, newMessage);

          if (w === 1) { // if w === 1, it means we don't care about status of replication. Can respond immediately
            console.log(`response without ACK for message ${newMessage.id}`);
            return new Response(JSON.stringify(newMessage));
          }

          await once(ee, `ack-${newMessage.id}`);
          console.log(`all ${w ? w - 1 : secondaries.size} ACKs for message ${newMessage.id} received`);

          return new Response(JSON.stringify(newMessage));

        }
        break;
      }
    }
    return new Response('404!');
  },
  port: 3000,
});

console.log(`Listening on ${server.url}`);
console.log(`Socket is live on ${socket.hostname}:${socket.port}`);
