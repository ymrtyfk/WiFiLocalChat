const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 1e8 // 100 MB limit
});

const PORT = parseInt(process.env.PORT || '3000', 10);

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for handling file uploads (images, voice notes, documents)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Get Host IP addresses (for local Wi-Fi connection)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// API endpoint to get system info (IP addresses and port)
app.get('/api/info', (req, res) => {
  const ips = getLocalIpAddresses();
  res.json({
    ips: ips.length > 0 ? ips : ['localhost'],
    port: PORT
  });
});

// API endpoint to upload files
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// App State (in-memory)
const rooms = {
  'general': { id: 'general', name: 'العامة / General', creator: 'System', isSystem: true, users: new Set() }
};

// Recent messages storage (limit to 100 messages per room)
const roomMessages = {
  'general': []
};

// Map of socket.id -> { username, avatar }
const users = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. User Registration / Nickname setup
  socket.on('register-user', ({ username, avatar }) => {
    users[socket.id] = {
      id: socket.id,
      username: username || 'مجهول/Anonymous',
      avatar: avatar || 'avatar-1'
    };

    // Send room list
    sendRoomList();
  });

  // Helper to send room list to client (with active user counts)
  function sendRoomList(targetSocket = socket) {
    const activeRooms = Object.values(rooms).map(room => ({
      id: room.id,
      name: room.name,
      creator: room.creator,
      isSystem: !!room.isSystem,
      userCount: room.users.size
    }));
    targetSocket.emit('room-list', activeRooms);
  }

  // Global room list update broadcast
  function broadcastRoomList() {
    const activeRooms = Object.values(rooms).map(room => ({
      id: room.id,
      name: room.name,
      creator: room.creator,
      isSystem: !!room.isSystem,
      userCount: room.users.size
    }));
    io.emit('room-list', activeRooms);
  }

  // 2. Create room
  socket.on('create-room', ({ roomName }) => {
    const user = users[socket.id];
    if (!user) return;

    const roomId = 'room-' + Date.now();
    rooms[roomId] = {
      id: roomId,
      name: roomName,
      creator: user.username,
      users: new Set()
    };
    roomMessages[roomId] = [];

    broadcastRoomList();
    socket.emit('room-created', roomId);
  });

  // 3. Join room
  socket.on('join-room', (roomId) => {
    const user = users[socket.id];
    if (!user) return;

    // Check if room exists, fallback to general
    if (!rooms[roomId]) {
      roomId = 'general';
    }

    // Leave previous rooms
    leaveAllRooms(socket);

    // Join new room
    socket.join(roomId);
    rooms[roomId].users.add(socket.id);
    user.currentRoom = roomId;

    // Send history
    const history = roomMessages[roomId] || [];
    socket.emit('message-history', history);

    // Broadcast user joined
    const systemMsg = {
      id: 'sys-' + Date.now() + '-' + Math.random(),
      type: 'system',
      text: `${user.username} انضم للمحادثة / joined the room`,
      timestamp: new Date().toISOString()
    };
    io.to(roomId).emit('message', systemMsg);

    broadcastRoomList();
  });

  // Helper to leave all rooms
  function leaveAllRooms(s) {
    const user = users[s.id];
    if (!user) return;

    for (const roomId of Object.keys(rooms)) {
      if (rooms[roomId].users.has(s.id)) {
        rooms[roomId].users.delete(s.id);
        s.leave(roomId);

        // System message for departure
        const systemMsg = {
          id: 'sys-' + Date.now() + '-' + Math.random(),
          type: 'system',
          text: `${user.username} غادر المحادثة / left the room`,
          timestamp: new Date().toISOString()
        };
        io.to(roomId).emit('message', systemMsg);
      }
    }
  }

  // 4. Send Message
  socket.on('send-message', ({ type, text, fileUrl, fileMetadata }) => {
    const user = users[socket.id];
    if (!user || !user.currentRoom) return;

    const roomId = user.currentRoom;
    const message = {
      id: 'msg-' + Date.now() + '-' + Math.random(),
      sender: {
        id: socket.id,
        username: user.username,
        avatar: user.avatar
      },
      type: type || 'text', // text, image, file, voice
      text: text || '',
      fileUrl: fileUrl || null,
      fileMetadata: fileMetadata || null,
      timestamp: new Date().toISOString()
    };

    // Store in message history
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    roomMessages[roomId].push(message);
    if (roomMessages[roomId].length > 100) {
      roomMessages[roomId].shift();
    }

    // Broadcast message
    io.to(roomId).emit('message', message);
  });

  // 5. Typing Indicator
  socket.on('typing', () => {
    const user = users[socket.id];
    if (!user || !user.currentRoom) return;
    socket.to(user.currentRoom).emit('user-typing', {
      id: socket.id,
      username: user.username
    });
  });

  socket.on('stop-typing', () => {
    const user = users[socket.id];
    if (!user || !user.currentRoom) return;
    socket.to(user.currentRoom).emit('user-stop-typing', {
      id: socket.id
    });
  });

  // 6. Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const user = users[socket.id];
    if (user) {
      leaveAllRooms(socket);
      delete users[socket.id];
    }
    broadcastRoomList();
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  console.log(`Server is running on port ${PORT}`);
  console.log('Local Network access addresses:');
  ips.forEach(ip => {
    console.log(`  http://${ip}:${PORT}`);
  });
});
