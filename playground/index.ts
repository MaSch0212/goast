import { main } from './playground.js';

console.time('main');
main().then(() => console.timeEnd('main'));
