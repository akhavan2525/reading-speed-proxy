#!/usr/bin/env node
// Builds the voice lines of «نبرد مدادی» with AvalAI text-to-speech and
// embeds them in the game file, so the game plays them with no API key.
//
// Usage:
//   AVALAI_API_KEY=sk-... node make-voices.js [game.html] [out.html]
// Optional env: AVALAI_BASE (default https://api.avalai.ir/v1),
//               AVALAI_MODEL (default gpt-4o-mini-tts), AVALAI_VOICE (default onyx)

const fs = require('fs');
const path = require('path');

const key = process.env.AVALAI_API_KEY;
const base = (process.env.AVALAI_BASE || 'https://api.avalai.ir/v1').replace(/\/+$/, '');
const model = process.env.AVALAI_MODEL || 'gpt-4o-mini-tts';
const voice = process.env.AVALAI_VOICE || 'onyx';
const inFile = process.argv[2] || path.join(__dirname, 'game.html');
const outFile = process.argv[3] || path.join(__dirname, 'game-with-voices.html');
const mp3Dir = path.join(__dirname, 'voices');

if (!key) {
  console.error('AVALAI_API_KEY is not set.');
  process.exit(1);
}

const html = fs.readFileSync(inFile, 'utf8');

// Read the voice lines straight from the game, so they always match it.
const m = html.match(/const VLINES=(\[.*?\]\]);/);
if (!m) {
  console.error('Could not find VLINES in ' + inFile);
  process.exit(1);
}
const lines = JSON.parse(m[1].replace(/'/g, '"')); // [[key, label, text], ...]

// Same style prompt the game uses.
const instructions =
  'Speak in Persian (Farsi) like an exaggerated, cheesy, confident action-movie hero: loud, punchy, a bit funny.';

async function tts(text) {
  const body = { model, input: text, voice, response_format: 'mp3' };
  if (/gpt-4o/.test(model)) body.instructions = instructions;
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(base + '/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (attempt >= 3) throw e;
      console.log('  retrying (' + e.message + ')');
      await new Promise((res) => setTimeout(res, 2000 * attempt));
    }
  }
}

(async () => {
  fs.mkdirSync(mp3Dir, { recursive: true });
  const urls = {};
  for (const [k, label, text] of lines) {
    console.log(`${label} (${k}): ${text}`);
    const mp3 = await tts(text);
    fs.writeFileSync(path.join(mp3Dir, k + '.mp3'), mp3);
    urls[k] = 'data:audio/mpeg;base64,' + mp3.toString('base64');
  }

  // The game's speak() plays VO.urls[k] when present, so fill it right after VO is defined.
  const anchor = /(const VO=\{cfg:.*?audio:null\};)/;
  if (!anchor.test(html)) {
    console.error('Could not find the VO object in ' + inFile);
    process.exit(1);
  }
  const out = html.replace(anchor, `$1\nObject.assign(VO.urls,${JSON.stringify(urls)});`);
  fs.writeFileSync(outFile, out);
  console.log(`\nDone: ${lines.length} voices -> ${mp3Dir}\nGame with voices -> ${outFile}`);
})().catch((e) => {
  console.error('Failed: ' + e.message);
  process.exit(1);
});
