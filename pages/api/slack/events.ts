import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatGPTResponse } from '../../../utils/openai';
import { sendSlackMessage } from '../../../utils/slack';
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
  // すべてのリクエストに対して即座に200を返す
  res.status(200).json({ ok: true });

  // 以降は非同期でログを記録
  try {
    await logDebug({
      type: 'raw_request',
      timestamp: new Date(),
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'],
        'x-slack-signature': req.headers['x-slack-signature'],
        'x-slack-request-timestamp': req.headers['x-slack-request-timestamp']
      },
      body: JSON.stringify(req.body, null, 2)
    });

    // イベントの種類を確認
    const payload = req.body;
    if (payload.type === 'event_callback') {
      await logDebug({
        type: 'event_details',
        event_type: payload.event?.type,
        channel_type: payload.event?.channel_type,
        text: payload.event?.text
      });
    }
  } catch (error) {
    await logDebug({
      type: 'error',
      error: error.message,
      stack: error.stack
    });
  }
} 