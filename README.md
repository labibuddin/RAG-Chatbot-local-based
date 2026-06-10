# WhatsApp RAG Chatbot

WhatsApp RAG Chatbot with Gemma4 (via Ollama) and ChromaDB.

## Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- Ollama installed locally with Gemma4 and nomic-embed-text models pulled

## Setup Instructions

1. **Start ChromaDB Container**
   Start the ChromaDB vector store locally on port 18000 using Docker Compose.
   ```bash
   docker compose up -d
   ```

2. **Verify Ollama Models**
   Confirm Ollama is already running natively on your host machine and has the required models.
   ```bash
   ollama list
   ```
   You should see `gemma4` and `nomic-embed-text` in the output.

3. **Install Dependencies**
   Run the following command to install the necessary Node.js dependencies:
   ```bash
   npm install
   ```

4. **Environment Variables**
   Copy `.env.example` to `.env` and verify the settings.
   ```bash
   cp .env.example .env
   ```

5. **Document Ingestion**
   Place your documents (PDF, TXT, MD) into the `docs/` folder, then run the ingestion script to process them into the Vector Database.
   ```bash
   npx ts-node src/cli/ingest.ts
   ```

6. **Run the WhatsApp Bot**
   Run the application on your host machine.
   ```bash
   npx ts-node src/index.ts
   ```
   Upon starting, a QR code will be printed to the terminal. Scan it with your WhatsApp mobile app to link your device.

## Health Check
The application exposes a health check endpoint to verify ChromaDB and Ollama connections:
```bash
curl http://localhost:3000/health
```
