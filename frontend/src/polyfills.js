import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
globalThis.Buffer = Buffer;
window.process = {
    env: { NODE_ENV: 'development' },
    version: '',
    nextTick: (cb) => setTimeout(cb, 0),
    browser: true,
};

console.log("Polyfills loaded: Buffer is", typeof Buffer);
