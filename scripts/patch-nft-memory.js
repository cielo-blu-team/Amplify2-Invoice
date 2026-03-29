#!/usr/bin/env node
/**
 * Patches Next.js's collect-build-traces.js to skip reading heavy packages
 * during NFT (node file trace) traversal, reducing memory usage on low-RAM
 * build containers. The skipped packages are already excluded from the trace
 * output via outputFileTracingExcludes in next.config.ts.
 */
const fs = require('fs');
const path = require('path');

const tracePath = path.resolve('./node_modules/next/dist/build/collect-build-traces.js');
let content = fs.readFileSync(tracePath, 'utf8');

const SKIP_PATTERN = `
                    // Skip all node_modules to prevent OOM during NFT trace (patched).
                    // Amplify WEB_COMPUTE deploys the full node_modules directory, so
                    // an incomplete trace does not affect runtime availability of packages.
                    if (p.includes('/node_modules/')) {
                      return '';
                    }`;

const oldCode = `                async readFile (p) {
                    try {
                        return await _promises.default.readFile(p, 'utf8');`;

const newCode = `                async readFile (p) {
                    try {${SKIP_PATTERN}
                        return await _promises.default.readFile(p, 'utf8');`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(tracePath, content);
  console.log('✓ Patched collect-build-traces.js: heavy packages will be skipped during NFT traversal');
} else {
  console.warn('⚠ Could not find patch target in collect-build-traces.js - skipping patch');
}
