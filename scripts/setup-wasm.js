#!/usr/bin/env node
/**
 * VisionXYZ Setup Script
 * Copies ONNX Runtime WASM files to public/ort-wasm/ for browser use
 * Run: node scripts/setup-wasm.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../node_modules/onnxruntime-web/dist');
const dstDir = path.join(__dirname, '../public/ort-wasm');

if (!fs.existsSync(srcDir)) {
  console.error('onnxruntime-web not installed. Run: npm install');
  process.exit(1);
}

if (!fs.existsSync(dstDir)) {
  fs.mkdirSync(dstDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(
  (f) => f.endsWith('.wasm') || f.endsWith('.mjs') || f.endsWith('.js')
);

for (const file of files) {
  const src = path.join(srcDir, file);
  const dst = path.join(dstDir, file);
  fs.copyFileSync(src, dst);
  console.log(`✓ Copied ${file}`);
}

console.log(`\nONNX Runtime WASM files copied to public/ort-wasm/`);
console.log('Next: Place yolov8n.onnx in models/ for detection support');
