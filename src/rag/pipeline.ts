import retriever from './retriever';
import llm from './llm';
import config from '../utils/config';
import logger from '../utils/logger';
import { MessageHistory } from '../session/sessionManager';

export class RagPipeline {
  async processQuery(query: string, chatHistory: MessageHistory[] = []): Promise<string> {
    try {
      logger.info('Starting RAG pipeline process...');
      
      // 1. Retrieve relevant documents
      const docs = await retriever.retrieve(query);
      
      // Optional: Filter by similarity threshold if needed
      // (Depends on ChromaDB's distance metric and the threshold logic)
      const relevantDocs = docs; // For now, we use topK directly
      
      if (relevantDocs.length === 0) {
        logger.info('No relevant context found. Returning fallback.');
        return 'Maaf, saya tidak menemukan informasi terkait di dalam basis pengetahuan saya.';
      }
      
      // 2. Format context
      const contextText = relevantDocs
        .map(doc => `[Sumber: ${doc.metadata.source || 'Tidak diketahui'}]\n${doc.content}`)
        .join('\n\n');
        
      // 3. Format chat history
      const historyText = chatHistory
        .map(msg => `${msg.role === 'user' ? 'User' : 'Asisten'}: ${msg.content}`)
        .join('\n');

      // 4. Build prompt
      const prompt = `System:
Kamu adalah asisten yang membantu menjawab pertanyaan berdasarkan dokumen yang tersedia.
Jawab HANYA berdasarkan konteks yang diberikan. Jika informasi tidak tersedia dalam konteks,
katakan bahwa kamu tidak menemukan informasi tersebut.
Jawab dalam bahasa yang sama dengan pertanyaan pengguna.

Konteks:
${contextText}

Riwayat Percakapan:
${historyText}

Pertanyaan: ${query}

Jawaban:`;

      // 5. Generate response
      const answer = await llm.generate(prompt);
      
      logger.info('RAG pipeline process completed.');
      return answer.trim();
    } catch (error) {
      logger.error('Error in RAG pipeline', error);
      return 'Terjadi kesalahan sistem saat mencoba memproses pertanyaan Anda. Silakan coba beberapa saat lagi.';
    }
  }
}

export const ragPipeline = new RagPipeline();
export default ragPipeline;
