import { EventEmitter } from 'node:events';

const ee = new EventEmitter();
interface Item {
  id: string;
  message: string
}
const secondariesIdList: string[] = [];
const messages: Item[] = [];

export { ee, secondariesIdList, messages };
