import type { NextApiRequest, NextApiResponse } from 'next';

// デバッグログを保存する配列
const debugLogs: any[] = [{
  timestamp: new Date().toISOString(),
  type: 'init',
  message: 'Debug logging initialized'
}];

// デバッグログを追加する関数
export function logDebug(data: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data
  };
  console.log('Debug log:', logEntry);  // コンソールにも出力
  debugLogs.unshift(logEntry);
  // 最新の100件のみ保持
  if (debugLogs.length > 100) {
    debugLogs.pop();
  }
}

// デバッグエンドポイント
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // リクエスト自体もログに記録
  logDebug({
    type: 'debug_access',
    method: req.method,
    url: req.url
  });

  res.status(200).json({
    logs: debugLogs,
    count: debugLogs.length,
    lastUpdated: new Date().toISOString()
  });
} 