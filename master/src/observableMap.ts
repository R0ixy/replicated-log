import { EventEmitter } from 'node:events'

class ObservableMap<K, V> extends Map<K, V> {
  private events: EventEmitter.EventEmitter;
  private readonly eventName: string;

  constructor(eventEmitter: EventEmitter.EventEmitter, eventName: string, iterable?: readonly (readonly [K, V])[] | null) {
    super(iterable);
    this.events = eventEmitter
    this.eventName = eventName;
  }

  set(key: K, value: V): this {
    const oldValue = this.get(key);
    if (oldValue !== value) {
      super.set(key, value);
      this.emitUpdateEvent(key);
    }
    return this;
  }

  private emitUpdateEvent(key: K): void {
    const eventName = this.eventName;
    this.events.emit(`${key}-${eventName}`, this);
  }
}

export { ObservableMap };
