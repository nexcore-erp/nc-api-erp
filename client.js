const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Conectado al servidor');
  ws.send('Hola servidor!');
});

ws.on('message', (data) => {
  console.log('Respuesta:', data.toString());
});

