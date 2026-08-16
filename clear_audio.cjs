const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.cwd(), 'audio_cache');
if (fs.existsSync(cacheDir)) {
  const files = fs.readdirSync(cacheDir);
  for (const file of files) {
    fs.unlinkSync(path.join(cacheDir, file));
  }
  console.log(`Leerte ${files.length} Dateien aus dem audio_cache.`);
} else {
  console.log('audio_cache existiert nicht.');
}
