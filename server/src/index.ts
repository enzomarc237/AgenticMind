import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

import { runAgenticPattern } from './geminiService';
import { AgenticPattern, AllPatternSettings, GlobalSettings, LogEntry } from './types';
import fs from 'fs/promises';
import path from 'path';

const conversationsPath = path.join(__dirname, '../data/conversations.json');

const readConversations = async () => {
  try {
    const data = await fs.readFile(conversationsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeConversations = async (data: any) => {
  await fs.writeFile(conversationsPath, JSON.stringify(data, null, 2));
};

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.get('/api/conversations', async (req, res) => {
  const conversations = await readConversations();
  res.json(conversations);
});

app.get('/api/conversations/:id', async (req, res) => {
  const conversations = await readConversations();
  const conversation = conversations.find((c: any) => c.id === req.params.id);
  if (conversation) {
    res.json(conversation);
  } else {
    res.status(404).send('Conversation not found');
  }
});

app.get('/api/run-pattern', async (req, res) => {
  const payload = JSON.parse(decodeURIComponent(req.query.payload as string));
  const { pattern, prompt, globalSettings, patternSettings } = payload as {
    pattern: AgenticPattern;
    prompt: string;
    globalSettings: GlobalSettings;
    patternSettings: AllPatternSettings;
  };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const conversationId = Date.now().toString();
  const logEntries: LogEntry[] = [];

  const streamCallback = (entry: LogEntry) => {
    logEntries.push(entry);
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };

  try {
    await runAgenticPattern(pattern, prompt, streamCallback, globalSettings, patternSettings);

    const conversations = await readConversations();
    const newConversation = {
      id: conversationId,
      createdAt: new Date().toISOString(),
      pattern,
      prompt,
      logEntries,
    };
    conversations.push(newConversation);
    await writeConversations(conversations);

  } catch (error) {
    console.error(error);
    streamCallback({
      id: 'error',
      type: 'error',
      content: 'An error occurred on the server.',
    });
  } finally {
    res.end();
  }
});


app.listen(port, () => {
  console.log(`[dotenv@17.2.2] injecting env (0) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar`);
  console.log(`Server is running on port ${port}`);
});
