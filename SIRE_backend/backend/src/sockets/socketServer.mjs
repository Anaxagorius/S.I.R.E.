// socketServer.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Server } = require('socket.io');

export function attachSocketServer(httpServer, logger) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', socket => {
        logger.info('Client connected', { id: socket.id });

        socket.on('disconnect', () => {
            logger.info('Client disconnected', { id: socket.id });
        });
    });

    logger.info('Socket.IO server initialized');
}
``