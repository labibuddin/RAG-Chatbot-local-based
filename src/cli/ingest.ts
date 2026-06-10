import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import documentLoader from '../ingestion/loader';
import textSplitter from '../ingestion/splitter';
import embedder from '../rag/embedder';
import vectorStore from '../store/vectorStore';
import logger from '../utils/logger';

export async function ingestFile(filePath: string) {
  try {
    logger.info(`Starting ingestion process for file ${filePath}`);
    const doc = await documentLoader.loadFile(filePath);
    
    const chunks = textSplitter.splitDocuments([doc]);
    logger.info(`Split into ${chunks.length} chunks`);
    
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      logger.info(`Processing batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
      
      const texts = batch.map(c => c.content);
      const metadatas = batch.map(c => c.metadata);
      const ids = batch.map(() => uuidv4());
      
      const embeddings = await embedder.embedBatch(texts);
      await vectorStore.addDocuments(ids, embeddings, metadatas, texts);
    }
    
    logger.info(`Ingestion process completed successfully for ${filePath}`);
  } catch (error) {
    logger.error(`Error during ingestion process for ${filePath}`, error);
    throw error;
  }
}

async function ingestDocs() {
  try {
    const docsDir = path.resolve(process.cwd(), 'docs');
    logger.info(`Starting ingestion process from ${docsDir}`);
    
    // 1. Load documents
    const documents = await documentLoader.loadDirectory(docsDir);
    if (documents.length === 0) {
      logger.warn('No documents found in docs directory');
      return;
    }
    logger.info(`Loaded ${documents.length} documents`);
    
    // 2. Split into chunks
    const chunks = textSplitter.splitDocuments(documents);
    logger.info(`Split into ${chunks.length} chunks`);
    
    // Process in batches to avoid overwhelming Ollama or ChromaDB
    const batchSize = 10;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      logger.info(`Processing batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
      
      const texts = batch.map(c => c.content);
      const metadatas = batch.map(c => c.metadata);
      const ids = batch.map(() => uuidv4());
      
      // 3. Generate embeddings
      const embeddings = await embedder.embedBatch(texts);
      
      // 4. Store in Vector DB
      await vectorStore.addDocuments(ids, embeddings, metadatas, texts);
    }
    
    logger.info('Ingestion process completed successfully!');
  } catch (error) {
    logger.error('Error during ingestion process', error);
  }
}

// Run if called directly
if (require.main === module) {
  ingestDocs().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default ingestDocs;
