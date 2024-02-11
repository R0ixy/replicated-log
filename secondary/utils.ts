interface Item {
  id: number;
  message: string;
}

interface eventData {
  route: string;
  data: Item;
}

const messages: Item[] = [];

const appendMessage = (socket: WebSocket, newMessage: Item): void => {
  if (Math.floor(Math.random() * 4) === 0) {
    console.log('simulating replication error');
    return;
  }
  if (!messages.find(message => message.id === newMessage.id)) { // ensure messages deduplication
    messages.push(newMessage);

    if (messages.at(-2)?.id !== newMessage.id - 1) { // reorder messages in case of inconsistent total order
      messages.sort((message1, message2) => message1.id - message2.id);
    }
    socket.send(JSON.stringify({ route: 'replication', messageId: newMessage.id, status: 'ACK' }));
  }
};

export { messages, appendMessage, type Item, type eventData };
