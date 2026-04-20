import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let almaContent: string | undefined;

export function loadAlmaContent(): string {
  if (!almaContent) {
    const txtPath = resolve(new URL('.', import.meta.url).pathname, 'alma-content.txt');
    almaContent = readFileSync(txtPath, 'utf8');
  }
  return almaContent;
}
