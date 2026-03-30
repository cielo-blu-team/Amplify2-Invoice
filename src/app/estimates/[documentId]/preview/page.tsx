'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { showError } from '@/lib/toast';
import { generatePdfAction } from '@/actions/pdf';

interface Props {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<{ pdfUrl?: string }>;
}

export default function EstimatePreviewPage({ params, searchParams }: Props) {
  const { documentId } = use(params);
  const { pdfUrl: initialPdfUrl } = use(searchParams);
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const result = await generatePdfAction(documentId);
      if (!result.success) {
        showError(result.error?.message ?? 'PDF生成に失敗しました');
        return;
      }
      setPdfUrl(result.data!.pdfUrl);
    } catch {
      showError('PDF生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900">PDFプレビュー</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            戻る
          </Button>
          {pdfUrl ? (
            <Button asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                PDFダウンロード
              </a>
            </Button>
          ) : (
            <Button onClick={handleGeneratePdf} disabled={generating}>
              {generating ? 'PDF生成中...' : 'PDF生成'}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {pdfUrl ? (
          <div style={{ height: '80vh', width: '100%' }}>
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF プレビュー"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4" style={{ height: '80vh' }}>
            <p className="text-sm text-zinc-400">PDFがまだ生成されていません</p>
            <Button onClick={handleGeneratePdf} disabled={generating}>
              {generating ? 'PDF生成中...' : 'PDF生成'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
