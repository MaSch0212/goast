import { env } from 'process';

async function main() {
  const hostname = env['COMPUTERNAME'] || env['HOSTNAME'];
  const playground = await import(`./playground-${hostname}.js`);

  console.time('main');
  await playground.main();
  console.timeEnd('main');
}

main();
