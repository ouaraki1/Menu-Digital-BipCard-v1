// socket.js
const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('📡 Socket connecté:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Socket déconnecté:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io n'est pas initialisé");
  return io;
};

module.exports = {
  initSocket,
  getIO
};
