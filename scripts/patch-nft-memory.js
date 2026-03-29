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
                    // Skip heavy packages to reduce NFT trace memory (patched)
                    if (p.includes('/node_modules/@aws-sdk/') ||
                        p.includes('/node_modules/@smithy/') ||
                        p.includes('/node_modules/aws-cdk-lib/') ||
                        p.includes('/node_modules/constructs/') ||
                        p.includes('/node_modules/@aws-cdk/') ||
                        p.includes('/node_modules/vitest/') ||
                        p.includes('/node_modules/@vitest/') ||
                        p.includes('/node_modules/jsdom/') ||
                        p.includes('/node_modules/playwright/') ||
                        p.includes('/node_modules/@playwright/')) {
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
