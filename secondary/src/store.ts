import type { Item } from './types.ts';

const messages: Item[] = [];

const upcomingMessagesCache = new Map<number, Item>();

export { messages, upcomingMessagesCache };
