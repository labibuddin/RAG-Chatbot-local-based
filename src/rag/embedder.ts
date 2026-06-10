import config from '../utils/config';
import logger from '../utils/logger';

export class Embedder {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
    this.model = config.ollama.embeddingModel;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      logger.error('Error generating embedding', error);
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    // Process sequentially to not overload Ollama locally
    for (const text of texts) {
      const embedding = await this.embedText(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

export const embedder = new Embedder();
export default embedder;
