#!/usr/bin/env node
/**
 * Patches Next.js's collect-build-traces.js to make it a no-op.
 *
 * Background:
 *   During `pnpm exec next build --webpack`, the "Collecting build traces" phase
 *   runs nodeFileTrace over ALL webpack output chunks to build a global dependency
 *   map. On Amplify LARGE_16GB (16 GB RAM), this consistently OOMs because the
 *   webpack server chunks are huge and NFT parses every one of them.
 *
 * Why a no-op is safe:
 *   1. Per-route .nft.json files (including proxy.js.nft.json) are created
 *      DURING webpack compilation by NextTraceEntryPointsPlugin.emitAsset().
 *      They exist on disk before collectBuildTraces is ever called.
 *   2. collectBuildTraces only merges additional global server deps into those
 *      files — which adds no runtime value for Amplify WEB_COMPUTE.
 *   3. Amplify WEB_COMPUTE deploys the full node_modules directory separately;
 *      it does not rely on .nft.json completeness for module resolution.
 *
 * Result: build completes, proxy.js.nft.json exists for the proxy→middleware
 * rename, and Amplify deploys successfully.
 */
const fs = require('fs');
const path = require('path');

const tracePath = path.resolve('./node_modules/next/dist/build/collect-build-traces.js');
let content = fs.readFileSync(tracePath, 'utf8');

// Insert an early return at the top of the collectBuildTraces function body.
const oldFunctionOpen = `async function collectBuildTraces({ dir, config, distDir, edgeRuntimeRoutes, staticPages, nextBuildSpan = new _trace.Span({
    name: 'build'
}), buildTraceContext, outputFileTracingRoot }) {
    const startTime = Date.now();
    debug('starting build traces');`;

const newFunctionOpen = `async function collectBuildTraces({ dir, config, distDir, edgeRuntimeRoutes, staticPages, nextBuildSpan = new _trace.Span({
    name: 'build'
}), buildTraceContext, outputFileTracingRoot }) {
    // PATCHED: skip global NFT trace to prevent OOM on Amplify WEB_COMPUTE.
    // Per-route .nft.json files already exist from NextTraceEntryPointsPlugin.
    process.stderr.write('[patch-nft-memory] collectBuildTraces skipped (OOM prevention)\\n');
    return;
    const startTime = Date.now();
    debug('starting build traces');`;

if (content.includes(oldFunctionOpen)) {
  content = content.replace(oldFunctionOpen, newFunctionOpen);
  fs.writeFileSync(tracePath, content);
  console.log('✓ Patched collect-build-traces.js: global NFT trace will be skipped (no-op)');
} else {
  console.warn('⚠ Could not find patch target in collect-build-traces.js - skipping patch');
  process.exit(1);
}
