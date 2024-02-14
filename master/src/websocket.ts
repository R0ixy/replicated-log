import type { Socket } from 'bun';

import { secondaries, replicationHistory, healthStatuses } from './store.ts';
import { replicateAllData, replicateMissingData, sendHeartbeat } from './utils.ts';
import { ee } from './eventEmitter.ts';

const interval: { [serverId: string]: Timer } = {};

const socket = Bun.listen<{ serverId: string }>({
  hostname: '0.0.0.0',
  port: 8080,
  socket: {
    data(socket, data) {
      const { route, data: message } = JSON.parse(data.toString());
      // console.log(route, message);

      switch (route) {
        case 'connect':
          // add socket instance to Map by server id
          secondaries.set(message.serverId, socket);
          socket.data = { serverId: message.serverId };

          if (message?.isBlank) replicateAllData({ socket, replicationHistory, serverId: message.serverId });
          else replicateMissingData({ socket, replicationHistory, serverId: message.serverId });

          // start sending hearth beats
          interval[message.serverId] = setInterval(() => {
            sendHeartbeat(socket);
          }, 3000);

          console.log(`new client [${message.serverId}] connected to socket`);
          break;
        case 'replication':
        case 'retry':
          ee.emit('ack-message', { serverId: socket.data.serverId, messageId: message.messageId, status: message.status });

          console.log(`new ACK from ${socket.data.serverId} for message ${message.messageId}`);
          break;
        case 'health':
          // set current time as last time when server was healthy
          healthStatuses[socket.data.serverId] = Date.now();
          break;
      }
    },
    close(socket) {
      secondaries.delete(socket.data.serverId);

      // reset health status
      healthStatuses[socket.data.serverId] = 0;
      // clear hearth beat process
      clearInterval(interval[socket.data.serverId]);

      console.log(`client [${socket.data.serverId}] disconnected from websocket`);
    },
    error(socket: Socket<{ serverId: string }>, error: Error): void | Promise<void> {
      console.log(error);
    },
  },
});

export { socket };
