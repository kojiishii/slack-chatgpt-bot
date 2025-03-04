import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatGPTResponse } from '../../utils/chatgpt';
import { sendSlackMessage } from '../../utils/slack';
import { logDebug } from './debug';

const DEBUG = true;

type SlackEvent = {
  type: string;
  text?: string;
  user?: string;
  channel?: string;
  ts?: string;
}

type SlackEventPayload = {
  token: string;
  challenge?: string;
  type: string;
  event?: SlackEvent;
  team_id?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // まず応答を返す
  res.status(200).json({ ok: true });

  try {
    const payload = req.body;
    
    // イベントコールバックの場合のみ処理
    if (payload.type === 'event_callback') {
      const event = payload.event;
      
      // app_mentionイベントの処理
      if (event.type === 'app_mention') {
        await logDebug({
          type: 'processing_mention',
          raw_text: event.text,
          user: event.user,
          channel: event.channel
        });

        // メンションを削除してテキストを抽出
        const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

        await logDebug({
          type: 'extracted_text',
          text: text
        });

        try {
          // ChatGPTからの応答を取得
          const response = await getChatGPTResponse(text);
          await logDebug({
            type: 'chatgpt_response',
            prompt: text,
            response: response
          });

          // Slackにメッセージを送信
          await sendSlackMessage(event.channel, response);
          await logDebug({
            type: 'slack_message_sent',
            channel: event.channel,
            text: response
          });
        } catch (err) {
          const error = err as Error;
          await logDebug({
            type: 'error',
            message: error.message,
            stack: error.stack
          });
        }
      }
    }
  } catch (err) {
    const error = err as Error;
    await logDebug({
      type: 'error',
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace'
    });
  }
} 