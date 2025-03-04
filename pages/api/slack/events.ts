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

      // すべてのイベントの詳細をログ出力
      await logDebug({
        type: 'detailed_event',
        event: event,
        payload: payload
      });

      // メッセージイベントの条件を単純化
      if (event.type === 'message' && !event.bot_id) {
        await logDebug({
          type: 'processing_message',
          text: event.text,
          user: event.user,
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

        const slackResponse = await result.json();
        await logDebug({
          type: 'slack_api_response',
          status: result.status,
          ok: slackResponse.ok,
          error: slackResponse.error,
          response: slackResponse
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