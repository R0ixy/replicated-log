import { type ServerWebSocket } from 'bun';

import { secondariesList, replicationHistory } from './store.ts';
import { ee, replicateAllData, replicateMissingData } from './utils.ts';

import type { ACKMessage } from './types.ts';

const webSocketInstance = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req,
      {
        data: {
          serverId: new URL(req.url).searchParams.get('serverId'),
          isBlank: new URL(req.url).searchParams.get('isBlank'),
        }
      }
    );
    return success
      ? undefined
      : new Response("WebSocket upgrade error", { status: 400 });
  },
  websocket: {
    open(ws: ServerWebSocket<{ serverId: string, isBlank: boolean }>) {
      ws.subscribe('replication');

      const { serverId, isBlank } = ws.data;
      secondariesList.push(serverId)
      console.log(`new client [${serverId}] connected to websocket`);
      if (isBlank) replicateAllData({ webSocketInstance, replicationHistory, serverId });
      else replicateMissingData({ webSocketInstance, replicationHistory, serverId });
    },
    message(ws: ServerWebSocket<{ serverId: string }>, message) {
      const { serverId } = ws.data;
      const messageString = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const newMessage: ACKMessage = JSON.parse(messageString);

      console.log(`new ACK from ${serverId} for message ${newMessage.messageId}`);
      const servers = replicationHistory.get(newMessage.messageId);
      replicationHistory.set(newMessage.messageId, [...(servers ? servers : []), serverId])

      ee.emit(`ack-${serverId}-${newMessage.messageId}`, newMessage.status); // using ack-{serverId}-{messageId}
    },
    close(ws: ServerWebSocket<{ serverId: string }>) {
      ws.unsubscribe('replication');

      const { serverId } = ws.data;
      const index = secondariesList.findIndex((item) => item === serverId);
      secondariesList.splice(index, 0);
      console.log(`client [${serverId}] disconnected from websocket`)
    }
  },
  port: 8000,
});

console.log(`Websocket is live on ws://localhost:${webSocketInstance.port}`);

export { webSocketInstance };
