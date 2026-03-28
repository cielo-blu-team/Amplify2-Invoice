import { describe, it, expect } from 'vitest';
import { formatDocumentNumber, formatRevisionNumber, toDateKey } from '@/lib/document-number';

describe('formatDocumentNumber', () => {
  it('見積書: EST-YYYYMMDD-NNN 形式を生成する', () => {
    const result = formatDocumentNumber('estimate', '20240115', 1);
    expect(result).toBe('EST-20240115-001');
  });

  it('請求書: INV-YYYYMMDD-NNN 形式を生成する', () => {
    const result = formatDocumentNumber('invoice', '20240115', 1);
    expect(result).toBe('INV-20240115-001');
  });

  it('連番のゼロ埋め: 1 → "001"', () => {
    const result = formatDocumentNumber('estimate', '20240115', 1);
    expect(result).toBe('EST-20240115-001');
  });

  it('連番のゼロ埋め: 10 → "010"', () => {
    const result = formatDocumentNumber('invoice', '20240115', 10);
    expect(result).toBe('INV-20240115-010');
  });

  it('連番のゼロ埋め: 999 → "999"', () => {
    const result = formatDocumentNumber('estimate', '20240115', 999);
    expect(result).toBe('EST-20240115-999');
  });
});

describe('formatRevisionNumber', () => {
  it('改訂番号のフォーマット: EST-20240115-001-R2', () => {
    const result = formatRevisionNumber('EST-20240115-001', 2);
    expect(result).toBe('EST-20240115-001-R2');
  });

  it('改訂番号 1 のフォーマット: INV-20240115-010-R1', () => {
    const result = formatRevisionNumber('INV-20240115-010', 1);
    expect(result).toBe('INV-20240115-010-R1');
  });

  it('改訂番号 10 のフォーマット', () => {
    const result = formatRevisionNumber('EST-20240115-001', 10);
    expect(result).toBe('EST-20240115-001-R10');
  });
});

describe('toDateKey', () => {
  it('ISO日付文字列を YYYYMMDD 形式に変換する', () => {
    const result = toDateKey('2024-01-15');
    expect(result).toBe('20240115');
  });

  it('ハイフンを除去してスライスする', () => {
    const result = toDateKey('2024-12-31');
    expect(result).toBe('20241231');
  });

  it('年をまたぐ日付も正しく変換する', () => {
    const result = toDateKey('2025-03-28');
    expect(result).toBe('20250328');
  });
});
