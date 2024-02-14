import { EventEmitter } from 'node:events';

import type { EventMessage } from './types.ts';
import { ackCache, replicationHistory } from './store.ts';

const ee = new EventEmitter();

ee.addListener('ack-message', (message: EventMessage) => {
  const { serverId, messageId, status } = message;

  if (status === 'ACK') { // replicated successfully
    const history = replicationHistory.get(messageId);
    if (history?.length) {
      // if this message has history it means we have already received number of ack that meets a write concern.
      // This ack is just an extra one, so we need to add it to history and that's it
      replicationHistory.set(messageId, [serverId, ...history]);

    } else { // otherwise add this message to ackCache until we will receive a sufficient number of ack
      const messageData = ackCache.get(messageId);
      if (messageData && messageData?.writeConcern <= messageData?.ack.length + 1) { // check if number of ack meets write concern
        // sending an event about getting all ack
        ee.emit(`ack-${messageId}`, status);

        // adding this message to replication history only after receiving number of ack that will meet a write concern
        replicationHistory.set(messageId, [serverId, ...messageData.ack]);
        // clear message data form ackCache
        ackCache.delete(messageId);
      } else if (messageData) { // not enough ack to met write concern. Adding ack to array
        ackCache.set(messageId, { ...messageData, ack: [serverId, ...messageData.ack] });
      }
    }
  }
});

ee.addListener('set-write-concern', message => {
  const { messageId, writeConcern } = message;
  const messageData = ackCache.get(messageId);
  if (messageData) {
    ackCache.set(messageId, { ...messageData, writeConcern });
  } else {
    ackCache.set(messageId, { writeConcern, ack: [] });
  }
});

export { ee };
