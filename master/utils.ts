import { EventEmitter } from 'node:events';

import { messages } from './store.ts';
import type { Item, replicateFunc } from './types.ts';

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

// const executeReplication = ({ webSocketInstance, replicationHistory, message, serverId }: replicateFunc & { message: Item }) => {
//   webSocketInstance.publish('replication', JSON.stringify({route: 'old', data: message}));
//
//   const servers = replicationHistory.get(message.id);
//   replicationHistory.set(message.id, [...(servers ? servers : []), serverId])
//
//   console.log('replicating old', JSON.stringify(message), 'to', serverId);
// }

const replicateMissingData = ({webSocketInstance, replicationHistory, serverId}: replicateFunc) => {
  messages.forEach((message) => {
    if (!replicationHistory.get(message.id)?.includes(serverId)) {
      webSocketInstance.publish('replication', JSON.stringify({ route: 'old', data: message }));

      const servers = replicationHistory.get(message.id);
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId])

      console.log('replicating old', JSON.stringify(message), 'to', serverId);
    }
  });
}

const replicateAllData = ({webSocketInstance, replicationHistory, serverId}: replicateFunc) => {
  messages.forEach((message) => {
    webSocketInstance.publish('replication', JSON.stringify({ route: 'old', serverId, data: message }));

    const servers = replicationHistory.get(message.id);
    if (!servers?.includes(serverId)) {
      replicationHistory.set(message.id, [...(servers ? servers : []), serverId])
    }

    console.log('replicating old', JSON.stringify(message), 'to', serverId);
  });
}

export { ee, nResolve, replicateMissingData, replicateAllData };
