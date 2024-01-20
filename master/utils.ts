import { EventEmitter } from 'node:events';

import type { Item } from './types.ts';

const ee = new EventEmitter();
const secondariesIdList: string[] = [];
const messages: Item[] = [];

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

export { ee, secondariesIdList, messages, nResolve };
