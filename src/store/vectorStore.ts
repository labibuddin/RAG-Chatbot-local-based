import { ChromaClient } from 'chromadb';
import config from '../utils/config';
import logger from '../utils/logger';

export class VectorStore {
  private client: ChromaClient;
  private collectionName: string;

  constructor() {
    this.client = new ChromaClient({
      path: config.chroma.url
    });
    this.collectionName = config.chroma.collectionName;
  }

  async getCollection() {
    try {
      return await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" },
        embeddingFunction: {
          generate: async (texts: string[]) => {
            return texts.map(() => []); // Dummy, since we pass embeddings manually
          }
        } as any
      });
    } catch (error) {
      logger.error('Error getting/creating Chroma collection', error);
      throw error;
    }
  }

  async addDocuments(ids: string[], embeddings: number[][], metadatas: any[], documents: string[]) {
    try {
      const collection = await this.getCollection();
      await collection.add({
        ids,
        embeddings,
        metadatas,
        documents
      });
      logger.info(`Added ${documents.length} documents to ChromaDB`);
    } catch (error) {
      logger.error('Error adding documents to ChromaDB', error);
      throw error;
    }
  }

  async similaritySearch(queryEmbedding: number[], topK: number = config.rag.topK) {
    try {
      const collection = await this.getCollection();
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
      });

      return results;
    } catch (error) {
      logger.error('Error querying ChromaDB', error);
      throw error;
    }
  }
}

export const vectorStore = new VectorStore();
export default vectorStore;
