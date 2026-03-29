#!/usr/bin/env node
/**
 * Patches Next.js's collect-build-traces.js to add an `ignore` option to the
 * nodeFileTrace call, preventing NFT from ever stat/read/following any file
 * inside node_modules. This eliminates OOM during "Collecting build traces"
 * on memory-constrained build containers.
 *
 * Using `ignore` is more efficient than patching readFile, because ignored
 * paths are never stat()d, never read, and never added to the traversal queue.
 * The resulting .nft.json files will only list app-code files, which is fine
 * for Amplify WEB_COMPUTE since it deploys the full node_modules separately.
 */
const fs = require('fs');
const path = require('path');

const tracePath = path.resolve('./node_modules/next/dist/build/collect-build-traces.js');
let content = fs.readFileSync(tracePath, 'utf8');

// Patch 1: add `ignore` to the nodeFileTrace options to completely skip node_modules
const oldNft = `            const result = await (0, _nft.nodeFileTrace)(chunksToTrace, {
                base: outputFileTracingRoot,
                processCwd: dir,
                mixedModules: true,
                async readFile (p) {`;

const newNft = `            const result = await (0, _nft.nodeFileTrace)(chunksToTrace, {
                base: outputFileTracingRoot,
                processCwd: dir,
                mixedModules: true,
                // Skip node_modules entirely to prevent OOM (patched for Amplify WEB_COMPUTE)
                ignore: (p) => p.includes('/node_modules/'),
                async readFile (p) {`;

let patched = false;

if (content.includes(oldNft)) {
  content = content.replace(oldNft, newNft);
  patched = true;
  console.log('✓ Patch 1 applied: nodeFileTrace will ignore all node_modules paths');
} else {
  console.warn('⚠ Patch 1: could not find nodeFileTrace options block');
}

if (patched) {
  fs.writeFileSync(tracePath, content);
} else {
  console.error('✗ No patches applied — build traces may still OOM');
  process.exit(1);
}
