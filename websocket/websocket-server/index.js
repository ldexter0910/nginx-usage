const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Welcome to my HTTP server!');
    } else if (pathname === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('About page');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

const clients = {};

let clientIdCounterObj = (function () {
    let initialClientId = 0;

    return ({
        getAndIncrement: () => {
            const clientId = initialClientId;
            initialClientId++;
            return clientId;
        }
    });
})();

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (socket, request) => {
    const clientId = clientIdCounterObj.getAndIncrement();
    clients[clientId] = socket;

    console.log(`A new client: ${clientId} has connected!`);

    socket.on('message', (message) => {
        console.log(`Received a message from client: ${clientId}`);
        console.log(`${message}`);
        socket.send(`ClientId: ${clientId} Echo: ${message}`);
    });

    socket.on('close', () => {
        delete clients[clientId];
        console.log(`Client: ${clientId} is disconnected`);
    });
});

server.on('upgrade', (req, connection, head) => {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (pathname === '/websocket') {
        wss.handleUpgrade(req, connection, head, (socket) => {
            wss.emit('connection', socket, req);
        });
    } else {
        socket.destroy();
    }
});

// Set the port for the server to listen on
const port = process.env.PORT || 80;

// Start the server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});