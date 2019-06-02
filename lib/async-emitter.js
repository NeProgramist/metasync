'use strict';

const { iter } = require('@metarhia/common');

class AsyncEmitter {
  constructor() {
    this.events = new Map();
    this.wrappers = new Map();
  }

  // Add listener
  //   name <string> event name
  //   fn <Function> listener
  on(name, fn) {
    let event = this.events.get(name);
    if (!event) {
      event = new Set();
      this.events.set(name, event);
    }
    event.add(fn);
  }

  // Add listener
  //   name <string> event name
  //   fn <Function> listener
  // Returns: <Promise> | <undefined>
  once(name, fn) {
    if (fn === undefined) {
      return new Promise(resolve => {
        this.once(name, resolve);
      });
    }
    const wrapper = (...args) => {
      this.remove(name, fn);
      return fn(...args);
    };
    this.wrappers.set(fn, wrapper);
    this.on(name, wrapper);
    return undefined;
  }

  // Emit event
  //   name <string> event name
  //   args <any[]>
  // Returns: <Promise> | <undefined>
  async emit(name, ...args) {
    const event = this.events.get(name);
    if (!event) return undefined;
    const listeners = event.values();
    const promises = iter(listeners).map(fn => fn(...args));
    return Promise.all(promises);
  }

  // Remove event listener
  //   name <string> event name
  //   fn <Function> listener to remove
  remove(name, fn) {
    const { events, wrappers } = this;
    const event = events.get(name);
    if (!event) return;
    if (event.has(fn)) event.delete(fn);
    const wrapper = wrappers.get(fn);
    if (wrapper) {
      wrappers.delete(fn);
      event.delete(wrapper);
    }
    if (event.size === 0) events.delete(name);
  }

  // Remove all listeners or by name
  //   name <string> event name
  clear(name) {
    const { events, wrappers } = this;
    if (!name) {
      events.clear();
      wrappers.clear();
      return;
    }
    const event = events.get(name);
    if (!event) return;
    for (const [fn, wrapper] of wrappers.entries()) {
      if (event.has(wrapper)) wrappers.delete(fn);
    }
    events.delete(name);
  }

  // Get listeners count by event name
  //   name <string> event name
  // Returns: <number>
  count(name) {
    const event = this.events.get(name);
    return event ? event.size : 0;
  }

  // Get listeners array by event name
  //   name <string> event name
  // Returns: <Function[]>
  listeners(name) {
    const event = this.events.get(name);
    return [...event];
  }

  // Get event names array
  // Returns: <string[]> names
  names() {
    return [...this.events.keys()];
  }
}

module.exports = { AsyncEmitter };
