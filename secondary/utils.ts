interface Item {
  id: number;
  message: string;
}

interface eventData {
  route: string;
  serverId: string | undefined;
  data: Item;
}

const messages: Item[] = [];

export { messages, type Item, type eventData };
