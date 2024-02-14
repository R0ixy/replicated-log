import type { Socket } from 'bun';

import type { Item } from './types.ts';
import { messages, upcomingMessagesCache } from './store.ts';

const appendMessage = (socket: Socket, newMessage: Item): void => {
  if (Math.floor(Math.random() * 2) === 0) { // artificially adding a change to get an 'error' instead of processing a message
    console.log('simulating replication error');
    return;
  }
  if (!messages.find(message => message.id === newMessage.id)) { // ensure messages deduplication

    if ((!messages.length && newMessage.id === 1) || messages.at(-1)?.id === newMessage.id - 1) {
      // append messages only when they come in order, otherwise set them to cache
      messages.push(newMessage);

      if (upcomingMessagesCache.has(newMessage.id + 1)) {
        const index = messages.at(-1)?.id || 0;
        for (const message of [...upcomingMessagesCache.entries()]) {
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
    socket.write(JSON.stringify({ route: 'replication', data: { messageId: newMessage.id, status: 'ACK' } }));
  }
};

export { appendMessage };
