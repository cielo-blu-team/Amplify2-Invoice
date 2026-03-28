'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { Client, ClientCreateInput } from '@/types';

const PREFECTURE_OPTIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'end_of_month', label: '月末締め当月払い' },
  { value: 'end_of_next_month', label: '月末締め翌月払い' },
  { value: 'end_of_next_month_25', label: '25日締め翌月払い' },
  { value: 'net_30', label: '30日払い' },
  { value: 'net_60', label: '60日払い' },
  { value: 'immediate', label: '即払い' },
];

const CLOSING_DAY_OPTIONS = [
  { value: '15', label: '15日' },
  { value: '20', label: '20日' },
  { value: '25', label: '25日' },
  { value: '31', label: '月末' },
];

type FieldErrors = Partial<Record<string, string>>;

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSubmit: (data: ClientCreateInput) => Promise<void>;
  loading?: boolean;
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-zinc-700">{children}</p>;
}

export default function ClientForm({ initialData, onSubmit, loading = false }: ClientFormProps) {
  const [clientName, setClientName] = useState(initialData?.clientName ?? '');
  const [clientNameKana, setClientNameKana] = useState(initialData?.clientNameKana ?? '');
  const [businessType, setBusinessType] = useState<string>(
    initialData?.businessType ?? 'corporation'
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    initialData?.registrationNumber ?? ''
  );
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? '');
  const [prefecture, setPrefecture] = useState(initialData?.prefecture ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [building, setBuilding] = useState(initialData?.building ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [fax, setFax] = useState(initialData?.fax ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson ?? '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail ?? '');
  const [closingDay, setClosingDay] = useState<string>(
    initialData?.closingDay != null ? String(initialData.closingDay) : ''
  );
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!clientName.trim()) newErrors.clientName = '取引先名を入力してください';
    if (!businessType) newErrors.businessType = '事業者区分を選択してください';
    if (
      businessType === 'corporation' &&
      registrationNumber &&
      !/^T\d{13}$/.test(registrationNumber)
    ) {
      newErrors.registrationNumber = '登録番号はT+13桁の数字で入力してください';
    }
    if (!postalCode.trim()) newErrors.postalCode = '郵便番号を入力してください';
    else if (!/^\d{3}-?\d{4}$/.test(postalCode)) {
      newErrors.postalCode = '郵便番号の形式が正しくありません';
    }
    if (!prefecture) newErrors.prefecture = '都道府県を選択してください';
    if (!address.trim()) newErrors.address = '住所を入力してください';
    if (!phone.trim()) newErrors.phone = '電話番号を入力してください';
    else if (!/^[\d-]{10,15}$/.test(phone)) {
      newErrors.phone = '電話番号の形式が正しくありません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: ClientCreateInput = {
      clientName,
      clientNameKana: clientNameKana || undefined,
      businessType: businessType as ClientCreateInput['businessType'],
      registrationNumber:
        businessType === 'corporation' && registrationNumber
          ? registrationNumber
          : undefined,
      postalCode,
      prefecture,
      address,
      building: building || undefined,
      phone,
      fax: fax || undefined,
      email: email || undefined,
      contactPerson: contactPerson || undefined,
      contactEmail: contactEmail || undefined,
      closingDay: closingDay ? parseInt(closingDay, 10) : undefined,
      paymentTerms: paymentTerms || undefined,
      notes: notes || undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <div className="space-y-4">
        <SectionHeading>基本情報</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="取引先名" required error={errors.clientName}>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.currentTarget.value)}
              className={errors.clientName ? 'border-red-400' : ''}
            />
          </FormField>
          <FormField label="取引先名（カナ）" error={errors.clientNameKana}>
            <Input
              value={clientNameKana}
              onChange={(e) => setClientNameKana(e.currentTarget.value)}
            />
          </FormField>
          <FormField label="事業者区分" required error={errors.businessType}>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger className={errors.businessType ? 'border-red-400' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corporation">法人</SelectItem>
                <SelectItem value="individual">個人事業主</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {businessType === 'corporation' && (
            <FormField label="インボイス登録番号" error={errors.registrationNumber}>
              <Input
                placeholder="T1234567890123"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.currentTarget.value)}
                className={errors.registrationNumber ? 'border-red-400' : ''}
              />
            </FormField>
          )}
        </div>
      </div>

      <Separator />

      {/* 所在地 */}
      <div className="space-y-4">
        <SectionHeading>所在地</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="郵便番号" required error={errors.postalCode}>
            <Input
              placeholder="123-4567"
              value={postalCode}
              onChange={(e) => setPostalCode(e.currentTarget.value)}
              className={errors.postalCode ? 'border-red-400' : ''}
            />
          </FormField>
          <FormField label="都道府県" required error={errors.prefecture}>
            <Select value={prefecture} onValueChange={setPrefecture}>
              <SelectTrigger className={errors.prefecture ? 'border-red-400' : ''}>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {PREFECTURE_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <FormField label="市区町村・番地" required error={errors.address}>
          <Input
            value={address}
            onChange={(e) => setAddress(e.currentTarget.value)}
            className={errors.address ? 'border-red-400' : ''}
          />
        </FormField>
        <FormField label="建物名・部屋番号" error={errors.building}>
          <Input
            value={building}
            onChange={(e) => setBuilding(e.currentTarget.value)}
          />
        </FormField>
      </div>

      <Separator />

      {/* 連絡先 */}
      <div className="space-y-4">
        <SectionHeading>連絡先</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="電話番号" required error={errors.phone}>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
              className={errors.phone ? 'border-red-400' : ''}
            />
          </FormField>
          <FormField label="FAX番号" error={errors.fax}>
            <Input
              value={fax}
              onChange={(e) => setFax(e.currentTarget.value)}
            />
          </FormField>
          <FormField label="メールアドレス" error={errors.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>

      <Separator />

      {/* 担当者情報 */}
      <div className="space-y-4">
        <SectionHeading>担当者情報</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="担当者名" error={errors.contactPerson}>
            <Input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.currentTarget.value)}
            />
          </FormField>
          <FormField label="担当者メールアドレス" error={errors.contactEmail}>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.currentTarget.value)}
            />
          </FormField>
        </div>
      </div>

      <Separator />

      {/* 取引条件 */}
      <div className="space-y-4">
        <SectionHeading>取引条件</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="締め日" error={errors.closingDay}>
            <Select value={closingDay} onValueChange={setClosingDay}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {CLOSING_DAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="支払条件" error={errors.paymentTerms}>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>

      <Separator />

      {/* 備考 */}
      <div className="space-y-4">
        <SectionHeading>備考</SectionHeading>
        <FormField label="備考" error={errors.notes}>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />
        </FormField>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? '保存中...' : '保存する'}
      </Button>
    </form>
  );
}
