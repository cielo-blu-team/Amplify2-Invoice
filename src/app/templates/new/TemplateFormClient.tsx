'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTemplate } from '@/actions/template';
import type { TemplateLineItem, CreateTemplateInput } from '@/types/template';

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'estimate', label: '見積書' },
  { value: 'invoice', label: '請求書' },
  { value: 'both', label: '両方' },
];

const TAX_RATE_OPTIONS = [
  { value: '10', label: '10%' },
  { value: '8', label: '8%（軽減）' },
  { value: '0', label: '非課税' },
];

const DEFAULT_LINE_ITEM: TemplateLineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxRate: 10,
  unit: '',
};

export default function TemplateFormClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [documentType, setDocumentType] = useState<'estimate' | 'invoice' | 'both'>('estimate');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<TemplateLineItem[]>([{ ...DEFAULT_LINE_ITEM }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { ...DEFAULT_LINE_ITEM }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof TemplateLineItem, value: unknown) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'テンプレート名は必須です';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const input: CreateTemplateInput = {
        name: name.trim(),
        documentType,
        ...(subject.trim() ? { subject: subject.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        lineItems,
      };
      const result = await createTemplate(input);
      if (result.success) {
        router.push('/templates');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">テンプレート作成</h1>

        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">
                テンプレート名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="例: Webサイト制作 標準見積"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="documentType">種別</Label>
              <Select
                value={documentType}
                onValueChange={(v) => setDocumentType(v as 'estimate' | 'invoice' | 'both')}
              >
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="subject">件名</Label>
              <Input
                id="subject"
                placeholder="例: Webサイト制作のご見積"
                value={subject}
                onChange={(e) => setSubject(e.currentTarget.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                placeholder="テンプレートに含める備考・注意事項"
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>明細行</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">内容</TableHead>
                    <TableHead className="w-20">単位</TableHead>
                    <TableHead className="w-24">数量</TableHead>
                    <TableHead className="w-36">単価</TableHead>
                    <TableHead className="w-32">税率</TableHead>
                    <TableHead className="w-16">削除</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          placeholder="サービス名・品目"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.currentTarget.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="式"
                          value={item.unit ?? ''}
                          onChange={(e) => updateLineItem(index, 'unit', e.currentTarget.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', Number(e.currentTarget.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.currentTarget.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(item.taxRate)}
                          onValueChange={(v) => updateLineItem(index, 'taxRate', Number(v) as 10 | 8 | 0)}
                        >
                          <SelectTrigger>
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
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" onClick={addLineItem} className="w-fit">
              <Plus className="mr-2 h-4 w-4" />
              明細行を追加
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : 'テンプレートを作成'}
          </Button>
          <Button variant="outline" onClick={() => router.push('/templates')} disabled={loading}>
            キャンセル
          </Button>
        </div>
    </div>
  );
}
