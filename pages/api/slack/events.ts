import type { NextApiRequest, NextApiResponse } from 'next';
import { logDebug } from './debug';

const DEBUG = true;

type SlackEvent = {
  type: string;
  text?: string;
  user?: string;
  channel?: string;
  ts?: string;
  bot_id?: string;
  subtype?: string;
}

type SlackEventPayload = {
  token: string;
  challenge?: string;
  type: string;
  event?: SlackEvent;
  team_id?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true });

  try {
    const payload = req.body;
    
    if (payload.type === 'event_callback') {
      const event = payload.event;

      // メッセージイベントかつ、ボット自身のメッセージでない場合
      if (event.type === 'message' && !event.bot_id && !event.subtype) {
        await logDebug({
          type: 'test_response',
          text: event.text,
          channel: event.channel
        });

        // テスト用の固定応答
        const response = `テストメッセージです。あなたのメッセージ: ${event.text}`;
        
        // Slackにメッセージを送信
        const result = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
          },
          body: JSON.stringify({
            channel: event.channel,
            text: response
          })
        });

        await logDebug({
          type: 'slack_response',
          status: result.status,
          response: await result.json()
        });
      }
    }
  } catch (err) {
    const error = err as Error;
    await logDebug({
      type: 'error',
      message: error.message,
      stack: error.stack
    });
  }
} 