import type { Socket } from 'bun';

import { secondaries, replicationHistory, healthStatuses } from './store.ts';
import { replicateAllData, replicateMissingData, sendHeartbeat } from './utils.ts';
import { ee } from './eventEmitter.ts';

const interval: { [serverId: string]: Timer } = {};
let receivedData = Buffer.alloc(0);

const socket = Bun.listen<{ serverId: string }>({
  hostname: '0.0.0.0',
  port: 8080,
  socket: {
    data(socket, data) {
      receivedData = Buffer.concat([receivedData, data]);
      while (receivedData.length >= 4) {
        const messageLength = receivedData.readUInt32BE(0);

        if (receivedData.length >= messageLength + 4) { // Check if the complete message is available

          const messageString = receivedData.subarray(4, messageLength + 4).toString(); // Get message content
          const { route, data: message } = JSON.parse(messageString);

          switch (route) {
            case 'connect':
              console.log('[TCP] received', messageString);
              // add socket instance to Map by server id
              secondaries.set(message.serverId, socket);
              socket.data = { serverId: message.serverId };

              if (message?.isBlank) replicateAllData({ socket, replicationHistory, serverId: message.serverId });
              else replicateMissingData({ socket, replicationHistory, serverId: message.serverId });

              // start sending hearth beats
              interval[message.serverId] = setInterval(() => {
                sendHeartbeat(socket);
              }, 3000);

              ee.emit(`${secondaries.size}-servers-online`);
              break;

            case 'replication':
            case 'retry':
              console.log('[TCP] received', messageString);
              ee.emit('ack-message', { serverId: socket.data.serverId, messageId: message.messageId, status: message.status });
              break;

            case 'health':
              // set current time as last time when server was healthy
              healthStatuses.set(socket.data.serverId, Date.now());
              break;
          }

        // Remove the processed message from the buffer
        receivedData = receivedData.subarray(messageLength + 4);
        } else {
          // Incomplete message, break the loop
          break;
        }
      }
    },
    close(socket) {
      secondaries.delete(socket.data.serverId);

      // reset health status
      healthStatuses.set(socket.data.serverId, 0);
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
