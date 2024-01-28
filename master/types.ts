import type { Server } from 'bun';

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

interface replicateFunc {
  webSocketInstance: Server;
  replicationHistory: Map<number, string[]>;
  serverId: string;
}

export type { Item, ReqBody, ACKMessage, replicateFunc };
