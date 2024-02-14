import type { Socket } from 'bun';

import type { Item, HealthStatusesType } from './types.ts';

const secondaries = new Map<string, Socket<{ serverId: string }>>;
const messages: Item[] = [];
const replicationHistory = new Map<number, string[]>();
const healthStatuses: HealthStatusesType = {};
const ackCache = new Map<number, { writeConcern: number, ack: string[] }>();

export { secondaries, messages, replicationHistory, healthStatuses, ackCache };
