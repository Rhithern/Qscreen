import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { InterviewSession } from './session';
import { logger } from './utils/logger';
import { config } from './config';
import { extractTokenFromRequest, verifyEmbedToken } from './auth';

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Custom upgrade handling
  server.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin;

    // Origin validation
    if (!origin || !config.ALLOWED_ORIGINS.includes(origin)) {
      logger.warn({
        message: 'WebSocket connection rejected - unauthorized origin',
        origin,
        allowedOrigins: config.ALLOWED_ORIGINS,
        ip: request.socket.remoteAddress
      });

      socket.write('HTTP/1.1 403 Forbidden\r\n' +
                  'Content-Type: application/json\r\n' +
                  '\r\n' +
                  JSON.stringify({
                    error: 'Unauthorized origin',
                    message: 'This origin is not allowed to establish WebSocket connections'
                  }));
      socket.destroy();
      return;
    }

    // JWT Authentication for embed tokens
    const token = extractTokenFromRequest(request);
    let tokenPayload = null;
    
    if (token) {
      tokenPayload = verifyEmbedToken(token);
      if (!tokenPayload) {
        logger.warn({
          message: 'WebSocket connection rejected - invalid JWT token',
          origin,
          ip: request.socket.remoteAddress
        });

        socket.write('HTTP/1.1 401 Unauthorized\r\n' +
                    'Content-Type: application/json\r\n' +
                    '\r\n' +
                    JSON.stringify({
                      error: 'Invalid token',
                      message: 'JWT token is invalid or expired'
                    }));
        socket.destroy();
        return;
      }
    }

    // Handle upgrade for allowed origins
    wss.handleUpgrade(request, socket, head, (ws) => {
      logger.info({
        message: 'WebSocket connection established',
        origin,
        ip: request.socket.remoteAddress,
        authenticated: !!tokenPayload
      });

      const session = new InterviewSession(ws, tokenPayload);
      
      ws.on('message', async (data) => {
        try {
          await session.handleMessage(data);
        } catch (error) {
          logger.error('Error handling message:', error);
          session.sendError('Internal server error');
        }
      });

      ws.on('close', (code, reason) => {
        logger.info({
          message: 'WebSocket connection closed',
          code,
          reason: reason.toString()
        });
        session.cleanup();
      });

      ws.on('error', (error) => {
        logger.error({
          message: 'WebSocket error',
          error: error.message,
          stack: error.stack
        });
        session.cleanup();
      });

      wss.emit('connection', ws, request);
    });
  });

  return wss;
}
