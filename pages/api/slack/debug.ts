import type { NextApiRequest, NextApiResponse } from 'next';

// デバッグログを保存する配列
const debugLogs: any[] = [];

// デバッグログを追加する関数
export async function logDebug(data: any) {
  console.log('Debug:', data);
  debugLogs.unshift({ timestamp: new Date(), ...data });
  // 最新の100件のみ保持
  if (debugLogs.length > 100) debugLogs.pop();
}

// デバッグエンドポイント
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    logs: debugLogs,
    count: debugLogs.length
  });
} 