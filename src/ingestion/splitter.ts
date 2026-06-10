import config from '../utils/config';
import { Document } from './loader';

export interface Chunk {
  content: string;
  metadata: any;
}

export class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor() {
    this.chunkSize = config.rag.chunkSize;
    this.chunkOverlap = config.rag.chunkOverlap;
  }

  splitText(text: string): string[] {
    // Basic word-based splitting logic roughly estimating tokens
    // Can be enhanced with actual tokenizers like tiktoken
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    let i = 0;
    while (i < words.length) {
      const chunkWords = words.slice(i, i + this.chunkSize);
      chunks.push(chunkWords.join(' '));
      i += (this.chunkSize - this.chunkOverlap);
      
      // Ensure progress
      if (this.chunkSize - this.chunkOverlap <= 0) {
        i += this.chunkSize;
      }
    }
    
    return chunks;
  }

  splitDocuments(documents: Document[]): Chunk[] {
    const chunks: Chunk[] = [];
    
    for (const doc of documents) {
      const textChunks = this.splitText(doc.content);
      
      for (let i = 0; i < textChunks.length; i++) {
        chunks.push({
          content: textChunks[i],
          metadata: {
            ...doc.metadata,
            chunk_index: i
          }
        });
      }
    }
    
    return chunks;
  }
}

export const textSplitter = new TextSplitter();
export default textSplitter;
