'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateTax } from '@/lib/tax-calculator';
import ClientSelect from './ClientSelect';
import LineItemTable, { type LineItemFormData } from './LineItemTable';
import TaxSummary from './TaxSummary';

export interface DocumentFormData {
  clientId: string;
  clientName: string;
  subject: string;
  issueDate: string;
  validUntil?: string; // 見積書のみ
  dueDate?: string; // 請求書のみ
  notes?: string;
  items: LineItemFormData[];
}

interface DocumentFormProps {
  documentType: 'estimate' | 'invoice';
  initialData?: Partial<DocumentFormData>;
  onSubmit: (data: DocumentFormData) => Promise<void>;
  loading?: boolean;
  title?: string;
}

const DEFAULT_ITEM: LineItemFormData = {
  itemName: '',
  quantity: 1,
  unit: '式',
  unitPrice: 0,
  taxRate: 10,
};

function validate(data: {
  clientId: string;
  subject: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  items: LineItemFormData[];
  documentType: 'estimate' | 'invoice';
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.clientId) errors.clientId = '取引先を選択してください';
  if (!data.subject.trim()) errors.subject = '件名を入力してください';
  if (!data.issueDate) errors.issueDate = '発行日を入力してください';
  if (data.documentType === 'estimate' && !data.validUntil) {
    errors.validUntil = '有効期限を入力してください';
  }
  if (data.documentType === 'invoice' && !data.dueDate) {
    errors.dueDate = '支払期限を入力してください';
  }
  if (data.items.length === 0) errors.items = '明細行を1行以上入力してください';
  return errors;
}

export default function DocumentForm({
  documentType,
  initialData,
  onSubmit,
  loading,
  title,
}: DocumentFormProps) {
  const [clientId, setClientId] = useState<string | null>(initialData?.clientId ?? null);
  const [clientName, setClientName] = useState(initialData?.clientName ?? '');
  const [subject, setSubject] = useState(initialData?.subject ?? '');
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ?? '');
  const [validUntil, setValidUntil] = useState(initialData?.validUntil ?? '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [items, setItems] = useState<LineItemFormData[]>(
    initialData?.items && initialData.items.length > 0 ? initialData.items : [{ ...DEFAULT_ITEM }],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const taxSummary = calculateTax(
    items.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  );

  const handleClientChange = (id: string | null, name: string) => {
    setClientId(id);
    setClientName(name);
    if (id) setErrors((prev) => ({ ...prev, clientId: '' }));
  };

  const handleSubmit = async () => {
    const validationResult = validate({
      clientId: clientId ?? '',
      subject,
      issueDate,
      validUntil: validUntil || undefined,
      dueDate: dueDate || undefined,
      items,
      documentType,
    });

    if (Object.keys(validationResult).length > 0) {
      setErrors(validationResult);
      return;
    }

    const formData: DocumentFormData = {
      clientId: clientId!,
      clientName,
      subject,
      issueDate,
      notes: notes || undefined,
      items,
    };

    if (documentType === 'estimate' && validUntil) {
      formData.validUntil = validUntil;
    }
    if (documentType === 'invoice' && dueDate) {
      formData.dueDate = dueDate;
    }

    await onSubmit(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      <h4 className="text-base font-semibold" style={{ color: '#0f0f1a' }}>
        {title ?? `${documentType === 'estimate' ? '見積書' : '請求書'}作成`}
      </h4>

      {/* 取引先選択 */}
      <ClientSelect
        value={clientId}
        onChange={handleClientChange}
        error={errors.clientId}
      />

      {/* 件名 */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="subject">
          件名 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="件名を入力してください"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (e.target.value.trim()) setErrors((prev) => ({ ...prev, subject: '' }));
          }}
          className={errors.subject ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
      </div>

      {/* 発行日 */}
      <div className="flex flex-col gap-1 max-w-[240px]">
        <Label htmlFor="issue-date">
          発行日 <span className="text-red-500">*</span>
        </Label>
        <input
          id="issue-date"
          type="date"
          value={issueDate}
          onChange={(e) => {
            setIssueDate(e.target.value);
            if (e.target.value) setErrors((prev) => ({ ...prev, issueDate: '' }));
          }}
          className="flex h-9 w-full rounded-lg px-3 py-1 text-sm transition-all focus:outline-none"
          style={{ background: '#ffffff', border: errors.issueDate ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(0,0,0,0.15)', color: '#0f0f1a' }}
        />
        {errors.issueDate && <p className="text-xs text-red-500">{errors.issueDate}</p>}
      </div>

      {/* 有効期限（見積書のみ） */}
      {documentType === 'estimate' && (
        <div className="flex flex-col gap-1 max-w-[240px]">
          <Label htmlFor="valid-until">
            有効期限 <span className="text-red-500">*</span>
          </Label>
          <input
            id="valid-until"
            type="date"
            value={validUntil}
            onChange={(e) => {
              setValidUntil(e.target.value);
              if (e.target.value) setErrors((prev) => ({ ...prev, validUntil: '' }));
            }}
            className="flex h-9 w-full rounded-lg px-3 py-1 text-sm transition-all focus:outline-none"
            style={{ background: '#ffffff', border: errors.validUntil ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(0,0,0,0.15)', color: '#0f0f1a' }}
          />
          {errors.validUntil && <p className="text-xs text-red-500">{errors.validUntil}</p>}
        </div>
      )}

      {/* 支払期限（請求書のみ） */}
      {documentType === 'invoice' && (
        <div className="flex flex-col gap-1 max-w-[240px]">
          <Label htmlFor="due-date">
            支払期限 <span className="text-red-500">*</span>
          </Label>
          <input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (e.target.value) setErrors((prev) => ({ ...prev, dueDate: '' }));
            }}
            className="flex h-9 w-full rounded-lg px-3 py-1 text-sm transition-all focus:outline-none"
            style={{ background: '#ffffff', border: errors.dueDate ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(0,0,0,0.15)', color: '#0f0f1a' }}
          />
          {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate}</p>}
        </div>
      )}

      {/* 明細行テーブル */}
      <div className="flex flex-col gap-1">
        <LineItemTable items={items} onChange={setItems} disabled={loading} />
        {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
      </div>

      {/* 税率別内訳 */}
      <TaxSummary taxSummary={taxSummary} />

      {/* 備考 */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">備考</Label>
        <Textarea
          id="notes"
          placeholder="備考があれば入力してください"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-y min-h-[72px] max-h-[200px]"
        />
      </div>

      {/* 下部アクションボタン */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleSubmit}
          disabled={loading}
          type="button"
        >
          {loading ? '保存中...' : '下書き保存'}
        </Button>
      </div>
    </div>
  );
}
