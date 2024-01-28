import type { Item } from './types.ts';

const secondariesList: string[] = [];
const messages: Item[] = [];
const replicationHistory = new Map<number, string[]>();

export { secondariesList, messages, replicationHistory };
