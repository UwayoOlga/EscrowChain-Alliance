
// Basic polyfills for Node.js modules that MeshSDK expects
export class EventEmitter {
    constructor() { this.events = {}; }
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
        return this;
    }
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(l => l(...args));
        }
        return true;
    }
    removeListener() { return this; }
    removeAllListeners() { return this; }
    once() { return this; }
}

export class Transform { constructor() { } }
export class Readable { constructor() { } }
export class Writable { constructor() { } }

export const debuglog = () => () => { };
export const inspect = (obj) => JSON.stringify(obj, null, 2);

export default {
    EventEmitter,
    debuglog,
    inspect,
    Transform,
    Readable,
    Writable
};
