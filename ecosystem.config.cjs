module.exports = {
  apps : [
    {
      name: 'ica',
      cwd: '/home/ubuntu/dev/ica-B',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'breejob',
      cwd: '/home/ubuntu/dev/ica-B/breejob',
      script: 'npm',
      args: 'run prod',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'emailer',
      cwd: '/home/ubuntu/dev/ica-B/emailer',
      script: 'npm',
      args: 'run prod',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'filewatcher',
      cwd: '/home/ubuntu/dev/ica-B/filewatcherlocal',
      script: 'npm',
      args: 'run prod',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '0 0/2 * * *',
    },
  ]
}
