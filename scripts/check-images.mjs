import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/data';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('-config.ts'));
const urls = new Map();

for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const m of text.matchAll(/https:\/\/images\.unsplash\.com\/[^'"\s]+/g)) {
    if (!urls.has(m[0])) urls.set(m[0], []);
    urls.get(m[0]).push(f);
  }
}

console.log(`checking ${urls.size} unsplash urls\n`);
let bad = 0;

await Promise.all(
  [...urls.entries()].map(async ([url, owners]) => {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok) {
        bad++;
        console.log(`${res.status}  ${owners.join(', ')}  ${url}`);
      }
    } catch (err) {
      bad++;
      console.log(`ERR  ${owners.join(', ')}  ${url}  ${err.message}`);
    }
  }),
);

console.log(`\n${bad} broken of ${urls.size}`);
