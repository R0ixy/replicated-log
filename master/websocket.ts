import { type ServerWebSocket } from 'bun';

import { ee, secondariesIdList } from './utils.ts';
import type { ACKMessage } from './types.ts';

const webSocketInstance = Bun.serve({
  fetch(req, server) {
    const serverId = crypto.randomUUID();
    const success = server.upgrade(req, { data: { serverId } });
    return success
      ? undefined
      : new Response("WebSocket upgrade error", { status: 400 });
  },
  websocket: {
    open(ws: ServerWebSocket<{ serverId: string }>) {
      ws.subscribe("replication");

      const { serverId } = ws.data;
      secondariesIdList.push(serverId)
      console.log(`new client [${serverId}] connected to websocket`)
    },
    message(ws: ServerWebSocket<{ serverId: string }>, message) {
      const { serverId } = ws.data;
      const messageString = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const newMessage: ACKMessage = JSON.parse(messageString);
      console.log(`new ACK from ${serverId} for message ${newMessage.messageId}`);

      ee.emit(`ack-${serverId}-${newMessage.messageId}`, newMessage.status); // using ack-{serverId}-{messageId}
    },
    close(ws: ServerWebSocket<{ serverId: string }>) {
      ws.unsubscribe('replication');

      const { serverId } = ws.data;
      const index = secondariesIdList.findIndex((item) => item === serverId);
      secondariesIdList.splice(index, 0);
      console.log(`client [${serverId}] disconnected from websocket`)
    }
  },
  port: 8000,
});

console.log(`Websocket is live on ws://localhost:${webSocketInstance.port}`);

export { webSocketInstance };
