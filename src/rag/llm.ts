import config from '../utils/config';
import logger from '../utils/logger';

export class LLM {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
    this.model = config.ollama.llmModel;
  }

  async generate(prompt: string): Promise<string> {
    try {
      logger.info('Generating answer with LLM...');
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            num_ctx: 8192
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama generate error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      logger.error('Error generating with LLM', error);
      throw error;
    }
  }
}

export const llm = new LLM();
export default llm;
