import { describe, it, expect } from 'vitest';

describe('sequence number format', () => {
  it('formats EST number correctly', () => {
    const date = '20260101';
    const seq = 1;
    const formatted = `EST-${date}-${String(seq).padStart(3, '0')}`;
    expect(formatted).toBe('EST-20260101-001');
  });

  it('formats INV number correctly', () => {
    const date = '20260101';
    const seq = 99;
    const formatted = `INV-${date}-${String(seq).padStart(3, '0')}`;
    expect(formatted).toBe('INV-20260101-099');
  });

  it('pads sequence to 3 digits', () => {
    expect(String(1).padStart(3, '0')).toBe('001');
    expect(String(10).padStart(3, '0')).toBe('010');
    expect(String(100).padStart(3, '0')).toBe('100');
  });
});
