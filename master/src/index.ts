import { once } from 'node:events';

import { socket } from './tcpsocket.ts';
import { secondaries, messages } from './store.ts';
import { getHealthStatuses, startRetryProcess, prepareMessageToSend, getWriteConcernValue } from './utils.ts';
import { ee } from './eventEmitter.ts';

import type { ReqBody } from './types.ts';

const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    console.log(`[HTTP] received ${method} request on ${url.pathname}`);
    switch (method) {
      case 'GET': {
        if (url.pathname === '/') {
          const messagesString = JSON.stringify(messages);
          console.log(`[HTTP] response for ${method} request on ${url.pathname}: ${messagesString}`);
          return new Response(messagesString);
        }
        if (url.pathname === '/health') {
          const result = getHealthStatuses(Date.now());

          return new Response(JSON.stringify(result));
        }
        break;
      }
      case 'POST': {
        if (url.pathname === '/') {
          // check if there is quorum
          const health = getHealthStatuses(Date.now());
          const numberOfHealthy = Object.values(health).filter(item => item === 'healthy').length;
          if (numberOfHealthy + 1 < Math.floor(secondaries.size + 1 / 2)) {
            console.log(`[HTTP] response for ${method} request on ${url.pathname}: 'Error: no quorum'`)
            return new Response(JSON.stringify('Error: no quorum')); // if no quorum - return appropriate message
          }

          const data: ReqBody = await req.json();
          const { message, w } = data;
          const newMessage = { id: messages.length + 1, message };
          messages.push(newMessage);

          ee.emit('set-write-concern', { messageId: newMessage.id, writeConcern: getWriteConcernValue(w, secondaries.size) });

          secondaries.forEach(socket => socket.write(prepareMessageToSend('new', newMessage)));
          startRetryProcess(1, newMessage);

          if (!!w && w - 1 > secondaries.size) {
            // if there is not enough secondaries, when a new node will connect, all messages will be replicated automatically
            // From alive nodes we wait for ack as well
            await Promise.all([once(ee, `${w - 1}-servers-online`), once(ee, `ack-${newMessage.id}`)]);
            return new Response(JSON.stringify(newMessage));
          }

          if (w === 1) { // if w === 1, it means we don't care about status of replication. Can respond immediately
            console.log(`[HTTP] response without ACK for message ${newMessage.id}`);
            return new Response(JSON.stringify(newMessage));
          }

          await once(ee, `ack-${newMessage.id}`);

          console.log(`[HTTP] response after ${w ? w - 1 : secondaries.size} ACK for message ${newMessage.id}`);
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
