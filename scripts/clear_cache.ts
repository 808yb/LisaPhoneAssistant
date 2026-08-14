import fs from 'fs';
import path from 'path';

const AUDIO_CACHE_DIR = path.join(process.cwd(), 'audio_cache');

if (fs.existsSync(AUDIO_CACHE_DIR)) {
  const files = fs.readdirSync(AUDIO_CACHE_DIR);
  let deletedCount = 0;
  
  for (const file of files) {
    if (file.endsWith('.mp3')) {
      fs.unlinkSync(path.join(AUDIO_CACHE_DIR, file));
      deletedCount++;
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} audio files from ${AUDIO_CACHE_DIR}`);
} else {
  console.log(`Directory ${AUDIO_CACHE_DIR} does not exist. Nothing to clear.`);
}
