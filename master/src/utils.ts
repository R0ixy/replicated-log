import type { Socket } from 'bun';

import { ackCache, healthStatuses, messages, replicationHistory, secondaries } from './store.ts';
import type { Item, ReplicateFunc } from './types.ts';

const replicateMissingData = ({ socket, replicationHistory, serverId }: ReplicateFunc): void => {
  const dataToSend = <Item[]>[];

  messages.forEach(message => {
    if (!replicationHistory.get(message.id)?.includes(serverId)) {
      dataToSend.push(message);

      const servers = replicationHistory.get(message.id);
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId]);

      console.log('replicating old', JSON.stringify(message), 'to', serverId);
    }
  });
  if (dataToSend.length) socket.write(JSON.stringify({ route: 'old', data: dataToSend }));
};

const replicateAllData = ({ socket, replicationHistory, serverId }: ReplicateFunc): void => {
  messages.forEach(message => {

    const servers = replicationHistory.get(message.id);
    if (!servers?.includes(serverId)) {
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId]);
    }

    console.log('replicating old', JSON.stringify(message), 'to', serverId);
  });
  if (messages.length) socket.write(JSON.stringify({ route: 'old', data: messages }));
};

const sendHeartbeat = (webSocket: Socket<{ serverId: string }>): void => {
  webSocket.write(JSON.stringify({ route: 'health', data: 'ping' }));
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
          secondaries.get(key)?.write(JSON.stringify({ route: 'retry', data: newMessage }));
          isRetrySent = true;
          console.log(`sent retry to ${key} about message ${newMessage.id}`);
        }
      }
    });

    if (isRetrySent) startRetryProcess(n * 1.5, newMessage);
    else return;

  }, 3000 * n);
};

export { replicateMissingData, replicateAllData, sendHeartbeat, getHealthStatuses, startRetryProcess };
