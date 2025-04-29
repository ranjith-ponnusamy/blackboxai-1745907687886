const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// In-memory storage for users and messages
const users = new Map(); // socketId -> username
const messages = []; // { from, to, message, timestamp }

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('login', (username) => {
    users.set(socket.id, username);
    console.log(`User logged in: ${username} (${socket.id})`);
    // Notify all clients about updated user list
    io.emit('users', Array.from(users.values()));
  });

  socket.on('send_message', ({ to, message }) => {
    const from = users.get(socket.id);
    if (!from) return;
    const timestamp = new Date().toISOString();
    const msg = { from, to, message, timestamp };
    messages.push(msg);
    // Emit message to recipient if connected
    for (let [id, user] of users.entries()) {
      if (user === to) {
        io.to(id).emit('receive_message', msg);
        break;
      }
    }
    // Also emit to sender for confirmation
    socket.emit('receive_message', msg);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    console.log('user disconnected:', username);
    io.emit('users', Array.from(users.values()));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
