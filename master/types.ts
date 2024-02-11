import type { ServerWebSocket } from 'bun';

interface Item {
  id: number;
  message: string;
}

interface ReqBody {
  message: string;
  w: number | undefined;
}

interface ACKMessage {
  route: string;
  messageId: number;
  status: string;
}

interface ReplicateFunc {
  ws: ServerWebSocket<{ serverId: string, isBlank: boolean }>;
  replicationHistory: Map<number, string[]>;
  serverId: string;
}

interface HealthStatusesType {
  [serverId: string]: number;
}

interface EventMessage {
  serverId: string;
  messageId: number;
  status: string;
}

export type { Item, ReqBody, ACKMessage, ReplicateFunc, HealthStatusesType, EventMessage };
