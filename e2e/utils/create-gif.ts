import GIFEncoder from 'gif-encoder-2';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

export async function createGif(
  pngPaths: string[],
  outputPath: string,
  options: { width?: number; height?: number; delay?: number } = {}
): Promise<void> {
  const { delay = 800 } = options;

  if (pngPaths.length === 0) {
    console.warn('No PNG files provided, skipping GIF creation');
    return;
  }

  // Read first image to get dimensions
  const firstPng = PNG.sync.read(fs.readFileSync(pngPaths[0]));
  const width = options.width ?? firstPng.width;
  const height = options.height ?? firstPng.height;

  const encoder = new GIFEncoder(width, height, 'neuquant');
  encoder.setDelay(delay);
  encoder.setRepeat(0); // loop forever
  encoder.setQuality(10);
  encoder.start();

  for (const pngPath of pngPaths) {
    const pngData = PNG.sync.read(fs.readFileSync(pngPath));
    encoder.addFrame(pngData.data as unknown as Buffer);
  }

  encoder.finish();

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, encoder.out.getData());
  console.log(`GIF created: ${outputPath} (${pngPaths.length} frames)`);
}
