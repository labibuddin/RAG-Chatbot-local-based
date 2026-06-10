import * as http from 'http';
import config from './utils/config';
import logger from './utils/logger';
import whatsAppClient from './whatsapp/client';

async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch(`${config.ollama.baseUrl}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

async function checkChroma(): Promise<boolean> {
  try {
    const res = await fetch(`${config.chroma.url}/api/v1/heartbeat`);
    return res.ok;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    const isOllamaUp = await checkOllama();
    const isChromaUp = await checkChroma();
    
    const status = isOllamaUp && isChromaUp ? 200 : 503;
    const body = {
      status: status === 200 ? 'healthy' : 'unhealthy',
      services: {
        ollama: isOllamaUp ? 'up' : 'down',
        chroma: isChromaUp ? 'up' : 'down'
      }
    };
    
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  logger.info('Starting WhatsApp RAG Chatbot...');
  
  // Start Health Check Server
  server.listen(PORT, () => {
    logger.info(`Health check API running on http://localhost:${PORT}/health`);
  });
  
  // Initialize WhatsApp Client
  try {
    await whatsAppClient.initialize();
  } catch (error) {
    logger.error('Failed to initialize WhatsApp client', error);
    process.exit(1);
  }
}

bootstrap();
