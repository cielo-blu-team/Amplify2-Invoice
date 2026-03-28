// MoneyForward API クライアント（スタブ実装）
// 実装: https://docs.moneyforward.com/api/
export interface MoneyForwardTransfer {
  id: string;
  amount: number;
  remitterName: string;
  date: string;
  bankAccount: string;
}

class MoneyForwardClient {
  private apiKey = process.env.MONEYFORWARD_API_KEY ?? '';
  private baseUrl = 'https://api.moneyforward.com/api/v1';

  async getTransfers(fromDate: string, toDate: string): Promise<MoneyForwardTransfer[]> {
    if (!this.apiKey) {
      console.warn('[MoneyForward] API KEY未設定 - モックデータ返却');
      return this.getMockTransfers();
    }
    const res = await fetch(
      `${this.baseUrl}/bank_account_histories?from_date=${fromDate}&to_date=${toDate}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );
    if (!res.ok) throw new Error(`MoneyForward API error: ${res.statusText}`);
    const data = await res.json();
    return data.bank_account_histories ?? [];
  }

  private getMockTransfers(): MoneyForwardTransfer[] {
    return [
      {
        id: 'TXN-001',
        amount: 110000,
        remitterName: 'カブシキガイシャテスト',
        date: new Date().toISOString().split('T')[0],
        bankAccount: '三菱UFJ銀行',
      },
    ];
  }
}

export const moneyForwardClient = new MoneyForwardClient();
