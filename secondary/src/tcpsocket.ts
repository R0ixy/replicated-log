import type { Socket } from 'bun';
import { appendMessage, prepareMessageToSend } from './utils.ts';
import { messages } from './store.ts';

const { HOSTNAME, WEBSOCKET_HOST, RESPONSE_TIMEOUT } = process.env;

let receivedData = Buffer.alloc(0);

// tcp socket
const socket = Bun.connect({
  hostname: WEBSOCKET_HOST || 'localhost',
  port: 8080,
  socket: {
    open(socket) {
      socket.write(prepareMessageToSend('connect',{ serverId: HOSTNAME || 'secondary', isBlank: !messages.length }));
      console.log('open socket connection');
    },
    data(socket, data) {
      receivedData = Buffer.concat([receivedData, data]);
      while (receivedData.length >= 4) {
        const messageLength = receivedData.readUInt32BE(0);

        if (receivedData.length >= messageLength + 4) { // Check if the complete message is available

          const message = receivedData.subarray(4, messageLength + 4).toString(); // Get message content
          const { route, data: newMessage } = JSON.parse(message);

          switch (route) {
            case 'new':
              console.log('Received:', message);
              try {
                setTimeout(() => {
                  appendMessage(socket, newMessage);
                }, Number(RESPONSE_TIMEOUT) || 10);
              } catch {
                socket.write(prepareMessageToSend('replication', { messageId: newMessage.id, status: 'ERROR' }));
              }
              break;

            case 'old':
              console.log('Received:', message);
              messages.push(newMessage);
              messages.sort((message1, message2) => message1.id - message2.id);
              break;

            case 'health':
              socket.write(prepareMessageToSend('health', 'pong'));
              break;

            case 'retry':
              console.log('Received:', message);
              appendMessage(socket, newMessage);
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
    error(socket: Socket<{ serverId: string }>, error: Error): void | Promise<void> {
      console.log(error);
    },
  },
});

export { socket };
