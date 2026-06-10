import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

export const config = {
  ollama: {
    baseUrl: getEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
    llmModel: getEnv('OLLAMA_LLM_MODEL', 'gemma4'),
    embeddingModel: getEnv('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text'),
  },
  chroma: {
    url: getEnv('CHROMA_URL', 'http://localhost:18000'),
    collectionName: getEnv('CHROMA_COLLECTION_NAME', 'knowledge_base'),
  },
  whatsapp: {
    sessionPath: getEnv('WA_SESSION_PATH', './session'),
    headless: getEnv('WA_HEADLESS', 'true') === 'true',
    adminPhone: getEnv('ADMIN_PHONE', ''),
  },
  rag: {
    topK: parseInt(getEnv('RAG_TOP_K', '5'), 10),
    chunkSize: parseInt(getEnv('RAG_CHUNK_SIZE', '500'), 10),
    chunkOverlap: parseInt(getEnv('RAG_CHUNK_OVERLAP', '50'), 10),
    similarityThreshold: parseFloat(getEnv('RAG_SIMILARITY_THRESHOLD', '0.7')),
  },
  session: {
    ttlMinutes: parseInt(getEnv('SESSION_TTL_MINUTES', '30'), 10),
    maxHistoryMessages: parseInt(getEnv('MAX_HISTORY_MESSAGES', '6'), 10),
  },
  app: {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    logLevel: getEnv('LOG_LEVEL', 'info'),
  }
};

export default config;
