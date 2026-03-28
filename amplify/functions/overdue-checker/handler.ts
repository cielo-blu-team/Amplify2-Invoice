// EventBridge 毎日チェック
export const handler = async () => {
  console.log('[OverdueChecker] Starting overdue check');
  // TODO: DynamoDB GSIでdueDate < today && status = 'sent'のinvoiceを取得
  // await documentRepository.updateStatus(doc.documentId, 'overdue');
  // await notificationService.notifyOverdue(...)
  return { statusCode: 200 };
};
