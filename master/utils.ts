import { EventEmitter } from 'node:events';
import type { ServerWebSocket, Server } from "bun";

import { ackCache, healthStatuses, messages, replicationHistory, secondaries } from './store.ts';
import type { replicateFunc } from './types.ts';

const ee = new EventEmitter();

const nResolve = (promises: Promise<any[]>[], n: number): Promise<string[]> => {
  if (n < 0 || n > promises.length) return Promise.reject(`Invalid write concern: ${n}`);

  const results: string[] = []
  let rejected = 0;

  return new Promise((resolve, reject) => {
    if (!n) resolve([]);
    else promises.forEach(promise => promise.then(res => {
      results.push(res[0]); // note: order is unpredictable
      if (results.length === n) resolve([...results]);
    }, err => {
      // reject only when there are not enough promises left for n to resolve
      if (++rejected > promises.length - n) reject();
    }));
  });
}

const replicateMissingData = ({ ws, replicationHistory, serverId }: replicateFunc) => {
  messages.forEach((message) => {
    if (!replicationHistory.get(message.id)?.includes(serverId)) {
      ws.send(JSON.stringify({ route: 'old', data: message }));

      const servers = replicationHistory.get(message.id);
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId])

      console.log('replicating old', JSON.stringify(message), 'to', serverId);
    }
  });
}

const replicateAllData = ({ ws, replicationHistory, serverId }: replicateFunc) => {
  messages.forEach((message) => {
    ws.send(JSON.stringify({ route: 'old', data: message }));

    const servers = replicationHistory.get(message.id);
    if (!servers?.includes(serverId)) {
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId])
    }

    console.log('replicating old', JSON.stringify(message), 'to', serverId);
  });
}

const sendHeartbeat = (webSocketInstance: ServerWebSocket<{ serverId: string, isBlank: boolean }>) => {
  webSocketInstance.send(JSON.stringify({ route: 'health', data: 'ping' }));
}

const getHealthStatuses = (currentTime: number) => Object.keys(healthStatuses).reduce((accumulator: object, key: string) => {
  const timeDiff = currentTime - healthStatuses[key];
  if (timeDiff <= 6000) {
    return { ...accumulator, [key]: 'healthy' };
  } else if (6000 < timeDiff && timeDiff <= 10000) {
    return { ...accumulator, [key]: 'suspicious' };
  } else {
    return { ...accumulator, [key]: 'unhealthy' };
  }
}, {});

const startRetryProcess = (n: number, newMessage: { id: number, message: string }) => {
  setTimeout(() => {
    const result = getHealthStatuses(Date.now());
    let isRetrySent = false;

    Object.keys(result).forEach(key => {
      if (result[key] !== 'unhealthy') {
        const ackCacheData = ackCache.get(newMessage.id);
        const replicationHistoryData = replicationHistory.get(newMessage.id);

        if (!ackCacheData?.ack.includes(key) && !replicationHistoryData?.includes(key)) {
          secondaries.get(key)?.send(JSON.stringify({ route: 'retry', data: newMessage }));
          isRetrySent = true;
          console.log(`sent retry to ${key} about message ${newMessage.id}`)
        }
      }
    });

    if (isRetrySent) startRetryProcess(n * 1.5, newMessage);
    else return;

  }, 3000 * n);
}

export { ee, nResolve, replicateMissingData, replicateAllData, sendHeartbeat, getHealthStatuses, startRetryProcess };
