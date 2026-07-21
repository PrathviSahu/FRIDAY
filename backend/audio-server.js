import { express } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp_audio directory exists
const tempAudioDir = path.join(__dirname, '../frontend/src/temp_audio');
if (!fs.existsSync(tempAudioDir)) {
  fs.mkdirSync(tempAudioDir, { recursive: true });
}

// Serve static files from temp_audio
app.use('/temp_audio', express.static(tempAudioDir));

app.listen(8000, () => {
  console.log('Audio server running on http://localhost:8000');
});