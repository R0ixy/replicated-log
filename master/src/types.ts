import type { Socket } from 'bun';

interface Item {
  id: number;
  message: string;
}

interface ReqBody {
  message: string;
  w: number | undefined;
}

interface ReplicateFunc {
  socket: Socket<{ serverId: string }>;
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

export type { Item, ReqBody, ReplicateFunc, HealthStatusesType, EventMessage };
