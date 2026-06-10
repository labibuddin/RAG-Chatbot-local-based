import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import config from '../utils/config';
import logger from '../utils/logger';
import messageHandler from './messageHandler';

export class WhatsAppClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: config.whatsapp.sessionPath,
      }),
      puppeteer: {
        headless: config.whatsapp.headless,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
    });

    this.initializeEvents();
  }

  private initializeEvents() {
    this.client.on('qr', (qr) => {
      logger.info('QR Code received, please scan it with your WhatsApp');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      logger.info('WhatsApp Client is ready!');
    });

    this.client.on('message', async (message) => {
      logger.info(`Received message from ${message.from}`);
      await messageHandler.handleMessage(message);
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp Client was disconnected', reason);
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('WhatsApp Authentication failure', msg);
    });
  }

  async initialize() {
    logger.info('Initializing WhatsApp client...');
    await this.client.initialize();
  }
}

export const whatsAppClient = new WhatsAppClient();
export default whatsAppClient;
