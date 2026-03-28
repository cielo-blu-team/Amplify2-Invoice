/**
 * Puppeteer stub for build environments where Chromium is not available.
 * PDF generation will fail at runtime in environments without puppeteer installed.
 */
const puppeteerStub = {
  launch: async () => {
    throw new Error('PDF generation is not available in this environment. Puppeteer requires a Chromium installation.');
  },
};

export default puppeteerStub;
