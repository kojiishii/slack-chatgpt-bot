import type { NextApiRequest, NextApiResponse } from 'next';

// 最大保持するログの数
const MAX_LOGS = 100;
// ログを保存するグローバル変数（永続化はされませんが、再デプロイまでは保持）
const debugLogs: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエストの処理
  if (req.method === 'POST') {
    const log = {
      timestamp: new Date().toISOString(),
      ...req.body
    };
    
    // ログを配列の先頭に追加
    debugLogs.unshift(log);
    
    // 最大数を超えたら古いログを削除
    if (debugLogs.length > MAX_LOGS) {
      debugLogs.pop();
    }
    
    return res.status(200).json({ ok: true });
  }

  // GETリクエストの処理
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Debug Logs</title>
          <meta charset="utf-8">
          <style>
            body { font-family: monospace; padding: 20px; }
            .log { margin-bottom: 20px; border-bottom: 1px solid #ccc; }
            .timestamp { color: #666; }
            pre { background: #f5f5f5; padding: 10px; }
          </style>
        </head>
        <body>
          <h1>Debug Logs</h1>
          <p><button onclick="location.reload()">更新</button></p>
          ${debugLogs.map(log => `
            <div class="log">
              <div class="timestamp">${log.timestamp}</div>
              <pre>${JSON.stringify(log, null, 2)}</pre>
            </div>
          `).join('')}
        </body>
      </html>
    `);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 