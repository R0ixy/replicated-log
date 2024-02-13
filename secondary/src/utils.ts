interface Item {
  id: number;
  message: string;
}

interface eventData {
  route: string;
  data: Item;
}

const messages: Item[] = [];

const upcomingMessagesCache = new Map<number, Item>();

const appendMessage = (socket: WebSocket, newMessage: Item): void => {
  if (Math.floor(Math.random() * 2) === 0) {
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
    socket.send(JSON.stringify({ route: 'replication', messageId: newMessage.id, status: 'ACK' }));
  }
};

export { messages, appendMessage, type Item, type eventData };
