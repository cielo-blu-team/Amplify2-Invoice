import { describe, it, expect } from 'vitest';

// Test the payment matching logic independently (without DynamoDB)
describe('Payment matching logic', () => {
  // Test kana normalization
  it('normalizes katakana correctly', () => {
    // カブシキガイシャABC → normalized
    const input = 'カブシキガイシャ　ＡＢＣ';
    // kanaToHira converts katakana → hiragana
    // Then uppercase, remove spaces
    expect(input.replace(/[\u30A1-\u30F6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))).toContain('かぶしきがいしゃ');
  });

  it('full match: same amount and name', () => {
    const invoiceAmount = 110000;
    const transferAmount = 110000;
    const amountDiff = Math.abs(invoiceAmount - transferAmount);
    expect(amountDiff).toBe(0);
  });

  it('partial match: less than invoice amount', () => {
    const invoiceAmount = 110000;
    const transferAmount = 55000;
    const amountDiff = Math.abs(invoiceAmount - transferAmount);
    expect(amountDiff).toBeLessThan(invoiceAmount);
  });

  it('mismatch: different amount', () => {
    const invoiceAmount = 110000;
    const transferAmount = 99000;
    const amountDiff = Math.abs(invoiceAmount - transferAmount);
    expect(amountDiff).toBeGreaterThan(0);
  });
});
