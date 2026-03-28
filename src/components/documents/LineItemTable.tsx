'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { calculateTax } from '@/lib/tax-calculator';

export interface LineItemFormData {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: 10 | 8 | 0;
}

interface LineItemTableProps {
  items: LineItemFormData[];
  onChange: (items: LineItemFormData[]) => void;
  disabled?: boolean;
}

const TAX_RATE_OPTIONS = [
  { value: '10', label: '10%' },
  { value: '8', label: '8%（軽減）' },
  { value: '0', label: '0%（非課税）' },
];

const DEFAULT_ITEM: LineItemFormData = {
  itemName: '',
  quantity: 1,
  unit: '式',
  unitPrice: 0,
  taxRate: 10,
};

function formatCurrency(value: number): string {
  return value.toLocaleString('ja-JP');
}

const inputClass =
  'w-full rounded-md px-2 py-1 text-sm focus:outline-none disabled:cursor-not-allowed';

export default function LineItemTable({ items, onChange, disabled }: LineItemTableProps) {
  const handleAddRow = () => {
    onChange([...items, { ...DEFAULT_ITEM }]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChange = <K extends keyof LineItemFormData>(
    index: number,
    field: K,
    value: LineItemFormData[K],
  ) => {
    const updated = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(updated);
  };

  const taxSummary = calculateTax(
    items.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] min-w-[200px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', color: '#71717a' }}>
                品名
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] w-[90px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', color: '#71717a' }}>
                数量
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] w-[70px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', color: '#71717a' }}>
                単位
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] w-[130px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', color: '#71717a' }}>
                単価
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] w-[120px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', color: '#71717a' }}>
                税率
              </th>
              <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] w-[120px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', color: '#71717a' }}>
                金額
              </th>
              <th className="px-2 py-2 w-[48px]" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const amount = item.quantity * item.unitPrice;
              return (
                <tr key={index} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  {/* 品名 */}
                  <td className="px-2 py-1" style={{ borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleChange(index, 'itemName', e.currentTarget.value)}
                      disabled={disabled}
                      placeholder="品名"
                      className={inputClass}
                      style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
                    />
                  </td>
                  {/* 数量 */}
                  <td className="px-2 py-1" style={{ borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleChange(
                          index,
                          'quantity',
                          e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value),
                        )
                      }
                      disabled={disabled}
                      min={0}
                      step="any"
                      className={`${inputClass} text-right`}
                      style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
                    />
                  </td>
                  {/* 単位 */}
                  <td className="px-2 py-1" style={{ borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleChange(index, 'unit', e.currentTarget.value)}
                      disabled={disabled}
                      placeholder="単位"
                      className={inputClass}
                      style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
                    />
                  </td>
                  {/* 単価 */}
                  <td className="px-2 py-1" style={{ borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleChange(
                          index,
                          'unitPrice',
                          e.currentTarget.value === '' ? 0 : Number(e.currentTarget.value),
                        )
                      }
                      disabled={disabled}
                      min={0}
                      className={`${inputClass} text-right`}
                      style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}
                    />
                  </td>
                  {/* 税率 */}
                  <td className="px-2 py-1" style={{ borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                    <Select
                      value={String(item.taxRate)}
                      onValueChange={(val) =>
                        handleChange(
                          index,
                          'taxRate',
                          (val === '10' ? 10 : val === '8' ? 8 : 0) as 10 | 8 | 0,
                        )
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAX_RATE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  {/* 金額 */}
                  <td className="px-3 py-1 text-right" style={{ borderRight: '1px solid rgba(0,0,0,0.04)', color: '#0f0f1a' }}>
                    ¥{formatCurrency(amount)}
                  </td>
                  {/* 削除 */}
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      disabled={disabled || items.length <= 1}
                      aria-label="行を削除"
                      className="text-red-400 hover:text-red-300 disabled:cursor-not-allowed transition-colors"
                      style={{ opacity: disabled || items.length <= 1 ? 0.3 : 1 }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot style={{ background: 'rgba(0,0,0,0.01)' }}>
            <tr style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <td colSpan={5} className="px-3 py-2 text-right font-medium text-sm" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', color: '#52525e' }}>
                小計
              </td>
              <td className="px-3 py-2 text-right font-medium text-sm" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', color: '#52525e' }}>
                ¥{formatCurrency(taxSummary.subtotal)}
              </td>
              <td />
            </tr>
            <tr style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <td colSpan={5} className="px-3 py-2 text-right font-medium text-sm" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', color: '#52525e' }}>
                消費税
              </td>
              <td className="px-3 py-2 text-right font-medium text-sm" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', color: '#52525e' }}>
                ¥{formatCurrency(taxSummary.taxAmount)}
              </td>
              <td />
            </tr>
            <tr style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <td colSpan={5} className="px-3 py-2 text-right font-bold" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', color: '#0f0f1a' }}>
                合計（税込）
              </td>
              <td className="px-3 py-2 text-right font-bold" style={{ borderRight: '1px solid rgba(0,0,0,0.06)', color: '#0f0f1a' }}>
                ¥{formatCurrency(taxSummary.totalAmount)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {!disabled && (
        <div>
          <Button variant="outline" size="sm" onClick={handleAddRow} type="button">
            <Plus className="h-4 w-4 mr-1" />
            行を追加
          </Button>
        </div>
      )}
    </div>
  );
}
