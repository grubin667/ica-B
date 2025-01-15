
import Bree from 'bree';
import { Graceful } from './getGraceful.cjs';
import { Cabin } from './getCabin.cjs';

const envtimeout = process.env.TIMEOUT;
const envinterval = process.env.INTERVAL;

console.log(`timeout: ${envtimeout} and interval: ${envinterval}`);

// Bree rules:
//   to run on start and then repeat at intervals, use only interval prop;
//   use both props to run find_work after initial delay and then repeat thereafter;

const bree = new Bree({
  // logger: new Cabin(),
  jobs: [
    {
      name: 'find-work',
      timeout: envtimeout,
      interval: envinterval,
    },
  ]
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
const graceful = new Graceful({ brees: [bree] });
graceful.listen();

// start all jobs (this is the equivalent of reloading a crontab):
// (async () => {
  await bree.start();
// })();
