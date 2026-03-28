'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { updateCompanySettings } from '@/actions/settings';
import { showError, showSuccess } from '@/lib/toast';
import type { CompanySettings } from '@/types';

interface Props {
  initialData: CompanySettings | null;
}

type FieldErrors = Partial<Record<keyof CompanySettings, string>>;

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
      <label className="text-sm font-medium" style={{ color: '#374151' }}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CompanySettingsForm({ initialData }: Props) {
  const [companyName, setCompanyName] = useState(initialData?.companyName ?? '');
  const [representativeName, setRepresentativeName] = useState(
    initialData?.representativeName ?? ''
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    initialData?.registrationNumber ?? ''
  );
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [fax, setFax] = useState(initialData?.fax ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [bankName, setBankName] = useState(initialData?.bankName ?? '');
  const [branchName, setBranchName] = useState(initialData?.branchName ?? '');
  const [accountType, setAccountType] = useState<'ordinary' | 'current'>(
    initialData?.accountType ?? 'ordinary'
  );
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber ?? '');
  const [accountHolder, setAccountHolder] = useState(initialData?.accountHolder ?? '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl ?? '');
  const [sealUrl, setSealUrl] = useState(initialData?.sealUrl ?? '');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const input: CompanySettings = {
      companyName,
      representativeName,
      registrationNumber,
      postalCode,
      address,
      phone,
      fax: fax || undefined,
      email,
      bankName,
      branchName,
      accountType,
      accountNumber,
      accountHolder,
      logoUrl: logoUrl || undefined,
      sealUrl: sealUrl || undefined,
    };

    try {
      const result = await updateCompanySettings(input);

      if (!result.success) {
        if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
          setErrors(result.error.details as FieldErrors);
        }
        showError(result.error.message);
      } else {
        showSuccess('自社情報を保存しました');
      }
    } catch {
      showError('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 基本情報 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="会社名" required error={errors.companyName}>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.currentTarget.value)}
                  className={errors.companyName ? 'border-red-400' : ''}
                />
              </FormField>
              <FormField label="代表者名" required error={errors.representativeName}>
                <Input
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.currentTarget.value)}
                  className={errors.representativeName ? 'border-red-400' : ''}
                />
              </FormField>
              <FormField label="インボイス登録番号" required error={errors.registrationNumber}>
                <Input
                  placeholder="T1234567890123"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.currentTarget.value)}
                  className={errors.registrationNumber ? 'border-red-400' : ''}
                />
              </FormField>
            </div>

            <Separator />

            <p className="text-sm font-medium" style={{ color: '#71717a' }}>所在地</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="郵便番号" required error={errors.postalCode}>
                <Input
                  placeholder="123-4567"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.currentTarget.value)}
                  className={errors.postalCode ? 'border-red-400' : ''}
                />
              </FormField>
            </div>
            <FormField label="住所" required error={errors.address}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
                className={errors.address ? 'border-red-400' : ''}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* 連絡先 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">連絡先</CardTitle>
          </CardHeader>
          <CardContent>
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
              <FormField label="メールアドレス" required error={errors.email}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className={errors.email ? 'border-red-400' : ''}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 銀行振込先 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">銀行振込先</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="銀行名" required error={errors.bankName}>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.currentTarget.value)}
                  className={errors.bankName ? 'border-red-400' : ''}
                />
              </FormField>
              <FormField label="支店名" required error={errors.branchName}>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.currentTarget.value)}
                  className={errors.branchName ? 'border-red-400' : ''}
                />
              </FormField>
              <FormField label="口座種別" required error={errors.accountType}>
                <Select
                  value={accountType}
                  onValueChange={(v) => setAccountType(v as 'ordinary' | 'current')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinary">普通</SelectItem>
                    <SelectItem value="current">当座</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="口座番号" required error={errors.accountNumber}>
                <Input
                  placeholder="1234567"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.currentTarget.value)}
                  className={errors.accountNumber ? 'border-red-400' : ''}
                />
              </FormField>
              <FormField label="口座名義" required error={errors.accountHolder}>
                <Input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.currentTarget.value)}
                  className={errors.accountHolder ? 'border-red-400' : ''}
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* ロゴ・印影 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">ロゴ・印影</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs" style={{ color: '#71717a' }}>
              ※ 画像アップロード機能は後日対応予定です。URLを直接入力してください。
            </p>
            <FormField label="ロゴ画像URL" error={errors.logoUrl}>
              <Input
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.currentTarget.value)}
              />
            </FormField>
            <FormField label="印影画像URL" error={errors.sealUrl}>
              <Input
                placeholder="https://example.com/seal.png"
                value={sealUrl}
                onChange={(e) => setSealUrl(e.currentTarget.value)}
              />
            </FormField>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : '保存する'}
        </Button>
      </form>
    </div>
  );
}
