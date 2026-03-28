// 事業者区分
export type BusinessType = 'corporation' | 'individual' | 'other';

// 取引先（Clients テーブル）
export interface Client {
  PK: string; // CLIENT#{clientId}
  SK: 'META';
  clientId: string;
  clientName: string;
  clientNameKana: string;
  businessType: BusinessType;
  registrationNumber?: string; // 適格請求書発行事業者登録番号
  postalCode?: string;
  prefecture?: string;
  address?: string;
  building?: string;
  phone?: string;
  fax?: string;
  email?: string;
  contactPerson?: string;
  contactEmail?: string;
  closingDay?: number; // 1〜31
  paymentTerms?: string; // 例: end_of_next_month
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 取引先作成入力
export interface ClientCreateInput {
  clientName: string;
  clientNameKana?: string;
  businessType: BusinessType;
  registrationNumber?: string;
  postalCode?: string;
  prefecture?: string;
  address?: string;
  building?: string;
  phone?: string;
  fax?: string;
  email?: string;
  contactPerson?: string;
  contactEmail?: string;
  closingDay?: number;
  paymentTerms?: string;
  notes?: string;
}

// 取引先一覧フィルタ
export interface ClientListFilters {
  keyword?: string;
  limit?: number;
  cursor?: string;
}
