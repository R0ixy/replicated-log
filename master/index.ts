import { once } from 'node:events';

import { webSocketInstance } from './websocket.ts';
import { secondariesList, messages } from './store.ts';
import { ee, nResolve } from './utils.ts';

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
        break;
      }
      case 'POST': {
        if (url.pathname === '/') {
          const data: ReqBody = await req.json();
          const { message, w } = data;
          const newMessage = { id: messages.length + 1, message };
          messages.push(newMessage);

          webSocketInstance.publish('replication', JSON.stringify({ route: 'new', data: newMessage })); // TODO: send route and message
          if (w === 1) { // if w === 1 means we don't care about status of replication. Can respond immediately
            console.log(`response without ACK for message ${newMessage.id}`)
            return new Response(JSON.stringify(newMessage));
          }

          let acknowledgements: string[];
          if (w) {
            acknowledgements = await nResolve(secondariesList.map(async (id) => once(ee, `ack-${id}-${newMessage.id}`)), w - 1);

          } else { // if write concern is not specified we wait for all ACK
            [acknowledgements] = await Promise.all(secondariesList.map(async (id) => once(ee, `ack-${id}-${newMessage.id}`)));
          }
          console.log(`${acknowledgements.length} ACK for message ${newMessage.id} received`);

          if (acknowledgements.every((ack) => ack === 'ACK')) {
            return new Response(JSON.stringify(newMessage));
          } else {
            throw new Error("replication error");
          }

        }
        break
      }
    }
    return new Response("404!");
  },
  port: 3000,
});

console.log(`Listening on ${server.url}`);
