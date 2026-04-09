module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './api-gateway/server.js',
      watch: false,
    },
    {
      name: 'auth',
      script: './auth/server.js',
      watch: false,
    },
    {
      name: 'audit',
      script: './audit/server.js',
      watch: false,
    },
    {
      name: 'websocket',
      script: './websocket/server.js',
      watch: false,
    },
  ],
};
