import { type ServerWebSocket } from 'bun';

import { secondaries, replicationHistory, healthStatuses, ackCache, messages } from './store.ts';
import { ee, getHealthStatuses, replicateAllData, replicateMissingData, sendHeartbeat } from './utils.ts';
import type { ACKMessage, EventMessage } from './types.ts';

const interval: { [serverId: string]: Timer } = {};

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

      // add server id to list
      const { serverId, isBlank } = ws.data;
      secondaries.set(serverId, ws);

      // replicate missing data if any
      if (isBlank) replicateAllData({ ws, replicationHistory, serverId });
      else replicateMissingData({ ws, replicationHistory, serverId });

      // start sending hearth beats
      interval[serverId] = setInterval(() => {
        sendHeartbeat(ws);
      }, 3000);

      console.log(`new client [${serverId}] connected to websocket`);
    },
    message(ws: ServerWebSocket<{ serverId: string }>, message) {
      const { serverId } = ws.data;
      const messageString = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const newMessage: ACKMessage = JSON.parse(messageString);

      if (newMessage.route === 'replication' || newMessage.route === 'retry') {

        ee.emit('ack-message', { serverId, messageId: newMessage.messageId, status: newMessage.status });

        console.log(`new ACK from ${serverId} for message ${newMessage.messageId}`);

      } else if (newMessage.route === 'health') {
        // set current time as last time when server was healthy
        healthStatuses[serverId] = Date.now();
      }
    },
    close(ws: ServerWebSocket<{ serverId: string }>) {
      ws.unsubscribe('replication');

      // remove server from the list
      const { serverId } = ws.data;
      secondaries.delete(serverId);

      // reset health status
      healthStatuses[serverId] = 0;
      // clear hearth beat process
      clearInterval(interval[serverId]);

      console.log(`client [${serverId}] disconnected from websocket`);
    }
  },
  port: 8000,
});

console.log(`Websocket is live on ws://localhost:${webSocketInstance.port}`);

ee.addListener('ack-message', (message: EventMessage) => {
  const { serverId, messageId, status } = message;

  if (status === 'ACK') { // replicated successfully
    const history = replicationHistory.get(messageId);
    if (history?.length) {
      // if this message has history it means we have already received number of ack that meets a write concern.
      // This ack is just an extra one, so we need to add it to history and that's it
      replicationHistory.set(messageId, [serverId, ...history])

    } else { // otherwise add this message to ackCache until we will receive a sufficient number of ack
      const messageData = ackCache.get(messageId);
      if (messageData && messageData?.writeConcern <= messageData?.ack.length + 1) { // check if number of ack meets write concern
        // sending an event about getting all ack
        ee.emit(`ack-${messageId}`, status)

        // adding this message to replication history only after receiving number of ack that will meet a write concern
        replicationHistory.set(messageId, [serverId, ...messageData?.ack]);
        // clear message data form ackCache
        ackCache.delete(messageId);
      } else if (messageData) { // not enough ack to met write concern. Adding ack to array
        ackCache.set(messageId, { ...messageData, ack: [serverId, ...messageData?.ack] });
      }
    }
  }
})

ee.addListener('set-write-concern', message => {
  const { messageId, writeConcern } = message;
  const messageData = ackCache.get(messageId);
  if (messageData) {
    ackCache.set(messageId, { ...messageData, writeConcern });
  } else {
    ackCache.set(messageId, { writeConcern, ack: [] });
  }
});


export { webSocketInstance };
