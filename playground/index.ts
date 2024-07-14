import { main as playgroundMain } from './playground';

async function main() {
  console.time('main');
  await playgroundMain();
  console.timeEnd('main');
}

main();
