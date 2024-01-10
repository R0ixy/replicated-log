import { once } from 'node:events';

import { webSocketInstance } from './websocket.ts';
import { ee, secondariesIdList, messages } from './utils.ts';

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
          const data = await req.json();
          const newItem = { id: crypto.randomUUID(), ...data }
          messages.push(newItem);

          webSocketInstance.publish('replication', JSON.stringify(newItem));
          const [acknowledgements] = await Promise.all(secondariesIdList.map(async (id) => once(ee, `ack-${id}`)));
          console.log('all ACK received')

          if (acknowledgements.every((ack) => ack === 'ACK')) {
            return new Response(JSON.stringify(newItem));
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
