import type { Socket } from 'bun';

import { ObservableMap } from './observableMap.ts';
import { ee } from './eventEmitter.ts';
import type { Item } from './types.ts';

const secondaries = new Map<string, Socket<{ serverId: string }>>;
const messages: Item[] = [];
const replicationHistory = new Map<number, string[]>();
const healthStatuses = new ObservableMap<string, number>(ee, 'healthStatusUpdate');
const ackCache = new Map<number, { writeConcern: number, ack: string[] }>();

export { secondaries, messages, replicationHistory, healthStatuses, ackCache };
