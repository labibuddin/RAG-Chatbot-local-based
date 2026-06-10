import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');
import logger from '../utils/logger';

export interface Document {
  content: string;
  metadata: {
    source: string;
    type: string;
  };
}

export class DocumentLoader {
  async loadFile(filePath: string): Promise<Document> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const content = await fs.promises.readFile(filePath);

      let text = '';
      if (ext === '.pdf') {
        const data = await pdfParse(content);
        text = data.text;
      } else if (ext === '.txt' || ext === '.md' || ext === '.csv') {
        text = content.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      return {
        content: text,
        metadata: {
          source: filePath,
          type: ext
        }
      };
    } catch (error) {
      logger.error(`Error loading file ${filePath}`, error);
      throw error;
    }
  }

  async loadDirectory(dirPath: string): Promise<Document[]> {
    try {
      const files = await fs.promises.readdir(dirPath);
      const docs: Document[] = [];
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.promises.stat(filePath);
        
        if (stat.isFile() && !file.startsWith('.')) {
          try {
            const doc = await this.loadFile(filePath);
            docs.push(doc);
          } catch (e) {
            logger.warn(`Skipping file ${filePath} due to load error`);
          }
        }
      }
      return docs;
    } catch (error) {
      logger.error(`Error loading directory ${dirPath}`, error);
      throw error;
    }
  }
}

export const documentLoader = new DocumentLoader();
export default documentLoader;
