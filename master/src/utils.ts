import type { Socket } from 'bun';

import { ackCache, healthStatuses, messages, replicationHistory, secondaries } from './store.ts';
import type { Item, ReplicateFunc } from './types.ts';

const prepareMessageToSend = (route: string, data: unknown): Buffer => {
  const messageLengthBuffer = Buffer.alloc(4);
  const message = JSON.stringify({ route, data });
  if (route !== 'health') console.log(`[TCP] sent ${message}`); // logging everything except hearth beats
  messageLengthBuffer.writeUInt32BE(message.length);
  return Buffer.concat([messageLengthBuffer, Buffer.from(message)]);
};

const replicateMissingData = ({ socket, replicationHistory, serverId }: ReplicateFunc): void => {
  const dataToSend = <Item[]>[];

  messages.forEach(message => {
    if (!replicationHistory.get(message.id)?.includes(serverId)) {
      dataToSend.push(message);

      const servers = replicationHistory.get(message.id);
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId]);
    }
  });
  if (dataToSend.length) socket.write(prepareMessageToSend('old', dataToSend));
};

const replicateAllData = ({ socket, replicationHistory, serverId }: ReplicateFunc): void => {
  messages.forEach(message => {

    const servers = replicationHistory.get(message.id);
    if (!servers?.includes(serverId)) {
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId]);
    }
  });
  if (messages.length) socket.write(prepareMessageToSend('old', messages));
};

const sendHeartbeat = (webSocket: Socket<{ serverId: string }>): void => {
  webSocket.write(prepareMessageToSend('health', 'ping'));
};

const getHealthStatuses = (currentTime: number): { [messageId: string]: string } => Object.keys(healthStatuses).reduce((accumulator: object, key: string) => {
  const timeDiff = currentTime - healthStatuses[key];

  if (timeDiff <= 6000) {
    return { ...accumulator, [key]: 'healthy' };

  } if (6000 < timeDiff && timeDiff <= 10000) {
    return { ...accumulator, [key]: 'suspicious' };
  }

  return { ...accumulator, [key]: 'unhealthy' };
}, {});

const startRetryProcess = (n: number, newMessage: { id: number, message: string }): void => {
  setTimeout(() => {
    const result = getHealthStatuses(Date.now());
    let isRetrySent = false;

    Object.keys(result).forEach(key => {
      if (result[key] !== 'unhealthy') {
        const ackCacheData = ackCache.get(newMessage.id);
        const replicationHistoryData = replicationHistory.get(newMessage.id);

        if (!ackCacheData?.ack.includes(key) && !replicationHistoryData?.includes(key)) {
          secondaries.get(key)?.write(prepareMessageToSend('retry', newMessage));
          isRetrySent = true;
        }
      }
    });

    if (isRetrySent) startRetryProcess(n * 1.5, newMessage);
    else return;

  }, 3000 * n);
};

const getWriteConcernValue = (w: number | undefined, secondariesNumber: number): number => {
  if (!w) {
    return secondariesNumber;
  }
  if (w - 1 > secondaries.size) {
    return secondariesNumber;
  }
  return w - 1;
};

export {
  replicateMissingData,
  replicateAllData,
  sendHeartbeat,
  getHealthStatuses,
  startRetryProcess,
  prepareMessageToSend,
  getWriteConcernValue,
};
