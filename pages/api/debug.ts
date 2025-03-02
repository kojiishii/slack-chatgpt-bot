import type { NextApiRequest, NextApiResponse } from 'next';

// デバッグ情報を保存する配列
let debugLogs: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // デバッグログを追加
    debugLogs.push({
      timestamp: new Date().toISOString(),
      data: req.body
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    // 最新のログを返す
    return res.status(200).json(debugLogs.slice(-10));
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 