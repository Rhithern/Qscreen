module.exports = {
  apps: [
    {
      name: 'interview-web',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true
    },
    {
      name: 'interview-conductor',
      script: 'pnpm',
      args: 'start',
      cwd: './apps/conductor',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/conductor-error.log',
      out_file: './logs/conductor-out.log',
      log_file: './logs/conductor-combined.log',
      time: true
    }
  ],
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/interview-platform.git',
      path: '/var/www/interview-platform',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
