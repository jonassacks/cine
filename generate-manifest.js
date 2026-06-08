#!/usr/bin/env node
/**
 * generate-manifest.js
 * Scans the clips/ folder and writes clips.json.
 * Run this whenever you add or remove video files:
 *   node generate-manifest.js
 */

const fs   = require('fs');
const path = require('path');

const CLIPS_DIR  = path.join(__dirname, 'clips');
const OUTPUT     = path.join(__dirname, 'clips.json');
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);

if (!fs.existsSync(CLIPS_DIR)) {
  fs.mkdirSync(CLIPS_DIR);
  console.log('Created clips/ folder.');
}

const clips = fs.readdirSync(CLIPS_DIR)
  .filter(f => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
  .sort();

fs.writeFileSync(OUTPUT, JSON.stringify(clips, null, 2) + '\n');

console.log(`clips.json updated — ${clips.length} clip(s):`);
if (clips.length > 0) {
  clips.forEach(c => console.log('  ' + c));
} else {
  console.log('  (none yet — add video files to clips/ and run this again)');
}
