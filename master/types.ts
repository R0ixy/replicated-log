interface Item {
  id: number;
  message: string;
}

interface ReqBody {
  message: string;
  w: number | undefined;
}

interface ACKMessage {
  messageId: number;
  status: string;
}

export type { Item, ReqBody, ACKMessage };
