import { describe, it, expect } from 'vitest';
import { calculateTax } from '@/lib/tax-calculator';
import type { LineItemInput } from '@/types/document';

describe('calculateTax', () => {
  describe('正常系', () => {
    it('10%のみの明細行: 各金額が正確に計算される', () => {
      const items: LineItemInput[] = [
        { itemName: '商品A', quantity: 2, unit: '個', unitPrice: 1000, taxRate: 10 },
      ];
      const result = calculateTax(items);
      expect(result.tax10Subtotal).toBe(2000);
      expect(result.tax10Amount).toBe(200);
      expect(result.tax8Subtotal).toBe(0);
      expect(result.tax8Amount).toBe(0);
      expect(result.taxExemptSubtotal).toBe(0);
      expect(result.subtotal).toBe(2000);
      expect(result.taxAmount).toBe(200);
      expect(result.totalAmount).toBe(2200);
    });

    it('8%のみの明細行（軽減税率）: 正確に計算される', () => {
      const items: LineItemInput[] = [
        { itemName: '食料品', quantity: 3, unit: '個', unitPrice: 500, taxRate: 8 },
      ];
      const result = calculateTax(items);
      expect(result.tax8Subtotal).toBe(1500);
      expect(result.tax8Amount).toBe(120);
      expect(result.tax10Subtotal).toBe(0);
      expect(result.tax10Amount).toBe(0);
      expect(result.taxExemptSubtotal).toBe(0);
      expect(result.subtotal).toBe(1500);
      expect(result.taxAmount).toBe(120);
      expect(result.totalAmount).toBe(1620);
    });

    it('非課税のみの明細行: taxAmount = 0', () => {
      const items: LineItemInput[] = [
        { itemName: '非課税商品', quantity: 1, unit: '式', unitPrice: 5000, taxRate: 0 },
      ];
      const result = calculateTax(items);
      expect(result.taxExemptSubtotal).toBe(5000);
      expect(result.tax10Subtotal).toBe(0);
      expect(result.tax10Amount).toBe(0);
      expect(result.tax8Subtotal).toBe(0);
      expect(result.tax8Amount).toBe(0);
      expect(result.subtotal).toBe(5000);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(5000);
    });

    it('10% + 8% 混在: 税率区分ごとに正確に計算される', () => {
      const items: LineItemInput[] = [
        { itemName: '標準税率商品', quantity: 1, unit: '個', unitPrice: 2000, taxRate: 10 },
        { itemName: '軽減税率商品', quantity: 2, unit: '個', unitPrice: 600, taxRate: 8 },
      ];
      const result = calculateTax(items);
      expect(result.tax10Subtotal).toBe(2000);
      expect(result.tax10Amount).toBe(200);
      expect(result.tax8Subtotal).toBe(1200);
      expect(result.tax8Amount).toBe(96);
      expect(result.taxExemptSubtotal).toBe(0);
      expect(result.subtotal).toBe(3200);
      expect(result.taxAmount).toBe(296);
      expect(result.totalAmount).toBe(3496);
    });

    it('10% + 8% + 非課税の3種混在: 全項目正確に計算される', () => {
      const items: LineItemInput[] = [
        { itemName: '標準税率商品', quantity: 1, unit: '個', unitPrice: 1000, taxRate: 10 },
        { itemName: '軽減税率商品', quantity: 1, unit: '個', unitPrice: 500, taxRate: 8 },
        { itemName: '非課税商品', quantity: 1, unit: '式', unitPrice: 300, taxRate: 0 },
      ];
      const result = calculateTax(items);
      expect(result.tax10Subtotal).toBe(1000);
      expect(result.tax10Amount).toBe(100);
      expect(result.tax8Subtotal).toBe(500);
      expect(result.tax8Amount).toBe(40);
      expect(result.taxExemptSubtotal).toBe(300);
      expect(result.subtotal).toBe(1800);
      expect(result.taxAmount).toBe(140);
      expect(result.totalAmount).toBe(1940);
    });

    it('切り捨て確認: subtotal=1000, taxRate=10 → taxAmount = 100', () => {
      const items: LineItemInput[] = [
        { itemName: '商品', quantity: 1, unit: '個', unitPrice: 1000, taxRate: 10 },
      ];
      const result = calculateTax(items);
      expect(result.tax10Amount).toBe(Math.floor(1000 * 10 / 100));
      expect(result.tax10Amount).toBe(100);
    });

    it('小数点が出る金額でも切り捨て: subtotal=333, taxRate=10 → taxAmount = 33', () => {
      const items: LineItemInput[] = [
        { itemName: '商品', quantity: 1, unit: '個', unitPrice: 333, taxRate: 10 },
      ];
      const result = calculateTax(items);
      // 333 * 10 / 100 = 33.3 → floor → 33
      expect(result.tax10Amount).toBe(33);
    });

    it('明細行が0件: totalAmount = 0', () => {
      const items: LineItemInput[] = [];
      const result = calculateTax(items);
      expect(result.subtotal).toBe(0);
      expect(result.tax10Subtotal).toBe(0);
      expect(result.tax10Amount).toBe(0);
      expect(result.tax8Subtotal).toBe(0);
      expect(result.tax8Amount).toBe(0);
      expect(result.taxExemptSubtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe('計算仕様の確認: 税額は税率区分ごとの合計に対して切り捨て', () => {
    it('10%の明細行が2行（333円, 333円）→ 合計666円 → 税額 = floor(666 * 10 / 100) = 66', () => {
      const items: LineItemInput[] = [
        { itemName: '商品A', quantity: 1, unit: '個', unitPrice: 333, taxRate: 10 },
        { itemName: '商品B', quantity: 1, unit: '個', unitPrice: 333, taxRate: 10 },
      ];
      const result = calculateTax(items);
      expect(result.tax10Subtotal).toBe(666);
      // 区分合計で切り捨て: floor(666 * 10 / 100) = 66
      expect(result.tax10Amount).toBe(66);
      expect(result.taxAmount).toBe(66);
    });

    it('区分合計切り捨てと行ごと切り捨ての差異: 100円, 150円 の10%', () => {
      // 区分合計: floor(250 * 10 / 100) = 25
      // 行ごと: floor(100 * 0.1) + floor(150 * 0.1) = 10 + 15 = 25（この場合は一致）
      const items: LineItemInput[] = [
        { itemName: '商品A', quantity: 1, unit: '個', unitPrice: 100, taxRate: 10 },
        { itemName: '商品B', quantity: 1, unit: '個', unitPrice: 150, taxRate: 10 },
      ];
      const result = calculateTax(items);
      expect(result.tax10Subtotal).toBe(250);
      expect(result.tax10Amount).toBe(Math.floor(250 * 10 / 100));
      expect(result.tax10Amount).toBe(25);
    });

    it('8%の明細行が2行（100円, 105円）→ 合計205円 → 税額 = floor(205 * 8 / 100) = 16', () => {
      const items: LineItemInput[] = [
        { itemName: '食品A', quantity: 1, unit: '個', unitPrice: 100, taxRate: 8 },
        { itemName: '食品B', quantity: 1, unit: '個', unitPrice: 105, taxRate: 8 },
      ];
      const result = calculateTax(items);
      expect(result.tax8Subtotal).toBe(205);
      // floor(205 * 8 / 100) = floor(16.4) = 16
      expect(result.tax8Amount).toBe(16);
    });
  });
});
