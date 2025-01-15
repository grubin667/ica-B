
import Bree from 'bree';
// import Cabin from 'cabin';

// process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const envtimeout = process.env.TIMEOUT;
const envinterval = process.env.INTERVAL;
// const logger = new Cabin();

const bree = new Bree({
  // logger,
  jobs: [
    {
      name: 'org-admin-emails',

      timeout: envtimeout,          // timeout for jobs
                                    // (set this to `false` if you do not wish for a default timeout to be set;
                                    // )

      interval: envinterval,        // interval for jobs
                                    // (set this to `0` for no interval, and > 0 for a default interval to be set)

      timezone: 'America/New_York', // timezone for jobs
                                    // Must be a IANA string (ie. 'America/New_York', 'EST', 'UTC', etc).
                                    // To use a system specified timezone, set this to 'local' or 'system'.
                                    // Note: 'local' didn't work for me.
    },
    // {
    //   name: 'quickStart',
    //   timeout: false, // prevents running on startup, but will run on interval
    //   interval: envinterval,
    // }
  ]
});

await bree.start();
