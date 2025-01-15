module.exports = {
  apps : [
    {
      name: 'ica',
      cwd: '/home/ubuntu/dev/ica',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'breejob',
      cwd: '/home/ubuntu/dev/ica/breejob',
      script: 'npm',
      args: 'run prod',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      },
    },
    {
      name: 'filewatcher',
      cwd: '/home/ubuntu/dev/ica/filewatcherlocal',
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
