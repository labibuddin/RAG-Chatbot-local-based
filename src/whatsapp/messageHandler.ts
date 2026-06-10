import { Message } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';
import ragPipeline from '../rag/pipeline';
import sessionManager from '../session/sessionManager';
import logger from '../utils/logger';
import config from '../utils/config';
import { ingestFile } from '../cli/ingest';

export class MessageHandler {
  async handleMessage(message: Message): Promise<void> {
    try {
      // Ignore messages from groups or system statuses for now
      if (message.isStatus || (await message.getChat()).isGroup) {
        return;
      }

      const text = message.body.trim();
      const senderId = message.from;
      
      const contact = await message.getContact();
      
      logger.info(`Message received from: ${message.from}, contact number: ${contact.number}, contact id: ${contact.id?._serialized}`);
      
      // Attempt to identify admin by checking contact.number, message.from, and contact.id
      const isAdmin = Boolean(
        (contact.number && contact.number === config.whatsapp.adminPhone) || 
        message.from.includes(config.whatsapp.adminPhone) ||
        (contact.id && contact.id._serialized && contact.id._serialized.includes(config.whatsapp.adminPhone))
      );
        
      logger.info(`Is Admin: ${isAdmin}`);

      // Handle media upload from Admin
      if (message.hasMedia && isAdmin) {
        await this.handleAdminMedia(message);
        return;
      }
      
      if (!text && !message.hasMedia) {
          return;
      }

      // Check for commands
      if (text.startsWith('!')) {
        await this.handleCommand(message, senderId, text, isAdmin);
        return;
      }

      // Add user message to history
      sessionManager.addMessage(senderId, 'user', text);
      const history = sessionManager.getHistory(senderId);

      // We only pass history excluding the current message to avoid duplication in pipeline?
      // Actually, passing all history is fine, we just need to differentiate the query from history.
      // Let's pass history up to the previous message for context, and current text as query.
      const historyContext = history.slice(0, -1);

      // Process RAG Query
      const reply = await ragPipeline.processQuery(text, historyContext);

      // Add assistant reply to history
      sessionManager.addMessage(senderId, 'assistant', reply);

      // Send reply
      await message.reply(reply);
      
    } catch (error) {
      logger.error('Error handling message', error);
      await message.reply('Maaf, sistem sedang mengalami gangguan. Silakan coba lagi nanti.');
    }
  }

  private async handleCommand(message: Message, senderId: string, text: string, isAdmin: boolean): Promise<void> {
    const args = text.split(' ');
    const command = args[0].toLowerCase();
    
    switch (command) {
      case '!add':
        if (!isAdmin) {
          await message.reply('Maaf, perintah ini hanya untuk admin.');
          return;
        }
        const knowledgeText = text.replace('!add', '').trim();
        if (!knowledgeText) {
          await message.reply('Format salah. Gunakan: `!add <teks knowledge>`');
          return;
        }
        try {
          const filename = `text_knowledge_${Date.now()}.txt`;
          const docsDir = path.resolve(process.cwd(), 'docs');
          const filePath = path.join(docsDir, filename);
          
          await fs.promises.writeFile(filePath, knowledgeText, 'utf8');
          await ingestFile(filePath);
          await message.reply('✅ Knowledge berhasil ditambahkan!');
        } catch (error) {
          logger.error('Error adding text knowledge', error);
          await message.reply('Terjadi kesalahan saat menambahkan knowledge.');
        }
        break;
      case '!reset':
        sessionManager.resetSession(senderId);
        await message.reply('Sesi percakapan Anda telah direset.');
        break;
      case '!help':
        await message.reply(
          '*Daftar Perintah:*\n\n' +
          'Kirim pesan biasa untuk bertanya ke sistem.\n' +
          '`!reset` - Reset riwayat percakapan Anda\n' +
          '`!help` - Tampilkan pesan bantuan ini' +
          (isAdmin ? '\n`!add <teks>` - Tambahkan teks ke knowledge base' : '')
        );
        break;
      case '!status':
        // Optional: only for admin, but for now we'll return a simple status
        await message.reply('Sistem berjalan normal. RAG Chatbot aktif.');
        break;
      default:
        await message.reply('Perintah tidak dikenali. Ketik `!help` untuk melihat daftar perintah.');
        break;
    }
  }

  private async handleAdminMedia(message: Message): Promise<void> {
    try {
      const media = await message.downloadMedia();
      if (!media) {
        await message.reply('Gagal mengunduh media.');
        return;
      }

      // Check if it's a valid document type (pdf, txt, md)
      const allowedMimeTypes = [
        'application/pdf', 
        'text/plain', 
        'text/markdown'
      ];
      
      const isAllowedMimeType = allowedMimeTypes.includes(media.mimetype);
      const isAllowedExtension = media.filename?.endsWith('.pdf') || media.filename?.endsWith('.txt') || media.filename?.endsWith('.md');

      if (!isAllowedMimeType && !isAllowedExtension) {
        await message.reply(`Maaf, tipe file tidak didukung. Harap kirimkan PDF, TXT, atau MD. (Mendeteksi: ${media.mimetype})`);
        return;
      }

      const filename = media.filename || `doc_${Date.now()}.txt`;
      const docsDir = path.resolve(process.cwd(), 'docs');
      const filePath = path.join(docsDir, filename);

      // Save file
      await fs.promises.writeFile(filePath, media.data, 'base64');
      logger.info(`Admin uploaded file: ${filename}`);

      // Reply that we are processing
      await message.reply(`File *${filename}* berhasil diterima. Sedang memproses dan menambahkan ke Knowledge Base...`);

      // Ingest it
      await ingestFile(filePath);

      await message.reply(`✅ Selesai! *${filename}* berhasil di-ingest dan sekarang bisa ditanyakan melalui chat.`);
    } catch (error) {
      logger.error('Error handling admin media', error);
      await message.reply('Terjadi kesalahan saat memproses file dokumen.');
    }
  }
}

export const messageHandler = new MessageHandler();
export default messageHandler;
