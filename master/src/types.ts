import type { Socket } from 'bun';

import { HealthStatuses } from './enums.ts';

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
  [serverId: string]: HealthStatuses;
}

interface EventMessage {
  serverId: string;
  messageId: number;
  status: string;
}

export type { Item, ReqBody, ReplicateFunc, HealthStatusesType, EventMessage };
