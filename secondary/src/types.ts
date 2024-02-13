interface Item {
  id: number;
  message: string;
}

interface EventData {
  route: string;
  data: Item;
}

export type { Item, EventData };
