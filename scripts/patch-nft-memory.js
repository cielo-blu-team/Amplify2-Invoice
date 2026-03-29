#!/usr/bin/env node
/**
 * Patches Next.js's collect-build-traces.js to skip the global NFT traversal
 * and instead write stub .nft.json files, preventing OOM on Amplify LARGE_16GB.
 *
 * Why a no-op is safe for Amplify WEB_COMPUTE:
 *   1. Per-route .nft.json files are created DURING webpack compilation by
 *      NextTraceEntryPointsPlugin.emitAsset() and don't need updating.
 *   2. Amplify WEB_COMPUTE deploys the full node_modules directory; it does not
 *      rely on .nft.json completeness for module resolution at runtime.
 *
 * What this patch does:
 *   - Inserts an early return at the top of collectBuildTraces().
 *   - Before returning, writes stub next-server.js.nft.json and
 *     next-minimal-server.js.nft.json with empty file lists, because Amplify's
 *     handleBuildComplete adapter reads those files unconditionally.
 */
const fs = require('fs');
const path = require('path');

const tracePath = path.resolve('./node_modules/next/dist/build/collect-build-traces.js');
let content = fs.readFileSync(tracePath, 'utf8');

const oldFunctionOpen = `async function collectBuildTraces({ dir, config, distDir, edgeRuntimeRoutes, staticPages, nextBuildSpan = new _trace.Span({
    name: 'build'
}), buildTraceContext, outputFileTracingRoot }) {
    const startTime = Date.now();
    debug('starting build traces');`;

// Create stub .nft.json files then return early.
// TRACE_OUTPUT_VERSION=1 (from next/dist/shared/lib/constants.js).
const newFunctionOpen = `async function collectBuildTraces({ dir, config, distDir, edgeRuntimeRoutes, staticPages, nextBuildSpan = new _trace.Span({
    name: 'build'
}), buildTraceContext, outputFileTracingRoot }) {
    // PATCHED: skip global NFT trace to prevent OOM on Amplify WEB_COMPUTE.
    // Write stub files that handleBuildComplete / copyTracedFiles expect.
    {
        const _fsSync = require('fs');
        const emptyTrace = JSON.stringify({ version: 1, files: [] });
        _fsSync.mkdirSync(distDir, { recursive: true });
        _fsSync.writeFileSync(_path.default.join(distDir, 'next-server.js.nft.json'), emptyTrace);
        _fsSync.writeFileSync(_path.default.join(distDir, 'next-minimal-server.js.nft.json'), emptyTrace);
    }
    process.stderr.write('[patch-nft-memory] collectBuildTraces skipped; stub .nft.json written\\n');
    return;
    const startTime = Date.now();
    debug('starting build traces');`;

if (content.includes(oldFunctionOpen)) {
  content = content.replace(oldFunctionOpen, newFunctionOpen);
  fs.writeFileSync(tracePath, content);
  console.log('✓ Patched collect-build-traces.js: NFT trace skipped, stub files will be written');
} else {
  console.warn('⚠ Could not find patch target in collect-build-traces.js - skipping patch');
  process.exit(1);
}
