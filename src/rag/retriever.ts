import vectorStore from '../store/vectorStore';
import embedder from './embedder';
import config from '../utils/config';
import logger from '../utils/logger';

export interface RetrievedDocument {
  content: string;
  metadata: any;
  distance: number;
}

export class Retriever {
  async retrieve(query: string, topK: number = config.rag.topK): Promise<RetrievedDocument[]> {
    try {
      logger.info(`Retrieving documents for query: "${query}"`);
      const queryEmbedding = await embedder.embedText(query);
      const results = await vectorStore.similaritySearch(queryEmbedding, topK);
      
      const retrievedDocs: RetrievedDocument[] = [];
      
      if (results.documents[0] && results.metadatas[0] && results.distances?.[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const distance = results.distances[0][i];
          
          // Chroma distances for cosine: smaller is more similar (typically 1 - cosine_similarity)
          // Threshold checking logic can be adjusted based on the distance metric
          // For now, we will return topK and potentially filter in the pipeline
          
          retrievedDocs.push({
            content: results.documents[0][i] as string,
            metadata: results.metadatas[0][i],
            distance: distance || 0
          });
        }
      }
      
      return retrievedDocs;
    } catch (error) {
      logger.error('Error in retrieval step', error);
      throw error;
    }
  }
}

export const retriever = new Retriever();
export default retriever;
