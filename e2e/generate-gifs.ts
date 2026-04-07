import * as fs from 'fs';
import * as path from 'path';
import { createGif } from './utils/create-gif';

async function main() {
  const screenshotDir = path.join(__dirname, 'screenshots');
  const outputDir = path.join(__dirname, '..', 'docs', 'demo-gifs');

  if (!fs.existsSync(screenshotDir)) {
    console.error('No screenshots directory found. Run "npm run test:e2e" first.');
    process.exit(1);
  }

  const pngs = fs.readdirSync(screenshotDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => path.join(screenshotDir, f));

  if (pngs.length === 0) {
    console.error('No PNG screenshots found. Run "npm run test:e2e" first.');
    process.exit(1);
  }

  console.log(`Found ${pngs.length} screenshots, generating GIF...`);
  await createGif(pngs, path.join(outputDir, 'gameplay.gif'), { delay: 800 });
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
