import express from 'express';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.post('/api/generate-map', (req, res) => {
  const postcode = (req.body?.postcode || '').trim();

  if (!postcode) {
    return res.status(400).json({ error: 'A postcode is required.' });
  }

  const scriptPath = path.resolve(__dirname, '../processing/map_test.py');
  const outputPath = path.resolve(__dirname, 'public/road_maze.json');

  const pythonProcess = spawn('python3', [scriptPath, postcode, '--output', outputPath], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  pythonProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: 'Python map generation failed.',
        details: stderr || stdout || 'Unknown error.'
      });
    }

    try {
      const file = fs.readFileSync(outputPath, 'utf8');
      const mapData = JSON.parse(file);
      return res.json(mapData);
    } catch (error) {
      return res.status(500).json({
        error: 'Map JSON could not be read after generation.',
        details: error.message
      });
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`Map backend running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Continuing without restarting the backend.`);
    return;
  }

  throw error;
});
