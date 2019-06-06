'use strict';

class AsyncEmitter {
  constructor() {
    this.eventsOn = {};
    this.eventsOnce = {};
  }

  on(name, fn) {
    let event = this.eventsOn[name];
    if (!event) {
      event = {};
      this.eventsOn[name] = event;
    }
    event[fn] = fn;
  }

  once(name, fn) {
    if (fn === undefined) {
      return new Promise(resolve => {
        this.once(name, resolve);
      });
    }
    let event = this.eventsOnce[name];
    const wrapper = (...args) => {
      delete event[fn];
      return fn(...args);
    };
    if (!event) {
      event = {};
      this.eventsOnce[name] = event;
    }
    event[fn] = wrapper;
    return undefined;
  }

  async emit(name, ...args) {
    return Promise.all(this.listeners(name).map(fn => fn(...args)));
  }

  remove(name, fn) {
    const { eventsOn, eventsOnce } = this;
    if (!eventsOn[name] && !eventsOnce[name]) return;
    delete eventsOn[fn];
    delete eventsOnce[fn];
    if (Object.keys(eventsOn[name]).length === 0) delete eventsOn[name];
    if (Object.keys(eventsOnce[name]).length === 0) delete eventsOnce[name];
  }

  clear(name) {
    if (!name) {
      this.eventsOn = {};
      this.eventsOnce = {};
      return;
    }
    delete this.eventsOn[name];
    delete this.eventsOnce[name];
  }

  count(name) {
    return this.listeners(name).length;
  }

  listeners(name) {
    const onEvents = Object.values(this.eventsOn[name]) || {};
    const onceEvents = Object.values(this.eventsOnce[name]) || {};
    return [...onEvents, ...onceEvents];
  }

  names() {
    const events = Object.assign({}, this.eventsOn, this.eventsOnce);
    return Object.keys(events);
  }
}

module.exports = { AsyncEmitter };
