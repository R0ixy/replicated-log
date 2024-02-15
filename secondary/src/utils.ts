import type { Socket } from 'bun';

import type { Item } from './types.ts';
import { messages, upcomingMessagesCache } from './store.ts';

const prepareMessageToSend = (route: string, data: unknown): Buffer => {
  const messageLengthBuffer = Buffer.alloc(4);
  const message = JSON.stringify({ route, data });
  messageLengthBuffer.writeUInt32BE(message.length);
  return Buffer.concat([messageLengthBuffer, Buffer.from(message)]);
};

const appendMessage = (socket: Socket, newMessage: Item): void => {
  if (Math.floor(Math.random() * 2) === 0) { // artificially adding a change to get an 'error' instead of processing a message
    console.log('simulating replication error');
    return;
  }
  if (!messages.find(message => message.id === newMessage.id)) { // ensure messages deduplication

    if ((!messages.length && newMessage.id === 1) || messages.at(-1)?.id === newMessage.id - 1) {
      // append messages only when they come in order, otherwise set them to cache
      messages.push(newMessage);

      if (upcomingMessagesCache.has(newMessage.id + 1)) { // check if in cache there is a message that should come after current one
        const index = messages.at(-1)?.id || 0;
        // we don't have any guarantees about message order, so it's better to execute sort operation
        const preparedCacheData = [...upcomingMessagesCache.entries()].sort((value1, value2) => value1[1].id - value2[1].id);
        for (const message of preparedCacheData) {
          if (index + 1 === message[0]) {
            messages.push(message[1]);
            upcomingMessagesCache.delete(message[0]);
          }
        }
      }

      if (messages.at(-2)?.id !== newMessage.id - 1) { // reorder messages in case of inconsistent total order
        messages.sort((message1, message2) => message1.id - message2.id);
      }
    } else {
      upcomingMessagesCache.set(newMessage.id, newMessage);
    }
    socket.write(prepareMessageToSend('replication', { messageId: newMessage.id, status: 'ACK' }));
  }
};

export { appendMessage, prepareMessageToSend };
