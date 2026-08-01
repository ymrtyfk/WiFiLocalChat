const { io } = require('socket.io-client');
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting integration tests...');

// Start the server process
const serverProcess = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: '3000' }
});

// Helper to wait
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

serverProcess.stdout.on('data', (data) => {
  console.log(`[Server]: ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[Server Error]: ${data.toString().trim()}`);
});

async function runTests() {
  try {
    // Wait for the server to start
    await delay(2000);

    // Test 1: HTTP API endpoint
    console.log('\n--- Test 1: Testing GET /api/info ---');
    const info = await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/info', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });

    console.log('API /api/info response:', info);
    if (!info.ips || typeof info.port !== 'number') {
      throw new Error('API Response is missing expected fields (ips or port).');
    }
    console.log('✓ API endpoint works perfectly.');

    // Test 2: Socket.io connection & Messaging flow
    console.log('\n--- Test 2: Testing Socket.io Communication ---');
    const clientSocket = io('http://localhost:3000');

    await new Promise((resolve, reject) => {
      // Setup timeout
      const timeout = setTimeout(() => {
        reject(new Error('Socket.io operation timed out.'));
      }, 5000);

      clientSocket.on('connect', () => {
        console.log('✓ Socket.io client connected successfully.');

        // Register the user
        clientSocket.emit('register-user', {
          username: 'TesterBot',
          avatar: '🤖'
        });
      });

      clientSocket.on('room-list', (rooms) => {
        console.log('✓ Received room list:', rooms.map(r => r.name));
        const generalRoom = rooms.find(r => r.id === 'general');
        if (!generalRoom) {
          return reject(new Error('General room not found in room-list.'));
        }

        // Join room
        clientSocket.emit('join-room', 'general');
      });

      let systemMsgReceived = false;
      clientSocket.on('message', (msg) => {
        console.log(`Received message event: [${msg.type}]`, msg.text || msg.fileUrl);
        if (msg.type === 'system' && msg.text.includes('TesterBot')) {
          systemMsgReceived = true;
          // Send a message
          clientSocket.emit('send-message', {
            type: 'text',
            text: 'Hello, World!'
          });
        } else if (msg.type === 'text' && msg.text === 'Hello, World!') {
          if (systemMsgReceived) {
            console.log('✓ Successfully sent and received echo message!');
            clearTimeout(timeout);
            clientSocket.close();
            resolve();
          }
        }
      });

      clientSocket.on('connect_error', reject);
    });

    console.log('\n======================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('======================================');
    cleanup(0);

  } catch (error) {
    console.error('\n======================================');
    console.error('TEST FAILURES DETECTED ❌');
    console.error(error);
    console.log('======================================');
    cleanup(1);
  }
}

function cleanup(exitCode) {
  serverProcess.kill('SIGTERM');
  process.exit(exitCode);
}

runTests();
